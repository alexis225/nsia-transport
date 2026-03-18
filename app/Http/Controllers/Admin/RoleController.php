<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * ============================================================
 * RoleController — US-003
 * ============================================================
 * CRUD rôles + assignation permissions.
 * Accessible SUPER ADMIN uniquement.
 * ============================================================
 */
class RoleController extends Controller
{
    // ── Liste des rôles ──────────────────────────────────────
    public function index(Request $request): Response
    {
        $roles = Role::with('permissions')
            ->withCount('users')
            ->when($request->search, fn ($q) =>
                $q->where('name', 'ilike', "%{$request->search}%")
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        $permissions = Permission::orderBy('name')->get()
            ->groupBy(fn ($p) => explode('.', $p->name)[0]);

        return Inertia::render('admin/roles/index', [
            'roles'       => $roles,
            'permissions' => $permissions,
            'filters'     => $request->only(['search']),
        ]);
    }

    // ── Détail d'un rôle ─────────────────────────────────────
    public function show(Role $role): Response
    {
        $role->load('permissions');

        $users = $role->users()
            ->with('tenant')
            ->paginate(20);

        $allPermissions = Permission::orderBy('name')->get()
            ->groupBy(fn ($p) => explode('.', $p->name)[0]);

        return Inertia::render('admin/roles/show', [
            'role'           => $role,
            'users'          => $users,
            'allPermissions' => $allPermissions,
        ]);
    }

    // ── Créer un rôle ────────────────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'        => ['required', 'string', 'max:100', 'unique:roles,name'],
            'permissions' => ['array'],
        ]);

        $role = Role::create([
            'name'       => $request->name,
            'guard_name' => 'web',
        ]);

        if ($request->permissions) {
            $role->syncPermissions($request->permissions);
        }

        return back()->with('status', "Rôle « {$role->name} » créé avec succès.");
    }

    // ── Mettre à jour les permissions d'un rôle ──────────────
    public function update(Request $request, Role $role): RedirectResponse
    {
        $request->validate([
            'name'        => ['required', 'string', 'max:100', "unique:roles,name,{$role->id}"],
            'permissions' => ['array'],
        ]);

        // Protéger les rôles système
        if (in_array($role->name, ['super_admin']) && $request->name !== $role->name) {
            return back()->withErrors(['name' => 'Le rôle super_admin ne peut pas être renommé.']);
        }

        $role->update(['name' => $request->name]);
        $role->syncPermissions($request->permissions ?? []);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('status', "Rôle « {$role->name} » mis à jour.");
    }

    // ── Supprimer un rôle ────────────────────────────────────
    public function destroy(Role $role): RedirectResponse
    {
        $protected = ['super_admin', 'admin_filiale', 'souscripteur', 'courtier_local', 'partenaire_etranger', 'client'];

        if (in_array($role->name, $protected)) {
            return back()->withErrors(['role' => 'Ce rôle système ne peut pas être supprimé.']);
        }

        if ($role->users()->count() > 0) {
            return back()->withErrors(['role' => 'Impossible de supprimer un rôle assigné à des utilisateurs.']);
        }

        $role->delete();

        return back()->with('status', "Rôle supprimé.");
    }

    // ── Assigner un rôle à un utilisateur ────────────────────
    public function assignToUser(Request $request): RedirectResponse
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role'    => ['required', 'exists:roles,name'],
        ]);

        $user = \App\Models\User::findOrFail($request->user_id);
        $user->syncRoles([$request->role]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('status', "Rôle « {$request->role} » assigné à {$user->first_name} {$user->last_name}.");
    }
}