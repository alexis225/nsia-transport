<?php

/**
 * ============================================================
 * MIGRATION 15 — contract_coinsurers
 * Table pivot : participation des coassureurs sur un contrat
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_coinsurers', function (Blueprint $table) {
            $table->foreignUuid('contract_id')
                  ->constrained('insurance_contracts')
                  ->cascadeOnDelete();

            $table->foreignUuid('coinsurer_id')
                  ->constrained('coinsurers')
                  ->cascadeOnDelete();

            $table->decimal('share_rate', 5, 2); // % de participation sur ce contrat

            $table->primary(['contract_id', 'coinsurer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_coinsurers');
    }
};
