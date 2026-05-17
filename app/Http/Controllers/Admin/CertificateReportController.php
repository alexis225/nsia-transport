<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\Certificate;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * CertificateReportController — US-044
 * ============================================================
 * État des certificats par période : stats agrégées, ventilation
 * par mode de transport et statut, tableau détaillé paginé,
 * export CSV via route existante.
 * ============================================================
 */
class CertificateReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $isSA     = $user->hasRole('super_admin');
        $tenantId = $user->tenant_id;

        // ── Paramètres période ────────────────────────────────────
        $dateFrom  = $request->input('date_from',  now()->startOfMonth()->format('Y-m-d'));
        $dateTo    = $request->input('date_to',    now()->format('Y-m-d'));
        $dateField = $request->input('date_field', 'created_at'); // created_at | issued_at | voyage_date
        $status    = $request->input('status',     'ALL');
        $transport = $request->input('transport');
        $brokerId  = $request->input('broker_id');
        $filterTenant = $request->input('tenant_id');
        $search    = $request->input('search');

        // ── Base période (sans filtre statut/transport) ───────────
        $periodBase = Certificate::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->when($isSA && $filterTenant, fn ($q) => $q->where('tenant_id', $filterTenant))
            ->when($brokerId, fn ($q) => $q->whereHas(
                'contract', fn ($q) => $q->where('broker_id', $brokerId)
            ))
            ->when($search, fn ($q) => $q->where(fn ($q) => $q
                ->where('certificate_number', 'ilike', "%{$search}%")
                ->orWhere('insured_name',      'ilike', "%{$search}%")
            ));

        // Appliquer filtre date selon champ choisi
        $this->applyDateFilter($periodBase, $dateField, $dateFrom, $dateTo);

        // ── Stats globales période ────────────────────────────────
        $stats = [
            'total'          => (clone $periodBase)->count(),
            'issued'         => (clone $periodBase)->where('status', 'ISSUED')->count(),
            'submitted'      => (clone $periodBase)->where('status', 'SUBMITTED')->count(),
            'draft'          => (clone $periodBase)->where('status', 'DRAFT')->count(),
            'cancelled'      => (clone $periodBase)->where('status', 'CANCELLED')->count(),
            'total_insured'  => (float) (clone $periodBase)->sum('insured_value'),
            'total_prime'    => (float) (clone $periodBase)->sum('prime_total'),
            'issued_insured' => (float) (clone $periodBase)->where('status', 'ISSUED')->sum('insured_value'),
            'issued_prime'   => (float) (clone $periodBase)->where('status', 'ISSUED')->sum('prime_total'),
        ];

        // ── Ventilation par mode de transport ────────────────────
        $byTransport = (clone $periodBase)
            ->selectRaw("COALESCE(transport_type, 'AUTRE') as transport_type, COUNT(*) as count, SUM(insured_value) as total_value, SUM(prime_total) as total_prime")
            ->groupBy('transport_type')
            ->orderByDesc('count')
            ->get()
            ->toArray();

        // ── Ventilation par statut ────────────────────────────────
        $byStatus = (clone $periodBase)
            ->selectRaw("status, COUNT(*) as count, SUM(insured_value) as total_value")
            ->groupBy('status')
            ->orderByDesc('count')
            ->get()
            ->toArray();

        // ── Base filtrée (+ statut + transport) pour le tableau ──
        $filteredBase = (clone $periodBase)
            ->when($status !== 'ALL', fn ($q) => $q->where('status', $status))
            ->when($transport, fn ($q) => $q->where('transport_type', $transport));

        // ── Tableau paginé ────────────────────────────────────────
        $certificates = $filteredBase
            ->with([
                'tenant:id,name,code',
                'contract:id,contract_number,broker_id',
                'contract.broker:id,name',
                'issuedBy:id,first_name,last_name',
            ])
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        // ── Listes déroulantes ────────────────────────────────────
        $brokers = Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $tenants = $isSA
            ? Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])
            : collect();

        return Inertia::render('admin/reports/certificates', [
            'certificates' => $certificates,
            'stats'        => $stats,
            'byTransport'  => $byTransport,
            'byStatus'     => $byStatus,
            'brokers'      => $brokers,
            'tenants'      => $tenants,
            'filters'      => [
                'date_from'  => $dateFrom,
                'date_to'    => $dateTo,
                'date_field' => $dateField,
                'status'     => $status,
                'transport'  => $transport,
                'broker_id'  => $brokerId,
                'tenant_id'  => $filterTenant,
                'search'     => $search,
            ],
            'isSA'         => $isSA,
        ]);
    }

    private function applyDateFilter(\Illuminate\Database\Eloquent\Builder $query, string $field, string $from, string $to): void
    {
        match ($field) {
            'voyage_date' => $query->whereBetween('voyage_date', [$from, $to]),
            'issued_at'   => $query->whereDate('issued_at', '>=', $from)->whereDate('issued_at', '<=', $to),
            default       => $query->whereDate('created_at', '>=', $from)->whereDate('created_at', '<=', $to),
        };
    }
}
