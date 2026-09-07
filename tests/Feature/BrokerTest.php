<?php

/**
 * ============================================================
 * Tests Pest — Module Courtiers (brokers)
 * ============================================================
 * Lancer : php artisan test --filter BrokerTest
 * ============================================================
 */

use App\Models\Broker;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeRef — pas de conflit avec les autres fichiers) ─
function makeRefBrokerTenant(): Tenant
{
    return Tenant::factory()->create();
}

function makeRefBrokerAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');

    return $user;
}

function makeRefBrokerSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');

    return $user;
}

// A un rôle staff mais sans les permissions brokers.create/edit/delete
// (le rôle souscripteur possède brokers.view uniquement).
function makeRefBrokerSouscripteur(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('souscripteur');

    return $user;
}

// Utilisateur authentifié sans aucun rôle/permission — sert aux tests
// "refusé sans la permission .view".
function makeRefBrokerBareUser(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();

    return User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
}

function makeRefBroker(string $tenantId, array $overrides = []): Broker
{
    return Broker::create(array_merge([
        'tenant_id' => $tenantId,
        'code' => 'BRK-'.strtoupper(Str::random(6)),
        'name' => 'Courtage Test',
        'type' => Broker::TYPE_LOCAL,
        'country_code' => 'CI',
        'commission_rate' => 5.0,
        'is_active' => true,
    ], $overrides));
}

// ── Index ────────────────────────────────────────────────────
it('liste les courtiers avec la permission brokers.view', function () {
    $admin = makeRefBrokerAdmin();
    makeRefBroker($admin->tenant_id);

    $this->actingAs($admin)->get('/admin/brokers')->assertStatus(200);
});

it('refuse la liste des courtiers sans la permission brokers.view', function () {
    $user = makeRefBrokerBareUser();

    $this->actingAs($user)->get('/admin/brokers')->assertStatus(403);
});

it('redirige vers login si non authentifié (index brokers)', function () {
    $this->get('/admin/brokers')->assertRedirect('/login');
});

// ── Store ────────────────────────────────────────────────────
it('crée un courtier avec des données valides', function () {
    $admin = makeRefBrokerAdmin();

    $payload = [
        'name' => 'Courtage Abidjan',
        'code' => 'BRK-AB1',
        'type' => Broker::TYPE_LOCAL,
        'email' => 'contact@courtage-ab.ci',
        'commission_rate' => 4.5,
        'is_active' => true,
    ];

    $this->actingAs($admin)
        ->post('/admin/brokers', $payload)
        ->assertRedirect(route('admin.brokers.index'));

    $this->assertDatabaseHas('brokers', [
        'name' => 'Courtage Abidjan',
        'code' => 'BRK-AB1',
        'tenant_id' => $admin->tenant_id,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $admin->id,
        'action' => 'broker_created',
        'entity_type' => 'broker',
    ]);
});

it('refuse la création avec des données invalides ou manquantes', function () {
    $admin = makeRefBrokerAdmin();

    $this->actingAs($admin)
        ->post('/admin/brokers', [
            'name' => '',
            'code' => '',
            'type' => '',
        ])
        ->assertSessionHasErrors(['name', 'code', 'type']);

    $this->assertDatabaseCount('brokers', 0);
});

it('refuse la création avec un code au format invalide', function () {
    $admin = makeRefBrokerAdmin();

    $this->actingAs($admin)
        ->post('/admin/brokers', [
            'name' => 'Courtage Test',
            'code' => 'code-invalide-minuscule!!',
            'type' => Broker::TYPE_LOCAL,
        ])
        ->assertSessionHasErrors(['code']);
});

it('refuse la création avec un type hors énumération', function () {
    $admin = makeRefBrokerAdmin();

    $this->actingAs($admin)
        ->post('/admin/brokers', [
            'name' => 'Courtage Test',
            'code' => 'BRK-XYZ',
            'type' => 'type_inconnu',
        ])
        ->assertSessionHasErrors(['type']);
});

it('refuse la création sans la permission brokers.create', function () {
    $user = makeRefBrokerSouscripteur();

    $this->actingAs($user)
        ->post('/admin/brokers', [
            'name' => 'Courtage Test',
            'code' => 'BRK-NOPE',
            'type' => Broker::TYPE_LOCAL,
        ])
        ->assertStatus(403);

    $this->assertDatabaseCount('brokers', 0);
});

// ── Update ───────────────────────────────────────────────────
it('modifie un courtier de sa filiale', function () {
    $admin = makeRefBrokerAdmin();
    $broker = makeRefBroker($admin->tenant_id, ['name' => 'Ancien Nom']);

    $this->actingAs($admin)
        ->put("/admin/brokers/{$broker->id}", [
            'name' => 'Nouveau Nom',
            'code' => $broker->code,
            'type' => $broker->type,
        ])
        ->assertRedirect(route('admin.brokers.index'));

    expect($broker->fresh()->name)->toBe('Nouveau Nom');

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $admin->id,
        'action' => 'broker_updated',
        'entity_type' => 'broker',
        'entity_id' => $broker->id,
    ]);
});

