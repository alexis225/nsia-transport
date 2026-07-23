<?php

/**
 * ============================================================
 * MIGRATION — modules activables/désactivables par filiale
 * ============================================================
 * Le super_admin peut activer/désactiver certains modules
 * métier pour une filiale donnée (Courtiers, Coassureurs,
 * Experts, Contrats, Certificats, Certificats GUCE,
 * Commissions, Rapports, Escalades NN300, Délégations).
 *
 * Stocké en JSON : { "brokers": true, "coinsurers": false, ... }
 * Une clé absente est considérée comme activée par défaut
 * (voir Tenant::hasModule()).
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->json('modules')->nullable()->after('settings');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('modules');
        });
    }
};
