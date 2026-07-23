<?php

/**
 * ============================================================
 * MIGRATION — certificate_requests
 * ============================================================
 * Demandes de certificat soumises par un partenaire/courtier
 * depuis l'espace self-service. Traitées ensuite par le staff
 * (souscripteur / admin filiale) — ne crée pas directement de
 * ligne dans `certificates` (contract_id réel requis).
 *
 * Workflow : PENDING → IN_REVIEW → APPROVED | REJECTED
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
        Schema::create('certificate_requests', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')->constrained('tenants');
            $table->foreignUuid('broker_id')->constrained('brokers');
            $table->foreignUuid('created_by')->constrained('users');

            // ── Pays concerné ─────────────────────────────────
            $table->char('country_code', 2)->nullable();

            // ── Expédition ────────────────────────────────────
            $table->string('insured_name', 200)->nullable();
            $table->string('voyage_from', 150)->nullable();
            $table->string('voyage_to', 150)->nullable();
            $table->date('voyage_date')->nullable();
            $table->string('transport_type', 20)->nullable(); // SEA | AIR | ROAD | RAIL
            $table->text('cargo_description')->nullable();

            // ── Valeurs ───────────────────────────────────────
            $table->decimal('estimated_value', 20, 2)->nullable();
            $table->char('currency_code', 3)->nullable();

            $table->text('notes')->nullable();

            // ── Statut & traitement staff ─────────────────────
            $table->string('status', 20)->default('PENDING');
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['broker_id']);
        });

        DB::statement("ALTER TABLE certificate_requests ADD CONSTRAINT cert_req_status_check
            CHECK (status IN ('PENDING','IN_REVIEW','APPROVED','REJECTED'))");

        DB::statement("ALTER TABLE certificate_requests ADD CONSTRAINT cert_req_transport_check
            CHECK (transport_type IS NULL OR transport_type IN ('SEA','AIR','ROAD','RAIL','MULTIMODAL'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_requests');
    }
};
