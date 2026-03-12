<?php

/**
 * ============================================================
 * MIGRATION 14 — insurance_contracts
 * Contrats d'assurance transport par filiale
 * Types : OPEN_POLICY | VOYAGE | ANNUAL_VOYAGE
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
        Schema::create('insurance_contracts', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')->constrained('tenants');
            $table->foreignUuid('broker_id')
                  ->nullable()
                  ->constrained('brokers')
                  ->nullOnDelete();

            // Identification
            $table->string('contract_number', 100);
            $table->string('type', 30); // OPEN_POLICY | VOYAGE | ANNUAL_VOYAGE

            // Assuré
            $table->string('insured_name');
            $table->text('insured_address')->nullable();
            $table->string('insured_email')->nullable();
            $table->string('insured_phone', 30)->nullable();

            // Financier
            $table->char('currency_code', 3);
            $table->decimal('subscription_limit', 20, 2)->nullable();  // plafond NN 300
            $table->decimal('used_limit', 20, 2)->default(0);           // cumul utilisé
            $table->decimal('premium_rate', 8, 5)->nullable();          // taux prime (%)
            $table->decimal('deductible', 20, 2)->default(0);

            // Garantie
            $table->string('coverage_type', 50)->nullable(); // TOUS_RISQUES | FAP_SAUF | FAP_ABSOLUE
            $table->json('clauses')->default('[]');
            $table->json('exclusions')->default('[]');

            // Validité
            $table->date('effective_date');
            $table->date('expiry_date');
            $table->unsignedSmallInteger('notice_period_days')->default(30);

            // Validation NN 300
            $table->boolean('requires_approval')->default(false);
            $table->foreignUuid('approved_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->string('status', 30)->default('DRAFT');
            $table->text('notes')->nullable();

            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'contract_number']);
        });

        // Contraintes CHECK
        DB::statement("ALTER TABLE insurance_contracts ADD CONSTRAINT ic_type_check
            CHECK (type IN ('OPEN_POLICY','VOYAGE','ANNUAL_VOYAGE'))");

        DB::statement("ALTER TABLE insurance_contracts ADD CONSTRAINT ic_status_check
            CHECK (status IN ('DRAFT','ACTIVE','SUSPENDED','EXPIRED','CANCELLED'))");

        DB::statement("ALTER TABLE insurance_contracts ADD CONSTRAINT ic_coverage_check
            CHECK (coverage_type IS NULL OR coverage_type IN ('TOUS_RISQUES','FAP_SAUF','FAP_ABSOLUE'))");

        // Index
        DB::statement('CREATE INDEX idx_contracts_tenant_status ON insurance_contracts(tenant_id, status) WHERE deleted_at IS NULL');
        DB::statement('CREATE INDEX idx_contracts_broker        ON insurance_contracts(broker_id) WHERE deleted_at IS NULL');
        DB::statement("CREATE INDEX idx_contracts_expiry        ON insurance_contracts(expiry_date) WHERE status = 'ACTIVE'");
        DB::statement('CREATE INDEX idx_contracts_insured       ON insurance_contracts(tenant_id, insured_name) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_contracts');
    }
};
