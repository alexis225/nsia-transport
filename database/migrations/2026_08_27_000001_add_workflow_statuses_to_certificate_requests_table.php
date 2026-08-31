<?php

/**
 * ============================================================
 * MIGRATION — Workflow complet Module 1 (Rapport DTAG 14/08/2026)
 * ============================================================
 * Élargit le cycle de vie des demandes de certificat au workflow
 * interactif décrit dans le rapport :
 *   PENDING (Transmise) → IN_REVIEW (En cours d'analyse)
 *     → INFO_REQUESTED (Complément demandé) → [partenaire complète
 *       son dossier → retour à IN_REVIEW]
 *     → APPROVED (Validée) → FULFILLED (Certificat émis)
 *     → CLOSED (Clôturée)
 *   REJECTED (Rejetée) — terminal, atteignable depuis PENDING/
 *   IN_REVIEW/INFO_REQUESTED.
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
        DB::statement('ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS cert_req_status_check');

        DB::statement("ALTER TABLE certificate_requests ADD CONSTRAINT cert_req_status_check
            CHECK (status IN ('PENDING','IN_REVIEW','INFO_REQUESTED','APPROVED','FULFILLED','CLOSED','REJECTED'))");

        Schema::table('certificate_requests', function (Blueprint $table) {
            // Complément demandé par le staff — message + horodatage.
            $table->timestamp('info_requested_at')->nullable()->after('review_notes');
            $table->text('info_request_notes')->nullable()->after('info_requested_at');

            // Réponse du partenaire lors du renvoi du dossier complété.
            $table->timestamp('completed_at')->nullable()->after('info_request_notes');
            $table->text('completion_notes')->nullable()->after('completed_at');

            // Clôture manuelle par le staff une fois le certificat émis.
            $table->timestamp('closed_at')->nullable()->after('completion_notes');
        });
    }

    public function down(): void
    {
        Schema::table('certificate_requests', function (Blueprint $table) {
            $table->dropColumn(['info_requested_at', 'info_request_notes', 'completed_at', 'completion_notes', 'closed_at']);
        });

        DB::statement('ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS cert_req_status_check');
        DB::statement("ALTER TABLE certificate_requests ADD CONSTRAINT cert_req_status_check
            CHECK (status IN ('PENDING','IN_REVIEW','APPROVED','REJECTED'))");
    }
};
