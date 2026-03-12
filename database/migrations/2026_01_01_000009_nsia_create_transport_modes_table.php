<?php

/**
 * ============================================================
 * MIGRATION 11 — transport_modes
 * SEA, AIR, ROAD, RAIL, MULTIMODAL, POSTAL
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_modes', function (Blueprint $table) {
            $table->smallIncrements('id');
            $table->string('code', 20)->unique(); // SEA, AIR, ROAD, RAIL, MULTIMODAL, POSTAL
            $table->string('name_fr', 100);
            $table->string('name_en', 100);
            $table->string('icon', 50)->nullable(); // slug icône lucide : ship, plane, truck...
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_modes');
    }
};
