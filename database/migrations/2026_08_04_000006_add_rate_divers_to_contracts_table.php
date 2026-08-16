<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Taux "Divers" du décompte de prime — au même titre que rate_ro/rate_rg/
 * rate_surprime, entre dans le calcul de la Prime Nette :
 *   Prime Nette = Prime(RO) + Prime(RG) + Prime(Divers) + Prime(Surprime)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->decimal('rate_divers', 6, 4)->nullable()->after('rate_rg');
        });
    }

    public function down(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->dropColumn('rate_divers');
        });
    }
};
