<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * ============================================================
 * UserController — US-007/008/004
 * ============================================================
 * CRUD complet + blocage/déblocage utilisateurs.
 * Isolation tenant automatique via middleware tenant.isolation.
 * ============================================================
 */
class UserController extends Controller
{
    // ── Liste ────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $query = User::with(['roles', 'tenant'])
            ->when($request->search, fn ($q) =>
                $q->where(fn ($q) =>
                    $q->where('first_name', 'ilike', "%{$request->search}%")
                      ->orWhere('last_name',  'ilike', "%{$request->search}%")
                      ->orWhere('email',      'ilike', "%{$request->search}%")
                )
            )
            ->when($request->role, fn ($q) =>
                $q->whereHas('roles', fn ($q) => $q->where('name', $request->role))
            )
            ->when($request->status !== null && $request->status !== '', fn ($q) =>
                $q->where('is_active', $request->status === 'active')
            )
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users'   => $query,
            'filters' => $request->only(['search', 'role', 'status']),
            'roles'   => Role::orderBy('name')->pluck('name'),
            'can'     => [
                'create'  => $request->user()->can('users.create'),
                'edit'    => $request->user()->can('users.edit'),
                'block'   => $request->user()->can('users.block'),
                'unblock' => $request->user()->can('users.unblock'),
                'delete'  => $request->user()->can('users.delete'),
            ],
        ]);
    }

    // ── Formulaire création ──────────────────────────────────
    public function create(Request $request): Response
    {
        return Inertia::render('admin/users/create', [
            'roles'   => Role::orderBy('name')->pluck('name'),
            'tenants' => $request->user()->hasRole('super_admin')
                ? Tenant::orderBy('name')->get(['id', 'name', 'code'])
                : collect(),
        ]);
    }

    // ── Créer ────────────────────────────────────────────────
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $user = User::create([
            'tenant_id'  => $request->tenant_id ?? $request->user()->tenant_id,
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'email'      => $request->email,
            'phone'      => $request->phone,
            'password'   => Hash::make($request->password),
            'is_active'  => true,
            'created_by' => $request->user()->id,
        ]);

        $user->assignRole($request->role);

        // Envoyer email de bienvenue avec lien de réinitialisation
        Password::sendResetLink(['email' => $user->email]);

        AuditLog::create([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'user_created',
            'entity_type' => 'user',
            'entity_id'   => $user->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => ['email' => $user->email, 'role' => $request->role],
        ]);

        return redirect()->route('admin.users')
            ->with('status', "Utilisateur {$user->first_name} {$user->last_name} créé avec succès.");
    }

    // ── Détail ───────────────────────────────────────────────
    public function show(User $user): Response
    {
        $this->authorizeTenantAccess($user);

        $user->load(['roles', 'tenant']);

        $auditLogs = AuditLog::where('entity_type', 'user')
            ->where('entity_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('admin/users/show', [
            'user'      => $user,
            'auditLogs' => $auditLogs,
        ]);
    }

    // ── Formulaire modification ──────────────────────────────
    public function edit(Request $request, User $user): Response
    {
        $this->authorizeTenantAccess($user);
        $user->load(['roles', 'tenant']);

        return Inertia::render('admin/users/edit', [
            'user'    => $user,
            'roles'   => Role::orderBy('name')->pluck('name'),
            'tenants' => $request->user()->hasRole('super_admin')
                ? Tenant::orderBy('name')->get(['id', 'name', 'code'])
                : collect(),
        ]);
    }

    // ── Modifier ─────────────────────────────────────────────
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorizeTenantAccess($user);

        $oldValues = $user->only(['first_name', 'last_name', 'email', 'phone']);

        $user->update([
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'email'      => $request->email,
            'phone'      => $request->phone,
        ]);

        if ($request->role) {
            $user->syncRoles([$request->role]);
            app()[PermissionRegistrar::class]->forgetCachedPermissions();
        }

        AuditLog::create([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'user_updated',
            'entity_type' => 'user',
            'entity_id'   => $user->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'old_values'  => $oldValues,
            'new_values'  => $user->only(['first_name', 'last_name', 'email', 'phone']),
        ]);

        return redirect()->route('admin.users')
            ->with('status', "Utilisateur {$user->first_name} {$user->last_name} mis à jour.");
    }

    // ── Supprimer ────────────────────────────────────────────
    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorizeTenantAccess($user);

        if ($user->getKey() == $request->user()->getKey()) {
            return back()->withErrors(['user' => 'Vous ne pouvez pas supprimer votre propre compte.']);
        }

        if ($user->hasRole('super_admin')) {
            return back()->withErrors(['user' => 'Impossible de supprimer un super administrateur.']);
        }

        $name = "{$user->first_name} {$user->last_name}";
        $user->delete();

        AuditLog::create([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'user_deleted',
            'entity_type' => 'user',
            'entity_id'   => $user->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        return redirect()->route('admin.users')
            ->with('status', "Utilisateur {$name} supprimé.");
    }

    // ── Bloquer ──────────────────────────────────────────────
    public function block(Request $request, User $user): RedirectResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $this->authorizeTenantAccess($user);

        if ($user->getKey() == $request->user()->getKey()) {
            return back()->withErrors(['user' => 'Vous ne pouvez pas vous bloquer vous-même.']);
        }

        if ($user->fresh()->hasRole('super_admin')) {
            return back()->withErrors(['user' => 'Impossible de bloquer un super administrateur.']);
        }

        $user->update([
            'is_active'      => false,
            'blocked_by'     => $request->user()->id,
            'blocked_at'     => now(),
            'blocked_reason' => $request->reason,
        ]);

        \Illuminate\Support\Facades\DB::table('sessions')
            ->where('user_id', $user->id)->delete();

        AuditLog::create([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'user_blocked',
            'entity_type' => 'user',
            'entity_id'   => $user->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => ['reason' => $request->reason],
        ]);

        return back()->with('status', "Utilisateur {$user->first_name} {$user->last_name} bloqué.");
    }

    // ── Débloquer ────────────────────────────────────────────
    public function unblock(Request $request, User $user): RedirectResponse
    {
        $user->update([
            'is_active'             => true,
            'blocked_by'            => null,
            'blocked_at'            => null,
            'blocked_reason'        => null,
            'failed_login_attempts' => 0,
            'locked_until'          => null,
        ]);

        AuditLog::create([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'user_unblocked',
            'entity_type' => 'user',
            'entity_id'   => $user->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        return back()->with('status', "Utilisateur {$user->first_name} {$user->last_name} débloqué.");
    }

    // ── Isolation tenant ─────────────────────────────────────
    private function authorizeTenantAccess(User $target): void
    {
        $currentUser = auth()->user();
        if ($currentUser->hasRole('super_admin')) return;
        if ((string) $currentUser->tenant_id !== (string) $target->tenant_id) {
            abort(403, 'Accès non autorisé à cet utilisateur.');
        }
    }
}