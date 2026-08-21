<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Correctif de donnée : la filiale NSIA Guinée (code GN) était enregistrée
 * en USD au lieu du Franc guinéen (GNF) — repéré en configurant les tarifs
 * minimum de cette filiale (50 000 GNF / 250 000 GNF), qui n'auraient sinon
 * aucun sens affichés/interprétés en USD.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('tenants')
            ->where('code', 'GN')
            ->where('currency_code', 'USD')
            ->update(['currency_code' => 'GNF']);
    }

    public function down(): void
    {
        // Correctif de donnée non réversible intentionnellement.
    }
};
