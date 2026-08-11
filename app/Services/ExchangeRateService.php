<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * ============================================================
 * ExchangeRateService
 * ============================================================
 * Taux du jour pour la "Devise cotation" des certificats — API
 * OANDA Exchange Rates (https://developer.oanda.com/exchange-rates-api/).
 * Purement indicatif : l'utilisateur reste libre de corriger le taux
 * proposé avant validation du certificat.
 *
 * NB : nécessite un compte OANDA + OANDA_API_KEY dans .env. La forme
 * exacte de la requête (endpoint/paramètres) dépend du plan souscrit —
 * à ajuster contre la documentation du compte une fois la clé fournie.
 * ============================================================
 */
class ExchangeRateService
{
    /**
     * Retourne le taux du jour (1 unité de $from = X unités de $to),
     * ou null si le service n'est pas configuré / indisponible.
     */
    public function dailyRate(string $from, string $to): ?float
    {
        if ($from === $to) {
            return 1.0;
        }

        $apiKey = config('services.oanda.api_key');
        $apiUrl = config('services.oanda.api_url');

        if (! $apiKey) {
            throw new RuntimeException(
                "Conversion automatique non configurée — OANDA_API_KEY est requis."
            );
        }

        try {
            $response = Http::timeout(5)
                ->withToken($apiKey)
                ->get("{$apiUrl}/exchange-rates/spot", [
                    'base'  => $from,
                    'quote' => $to,
                ]);

            if (! $response->successful()) {
                Log::warning('ExchangeRateService: réponse OANDA en erreur', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                return null;
            }

            $rate = $response->json('rate') ?? $response->json('quote');

            return $rate !== null ? (float) $rate : null;
        } catch (Throwable $e) {
            Log::warning('ExchangeRateService: échec de récupération du taux', [
                'from' => $from, 'to' => $to, 'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
