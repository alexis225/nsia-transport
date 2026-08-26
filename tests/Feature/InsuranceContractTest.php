<?php

/**
 * ============================================================
 * Tests Pest — Module Contrats : InsuranceContractController
 * ============================================================
 * Lancer : php artisan test --filter InsuranceContractTest
 * ============================================================
 */

use App\Models\InsuranceContract;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeCtr — évite toute collision avec les autres
// fichiers de tests, cf. consignes de l'agent) ──────────────────────
function makeCtrTenant(array $overrides = []): Tenant
{
    return Tenant::factory()->create($overrides);
}

function makeCtrSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

function makeCtrAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

// Utilisateur "sur mesure" avec un jeu de permissions restreint — sert à
// tester les refus 403 sur des permissions que ni admin_filiale ni
// souscripteur (staff) n'ont l'occasion de manquer (ex: contracts.edit).
function makeCtrUserWithPermissions(Tenant $tenant, array $permissions): User
{
    $roleName = 'ctr_custom_' . Str::random(8);
    $role     = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    $role->syncPermissions($permissions);

    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole($roleName);
    return $user;
}

function makeCtrContract(Tenant $tenant, array $overrides = []): InsuranceContract
{
    return InsuranceContract::create(array_merge([
        'tenant_id'          => $tenant->id,
        'contract_number'    => 'CTR-' . Str::random(8),
        'type'               => 'OPEN_POLICY',
        'insured_name'       => 'Société Test SA',
        'currency_code'      => $tenant->currency_code,
        'subscription_limit' => 2_000_000_000,
        'used_limit'         => 0,
        'status'             => 'DRAFT',
        'effective_date'     => now()->subDay(),
        'expiry_date'        => now()->addYear(),
        'requires_approval'  => false,
    ], $overrides));
}

function makeCtrContractPayload(Tenant $tenant, array $overrides = []): array
{
    return array_merge([
        'tenant_id'      => $tenant->id,
        'type'           => 'OPEN_POLICY',
        'insured_name'   => 'Nouvelle Société SA',
        'currency_code'  => $tenant->currency_code,
        'effective_date' => now()->addDay()->toDateString(),
        'expiry_date'    => now()->addYear()->toDateString(),
    ], $overrides);
}

// Plafond NN300 réellement actif (peut avoir été redéfini par un autre
// test/paramètre applicatif) — ne jamais présumer la valeur par défaut.
function makeCtrNn300Ceiling(): float
{
    return (float) Setting::get(Setting::KEY_NN300_CEILING, InsuranceContract::NN300_STANDARD_CEILING);
}

// ── Liste / Isolation tenant ─────────────────────────────────────────

it('liste uniquement les contrats de sa filiale pour un admin_filiale', function () {
    $tenantA = makeCtrTenant();
    $tenantB = makeCtrTenant();
    $admin   = makeCtrAdmin($tenantA->id);
    makeCtrContract($tenantA);
    makeCtrContract($tenantB);

    $this->actingAs($admin)->get('/admin/contracts')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/contracts/index')
            ->has('contracts.data', 1)
        );
});

it('super_admin voit les contrats de toutes les filiales', function () {
    $tenantA = makeCtrTenant();
    $tenantB = makeCtrTenant();
    $sa      = makeCtrSuperAdmin();
    makeCtrContract($tenantA);
    makeCtrContract($tenantB);

    $this->actingAs($sa)->get('/admin/contracts')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->has('contracts.data', 2));
});

it('redirige vers /login si non authentifié (index)', function () {
    $this->get('/admin/contracts')->assertRedirect('/login');
});

// ── Création ──────────────────────────────────────────────────────

it('admin_filiale peut créer un contrat (nominal)', function () {
    $tenant = makeCtrTenant();
    $admin  = makeCtrAdmin($tenant->id);

    $response = $this->actingAs($admin)->post('/admin/contracts', makeCtrContractPayload($tenant));

    $response->assertRedirect();

    $contract = InsuranceContract::where('tenant_id', $tenant->id)->first();

    expect($contract)->not->toBeNull()
        ->and($contract->status)->toBe('DRAFT')
        ->and((string) $contract->created_by)->toBe((string) $admin->id)
        ->and((float) $contract->subscription_limit)->toBe(makeCtrNn300Ceiling())
        ->and(str_starts_with($contract->contract_number, strtoupper($tenant->code)))->toBeTrue();

    $this->assertDatabaseHas('audit_logs', [
        'user_id'     => $admin->id,
        'action'      => 'contract.created',
        'entity_type' => 'InsuranceContract',
        'entity_id'   => $contract->id,
    ]);
});

