<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * ============================================================
 * VerifyRecaptcha — Google reCAPTCHA v3 (invisible)
 * ============================================================
 * Enregistré globalement sur `config('fortify.middleware')`, donc
 * exécuté sur TOUTES les routes Fortify (login, register, forgot
 * password, reset password, 2FA, email verification...). On ne peut
 * pas cibler juste login.store/register.store/password.email en
 * attachant du middleware par nom de route : ces routes sont
 * enregistrées par le package Fortify pendant sa propre phase de
 * boot, dont l'ordre relatif aux providers de l'app n'est pas garanti
 * — donc on filtre ici, à l'exécution (le nom de route est toujours
 * fiable une fois la requête dispatchée), plutôt qu'à l'enregistrement.
 *
 * Ignoré si RECAPTCHA_SECRET_KEY est vide (voir config/services.php) —
 * c'est ce qui garde la suite de tests Pest verte sans token : ni
 * .env.testing ni phpunit.xml ne définissent cette clé.
 * ============================================================
 */
class VerifyRecaptcha
{
    /** Routes Fortify protégées, et l'action reCAPTCHA attendue pour chacune. */
    private const PROTECTED_ROUTES = [
        'login.store' => 'login',
        'register.store' => 'register',
        'password.email' => 'forgot_password',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $action = self::PROTECTED_ROUTES[$request->route()?->getName()] ?? null;

        if ($action === null || ! $this->shouldVerify()) {
            return $next($request);
        }

        $token = (string) $request->input('g-recaptcha-response', '');

        if ($token === '' || ! $this->verify($token, $action, $request->ip())) {
            throw ValidationException::withMessages([
                'g-recaptcha-response' => 'Vérification anti-robot échouée. Veuillez réessayer.',
            ]);
        }

        return $next($request);
    }

    private function shouldVerify(): bool
    {
        return filled(config('services.recaptcha.secret_key'));
    }

    private function verify(string $token, string $expectedAction, ?string $ip): bool
    {
        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => config('services.recaptcha.secret_key'),
            'response' => $token,
            'remoteip' => $ip,
        ]);

        if (! $response->ok()) {
            Log::warning('VerifyRecaptcha: siteverify HTTP non-OK', ['status' => $response->status()]);

            return false;
        }

        $data = $response->json();

        if (! ($data['success'] ?? false)) {
            Log::info('VerifyRecaptcha: échec', ['errors' => $data['error-codes'] ?? null, 'action' => $expectedAction]);

            return false;
        }

        if (($data['action'] ?? null) !== $expectedAction) {
            Log::warning('VerifyRecaptcha: action inattendue', ['expected' => $expectedAction, 'got' => $data['action'] ?? null]);

            return false;
        }

        $minScore = (float) config('services.recaptcha.min_score', 0.5);
        if ((float) ($data['score'] ?? 0) < $minScore) {
            Log::info('VerifyRecaptcha: score sous le seuil', ['score' => $data['score'] ?? null, 'min' => $minScore]);

            return false;
        }

        return true;
    }
}
