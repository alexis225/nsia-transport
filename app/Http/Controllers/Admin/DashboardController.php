<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\InsuranceContract;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * DashboardController — US-024
 * ============================================================
 * Dashboard des certificats en attente de validation.
 * Accessible aux souscripteurs et admins filiale.
 * ============================================================
 */
class DashboardController extends Controller
{
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
            ->orderBy('submitted_at', 'asc') // plus anciens en premier = urgents
            ->paginate(15)
            ->withQueryString();

        // ── Stats globales ────────────────────────────────────
        $baseQuery = Certificate::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id));

        $stats = [
            'submitted'      => (clone $baseQuery)->where('status', 'SUBMITTED')->count(),
            'issued_today'   => (clone $baseQuery)->where('status', 'ISSUED')
                                    ->whereDate('issued_at', today())->count(),
            'issued_week'    => (clone $baseQuery)->where('status', 'ISSUED')
                                    ->whereBetween('issued_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'issued_month'   => (clone $baseQuery)->where('status', 'ISSUED')
                                    ->whereMonth('issued_at', now()->month)
                                    ->whereYear('issued_at', now()->year)->count(),
            'draft'          => (clone $baseQuery)->where('status', 'DRAFT')->count(),
            'cancelled_month'=> (clone $baseQuery)->where('status', 'CANCELLED')
                                    ->whereMonth('cancelled_at', now()->month)->count(),
        ];

        // ── Délai moyen de traitement (en heures) ─────────────
        $avgProcessing = Certificate::where('status', 'ISSUED')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->whereNotNull('submitted_at')
            ->whereNotNull('issued_at')
            ->whereMonth('issued_at', now()->month)
            ->selectRaw("AVG(EXTRACT(EPOCH FROM (issued_at - submitted_at)) / 3600) as avg_hours")
            ->value('avg_hours');

        // ── Activité récente (derniers 10 certificats émis) ───
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

        // ── Alertes contrats proches expiration ───────────────
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
}