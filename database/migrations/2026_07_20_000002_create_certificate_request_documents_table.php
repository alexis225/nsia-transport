<?php

/**
 * ============================================================
 * MIGRATION — certificate_request_documents
 * ============================================================
 * Pièces justificatives déposées par le partenaire pour une
 * demande de certificat (certificate_requests).
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
        Schema::create('certificate_request_documents', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('certificate_request_id')
                  ->constrained('certificate_requests')
                  ->cascadeOnDelete();

            $table->string('file_path', 255);
            $table->string('file_original_name', 255);
            $table->string('file_mime_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('document_type', 100)->nullable();

            $table->foreignUuid('uploaded_by')->constrained('users');

            $table->timestamps();

            $table->index(['certificate_request_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_request_documents');
    }
};
