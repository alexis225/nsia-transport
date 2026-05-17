<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * US-055 — Recherche avancée multi-critères certificats
 * Page dédiée à la recherche : tous les filtres visibles dès le départ,
 * résultats paginés avec résumé de la requête.
 */
class CertificateSearchController extends Controller
{
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $isSA     = $user->hasRole('super_admin');
        $tenantId = $user->tenant_id;

        $hasSearch = collect($request->except(['page']))->filter()->isNotEmpty();

        $query = Certificate::with([
                'tenant:id,name,code',
                'contract:id,contract_number,broker_id',
                'contract.broker:id,name',
                'template:id,name,type',
                'issuedBy:id,first_name,last_name',
                'submittedBy:id,first_name,last_name',
            ])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->when($isSA && $request->tenant_id, fn ($q) => $q->where('tenant_id', $request->tenant_id));

        if ($hasSearch) {
            $query
                // Recherche textuelle multi-champs
                ->when($request->q, fn ($q, $v) => $q->where(fn ($q) => $q
                    ->where('certificate_number', 'ilike', "%{$v}%")
                    ->orWhere('policy_number',    'ilike', "%{$v}%")
                    ->orWhere('insured_name',      'ilike', "%{$v}%")
                    ->orWhere('insured_ref',       'ilike', "%{$v}%")
                    ->orWhere('voyage_from',       'ilike', "%{$v}%")
                    ->orWhere('voyage_to',         'ilike', "%{$v}%")
                    ->orWhere('vessel_name',       'ilike', "%{$v}%")
                    ->orWhere('flight_number',     'ilike', "%{$v}%")
                ))
                ->when($request->status,         fn ($q, $v) => $q->where('status', $v))
                ->when($request->transport_type, fn ($q, $v) => $q->where('transport_type', $v))
                ->when($request->document_type,  fn ($q, $v) => $q->where('document_type', $v))
                ->when($request->currency_code,  fn ($q, $v) => $q->where('currency_code', $v))
                ->when($request->guarantee_mode, fn ($q, $v) => $q->where('guarantee_mode', $v))
                // Plages de dates
                ->when($request->issued_from,    fn ($q, $v) => $q->whereDate('issued_at', '>=', $v))
                ->when($request->issued_to,      fn ($q, $v) => $q->whereDate('issued_at', '<=', $v))
                ->when($request->voyage_from_date, fn ($q, $v) => $q->whereDate('voyage_date', '>=', $v))
                ->when($request->voyage_to_date,   fn ($q, $v) => $q->whereDate('voyage_date', '<=', $v))
                ->when($request->created_from,   fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
                ->when($request->created_to,     fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
                // Valeurs
                ->when($request->value_min, fn ($q, $v) => $q->where('insured_value', '>=', $v))
                ->when($request->value_max, fn ($q, $v) => $q->where('insured_value', '<=', $v))
                // Relations
                ->when($request->broker_id, fn ($q, $v) => $q->whereHas(
                    'contract', fn ($q) => $q->where('broker_id', $v)
                ))
                ->when($request->template_id, fn ($q, $v) => $q->where('template_id', $v));
        }

        $results = $hasSearch
            ? $query->orderByDesc('created_at')->paginate(20)->withQueryString()
            : null;

        // Dropdowns
        $brokers = Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('is_active', true)->orderBy('name')->get(['id', 'name']);

        $templates = CertificateTemplate::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->orderBy('name')->get(['id', 'name', 'type']);

        $tenants = $isSA
            ? Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])
            : collect();

        // Devises distinctes
        $currencies = Certificate::when(! $isSA, fn ($q) => $q->where('tenant_id', $tenantId))
            ->distinct()->orderBy('currency_code')->pluck('currency_code');

        return Inertia::render('admin/certificates/search', [
            'results'    => $results,
            'hasSearch'  => $hasSearch,
            'filters'    => $request->except(['page']),
            'brokers'    => $brokers,
            'templates'  => $templates,
            'tenants'    => $tenants,
            'currencies' => $currencies,
            'isSA'       => $isSA,
        ]);
    }
}
