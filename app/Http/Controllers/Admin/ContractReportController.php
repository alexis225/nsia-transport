<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * ContractReportController — US-045
 * ============================================================
 * État des contrats : stats par statut/type, utilisation plafonds,
 * tableau détaillé filtrable, alertes expiration.
 * ============================================================
 */
class ContractReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $isSA     = $user->hasRole('super_admin');
        $tenantId = $user->tenant_id;

        // ── Paramètres filtres ────────────────────────────────────
        $status       = $request->input('status',     'ALL');
        $type         = $request->input('type');
        $brokerId     = $request->input('broker_id');
        $filterTenant = $request->input('tenant_id');
        $search       = $request->input('search');
        $dateFrom     = $request->input('date_from');
        $dateTo       = $request->input('date_to');
        $dateField    = $request->input('date_field', 'effective_date'); // effective_date | expiry_date | created_at

        // ── Base (sans filtre statut) pour stats globales ─────────
        $base = InsuranceContract::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->when($isSA && $filterTenant, fn ($q) => $q->where('tenant_id', $filterTenant))
            ->when($brokerId, fn ($q) => $q->where('broker_id', $brokerId))
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($search, fn ($q) => $q->where(fn ($q) => $q
                ->where('contract_number', 'ilike', "%{$search}%")
                ->orWhere('insured_name',  'ilike', "%{$search}%")
            ))
            ->when($dateFrom, fn ($q) => $q->whereDate($dateField, '>=', $dateFrom))
            ->when($dateTo,   fn ($q) => $q->whereDate($dateField, '<=', $dateTo));

        // ── Stats globales ────────────────────────────────────────
        $stats = [
            'total'          => (clone $base)->count(),
            'active'         => (clone $base)->where('status', 'ACTIVE')->count(),
            'draft'          => (clone $base)->where('status', 'DRAFT')->count(),
            'suspended'      => (clone $base)->where('status', 'SUSPENDED')->count(),
            'expired'        => (clone $base)->where('status', 'EXPIRED')->count(),
            'cancelled'      => (clone $base)->where('status', 'CANCELLED')->count(),
            'expiring_30'    => (clone $base)->where('status', 'ACTIVE')
                                    ->whereDate('expiry_date', '<=', now()->addDays(30))->count(),
            'expiring_7'     => (clone $base)->where('status', 'ACTIVE')
                                    ->whereDate('expiry_date', '<=', now()->addDays(7))->count(),
            'total_limit'    => (float) (clone $base)->where('status', 'ACTIVE')->sum('subscription_limit'),
            'total_used'     => (float) (clone $base)->where('status', 'ACTIVE')->sum('used_limit'),
            'requires_approval_count' => (clone $base)->where('requires_approval', true)->count(),
        ];

        // Utilisation plafond moyenne (contrats actifs)
        $avgUsage = InsuranceContract::where('status', 'ACTIVE')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->when($isSA && $filterTenant, fn ($q) => $q->where('tenant_id', $filterTenant))
            ->where('subscription_limit', '>', 0)
            ->selectRaw("ROUND(AVG(used_limit / subscription_limit * 100), 1) as avg_pct")
            ->value('avg_pct');

        // ── Ventilation par type ──────────────────────────────────
        $byType = (clone $base)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->orderByDesc('count')
            ->get()
            ->toArray();

        // ── Ventilation par statut ────────────────────────────────
        $byStatus = (clone $base)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->orderByDesc('count')
            ->get()
            ->toArray();

        // ── Tableau filtré (+ filtre statut) ─────────────────────
        $contracts = (clone $base)
            ->when($status !== 'ALL', fn ($q) => $q->where('status', $status))
            ->with([
                'broker:id,name,code,type',
                'tenant:id,name,code',
            ])
            ->withCount([
                'certificates',
                'certificates as issued_certificates_count' => fn ($q) => $q->where('status', 'ISSUED'),
            ])
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        // ── Listes déroulantes ────────────────────────────────────
        $brokers = Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $tenants = $isSA
            ? Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])
            : collect();

        return Inertia::render('admin/reports/contracts', [
            'contracts'  => $contracts,
            'stats'      => $stats,
            'avgUsagePct'=> $avgUsage,
            'byType'     => $byType,
            'byStatus'   => $byStatus,
            'brokers'    => $brokers,
            'tenants'    => $tenants,
            'filters'    => [
                'status'     => $status,
                'type'       => $type,
                'broker_id'  => $brokerId,
                'tenant_id'  => $filterTenant,
                'search'     => $search,
                'date_from'  => $dateFrom,
                'date_to'    => $dateTo,
                'date_field' => $dateField,
            ],
            'isSA'       => $isSA,
        ]);
    }
}
