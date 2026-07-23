<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * ============================================================
 * EnsureModuleEnabled Middleware
 * ============================================================
 * Bloque l'accès à un module métier désactivé pour la filiale
 * de l'utilisateur connecté (ex: ->middleware('module:coinsurers')).
 * Le super_admin (tenant_id null) n'est jamais concerné —
 * il voit toujours tous les modules de toutes les filiales.
 * ============================================================
 */
class EnsureModuleEnabled
{
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $user = Auth::user();

        if (! $user || $user->hasRole('super_admin')) {
            return $next($request);
        }

        $tenant = $user->tenant;

        if ($tenant && ! $tenant->hasModule($module)) {
            if ($request->wantsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => "Ce module n'est pas activé pour votre filiale.",
                    'code'    => 'MODULE_DISABLED',
                ], 403);
            }

            abort(403, "Ce module n'est pas activé pour votre filiale.");
        }

        return $next($request);
    }
}
