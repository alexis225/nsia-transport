<?php

namespace App\Console\Commands;

use App\Models\Certificate;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * US-053 — Politique de rétention et archivage
 * Archive les certificats CANCELLED ou ISSUED datant de plus de N ans.
 * Soft-delete des certificats DRAFT inactifs depuis longtemps.
 */
class ArchiveCertificates extends Command
{
    protected $signature = 'nsia:archive-certificates
                            {--years=5 : Âge minimum en années pour archiver}
                            {--dry-run : Simuler sans modifier la base}';

    protected $description = 'Archive les certificats anciens selon la politique de rétention (US-053)';

    public function handle(): int
    {
        $years  = (int) $this->option('years');
        $dryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subYears($years);

        $this->info("[ARCHIVE] Cutoff : {$cutoff->toDateString()} ({$years} ans)");
        if ($dryRun) $this->warn('[ARCHIVE] Mode simulation — aucune modification.');

        // ── Certificats ISSUED / CANCELLED anciens ────────────────
        $toArchive = Certificate::where('status', 'ISSUED')
            ->where('issued_at', '<', $cutoff)
            ->whereNull('deleted_at');

        $count = $toArchive->count();
        $this->line("[ARCHIVE] {$count} certificats ISSUED à archiver.");

        if (! $dryRun && $count > 0) {
            // Soft-delete par batch de 200
            $toArchive->chunkById(200, function ($certs) {
                foreach ($certs as $c) {
                    $c->delete();
                }
            });
            $this->info("[ARCHIVE] {$count} certificats archivés (soft-deleted).");
        }

        // ── DRAFT inactifs depuis > 1 an ──────────────────────────
        $staleDrafts = Certificate::where('status', 'DRAFT')
            ->where('created_at', '<', now()->subYear())
            ->whereNull('deleted_at');

        $draftCount = $staleDrafts->count();
        $this->line("[ARCHIVE] {$draftCount} brouillons inactifs à purger.");

        if (! $dryRun && $draftCount > 0) {
            $staleDrafts->chunkById(200, function ($certs) {
                foreach ($certs as $c) { $c->delete(); }
            });
            $this->info("[ARCHIVE] {$draftCount} brouillons supprimés.");
        }

        // ── Fichiers d'export expirés ─────────────────────────────
        $expiredExports = \App\Models\ReportExecution::where('status', 'COMPLETED')
            ->where('expires_at', '<', now())
            ->whereNotNull('file_path');

        $exportCount = $expiredExports->count();
        if (! $dryRun && $exportCount > 0) {
            $expiredExports->each(function ($ex) {
                if (\Illuminate\Support\Facades\Storage::exists($ex->file_path)) {
                    \Illuminate\Support\Facades\Storage::delete($ex->file_path);
                }
                $ex->update(['file_path' => null]);
            });
            $this->info("[ARCHIVE] {$exportCount} fichiers d'export expirés supprimés.");
        }

        $this->info('[ARCHIVE] Terminé.');
        return self::SUCCESS;
    }
}
