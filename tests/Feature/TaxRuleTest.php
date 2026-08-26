<?php

/**
 * ============================================================
 * Tests Pest — Module Gestion des taxes (tax_rules)
 * ============================================================
 * Lancer : php artisan test --filter TaxRuleTest
 *
 * Particularité constatée en lisant TaxRuleController /
 * routes/web.php (groupe admin/taxes, ~ligne 73) : contrairement
 * aux modules brokers/coinsurers/experts, AUCUNE middleware
 * `permission:referential.*` n'est appliquée sur ces routes, et
 * `toggleRule()` ne vérifie ni rôle ni permission (seulement
 * l'isolation tenant). Seule `storeRule()` restreint l'accès,
 * via un contrôle de RÔLE en dur (admin_filiale|super_admin) et
 * non via la permission `referential.create`. Les tests marqués
 * "// BUG ATTENDU" ci-dessous documentent le comportement
 * CORRECT attendu (permission requise) — ils échouent avec le
 * code actuel, volontairement, pour signaler l'écart. Voir le
 * rapport final de l'agent pour le détail.
 * ============================================================
 */

use App\Models\Country;
use App\Models\Tenant;
use App\Models\TaxRule;
use App\Models\TransportMode;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeRef — pas de conflit avec les autres fichiers) ─
function makeRefTaxTenant(): Tenant
{
    return Tenant::factory()->create();
}

function makeRefTaxAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

function makeRefTaxSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

// souscripteur : a referential.view mais ni le rôle admin_filiale/super_admin
// ni la permission referential.create/edit.
function makeRefTaxSouscripteur(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('souscripteur');
    return $user;
}

function makeRefTaxBareUser(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    return User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
}

function makeRefTransportMode(string $code = 'SEA'): TransportMode
{
    return TransportMode::create([
        'code'    => $code,
        'name_fr' => 'Maritime',
        'name_en' => 'Sea',
    ]);
}

function makeRefCountry(string $code = 'CI'): Country
{
    return Country::firstOrCreate(['code' => $code], [
        'name_fr' => 'Côte d\'Ivoire',
        'name_en' => 'Ivory Coast',
    ]);
}

function makeRefTaxRule(string $tenantId, array $overrides = []): TaxRule
{
    return TaxRule::create(array_merge([
        'tenant_id'      => $tenantId,
        'rate_pct'       => 2.5,
        'effective_date' => now()->subMonth()->toDateString(),
        'is_active'      => true,
    ], $overrides));
}

// ── Index (rules) ────────────────────────────────────────────
it('liste les taux de taxe pour un admin_filiale', function () {
    $admin = makeRefTaxAdmin();
    makeRefTaxRule($admin->tenant_id);

    $this->actingAs($admin)->get('/admin/taxes/rules')->assertStatus(200);
});

it('redirige vers login si non authentifié (index taxes)', function () {
    $this->get('/admin/taxes/rules')->assertRedirect('/login');
});

// BUG ATTENDU — comportement correct attendu : un utilisateur staff sans la
// permission referential.view ne devrait pas voir le référentiel de taxes.
// Comportement ACTUEL : TaxRuleController::rules() (app/Http/Controllers/Admin/TaxRuleController.php:26)
// et la route admin.taxes.rules (routes/web.php:74) n'appliquent aucune
// vérification de permission — ce test échoue donc avec le code actuel.
it('refuse la liste des taux de taxe sans la permission referential.view', function () {
    $user = makeRefTaxBareUser();

    $this->actingAs($user)->get('/admin/taxes/rules')->assertStatus(403);
});

// ── Store (storeRule) ────────────────────────────────────────
it('crée un taux de taxe générique (sans mode/pays) avec des données valides', function () {
    $admin = makeRefTaxAdmin();

    $this->actingAs($admin)
        ->post('/admin/taxes/rules', [
            'rate_pct'       => 3.5,
            'effective_date' => now()->toDateString(),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tax_rules', [
        'tenant_id'         => $admin->tenant_id,
        'transport_mode_id' => null,
        'country_code'      => null,
        'created_by'        => $admin->id,
    ]);
});

it('crée un taux de taxe spécifique à un mode de transport et un pays', function () {
    $admin    = makeRefTaxAdmin();
    $mode     = makeRefTransportMode('AIR');
    $country  = makeRefCountry('SN');

    $this->actingAs($admin)
        ->post('/admin/taxes/rules', [
            'transport_mode_id' => $mode->id,
            'country_code'      => $country->code,
            'rate_pct'          => 5,
            'effective_date'    => now()->toDateString(),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tax_rules', [
        'tenant_id'         => $admin->tenant_id,
        'transport_mode_id' => $mode->id,
        'country_code'      => $country->code,
    ]);
});

it('refuse la création avec rate_pct et effective_date manquants', function () {
    $admin = makeRefTaxAdmin();

    $this->actingAs($admin)
        ->post('/admin/taxes/rules', [])
        ->assertSessionHasErrors(['rate_pct', 'effective_date']);

    $this->assertDatabaseCount('tax_rules', 0);
});

it('refuse la création avec une end_date antérieure à effective_date', function () {
    $admin = makeRefTaxAdmin();

    $this->actingAs($admin)
        ->post('/admin/taxes/rules', [
            'rate_pct'       => 3,
            'effective_date' => now()->toDateString(),
            'end_date'       => now()->subDay()->toDateString(),
        ])
        ->assertSessionHasErrors(['end_date']);
});

