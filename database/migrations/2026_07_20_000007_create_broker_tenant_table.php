<?php

/**
 * ============================================================
 * MIGRATION — broker_tenant (pivot)
 * ============================================================
 * Un courtier peut être rattaché à une ou plusieurs filiales.
 * `brokers.tenant_id` reste la filiale principale (propriétaire
 * de la fiche, utilisée par tout le code existant pour
 * l'isolation) ; cette table ajoute les filiales supplémentaires
 * dans lesquelles ce courtier peut également opérer.
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
        Schema::create('broker_tenant', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('broker_id')->constrained('brokers')->cascadeOnDelete();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['broker_id', 'tenant_id']);
        });

        // Rattache chaque courtier existant à sa filiale principale actuelle.
        DB::statement("
            INSERT INTO broker_tenant (id, broker_id, tenant_id, created_at, updated_at)
            SELECT gen_random_uuid(), id, tenant_id, now(), now() FROM brokers
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('broker_tenant');
    }
};
