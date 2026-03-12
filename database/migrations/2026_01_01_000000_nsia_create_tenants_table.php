<?php

/**
 * ============================================================
 * MIGRATION NSIA 000 — tenants + FK tenant_id → users
 * ============================================================
 * Crée la table tenants, puis ajoute la FK tenant_id
 * sur la table users (créée en 0001_01_01_000000 sans FK
 * car tenants n'existait pas encore).
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
        // ── Créer tenants ─────────────────────────────────────
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->string('code', 10)->unique();
            $table->string('name');
            $table->char('country_code', 2);
            $table->char('currency_code', 3);

            $table->text('logo_path')->nullable();
            $table->text('certificate_template_path')->nullable();

            $table->boolean('has_state_platform')->default(false);
            $table->string('state_platform_name', 100)->nullable();
            $table->text('state_platform_api_url')->nullable();

            $table->json('subscription_limit_config')->default('{}');
            $table->boolean('is_active')->default(true);
            $table->json('settings')->default('{}');

            $table->timestamps();
            $table->softDeletes();
        });

        // ── Ajouter la FK tenant_id sur users ─────────────────
        // (impossible dans la migration users car tenants n'existait pas)
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('tenant_id')
                  ->references('id')
                  ->on('tenants')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
        });

        Schema::dropIfExists('tenants');
    }
};