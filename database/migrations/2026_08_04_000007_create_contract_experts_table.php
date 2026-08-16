<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Association Expert ↔ Contrat — simple liaison, pas de taux (contrairement
 * aux coassureurs) : un expert est mandaté sur un contrat pour l'expertise/
 * le suivi des sinistres, sans part financière.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_experts', function (Blueprint $table) {
            $table->foreignUuid('contract_id')->constrained('insurance_contracts')->cascadeOnDelete();
            $table->foreignUuid('expert_id')->constrained('experts')->cascadeOnDelete();
            $table->primary(['contract_id', 'expert_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_experts');
    }
};
