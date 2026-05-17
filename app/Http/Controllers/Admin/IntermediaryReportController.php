<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\Coinsurer;
use App\Models\CommissionTransaction;
use App\Models\Expert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * IntermediaryReportController — US-046
 * ============================================================
 * État des intermédiaires en trois onglets :
 *   - Courtiers (avec activité certifs + commissions)
 *   - Coassureurs (avec participation contrats)
 *   - Experts
 * ============================================================
 */
class IntermediaryReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $isSA     = $user->hasRole('super_admin');
        $tenantId = $user->tenant_id;

        $tab = $request->input('tab', 'brokers'); // brokers | coinsurers | experts

        // ── COURTIERS ─────────────────────────────────────────────
        $brokersQuery = Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->with('tenant:id,name,code')
            ->withCount([
                'contracts',
                'contracts as active_contracts_count' => fn ($q) => $q->where('status', 'ACTIVE'),
            ])
            ->orderBy('name');

        $brokers = $brokersQuery->get();

        // Certificats ISSUED ce mois par courtier
        $certsByBroker = DB::table('certificates')
            ->join('insurance_contracts', 'certificates.contract_id', '=', 'insurance_contracts.id')
            ->where('certificates.status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('certificates.tenant_id', $tenantId))
            ->whereMonth('certificates.issued_at', now()->month)
            ->whereYear('certificates.issued_at', now()->year)
            ->whereNull('certificates.deleted_at')
            ->whereNull('insurance_contracts.deleted_at')
            ->whereNotNull('insurance_contracts.broker_id')
            ->selectRaw('insurance_contracts.broker_id, COUNT(certificates.id) as count')
            ->groupBy('insurance_contracts.broker_id')
            ->pluck('count', 'broker_id')
            ->toArray();

        // Certificats ISSUED cette année par courtier
        $certsByBrokerYtd = DB::table('certificates')
            ->join('insurance_contracts', 'certificates.contract_id', '=', 'insurance_contracts.id')
            ->where('certificates.status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('certificates.tenant_id', $tenantId))
            ->whereYear('certificates.issued_at', now()->year)
            ->whereNull('certificates.deleted_at')
            ->whereNull('insurance_contracts.deleted_at')
            ->whereNotNull('insurance_contracts.broker_id')
            ->selectRaw('insurance_contracts.broker_id, COUNT(certificates.id) as count')
            ->groupBy('insurance_contracts.broker_id')
            ->pluck('count', 'broker_id')
            ->toArray();

        // Commissions payées cette année par courtier
        $commByBroker = CommissionTransaction::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('status', 'PAID')
            ->whereYear('paid_at', now()->year)
            ->selectRaw('broker_id, SUM(commission) as total_paid')
            ->groupBy('broker_id')
            ->pluck('total_paid', 'broker_id')
            ->toArray();

        // Commissions en attente par courtier
        $commPendingByBroker = CommissionTransaction::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('status', 'PENDING')
            ->selectRaw('broker_id, SUM(commission) as total_pending, COUNT(*) as pending_count')
            ->groupBy('broker_id')
            ->get()
            ->keyBy('broker_id')
            ->toArray();

        // Enrichir chaque courtier
        $brokersData = $brokers->map(fn ($b) => array_merge($b->toArray(), [
            'certs_month'     => (int) ($certsByBroker[$b->id]     ?? 0),
            'certs_ytd'       => (int) ($certsByBrokerYtd[$b->id]  ?? 0),
            'comm_paid_ytd'   => (float) ($commByBroker[$b->id]    ?? 0),
            'comm_pending'    => (float) ($commPendingByBroker[$b->id]['total_pending'] ?? 0),
            'comm_pending_count' => (int) ($commPendingByBroker[$b->id]['pending_count'] ?? 0),
        ]));

        // Stats courtiers
        $brokerStats = [
            'total'    => $brokers->count(),
            'active'   => $brokers->where('is_active', true)->count(),
            'inactive' => $brokers->where('is_active', false)->count(),
            'local'    => $brokers->where('type', Broker::TYPE_LOCAL)->count(),
            'foreign'  => $brokers->where('type', Broker::TYPE_FOREIGN)->count(),
            'with_certs_month' => count(array_filter($certsByBroker, fn ($c) => $c > 0)),
        ];

        // ── COASSUREURS ───────────────────────────────────────────
        $coinsurers = Coinsurer::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->with('tenant:id,name,code')
            ->withCount([
                'contracts',
                'contracts as active_contracts_count' => fn ($q) => $q->where('status', 'ACTIVE'),
            ])
            ->orderBy('name')
            ->get();

        $coinsurersStats = [
            'total'    => $coinsurers->count(),
            'active'   => $coinsurers->where('is_active', true)->count(),
            'inactive' => $coinsurers->where('is_active', false)->count(),
        ];

        // ── EXPERTS ───────────────────────────────────────────────
        $experts = Expert::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->with('tenant:id,name,code')
            ->orderBy('name')
            ->get();

        $expertStats = [
            'total'    => $experts->count(),
            'active'   => $experts->where('is_active', true)->count(),
            'inactive' => $experts->where('is_active', false)->count(),
        ];

        return Inertia::render('admin/reports/intermediaries', [
            'brokersData'     => $brokersData->values(),
            'brokerStats'     => $brokerStats,
            'coinsurers'      => $coinsurers,
            'coinsurersStats' => $coinsurersStats,
            'experts'         => $experts,
            'expertStats'     => $expertStats,
            'tab'             => $tab,
            'isSA'            => $isSA,
            'currentMonth'    => now()->locale('fr')->isoFormat('MMMM YYYY'),
            'currentYear'     => (int) now()->year,
        ]);
    }
}
