<?php
/**
 * ============================================================
 * MIGRATION 08 — countries
 * Référentiel ISO 3166-1 — 249 pays
 * ============================================================
 */
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {
            $table->char('code', 2)->primary();   // ISO alpha-2 : CI, FR, US...
            $table->string('name_fr', 100);
            $table->string('name_en', 100);
            $table->string('region', 100)->nullable(); // Afrique de l'Ouest, Europe...
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
