<?php

/**
 * ============================================================
 * MIGRATION 000 — users + sessions
 * ============================================================
 * Remplace la migration Breeze par défaut.
 * Utilise UUID comme PK (au lieu de bigint).
 * Inclut toutes les colonnes métier NSIA.
 *
 * ⚠️  tenant_id est nullable ici car la table tenants
 *     n'existe pas encore. La FK est ajoutée dans
 *     0001_01_01_000003_add_tenant_fk_to_users.php
 *     après la création de tenants.
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
        // ── users ─────────────────────────────────────────────
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // tenant_id sans FK ici — FK ajoutée après création de tenants
            $table->uuid('tenant_id')->nullable();

            // Identité
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone', 30)->nullable();
            $table->text('avatar_path')->nullable();

            // Localisation
            $table->string('locale', 10)->default('fr');
            $table->string('timezone', 50)->default('Africa/Abidjan');

            // Sécurité connexion
            $table->timestamp('last_login_at')->nullable();
            $table->ipAddress('last_login_ip')->nullable();
            $table->unsignedSmallInteger('failed_login_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();

            // MFA TOTP
            $table->boolean('mfa_enabled')->default(false);
            $table->text('mfa_secret')->nullable();

            // Activation / blocage
            $table->boolean('is_active')->default(true);
            // FK auto-référencées ajoutées après (PostgreSQL)
            $table->uuid('blocked_by')->nullable();
            $table->timestamp('blocked_at')->nullable();
            $table->text('blocked_reason')->nullable();

            // Méta
            $table->timestamp('password_changed_at')->nullable();
            $table->rememberToken();
            $table->uuid('created_by')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        // FK auto-référencées — séparées car PostgreSQL exige la PK avant
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('blocked_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        // ── password_reset_tokens ─────────────────────────────
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // ── sessions ──────────────────────────────────────────
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();  // UUID cohérent avec users.id
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Index performances
        DB::statement('CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL');
        DB::statement('CREATE INDEX idx_users_email  ON users(email)     WHERE deleted_at IS NULL');
        DB::statement('CREATE INDEX idx_users_active ON users(tenant_id, is_active) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['blocked_by']);
            $table->dropForeign(['created_by']);
        });
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};