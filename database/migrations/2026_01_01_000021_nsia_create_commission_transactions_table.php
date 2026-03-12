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

            $table->foreignUuid('tenant_id')->constrained('tenants');
            $table->foreignUuid('broker_id')->constrained('brokers');

            // Pas de FK directe vers certificates (table partitionnée)
            $table->uuid('certificate_id');

            $table->foreignUuid('contract_id')
                  ->constrained('insurance_contracts');

            $table->foreignUuid('rule_id')
                  ->nullable()
                  ->constrained('commission_rules')
                  ->nullOnDelete();

            $table->char('currency_code', 3);

            // Montants
            $table->decimal('gross_premium', 20, 2);
            $table->decimal('commission_rate', 5, 2);
            $table->decimal('commission_amount', 20, 2);
            $table->decimal('net_premium', 20, 2);

            // Période de rattachement pour les bordereaux (ex: "2025-03")
            $table->char('period_month', 7);

            $table->string('status', 30)->default('PENDING');
            // PENDING | VALIDATED | PAID | DISPUTED

            $table->timestamp('settled_at')->nullable();

            $table->timestamps();
        });

        DB::statement("ALTER TABLE commission_transactions ADD CONSTRAINT ct_status_check
            CHECK (status IN ('PENDING','VALIDATED','PAID','DISPUTED'))");

        DB::statement('CREATE INDEX idx_commission_broker_period
            ON commission_transactions(tenant_id, broker_id, period_month)');

        DB::statement('CREATE INDEX idx_commission_cert
            ON commission_transactions(certificate_id)');

        DB::statement("CREATE INDEX idx_commission_pending
            ON commission_transactions(tenant_id, status)
            WHERE status IN ('PENDING','DISPUTED')");
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_transactions');
    }
};
