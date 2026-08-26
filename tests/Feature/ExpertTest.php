<?php

/**
 * ============================================================
 * Tests Pest — Module Experts (experts)
 * ============================================================
 * Lancer : php artisan test --filter ExpertTest
 * ============================================================
 */

use App\Models\Expert;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeRef — pas de conflit avec les autres fichiers) ─
function makeRefExpertTenant(): Tenant
{
    return Tenant::factory()->create();
}

function makeRefExpertAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

function makeRefExpertSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

// souscripteur : n'a aucune permission experts.* (voir seeder)
function makeRefExpertSouscripteur(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('souscripteur');
    return $user;
}

function makeRefExpertBareUser(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    return User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
}

function makeRefExpert(string $tenantId, array $overrides = []): Expert
{
    return Expert::create(array_merge([
        'tenant_id'    => $tenantId,
        'name'         => 'Expert Test',
        'email'        => 'expert@test.ci',
        'country_code' => 'CI',
        'is_active'    => true,
    ], $overrides));
}

// ── Index ────────────────────────────────────────────────────
it('liste les experts avec la permission experts.view', function () {
    $admin = makeRefExpertAdmin();
    makeRefExpert($admin->tenant_id);

    $this->actingAs($admin)->get('/admin/experts')->assertStatus(200);
});

it('refuse la liste des experts sans la permission experts.view', function () {
    $user = makeRefExpertBareUser();

    $this->actingAs($user)->get('/admin/experts')->assertStatus(403);
});

it('redirige vers login si non authentifié (index experts)', function () {
    $this->get('/admin/experts')->assertRedirect('/login');
});

// ── Store ────────────────────────────────────────────────────
it('crée un expert avec des données valides', function () {
    $admin = makeRefExpertAdmin();

    $payload = [
        'name'         => 'Cabinet Expertise Maritime',
        'email'        => 'contact@expertise-maritime.ci',
        'phone'        => '+225 0102030405',
        'country_code' => 'CI',
        'is_active'    => true,
    ];

    $this->actingAs($admin)
        ->post('/admin/experts', $payload)
        ->assertRedirect(route('admin.experts.index'));

    $this->assertDatabaseHas('experts', [
        'name'      => 'Cabinet Expertise Maritime',
        'tenant_id' => $admin->tenant_id,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id'     => $admin->id,
        'action'      => 'expert_created',
        'entity_type' => 'expert',
    ]);
});

it('refuse la création avec des données invalides ou manquantes', function () {
    $admin = makeRefExpertAdmin();

    $this->actingAs($admin)
        ->post('/admin/experts', [
            'name'  => '',
            'email' => 'pas-un-email',
        ])
        ->assertSessionHasErrors(['name', 'email']);

    $this->assertDatabaseCount('experts', 0);
});

it('refuse la création avec un country_code invalide', function () {
    $admin = makeRefExpertAdmin();

    $this->actingAs($admin)
        ->post('/admin/experts', [
            'name'         => 'Expert Test',
            'country_code' => 'CIV', // 3 caractères au lieu de 2
        ])
        ->assertSessionHasErrors(['country_code']);
});

it('refuse la création sans la permission experts.create', function () {
    $user = makeRefExpertSouscripteur();

    $this->actingAs($user)
        ->post('/admin/experts', ['name' => 'Expert Test'])
        ->assertStatus(403);

    $this->assertDatabaseCount('experts', 0);
});

// ── Update ───────────────────────────────────────────────────
it('modifie un expert de sa filiale', function () {
    $admin  = makeRefExpertAdmin();
    $expert = makeRefExpert($admin->tenant_id, ['name' => 'Ancien Nom']);

    $this->actingAs($admin)
        ->put("/admin/experts/{$expert->id}", ['name' => 'Nouveau Nom'])
        ->assertRedirect(route('admin.experts.index'));

    expect($expert->fresh()->name)->toBe('Nouveau Nom');

    $this->assertDatabaseHas('audit_logs', [
        'user_id'     => $admin->id,
        'action'      => 'expert_updated',
        'entity_type' => 'expert',
        'entity_id'   => $expert->id,
    ]);
});

