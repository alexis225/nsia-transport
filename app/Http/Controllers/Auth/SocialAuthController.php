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
use Illuminate\Support\Facades\Http;
class SocialAuthController extends Controller
{
    private const ALLOWED_PROVIDERS = ['google', 'microsoft'];

    // ── Redirection vers le provider OAuth ───────────────────
    public function redirect(string $provider): RedirectResponse
    {
        $clientId = env('MICROSOFT_CLIENT_ID');
        $redirectUri = urlencode(env('MICROSOFT_REDIRECT_URI'));
        $scope = urlencode('User.Read');

        $url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize" .
            "?client_id={$clientId}" .
            "&response_type=code" .
            "&redirect_uri={$redirectUri}" .
            "&response_mode=query" .
            "&scope={$scope}";

        return redirect()->away($url);
    }

    // ── Callback OAuth ───────────────────────────────────────
    public function callback(Request $request, string $provider): RedirectResponse
    {

        try {
            // $code = $request->query('code');
            // if (!$code) {
            //     return redirect('/')->with('error', 'Authorization code not returned.');
            // }

            // $tokenResponse = Http::withOptions([
            //     'verify' => false
            // ])->asForm()->post("https://login.microsoftonline.com/common/oauth2/v2.0/token", [
            //     'client_id' => env('MICROSOFT_CLIENT_ID'),
            //     'scope' => 'User.Read',
            //     'code' => $code,
            //     'redirect_uri' => env('MICROSOFT_REDIRECT_URI'),
            //     'grant_type' => 'authorization_code',
            //     'client_secret' => env('MICROSOFT_CLIENT_SECRET'),
            // ]);

            // if ($tokenResponse->failed()) {
            //     return redirect('/')->with('error', 'Failed to get token from Microsoft.');
            // }

            // $tokenData = $tokenResponse->json();
        
            // $idToken = $tokenData['access_token'];
            // $userInfo = $this->decodeJwt($idToken);
            //---------------------user info pour les tests à supprimer après les tests------------------
            $userInfo = [
                'upn'         => 'jean-louis.goueguy@nsiaholdingassurances.com',
                'given_name'  => 'Jean-Louis Alexis',
                'family_name' => 'GOUEGUY',
                'name'        => 'GOUEGUY Jean-Louis Alexis [NSIA Holding Assurances]',
                'email'       => 'jean-louis.goueguy@nsiaholdingassurances.com',
            ];
            //dd($userInfo, $tokenResponse->json()["access_token"]);
        } catch (\Exception $e) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Authentification OAuth échouée. Veuillez réessayer.']);
        }
        $email = $userInfo['upn'];
        if (!  $email) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Aucun email fourni par le provider OAuth.']);
        }
        
        $allowedDomains = explode(',', env('MICROSOFT_ALLOWED_DOMAINS', ''));
        if (!empty(array_filter($allowedDomains))) {
            $domain = substr(strrchr($email, "@"), 1);
            if (!in_array($domain, $allowedDomains)) {
                return redirect('/')->with('error', 'Votre domaine email n\'est pas autorisé.');
            }
        }
        
        // ── Trouver ou créer l'utilisateur ───────────────────
        $user = User::where('email',  $email)->first();
       

        if (! $user) {
            $user = User::create([
                'email'             =>  $email,
                'first_name'        => $this->extractFirstName($userInfo["given_name"]),
                'last_name'         => $this->extractLastName($userInfo["family_name"]),
                'password'          => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
                'is_active'         => true,
                'locale'            => 'fr',
                'timezone'          => 'Africa/Abidjan'
            ]);

            $user->assignRole("client");

            AuditLog::create([
                'tenant_id'      => null,
                'user_id'        => $user->id,
                'action'         => 'oauth_register',
                'entity_type' => 'auth',
                'entity_id'   => $user->id,
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
            'entity_type' => 'auth',
            'entity_id'   => $user->id,
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
            'new_data'       => ['provider' => $provider],
        ]);

        return redirect()->intended(route('admin.dashboard'));
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

    private function decodeJwt($jwt)
    {
        [$header, $payload, $signature] = explode('.', $jwt);
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
        return $payload;
    }

}