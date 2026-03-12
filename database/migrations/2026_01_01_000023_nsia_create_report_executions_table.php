<?php

/**
 * ============================================================
 * MIGRATION 25 — report_executions
 * Historique des exports générés (asynchrones via Queue Redis).
 * Le fichier généré est stocké sur S3 avec expiration auto.
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
        Schema::create('report_executions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('report_id')
                  ->nullable()   // NULL = export ad-hoc sans template enregistré
                  ->constrained('report_definitions')
                  ->nullOnDelete();

            $table->foreignUuid('tenant_id')
                  ->nullable()
                  ->constrained('tenants')
                  ->nullOnDelete();

            $table->foreignUuid('requested_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // Paramètres de filtrage appliqués au moment de l'export
            $table->json('parameters')->default('{}');

            $table->string('format', 10); // PDF | EXCEL | CSV

            $table->string('status', 20)->default('QUEUED');
            // QUEUED | PROCESSING | COMPLETED | FAILED

            // Résultat
            $table->text('file_path')->nullable();   // chemin S3
            $table->unsignedBigInteger('file_size')->nullable(); // octets
            $table->unsignedInteger('row_count')->nullable();
            $table->text('error_message')->nullable();

            // Timing
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            // Purge automatique du fichier S3 après cette date
            $table->timestamp('expires_at')->nullable();

            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("ALTER TABLE report_executions ADD CONSTRAINT re_status_check
            CHECK (status IN ('QUEUED','PROCESSING','COMPLETED','FAILED'))");

        DB::statement("ALTER TABLE report_executions ADD CONSTRAINT re_format_check
            CHECK (format IN ('PDF','EXCEL','CSV'))");

        DB::statement('CREATE INDEX idx_executions_tenant ON report_executions(tenant_id, created_at DESC)');
        DB::statement('CREATE INDEX idx_executions_user   ON report_executions(requested_by, created_at DESC)');
        DB::statement("CREATE INDEX idx_executions_queued ON report_executions(status, created_at)
            WHERE status IN ('QUEUED','PROCESSING')");
    }

    public function down(): void
    {
        Schema::dropIfExists('report_executions');
    }
};
