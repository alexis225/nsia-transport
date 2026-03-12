<?php

/**
 * ============================================================
 * MIGRATION 26 — notification_templates
 * Templates de notifications multicanaux personnalisables
 * par filiale et par événement métier.
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
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            // NULL = template global (toutes filiales)
            $table->foreignUuid('tenant_id')
                  ->nullable()
                  ->constrained('tenants')
                  ->nullOnDelete();

            /**
             * Événements métier :
             * CERTIFICATE_SUBMITTED | CERTIFICATE_APPROVED | CERTIFICATE_ISSUED
             * CERTIFICATE_CANCELLED | APPROVAL_NEEDED | CONTRACT_EXPIRING
             * CONTRACT_LIMIT_REACHED | COMMISSION_VALIDATED | REPORT_READY
             * USER_CREATED | USER_BLOCKED | PDF_READY
             */
            $table->string('event', 100);

            $table->string('channel', 20); // EMAIL | SMS | IN_APP | WEBHOOK

            $table->string('subject', 255)->nullable(); // pour EMAIL
            $table->text('body');                       // template Blade/Mustache

            $table->string('locale', 10)->default('fr');

            $table->boolean('is_active')->default(true);

            // Un seul template actif par (tenant, event, channel, locale)
            $table->unique(['tenant_id', 'event', 'channel', 'locale']);
        });

        DB::statement("ALTER TABLE notification_templates ADD CONSTRAINT nt_channel_check
            CHECK (channel IN ('EMAIL','SMS','IN_APP','WEBHOOK'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_templates');
    }
};
