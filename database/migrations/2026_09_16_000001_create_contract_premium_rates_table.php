<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * ============================================================
 * MIGRATION — contract_premium_rates
 * ============================================================
 * Taux R.O./R.G. spécifiques par type de conditionnement
 * (Conteneur, Conventionnel, Vrac, Groupage, Bout en bout) pour
 * un contrat donné — surcharge le taux global du contrat
 * (insurance_contracts.rate_ro/rate_rg) quand un certificat est
 * émis avec ce type de conditionnement précis.
 * ============================================================
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_premium_rates', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('contract_id')
                ->constrained('insurance_contracts')
                ->cascadeOnDelete();

            $table->string('conditioning_type', 20);

            $table->decimal('rate_ro', 8, 4)->default(0);
            $table->decimal('rate_rg', 8, 4)->default(0);

            $table->timestamps();

            $table->unique(['contract_id', 'conditioning_type'], 'uniq_contract_premium_rate_type');
        });

        DB::statement("ALTER TABLE contract_premium_rates ADD CONSTRAINT cpr_conditioning_type_check
            CHECK (conditioning_type IN ('CONTAINER','GROUPAGE','CONVENTIONNEL','BOUT_EN_BOUT','VRAC'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_premium_rates');
    }
};
