<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un coassureur est identifié sur une filiale + ses coordonnées — pas de
 * taux de coassurance à ce niveau : un même coassureur peut être associé
 * à plusieurs contrats avec un taux différent par contrat (déjà porté par
 * la table pivot contract_coinsurers.share_rate).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coinsurers', function (Blueprint $table) {
            $table->string('address')->nullable()->after('country_code');
            $table->string('email')->nullable()->after('address');
            $table->string('phone', 50)->nullable()->after('email');
            $table->dropColumn('share_rate');
        });
    }

    public function down(): void
    {
        Schema::table('coinsurers', function (Blueprint $table) {
            $table->decimal('share_rate', 5, 2)->nullable()->after('country_code');
            $table->dropColumn(['address', 'email', 'phone']);
        });
    }
};
