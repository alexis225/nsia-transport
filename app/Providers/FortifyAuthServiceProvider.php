<?php

namespace App\Providers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;

/**
 * ============================================================
 * FortifyAuthServiceProvider — US-001
 * ============================================================
 * Fortify gère déjà :
 *   - POST /login (email + password)
 *   - POST /logout
 *   - Brute-force via RateLimiter (configurable ici)
 *   - Redirect après login / logout
 *   - Page /login via Fortify::loginView()
 *
 * Ce provider branche notre logique NSIA sur les hooks Fortify :
 *   - Vue Inertia personnalisée
 *   - Audit log sur login réussi / échoué
 *   - Lockout en base (locked_until, failed_login_attempts)
 *   - Rate limiting : 5 tentatives / 10 min
 * ============================================================
 * Enregistrer dans bootstrap/providers.php :
 *   App\Providers\FortifyAuthServiceProvider::class,
 * ============================================================
 */
class FortifyAuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // ── 1. Vue login Inertia ─────────────────────────────
        Fortify::loginView(fn () => inertia('Auth/Login', [
            'status' => session('status'),
        ]));

        // ── 2. Authentification personnalisée ────────────────
        // Remplace la logique Fortify par défaut pour ajouter :
        //   - Vérification locked_until
        //   - Vérification is_active
        //   - Mise à jour last_login_at / failed_login_attempts
        //   - Audit log
        Fortify::authenticateUsing(function (Request $request) {
            $user = User::where('email', $request->email)->first();

            if (! $user) {
                $this->auditLog($request, null, 'login_failed', ['email' => $request->email]);
                return null; // Fortify gère le message d'erreur
            }

            // Compte désactivé
            if (! $user->is_active) {
                $this->auditLog($request, $user->id, 'login_blocked');
                // Fortify retourne null → ValidationException générique
                // Pour un message spécifique, on utilise withErrors via session
                session()->flash('login_error', __('auth.blocked'));
                return null;
            }

            // Compte verrouillé temporairement
            if ($user->isLocked()) {
                $this->auditLog($request, $user->id, 'login_locked');
                session()->flash('login_error', __('auth.locked', [
                    'minutes' => $user->locked_until->diffInMinutes(now()),
                ]));
                return null;
            }

            // Vérification mot de passe
            if (! \Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
                $user->increment('failed_login_attempts');

                if ($user->failed_login_attempts >= 5) {
                    $user->update(['locked_until' => now()->addMinutes(10)]);
                }

                $this->auditLog($request, $user->id, 'login_failed', [
                    'attempts' => $user->failed_login_attempts,
                ]);

                return null;
            }

            // ── Succès ───────────────────────────────────────
            $user->update([
                'failed_login_attempts' => 0,
                'locked_until'          => null,
                'last_login_at'         => now(),
                'last_login_ip'         => $request->ip(),
            ]);

            $this->auditLog($request, $user->id, 'login_success');

            return $user;
        });

        // ── 3. Rate Limiting : 5 tentatives / 10 min ─────────
        // Fortify utilise ce rate limiter sur POST /login
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinutes(10, 5)
                ->by(strtolower($request->email) . '|' . $request->ip())
                ->response(function () {
                    return redirect()->route('login')
                        ->withErrors(['email' => __('auth.throttle', [
                            'seconds' => 60,
                            'minutes' => 1,
                        ])]);
                });
        });

        // ── 4. Redirect après login ──────────────────────────
        // Fortify redirige vers HOME par défaut — on surcharge
        // via config/fortify.php : 'home' => '/dashboard'
        // Ou via FortifyServiceProvider si déjà présent dans le projet.
    }

    // ── Audit log helper ─────────────────────────────────────
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