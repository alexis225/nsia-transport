<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ============================================================
 * Migration certificate_print_templates
 * ============================================================
 * Positionnement (mm) des champs imprimés par-dessus les souches
 * carnet par pays (cf. resources/js/pages/admin/certificates/
 * print-templates/*.tsx). Une ligne par template_id du registre
 * front-end (togo, gabon, ...) — pas de FK, le référentiel des
 * pays vit côté front (registry.ts). Absence de ligne = le
 * composant du pays utilise ses coordonnées codées en dur.
 * ============================================================
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_print_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('template_id', 40)->unique();
            $table->json('positions')->nullable();
            $table->string('base_pdf_path', 255)->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_print_templates');
    }
};