it('refuse la modification sans la permission brokers.edit', function () {
    $tenant = makeRefBrokerTenant();
    $user = makeRefBrokerSouscripteur($tenant->id);
    $broker = makeRefBroker($tenant->id);

    $this->actingAs($user)
        ->put("/admin/brokers/{$broker->id}", [
            'name' => 'Tentative',
            'code' => $broker->code,
            'type' => $broker->type,
        ])
        ->assertStatus(403);

    expect($broker->fresh()->name)->not->toBe('Tentative');
});

// ── Destroy ──────────────────────────────────────────────────
it('supprime un courtier de sa filiale', function () {
    $admin = makeRefBrokerAdmin();
    $broker = makeRefBroker($admin->tenant_id);

    $this->actingAs($admin)
        ->delete("/admin/brokers/{$broker->id}")
        ->assertRedirect(route('admin.brokers.index'));

    $this->assertSoftDeleted('brokers', ['id' => $broker->id]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $admin->id,
        'action' => 'broker_deleted',
        'entity_type' => 'broker',
        'entity_id' => $broker->id,
    ]);
});

it('refuse la suppression sans la permission brokers.delete', function () {
    $tenant = makeRefBrokerTenant();
    $user = makeRefBrokerSouscripteur($tenant->id);
    $broker = makeRefBroker($tenant->id);

    $this->actingAs($user)
        ->delete("/admin/brokers/{$broker->id}")
        ->assertStatus(403);

    $this->assertDatabaseHas('brokers', ['id' => $broker->id, 'deleted_at' => null]);
});

// ── Toggle ───────────────────────────────────────────────────
it('active/désactive un courtier via toggle', function () {
    $admin = makeRefBrokerAdmin();
    $broker = makeRefBroker($admin->tenant_id, ['is_active' => true]);

    $this->actingAs($admin)
        ->patch("/admin/brokers/{$broker->id}/toggle")
        ->assertRedirect();

    expect($broker->fresh()->is_active)->toBeFalse();
});

it('refuse le toggle sans la permission brokers.edit', function () {
    $tenant = makeRefBrokerTenant();
    $user = makeRefBrokerSouscripteur($tenant->id);
    $broker = makeRefBroker($tenant->id, ['is_active' => true]);

    $this->actingAs($user)
        ->patch("/admin/brokers/{$broker->id}/toggle")
        ->assertStatus(403);

    expect($broker->fresh()->is_active)->toBeTrue();
});

// ── Isolation tenant ─────────────────────────────────────────
it('un admin_filiale ne peut pas voir un courtier d\'une autre filiale', function () {
    $tenantA = makeRefBrokerTenant();
    $tenantB = makeRefBrokerTenant();
    $admin = makeRefBrokerAdmin($tenantA->id);
    $broker = makeRefBroker($tenantB->id);

    $this->actingAs($admin)
        ->get("/admin/brokers/{$broker->id}")
        ->assertStatus(403);
});

it('un admin_filiale ne peut pas modifier un courtier d\'une autre filiale', function () {
    $tenantA = makeRefBrokerTenant();
    $tenantB = makeRefBrokerTenant();
    $admin = makeRefBrokerAdmin($tenantA->id);
    $broker = makeRefBroker($tenantB->id, ['name' => 'Intact']);

    $this->actingAs($admin)
        ->put("/admin/brokers/{$broker->id}", [
            'name' => 'Piraté',
            'code' => $broker->code,
            'type' => $broker->type,
        ])
        ->assertStatus(403);

    expect($broker->fresh()->name)->toBe('Intact');
});

it('un admin_filiale ne peut pas supprimer un courtier d\'une autre filiale', function () {
    $tenantA = makeRefBrokerTenant();
    $tenantB = makeRefBrokerTenant();
    $admin = makeRefBrokerAdmin($tenantA->id);
    $broker = makeRefBroker($tenantB->id);

    $this->actingAs($admin)
        ->delete("/admin/brokers/{$broker->id}")
        ->assertStatus(403);

    $this->assertDatabaseHas('brokers', ['id' => $broker->id, 'deleted_at' => null]);
});

it('un super_admin voit les courtiers de toutes les filiales', function () {
    $tenantA = makeRefBrokerTenant();
    $superAdmin = makeRefBrokerSuperAdmin();
    $broker = makeRefBroker($tenantA->id);

    $this->actingAs($superAdmin)
        ->get("/admin/brokers/{$broker->id}")
        ->assertStatus(200);
});
