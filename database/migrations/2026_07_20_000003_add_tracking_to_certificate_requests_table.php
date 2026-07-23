<?php

/**
 * ============================================================
 * MIGRATION — suivi de bout en bout des demandes de certificat
 * ============================================================
 * - assigned_to/assigned_at : prise en charge par un agent
 *   (transition PENDING → IN_REVIEW)
 * - certificate_id : rattachement au certificat réellement
 *   émis une fois créé dans le module Certificats.
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificate_requests', function (Blueprint $table) {
            $table->foreignUuid('assigned_to')->nullable()->after('created_by')
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable()->after('assigned_to');

            $table->foreignUuid('certificate_id')->nullable()->after('review_notes')
                  ->constrained('certificates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('certificate_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_to');
            $table->dropColumn('assigned_at');
            $table->dropConstrainedForeignId('certificate_id');
        });
    }
};
