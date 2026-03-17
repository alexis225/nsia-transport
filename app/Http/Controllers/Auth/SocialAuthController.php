<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private const ALLOWED_PROVIDERS = ['google', 'microsoft'];

    // ── Redirection vers le provider OAuth ───────────────────
    public function redirect(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        return Socialite::driver($provider)->redirect();
    }

    // ── Callback OAuth ───────────────────────────────────────
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Authentification OAuth échouée. Veuillez réessayer.']);
        }

        if (! $socialUser->getEmail()) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Aucun email fourni par le provider OAuth.']);
        }

        // ── Trouver ou créer l'utilisateur ───────────────────
        $user = User::where('email', $socialUser->getEmail())->first();

        if (! $user) {
            $user = User::create([
                'email'             => $socialUser->getEmail(),
                'first_name'        => $this->extractFirstName($socialUser->getName()),
                'last_name'         => $this->extractLastName($socialUser->getName()),
                'password'          => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
                'is_active'         => true,
                'locale'            => 'fr',
                'timezone'          => 'Africa/Abidjan',
                'avatar_path'       => $socialUser->getAvatar(),
            ]);

            AuditLog::create([
                'tenant_id'      => null,
                'user_id'        => $user->id,
                'action'         => 'oauth_register',
                'auditable_type' => 'auth',
                'auditable_id'   => $user->id,
                'ip_address'     => $request->ip(),
                'user_agent'     => $request->userAgent(),
                'new_data'       => ['provider' => $provider, 'email' => $user->email],
            ]);
        }

        // ── Compte désactivé ─────────────────────────────────
        if (! $user->is_active) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Votre compte a été désactivé. Contactez votre administrateur.']);
        }

        // ── MFA requis → rediriger vers challenge ────────────
        if ($user->mfa_enabled) {
            session(['mfa_pending_user_id' => $user->id]);

            return redirect()->route('auth.mfa.challenge');
        }

        // ── Connexion réussie via session Laravel ────────────
        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $user->update([
            'last_login_at'         => now(),
            'last_login_ip'         => $request->ip(),
            'failed_login_attempts' => 0,
            'locked_until'          => null,
        ]);

        AuditLog::create([
            'tenant_id'      => $user->tenant_id,
            'user_id'        => $user->id,
            'action'         => 'oauth_login_success',
            'auditable_type' => 'auth',
            'auditable_id'   => $user->id,
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
            'new_data'       => ['provider' => $provider],
        ]);

        return redirect()->intended(route('dashboard'));
    }

    private function validateProvider(string $provider): void
    {
        if (! in_array($provider, self::ALLOWED_PROVIDERS, true)) {
            abort(404, "Provider OAuth non supporté : {$provider}");
        }
    }

    private function extractFirstName(?string $fullName): string
    {
        if (! $fullName) return 'Utilisateur';
        return explode(' ', trim($fullName))[0] ?? 'Utilisateur';
    }

    private function extractLastName(?string $fullName): string
    {
        if (! $fullName) return '';
        $parts = explode(' ', trim($fullName));
        array_shift($parts);
        return implode(' ', $parts);
    }
}