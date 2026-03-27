<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\InsuranceContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * ContractLimitController — US-027
 * ============================================================
 * Suivi du plafond de souscription NN300 en temps réel.
 * - Endpoint JSON pour polling frontend
 * - Page dédiée de suivi multi-contrats
 * ============================================================
 */
class ContractLimitController extends Controller
{
    // ── API : état plafond d'un contrat (polling) ─────────────
    public function status(Request $request, InsuranceContract $contract): JsonResponse
    {
        $this->authorizeTenant($contract);

        $usedLimit         = (float) $contract->used_limit;
        $subscriptionLimit = $contract->subscription_limit
            ? (float) $contract->subscription_limit
            : null;

        $usagePercent = $subscriptionLimit && $subscriptionLimit > 0
            ? min(100, round(($usedLimit / $subscriptionLimit) * 100, 2))
            : 0;

        $remainingLimit = $subscriptionLimit !== null
            ? max(0, $subscriptionLimit - $usedLimit)
            : null;

        // Derniers certificats émis sur ce contrat
        $recentCerts = Certificate::where('contract_id', $contract->id)
            ->whereIn('status', ['ISSUED', 'CANCELLED'])
            ->orderBy('issued_at', 'desc')
            ->limit(5)
            ->get(['id', 'certificate_number', 'insured_value', 'status', 'issued_at', 'cancelled_at'])
            ->map(fn ($c) => [
                'id'                 => $c->id,
                'certificate_number' => $c->certificate_number,
                'insured_value'      => (float) $c->insured_value,
                'status'             => $c->status,
                'date'               => ($c->issued_at ?? $c->cancelled_at)?->format('d/m/Y H:i'),
            ]);

        return response()->json([
            'contract_id'        => $contract->id,
            'contract_number'    => $contract->contract_number,
            'currency_code'      => $contract->currency_code,
            'subscription_limit' => $subscriptionLimit,
            'used_limit'         => $usedLimit,
            'remaining_limit'    => $remainingLimit,
            'usage_percent'      => $usagePercent,
            'certificates_count' => $contract->certificates_count,
            'certificates_limit' => $contract->certificates_limit,
            'alert_level'        => $this->getAlertLevel($usagePercent),
            'can_issue'          => $contract->canIssue(),
            'recent_certs'       => $recentCerts,
            'updated_at'         => now()->toISOString(),
        ]);
    }

    // ── Page : tableau de bord plafonds multi-contrats ────────
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $contracts = InsuranceContract::with('tenant:id,name,code')
            ->where('status', 'ACTIVE')
            ->whereNotNull('subscription_limit')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->tenant_id && $isSA, fn ($q) => $q->where('tenant_id', $request->tenant_id))
            ->orderByRaw('(used_limit / subscription_limit) DESC')
            ->get()
            ->map(fn ($c) => [
                'id'                 => $c->id,
                'contract_number'    => $c->contract_number,
                'insured_name'       => $c->insured_name,
                'currency_code'      => $c->currency_code,
                'subscription_limit' => (float) $c->subscription_limit,
                'used_limit'         => (float) $c->used_limit,
                'remaining_limit'    => max(0, (float)$c->subscription_limit - (float)$c->used_limit),
                'usage_percent'      => $c->usagePercent(),
                'certificates_count' => $c->certificates_count,
                'certificates_limit' => $c->certificates_limit,
                'alert_level'        => $this->getAlertLevel($c->usagePercent()),
                'expiry_date'        => $c->expiry_date->format('d/m/Y'),
                'can_issue'          => $c->canIssue(),
                'tenant'             => $c->tenant?->only(['name', 'code']),
            ]);

        // Stats globales
        $stats = [
            'total_contracts'  => $contracts->count(),
            'critical'         => $contracts->where('alert_level', 'critical')->count(),
            'warning'          => $contracts->where('alert_level', 'warning')->count(),
            'ok'               => $contracts->where('alert_level', 'ok')->count(),
            'total_used'       => $contracts->sum('used_limit'),
            'total_limit'      => $contracts->sum('subscription_limit'),
        ];

        return Inertia::render('admin/contracts/limits', [
            'contracts' => $contracts,
            'stats'     => $stats,
            'isSA'      => $isSA,
        ]);
    }

    // ── Niveau d'alerte ───────────────────────────────────────
    private function getAlertLevel(float $percent): string
    {
        if ($percent >= 95) return 'critical'; // rouge — blocage imminent
        if ($percent >= 80) return 'warning';  // orange — alerte
        return 'ok';                            // vert — normal
    }

    // ── Isolation tenant ─────────────────────────────────────
    private function authorizeTenant(InsuranceContract $contract): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        if ((string) $user->tenant_id !== (string) $contract->tenant_id) abort(403);
    }
}