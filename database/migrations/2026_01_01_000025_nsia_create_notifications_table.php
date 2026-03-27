<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * ============================================================
 * Migration — notifications (compatible driver Eloquent Laravel)
 * ============================================================
 * Compatible avec :
 *   $user->notifications()
 *   $user->unreadNotifications()
 *   $notification->markAsRead()
 *
 * Le controller existant utilise le trait Notifiable de Laravel
 * qui requiert : notifiable_type, notifiable_id, type, data, read_at
 * ============================================================
 */
return new class extends Migration
{
    public function up(): void
    {
        // Supprimer l'ancienne table si elle existe (mauvaise structure)
        Schema::dropIfExists('notifications');

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // ── Colonnes requises par le driver Eloquent ──────
            $table->string('type');                      // ex: App\Notifications\CertificateSubmitted
            $table->uuidMorphs('notifiable');            // notifiable_type + notifiable_id
            $table->text('data');                        // JSON des données
            $table->timestamp('read_at')->nullable();

            // ── Colonnes custom NSIA ──────────────────────────
            $table->foreignUuid('tenant_id')
                  ->nullable()
                  ->constrained('tenants')
                  ->nullOnDelete();

            $table->string('channel', 20)->default('IN_APP');
            // EMAIL | SMS | IN_APP | WEBHOOK

            $table->timestamps();
        });

        // Contrainte channel
        DB::statement("ALTER TABLE notifications ADD CONSTRAINT notif_channel_check
            CHECK (channel IN ('EMAIL','SMS','IN_APP','WEBHOOK'))");

        // Index critique pour badge non lues (temps réel)
        DB::statement('CREATE INDEX idx_notif_unread
            ON notifications(notifiable_id, created_at DESC)
            WHERE read_at IS NULL');

        DB::statement('CREATE INDEX idx_notif_tenant
            ON notifications(tenant_id, created_at DESC)');

        DB::statement('CREATE INDEX idx_notif_type
            ON notifications(type, created_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};