it('refuse la modification sans la permission experts.edit', function () {
    $tenant = makeRefExpertTenant();
    $user   = makeRefExpertSouscripteur($tenant->id);
    $expert = makeRefExpert($tenant->id, ['name' => 'Intact']);

    $this->actingAs($user)
        ->put("/admin/experts/{$expert->id}", ['name' => 'Tentative'])
        ->assertStatus(403);

    expect($expert->fresh()->name)->toBe('Intact');
});

// ── Destroy ──────────────────────────────────────────────────
it('supprime un expert de sa filiale', function () {
    $admin  = makeRefExpertAdmin();
    $expert = makeRefExpert($admin->tenant_id);

    $this->actingAs($admin)
        ->delete("/admin/experts/{$expert->id}")
        ->assertRedirect(route('admin.experts.index'));

    $this->assertSoftDeleted('experts', ['id' => $expert->id]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id'     => $admin->id,
        'action'      => 'expert_deleted',
        'entity_type' => 'expert',
        'entity_id'   => $expert->id,
    ]);
});

it('refuse la suppression sans la permission experts.delete', function () {
    $tenant = makeRefExpertTenant();
    $user   = makeRefExpertSouscripteur($tenant->id);
    $expert = makeRefExpert($tenant->id);

    $this->actingAs($user)
        ->delete("/admin/experts/{$expert->id}")
        ->assertStatus(403);

    $this->assertDatabaseHas('experts', ['id' => $expert->id, 'deleted_at' => null]);
});

// ── Toggle ───────────────────────────────────────────────────
it('active/désactive un expert via toggle', function () {
    $admin  = makeRefExpertAdmin();
    $expert = makeRefExpert($admin->tenant_id, ['is_active' => true]);

    $this->actingAs($admin)
        ->patch("/admin/experts/{$expert->id}/toggle")
        ->assertRedirect();

    expect($expert->fresh()->is_active)->toBeFalse();
});

it('refuse le toggle sans la permission experts.edit', function () {
    $tenant = makeRefExpertTenant();
    $user   = makeRefExpertSouscripteur($tenant->id);
    $expert = makeRefExpert($tenant->id, ['is_active' => true]);

    $this->actingAs($user)
        ->patch("/admin/experts/{$expert->id}/toggle")
        ->assertStatus(403);

    expect($expert->fresh()->is_active)->toBeTrue();
});

// ── Isolation tenant ─────────────────────────────────────────
it('un admin_filiale ne peut pas voir un expert d\'une autre filiale', function () {
    $tenantA = makeRefExpertTenant();
    $tenantB = makeRefExpertTenant();
    $admin   = makeRefExpertAdmin($tenantA->id);
    $expert  = makeRefExpert($tenantB->id);

    $this->actingAs($admin)
        ->get("/admin/experts/{$expert->id}")
        ->assertStatus(403);
});

it('un admin_filiale ne peut pas modifier un expert d\'une autre filiale', function () {
    $tenantA = makeRefExpertTenant();
    $tenantB = makeRefExpertTenant();
    $admin   = makeRefExpertAdmin($tenantA->id);
    $expert  = makeRefExpert($tenantB->id, ['name' => 'Intact']);

    $this->actingAs($admin)
        ->put("/admin/experts/{$expert->id}", ['name' => 'Piraté'])
        ->assertStatus(403);

    expect($expert->fresh()->name)->toBe('Intact');
});

it('un admin_filiale ne peut pas supprimer un expert d\'une autre filiale', function () {
    $tenantA = makeRefExpertTenant();
    $tenantB = makeRefExpertTenant();
    $admin   = makeRefExpertAdmin($tenantA->id);
    $expert  = makeRefExpert($tenantB->id);

    $this->actingAs($admin)
        ->delete("/admin/experts/{$expert->id}")
        ->assertStatus(403);

    $this->assertDatabaseHas('experts', ['id' => $expert->id, 'deleted_at' => null]);
});

it('un super_admin voit les experts de toutes les filiales', function () {
    $tenantA    = makeRefExpertTenant();
    $superAdmin = makeRefExpertSuperAdmin();
    $expert     = makeRefExpert($tenantA->id);

    $this->actingAs($superAdmin)
        ->get("/admin/experts/{$expert->id}")
        ->assertStatus(200);
});
