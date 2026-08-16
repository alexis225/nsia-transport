<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Restructuration des taux du décompte de prime :
 * - R.O. et R.G. restent les seuls taux saisis au niveau du CONTRAT.
 * - Divers et Surprime se saisissent désormais à l'établissement du
 *   CERTIFICAT (au cas par cas), plus au niveau du contrat.
 * - Accessoires n'est plus un taux (%) mais un montant fixe en devise
 *   (à partir de 500 FCFA) — renommé rate_accessories -> accessories_amount.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->dropColumn(['rate_divers', 'rate_surprime']);
        });
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->renameColumn('rate_accessories', 'accessories_amount');
        });
        // La colonne était un taux (decimal 6,4) — un montant nécessite une
        // échelle monétaire.
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE insurance_contracts ALTER COLUMN accessories_amount TYPE decimal(20,2)');

        Schema::table('certificates', function (Blueprint $table) {
            $table->decimal('rate_divers', 6, 4)->nullable()->after('guarantee_mode');
            $table->decimal('rate_surprime', 6, 4)->nullable()->after('rate_divers');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['rate_divers', 'rate_surprime']);
        });

        \Illuminate\Support\Facades\DB::statement('ALTER TABLE insurance_contracts ALTER COLUMN accessories_amount TYPE decimal(6,4)');
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->renameColumn('accessories_amount', 'rate_accessories');
        });
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->decimal('rate_divers', 6, 4)->nullable();
            $table->decimal('rate_surprime', 6, 4)->nullable();
        });
    }
};
