<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\Certificate;
use App\Models\CertificateRequest;
use App\Models\InsuranceContract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * DashboardController
 * ============================================================
 * index()   — Dashboard principal avec KPIs dynamiques (US-024 update)
 * pending() — File de validation (US-024)
 * ============================================================
 */
class DashboardController extends Controller
{
    // ── Dashboard principal ───────────────────────────────────
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $isSA     = $user->hasRole('super_admin');
        $tenantId = $user->tenant_id;

        $withTenant = fn ($q) => $q->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId));

        // ── KPI 1 : Certificats émis ──────────────────────────
        $certBase = Certificate::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId));

        $issuedMonth = (clone $certBase)->where('status', 'ISSUED')
            ->whereMonth('issued_at', now()->month)
            ->whereYear('issued_at', now()->year)
            ->count();

        $issuedPrev = (clone $certBase)->where('status', 'ISSUED')
            ->whereMonth('issued_at', now()->subMonthNoOverflow()->month)
            ->whereYear('issued_at', now()->subMonthNoOverflow()->year)
            ->count();

        // ── KPI 2 : Primes assurées (ISSUED ce mois) ──────────
        $primeMonth = (float) (clone $certBase)->where('status', 'ISSUED')
            ->whereMonth('issued_at', now()->month)
            ->whereYear('issued_at', now()->year)
            ->sum('prime_total');

        $primePrev = (float) (clone $certBase)->where('status', 'ISSUED')
            ->whereMonth('issued_at', now()->subMonthNoOverflow()->month)
            ->whereYear('issued_at', now()->subMonthNoOverflow()->year)
            ->sum('prime_total');

        // ── KPI 3 : Contrats actifs ───────────────────────────
        $contractBase = InsuranceContract::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId));

        $contractsActive = (clone $contractBase)->where('status', 'ACTIVE')->count();

        // Nouveaux contrats ACTIVE ce mois vs mois préc.
        $contractsNewMonth = (clone $contractBase)->where('status', 'ACTIVE')
            ->whereMonth('effective_date', now()->month)
            ->whereYear('effective_date', now()->year)
            ->count();

        $contractsNewPrev = (clone $contractBase)->where('status', 'ACTIVE')
            ->whereMonth('effective_date', now()->subMonthNoOverflow()->month)
            ->whereYear('effective_date', now()->subMonthNoOverflow()->year)
            ->count();

        // ── KPI 4 : Courtiers ayant émis ce mois ─────────────
        $brokersMonth = DB::table('certificates')
            ->join('insurance_contracts', 'certificates.contract_id', '=', 'insurance_contracts.id')
            ->where('certificates.status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('certificates.tenant_id', $tenantId))
            ->whereMonth('certificates.issued_at', now()->month)
            ->whereYear('certificates.issued_at', now()->year)
            ->whereNull('certificates.deleted_at')
            ->whereNull('insurance_contracts.deleted_at')
            ->whereNotNull('insurance_contracts.broker_id')
            ->distinct()
            ->count('insurance_contracts.broker_id');

        $brokersPrev = DB::table('certificates')
            ->join('insurance_contracts', 'certificates.contract_id', '=', 'insurance_contracts.id')
            ->where('certificates.status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('certificates.tenant_id', $tenantId))
            ->whereMonth('certificates.issued_at', now()->subMonthNoOverflow()->month)
            ->whereYear('certificates.issued_at', now()->subMonthNoOverflow()->year)
            ->whereNull('certificates.deleted_at')
            ->whereNull('insurance_contracts.deleted_at')
            ->whereNotNull('insurance_contracts.broker_id')
            ->distinct()
            ->count('insurance_contracts.broker_id');

        $kpis = [
            [
                'label'  => 'Certificats émis',
                'value'  => number_format($issuedMonth, 0, ',', ' '),
                'change' => $this->pctChange($issuedMonth, $issuedPrev),
                'sub'    => 'Ce mois',
            ],
            [
                'label'  => 'Primes émises',
                'value'  => $this->fmtAmount($primeMonth),
                'change' => $this->pctChange($primeMonth, $primePrev),
                'sub'    => 'Ce mois',
            ],
            [
                'label'  => 'Contrats actifs',
                'value'  => (string) $contractsActive,
                'change' => $this->pctChange($contractsNewMonth, $contractsNewPrev),
                'sub'    => 'Total',
            ],
            [
                'label'  => 'Courtiers actifs',
                'value'  => (string) $brokersMonth,
                'change' => $this->pctChange($brokersMonth, $brokersPrev),
                'sub'    => 'Ce mois',
            ],
        ];

        // ── Tendance mensuelle (12 mois) ──────────────────────
        $rawMonthly = Certificate::where('status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('issued_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("TO_CHAR(issued_at, 'YYYY-MM') as month_key, COUNT(*) as issued, COALESCE(SUM(prime_total), 0) as amount")
            ->groupBy('month_key')
            ->orderBy('month_key')
            ->pluck('amount', 'month_key')  // pour lookup rapide
            ->toArray();

        $rawCounts = Certificate::where('status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('issued_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("TO_CHAR(issued_at, 'YYYY-MM') as month_key, COUNT(*) as issued")
            ->groupBy('month_key')
            ->pluck('issued', 'month_key')
            ->toArray();

        $monthlyData = [];
        for ($i = 11; $i >= 0; $i--) {
            $date          = now()->subMonths($i);
            $key           = $date->format('Y-m');
            $monthlyData[] = [
                'month'  => $date->locale('fr')->isoFormat('MMM'),
                'issued' => (int) ($rawCounts[$key] ?? 0),
                'amount' => (float) ($rawMonthly[$key] ?? 0),
            ];
        }

        // ── Certificats récents ───────────────────────────────
        $recentCerts = Certificate::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->whereIn('status', ['ISSUED', 'SUBMITTED'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get(['id', 'certificate_number', 'insured_name', 'insured_value', 'currency_code', 'status', 'issued_at', 'created_at'])
            ->map(fn ($c) => [
                'id'     => $c->id,
                'number' => $c->certificate_number,
                'client' => $c->insured_name,
                'amount' => number_format((float) $c->insured_value, 0, ',', ' ') . ' ' . $c->currency_code,
                'status' => $c->status,
                'date'   => $c->issued_at?->format('d/m/Y') ?? $c->created_at->format('d/m/Y'),
            ]);

        // ── Top courtiers ce mois ─────────────────────────────
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
                'brokers.name',
                DB::raw('COUNT(certificates.id) as count'),
                DB::raw('COALESCE(SUM(certificates.prime_total), 0) as total_prime')
            )
            ->groupBy('brokers.id', 'brokers.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn ($b) => [
                'name'   => $b->name,
                'count'  => (int) $b->count,
                'amount' => $this->fmtAmount((float) $b->total_prime),
            ]);

        // ── Top assurés ce mois (fusionne "clients"/"assurés" — même
        // donnée insured_name, il n'existe pas de compte client distinct) ──
        $topInsured = (clone $certBase)->where('status', 'ISSUED')
            ->whereMonth('issued_at', now()->month)
            ->whereYear('issued_at', now()->year)
            ->select('insured_name', DB::raw('COUNT(*) as count'), DB::raw('COALESCE(SUM(prime_total), 0) as total_prime'))
            ->groupBy('insured_name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'name'   => $r->insured_name,
                'count'  => (int) $r->count,
                'amount' => $this->fmtAmount((float) $r->total_prime),
            ]);

        // ── Top 3 filiales ce mois (super_admin uniquement — une
        // filiale seule ne peut pas se classer par rapport à elle-même) ──
        $topFiliales = $isSA
            ? DB::table('certificates')
                ->join('tenants', 'certificates.tenant_id', '=', 'tenants.id')
                ->where('certificates.status', 'ISSUED')
                ->whereMonth('certificates.issued_at', now()->month)
                ->whereYear('certificates.issued_at', now()->year)
                ->whereNull('certificates.deleted_at')
                ->select('tenants.name', DB::raw('COUNT(certificates.id) as count'), DB::raw('COALESCE(SUM(certificates.prime_total), 0) as total_prime'))
                ->groupBy('tenants.id', 'tenants.name')
                ->orderByDesc('count')
                ->limit(3)
                ->get()
                ->map(fn ($t) => [
                    'name'   => $t->name,
                    'count'  => (int) $t->count,
                    'amount' => $this->fmtAmount((float) $t->total_prime),
                ])
            : collect();

        // ── Indicateurs complémentaires (ajoutés à côté des KPIs
        // existants, sans en changer la définition) ──────────────
        $brokersActiveTotal = Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->active()->count();

        $primeAllTime = (float) (clone $certBase)->where('status', 'ISSUED')->sum('prime_total');

        // ── Suivi opérationnel — demandes de certificats (portail
        // partenaires) : reçues (total), en attente (PENDING+IN_REVIEW,
        // même définition que la file d'attente de la page Demandes),
        // traitées (APPROVED+REJECTED) ─────────────────────────────
        $requestBase = CertificateRequest::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId));

        $operationalStats = [
            'received'  => (clone $requestBase)->count(),
            'pending'   => (clone $requestBase)->whereIn('status', ['PENDING', 'IN_REVIEW'])->count(),
            'processed' => (clone $requestBase)->whereIn('status', ['APPROVED', 'REJECTED'])->count(),
        ];

        return Inertia::render('dashboard', [
            'kpis'               => $kpis,
            'recentCerts'        => $recentCerts,
            'topBrokers'         => $topBrokers,
            'topInsured'         => $topInsured,
            'topFiliales'        => $topFiliales,
            'monthlyData'        => $monthlyData,
            'period'             => now()->locale('fr')->isoFormat('MMMM YYYY'),
            'tenantName'         => $user->tenant?->name ?? 'Toutes filiales',
            'isSA'               => $isSA,
            'brokersActiveTotal' => $brokersActiveTotal,
            'primeAllTime'       => $this->fmtAmount($primeAllTime),
            'operationalStats'   => $operationalStats,
        ]);
    }

    // ── File de validation — US-024 ───────────────────────────
    public function pending(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        // ── Certificats en attente (SUBMITTED) ────────────────
        $pending = Certificate::with([
                'tenant:id,name,code',
                'contract:id,contract_number,insured_name',
                'template:id,name,type',
                'submittedBy:id,first_name,last_name',
            ])
            ->where('status', Certificate::STATUS_SUBMITTED)
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->tenant_id && $isSA, fn ($q) => $q->where('tenant_id', $request->tenant_id))
            ->orderBy('submitted_at', 'asc')
            ->paginate(15)
            ->withQueryString();

        // ── Stats globales ────────────────────────────────────
        $baseQuery = Certificate::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id));

        $stats = [
            'submitted'       => (clone $baseQuery)->where('status', 'SUBMITTED')->count(),
            'issued_today'    => (clone $baseQuery)->where('status', 'ISSUED')->whereDate('issued_at', today())->count(),
            'issued_week'     => (clone $baseQuery)->where('status', 'ISSUED')->whereBetween('issued_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'issued_month'    => (clone $baseQuery)->where('status', 'ISSUED')->whereMonth('issued_at', now()->month)->whereYear('issued_at', now()->year)->count(),
            'draft'           => (clone $baseQuery)->where('status', 'DRAFT')->count(),
            'cancelled_month' => (clone $baseQuery)->where('status', 'CANCELLED')->whereMonth('cancelled_at', now()->month)->count(),
        ];

        $avgProcessing = Certificate::where('status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->whereNotNull('submitted_at')
            ->whereNotNull('issued_at')
            ->whereMonth('issued_at', now()->month)
            ->selectRaw("AVG(EXTRACT(EPOCH FROM (issued_at - submitted_at)) / 3600) as avg_hours")
            ->value('avg_hours');

        $recentIssued = Certificate::with([
                'submittedBy:id,first_name,last_name',
                'issuedBy:id,first_name,last_name',
                'contract:id,contract_number',
            ])
            ->where('status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->orderBy('issued_at', 'desc')
            ->limit(8)
            ->get();

        $expiringContracts = InsuranceContract::with('tenant:id,name,code')
            ->where('status', 'ACTIVE')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->orderBy('expiry_date', 'asc')
            ->limit(5)
            ->get(['id', 'contract_number', 'insured_name', 'expiry_date', 'tenant_id']);

        return Inertia::render('admin/dashboard/pending', [
            'pending'            => $pending,
            'stats'              => $stats,
            'avgProcessingHours' => $avgProcessing ? round($avgProcessing, 1) : null,
            'recentIssued'       => $recentIssued,
            'expiringContracts'  => $expiringContracts,
            'filters'            => $request->only(['tenant_id']),
            'isSA'               => $isSA,
            'can'                => [
                'validate' => $user->can('certificates.validate'),
            ],
        ]);
    }

    // ── Helpers privés ────────────────────────────────────────
    private function pctChange(float|int $current, float|int $previous): int
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }
        return (int) round(($current - $previous) / $previous * 100);
    }

    private function fmtAmount(float $amount): string
    {
        if ($amount >= 1_000_000_000) {
            return number_format($amount / 1_000_000_000, 1, ',', ' ') . 'G';
        }
        if ($amount >= 1_000_000) {
            return number_format($amount / 1_000_000, 1, ',', ' ') . 'M';
        }
        if ($amount >= 1_000) {
            return number_format($amount / 1_000, 0, ',', ' ') . 'K';
        }
        return number_format($amount, 0, ',', ' ');
    }
}
