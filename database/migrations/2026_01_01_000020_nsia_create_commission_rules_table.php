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

            $table->foreignUuid('tenant_id')->constrained('tenants');
            $table->foreignUuid('broker_id')->constrained('brokers');

            // NULL = règle générale courtier ; NOT NULL = règle propre au contrat
            $table->foreignUuid('contract_id')
                  ->nullable()
                  ->constrained('insurance_contracts')
                  ->nullOnDelete();

            $table->decimal('rate', 5, 2);               // % commission
            $table->string('applies_to', 30)->default('PREMIUM'); // PREMIUM | NET_PREMIUM

            $table->date('effective_date');
            $table->date('expiry_date')->nullable();

            $table->boolean('is_active')->default(true);

            $table->foreignUuid('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('created_at')->useCurrent();

            // Unicité : une seule règle active par (tenant, courtier, contrat, date d'effet)
            $table->unique(['tenant_id', 'broker_id', 'contract_id', 'effective_date']);
        });

        DB::statement("ALTER TABLE commission_rules ADD CONSTRAINT cr_applies_check
            CHECK (applies_to IN ('PREMIUM','NET_PREMIUM'))");

        DB::statement("CREATE INDEX idx_commission_rules_active ON commission_rules
            (tenant_id, broker_id, effective_date)
            WHERE is_active = true");
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_rules');
    }
};
