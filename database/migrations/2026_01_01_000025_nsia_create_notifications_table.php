<?php

/**
 * ============================================================
 * MIGRATION 27 — notifications
 * Notifications envoyées aux utilisateurs (toutes canaux).
 * Index partiel sur les non-lues pour le badge en temps réel.
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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('tenant_id')
                  ->nullable()
                  ->constrained('tenants')
                  ->nullOnDelete();

            $table->foreignUuid('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('type', 100);       // ex: CertificateIssued, ApprovalNeeded
            $table->string('channel', 20);     // EMAIL | SMS | IN_APP | WEBHOOK

            $table->string('title', 255)->nullable();
            $table->text('body');

            // Données contextuelles (lien vers entité, actions CTA, etc.)
            $table->json('data')->default('{}');

            // Statut envoi/lecture
            $table->timestamp('read_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('error_message')->nullable();

            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("ALTER TABLE notifications ADD CONSTRAINT notif_channel_check
            CHECK (channel IN ('EMAIL','SMS','IN_APP','WEBHOOK'))");

        // Index critique pour badge notifications non lues (temps réel)
        DB::statement('CREATE INDEX idx_notif_user_unread
            ON notifications(user_id, created_at DESC)
            WHERE read_at IS NULL');

        DB::statement('CREATE INDEX idx_notif_tenant ON notifications(tenant_id, created_at DESC)');
        DB::statement('CREATE INDEX idx_notif_type   ON notifications(type, created_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
