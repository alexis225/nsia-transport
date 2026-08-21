<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permet une règle de taxe "par défaut" par filiale (et éventuellement par
 * mode de transport), indépendante du pays de destination — cf. barème
 * fourni par filiale ("Taxe unique" ou détail par mode de transport,
 * s'appliquant quelle que soit la destination). TaxRule::findApplicable()
 * retombe sur cette règle générique quand aucune règle spécifique au pays
 * de destination n'existe.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tax_rules', function (Blueprint $table) {
            $table->dropForeign(['transport_mode_id']);
            $table->dropForeign(['country_code']);
        });

        Schema::table('tax_rules', function (Blueprint $table) {
            $table->unsignedBigInteger('transport_mode_id')->nullable()->change();
            $table->char('country_code', 2)->nullable()->change();

            $table->foreign('transport_mode_id')->references('id')->on('transport_modes')->cascadeOnDelete();
            $table->foreign('country_code')->references('code')->on('countries')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tax_rules', function (Blueprint $table) {
            $table->dropForeign(['transport_mode_id']);
            $table->dropForeign(['country_code']);
        });

        Schema::table('tax_rules', function (Blueprint $table) {
            $table->unsignedBigInteger('transport_mode_id')->nullable(false)->change();
            $table->char('country_code', 2)->nullable(false)->change();

            $table->foreign('transport_mode_id')->references('id')->on('transport_modes')->cascadeOnDelete();
            $table->foreign('country_code')->references('code')->on('countries')->cascadeOnDelete();
        });
    }
};
