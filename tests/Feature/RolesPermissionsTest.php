<?php

/**
 * ============================================================
 * Tests Pest — US-003 : Rôles & permissions multi-tenant
 * ============================================================
 * Lancer : php artisan test --filter RolesPermissionsTest
 * ============================================================
 */

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
});

// ── Helper ───────────────────────────────────────────────────
function makeUserWithRole(string $role, ?string $tenantId = null): User
{
    $tenant   = Tenant::factory()->create();
    $user     = User::factory()->create([
        'tenant_id' => $tenantId ?? $tenant->id,
        'is_active' => true,
    ]);
    $user->assignRole($role);
    return $user;
}

// ── Test 1 : Les 6 rôles existent ────────────────────────────
it('les 6 rôles NSIA sont seedés', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    foreach (['super_admin', 'admin_filiale', 'souscripteur', 'courtier_local', 'partenaire_etranger', 'client'] as $role) {
        expect(Role::where('name', $role)->exists())->toBeTrue();
    }
});

// ── Test 2 : Super admin peut tout faire ─────────────────────
it('super_admin a toutes les permissions', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    $user = makeUserWithRole('super_admin');

    expect($user->can('certificates.validate'))->toBeTrue();
    expect($user->can('tenants.delete'))->toBeTrue();
    expect($user->can('security.ip_blacklist'))->toBeTrue();
    expect($user->can('reports.dashboard_dtag'))->toBeTrue();
});

// ── Test 3 : Client ne peut pas valider ──────────────────────
it('client ne peut pas valider un certificat', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    $user = makeUserWithRole('client');

    expect($user->can('certificates.validate'))->toBeFalse();
    expect($user->can('certificates.create'))->toBeFalse();
    expect($user->can('users.block'))->toBeFalse();
});

// ── Test 4 : Courtier peut créer et soumettre ────────────────
it('courtier_local peut créer et soumettre un certificat', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    $user = makeUserWithRole('courtier_local');

    expect($user->can('certificates.create'))->toBeTrue();
    expect($user->can('certificates.submit'))->toBeTrue();
    expect($user->can('certificates.validate'))->toBeFalse();
});

// ── Test 5 : Admin filiale peut bloquer des utilisateurs ─────
it('admin_filiale peut bloquer un utilisateur', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    $user = makeUserWithRole('admin_filiale');

    expect($user->can('users.block'))->toBeTrue();
    expect($user->can('users.unblock'))->toBeTrue();
    expect($user->can('tenants.delete'))->toBeFalse();
});

// ── Test 6 : Souscripteur peut valider mais pas supprimer ─────
it('souscripteur peut valider un certificat', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    $user = makeUserWithRole('souscripteur');

    expect($user->can('certificates.validate'))->toBeTrue();
    expect($user->can('certificates.reject'))->toBeTrue();
    expect($user->can('tenants.delete'))->toBeFalse();
    expect($user->can('security.ip_blacklist'))->toBeFalse();
});

// ── Test 7 : Isolation tenant — can() respecte le tenant ─────
it('deux utilisateurs de tenants différents ont des rôles isolés', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $userA = User::factory()->create(['tenant_id' => $tenantA->id]);
    $userB = User::factory()->create(['tenant_id' => $tenantB->id]);

    $userA->assignRole('admin_filiale');
    $userB->assignRole('client');

    // UserA est admin, UserB est client — roles indépendants
    expect($userA->hasRole('admin_filiale'))->toBeTrue();
    expect($userB->hasRole('admin_filiale'))->toBeFalse();
    expect($userA->can('users.block'))->toBeTrue();
    expect($userB->can('users.block'))->toBeFalse();
});

// ── Test 8 : middleware permission → 403 si non autorisé ─────
it('retourne 403 si permission manquante', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    $user = makeUserWithRole('client');
    $this->actingAs($user);

    // Route protégée par permission:users.view
    $this->get('/admin/users')
        ->assertStatus(403);
});

// ── Test 9 : Super admin bypass Gate ─────────────────────────
it('super_admin accède aux routes protégées sans permission explicite', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    $user = makeUserWithRole('super_admin');
    $this->actingAs($user);

    // Gate::before retourne true pour super_admin
    expect($user->can('any.permission.that.does.not.exist'))->toBeTrue();
});

// ── Test 10 : Un rôle peut être retiré ───────────────────────
it('un rôle peut être retiré et les permissions sont perdues', function () {
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');

    $user = makeUserWithRole('souscripteur');

    expect($user->can('certificates.validate'))->toBeTrue();

    $user->removeRole('souscripteur');
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $user->unsetRelation('roles');

    expect($user->can('certificates.validate'))->toBeFalse();
});