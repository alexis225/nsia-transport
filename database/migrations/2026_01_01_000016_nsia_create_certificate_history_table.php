<?php

/**
 * ============================================================
 * MIGRATION 18 — certificate_history
 * Journal immuable de toutes les modifications sur un certificat.
 * Alimenté automatiquement par CertificateObserver.
 *
 * Note : pas de FK vers certificates car c'est une table
 * partitionnée (PostgreSQL ne supporte pas les FK
 * vers des tables partitionnées en cible).
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
        Schema::create('certificate_history', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // Pas de FK directe : certificate est partitionné
            $table->uuid('certificate_id')->index();

            $table->string('action', 50); // CREATED | UPDATED | SUBMITTED | APPROVED |
                                          // ISSUED | CANCELLED | DUPLICATED | PDF_GENERATED

            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();

            // Tableau PostgreSQL natif des champs modifiés
            $table->json('changed_fields')->nullable()->default('[]'); // TEXT[] remplacé par JSONB (cast 'array' dans le modèle)

            $table->foreignUuid('performed_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('performed_at')->useCurrent();
            $table->ipAddress('ip_address')->nullable();
            $table->text('comment')->nullable();
        });

        DB::statement('CREATE INDEX idx_cert_history ON certificate_history(certificate_id, performed_at DESC)');
        DB::statement('CREATE INDEX idx_cert_history_action ON certificate_history(action, performed_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_history');
    }
};
