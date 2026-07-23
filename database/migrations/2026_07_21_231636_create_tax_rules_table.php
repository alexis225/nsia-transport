<?php

/**
 * ============================================================
 * MIGRATION — tax_rules
 * Référentiel de taxes par filiale, mode de transport et pays
 * (réglementation propre à chaque pays). Remplace la saisie
 * manuelle du taux de taxe sur le contrat (insurance_contracts.rate_tax,
 * conservé pour l'historique mais plus utilisé au calcul).
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_rules', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')
                  ->constrained('tenants')
                  ->cascadeOnDelete();

            $table->unsignedBigInteger('transport_mode_id');
            $table->foreign('transport_mode_id')
                  ->references('id')->on('transport_modes')
                  ->cascadeOnDelete();

            $table->char('country_code', 2);
            $table->foreign('country_code')
                  ->references('code')->on('countries')
                  ->cascadeOnDelete();

            // Taux de taxe en %
            $table->decimal('rate_pct', 5, 2);

            $table->date('effective_date');
            $table->date('end_date')->nullable(); // null = toujours actif

            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();

            $table->foreignUuid('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps();

            $table->index(['tenant_id', 'transport_mode_id', 'country_code', 'is_active'], 'idx_tax_rules_lookup');
        });

        DB::statement("ALTER TABLE tax_rules ADD CONSTRAINT tr_rate_check
            CHECK (rate_pct >= 0 AND rate_pct <= 100)");

        // Index partiel pour règles actives
        DB::statement("CREATE INDEX idx_tax_rules_active
            ON tax_rules(tenant_id, transport_mode_id, country_code, effective_date DESC)
            WHERE is_active = TRUE AND end_date IS NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_rules');
    }
};
