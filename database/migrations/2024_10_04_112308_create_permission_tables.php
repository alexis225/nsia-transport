<?php

/**
 * ============================================================
 * MIGRATION 003 — Spatie Permission Tables (UUID)
 * ============================================================
 * Version corrigée de la migration Spatie par défaut :
 *   - model_morph_key en UUID (cohérent avec users.id UUID)
 *   - teams = false
 *
 * config/permission.php requis :
 *   'teams'           => false,
 *   'model_morph_key' => 'model_uuid',
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableNames  = config('permission.table_names');
        $columnNames = config('permission.column_names');

        // ── roles ─────────────────────────────────────────────
        Schema::create($tableNames['roles'], function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name')->default('web');
            $table->timestamps();
            $table->unique(['name', 'guard_name']);
        });

        // ── permissions ───────────────────────────────────────
        Schema::create($tableNames['permissions'], function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name')->default('web');
            $table->timestamps();
            $table->unique(['name', 'guard_name']);
        });

        // ── model_has_permissions ─────────────────────────────
        Schema::create($tableNames['model_has_permissions'], function (Blueprint $table) use ($tableNames, $columnNames) {
            $table->unsignedBigInteger($columnNames['permission_pivot_key'] ?? 'permission_id');
            $table->string('model_type');

            // ✅ UUID au lieu de unsignedBigInteger
            $table->uuid($columnNames['model_morph_key']);

            $table->index(
                [$columnNames['model_morph_key'], 'model_type'],
                'mhp_model_uuid_type_index'
            );

            $table->foreign($columnNames['permission_pivot_key'] ?? 'permission_id')
                  ->references('id')->on($tableNames['permissions'])->onDelete('cascade');

            $table->primary(
                [$columnNames['permission_pivot_key'] ?? 'permission_id', $columnNames['model_morph_key'], 'model_type'],
                'mhp_primary'
            );
        });

        // ── model_has_roles ───────────────────────────────────
        Schema::create($tableNames['model_has_roles'], function (Blueprint $table) use ($tableNames, $columnNames) {
            $table->unsignedBigInteger($columnNames['role_pivot_key'] ?? 'role_id');
            $table->string('model_type');

            // ✅ UUID au lieu de unsignedBigInteger
            $table->uuid($columnNames['model_morph_key']);

            $table->index(
                [$columnNames['model_morph_key'], 'model_type'],
                'mhr_model_uuid_type_index'
            );

            $table->foreign($columnNames['role_pivot_key'] ?? 'role_id')
                  ->references('id')->on($tableNames['roles'])->onDelete('cascade');

            $table->primary(
                [$columnNames['role_pivot_key'] ?? 'role_id', $columnNames['model_morph_key'], 'model_type'],
                'mhr_primary'
            );
        });

        // ── role_has_permissions ──────────────────────────────
        Schema::create($tableNames['role_has_permissions'], function (Blueprint $table) use ($tableNames, $columnNames) {
            $table->unsignedBigInteger($columnNames['permission_pivot_key'] ?? 'permission_id');
            $table->unsignedBigInteger($columnNames['role_pivot_key'] ?? 'role_id');

            $table->foreign($columnNames['permission_pivot_key'] ?? 'permission_id')
                  ->references('id')->on($tableNames['permissions'])->onDelete('cascade');

            $table->foreign($columnNames['role_pivot_key'] ?? 'role_id')
                  ->references('id')->on($tableNames['roles'])->onDelete('cascade');

            $table->primary(
                [$columnNames['permission_pivot_key'] ?? 'permission_id', $columnNames['role_pivot_key'] ?? 'role_id'],
                'rhp_primary'
            );
        });

        // Vider le cache Spatie
        app('cache')
            ->store(config('permission.cache.store') !== 'default' ? config('permission.cache.store') : null)
            ->forget(config('permission.cache.key'));
    }

    public function down(): void
    {
        $tableNames = config('permission.table_names');
        Schema::drop($tableNames['role_has_permissions']);
        Schema::drop($tableNames['model_has_roles']);
        Schema::drop($tableNames['model_has_permissions']);
        Schema::drop($tableNames['roles']);
        Schema::drop($tableNames['permissions']);
    }
};