<?php

namespace App\Jobs;

use App\Models\Certificate;
use App\Models\ReportExecution;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

/**
 * US-047 — Export asynchrone grands volumes
 * Génère un CSV pour les certificats selon les filtres passés en paramètre.
 * Met à jour ReportExecution tout au long du traitement.
 */
class AsyncCertificateExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600; // 10 min max
    public int $tries   = 2;

    public function __construct(
        private readonly string $executionId,
    ) {}

    public function handle(): void
    {
        $execution = ReportExecution::find($this->executionId);
        if (! $execution) return;

        $execution->update([
            'status'     => ReportExecution::STATUS_PROCESSING,
            'started_at' => now(),
        ]);

        try {
            $params   = $execution->parameters ?? [];
            $isSA     = $params['is_super_admin'] ?? false;
            $tenantId = $params['tenant_id']      ?? null;

            $query = Certificate::with([
                    'contract:id,contract_number,broker_id',
                    'contract.broker:id,name',
                    'tenant:id,name,code',
                    'issuedBy:id,first_name,last_name',
                ])
                ->when(! $isSA && $tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
                ->when($params['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
                ->when($params['transport_type'] ?? null, fn ($q, $v) => $q->where('transport_type', $v))
                ->when($params['date_from'] ?? null, fn ($q, $v) => $q->whereDate('issued_at', '>=', $v))
                ->when($params['date_to']   ?? null, fn ($q, $v) => $q->whereDate('issued_at', '<=', $v))
                ->when($params['broker_id'] ?? null, fn ($q, $v) => $q->whereHas('contract', fn ($q) => $q->where('broker_id', $v)))
                ->when($params['search']    ?? null, fn ($q, $v) => $q->where(fn ($q) =>
                    $q->where('certificate_number', 'ilike', "%{$v}%")
                      ->orWhere('insured_name', 'ilike', "%{$v}%")
                ))
                ->orderByDesc('created_at');

            $path     = "exports/{$executionId}.csv";
            $tmpPath  = storage_path("app/{$path}");

            // Écriture en streaming
            $handle = fopen($tmpPath, 'w');
            // BOM UTF-8
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'N° Certificat', 'N° Police', 'Assuré', 'De', 'Vers',
                'Date voyage', 'Mode transport', 'Valeur assurée', 'Devise',
                'Prime totale', 'Statut', 'Date émission', 'Émis par',
                'Courtier', 'Filiale',
            ], ';');

            $rowCount = 0;
            $query->chunk(500, function ($certs) use ($handle, &$rowCount) {
                foreach ($certs as $c) {
                    fputcsv($handle, [
                        $c->certificate_number,
                        $c->policy_number ?? '',
                        $c->insured_name,
                        $c->voyage_from,
                        $c->voyage_to,
                        $c->voyage_date?->format('d/m/Y') ?? '',
                        $c->transport_type ?? '',
                        number_format((float) $c->insured_value, 2, ',', ' '),
                        $c->currency_code,
                        number_format((float) $c->prime_total, 2, ',', ' '),
                        $c->status,
                        $c->issued_at?->format('d/m/Y H:i') ?? '',
                        $c->issuedBy ? $c->issuedBy->first_name . ' ' . $c->issuedBy->last_name : '',
                        $c->contract?->broker?->name ?? '',
                        $c->tenant?->code ?? '',
                    ], ';');
                    $rowCount++;
                }
            });
            fclose($handle);

            $execution->update([
                'status'       => ReportExecution::STATUS_COMPLETED,
                'file_path'    => $path,
                'file_size'    => filesize($tmpPath),
                'row_count'    => $rowCount,
                'completed_at' => now(),
                'expires_at'   => now()->addHours(24),
            ]);

        } catch (\Throwable $e) {
            $execution->update([
                'status'        => ReportExecution::STATUS_FAILED,
                'error_message' => $e->getMessage(),
                'completed_at'  => now(),
            ]);
        }
    }

    public function failed(\Throwable $e): void
    {
        ReportExecution::where('id', $this->executionId)->update([
            'status'        => ReportExecution::STATUS_FAILED,
            'error_message' => $e->getMessage(),
            'completed_at'  => now(),
        ]);
    }
}
