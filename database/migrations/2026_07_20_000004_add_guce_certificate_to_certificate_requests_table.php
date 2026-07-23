<?php

/**
 * ============================================================
 * MIGRATION — rattachement d'un certificat importé (GUCE)
 * ============================================================
 * Une demande approuvée peut être clôturée soit par un
 * certificat généré (certificate_id, déjà en place), soit par
 * un certificat importé depuis une plateforme étatique (GUCE).
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
            $table->foreignUuid('guce_certificate_id')->nullable()->after('certificate_id')
                  ->constrained('guce_certificates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('certificate_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('guce_certificate_id');
        });
    }
};
