<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration
{
    /**
     * Run the migrations.
     */
       public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
 
            $table->foreignUuid('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
 
            // Type d'événement ex: CertificateSubmitted, DelegationGranted...
            $table->string('event_type', 100);
 
            // Canaux activés
            $table->boolean('in_app')->default(true);
            $table->boolean('email')->default(true);
 
            $table->timestamps();
 
            $table->unique(['user_id', 'event_type']);
        });
 
        DB::statement('CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id)');
    }
 
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }

};
