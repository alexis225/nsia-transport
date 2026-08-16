<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * « Précision transport » (texte libre) devient « Type de conditionnement »
 * : une liste de cases à cocher (Conteneur, Conventionnel, Vrac,
 * Groupage, Bout en bout…) définissant les conditionnements possibles
 * dans la police — appelés automatiquement dans le formulaire du
 * certificat au lieu d'un texte libre.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->json('conditioning_types')->nullable()->after('transport_mode_detail');
        });

        // Best-effort : reprendre l'ancienne valeur texte comme unique
        // entrée du tableau si elle correspond à un code connu.
        DB::table('insurance_contracts')->whereNotNull('transport_mode_detail')->get(['id', 'transport_mode_detail'])
            ->each(function ($row) {
                $known = ['CONTAINER', 'GROUPAGE', 'CONVENTIONNEL', 'BOUT_EN_BOUT', 'VRAC'];
                $value = strtoupper(trim($row->transport_mode_detail));
                if (in_array($value, $known, true)) {
                    DB::table('insurance_contracts')->where('id', $row->id)
                        ->update(['conditioning_types' => json_encode([$value])]);
                }
            });

        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->dropColumn('transport_mode_detail');
        });
    }

    public function down(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->string('transport_mode_detail', 100)->nullable();
        });
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->dropColumn('conditioning_types');
        });
    }
};
