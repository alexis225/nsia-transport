<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Expert;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ExpertController — US-042
 * CRUD experts d'assurance avec isolation tenant.
 */
class ExpertController extends Controller
{
    // ── Liste ────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $experts = Expert::with('tenant')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->search, fn ($q) => $q->search($request->search))
            ->when($request->status !== null && $request->status !== '', fn ($q) =>
                $q->where('is_active', $request->status === 'active')
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/experts/index', [
            'experts' => $experts,
            'filters' => $request->only(['search', 'status']),
            'isSA'    => $isSA,
            'can'     => [
                'create' => $request->user()->can('experts.create'),
                'edit'   => $request->user()->can('experts.edit'),
                'delete' => $request->user()->can('experts.delete'),
            ],
        ]);
    }

    // ── Formulaire création ──────────────────────────────────
    public function create(Request $request): Response
    {
        return Inertia::render('admin/experts/create', [
            'tenants'         => $request->user()->hasRole('super_admin')
                ? Tenant::active()->orderBy('name')->get(['id', 'name', 'code'])
                : collect(),
            'defaultTenantId' => $request->user()->tenant_id,
        ]);
    }

    // ── Créer ────────────────────────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:200'],
            'email'        => ['nullable', 'email', 'max:255'],
            'phone'        => ['nullable', 'string', 'max:30'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'is_active'    => ['boolean'],
            'tenant_id'    => ['nullable', 'uuid', 'exists:tenants,id'],
        ]);

        $expert = Expert::create([
            ...$validated,
            'tenant_id' => $validated['tenant_id'] ?? $request->user()->tenant_id,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        AuditLog::create([
            'tenant_id'   => $expert->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'expert_created',
            'entity_type' => 'expert',
            'entity_id'   => $expert->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => ['name' => $expert->name, 'email' => $expert->email],
        ]);

        return redirect()->route('admin.experts.index')
            ->with('status', "Expert {$expert->name} créé avec succès.");
    }

    // ── Détail ───────────────────────────────────────────────
    public function show(Expert $expert): Response
    {
        $this->authorizeTenant($expert);
        $expert->load('tenant');

        return Inertia::render('admin/experts/show', [
            'expert' => $expert,
        ]);
    }

    // ── Formulaire modification ──────────────────────────────
    public function edit(Request $request, Expert $expert): Response
    {
        $this->authorizeTenant($expert);
        $expert->load('tenant');

        return Inertia::render('admin/experts/edit', [
            'expert'  => $expert,
            'tenants' => $request->user()->hasRole('super_admin')
                ? Tenant::active()->orderBy('name')->get(['id', 'name', 'code'])
                : collect(),
        ]);
    }

    // ── Modifier ─────────────────────────────────────────────
    public function update(Request $request, Expert $expert): RedirectResponse
    {
        $this->authorizeTenant($expert);

        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:200'],
            'email'        => ['nullable', 'email', 'max:255'],
            'phone'        => ['nullable', 'string', 'max:30'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'is_active'    => ['boolean'],
        ]);

        $oldValues = $expert->only(['name', 'email', 'is_active']);
        $expert->update($validated);

        AuditLog::create([
            'tenant_id'   => $expert->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'expert_updated',
            'entity_type' => 'expert',
            'entity_id'   => $expert->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'old_values'  => $oldValues,
            'new_values'  => $expert->only(['name', 'email', 'is_active']),
        ]);

        return redirect()->route('admin.experts.index')
            ->with('status', "Expert {$expert->name} mis à jour.");
    }

    // ── Supprimer ────────────────────────────────────────────
    public function destroy(Request $request, Expert $expert): RedirectResponse
    {
        $this->authorizeTenant($expert);
        $name = $expert->name;
        $expert->delete();

        AuditLog::create([
            'tenant_id'   => $expert->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'expert_deleted',
            'entity_type' => 'expert',
            'entity_id'   => $expert->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        return redirect()->route('admin.experts.index')
            ->with('status', "Expert {$name} supprimé.");
    }

    // ── Toggle actif/inactif ─────────────────────────────────
    public function toggle(Request $request, Expert $expert): RedirectResponse
    {
        $this->authorizeTenant($expert);
        $expert->update(['is_active' => ! $expert->is_active]);

        return back()->with('status', "Expert {$expert->name} " . ($expert->is_active ? 'activé' : 'désactivé') . ".");
    }

    // ── Isolation tenant ─────────────────────────────────────
    private function authorizeTenant(Expert $expert): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        if ((string) $user->tenant_id !== (string) $expert->tenant_id) abort(403);
    }
}
