<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Suivi du plafond NN300 / Plafond Traité :
 * - subscription_limit (déjà existant, "plafond NN300") reçoit un défaut
 *   de 2 milliards FCFA quand non renseigné à la création du contrat.
 * - treaty_limit (nouveau, "Plafond ou limite Traité") plafonne le
 *   placement en réassurance facultative, défaut 6 milliards FCFA.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->decimal('treaty_limit', 20, 2)->nullable()->default(6000000000.00)->after('subscription_limit');
        });

        DB::statement('ALTER TABLE insurance_contracts ALTER COLUMN subscription_limit SET DEFAULT 2000000000.00');

        DB::table('insurance_contracts')->whereNull('subscription_limit')->update(['subscription_limit' => 2000000000.00]);
        DB::table('insurance_contracts')->whereNull('treaty_limit')->update(['treaty_limit' => 6000000000.00]);
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE insurance_contracts ALTER COLUMN subscription_limit DROP DEFAULT');

        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->dropColumn('treaty_limit');
        });
    }
};
