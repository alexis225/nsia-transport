<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            // Pays de destination — détermine le taux de taxe applicable
            // (référentiel tax_rules, cf. filiale × mode de transport × pays).
            $table->char('destination_country_code', 2)->nullable()->after('voyage_to');
            $table->foreign('destination_country_code')
                  ->references('code')->on('countries')
                  ->nullOnDelete();

            // Prime nette = prime_total (TTC) - taxe. Conservée pour
            // affichage/rapports, distincte de prime_total (Prime TTC).
            $table->decimal('prime_nette', 20, 2)->nullable()->after('prime_total');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropForeign(['destination_country_code']);
            $table->dropColumn(['destination_country_code', 'prime_nette']);
        });
    }
};
