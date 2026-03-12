<?php

/**
 * ============================================================
 * MIGRATION 06 — coinsurers
 * Coassureurs pouvant participer aux contrats
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coinsurers', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')->constrained('tenants');
            $table->string('name');
            $table->char('country_code', 2)->nullable();
            $table->decimal('share_rate', 5, 2)->nullable(); // % participation par défaut
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coinsurers');
    }
};
