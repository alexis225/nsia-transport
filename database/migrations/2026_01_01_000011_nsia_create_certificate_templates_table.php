<?php

/**
 * ============================================================
 * MIGRATION 13 — certificate_templates
 * Modèles PDF personnalisables par filiale
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')->constrained('tenants');

            $table->string('name');
            $table->text('file_path');          // chemin S3 du template Blade/HTML
            $table->boolean('is_default')->default(false);
            $table->string('version', 20);      // ex: "1.0", "2.1"
            $table->boolean('is_active')->default(true);

            $table->foreignUuid('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps();
        });

        // Un seul template par défaut par filiale (géré applicativement)
        DB::statement('CREATE INDEX idx_templates_tenant ON certificate_templates(tenant_id, is_default) WHERE is_active = true');
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_templates');
    }
};
