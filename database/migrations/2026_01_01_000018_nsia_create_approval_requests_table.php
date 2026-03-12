<?php

/**
 * ============================================================
 * MIGRATION 20 — approval_requests
 * Instance d'un workflow en cours sur une entité donnée.
 * Une entité (certificat, contrat) ne peut avoir qu'une seule
 * demande PENDING à la fois.
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
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')->constrained('tenants');

            // Entité concernée (polymorphique simple)
            $table->string('entity_type', 50); // CERTIFICATE | CONTRACT
            $table->uuid('entity_id');          // id du certificat ou contrat

            $table->foreignUuid('workflow_id')
                  ->nullable()
                  ->constrained('approval_workflows')
                  ->nullOnDelete();

            $table->unsignedSmallInteger('current_step')->default(1);
            $table->unsignedSmallInteger('total_steps');

            $table->string('status', 30)->default('PENDING');
            // PENDING | APPROVED | REJECTED | CANCELLED

            $table->foreignUuid('requested_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->foreignUuid('resolved_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('due_date')->nullable();   // délai de réponse attendu
            $table->text('notes')->nullable();

            $table->timestamps();
        });

        DB::statement("ALTER TABLE approval_requests ADD CONSTRAINT ar_status_check
            CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED'))");

        DB::statement("ALTER TABLE approval_requests ADD CONSTRAINT ar_entity_check
            CHECK (entity_type IN ('CERTIFICATE','CONTRACT'))");

        DB::statement('CREATE INDEX idx_approval_entity ON approval_requests(entity_type, entity_id)');
        DB::statement('CREATE INDEX idx_approval_tenant_status ON approval_requests(tenant_id, status)');
        DB::statement("CREATE INDEX idx_approval_pending ON approval_requests(tenant_id, due_date)
            WHERE status = 'PENDING'");
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_requests');
    }
};
