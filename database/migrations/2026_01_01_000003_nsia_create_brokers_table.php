<?php

/**
 * ============================================================
 * MIGRATION 05 — brokers
 * Courtiers locaux et partenaires étrangers par filiale
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
        Schema::create('brokers', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')->constrained('tenants');
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('code', 50);
            $table->string('name');
            $table->string('type', 30); // LOCAL | FOREIGN_PARTNER
            $table->char('country_code', 2)->nullable();
            $table->text('address')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('registration_number', 100)->nullable(); // numéro agrément

            // Commission par défaut (peut être surchargée par commission_rules)
            $table->decimal('commission_rate', 5, 2)->nullable();

            // Blocage
            $table->boolean('is_active')->default(true);
            $table->foreignUuid('blocked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('blocked_at')->nullable();
            $table->text('blocked_reason')->nullable();

            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'code']);
        });

        DB::statement("ALTER TABLE brokers ADD CONSTRAINT brokers_type_check
            CHECK (type IN ('LOCAL','FOREIGN_PARTNER'))");

        DB::statement('CREATE INDEX idx_brokers_tenant ON brokers(tenant_id) WHERE deleted_at IS NULL');
        DB::statement('CREATE INDEX idx_brokers_active ON brokers(tenant_id, is_active) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('brokers');
    }
};
