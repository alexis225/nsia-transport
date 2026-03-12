<?php

/**
 * ============================================================
 * MIGRATION 03 — user_sessions
 * Sessions actives + tokens Sanctum tracés
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
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('token_hash')->unique();     // SHA-256 du bearer token Sanctum
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_type', 30)->nullable(); // web | mobile | api

            $table->timestamp('last_activity')->useCurrent();
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement('CREATE INDEX idx_sessions_user  ON user_sessions(user_id, expires_at)');
        DB::statement('CREATE INDEX idx_sessions_token ON user_sessions USING HASH(token_hash)');
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
    }
};