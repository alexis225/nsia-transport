<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * Résout la langue de la requête et l'applique à Laravel.
 *
 * Ordre de priorité :
 *   1. users.locale         — préférence explicite de l'utilisateur connecté
 *   2. session 'locale'     — choix fait via le sélecteur avant connexion
 *   3. En-tête Accept-Language du navigateur (visiteurs non connectés)
 *   4. config('app.locale') — repli
 *
 * Doit tourner AVANT HandleInertiaRequests, qui partage la locale résolue
 * au front (voir HandleInertiaRequests::share()).
 */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        App::setLocale($this->resolve($request));

        return $next($request);
    }

    protected function resolve(Request $request): string
    {
        $supported = config('app.supported_locales');

        $user = $request->user();
        if ($user && in_array($user->locale, $supported, true)) {
            return $user->locale;
        }

        $session = $request->session()?->get('locale');
        if (in_array($session, $supported, true)) {
            return $session;
        }

        // getPreferredLanguage() retombe sur $supported[0] quand rien ne
        // correspond : on ne s'y fie donc que si l'en-tête est présent et
        // qu'une de ses langues correspond réellement.
        foreach ($request->getLanguages() as $language) {
            $short = substr(str_replace('_', '-', $language), 0, 2);
            if (in_array($short, $supported, true)) {
                return $short;
            }
        }

        return config('app.locale');
    }
}
