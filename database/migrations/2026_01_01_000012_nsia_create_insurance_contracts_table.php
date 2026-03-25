<?php

/**
 * ============================================================
 * MIGRATION — insurance_contracts (VERSION COMPLÈTE)
 * ============================================================
 * Fusion de :
 *   - MIGRATION 14 (structure initiale)
 *   - Champs additifs US-014 v2 (incoterm, transport, taux détaillés,
 *     plafond utilisation, clauses/exclusions, workflow)
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

            // ── Identification ────────────────────────────────
            $table->string('contract_number', 100);
            $table->string('type', 30); // OPEN_POLICY | VOYAGE | ANNUAL_VOYAGE

            // ── Assuré ────────────────────────────────────────
            $table->string('insured_name');
            $table->text('insured_address')->nullable();
            $table->string('insured_email')->nullable();
            $table->string('insured_phone', 30)->nullable();

            // ── Financier ─────────────────────────────────────
            $table->char('currency_code', 3);
            $table->decimal('subscription_limit', 20, 2)->nullable();  // plafond NN300
            $table->decimal('used_limit', 20, 2)->default(0);           // cumul utilisé
            $table->decimal('premium_rate', 8, 5)->nullable();          // taux prime global (%)
            $table->decimal('deductible', 20, 2)->default(0);           // franchise

            // ── Taux détaillés (décompte prime) ───────────────
            $table->decimal('rate_ro',          8, 4)->nullable();      // R.O. %
            $table->decimal('rate_rg',          8, 4)->nullable();      // R.G. %
            $table->decimal('rate_surprime',    8, 4)->nullable();      // Surprime %
            $table->decimal('rate_accessories', 8, 4)->nullable();      // Accessoires %
            $table->decimal('rate_tax',         8, 4)->nullable();      // Taxe %

            // ── Garantie & Couverture ─────────────────────────
            $table->string('coverage_type', 50)->nullable(); // TOUS_RISQUES | FAP_SAUF | FAP_ABSOLUE
            $table->json('clauses')->default('[]');           // clauses applicables
            $table->json('exclusions')->default('[]');        // exclusions

            // ── Transport & Incoterm ──────────────────────────
            $table->char('incoterm_code', 5)->nullable();     // FOB, CIF, EXW...
            $table->unsignedBigInteger('transport_mode_id')->nullable();
            $table->foreign('transport_mode_id')
                  ->references('id')->on('transport_modes')
                  ->nullOnDelete();
            $table->string('transport_mode_detail', 100)->nullable(); // précision libre

            // ── Couvertures géographiques ─────────────────────
            $table->json('covered_countries')->nullable();    // codes ISO pays couverts

            // ── Validité ──────────────────────────────────────
            $table->date('effective_date');                   // date d'effet
            $table->date('expiry_date');                      // date d'expiration
            $table->unsignedSmallInteger('notice_period_days')->default(30); // préavis résiliation

            // ── Approbation / Workflow ────────────────────────
            $table->boolean('requires_approval')->default(false);
            $table->foreignUuid('approved_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('validation_notes')->nullable();     // notes approbation / motif rejet

            // ── Suspension ────────────────────────────────────
            $table->timestamp('suspended_at')->nullable();
            $table->text('suspension_reason')->nullable();

            // ── Statut ────────────────────────────────────────
            $table->string('status', 30)->default('DRAFT');
            // DRAFT | PENDING_APPROVAL | ACTIVE | SUSPENDED | EXPIRED | CANCELLED

            $table->text('notes')->nullable();               // notes internes

            // ── Compteurs certificats ─────────────────────────
            $table->unsignedInteger('certificates_count')->default(0);
            $table->unsignedInteger('certificates_limit')->nullable(); // null = illimité

            // ── Méta ──────────────────────────────────────────
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'contract_number']);
        });

        // ── Contraintes CHECK ─────────────────────────────────
        DB::statement("ALTER TABLE insurance_contracts ADD CONSTRAINT ic_type_check
            CHECK (type IN ('OPEN_POLICY','VOYAGE','ANNUAL_VOYAGE'))");

        DB::statement("ALTER TABLE insurance_contracts ADD CONSTRAINT ic_status_check
            CHECK (status IN ('DRAFT','PENDING_APPROVAL','ACTIVE','SUSPENDED','EXPIRED','CANCELLED'))");

        DB::statement("ALTER TABLE insurance_contracts ADD CONSTRAINT ic_coverage_check
            CHECK (coverage_type IS NULL OR coverage_type IN ('TOUS_RISQUES','FAP_SAUF','FAP_ABSOLUE'))");

        // ── Index ─────────────────────────────────────────────
        DB::statement("CREATE INDEX idx_contracts_tenant_status
            ON insurance_contracts(tenant_id, status)
            WHERE deleted_at IS NULL");

        DB::statement("CREATE INDEX idx_contracts_broker
            ON insurance_contracts(broker_id)
            WHERE deleted_at IS NULL");

        DB::statement("CREATE INDEX idx_contracts_expiry
            ON insurance_contracts(expiry_date)
            WHERE status = 'ACTIVE'");

        DB::statement("CREATE INDEX idx_contracts_insured
            ON insurance_contracts(tenant_id, insured_name)
            WHERE deleted_at IS NULL");

        DB::statement("CREATE INDEX idx_contracts_incoterm
            ON insurance_contracts(incoterm_code)
            WHERE deleted_at IS NULL");

        DB::statement("CREATE INDEX idx_contracts_transport
            ON insurance_contracts(transport_mode_id)
            WHERE deleted_at IS NULL");

        DB::statement("CREATE INDEX idx_contracts_number
            ON insurance_contracts(contract_number)");
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_contracts');
    }
};