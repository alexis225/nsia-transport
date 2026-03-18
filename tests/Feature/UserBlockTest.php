<?php

/**
 * ============================================================
 * Tests Pest — US-004 : Blocage / déblocage utilisateurs
 * ============================================================
 * Lancer : php artisan test --filter UserBlockTest
 * ============================================================
 */

use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers ──────────────────────────────────────────────────
function makeAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

function makeSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

function makeCourtier(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('courtier_local');
    return $user;
}

// ── Test 1 : Admin filiale bloque un courtier ────────────────
it('admin_filiale peut bloquer un courtier de sa filiale', function () {
    $tenant   = Tenant::factory()->create();
    $admin    = makeAdmin($tenant->id);
    $courtier = makeCourtier($tenant->id);

    $this->actingAs($admin);

    $this->patch("/admin/users/{$courtier->id}/block", [
        'reason' => 'Comportement suspect détecté.',
    ])->assertRedirect();

    $courtier->refresh();

    expect($courtier->is_active)->toBeFalse();
    //expect($courtier->blocked_by)->toBe($admin->id);
    expect($courtier->blocked_reason)->toBe('Comportement suspect détecté.');
    expect($courtier->blocked_at)->not->toBeNull();
    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $admin->id,
        'action'  => 'user_blocked',
    ]);
});

// ── Test 2 : Utilisateur bloqué ne peut pas se connecter ─────
it('un utilisateur bloqué ne peut pas se connecter', function () {
    $courtier = makeCourtier();
    $courtier->update(['is_active' => false]);

    $this->post('/login', [
        'email'    => $courtier->email,
        'password' => 'password',
    ])->assertSessionHasErrors();

    $this->assertGuest();
});

// ── Test 3 : Admin ne peut pas bloquer hors de sa filiale ────
it('admin_filiale ne peut pas bloquer un utilisateur d\'une autre filiale', function () {
    $tenantA  = Tenant::factory()->create();
    $tenantB  = Tenant::factory()->create();
    $admin    = makeAdmin($tenantA->id);
    $courtier = makeCourtier($tenantB->id);

    $this->actingAs($admin);

    $this->patch("/admin/users/{$courtier->id}/block", [
        'reason' => 'Test cross-tenant.',
    ])->assertStatus(403);

    expect($courtier->fresh()->is_active)->toBeTrue();
});

// ── Test 4 : Admin ne peut pas se bloquer lui-même ───────────
it('admin ne peut pas se bloquer lui-même', function () {
    $admin = makeAdmin();
    $this->actingAs($admin);

    $this->patch("/admin/users/{$admin->id}/block", [
        'reason' => 'Test auto-blocage.',
    ])->assertSessionHasErrors(['user']);

    expect($admin->fresh()->is_active)->toBeTrue();
});

// ── Test 5 : Admin ne peut pas bloquer un super admin ────────
it('admin_filiale ne peut pas bloquer un super_admin', function () {
    $admin      = makeAdmin();
    $superAdmin = makeSuperAdmin();

    $this->actingAs($admin);

    $this->patch("/admin/users/{$superAdmin->id}/block", [
        'reason' => 'Test blocage super admin.',
    ])->assertSessionHasErrors(['user']);

    expect($superAdmin->fresh()->is_active)->toBeTrue();
});

// ── Test 6 : Super admin peut débloquer ──────────────────────
it('super_admin peut débloquer un utilisateur bloqué', function () {
    $courtier = makeCourtier();
    $courtier->update([
        'is_active'      => false,
        'blocked_by'     => $courtier->id,
        'blocked_at'     => now(),
        'blocked_reason' => 'Test blocage.',
    ]);

    $superAdmin = makeSuperAdmin();
    $this->actingAs($superAdmin);

    $this->patch("/admin/users/{$courtier->id}/unblock")
        ->assertRedirect();

    $courtier->refresh();

    expect($courtier->is_active)->toBeTrue();
    expect($courtier->blocked_by)->toBeNull();
    expect($courtier->blocked_at)->toBeNull();
    expect($courtier->blocked_reason)->toBeNull();
});

// ── Test 7 : Admin filiale ne peut pas débloquer ─────────────
it('admin_filiale ne peut pas débloquer (permission manquante)', function () {
    $tenant   = Tenant::factory()->create();
    $admin    = makeAdmin($tenant->id);
    $courtier = makeCourtier($tenant->id);
    $courtier->update(['is_active' => false]);

    $this->actingAs($admin);

    $this->patch("/admin/users/{$courtier->id}/unblock")
        ->assertStatus(403);

    expect($courtier->fresh()->is_active)->toBeFalse();
});

// ── Test 8 : Raison obligatoire pour bloquer ─────────────────
it('la raison est obligatoire pour bloquer', function () {
    $tenant   = Tenant::factory()->create();
    $admin    = makeAdmin($tenant->id);
    $courtier = makeCourtier($tenant->id);

    $this->actingAs($admin);

    $this->patch("/admin/users/{$courtier->id}/block", [
        'reason' => '',
    ])->assertSessionHasErrors(['reason']);

    expect($courtier->fresh()->is_active)->toBeTrue();
});

// ── Test 9 : Audit log créé au blocage ───────────────────────
it('crée un audit_log user_blocked', function () {
    $tenant   = Tenant::factory()->create();
    $admin    = makeAdmin($tenant->id);
    $courtier = makeCourtier($tenant->id);

    $this->actingAs($admin);

    $this->patch("/admin/users/{$courtier->id}/block", [
        'reason' => 'Audit test.',
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id'        => $admin->id,
        'action'         => 'user_blocked',
        'entity_type' => 'user',
        'entity_id'   => $courtier->id,
    ]);
});

// ── Test 10 : Audit log créé au déblocage ────────────────────
it('crée un audit_log user_unblocked', function () {
    $courtier = makeCourtier();
    $courtier->update(['is_active' => false]);

    $superAdmin = makeSuperAdmin();
    $this->actingAs($superAdmin);

    $this->patch("/admin/users/{$courtier->id}/unblock");

    $this->assertDatabaseHas('audit_logs', [
        'user_id'        => $superAdmin->id,
        'action'         => 'user_unblocked',
        'entity_type' => 'user',
        'entity_id'   => $courtier->id,
    ]);
});

// ── Test 11 : Non authentifié → redirigé vers login ──────────
it('redirige vers login si non authentifié', function () {
    $courtier = makeCourtier();

    $this->patch("/admin/users/{$courtier->id}/block", [
        'reason' => 'Test.',
    ])->assertRedirect('/login');
});