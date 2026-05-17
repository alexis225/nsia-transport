<?php

namespace App\Http\Middleware;

use App\Models\IpBlacklist;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * US-050 — Vérification blacklist IP
 * Bloque les requêtes dont l'IP est dans la blacklist.
 * Résultat mis en cache 5 minutes pour éviter les requêtes DB répétées.
 */
class CheckIpBlacklist
{
    public function handle(Request $request, Closure $next): Response
    {
        $ip       = $request->ip();
        $cacheKey = "ip_blocked_{$ip}";

        try {
            $isBlocked = Cache::remember($cacheKey, 300, function () use ($ip) {
                return $this->queryIsBlocked($ip);
            });
        } catch (\Throwable) {
            // Fail-open : ne jamais bloquer si la vérification échoue
            return $next($request);
        }

        if ($isBlocked) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Accès refusé.'], 403);
            }
            abort(403, 'Votre adresse IP a été bloquée. Contactez l\'administrateur.');
        }

        return $next($request);
    }

    /**
     * Exécute la vérification CIDR en isolant la requête via SAVEPOINT
     * si une transaction est déjà ouverte (ex: tests avec RefreshDatabase).
     * Cela évite de laisser la connexion PostgreSQL en état "aborted transaction"
     * si la requête CIDR échoue.
     */
    private function queryIsBlocked(string $ip): bool
    {
        $inTransaction = DB::transactionLevel() > 0;
        $sp            = 'sp_ip_' . substr(md5($ip), 0, 8);

        if ($inTransaction) {
            try {
                DB::statement("SAVEPOINT {$sp}");
            } catch (\Throwable) {
                return false;
            }
        }

        try {
            $result = IpBlacklist::isBlocked($ip);

            if ($inTransaction) {
                DB::statement("RELEASE SAVEPOINT {$sp}");
            }

            return $result;
        } catch (\Throwable) {
            if ($inTransaction) {
                try {
                    DB::statement("ROLLBACK TO SAVEPOINT {$sp}");
                } catch (\Throwable) {}
            }
            return false;
        }
    }
}
