<?php

/**
 * ============================================================
 * MIGRATION 28 — audit_logs
 * Journal de sécurité immuable — append-only, partitionné
 * par année (RANGE created_at), comme les certificates.
 *
 * Alimente le SIEM (Splunk / Elastic) via log forwarding.
 * Conservé 7 ans minimum (conformité RGPD & réglementations).
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS audit_logs (
                id           UUID         NOT NULL DEFAULT gen_random_uuid(),

                tenant_id    UUID,                    -- NULL = action globale DTAG
                user_id      UUID,
                user_email   VARCHAR(255),            -- dénormalisé (pérennité après suppression user)

                session_id   UUID,                    -- référence user_sessions.id (pas de FK)

                action       VARCHAR(100) NOT NULL,
                -- ex: user.login | user.block | certificate.issue | certificate.cancel
                --     contract.approve | report.export | ip.blocked | mfa.enabled

                entity_type  VARCHAR(100),            -- User | Certificate | Contract | Broker...
                entity_id    UUID,

                old_values   JSONB,
                new_values   JSONB,

                ip_address   INET,
                user_agent   TEXT,
                request_id   UUID,                    -- X-Request-ID HTTP header

                severity     VARCHAR(20) NOT NULL DEFAULT 'INFO'
                             CHECK (severity IN ('INFO','WARNING','ERROR','CRITICAL')),

                metadata     JSONB DEFAULT '{}',      -- données contextuelles supplémentaires

                created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                PRIMARY KEY (id, created_at)           -- composite pour PARTITION BY RANGE
            ) PARTITION BY RANGE (created_at)
        ");

        // ── Partitions annuelles ─────────────────────────────
        $currentYear = (int) date('Y');
        foreach (range(2024, $currentYear + 1) as $year) {
            $next = $year + 1;
            DB::statement("
                CREATE TABLE IF NOT EXISTS audit_logs_{$year}
                PARTITION OF audit_logs
                FOR VALUES FROM ('{$year}-01-01') TO ('{$next}-01-01')
            ");
        }

        // ── Index ────────────────────────────────────────────
        DB::statement('CREATE INDEX idx_audit_tenant   ON audit_logs(tenant_id, created_at DESC)');
        DB::statement('CREATE INDEX idx_audit_user     ON audit_logs(user_id, created_at DESC)');
        DB::statement('CREATE INDEX idx_audit_entity   ON audit_logs(entity_type, entity_id, created_at DESC)');
        DB::statement('CREATE INDEX idx_audit_action   ON audit_logs(action, created_at DESC)');
        DB::statement("CREATE INDEX idx_audit_critical ON audit_logs(severity, created_at DESC)
            WHERE severity IN ('WARNING','ERROR','CRITICAL')");
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS audit_logs CASCADE');
    }
};
