<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tarifs minimum réglementaires par filiale NSIA et par garantie (FAP Sauf /
 * Tous Risques) : taux minimum, accessoires minimum par certificat, prime
 * nette minimum. Ces planchers sont opposables lors de la création/
 * modification d'un contrat (taux, accessoires) et appliqués au décompte
 * de prime d'un certificat (prime nette) — cf.
 * InsuranceContractController::validateContract() et
 * CertificateController::buildPrimeBreakdown().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_guarantee_rates', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();

            // FAP_ABSOLUE n'a pas de ligne dédiée — elle retombe sur le
            // plancher TOUS_RISQUES (le plus large des deux, par prudence).
            $table->string('coverage_type', 20);

            $table->decimal('min_rate_pct', 6, 4);            // taux minimum (%)
            $table->decimal('min_accessories_amount', 20, 2); // accessoires minimum par certificat
            $table->decimal('min_net_premium', 20, 2);        // prime nette minimum par certificat

            $table->text('notes')->nullable(); // ex: "dont 500 FCFA de quote-part ASAC"

            $table->timestamps();

            $table->unique(['tenant_id', 'coverage_type']);
        });

        DB::statement("ALTER TABLE tenant_guarantee_rates ADD CONSTRAINT tgr_coverage_check
            CHECK (coverage_type IN ('FAP_SAUF','TOUS_RISQUES'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_guarantee_rates');
    }
};
