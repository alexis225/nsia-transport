<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * TenantController — US-011
 * ============================================================
 * CRUD filiales NSIA. Accessible SUPER ADMIN uniquement.
 * ============================================================
 */
class TenantController extends Controller
{
    // ── Liste ────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $tenants = Tenant::withCount('users')
            ->when($request->search, fn ($q) =>
                $q->where(fn ($q) =>
                    $q->where('name', 'ilike', "%{$request->search}%")
                      ->orWhere('code', 'ilike', "%{$request->search}%")
                      ->orWhere('country_code', 'ilike', "%{$request->search}%")
                )
            )
            ->when($request->status !== null && $request->status !== '', fn ($q) =>
                $q->where('is_active', $request->status === 'active')
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/tenants/index', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    // ── Formulaire création ──────────────────────────────────
    public function create(): Response
    {
        return Inertia::render('admin/tenants/create');
    }

    // ── Créer ────────────────────────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:150'],
            'code'         => ['required', 'string', 'max:10', 'unique:tenants,code', 'regex:/^[A-Z]{2,10}$/'],
            'country_code' => ['required', 'string', 'size:2'],
            'currency'     => ['required', 'string', 'size:3'],
            'locale'       => ['required', 'string', 'in:fr,en'],
            'timezone'     => ['required', 'string', 'max:50'],
            'is_active'    => ['boolean'],
            'settings'                  => ['nullable', 'array'],
            'subscription_limit_config' => ['nullable', 'array'],
        ], [
            'code.regex'  => 'Le code doit être en majuscules (ex: CI, SN, CM).',
            'code.unique' => 'Ce code est déjà utilisé par une autre filiale.',
        ]);

        $tenant = Tenant::create([
            ...$validated,
            'settings'                  => $validated['settings'] ?? [],
            'subscription_limit_config' => $validated['subscription_limit_config'] ?? ['nn300_limit' => 0],
            'is_active'                 => $validated['is_active'] ?? true,
        ]);

        AuditLog::create([
            'tenant_id'   => null,
            'user_id'     => $request->user()->id,
            'action'      => 'tenant_created',
            'entity_type' => 'tenant',
            'entity_id'   => $tenant->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => ['name' => $tenant->name, 'code' => $tenant->code],
        ]);

        return redirect()->route('admin.tenants')
            ->with('status', "Filiale {$tenant->name} créée avec succès.");
    }

    // ── Détail ───────────────────────────────────────────────
    public function show(Tenant $tenant): Response
    {
        $tenant->loadCount('users');

        $users = $tenant->users()
            ->with('roles')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('admin/tenants/show', [
            'tenant' => $tenant,
            'users'  => $users,
        ]);
    }

    // ── Formulaire modification ──────────────────────────────
    public function edit(Tenant $tenant): Response
    {
        return Inertia::render('admin/tenants/edit', [
            'tenant' => $tenant,
        ]);
    }

    // ── Modifier ─────────────────────────────────────────────
    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:150'],
            'code'         => ['required', 'string', 'max:10', Rule::unique('tenants', 'code')->ignore($tenant->id), 'regex:/^[A-Z]{2,10}$/'],
            'country_code' => ['required', 'string', 'size:2'],
            'currency'     => ['required', 'string', 'size:3'],
            'locale'       => ['required', 'string', 'in:fr,en'],
            'timezone'     => ['required', 'string', 'max:50'],
            'is_active'    => ['boolean'],
            'subscription_limit_config' => ['nullable', 'array'],
        ]);

        $oldValues = $tenant->only(['name', 'code', 'is_active']);
        $tenant->update($validated);

        AuditLog::create([
            'tenant_id'   => null,
            'user_id'     => $request->user()->id,
            'action'      => 'tenant_updated',
            'entity_type' => 'tenant',
            'entity_id'   => $tenant->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'old_values'  => $oldValues,
            'new_values'  => $tenant->only(['name', 'code', 'is_active']),
        ]);

        return redirect()->route('admin.tenants')
            ->with('status', "Filiale {$tenant->name} mise à jour.");
    }

    // ── Activer / Désactiver ─────────────────────────────────
    public function toggleActive(Request $request, Tenant $tenant): RedirectResponse
    {
        $tenant->update(['is_active' => ! $tenant->is_active]);

        AuditLog::create([
            'tenant_id'   => null,
            'user_id'     => $request->user()->id,
            'action'      => $tenant->is_active ? 'tenant_activated' : 'tenant_deactivated',
            'entity_type' => 'tenant',
            'entity_id'   => $tenant->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        $label = $tenant->is_active ? 'activée' : 'désactivée';
        return back()->with('status', "Filiale {$tenant->name} {$label}.");
    }

    public function config(Tenant $tenant): Response
    {
        return Inertia::render('admin/tenants/config', [
            'tenant' => $tenant,
        ]);
    }
}