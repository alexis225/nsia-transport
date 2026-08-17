<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Dès qu'un contrat ayant dépassé le plafond NN300 (requires_approval) est
 * approuvé par le Groupe (DTAG), toutes les valeurs de certificats
 * ultérieurs situées entre le plafond NN300 et le plafond Traité sont
 * automatiquement autorisées — cf. InsuranceContract::effectiveCeiling().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->timestamp('nn300_unlocked_at')->nullable()->after('treaty_limit');
        });
    }

    public function down(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->dropColumn('nn300_unlocked_at');
        });
    }
};