it('la création échoue sans nom assuré (validation)', function () {
    $tenant  = makeCtrTenant();
    $admin   = makeCtrAdmin($tenant->id);
    $payload = makeCtrContractPayload($tenant);
    unset($payload['insured_name']);

    $this->actingAs($admin)->post('/admin/contracts', $payload)
        ->assertSessionHasErrors(['insured_name']);

    expect(InsuranceContract::count())->toBe(0);
});

it('un contrat requiert une validation DTAG si le plein dépasse le plafond NN300', function () {
    $tenant  = makeCtrTenant();
    $admin   = makeCtrAdmin($tenant->id);
    $payload = makeCtrContractPayload($tenant, ['plein' => makeCtrNn300Ceiling() + 1_000_000]);

    $this->actingAs($admin)->post('/admin/contracts', $payload)->assertRedirect();

    $contract = InsuranceContract::where('tenant_id', $tenant->id)->first();
    expect($contract->requires_approval)->toBeTrue();
});

it('sans permission contracts.create, la création est refusée (403)', function () {
    $tenant = makeCtrTenant();
    $viewer = makeCtrUserWithPermissions($tenant, ['contracts.view']);

    $this->actingAs($viewer)->post('/admin/contracts', makeCtrContractPayload($tenant))
        ->assertStatus(403);

    expect(InsuranceContract::count())->toBe(0);
});

// ── Consultation ──────────────────────────────────────────────────

it('consulte le détail d\'un contrat de sa filiale', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/contracts/show')
            ->where('contract.id', $contract->id)
        );
});

it('refuse la consultation d\'un contrat d\'une autre filiale (403)', function () {
    $tenantA  = makeCtrTenant();
    $tenantB  = makeCtrTenant();
    $admin    = makeCtrAdmin($tenantA->id);
    $contract = makeCtrContract($tenantB);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}")->assertStatus(403);
});

// ── Édition ───────────────────────────────────────────────────────

it('peut éditer un contrat en brouillon', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'DRAFT']);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/edit")->assertStatus(200);
});

it('refuse l\'édition (formulaire) d\'un contrat actif (403)', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'ACTIVE']);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/edit")->assertStatus(403);
});

it('met à jour un contrat en brouillon', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'DRAFT', 'insured_name' => 'Ancien Nom']);

    $payload = makeCtrContractPayload($tenant, ['insured_name' => 'Nouveau Nom']);

    $this->actingAs($admin)->put("/admin/contracts/{$contract->id}", $payload)->assertRedirect();

    expect($contract->fresh()->insured_name)->toBe('Nouveau Nom');
});

// BUG suspecté : InsuranceContractController::update() (app/Http/Controllers/
// Admin/InsuranceContractController.php:242-273) ne contient AUCUN abort_if
// sur le statut du contrat, contrairement à edit() (même fichier, ligne 215)
// qui bloque explicitement l'accès au formulaire pour un contrat ACTIVE avec
// le message "Un contrat actif ne peut pas être modifié directement.". Un
// utilisateur disposant de contracts.edit peut donc contourner cette
// restriction en soumettant directement une requête PUT sur
// /admin/contracts/{contract}, sans jamais passer par le formulaire. Ce test
// reflète le comportement CORRECT attendu (update() devrait refuser au même
// titre que edit()) — il échoue donc actuellement contre le code existant.
it('un contrat actif ne devrait pas pouvoir être modifié via update() [BUG]', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'ACTIVE']);

    $payload = makeCtrContractPayload($tenant);

    $this->actingAs($admin)->put("/admin/contracts/{$contract->id}", $payload)
        ->assertStatus(403);
});

// ── Suppression ───────────────────────────────────────────────────

it('super_admin peut supprimer un contrat en brouillon', function () {
    $tenant   = makeCtrTenant();
    $sa       = makeCtrSuperAdmin();
    $contract = makeCtrContract($tenant, ['status' => 'DRAFT']);

    $this->actingAs($sa)->delete("/admin/contracts/{$contract->id}")->assertRedirect();

    expect(InsuranceContract::find($contract->id))->toBeNull();
});

