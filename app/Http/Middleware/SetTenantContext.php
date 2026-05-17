<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * US-052 — Contexte tenant pour Row Level Security PostgreSQL
 * Définit app.current_tenant_id et app.current_user_id pour les
 * politiques RLS PostgreSQL. Doit être appliqué après auth.
 */
class SetTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $tenantId = $user->tenant_id ?? 'NULL';
            $userId   = $user->id;

            // SET pour la session PostgreSQL courante
            DB::statement("SET app.current_tenant_id = ?", [$tenantId]);
            DB::statement("SET app.current_user_id = ?",   [$userId]);
        }

        return $next($request);
    }
}
