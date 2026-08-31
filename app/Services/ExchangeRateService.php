<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * ============================================================
 * ExchangeRateService
 * ============================================================
 * Taux du jour pour la "Devise cotation" des certificats — API
 * fawazahmed0/currency-api (https://github.com/fawazahmed0/currency-api),
 * gratuite, sans clé ni inscription, mise à jour quotidiennement,
 * couvrant 200+ devises dont les monnaies locales des filiales NSIA
 * (XOF, XAF, GNF, NGN, GHS...). Distribuée sur deux CDN indépendants
 * pour la résilience : jsDelivr en primaire, Cloudflare Pages en repli
 * si le premier est indisponible.
 *
 * Purement indicatif : l'utilisateur reste libre de corriger le taux
 * proposé avant validation du certificat.
 * ============================================================
 */
class ExchangeRateService
{
    private const PRIMARY_BASE_URL  = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
    private const FALLBACK_BASE_URL = 'https://latest.currency-api.pages.dev/v1/currencies';

    /**
     * Retourne le taux du jour (1 unité de $from = X unités de $to),
     * ou null si le service est indisponible.
     */
    public function dailyRate(string $from, string $to): ?float
    {
        if ($from === $to) {
            return 1.0;
        }

        $fromCode = strtolower($from);
        $toCode   = strtolower($to);

        return $this->fetchRate(self::PRIMARY_BASE_URL, $fromCode, $toCode)
            ?? $this->fetchRate(self::FALLBACK_BASE_URL, $fromCode, $toCode);
    }

    private function fetchRate(string $baseUrl, string $fromCode, string $toCode): ?float
    {
        try {
            $response = Http::timeout(5)->get("{$baseUrl}/{$fromCode}.json");

            if (! $response->successful()) {
                Log::warning('ExchangeRateService: réponse en erreur', [
                    'base_url' => $baseUrl, 'status' => $response->status(),
                ]);

                return null;
            }

            $rate = $response->json("{$fromCode}.{$toCode}");

            return $rate !== null ? (float) $rate : null;
        } catch (Throwable $e) {
            Log::warning('ExchangeRateService: échec de récupération du taux', [
                'base_url' => $baseUrl, 'from' => $fromCode, 'to' => $toCode, 'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
