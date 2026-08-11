<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Ajoute "TIERS_CHARGEUR" (Police tiers chargeur) aux types de contrat
 * autorisés — fonctionnement identique à OPEN_POLICY (aucun verrou
 * applicatif ne cible spécifiquement ce nouveau type).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE insurance_contracts DROP CONSTRAINT ic_type_check');
        DB::statement("ALTER TABLE insurance_contracts ADD CONSTRAINT ic_type_check
            CHECK (type IN ('OPEN_POLICY','VOYAGE','ANNUAL_VOYAGE','TIERS_CHARGEUR'))");
    }

    public function down(): void
    {
        // Repasser les contrats TIERS_CHARGEUR en OPEN_POLICY (comportement
        // identique) pour ne pas violer l'ancienne contrainte au rollback.
        DB::statement('ALTER TABLE insurance_contracts DROP CONSTRAINT ic_type_check');

        DB::table('insurance_contracts')
            ->where('type', 'TIERS_CHARGEUR')
            ->update(['type' => 'OPEN_POLICY']);

        DB::statement("ALTER TABLE insurance_contracts ADD CONSTRAINT ic_type_check
            CHECK (type IN ('OPEN_POLICY','VOYAGE','ANNUAL_VOYAGE'))");
    }
};
