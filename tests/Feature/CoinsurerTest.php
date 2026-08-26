<?php

/**
 * ============================================================
 * Tests Pest — Module Coassureurs (coinsurers)
 * ============================================================
 * Lancer : php artisan test --filter CoinsurerTest
 * ============================================================
 */

use App\Models\Coinsurer;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeRef — pas de conflit avec les autres fichiers) ─
function makeRefCoinsurerTenant(): Tenant
{
    return Tenant::factory()->create();
}

function makeRefCoinsurerAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

function makeRefCoinsurerSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

// souscripteur : n'a aucune permission coinsurers.* (voir seeder)
function makeRefCoinsurerSouscripteur(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('souscripteur');
    return $user;
}

function makeRefCoinsurerBareUser(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    return User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
}

function makeRefCoinsurer(string $tenantId, array $overrides = []): Coinsurer
{
    return Coinsurer::create(array_merge([
        'tenant_id'    => $tenantId,
        'name'         => 'Coassureur Test',
        'country_code' => 'CI',
        'is_active'    => true,
    ], $overrides));
}

// ── Index ────────────────────────────────────────────────────
it('liste les coassureurs avec la permission coinsurers.view', function () {
    $admin = makeRefCoinsurerAdmin();
    makeRefCoinsurer($admin->tenant_id);

    $this->actingAs($admin)->get('/admin/coinsurers')->assertStatus(200);
});

it('refuse la liste des coassureurs sans la permission coinsurers.view', function () {
    $user = makeRefCoinsurerBareUser();

    $this->actingAs($user)->get('/admin/coinsurers')->assertStatus(403);
});

it('redirige vers login si non authentifié (index coinsurers)', function () {
    $this->get('/admin/coinsurers')->assertRedirect('/login');
});

// ── Store ────────────────────────────────────────────────────
it('crée un coassureur avec des données valides', function () {
    $admin = makeRefCoinsurerAdmin();

    $payload = [
        'name'         => 'AXA Réassurance',
        'country_code' => 'CI',
        'email'        => 'contact@axa-re.ci',
        'phone'        => '+225 0102030405',
        'is_active'    => true,
    ];

    $this->actingAs($admin)
        ->post('/admin/coinsurers', $payload)
        ->assertRedirect(route('admin.coinsurers.index'));

    $this->assertDatabaseHas('coinsurers', [
        'name'      => 'AXA Réassurance',
        'tenant_id' => $admin->tenant_id,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id'     => $admin->id,
        'action'      => 'coinsurer_created',
        'entity_type' => 'coinsurer',
    ]);
});

it('refuse la création avec des données invalides ou manquantes', function () {
    $admin = makeRefCoinsurerAdmin();

    $this->actingAs($admin)
        ->post('/admin/coinsurers', [
            'name'  => '',
            'email' => 'pas-un-email',
        ])
        ->assertSessionHasErrors(['name', 'email']);

    $this->assertDatabaseCount('coinsurers', 0);
});

it('refuse la création avec un country_code invalide', function () {
    $admin = makeRefCoinsurerAdmin();

    $this->actingAs($admin)
        ->post('/admin/coinsurers', [
            'name'         => 'Coassureur Test',
            'country_code' => 'CIV', // 3 caractères au lieu de 2
        ])
        ->assertSessionHasErrors(['country_code']);
});

it('refuse la création sans la permission coinsurers.create', function () {
    $user = makeRefCoinsurerSouscripteur();

    $this->actingAs($user)
        ->post('/admin/coinsurers', ['name' => 'Coassureur Test'])
        ->assertStatus(403);

    $this->assertDatabaseCount('coinsurers', 0);
});

// ── Update ───────────────────────────────────────────────────
it('modifie un coassureur de sa filiale', function () {
    $admin     = makeRefCoinsurerAdmin();
    $coinsurer = makeRefCoinsurer($admin->tenant_id, ['name' => 'Ancien Nom']);

    $this->actingAs($admin)
        ->put("/admin/coinsurers/{$coinsurer->id}", ['name' => 'Nouveau Nom'])
        ->assertRedirect(route('admin.coinsurers.index'));

    expect($coinsurer->fresh()->name)->toBe('Nouveau Nom');

    $this->assertDatabaseHas('audit_logs', [
        'user_id'     => $admin->id,
        'action'      => 'coinsurer_updated',
        'entity_type' => 'coinsurer',
        'entity_id'   => $coinsurer->id,
    ]);
});

