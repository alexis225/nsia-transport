<?php

/**
 * ============================================================
 * MIGRATION 23 — commission_transactions
 * Commission calculée et enregistrée à l'émission de chaque
 * certificat. Utilisée pour les bordereaux primes nettes/brutes.
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
        Schema::create('commission_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('tenant_id')
                ->constrained('tenants');
            $table->foreignUuid('certificate_id')
                ->constrained('certificates')
                ->cascadeOnDelete();

            $table->foreignUuid('contract_id')
                ->constrained('insurance_contracts');

            $table->foreignUuid('broker_id')
                ->nullable()
                ->constrained('brokers')
                ->nullOnDelete();

            $table->foreignUuid('commission_rule_id')
                ->nullable()
                ->constrained('commission_rules')
                ->nullOnDelete();

            // Valeurs calculées
            $table->char('currency_code', 3);
            $table->decimal('prime_brute',    20, 2); // prime_total du certificat
            $table->decimal('rate_pct',        5, 2); // taux appliqué
            $table->decimal('commission',     20, 2); // prime_brute * rate_pct / 100
            $table->decimal('prime_nette',    20, 2); // prime_brute - commission

            // Période comptable
            $table->string('period_month', 7);
            // Format : YYYY-MM ex: 2026-05

            // Statut paiement
            $table->string('status', 20)->default('PENDING');
            // PENDING | PAID | CANCELLED

            $table->timestamp('paid_at')->nullable();
            $table->foreignUuid('paid_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['broker_id', 'period_month']);
            $table->index(['tenant_id', 'period_month', 'status']);
            $table->index(['certificate_id']);
        });
 
        DB::statement("ALTER TABLE commission_transactions ADD CONSTRAINT ct_status_check
            CHECK (status IN ('PENDING','PAID','CANCELLED'))");
 
        DB::statement("CREATE UNIQUE INDEX idx_commission_cert_unique
            ON commission_transactions(certificate_id)
            WHERE status != 'CANCELLED'");
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_transactions');
    }
};
