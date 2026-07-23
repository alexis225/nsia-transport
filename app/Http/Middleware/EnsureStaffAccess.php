<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * ============================================================
 * EnsureStaffAccess Middleware
 * ============================================================
 * Empêche les comptes purement partenaires (courtier_local /
 * partenaire_etranger) d'accéder aux routes /admin/* et
 * assimilées — ils sont redirigés vers leur espace dédié
 * /partner. N'affecte pas un compte staff qui aurait aussi
 * l'un de ces rôles (délégation, tests...).
 * ============================================================
 */
class EnsureStaffAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (
            $user
            && $user->hasAnyRole(['courtier_local', 'partenaire_etranger'])
            && ! $user->hasAnyRole(['super_admin', 'admin_filiale', 'souscripteur'])
        ) {
            return redirect()->route('partner.dashboard');
        }

        return $next($request);
    }
}