it('impossible de supprimer un contrat actif', function () {
    $tenant   = makeCtrTenant();
    $sa       = makeCtrSuperAdmin();
    $contract = makeCtrContract($tenant, ['status' => 'ACTIVE']);

    $this->actingAs($sa)->delete("/admin/contracts/{$contract->id}")->assertStatus(403);

    expect(InsuranceContract::find($contract->id))->not->toBeNull();
});

it('admin_filiale ne peut pas supprimer un contrat (permission manquante)', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'DRAFT']);

    $this->actingAs($admin)->delete("/admin/contracts/{$contract->id}")->assertStatus(403);

    expect(InsuranceContract::find($contract->id))->not->toBeNull();
});

// ── Workflow : submit ─────────────────────────────────────────────

it('la soumission auto-active un contrat qui ne requiert pas d\'approbation', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'DRAFT', 'requires_approval' => false]);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/submit")->assertRedirect();

    $contract->refresh();
    expect($contract->status)->toBe('ACTIVE')
        ->and((string) $contract->approved_by)->toBe((string) $admin->id)
        ->and($contract->approved_at)->not->toBeNull();
});

it('la soumission place le contrat en attente d\'approbation si requise', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'DRAFT', 'requires_approval' => true]);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/submit")->assertRedirect();

    expect($contract->fresh()->status)->toBe('PENDING_APPROVAL');
});

it('impossible de soumettre un contrat qui n\'est pas en brouillon', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'ACTIVE']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/submit")->assertStatus(422);
});

it('crée un audit_log contract.submitted', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'DRAFT', 'requires_approval' => false]);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/submit");

    $this->assertDatabaseHas('audit_logs', [
        'user_id'     => $admin->id,
        'action'      => 'contract.submitted',
        'entity_type' => 'InsuranceContract',
        'entity_id'   => $contract->id,
    ]);
});

// ── Workflow : approve / reject ───────────────────────────────────

it('super_admin approuve un contrat en attente et débloque le plafond Traité', function () {
    $tenant   = makeCtrTenant();
    $sa       = makeCtrSuperAdmin();
    $contract = makeCtrContract($tenant, [
        'status'             => 'PENDING_APPROVAL',
        'requires_approval'  => true,
        'treaty_limit'       => 6_000_000_000,
    ]);

    $this->actingAs($sa)->patch("/admin/contracts/{$contract->id}/approve", ['notes' => 'OK'])
        ->assertRedirect();

    $contract->refresh();
    expect($contract->status)->toBe('ACTIVE')
        ->and((string) $contract->approved_by)->toBe((string) $sa->id)
        ->and($contract->nn300_unlocked_at)->not->toBeNull()
        ->and($contract->isNn300Unlocked())->toBeTrue();
});

it('peut approuver directement un contrat en brouillon (sans passage par PENDING_APPROVAL)', function () {
    $tenant   = makeCtrTenant();
    $sa       = makeCtrSuperAdmin();
    $contract = makeCtrContract($tenant, ['status' => 'DRAFT', 'requires_approval' => false]);

    $this->actingAs($sa)->patch("/admin/contracts/{$contract->id}/approve")->assertRedirect();

    expect($contract->fresh()->status)->toBe('ACTIVE');
});

it('admin_filiale ne peut pas approuver un contrat (permission manquante)', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'PENDING_APPROVAL']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/approve")->assertStatus(403);

    expect($contract->fresh()->status)->toBe('PENDING_APPROVAL');
});

it('impossible d\'approuver un contrat suspendu', function () {
    $tenant   = makeCtrTenant();
    $sa       = makeCtrSuperAdmin();
    $contract = makeCtrContract($tenant, ['status' => 'SUSPENDED']);

    $this->actingAs($sa)->patch("/admin/contracts/{$contract->id}/approve")->assertStatus(422);
});

it('rejette un contrat en attente et le renvoie en brouillon', function () {
    $tenant   = makeCtrTenant();
    $sa       = makeCtrSuperAdmin();
    $contract = makeCtrContract($tenant, ['status' => 'PENDING_APPROVAL']);

    $this->actingAs($sa)->patch("/admin/contracts/{$contract->id}/reject", ['reason' => 'Dossier incomplet'])
        ->assertRedirect();

    $contract->refresh();
    expect($contract->status)->toBe('DRAFT')
        ->and($contract->validation_notes)->toContain('Dossier incomplet');
});

