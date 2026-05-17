<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * US-056 — Optimisation performances : index composites supplémentaires
 * Cible les requêtes les plus fréquentes (dashboard, rapports, commissions).
 * Note : CREATE INDEX sans CONCURRENTLY — verrou bref acceptable en déploiement.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Certificats ───────────────────────────────────────────
        DB::statement("CREATE INDEX IF NOT EXISTS idx_certs_tenant_issued_at
            ON certificates(tenant_id, issued_at DESC)
            WHERE status = 'ISSUED' AND deleted_at IS NULL");

        DB::statement("CREATE INDEX IF NOT EXISTS idx_certs_tenant_status_created
            ON certificates(tenant_id, status, created_at DESC)
            WHERE deleted_at IS NULL");

        DB::statement("CREATE INDEX IF NOT EXISTS idx_certs_transport
            ON certificates(transport_type, issued_at DESC)
            WHERE deleted_at IS NULL");

        // ── Transactions de commissions ───────────────────────────
        DB::statement('CREATE INDEX IF NOT EXISTS idx_comm_tx_period
            ON commission_transactions(tenant_id, period_month, status)');

        DB::statement('CREATE INDEX IF NOT EXISTS idx_comm_tx_broker_status
            ON commission_transactions(broker_id, status, paid_at DESC)');

        // ── Approbations ──────────────────────────────────────────
        DB::statement('CREATE INDEX IF NOT EXISTS idx_approval_tenant_status
            ON approval_requests(tenant_id, status)');

        // ── Exports asynchrones ───────────────────────────────────
        DB::statement("CREATE INDEX IF NOT EXISTS idx_report_exec_expires
            ON report_executions(expires_at)
            WHERE expires_at IS NOT NULL AND status = 'COMPLETED'");

        // ── Contrats ──────────────────────────────────────────────
        DB::statement("CREATE INDEX IF NOT EXISTS idx_contracts_expiry_active
            ON insurance_contracts(expiry_date ASC)
            WHERE status = 'ACTIVE' AND deleted_at IS NULL");
    }

    public function down(): void
    {
        foreach ([
            'idx_certs_tenant_issued_at',
            'idx_certs_tenant_status_created',
            'idx_certs_transport',
            'idx_comm_tx_period',
            'idx_comm_tx_broker_status',
            'idx_approval_tenant_status',
            'idx_report_exec_expires',
            'idx_contracts_expiry_active',
        ] as $index) {
            DB::statement("DROP INDEX IF EXISTS {$index}");
        }
    }
};
