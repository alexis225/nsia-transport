<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            // Résumé libre des conditions particulières du contrat, imprimé
            // tel quel sur les souches qui en disposent (ex. Bénin).
            $table->text('special_conditions')->nullable()->after('exclusions');
        });
    }

    public function down(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->dropColumn('special_conditions');
        });
    }
};
