<?php

namespace App\Console\Commands;

use App\Models\InsuranceContract;
use App\Models\User;
use App\Notifications\ContractExpiring;
use App\Notifications\ContractLimitReached;
use Illuminate\Console\Command;

/**
 * ============================================================
 * ContractExpiryCheckCommand — US-025
 * ============================================================
 * À planifier dans routes/console.php ou Kernel.php :
 *   Schedule::command('nsia:check-contracts')->dailyAt('08:00');
 * ============================================================
 */
class ContractExpiryCheck extends Command
{
    protected $signature = 'nsia:check-contracts';

    protected $description = 'Envoie les alertes expiration contrats et plafond NN300';

    public function handle(): void
    {
        $this->checkExpiring();
        $this->checkAbonnementExpiring();
        $this->checkLimit();
        $this->info('Vérification contrats terminée.');
    }

    private function checkExpiring(): void
    {
        // Contrats expirant dans 30, 15 ou 7 jours
        $thresholds = [30, 15, 7];

        foreach ($thresholds as $days) {
            $contracts = InsuranceContract::with(['tenant'])
                ->where('status', 'ACTIVE')
                ->whereDate('expiry_date', now()->addDays($days)->toDateString())
                ->get();

            foreach ($contracts as $contract) {
                // Notifier les admins et souscripteurs de la filiale
                $users = User::where('tenant_id', $contract->tenant_id)
                    ->whereHas('roles', fn ($q) => $q->whereIn('name', ['admin_filiale', 'souscripteur', 'super_admin'])
                    )
                    ->get();

                foreach ($users as $user) {
                    $user->notify(new ContractExpiring($contract, $days));
                }

                $this->info("Alerte J-{$days} envoyée pour {$contract->contract_number}");
            }
        }
    }

    // Contrats Abonnement (police ouverte / tiers chargeur) : alerte dès
    // 3 mois avant échéance, puis rappel mensuel jusqu'à l'échéance —
    // distinct des seuils fixes J-30/15/7 de checkExpiring() ci-dessus,
    // qui s'appliquent à tous les types de contrat.
    private function checkAbonnementExpiring(): void
    {
        $contracts = InsuranceContract::with('tenant')
            ->where('status', 'ACTIVE')
            ->whereIn('type', [InsuranceContract::TYPE_OPEN_POLICY, InsuranceContract::TYPE_TIERS_CHARGEUR])
            ->whereBetween('expiry_date', [now()->toDateString(), now()->addMonths(3)->toDateString()])
            ->get();

        foreach ($contracts as $contract) {
            $daysLeft = (int) now()->startOfDay()->diffInDays($contract->expiry_date, false);

            $users = User::where('tenant_id', $contract->tenant_id)
                ->whereHas('roles', fn ($q) => $q->whereIn('name', ['admin_filiale', 'souscripteur', 'super_admin'])
                )
                ->get();

            foreach ($users as $user) {
                // Rappel mensuel : un seul envoi par contrat et par mois
                // calendaire, jusqu'à l'échéance. "data" est stocké en
                // colonne text (cf. migration) — cast explicite ::jsonb
                // requis pour l'opérateur ->> sous Postgres.
                $alreadyNotifiedThisMonth = $user->notifications()
                    ->whereYear('created_at', now()->year)
                    ->whereMonth('created_at', now()->month)
                    ->whereRaw("data::jsonb ->> 'type' = ?", ['contract.expiring'])
                    ->whereRaw("data::jsonb ->> 'contract_number' = ?", [$contract->contract_number])
                    ->exists();

                if (! $alreadyNotifiedThisMonth) {
                    $user->notify(new ContractExpiring($contract, $daysLeft));
                }
            }

            $this->info("Rappel abonnement envoyé pour {$contract->contract_number} (J-{$daysLeft})");
        }
    }

    private function checkLimit(): void
    {
        // Contrats ayant dépassé 90% du plafond NN300
        InsuranceContract::where('status', 'ACTIVE')
            ->whereNotNull('subscription_limit')
            ->whereRaw('used_limit / subscription_limit >= 0.90')
            ->each(function (InsuranceContract $contract) {
                $pct = round(((float) $contract->used_limit / (float) $contract->subscription_limit) * 100, 1);

                $users = User::where('tenant_id', $contract->tenant_id)
                    ->whereHas('roles', fn ($q) => $q->whereIn('name', ['admin_filiale', 'souscripteur'])
                    )
                    ->get();

                foreach ($users as $user) {
                    // Éviter les doublons — vérifier si déjà notifié aujourd'hui
                    // ("data" est en colonne text — cast ::jsonb requis).
                    $alreadyNotified = $user->notifications()
                        ->whereDate('created_at', today())
                        ->whereRaw("data::jsonb ->> 'type' = ?", ['contract.limit_reached'])
                        ->whereRaw("data::jsonb ->> 'contract_id' = ?", [$contract->id])
                        ->exists();

                    if (! $alreadyNotified) {
                        $user->notify(new ContractLimitReached($contract, $pct));
                    }
                }
            });
    }
}
