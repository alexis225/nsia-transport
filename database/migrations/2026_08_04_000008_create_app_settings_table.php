<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Paramètres généraux de l'application — clé/valeur, un seul jeu de
 * valeurs pour toute l'application (pas par filiale). Utilisé notamment
 * pour le plafond NN300 et le Plafond/limite Traité, qui ne se
 * définissent plus par contrat mais au niveau de l'Application.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('value');
            $table->string('label')->nullable();
            $table->timestamps();
        });

        DB::table('app_settings')->insert([
            ['key' => 'nn300_ceiling', 'value' => '2000000000', 'label' => 'Plafond NN300 (FCFA)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'treaty_limit',  'value' => '6000000000', 'label' => 'Plafond ou limite Traité (FCFA)', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
