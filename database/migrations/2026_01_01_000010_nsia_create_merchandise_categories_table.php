<?php

/**
 * ============================================================
 * MIGRATION 12 — merchandise_categories
 * Catégories de marchandises (arborescentes, globales ou par filiale)
 * ============================================================
 * Correction : FK auto-référencée parent_id ajoutée via
 * Schema::table APRÈS Schema::create (même raison que users).
 * PostgreSQL exige que la PK cible existe avant le ALTER TABLE.
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
        Schema::create('merchandise_categories', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // NULL = catégorie globale visible par toutes les filiales
            $table->foreignUuid('tenant_id')
                  ->nullable()
                  ->constrained('tenants')
                  ->nullOnDelete();

            $table->string('code', 50);
            $table->string('name');

            // ⚠️  FK auto-référencée — ajoutée après via Schema::table
            $table->uuid('parent_id')->nullable();

            // Niveau de risque : 1=faible, 2=moyen, 3=élevé
            $table->unsignedSmallInteger('risk_level')->default(1);

            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        // FK auto-référencée ajoutée APRÈS que la PK existe
        Schema::table('merchandise_categories', function (Blueprint $table) {
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('merchandise_categories')
                  ->nullOnDelete();
        });

        DB::statement('ALTER TABLE merchandise_categories ADD CONSTRAINT merch_risk_check CHECK (risk_level BETWEEN 1 AND 3)');
        DB::statement('CREATE INDEX idx_merch_tenant ON merchandise_categories(tenant_id)');
        DB::statement('CREATE INDEX idx_merch_parent ON merchandise_categories(parent_id)');
    }

    public function down(): void
    {
        Schema::table('merchandise_categories', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
        });

        Schema::dropIfExists('merchandise_categories');
    }
};
