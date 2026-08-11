<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * ============================================================
 * Types de modèles de certificats — référentiel officiel
 * ============================================================
 * 3 types disponibles :
 *   - certificat_assurance : Certificat d'Assurance
 *   - certificat_etatique  : Certificat Étatique (GUCE, GUOT, etc.)
 *   - carnet_ordre         : Certificat Carnet d'Ordre (ex "ordre_assurance")
 * ============================================================
 */
return new class extends Migration
{
    public function up(): void
    {
        // Retirer l'ancienne contrainte AVANT de migrer les données, sinon
        // la ligne "carnet_ordre" ci-dessous violerait l'ancien CHECK qui
        // n'autorisait que ordre_assurance/certificat_assurance.
        DB::statement('ALTER TABLE certificate_templates DROP CONSTRAINT certificate_templates_type_check');

        // "ordre_assurance" devient "carnet_ordre" (même concept, libellé
        // officiel harmonisé).
        DB::table('certificate_templates')
            ->where('type', 'ordre_assurance')
            ->update(['type' => 'carnet_ordre']);

        DB::statement("ALTER TABLE certificate_templates ADD CONSTRAINT certificate_templates_type_check CHECK (type IN ('certificat_assurance', 'certificat_etatique', 'carnet_ordre'))");
        DB::statement("ALTER TABLE certificate_templates ALTER COLUMN type SET DEFAULT 'certificat_assurance'");
    }

    public function down(): void
    {
        // Même précaution : retirer la contrainte actuelle avant de migrer
        // les données vers des valeurs qu'elle n'autorise pas.
        DB::statement('ALTER TABLE certificate_templates DROP CONSTRAINT certificate_templates_type_check');

        DB::table('certificate_templates')
            ->where('type', 'carnet_ordre')
            ->update(['type' => 'ordre_assurance']);
        // Pas de mapping inverse fiable pour "certificat_etatique" — les
        // lignes créées avec ce type basculent sur la valeur historique
        // la plus proche pour rester compatible avec l'ancienne contrainte.
        DB::table('certificate_templates')
            ->where('type', 'certificat_etatique')
            ->update(['type' => 'ordre_assurance']);

        DB::statement("ALTER TABLE certificate_templates ADD CONSTRAINT certificate_templates_type_check CHECK (type IN ('ordre_assurance', 'certificat_assurance'))");
        DB::statement("ALTER TABLE certificate_templates ALTER COLUMN type SET DEFAULT 'ordre_assurance'");
    }
};
