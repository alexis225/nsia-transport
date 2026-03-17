<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
        $this->configureAuthentication(); // ← US-001
    }

    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister'      => Features::enabled(Features::registration()),
            'status'           => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));
        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));
        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(
                Str::lower($request->input(Fortify::username())) . '|' . $request->ip()
            );
            return Limit::perMinute(5)->by($throttleKey);
        });
    }

    // ── US-001 : Authentification personnalisée ───────────────
    private function configureAuthentication(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            $user = User::where('email', $request->email)->first();

            if (! $user) {
                $this->auditLog($request, null, 'login_failed', ['email' => $request->email]);
                return null;
            }

            // Compte désactivé
            if (! $user->is_active) {
                $this->auditLog($request, $user->id, 'login_blocked');
                return null;
            }

            // Compte verrouillé temporairement
            if ($user->locked_until && $user->locked_until->isFuture()) {
                $this->auditLog($request, $user->id, 'login_locked');
                return null;
            }

            // Mauvais mot de passe
            if (! Hash::check($request->password, $user->password)) {
                $user->increment('failed_login_attempts');

                if ($user->failed_login_attempts >= 5) {
                    $user->update(['locked_until' => now()->addMinutes(10)]);
                }

                $this->auditLog($request, $user->id, 'login_failed', [
                    'attempts' => $user->failed_login_attempts,
                ]);

                return null;
            }

            // ── Succès ────────────────────────────────────────
            $user->update([
                'failed_login_attempts' => 0,
                'locked_until'          => null,
                'last_login_at'         => now(),
                'last_login_ip'         => $request->ip(),
            ]);

            $this->auditLog($request, $user->id, 'login_success');

            return $user;
        });
    }

    private function auditLog(
        Request $request,
        ?string $userId,
        string  $action,
        array   $metadata = [],
    ): void {
        AuditLog::create([
            'tenant_id'      => null,
            'user_id'        => $userId,
            'action'         => $action,
            'auditable_type' => 'auth',
            'auditable_id'   => $userId ?? 'anonymous',
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
            'new_data'       => $metadata ?: null,
        ]);
    }
}