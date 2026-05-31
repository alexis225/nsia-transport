<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guce_certificates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('imported_by')->constrained('users');

            // Références GUCE
            $table->string('guce_reference')->unique()->comment('Référence requête ex: INS2024101765');
            $table->string('certificate_number')->comment('N° certificat ex: 41612024005384');
            $table->string('policy_number')->nullable()->comment('Application à la police N°');
            $table->string('fdi_reference')->nullable()->comment('Référence FDI');

            // Assuré
            $table->string('insured_name');
            $table->text('insured_address')->nullable();

            // Marchandises & transport
            $table->text('cargo_description')->nullable();
            $table->string('weight')->nullable();
            $table->string('marks')->nullable();
            $table->string('vessel')->nullable();
            $table->string('origin')->nullable();
            $table->string('destination')->nullable();
            $table->date('transit_date')->nullable();

            // Valeurs financières
            $table->decimal('insured_value', 15, 2)->nullable();
            $table->string('currency', 10)->default('XOF');
            $table->decimal('total_premium', 15, 2)->nullable();

            // Fichier joint (PDF ou Word)
            $table->string('file_path');
            $table->string('file_original_name');
            $table->string('file_mime_type')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'guce_reference']);
            $table->index(['tenant_id', 'certificate_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guce_certificates');
    }
};
