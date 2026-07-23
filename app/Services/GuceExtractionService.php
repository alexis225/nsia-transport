<?php

namespace App\Services;

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
            $data[$localField] = $this->readSimpleField($fields, $mindeeField);
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
}
