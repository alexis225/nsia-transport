<?php

/**
 * ============================================================
 * MIGRATION 24 — report_definitions
 * Templates de rapports configurables (KPI, états, bordereaux).
 * tenant_id NULL = rapport global DTAG visible par toutes filiales.
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
        Schema::create('report_definitions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // NULL = rapport global DTAG
            $table->foreignUuid('tenant_id')
                  ->nullable()
                  ->constrained('tenants')
                  ->nullOnDelete();

            $table->string('name');

            /**
             * Types de rapports :
             * CERTIFICATE_STATE | CONTRACT_STATE | COMMISSION_STATE
             * KPI_DASHBOARD | BROKER_STATEMENT | COINSURER_STATEMENT
             */
            $table->string('type', 60);

            /**
             * query_config (JSONB) — paramètres de la requête :
             * {"date_range": "current_month", "group_by": "broker", "filters": {...}}
             */
            $table->json('query_config');

            // Expression cron pour planification (NULL = manuel uniquement)
            $table->string('schedule', 100)->nullable(); // ex: "0 6 1 * *" = 1er du mois à 6h

            // Formats d'export autorisés pour ce rapport
            $table->json('export_formats')->default(json_encode(['PDF','EXCEL','CSV'])); // TEXT[] remplacé par JSONB

            $table->boolean('is_active')->default(true);

            $table->foreignUuid('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        DB::statement('CREATE INDEX idx_report_defs_tenant ON report_definitions(tenant_id, type, is_active)');
    }

    public function down(): void
    {
        Schema::dropIfExists('report_definitions');
    }
};
