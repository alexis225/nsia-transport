<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CommissionRule;
use App\Models\CommissionTransaction;
use Illuminate\Support\Facades\DB;

/**
 * ============================================================
 * CommissionService — US-038 / US-039
 * ============================================================
 * Calcule et crée la commission à l'émission d'un certificat.
 * Appelé depuis CertificateObserver::issued().
 * ============================================================
 */
class CommissionService
{
    /**
     * Calcule et persiste la commission pour un certificat émis.
     * Retourne null si pas de courtier ou pas de règle applicable.
     */
    public function calculate(Certificate $certificate): ?CommissionTransaction
    {
        $contract = $certificate->contract;
        if (! $contract) return null;

        // Vérifier qu'il y a un courtier sur le contrat
        $brokerId = $contract->broker_id;
        if (! $brokerId) return null;

        // Vérifier qu'une transaction n'existe pas déjà
        $existing = CommissionTransaction::where('certificate_id', $certificate->id)
            ->where('status', '!=', CommissionTransaction::STATUS_CANCELLED)
            ->first();
        if ($existing) return $existing;

        // Trouver le taux applicable : règle contrat > règle générale courtier
        $rule = CommissionRule::findApplicable(
            $brokerId,
            $contract->id,
            $certificate->issued_at?->toDateString() ?? now()->toDateString()
        );

        // Dernier repli : taux standard du courtier (Broker::commission_rate)
        // si aucune CommissionRule n'existe pour lui, ni générale ni contrat.
        if (! $rule && $contract->broker?->commission_rate === null) {
            return null; // vraiment aucun taux nulle part → pas de commission
        }

        $baseType          = $rule->base_type ?? CommissionRule::BASE_PRIME_TOTAL;
        $customBaseAmount  = $rule?->custom_base_amount;
        $ratePct           = (float) ($rule->rate_pct ?? $contract->broker->commission_rate);

        // ── Base de calcul configurable ──────────────────────────
        $base = match ($baseType) {
            'prime_total'   => (float) $certificate->prime_total,
            'insured_value' => (float) $certificate->insured_value,
            'custom_amount' => (float) $customBaseAmount,
            default         => (float) $certificate->prime_total,
        };

        $primeBrute = $base; // prime brute = base choisie
        if ($primeBrute <= 0) return null;

        $commission = round($primeBrute * $ratePct / 100, 2);
        $primeNette = round($primeBrute - $commission, 2);
        $period     = $certificate->issued_at?->format('Y-m') ?? now()->format('Y-m');

        return DB::transaction(function () use (
            $certificate, $contract, $brokerId, $rule,
            $primeBrute, $ratePct, $commission, $primeNette, $period
        ) {
            $tx = CommissionTransaction::create([
                'tenant_id'          => $certificate->tenant_id,
                'certificate_id'     => $certificate->id,
                'contract_id'        => $contract->id,
                'broker_id'          => $brokerId,
                'commission_rule_id' => $rule?->id,
                'currency_code'      => $certificate->currency_code,
                'prime_brute'        => $primeBrute,
                'rate_pct'           => $ratePct,
                'commission'         => $commission,
                'prime_nette'        => $primeNette,
                'period_month'       => $period,
                'status'             => CommissionTransaction::STATUS_PENDING,
            ]);

            // Audit log
            \App\Models\AuditLog::create([
                'tenant_id'   => $certificate->tenant_id,
                'user_id'     => $certificate->issued_by,
                'action'      => 'commission.calculated',
                'entity_type' => 'CommissionTransaction',
                'entity_id'   => $tx->id,
                'severity'    => 'INFO',
                'ip_address'  => request()->ip(),
                'new_values'  => [
                    'certificate' => $certificate->certificate_number,
                    'prime_brute' => $primeBrute,
                    'rate_pct'    => $ratePct,
                    'commission'  => $commission,
                    'prime_nette' => $primeNette,
                ],
            ]);

            return $tx;
        });
    }

    /**
     * Annule la commission liée à un certificat (ex: annulation certificat)
     */
    public function cancel(Certificate $certificate): void
    {
        CommissionTransaction::where('certificate_id', $certificate->id)
            ->where('status', CommissionTransaction::STATUS_PENDING)
            ->update(['status' => CommissionTransaction::STATUS_CANCELLED]);
    }
}