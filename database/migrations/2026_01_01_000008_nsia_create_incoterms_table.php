<?php

/**
 * ============================================================
 * MIGRATION 10 — incoterms
 * Incoterms 2020 (11 règles)
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incoterms', function (Blueprint $table) {
            $table->string('code', 5)->primary(); // EXW, FOB, CIF, CFR...
            $table->string('name', 100);
            $table->text('description')->nullable();
            // Modes compatibles stockés en jsonb pour flexibilité
            $table->json('compatible_modes')->default('[]'); // ["SEA","AIR","ROAD"]
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incoterms');
    }
};
