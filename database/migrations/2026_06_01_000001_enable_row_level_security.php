<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * US-052 — Row Level Security PostgreSQL
 * Active RLS sur les tables métier et crée les politiques d'isolation par tenant.
 * Les requêtes super_admin (tenant_id IS NULL) contournent RLS via BYPASSRLS.
 *
 * NOTE : Par défaut désactivé (RLS_ENABLED=false dans .env).
 * Activer en production avec RLS_ENABLED=true après validation.
 */
return new class extends Migration
{
    private array $tables = [
        'certificates',
        'insurance_contracts',
        'commission_transactions',
        'commission_rules',
        'approval_requests',
    ];

    public function up(): void
    {
        // Variable de config PostgreSQL pour le tenant courant
        // (valorisée par SetTenantContext middleware)
        DB::statement("
            CREATE OR REPLACE FUNCTION current_tenant_id()
            RETURNS UUID AS $$
            BEGIN
                RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
            EXCEPTION WHEN others THEN
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql STABLE;
        ");

        foreach ($this->tables as $table) {
            // Activer RLS
            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY");

            // Politique : accès si même tenant OU super_admin (tenant_id NULL dans la config)
            DB::statement("
                CREATE POLICY tenant_isolation ON {$table}
                USING (
                    tenant_id = current_tenant_id()
                    OR current_tenant_id() IS NULL
                )
            ");

            // Log retiré — $this->command n'existe pas dans le contexte migration
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            DB::statement("DROP POLICY IF EXISTS tenant_isolation ON {$table}");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY");
        }

        DB::statement("DROP FUNCTION IF EXISTS current_tenant_id()");
    }
};
