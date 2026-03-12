<?php

/**
 * ============================================================
 * MIGRATION 09 — currencies
 * Référentiel ISO 4217
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('currencies', function (Blueprint $table) {
            $table->char('code', 3)->primary();   // XOF, XAF, EUR, USD...
            $table->string('name', 100);
            $table->string('symbol', 10)->nullable();
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
