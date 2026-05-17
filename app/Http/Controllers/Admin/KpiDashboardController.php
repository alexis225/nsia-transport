<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\Certificate;
use App\Models\CommissionTransaction;
use App\Models\InsuranceContract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * KpiDashboardController — US-043
 * ============================================================
 * Dashboard KPIs filiale : certificats, contrats, commissions,
 * escalades NN300, tendances mensuelles, top courtiers.
 * Accessible aux admin_filiale et super_admin.
 * ============================================================
 */
class KpiDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $isSA     = $user->hasRole('super_admin');
        $tenantId = $user->tenant_id;

        // US-056 — Utiliser le snapshot mis en cache par nsia:generate-kpi-snapshots (TTL 25h)
        // Le snapshot est invalide si inexistant ou si l'utilisateur force le refresh
        $cacheKey = $isSA ? 'kpi_snapshot_global' : "kpi_snapshot_{$tenantId}";
        $snapshot = $request->boolean('refresh') ? null : Cache::get($cacheKey);

        $withTenant = fn ($q) => $q->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId));

        // ── KPIs Certificats ──────────────────────────────────────
        $certBase = Certificate::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId));

        $certStats = [
            'issued_month'    => (clone $certBase)->where('status', 'ISSUED')
                                     ->whereMonth('issued_at', now()->month)
                                     ->whereYear('issued_at', now()->year)->count(),
            'issued_prev_month' => (clone $certBase)->where('status', 'ISSUED')
                                     ->whereMonth('issued_at', now()->subMonth()->month)
                                     ->whereYear('issued_at', now()->subMonth()->year)->count(),
            'issued_ytd'      => (clone $certBase)->where('status', 'ISSUED')
                                     ->whereYear('issued_at', now()->year)->count(),
            'submitted'       => (clone $certBase)->where('status', 'SUBMITTED')->count(),
            'draft'           => (clone $certBase)->where('status', 'DRAFT')->count(),
            'cancelled_month' => (clone $certBase)->where('status', 'CANCELLED')
                                     ->whereMonth('cancelled_at', now()->month)
                                     ->whereYear('cancelled_at', now()->year)->count(),
        ];

        // Délai moyen traitement (heures) ce mois
        $avgProcessingHours = Certificate::where('status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->whereNotNull('submitted_at')
            ->whereNotNull('issued_at')
            ->whereMonth('issued_at', now()->month)
            ->whereYear('issued_at', now()->year)
            ->selectRaw("AVG(EXTRACT(EPOCH FROM (issued_at - submitted_at)) / 3600) as avg_hours")
            ->value('avg_hours');

        // Tendance mensuelle — 12 derniers mois
        $rawMonthly = Certificate::where('status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('issued_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("TO_CHAR(issued_at, 'YYYY-MM') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        $monthlyData = [];
        for ($i = 11; $i >= 0; $i--) {
            $date          = now()->subMonths($i);
            $key           = $date->format('Y-m');
            $monthlyData[] = [
                'label' => $date->locale('fr')->isoFormat('MMM YY'),
                'count' => (int) ($rawMonthly[$key] ?? 0),
            ];
        }

        // Répartition par mode de transport ce mois
        $transportBreakdown = Certificate::where('status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->whereMonth('issued_at', now()->month)
            ->whereYear('issued_at', now()->year)
            ->selectRaw('COALESCE(transport_type, \'AUTRE\') as transport_type, COUNT(*) as count')
            ->groupBy('transport_type')
            ->orderByDesc('count')
            ->pluck('count', 'transport_type')
            ->toArray();

        // ── KPIs Contrats ─────────────────────────────────────────
        $contractBase = InsuranceContract::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId));

        $contractStats = [
            'active'      => (clone $contractBase)->where('status', 'ACTIVE')->count(),
            'expiring_30' => (clone $contractBase)->where('status', 'ACTIVE')
                                ->whereDate('expiry_date', '<=', now()->addDays(30))->count(),
            'expiring_7'  => (clone $contractBase)->where('status', 'ACTIVE')
                                ->whereDate('expiry_date', '<=', now()->addDays(7))->count(),
            'draft'       => (clone $contractBase)->where('status', 'DRAFT')->count(),
            'expired'     => (clone $contractBase)->where('status', 'EXPIRED')->count(),
        ];

        $limitUsagePct = InsuranceContract::where('status', 'ACTIVE')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('subscription_limit', '>', 0)
            ->selectRaw("ROUND(AVG(used_limit / subscription_limit * 100), 1) as avg_pct")
            ->value('avg_pct');

        // ── KPIs Commissions ──────────────────────────────────────
        $commBase = CommissionTransaction::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId));

        $commStats = [
            'pending_amount' => (float) (clone $commBase)->where('status', 'PENDING')
                                    ->whereMonth('created_at', now()->month)
                                    ->whereYear('created_at', now()->year)
                                    ->sum('commission'),
            'paid_month'     => (float) (clone $commBase)->where('status', 'PAID')
                                    ->whereMonth('paid_at', now()->month)
                                    ->whereYear('paid_at', now()->year)
                                    ->sum('commission'),
            'pending_count'  => (clone $commBase)->where('status', 'PENDING')->count(),
        ];

        // ── KPIs Escalades ────────────────────────────────────────
        $escaladeBase = fn () => ApprovalRequest::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId));

        $escaladeStats = [
            'pending'  => $escaladeBase()->where('status', 'PENDING')->count(),
            'approved' => $escaladeBase()->where('status', 'APPROVED')
                              ->whereMonth('updated_at', now()->month)
                              ->whereYear('updated_at', now()->year)->count(),
            'rejected' => $escaladeBase()->where('status', 'REJECTED')
                              ->whereMonth('updated_at', now()->month)
                              ->whereYear('updated_at', now()->year)->count(),
        ];

        $approvalTotal = $escaladeStats['approved'] + $escaladeStats['rejected'];
        $approvalRate  = $approvalTotal > 0
            ? round($escaladeStats['approved'] / $approvalTotal * 100, 1)
            : null;

        // ── Top courtiers ce mois (par nb certificats émis) ──────
        $topBrokers = DB::table('certificates')
            ->join('insurance_contracts', 'certificates.contract_id', '=', 'insurance_contracts.id')
            ->join('brokers', 'insurance_contracts.broker_id', '=', 'brokers.id')
            ->where('certificates.status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('certificates.tenant_id', $tenantId))
            ->whereMonth('certificates.issued_at', now()->month)
            ->whereYear('certificates.issued_at', now()->year)
            ->whereNull('certificates.deleted_at')
            ->whereNull('insurance_contracts.deleted_at')
            ->whereNull('brokers.deleted_at')
            ->select(
                'brokers.name as broker_name',
                DB::raw('COUNT(certificates.id) as count'),
                DB::raw('SUM(certificates.insured_value) as total_value'),
                DB::raw('SUM(certificates.prime_total) as total_prime')
            )
            ->groupBy('brokers.id', 'brokers.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return Inertia::render('admin/dashboard/kpi', [
            'certStats'          => $certStats,
            'avgProcessingHours' => $avgProcessingHours ? round($avgProcessingHours, 1) : null,
            'monthlyData'        => $monthlyData,
            'transportBreakdown' => $transportBreakdown,
            'contractStats'      => $contractStats,
            'limitUsagePct'      => $limitUsagePct,
            'commStats'          => $commStats,
            'escaladeStats'      => $escaladeStats,
            'approvalRate'       => $approvalRate,
            'topBrokers'         => $topBrokers,
            'isSA'               => $isSA,
            'currentMonth'       => now()->locale('fr')->isoFormat('MMMM YYYY'),
            'currentYear'        => (int) now()->year,
        ]);
    }
}
