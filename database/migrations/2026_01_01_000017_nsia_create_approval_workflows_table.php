<?php

/**
 * ============================================================
 * MIGRATION 19 — approval_workflows
 * Définition des workflows de validation par filiale.
 * Configurable : conditions de déclenchement + étapes ordonnées.
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
        Schema::create('approval_workflows', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();

            $table->string('name');
            $table->string('entity_type', 50); // CERTIFICATE | CONTRACT

            /**
             * trigger_condition (JSONB) — exemple :
             * {"insured_value": {">": 1000000}, "transport_mode": "AIR"}
             * NULL = s'applique toujours
             */
            $table->json('trigger_condition')->nullable();

            /**
             * steps_config (JSONB) — exemple :
             * [
             *   {"step": 1, "role": "souscripteur", "label": "Validation souscripteur"},
             *   {"step": 2, "role": "admin_filiale", "label": "Approbation finale"}
             * ]
             */
            $table->json('steps_config');

            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        DB::statement("ALTER TABLE approval_workflows ADD CONSTRAINT aw_entity_check
            CHECK (entity_type IN ('CERTIFICATE','CONTRACT'))");

        DB::statement('CREATE INDEX idx_workflows_tenant ON approval_workflows(tenant_id, entity_type, is_active)');
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_workflows');
    }
};