it('le motif est obligatoire pour rejeter un contrat', function () {
    $tenant   = makeCtrTenant();
    $sa       = makeCtrSuperAdmin();
    $contract = makeCtrContract($tenant, ['status' => 'PENDING_APPROVAL']);

    $this->actingAs($sa)->patch("/admin/contracts/{$contract->id}/reject", ['reason' => ''])
        ->assertSessionHasErrors(['reason']);

    expect($contract->fresh()->status)->toBe('PENDING_APPROVAL');
});

// ── Workflow : suspend / reactivate ────────────────────────────────

it('admin_filiale suspend un contrat actif', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'ACTIVE']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/suspend", ['reason' => 'Impayé'])
        ->assertRedirect();

    $contract->refresh();
    expect($contract->status)->toBe('SUSPENDED')
        ->and($contract->suspension_reason)->toBe('Impayé')
        ->and($contract->suspended_at)->not->toBeNull();
});

it('impossible de suspendre un contrat déjà suspendu', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'SUSPENDED']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/suspend", ['reason' => 'x'])
        ->assertStatus(422);
});

it('sans permission contracts.edit, la suspension est refusée (403)', function () {
    $tenant   = makeCtrTenant();
    $viewer   = makeCtrUserWithPermissions($tenant, ['contracts.view']);
    $contract = makeCtrContract($tenant, ['status' => 'ACTIVE']);

    $this->actingAs($viewer)->patch("/admin/contracts/{$contract->id}/suspend", ['reason' => 'x'])
        ->assertStatus(403);
});

it('super_admin réactive un contrat suspendu', function () {
    $tenant   = makeCtrTenant();
    $sa       = makeCtrSuperAdmin();
    $contract = makeCtrContract($tenant, ['status' => 'SUSPENDED', 'suspended_at' => now()]);

    $this->actingAs($sa)->patch("/admin/contracts/{$contract->id}/reactivate")->assertRedirect();

    $contract->refresh();
    expect($contract->status)->toBe('ACTIVE')
        ->and($contract->suspended_at)->toBeNull();
});

it('admin_filiale ne peut pas réactiver un contrat (permission manquante)', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'SUSPENDED']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/reactivate")->assertStatus(403);
});

it('impossible de réactiver un contrat actif', function () {
    $tenant   = makeCtrTenant();
    $sa       = makeCtrSuperAdmin();
    $contract = makeCtrContract($tenant, ['status' => 'ACTIVE']);

    $this->actingAs($sa)->patch("/admin/contracts/{$contract->id}/reactivate")->assertStatus(422);
});

// ── Workflow : cancel ───────────────────────────────────────────────

it('admin_filiale annule un contrat actif', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'ACTIVE']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/cancel", ['reason' => 'Résiliation client'])
        ->assertRedirect();

    $contract->refresh();
    expect($contract->status)->toBe('CANCELLED')
        ->and($contract->validation_notes)->toContain('Résiliation client');
});

it('peut annuler un contrat suspendu', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'SUSPENDED']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/cancel", ['reason' => 'x'])
        ->assertRedirect();

    expect($contract->fresh()->status)->toBe('CANCELLED');
});

it('impossible d\'annuler un contrat en brouillon', function () {
    $tenant   = makeCtrTenant();
    $admin    = makeCtrAdmin($tenant->id);
    $contract = makeCtrContract($tenant, ['status' => 'DRAFT']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/cancel", ['reason' => 'x'])
        ->assertStatus(422);
});

// ── Isolation tenant sur le workflow ─────────────────────────────────

it('admin_filiale ne peut pas agir sur un contrat d\'une autre filiale', function () {
    $tenantA  = makeCtrTenant();
    $tenantB  = makeCtrTenant();
    $admin    = makeCtrAdmin($tenantA->id);
    $contract = makeCtrContract($tenantB, ['status' => 'ACTIVE']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/suspend", ['reason' => 'x'])
        ->assertStatus(403);
});

// ── Non authentifié ───────────────────────────────────────────────

it('les actions de workflow redirigent vers /login si non authentifié', function () {
    $tenant   = makeCtrTenant();
    $contract = makeCtrContract($tenant, ['status' => 'ACTIVE']);

    $this->patch("/admin/contracts/{$contract->id}/suspend", ['reason' => 'x'])
        ->assertRedirect('/login');
});