it('refuse la création avec un transport_mode_id inexistant', function () {
    $admin = makeRefTaxAdmin();

    // transport_modes.id est un smallint (smallIncrements) — on reste dans
    // les bornes du type pour éviter une erreur SQL "out of range" côté
    // Postgres plutôt qu'une erreur de validation propre.
    $this->actingAs($admin)
        ->post('/admin/taxes/rules', [
            'transport_mode_id' => 32000,
            'rate_pct'          => 3,
            'effective_date'    => now()->toDateString(),
        ])
        ->assertSessionHasErrors(['transport_mode_id']);
});

it('refuse la création avec un rate_pct hors bornes', function () {
    $admin = makeRefTaxAdmin();

    $this->actingAs($admin)
        ->post('/admin/taxes/rules', [
            'rate_pct'       => 150,
            'effective_date' => now()->toDateString(),
        ])
        ->assertSessionHasErrors(['rate_pct']);
});

it('un super_admin doit préciser un tenant_id pour créer un taux', function () {
    $superAdmin = makeRefTaxSuperAdmin();

    $this->actingAs($superAdmin)
        ->post('/admin/taxes/rules', [
            'rate_pct'       => 3,
            'effective_date' => now()->toDateString(),
        ])
        ->assertSessionHasErrors(['tenant_id']);
});

it('un super_admin crée un taux pour la filiale de son choix', function () {
    $superAdmin = makeRefTaxSuperAdmin();
    $tenant     = makeRefTaxTenant();

    $this->actingAs($superAdmin)
        ->post('/admin/taxes/rules', [
            'tenant_id'      => $tenant->id,
            'rate_pct'       => 3,
            'effective_date' => now()->toDateString(),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tax_rules', [
        'tenant_id' => $tenant->id,
        'created_by'=> $superAdmin->id,
    ]);
});

it('refuse la création pour un rôle autre que admin_filiale/super_admin', function () {
    $user = makeRefTaxSouscripteur();

    $this->actingAs($user)
        ->post('/admin/taxes/rules', [
            'rate_pct'       => 3,
            'effective_date' => now()->toDateString(),
        ])
        ->assertStatus(403);

    $this->assertDatabaseCount('tax_rules', 0);
});

// ── Toggle (toggleRule) ──────────────────────────────────────
it('active/désactive un taux de taxe via toggle', function () {
    $admin = makeRefTaxAdmin();
    $rule  = makeRefTaxRule($admin->tenant_id, ['is_active' => true]);

    $this->actingAs($admin)
        ->patch("/admin/taxes/rules/{$rule->id}/toggle")
        ->assertRedirect();

    expect($rule->fresh()->is_active)->toBeFalse();
});

it('un admin_filiale ne peut pas toggler un taux d\'une autre filiale', function () {
    $tenantA = makeRefTaxTenant();
    $tenantB = makeRefTaxTenant();
    $admin   = makeRefTaxAdmin($tenantA->id);
    $rule    = makeRefTaxRule($tenantB->id, ['is_active' => true]);

    $this->actingAs($admin)
        ->patch("/admin/taxes/rules/{$rule->id}/toggle")
        ->assertStatus(403);

    expect($rule->fresh()->is_active)->toBeTrue();
});

// BUG ATTENDU — comportement correct attendu : togglerRule() devrait exiger
// la permission referential.edit (à l'image de brokers/coinsurers/experts
// dont l'action toggle exige la permission `.edit`).
// Comportement ACTUEL : TaxRuleController::toggleRule() (app/Http/Controllers/Admin/TaxRuleController.php:85)
// ne vérifie que l'isolation tenant (authorizeTenant) — un souscripteur de
// la même filiale (permission referential.view uniquement, pas .edit) peut
// activer/désactiver un taux de taxe. Ce test échoue donc avec le code actuel.
it('refuse le toggle sans la permission referential.edit', function () {
    $tenant = makeRefTaxTenant();
    $user   = makeRefTaxSouscripteur($tenant->id);
    $rule   = makeRefTaxRule($tenant->id, ['is_active' => true]);

    $this->actingAs($user)
        ->patch("/admin/taxes/rules/{$rule->id}/toggle")
        ->assertStatus(403);

    expect($rule->fresh()->is_active)->toBeTrue();
});

// ── Isolation tenant (index) ─────────────────────────────────
it('un admin_filiale ne voit que les taux de sa propre filiale', function () {
    $tenantA = makeRefTaxTenant();
    $tenantB = makeRefTaxTenant();
    $admin   = makeRefTaxAdmin($tenantA->id);
    makeRefTaxRule($tenantA->id, ['rate_pct' => 1.11]);
    makeRefTaxRule($tenantB->id, ['rate_pct' => 9.99]);

    $response = $this->actingAs($admin)->get('/admin/taxes/rules');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('admin/taxes/rules')
        ->has('rules.data', 1)
    );
});

it('un super_admin voit les taux de toutes les filiales via le filtre tenant_id', function () {
    $tenantA    = makeRefTaxTenant();
    $superAdmin = makeRefTaxSuperAdmin();
    makeRefTaxRule($tenantA->id);

    $this->actingAs($superAdmin)
        ->get("/admin/taxes/rules?tenant_id={$tenantA->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/taxes/rules')
            ->has('rules.data', 1)
        );
});
