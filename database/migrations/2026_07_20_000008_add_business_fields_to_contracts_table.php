<?php

/**
 * ============================================================
 * MIGRATION — champs métiers du contrat
 * ============================================================
 * - subscriber_id : souscripteur (User) en charge du contrat
 * - plein : plafond maximal assurable PAR certificat (distinct
 *   de subscription_limit, qui est le cumul de TOUS les
 *   certificats du contrat — le "plafond NN300")
 * - escalade_enabled / escalade_threshold_pct : pilotage de
 *   l'escalade NN300 automatique (consommés par
 *   ApprovalWorkflowConfig::evaluateCondition() et
 *   ApprovalWorkflowService::triggerIfNeeded(), déjà en place
 *   côté code mais jusqu'ici sans colonnes réelles).
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->foreignUuid('subscriber_id')->nullable()->after('broker_id')
                  ->constrained('users')->nullOnDelete();
            $table->decimal('plein', 20, 2)->nullable()->after('subscription_limit');
            $table->boolean('escalade_enabled')->default(true)->after('plein');
            $table->decimal('escalade_threshold_pct', 5, 2)->nullable()->after('escalade_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('subscriber_id');
            $table->dropColumn(['plein', 'escalade_enabled', 'escalade_threshold_pct']);
        });
    }
};
