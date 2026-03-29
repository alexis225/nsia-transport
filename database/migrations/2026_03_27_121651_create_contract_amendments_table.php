<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * ============================================================
 * Migration — contract_amendments
 * ============================================================
 * Un avenant trace chaque modification d'un contrat actif.
 * Il capture l'état AVANT et APRÈS et passe par un workflow
 * de validation avant application.
 *
 * Workflow : DRAFT → PENDING → APPROVED (appliqué) | REJECTED
 * ============================================================
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_amendments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('contract_id')
                  ->constrained('insurance_contracts')
                  ->cascadeOnDelete();

            $table->foreignUuid('tenant_id')
                  ->constrained('tenants');

            // ── Numérotation ──────────────────────────────────
            $table->string('amendment_number', 30); // ex: AV-CI-OP-2024-000001-001
            $table->unsignedSmallInteger('sequence')->default(1); // 1er, 2ème avenant...

            // ── Motif ─────────────────────────────────────────
            $table->string('reason', 255);           // motif de l'avenant
            $table->text('description')->nullable(); // description détaillée

            // ── Champs modifiés (avant / après) ───────────────
            // JSON des champs modifiés : { "field": { "before": x, "after": y } }
            $table->json('changes');

            // ── Statut ────────────────────────────────────────
            $table->string('status', 20)->default('DRAFT');
            // DRAFT | PENDING | APPROVED | REJECTED

            // ── Workflow ──────────────────────────────────────
            $table->foreignUuid('submitted_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();

            $table->foreignUuid('reviewed_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();

            $table->timestamp('applied_at')->nullable(); // date d'application effective

            // ── Méta ──────────────────────────────────────────
            $table->foreignUuid('created_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['contract_id', 'sequence']);
            $table->index(['contract_id', 'status']);
        });

        DB::statement("ALTER TABLE contract_amendments ADD CONSTRAINT ca_status_check
            CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_amendments');
    }
};