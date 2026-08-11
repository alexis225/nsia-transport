<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Préavis de résiliation par défaut : 1 mois (30j) → 2 mois (60j) pour les
 * NOUVEAUX contrats. Les contrats existants conservent leur préavis actuel
 * (donnée contractuelle déjà fixée) — seul le défaut appliqué à la
 * création change.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE insurance_contracts ALTER COLUMN notice_period_days SET DEFAULT 60');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE insurance_contracts ALTER COLUMN notice_period_days SET DEFAULT 30');
    }
};
