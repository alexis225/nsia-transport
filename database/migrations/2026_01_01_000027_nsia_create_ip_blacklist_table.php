<?php

/**
 * ============================================================
 * MIGRATION 29 — ip_blacklist
 * Blocage IP / plages CIDR par les admins.
 * Le middleware BlockedIpMiddleware interroge cette table
 * (résultat mis en cache Redis 5 min).
 * ============================================================
 * Correction : Blueprint::specificType() n'existe pas dans Laravel.
 * La table est créée entièrement en SQL raw pour utiliser le type
 * CIDR natif PostgreSQL, puis les FK Laravel sont ajoutées via
 * Schema::table (les FK Eloquent fonctionnent normalement).
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
        // Création en SQL raw pour le type CIDR natif PostgreSQL
        // (Blueprint ne supporte pas les types PostgreSQL spécifiques)
        DB::statement("
            CREATE TABLE ip_blacklist (
                id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                ip_range   CIDR        NOT NULL UNIQUE,
                reason     TEXT,
                blocked_by UUID,
                expires_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        ");

        // FK ajoutée via Schema::table (Blueprint standard)
        Schema::table('ip_blacklist', function (Blueprint $table) {
            $table->foreign('blocked_by')
                  ->references('id')
                  ->on('users')
                  ->nullOnDelete();
        });

        // Index GiST pour les recherches CIDR "est-ce que cette IP est dans la plage ?"
        // Opérateur : WHERE '192.168.1.5'::inet <<= ip_range
        DB::statement('CREATE INDEX idx_ip_blacklist_range  ON ip_blacklist USING GIST (ip_range inet_ops)');
        DB::statement('CREATE INDEX idx_ip_blacklist_active ON ip_blacklist(expires_at) WHERE expires_at IS NOT NULL');
    }

    public function down(): void
    {
        Schema::table('ip_blacklist', function (Blueprint $table) {
            $table->dropForeign(['blocked_by']);
        });

        Schema::dropIfExists('ip_blacklist');
    }
};
