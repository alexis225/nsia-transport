<?php

/**
 * ============================================================
 * MIGRATION 22 — commission_rules
 * Règles de commission par courtier, avec priorité :
 *   1. Règle spécifique au contrat  (contract_id NOT NULL)
 *   2. Règle générale du courtier   (contract_id IS NULL)
 *   3. Taux par défaut du courtier  (brokers.commission_rate)
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
        Schema::create('commission_rules', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
 
            $table->foreignUuid('tenant_id')
                  ->constrained('tenants')
                  ->cascadeOnDelete();
 
            $table->foreignUuid('broker_id')
                  ->constrained('brokers')
                  ->cascadeOnDelete();
 
            // Taux spécifique par contrat (optionnel — prime sur taux courtier)
            $table->foreignUuid('contract_id')
                  ->nullable()
                  ->constrained('insurance_contracts')
                  ->nullOnDelete();
 
            // Taux de commission en %
            $table->decimal('rate_pct', 5, 2);
            // ex: 10.00 = 10%
 
            // Base de calcul configurable
            $table->string('base_type', 30)->default('prime_total');
            // prime_total     → prime_total du certificat (défaut)
            // insured_value   → valeur assurée du certificat
            // custom_amount   → montant fixe saisi manuellement
            $table->decimal('custom_base_amount', 20, 2)->nullable();
            // Utilisé uniquement si base_type = 'custom_amount'
            // Date d'effet
            $table->date('effective_date');
            $table->date('end_date')->nullable(); // null = toujours actif
 
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
 
            $table->foreignUuid('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
 
            $table->timestamps();
 
            $table->index(['broker_id', 'is_active', 'effective_date']);
            $table->index(['contract_id', 'is_active']);
            $table->index(['tenant_id', 'broker_id']);
        });
 
        DB::statement("ALTER TABLE commission_rules ADD CONSTRAINT cr_rate_check
            CHECK (rate_pct >= 0 AND rate_pct <= 100)");
 
        DB::statement("ALTER TABLE commission_rules ADD CONSTRAINT cr_base_type_check
            CHECK (base_type IN ('prime_total','insured_value','custom_amount'))");
 
        // Index partiel pour règles actives
        DB::statement("CREATE INDEX idx_commission_rules_active
            ON commission_rules(broker_id, effective_date DESC)
            WHERE is_active = TRUE AND end_date IS NULL");
 
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_rules');
    }
};