it('refuse la modification sans la permission coinsurers.edit', function () {
    $tenant    = makeRefCoinsurerTenant();
    $user      = makeRefCoinsurerSouscripteur($tenant->id);
    $coinsurer = makeRefCoinsurer($tenant->id, ['name' => 'Intact']);

    $this->actingAs($user)
        ->put("/admin/coinsurers/{$coinsurer->id}", ['name' => 'Tentative'])
        ->assertStatus(403);

    expect($coinsurer->fresh()->name)->toBe('Intact');
});

// ── Destroy ──────────────────────────────────────────────────
it('supprime un coassureur de sa filiale', function () {
    $admin     = makeRefCoinsurerAdmin();
    $coinsurer = makeRefCoinsurer($admin->tenant_id);

    $this->actingAs($admin)
        ->delete("/admin/coinsurers/{$coinsurer->id}")
        ->assertRedirect(route('admin.coinsurers.index'));

    $this->assertSoftDeleted('coinsurers', ['id' => $coinsurer->id]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id'     => $admin->id,
        'action'      => 'coinsurer_deleted',
        'entity_type' => 'coinsurer',
        'entity_id'   => $coinsurer->id,
    ]);
});

it('refuse la suppression sans la permission coinsurers.delete', function () {
    $tenant    = makeRefCoinsurerTenant();
    $user      = makeRefCoinsurerSouscripteur($tenant->id);
    $coinsurer = makeRefCoinsurer($tenant->id);

    $this->actingAs($user)
        ->delete("/admin/coinsurers/{$coinsurer->id}")
        ->assertStatus(403);

    $this->assertDatabaseHas('coinsurers', ['id' => $coinsurer->id, 'deleted_at' => null]);
});

// ── Toggle ───────────────────────────────────────────────────
it('active/désactive un coassureur via toggle', function () {
    $admin     = makeRefCoinsurerAdmin();
    $coinsurer = makeRefCoinsurer($admin->tenant_id, ['is_active' => true]);

    $this->actingAs($admin)
        ->patch("/admin/coinsurers/{$coinsurer->id}/toggle")
        ->assertRedirect();

    expect($coinsurer->fresh()->is_active)->toBeFalse();
});

it('refuse le toggle sans la permission coinsurers.edit', function () {
    $tenant    = makeRefCoinsurerTenant();
    $user      = makeRefCoinsurerSouscripteur($tenant->id);
    $coinsurer = makeRefCoinsurer($tenant->id, ['is_active' => true]);

    $this->actingAs($user)
        ->patch("/admin/coinsurers/{$coinsurer->id}/toggle")
        ->assertStatus(403);

    expect($coinsurer->fresh()->is_active)->toBeTrue();
});

// ── Isolation tenant ─────────────────────────────────────────
it('un admin_filiale ne peut pas voir un coassureur d\'une autre filiale', function () {
    $tenantA   = makeRefCoinsurerTenant();
    $tenantB   = makeRefCoinsurerTenant();
    $admin     = makeRefCoinsurerAdmin($tenantA->id);
    $coinsurer = makeRefCoinsurer($tenantB->id);

    $this->actingAs($admin)
        ->get("/admin/coinsurers/{$coinsurer->id}")
        ->assertStatus(403);
});

it('un admin_filiale ne peut pas modifier un coassureur d\'une autre filiale', function () {
    $tenantA   = makeRefCoinsurerTenant();
    $tenantB   = makeRefCoinsurerTenant();
    $admin     = makeRefCoinsurerAdmin($tenantA->id);
    $coinsurer = makeRefCoinsurer($tenantB->id, ['name' => 'Intact']);

    $this->actingAs($admin)
        ->put("/admin/coinsurers/{$coinsurer->id}", ['name' => 'Piraté'])
        ->assertStatus(403);

    expect($coinsurer->fresh()->name)->toBe('Intact');
});

it('un admin_filiale ne peut pas supprimer un coassureur d\'une autre filiale', function () {
    $tenantA   = makeRefCoinsurerTenant();
    $tenantB   = makeRefCoinsurerTenant();
    $admin     = makeRefCoinsurerAdmin($tenantA->id);
    $coinsurer = makeRefCoinsurer($tenantB->id);

    $this->actingAs($admin)
        ->delete("/admin/coinsurers/{$coinsurer->id}")
        ->assertStatus(403);

    $this->assertDatabaseHas('coinsurers', ['id' => $coinsurer->id, 'deleted_at' => null]);
});

it('un super_admin voit les coassureurs de toutes les filiales', function () {
    $tenantA    = makeRefCoinsurerTenant();
    $superAdmin = makeRefCoinsurerSuperAdmin();
    $coinsurer  = makeRefCoinsurer($tenantA->id);

    $this->actingAs($superAdmin)
        ->get("/admin/coinsurers/{$coinsurer->id}")
        ->assertStatus(200);
});
