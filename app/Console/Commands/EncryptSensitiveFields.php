<?php

namespace App\Console\Commands;

use App\Models\Broker;
use App\Models\InsuranceContract;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * US-051 — Migration des données PII en clair vers chiffré
 * À exécuter UNE SEULE FOIS après activation des casts AsEncryptedString.
 * Les enregistrements déjà chiffrés sont ignorés (détection par tentative de déchiffrement).
 */
class EncryptSensitiveFields extends Command
{
    protected $signature   = 'nsia:encrypt-sensitive-fields {--dry-run : Simuler sans modifier}';
    protected $description = 'Chiffre les champs PII existants en clair (US-051)';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        if ($dryRun) $this->warn('Mode simulation — aucune modification.');

        $this->encryptModel(
            'brokers',
            ['address', 'phone', 'registration_number'],
            $dryRun
        );

        $this->encryptModel(
            'insurance_contracts',
            ['insured_address', 'insured_phone'],
            $dryRun
        );

        $this->info('[ENCRYPT] Terminé.');
        return self::SUCCESS;
    }

    private function encryptModel(string $table, array $fields, bool $dryRun): void
    {
        $rows = DB::table($table)->whereNull('deleted_at')->get(['id', ...$fields]);
        $updated = 0;

        foreach ($rows as $row) {
            $changes = [];
            foreach ($fields as $field) {
                $val = $row->$field;
                if ($val === null) continue;

                // Déjà chiffré ? (les valeurs chiffrées par Laravel commencent par "eyJ")
                if (str_starts_with($val, 'eyJ')) continue;

                $changes[$field] = Crypt::encryptString($val);
            }

            if (empty($changes)) continue;

            if (! $dryRun) {
                DB::table($table)->where('id', $row->id)->update($changes);
            }
            $updated++;
        }

        $this->line("  {$table} : {$updated} ligne(s) " . ($dryRun ? 'à migrer' : 'chiffrées') . '.');
    }
}
