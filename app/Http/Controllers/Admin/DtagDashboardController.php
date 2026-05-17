<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * US-048 — Dashboard consolidé multi-filiales DTAG
 * Réservé au super_admin uniquement.
 */
class DtagDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasRole('super_admin'), 403);

        $tenants = Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']);

        // ── KPIs globaux ──────────────────────────────────────────
        $globalCertBase = Certificate::query();

        $global = [
            'issued_month'   => (clone $globalCertBase)->where('status', 'ISSUED')
                                    ->whereMonth('issued_at', now()->month)->whereYear('issued_at', now()->year)->count(),
            'issued_ytd'     => (clone $globalCertBase)->where('status', 'ISSUED')
                                    ->whereYear('issued_at', now()->year)->count(),
            'submitted'      => (clone $globalCertBase)->where('status', 'SUBMITTED')->count(),
            'contracts_active' => InsuranceContract::where('status', 'ACTIVE')->count(),
            'prime_month'    => (float)(clone $globalCertBase)->where('status', 'ISSUED')
                                    ->whereMonth('issued_at', now()->month)->whereYear('issued_at', now()->year)
                                    ->sum('prime_total'),
        ];

        // ── KPIs par filiale ──────────────────────────────────────
        $byTenant = $tenants->map(function ($tenant) {
            $base = Certificate::where('tenant_id', $tenant->id);

            $issuedMonth = (clone $base)->where('status', 'ISSUED')
                ->whereMonth('issued_at', now()->month)->whereYear('issued_at', now()->year)->count();

            $issuedPrev = (clone $base)->where('status', 'ISSUED')
                ->whereMonth('issued_at', now()->subMonthNoOverflow()->month)
                ->whereYear('issued_at', now()->subMonthNoOverflow()->year)->count();

            $primeMonth = (float)(clone $base)->where('status', 'ISSUED')
                ->whereMonth('issued_at', now()->month)->whereYear('issued_at', now()->year)
                ->sum('prime_total');

            $submitted = (clone $base)->where('status', 'SUBMITTED')->count();

            $contractsActive = InsuranceContract::where('tenant_id', $tenant->id)
                ->where('status', 'ACTIVE')->count();

            $expiringContracts = InsuranceContract::where('tenant_id', $tenant->id)
                ->where('status', 'ACTIVE')
                ->whereDate('expiry_date', '<=', now()->addDays(30))->count();

            $ytd = (clone $base)->where('status', 'ISSUED')
                ->whereYear('issued_at', now()->year)->count();

            return [
                'id'                 => $tenant->id,
                'name'               => $tenant->name,
                'code'               => $tenant->code,
                'issued_month'       => $issuedMonth,
                'issued_prev_month'  => $issuedPrev,
                'issued_ytd'         => $ytd,
                'prime_month'        => $primeMonth,
                'submitted'          => $submitted,
                'contracts_active'   => $contractsActive,
                'expiring_contracts' => $expiringContracts,
            ];
        });

        // ── Tendance 12 mois globale ──────────────────────────────
        $rawMonthly = Certificate::where('status', 'ISSUED')
            ->where('issued_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("TO_CHAR(issued_at, 'YYYY-MM') as month_key, COUNT(*) as issued, COALESCE(SUM(prime_total), 0) as amount")
            ->groupBy('month_key')
            ->orderBy('month_key')
            ->get()
            ->keyBy('month_key');

        $monthlyData = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $key  = $date->format('Y-m');
            $monthlyData[] = [
                'label'  => $date->locale('fr')->isoFormat('MMM YY'),
                'issued' => (int)($rawMonthly[$key]->issued ?? 0),
                'amount' => (float)($rawMonthly[$key]->amount ?? 0),
            ];
        }

        // ── Top 5 filiales ce mois par volume ─────────────────────
        $topTenants = DB::table('certificates')
            ->join('tenants', 'certificates.tenant_id', '=', 'tenants.id')
            ->where('certificates.status', 'ISSUED')
            ->whereMonth('certificates.issued_at', now()->month)
            ->whereYear('certificates.issued_at', now()->year)
            ->whereNull('certificates.deleted_at')
            ->select('tenants.name', 'tenants.code',
                DB::raw('COUNT(certificates.id) as count'),
                DB::raw('COALESCE(SUM(certificates.prime_total), 0) as total_prime'))
            ->groupBy('tenants.id', 'tenants.name', 'tenants.code')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return Inertia::render('admin/dashboard/dtag', [
            'global'      => $global,
            'byTenant'    => $byTenant->values(),
            'monthlyData' => $monthlyData,
            'topTenants'  => $topTenants,
            'tenantCount' => $tenants->count(),
            'currentMonth'=> now()->locale('fr')->isoFormat('MMMM YYYY'),
            'currentYear' => (int)now()->year,
        ]);
    }
}
