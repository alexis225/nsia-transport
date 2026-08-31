<?php

/**
 * ============================================================
 * MIGRATION — Brouillon + référence unique (rapport DTAG 14/08/2026)
 * ============================================================
 * Complète le workflow avec les deux statuts manquants du rapport :
 *   - DRAFT (Brouillon)     : demande enregistrée mais pas transmise,
 *                             invisible du staff.
 *   - COMPLETED (Complétée) : dossier retransmis par le partenaire
 *                             après un complément demandé, en attente
 *                             de ré-analyse (avant Validée).
 * Ajoute aussi une référence lisible unique (ex. DEM-2026-000123),
 * attribuée au moment de la transmission (DRAFT → PENDING), et la
 * date/heure de transmission elle-même (submitted_at).
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
        DB::statement('CREATE SEQUENCE IF NOT EXISTS certificate_request_reference_seq');

        Schema::table('certificate_requests', function (Blueprint $table) {
            $table->string('reference', 30)->nullable()->unique()->after('id');
            $table->timestamp('submitted_at')->nullable()->after('created_at');
        });

        DB::statement('ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS cert_req_status_check');
        DB::statement("ALTER TABLE certificate_requests ADD CONSTRAINT cert_req_status_check
            CHECK (status IN ('DRAFT','PENDING','IN_REVIEW','INFO_REQUESTED','COMPLETED','APPROVED','FULFILLED','CLOSED','REJECTED'))");
    }

    public function down(): void
    {
        Schema::table('certificate_requests', function (Blueprint $table) {
            $table->dropColumn(['reference', 'submitted_at']);
        });

        DB::statement('DROP SEQUENCE IF EXISTS certificate_request_reference_seq');

        DB::statement('ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS cert_req_status_check');
        DB::statement("ALTER TABLE certificate_requests ADD CONSTRAINT cert_req_status_check
            CHECK (status IN ('PENDING','IN_REVIEW','INFO_REQUESTED','APPROVED','FULFILLED','CLOSED','REJECTED'))");
    }
};
