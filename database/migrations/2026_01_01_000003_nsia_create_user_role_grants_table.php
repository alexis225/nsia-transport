<?php

/**
 * ============================================================
 * MIGRATION 04 — user_role_grants
 * Méta-données d'attribution des rôles (complément spatie)
 * Trace : qui a attribué, quand, expiration, révocation
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
        Schema::create('user_role_grants', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->foreignUuid('tenant_id')
                  ->nullable()
                  ->constrained('tenants')
                  ->nullOnDelete();

            $table->string('role_name', 100);   // miroir du nom de rôle spatie

            $table->foreignUuid('granted_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('granted_at')->useCurrent();

            // Délégation temporaire
            $table->timestamp('expires_at')->nullable();

            $table->foreignUuid('revoked_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('revoked_at')->nullable();

            $table->text('reason')->nullable();
        });

        DB::statement('CREATE INDEX idx_grants_user   ON user_role_grants(user_id)');
        DB::statement('CREATE INDEX idx_grants_tenant ON user_role_grants(tenant_id, role_name)');
        DB::statement('CREATE INDEX idx_grants_active ON user_role_grants(user_id, expires_at) WHERE revoked_at IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('user_role_grants');
    }
};