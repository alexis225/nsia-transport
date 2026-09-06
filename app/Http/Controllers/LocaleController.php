<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Changement de langue depuis le selecteur (barre de navigation, profil).
 *
 * Accessible aux visiteurs non connectes : le choix est memorise en session
 * pour couvrir les pages publiques (connexion, mot de passe oublie). Pour un
 * utilisateur connecte, il est en plus persiste sur users.locale afin d'etre
 * retrouve sur ses autres appareils. SetLocale relit ces deux sources a
 * chaque requete.
 */
class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', Rule::in(config('app.supported_locales'))],
        ]);

        $request->session()->put('locale', $validated['locale']);

        if ($user = $request->user()) {
            $user->forceFill(['locale' => $validated['locale']])->save();
        }

        return back();
    }
}
