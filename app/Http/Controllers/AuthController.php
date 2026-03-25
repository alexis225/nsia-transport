<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * AuthController — US-001 (Inertia.js)
 * ============================================================
 * Connexion session Laravel standard (pas de token Sanctum SPA)
 * Inertia gère les redirections côté client via router.visit()
 * Brute-force : lockout après 5 tentatives (10 min)
 * ============================================================
 */
class AuthController extends Controller
{
    private const MAX_ATTEMPTS    = 5;
    private const LOCKOUT_MINUTES = 10;

    // ── Page login (Inertia) ─────────────────────────────────
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
        ]);
    }

    // ── Login email/password ─────────────────────────────────
    public function login(LoginRequest $request): RedirectResponse
    {
        $key = $this->throttleKey($request);

        // ── Vérifier lockout rate limiter ────────────────────
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);

            $this->auditLog($request, null, 'login_lockout', [
                'email'           => $request->email,
                'retry_after_sec' => $seconds,
            ]);

            throw ValidationException::withMessages([
                'email' => __('auth.throttle', [
                    'seconds' => $seconds,
                    'minutes' => ceil($seconds / 60),
                ]),
            ])->status(429);
        }

        // ── Récupérer l'utilisateur ──────────────────────────
        $user = User::where('email', $request->email)->first();

        // ── Vérifier mot de passe ────────────────────────────
        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, self::LOCKOUT_MINUTES * 60);

            if ($user) {
                $user->increment('failed_login_attempts');

                if ($user->failed_login_attempts >= self::MAX_ATTEMPTS) {
                    $user->update(['locked_until' => now()->addMinutes(self::LOCKOUT_MINUTES)]);
                }
            }

            $this->auditLog($request, $user?->id, 'login_failed', [
                'email' => $request->email,
            ]);

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // ── Compte désactivé ─────────────────────────────────
        if (! $user->is_active) {
            $this->auditLog($request, $user->id, 'login_blocked');

            throw ValidationException::withMessages([
                'email' => __('auth.blocked'),
            ]);
        }

        // ── Compte verrouillé temporairement ─────────────────
        if ($user->isLocked()) {
            $this->auditLog($request, $user->id, 'login_locked');

            throw ValidationException::withMessages([
                'email' => __('auth.locked', [
                    'minutes' => $user->locked_until->diffInMinutes(now()),
                ]),
            ]);
        }

        // ── MFA requis → rediriger vers challenge ────────────
        if ($user->mfa_enabled) {
            // Stocker en session pour l'étape MFA (US-002)
            session(['mfa_pending_user_id' => $user->id]);

            return redirect()->route('auth.mfa.challenge');
        }

        // ── Connexion réussie ─────────────────────────────────
        RateLimiter::clear($key);
        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        $user->update([
            'failed_login_attempts' => 0,
            'locked_until'          => null,
            'last_login_at'         => now(),
            'last_login_ip'         => $request->ip(),
        ]);

        $this->auditLog($request, $user->id, 'login_success');

        return redirect()->intended(route('admin.dashboard'));
    }

    // ── Logout ───────────────────────────────────────────────
    public function logout(Request $request): RedirectResponse
    {
        $this->auditLog($request, Auth::id(), 'logout');

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    // ── Clé rate limiting ────────────────────────────────────
    private function throttleKey(Request $request): string
    {
        return 'login|' . strtolower($request->email) . '|' . $request->ip();
    }

    // ── Audit log ────────────────────────────────────────────
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
            'auditable_id'   => $userId ?? null,
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
            'new_data'       => $metadata ?: null,
        ]);
    }
}