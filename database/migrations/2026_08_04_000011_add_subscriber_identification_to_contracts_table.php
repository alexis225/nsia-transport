<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bloc « Souscripteur » (contractant / payeur des primes), identifié au
 * même titre que l'Assuré — distinct de subscriber_id (l'utilisateur
 * NSIA interne en charge du dossier, non renommé pour rester clair : ce
 * dernier reste un simple gestionnaire de dossier, pas une partie au
 * contrat).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->string('subscriber_name', 200)->nullable()->after('subscriber_id');
            $table->string('subscriber_address')->nullable()->after('subscriber_name');
            $table->string('subscriber_email')->nullable()->after('subscriber_address');
            $table->string('subscriber_phone', 30)->nullable()->after('subscriber_email');
        });
    }

    public function down(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->dropColumn(['subscriber_name', 'subscriber_address', 'subscriber_email', 'subscriber_phone']);
        });
    }
};
