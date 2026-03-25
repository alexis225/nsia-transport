<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ============================================================
 * Migration certificate_templates — US-013
 * ============================================================
 * Un modèle de certificat par filiale.
 * Stocke la configuration visuelle et les champs du certificat.
 * ============================================================
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();

            // ── Identification ────────────────────────────────
            $table->string('name', 150);                    // ex: "Certificat NSIA Gabon"
            $table->string('code', 20)->unique();           // ex: GA, GN, TG
            $table->enum('type', [
                'ordre_assurance',                          // Gabon, Togo
                'certificat_assurance',                     // Guinée
            ])->default('ordre_assurance');

            // ── En-tête filiale ───────────────────────────────
            $table->string('company_name', 150);            // NSIA Gabon, NSIA Assurances...
            $table->string('company_address', 255)->nullable();
            $table->string('company_phone', 100)->nullable();
            $table->string('company_email', 150)->nullable();
            $table->string('company_website', 150)->nullable();
            $table->string('company_rccm', 100)->nullable(); // N° RCCM
            $table->string('company_capital', 100)->nullable(); // Capital social
            $table->string('logo_path', 255)->nullable();   // Logo filiale

            // ── Paramètres légaux ─────────────────────────────
            $table->string('legal_framework', 255)->nullable(); // "Régie par le code CIMA..."
            $table->string('police_prefix', 20)->nullable(); // Préfixe numéro de police
            $table->char('currency_code', 3)->default('XOF');
            $table->string('city', 100)->nullable();         // "A LIBREVILLE", "A LOME"

            // ── Options du formulaire ─────────────────────────
            $table->boolean('is_bilingual')->default(false);    // FR + EN (Guinée)
            $table->boolean('has_container_options')->default(true); // Container/Groupage/Conventionnel
            $table->boolean('has_flight_number')->default(true);
            $table->boolean('has_vessel_name')->default(true);
            $table->boolean('has_currency_rate')->default(false);  // Togo : Unité monétaire + Cours

            // ── Décompte de prime ─────────────────────────────
            // Structure JSON : liste des lignes du décompte
            // ex: [{"key":"ro","label":"R.O./C.F.A","label_en":"O.R"},...]
            $table->json('prime_breakdown_lines')->nullable();

            // ── Textes légaux ─────────────────────────────────
            $table->text('footer_text')->nullable();         // Texte important en bas
            $table->text('claims_text')->nullable();         // Texte verso (formalités sinistre)
            $table->text('conditions_text')->nullable();     // Conditions générales

            // ── Numérotation ──────────────────────────────────
            $table->string('number_prefix', 10)->nullable(); // "N°", "Nr"
            $table->unsignedInteger('number_padding')->default(6); // Nb de chiffres : 041259
            $table->unsignedInteger('last_number')->default(0);    // Dernier numéro utilisé

            // ── Statut ────────────────────────────────────────
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id']); // 1 template actif par filiale
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_templates');
    }
};