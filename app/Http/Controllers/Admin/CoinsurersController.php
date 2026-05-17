<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Coinsurer;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CoinsurersController — US-041
 * CRUD coassureurs avec isolation tenant.
 */
class CoinsurersController extends Controller
{
    // ── Liste ────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $coinsurers = Coinsurer::with('tenant')
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->search, fn ($q) =>
                $q->where('name', 'ilike', "%{$request->search}%")
            )
            ->when($request->status !== null && $request->status !== '', fn ($q) =>
                $q->where('is_active', $request->status === 'active')
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/coinsurers/index', [
            'coinsurers' => $coinsurers,
            'filters'    => $request->only(['search', 'status']),
            'isSA'       => $isSA,
            'can'        => [
                'create' => $request->user()->can('coinsurers.create'),
                'edit'   => $request->user()->can('coinsurers.edit'),
                'delete' => $request->user()->can('coinsurers.delete'),
            ],
        ]);
    }

    // ── Formulaire création ──────────────────────────────────
    public function create(Request $request): Response
    {
        return Inertia::render('admin/coinsurers/create', [
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
            'country_code' => ['nullable', 'string', 'size:2'],
            'share_rate'   => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_active'    => ['boolean'],
            'tenant_id'    => ['nullable', 'uuid', 'exists:tenants,id'],
        ]);

        $coinsurer = Coinsurer::create([
            ...$validated,
            'tenant_id' => $validated['tenant_id'] ?? $request->user()->tenant_id,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        AuditLog::create([
            'tenant_id'   => $coinsurer->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'coinsurer_created',
            'entity_type' => 'coinsurer',
            'entity_id'   => $coinsurer->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => ['name' => $coinsurer->name],
        ]);

        return redirect()->route('admin.coinsurers.index')
            ->with('status', "Coassureur {$coinsurer->name} créé avec succès.");
    }

    // ── Détail ───────────────────────────────────────────────
    public function show(Coinsurer $coinsurer): Response
    {
        $this->authorizeTenant($coinsurer);
        $coinsurer->load('tenant');

        return Inertia::render('admin/coinsurers/show', [
            'coinsurer' => $coinsurer,
        ]);
    }

    // ── Formulaire modification ──────────────────────────────
    public function edit(Request $request, Coinsurer $coinsurer): Response
    {
        $this->authorizeTenant($coinsurer);
        $coinsurer->load('tenant');

        return Inertia::render('admin/coinsurers/edit', [
            'coinsurer' => $coinsurer,
            'tenants'   => $request->user()->hasRole('super_admin')
                ? Tenant::active()->orderBy('name')->get(['id', 'name', 'code'])
                : collect(),
        ]);
    }

    // ── Modifier ─────────────────────────────────────────────
    public function update(Request $request, Coinsurer $coinsurer): RedirectResponse
    {
        $this->authorizeTenant($coinsurer);

        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:200'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'share_rate'   => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_active'    => ['boolean'],
        ]);

        $oldValues = $coinsurer->only(['name', 'share_rate', 'is_active']);
        $coinsurer->update($validated);

        AuditLog::create([
            'tenant_id'   => $coinsurer->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'coinsurer_updated',
            'entity_type' => 'coinsurer',
            'entity_id'   => $coinsurer->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'old_values'  => $oldValues,
            'new_values'  => $coinsurer->only(['name', 'share_rate', 'is_active']),
        ]);

        return redirect()->route('admin.coinsurers.index')
            ->with('status', "Coassureur {$coinsurer->name} mis à jour.");
    }

    // ── Supprimer ────────────────────────────────────────────
    public function destroy(Request $request, Coinsurer $coinsurer): RedirectResponse
    {
        $this->authorizeTenant($coinsurer);
        $name = $coinsurer->name;
        $coinsurer->delete();

        AuditLog::create([
            'tenant_id'   => $coinsurer->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'coinsurer_deleted',
            'entity_type' => 'coinsurer',
            'entity_id'   => $coinsurer->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        return redirect()->route('admin.coinsurers.index')
            ->with('status', "Coassureur {$name} supprimé.");
    }

    // ── Toggle actif/inactif ─────────────────────────────────
    public function toggle(Request $request, Coinsurer $coinsurer): RedirectResponse
    {
        $this->authorizeTenant($coinsurer);
        $coinsurer->update(['is_active' => ! $coinsurer->is_active]);

        return back()->with('status', "Coassureur {$coinsurer->name} " . ($coinsurer->is_active ? 'activé' : 'désactivé') . ".");
    }

    // ── Isolation tenant ─────────────────────────────────────
    private function authorizeTenant(Coinsurer $coinsurer): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        if ((string) $user->tenant_id !== (string) $coinsurer->tenant_id) abort(403);
    }
}
