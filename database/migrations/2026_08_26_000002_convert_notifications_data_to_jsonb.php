<?php

/**
 * ============================================================
 * MIGRATION — notifications.data : text → jsonb
 * ============================================================
 * Notification::alreadySentToday() (et tout futur whereJsonContains
 * sur cette colonne) utilise l'opérateur Postgres "->", indisponible
 * sur une colonne "text". Le modèle caste déjà "data" en array côté
 * PHP — ce changement de type est transparent pour l'application.
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE notifications ALTER COLUMN data TYPE jsonb USING data::jsonb');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE notifications ALTER COLUMN data TYPE text USING data::text');
    }
};
