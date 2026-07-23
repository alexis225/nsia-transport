<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Tenant;
use App\Models\TaxRule;
use App\Models\TransportMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * TaxRuleController — Gestion des taxes
 * ============================================================
 * Référentiel de taxes par filiale × mode de transport × pays,
 * utilisé automatiquement à l'émission des certificats (voir
 * CertificateController::buildPrimeBreakdown()).
 * ============================================================
 */
class TaxRuleController extends Controller
{
    public function rules(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $rules = TaxRule::with(['tenant:id,name,code', 'transportMode:id,code,name_fr', 'country:code,name_fr', 'createdByUser:id,first_name,last_name'])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->tenant_id && $isSA, fn ($q) => $q->where('tenant_id', $request->tenant_id))
            ->orderBy('effective_date', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/taxes/rules', [
            'rules'          => $rules,
            'tenants'        => $isSA ? Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']) : collect(),
            'transportModes' => TransportMode::orderBy('name_fr')->get(['id', 'code', 'name_fr']),
            'countries'      => Country::orderBy('name_fr')->get(['code', 'name_fr']),
            'filters'        => $request->only(['tenant_id']),
            'isSA'           => $isSA,
            'defaultTenantId'=> $user->tenant_id,
        ]);
    }

    public function storeRule(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(! ($user->hasRole('admin_filiale') || $user->hasRole('super_admin')), 403);
        $isSA = $user->hasRole('super_admin');

        $validated = $request->validate([
            'tenant_id'         => [$isSA ? 'required' : 'nullable', 'uuid', 'exists:tenants,id'],
            'transport_mode_id' => ['required', 'exists:transport_modes,id'],
            'country_code'      => ['required', 'string', 'size:2', 'exists:countries,code'],
            'rate_pct'          => ['required', 'numeric', 'min:0', 'max:100'],
            'effective_date'    => ['required', 'date'],
            'end_date'          => ['nullable', 'date', 'after:effective_date'],
            'notes'             => ['nullable', 'string', 'max:255'],
        ]);

        TaxRule::create([
            'tenant_id'         => $isSA ? $validated['tenant_id'] : $user->tenant_id,
            'transport_mode_id' => $validated['transport_mode_id'],
            'country_code'      => $validated['country_code'],
            'rate_pct'          => $validated['rate_pct'],
            'effective_date'    => $validated['effective_date'],
            'end_date'          => $validated['end_date'] ?? null,
            'is_active'         => true,
            'notes'             => $validated['notes'] ?? null,
            'created_by'        => $user->id,
        ]);

        return back()->with('status', 'Taux de taxe créé.');
    }

    public function toggleRule(Request $request, TaxRule $rule): RedirectResponse
    {
        $this->authorizeTenant($rule->tenant_id);
        $rule->update(['is_active' => ! $rule->is_active]);

        return back()->with('status', $rule->is_active ? 'Taux activé.' : 'Taux désactivé.');
    }

    private function authorizeTenant(string $tenantId): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        if ((string) $user->tenant_id !== (string) $tenantId) abort(403);
    }
}
