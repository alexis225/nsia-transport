<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Broker;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * BrokerController — US-010
 * ============================================================
 * CRUD courtiers avec isolation tenant.
 * ============================================================
 */
class BrokerController extends Controller
{
    // ── Liste ────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $brokers = Broker::with('tenant')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->search, fn ($q) =>
                $q->where(fn ($q) =>
                    $q->where('name',  'ilike', "%{$request->search}%")
                      ->orWhere('code', 'ilike', "%{$request->search}%")
                      ->orWhere('email','ilike', "%{$request->search}%")
                )
            )
            ->when($request->type, fn ($q) => $q->where('type', $request->type))
            ->when($request->status !== null && $request->status !== '', fn ($q) =>
                $q->where('is_active', $request->status === 'active')
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/brokers/index', [
            'brokers' => $brokers,
            'filters' => $request->only(['search', 'type', 'status']),
            'isSA'    => $isSA,
            'can'     => [
                'create' => $request->user()->can('brokers.create'),
                'edit'   => $request->user()->can('brokers.edit'),
                'delete' => $request->user()->can('brokers.delete'),
            ],
        ]);
    }

    // ── Formulaire création ──────────────────────────────────
    public function create(Request $request): Response
    {
        return Inertia::render('admin/brokers/create', [
            'tenants' => $request->user()->hasRole('super_admin')
                ? Tenant::active()->orderBy('name')->get(['id', 'name', 'code'])
                : collect(),
            'defaultTenantId' => $request->user()->tenant_id,
        ]);
    }

    // ── Créer ────────────────────────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:200'],
            'code'             => ['required', 'string', 'max:20', 'unique:brokers,code', 'regex:/^[A-Z0-9_-]{2,20}$/'],
            'type'             => ['required', 'in:courtier_local,partenaire_etranger'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'email'            => ['nullable', 'email', 'max:255'],
            'phone'            => ['nullable', 'string', 'max:30'],
            'phone_secondary'  => ['nullable', 'string', 'max:30'],
            'address'          => ['nullable', 'string', 'max:255'],
            'city'             => ['nullable', 'string', 'max:100'],
            'country_code'     => ['nullable', 'string', 'size:2'],
            'is_active'        => ['boolean'],
            'tenant_id'        => ['nullable', 'uuid', 'exists:tenants,id'],
        ], [
            'code.regex'  => 'Le code doit être en majuscules, chiffres, tirets ou underscores.',
            'code.unique' => 'Ce code est déjà utilisé.',
        ]);

        $broker = Broker::create([
            ...$validated,
            'tenant_id'  => $validated['tenant_id'] ?? $request->user()->tenant_id,
            'created_by' => $request->user()->id,
            'is_active'  => $validated['is_active'] ?? true,
        ]);

        AuditLog::create([
            'tenant_id'   => $broker->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'broker_created',
            'entity_type' => 'broker',
            'entity_id'   => $broker->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => ['name' => $broker->name, 'code' => $broker->code],
        ]);

        return redirect()->route('admin.brokers.index')
            ->with('status', "Courtier {$broker->name} créé avec succès.");
    }

    // ── Détail ───────────────────────────────────────────────
    public function show(Broker $broker): Response
    {
        $this->authorizeTenant($broker);
        $broker->load('tenant');

        return Inertia::render('admin/brokers/show', [
            'broker' => $broker,
        ]);
    }

    // ── Formulaire modification ──────────────────────────────
    public function edit(Request $request, Broker $broker): Response
    {
        $this->authorizeTenant($broker);
        $broker->load('tenant');

        return Inertia::render('admin/brokers/edit', [
            'broker'  => $broker,
            'tenants' => $request->user()->hasRole('super_admin')
                ? Tenant::active()->orderBy('name')->get(['id', 'name', 'code'])
                : collect(),
        ]);
    }

    // ── Modifier ─────────────────────────────────────────────
    public function update(Request $request, Broker $broker): RedirectResponse
    {
        $this->authorizeTenant($broker);

        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:200'],
            'code'             => ['required', 'string', 'max:20', Rule::unique('brokers', 'code')->ignore($broker->id), 'regex:/^[A-Z0-9_-]{2,20}$/'],
            'type'             => ['required', 'in:courtier_local,partenaire_etranger'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'email'            => ['nullable', 'email', 'max:255'],
            'phone'            => ['nullable', 'string', 'max:30'],
            'phone_secondary'  => ['nullable', 'string', 'max:30'],
            'address'          => ['nullable', 'string', 'max:255'],
            'city'             => ['nullable', 'string', 'max:100'],
            'country_code'     => ['nullable', 'string', 'size:2'],
            'is_active'        => ['boolean'],
        ]);

        $oldValues = $broker->only(['name', 'code', 'is_active']);
        $broker->update($validated);

        AuditLog::create([
            'tenant_id'   => $broker->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'broker_updated',
            'entity_type' => 'broker',
            'entity_id'   => $broker->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'old_values'  => $oldValues,
            'new_values'  => $broker->only(['name', 'code', 'is_active']),
        ]);

        return redirect()->route('admin.brokers.index')
            ->with('status', "Courtier {$broker->name} mis à jour.");
    }

    // ── Supprimer ────────────────────────────────────────────
    public function destroy(Request $request, Broker $broker): RedirectResponse
    {
        $this->authorizeTenant($broker);
        $name = $broker->name;
        $broker->delete();

        AuditLog::create([
            'tenant_id'   => $broker->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'broker_deleted',
            'entity_type' => 'broker',
            'entity_id'   => $broker->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        return redirect()->route('admin.brokers.index')
            ->with('status', "Courtier {$name} supprimé.");
    }

    // ── Toggle actif/inactif ─────────────────────────────────
    public function toggle(Request $request, Broker $broker): RedirectResponse
    {
        $this->authorizeTenant($broker);
        $broker->update(['is_active' => ! $broker->is_active]);

        return back()->with('status', "Courtier {$broker->name} " . ($broker->is_active ? 'activé' : 'désactivé') . ".");
    }

    // ── Isolation tenant ─────────────────────────────────────
    private function authorizeTenant(Broker $broker): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        if ((string) $user->tenant_id !== (string) $broker->tenant_id) abort(403);
    }
}