<?php

/**
 * ============================================================
 * MIGRATION — certificates
 * ============================================================
 * Certificats d'assurance transport émis par NSIA.
 * Chaque certificat est lié à un contrat (insurance_contracts)
 * et à un modèle de template (certificate_templates).
 *
 * Workflow : DRAFT → SUBMITTED → ISSUED → CANCELLED
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
        Schema::create('certificates', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // ── Liens principaux ──────────────────────────────
            $table->foreignUuid('tenant_id')
                  ->constrained('tenants');

            $table->foreignUuid('contract_id')
                  ->constrained('insurance_contracts')
                  ->cascadeOnDelete();

            $table->foreignUuid('template_id')
                  ->nullable()
                  ->constrained('certificate_templates')
                  ->nullOnDelete();

            // ── Numérotation ──────────────────────────────────
            $table->string('certificate_number', 50)->unique(); // ex: N°041260
            $table->string('policy_number', 100);               // dénormalisé depuis contrat

            // ── Assuré ────────────────────────────────────────
            $table->string('insured_name', 200);
            $table->text('insured_ref')->nullable();             // références assuré

            // ── Voyage ────────────────────────────────────────
            $table->date('voyage_date');                         // date d'expédition
            $table->string('voyage_from', 150);                  // lieu de départ
            $table->string('voyage_to', 150);                    // lieu de destination
            $table->string('voyage_via', 150)->nullable();       // via / transit

            // Mode de transport principal
            $table->string('transport_type', 20)->nullable();    // SEA | AIR | ROAD | RAIL
            $table->string('vessel_name', 150)->nullable();      // nom navire S/S
            $table->string('flight_number', 50)->nullable();     // numéro de vol
            $table->string('voyage_mode', 50)->nullable();       // CONTAINER | GROUPAGE | CONVENTIONNEL | BOUT_EN_BOUT

            // ── Détails expédition ────────────────────────────
            // Tableau JSON des lignes de marchandises
            // [{
            //   "marks": "NSIA-001",
            //   "package_numbers": "1 à 10",
            //   "package_count": 10,
            //   "weight": "500 kg",
            //   "nature": "Électronique",
            //   "packaging": "Cartons",
            //   "insured_value": 5000000
            // }]
            $table->json('expedition_items')->default('[]');

            // ── Valeurs financières ───────────────────────────
            $table->char('currency_code', 3);
            $table->decimal('insured_value', 20, 2);             // valeur d'assurance en chiffres
            $table->text('insured_value_letters')->nullable();   // valeur en lettres
            $table->string('guarantee_mode', 100)->nullable();   // mode de garantie

            // ── Décompte de prime (JSON flexible) ────────────
            // Reprend la structure prime_breakdown_lines du template
            // [{
            //   "key": "ro", "label": "R.O./C.F.A",
            //   "rate": 0.5, "amount": 25000
            // }]
            $table->json('prime_breakdown')->nullable();
            $table->decimal('prime_total', 20, 2)->nullable();   // prime totale calculée

            // ── Taux de change ────────────────────────────────
            $table->char('exchange_currency', 3)->nullable();    // devise de cotation
            $table->decimal('exchange_rate', 12, 6)->nullable(); // cours (Togo : unité monétaire + cours)

            // ── Statut & Workflow ─────────────────────────────
            $table->string('status', 30)->default('DRAFT');
            // DRAFT | SUBMITTED | ISSUED | CANCELLED

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();

            // ── Validation ────────────────────────────────────
            $table->foreignUuid('issued_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->foreignUuid('submitted_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->text('validation_notes')->nullable();

            // ── PDF ───────────────────────────────────────────
            $table->string('pdf_path', 255)->nullable();         // chemin storage
            $table->timestamp('pdf_generated_at')->nullable();

            // ── Méta ──────────────────────────────────────────
            $table->foreignUuid('created_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Index
            $table->index(['tenant_id', 'status']);
            $table->index(['contract_id']);
            $table->index(['voyage_date']);
        });

        // Contraintes CHECK
        DB::statement("ALTER TABLE certificates ADD CONSTRAINT cert_status_check
            CHECK (status IN ('DRAFT','SUBMITTED','ISSUED','CANCELLED'))");

        DB::statement("ALTER TABLE certificates ADD CONSTRAINT cert_transport_check
            CHECK (transport_type IS NULL OR transport_type IN ('SEA','AIR','ROAD','RAIL','MULTIMODAL'))");

        // Index partiels PostgreSQL
        DB::statement("CREATE INDEX idx_cert_issued
            ON certificates(tenant_id, issued_at DESC)
            WHERE status = 'ISSUED'");

        DB::statement("CREATE INDEX idx_cert_pending
            ON certificates(tenant_id, submitted_at DESC)
            WHERE status = 'SUBMITTED'");

        DB::statement("CREATE INDEX idx_cert_number
            ON certificates(certificate_number)");
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};