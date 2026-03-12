<?php

/**
 * ============================================================
 * MIGRATION 17 — certificate_sequences
 * Compteurs de numérotation par filiale / année / préfixe
 *
 * Utilisé exclusivement via CertificateNumberService
 * avec SELECT ... FOR UPDATE pour éviter toute collision.
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_sequences', function (Blueprint $table) {
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->string('prefix', 20)->default('CT'); // CT, AV, DUP...
            $table->unsignedBigInteger('last_value')->default(0);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->primary(['tenant_id', 'year', 'prefix']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_sequences');
    }
};
