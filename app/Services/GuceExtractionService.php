<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Mindee\ClientOptions\PollingOptions;
use Mindee\Input\PathInput;
use Mindee\V2\Client;
use Mindee\V2\Product\Extraction\ExtractionResponse;
use Mindee\V2\Product\Extraction\Params\ExtractionParameters;
use RuntimeException;
use Throwable;

/**
 * ============================================================
 * GuceExtractionService
 * ============================================================
 * Extraction automatique des champs d'un certificat GUCE (PDF)
 * via l'API Mindee (modèle personnalisé créé sur app.mindee.com,
 * cf. config('services.mindee')).
 *
 * https://developers.mindee.com/docs/php-api-builder
 * ============================================================
 */
class GuceExtractionService
{
    /**
     * Lance l'extraction et retourne les champs GuceCertificate
     * reconnus (clé => valeur brute en chaîne, null si absent).
     */
    public function extract(string $absoluteFilePath): array
    {
        $apiKey  = config('services.mindee.api_key');
        $modelId = config('services.mindee.model_id');

        if (! $apiKey || ! $modelId) {
            throw new RuntimeException(
                "Extraction automatique non configurée — MINDEE_V2_API_KEY et MINDEE_GUCE_MODEL_ID sont requis."
            );
        }

        $client = new Client($apiKey);

        $params = new ExtractionParameters(
            $modelId,
            rag: null,
            rawText: null,
            polygon: null,
            confidence: null,
        );

        // Bornée à ~45s pour rester compatible avec une requête HTTP
        // synchrone (le front affiche un spinner pendant l'appel).
        $response = $client->enqueueAndGetResult(
            ExtractionResponse::class,
            new PathInput($absoluteFilePath),
            $params,
            new PollingOptions(initialDelaySec: 2.0, delaySec: 1.5, maxRetries: 30),
        );

        $fields = $response->inference->result->fields;

        $data = [];
        foreach (config('services.mindee.field_map') as $localField => $mindeeField) {
            $value = $this->readSimpleField($fields, $mindeeField);

            // Les champs date/montant sont normalisés ici (avant de repartir
            // vers le front) car le format brut renvoyé par Mindee pour un
            // champ personnalisé de type "Texte" varie selon le document
            // scanné (ex: "18/02/2026" au lieu de l'ISO, ou "1 251 283,50"
            // avec séparateurs de milliers/décimale locaux). Sans cette
            // normalisation, un <input type="date"> ou type="number"> rejette
            // silencieusement une valeur qu'il ne reconnaît pas et retombe
            // sur son placeholder — ce qui ressemble à un champ "en
            // filigrane" jamais vraiment rempli, alors que la donnée brute
            // était bien extraite.
            $data[$localField] = match ($localField) {
                'transit_date' => $this->normalizeDate($value),
                'insured_value', 'net_premium', 'total_premium' => $this->normalizeNumber($value),
                default => $value,
            };
        }

        // Journalise à chaque appel les champs bruts renvoyés par Mindee
        // (nom + valeur) en regard du mapping local, pour diagnostiquer
        // un écart de nommage avec le modèle configuré côté tableau de
        // bord (ex: slug généré différent du label saisi).
        Log::info('GuceExtractionService: résultat extraction', [
            'returned_fields' => array_map(
                fn ($field) => $field->value ?? null,
                iterator_to_array($fields),
            ),
            'mapped_data' => $data,
        ]);

        return $data;
    }

    private function readSimpleField(mixed $fields, string $name): ?string
    {
        try {
            $value = $fields->getSimpleField($name)?->value;
        } catch (Throwable) {
            return null;
        }

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    /**
     * Ramène une date brute (ISO, avec heure, ou jj/mm/aaaa — formats
     * observés selon le document) au format strict Y-m-d attendu par un
     * <input type="date">. Retourne null plutôt qu'une valeur non
     * interprétable, pour laisser le champ vide au lieu de le corrompre.
     */
    private function normalizeDate(?string $raw): ?string
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }

        $raw = trim($raw);

        if (preg_match('/^(\d{4}-\d{2}-\d{2})/', $raw, $matches)) {
            return $matches[1];
        }

        foreach (['d/m/Y', 'd-m-Y', 'd.m.Y', 'm/d/Y'] as $format) {
            try {
                return Carbon::createFromFormat($format, $raw)->format('Y-m-d');
            } catch (Throwable) {
                continue;
            }
        }

        try {
            return Carbon::parse($raw)->format('Y-m-d');
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Ramène un montant brut (espaces/points de milliers, virgule
     * décimale, symbole de devise éventuel) à une chaîne décimale simple
     * ("1251283.5") exploitable par un <input type="number">. Retourne
     * null plutôt qu'une valeur non numérique, pour laisser le champ vide
     * au lieu de le corrompre.
     */
    private function normalizeNumber(?string $raw): ?string
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }

        $cleaned = preg_replace('/[^\d,.\-]/', '', $raw) ?? '';

        if ($cleaned === '') {
            return null;
        }

        $hasComma = str_contains($cleaned, ',');
        $hasDot   = str_contains($cleaned, '.');

        if ($hasComma && $hasDot) {
            // Le séparateur décimal est celui qui apparaît en dernier,
            // l'autre est un séparateur de milliers à retirer.
            if (strrpos($cleaned, ',') > strrpos($cleaned, '.')) {
                $cleaned = str_replace('.', '', $cleaned);
                $cleaned = str_replace(',', '.', $cleaned);
            } else {
                $cleaned = str_replace(',', '', $cleaned);
            }
        } elseif ($hasComma) {
            // "1251283,50" (décimale) vs "1,251,283" (milliers, rare ici).
            $decimals = strlen($cleaned) - strrpos($cleaned, ',') - 1;
            $cleaned = $decimals === 3
                ? str_replace(',', '', $cleaned)
                : str_replace(',', '.', $cleaned);
        }

        return is_numeric($cleaned) ? $cleaned : null;
    }
}
