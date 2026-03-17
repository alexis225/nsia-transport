<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ============================================================
 * CheckPermission Middleware — US-003
 * ============================================================
 * Vérifie qu'un utilisateur a la permission requise.
 * Retourne 403 JSON ou redirect selon le type de requête.
 *
 * Usage dans les routes :
 *   Route::get('/certificates', ...)->middleware('permission:certificates.view');
 *   Route::post('/certificates', ...)->middleware('permission:certificates.create');
 *
 * Spatie fournit déjà 'role' et 'permission' middleware —
 * ce middleware est un wrapper avec meilleure gestion Inertia.
 * ============================================================
 */
class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (! $request->user()?->can($permission)) {
            if ($request->wantsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Action non autorisée.',
                    'code'    => 'FORBIDDEN',
                ], 403);
            }

            abort(403, 'Action non autorisée.');
        }

        return $next($request);
    }
}