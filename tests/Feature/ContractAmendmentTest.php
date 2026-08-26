<?php

/**
 * ============================================================
 * Tests Pest — Module Contrats : ContractAmendmentController
 * ============================================================
 * Lancer : php artisan test --filter ContractAmendmentTest
 *
 * BUG suspecté (voir tests marqués [BUG] ci-dessous) :
 * ContractAmendmentController::submit()/approve()/reject() (app/Http/
 * Controllers/Admin/ContractAmendmentController.php lignes 162, 219, 256)
 * appellent Notification::notifyMany() / Notification::notify(). Or
 * App\Models\Notification (app/Models/Notification.php) n'expose QUE
 * send() et sendToMany() — notify()/notifyMany() n'existent pas sur ce
 * modèle (Call to undefined method). C'est d'ailleurs explicitement
 * documenté comme anti-pattern dans app/Services/NotificationHelper.php
 * ("À utiliser dans TOUS les services à la place de Notification::notify()
 * ou Notification::notifyMany()."). En l'état, toute soumission/
 * approbation/rejet d'avenant qui atteint l'appel Notification::* plante
 * (erreur 500) au lieu de rediriger normalement.
 * ============================================================
 */

use App\Models\ContractAmendment;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeCtrAmd — propre à ce fichier, distinct des
// helpers makeCtr* d'InsuranceContractTest.php et makeCtrLim* de
// ContractLimitTest.php pour éviter toute redéclaration) ────────────
function makeCtrAmdTenant(array $overrides = []): Tenant
{
    return Tenant::factory()->create($overrides);
}

function makeCtrAmdSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

function makeCtrAmdAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

function makeCtrAmdUserWithPermissions(Tenant $tenant, array $permissions): User
{
    $roleName = 'ctramd_custom_' . Str::random(8);
    $role     = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    $role->syncPermissions($permissions);

    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole($roleName);
    return $user;
}

// Contrat ACTIVE par défaut — un avenant ne peut être créé que sur un
// contrat actif (cf. ContractAmendmentController::create()/store()).
function makeCtrAmdContract(Tenant $tenant, array $overrides = []): InsuranceContract
{
    return InsuranceContract::create(array_merge([
        'tenant_id'          => $tenant->id,
        'contract_number'    => 'CTR-AMD-' . Str::random(8),
        'type'               => 'OPEN_POLICY',
        'insured_name'       => 'Société Test SA',
        'currency_code'      => $tenant->currency_code,
        'subscription_limit' => 2_000_000_000,
        'used_limit'         => 0,
        'status'             => 'ACTIVE',
        'rate_ro'            => 2.0,
        'rate_rg'            => 1.0,
        'effective_date'     => now()->subMonth(),
        'expiry_date'        => now()->addYear(),
        'requires_approval'  => false,
    ], $overrides));
}

function makeCtrAmdAmendment(InsuranceContract $contract, array $overrides = []): ContractAmendment
{
    return ContractAmendment::create(array_merge([
        'contract_id'      => $contract->id,
        'tenant_id'        => $contract->tenant_id,
        'amendment_number' => ContractAmendment::generateNumber($contract, 1),
        'sequence'         => 1,
        'reason'           => 'Ajustement du taux',
        'changes'          => ['rate_ro' => ['before' => (string) $contract->rate_ro, 'after' => '5.5']],
        'status'           => ContractAmendment::STATUS_DRAFT,
    ], $overrides));
}

// ── Liste / Création ──────────────────────────────────────────────

it('liste vide au départ pour un contrat actif sans avenant', function () {
    $tenant   = makeCtrAmdTenant();
    $admin    = makeCtrAmdAdmin($tenant->id);
    $contract = makeCtrAmdContract($tenant);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/amendments")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/contracts/amendments/index')
            ->has('amendments', 0)
        );
});

it('la page de création d\'avenant est accessible pour un contrat actif', function () {
    $tenant   = makeCtrAmdTenant();
    $admin    = makeCtrAmdAdmin($tenant->id);
    $contract = makeCtrAmdContract($tenant, ['status' => 'ACTIVE']);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/amendments/create")
        ->assertStatus(200);
});

it('la création d\'avenant est refusée sur un contrat non actif (403)', function () {
    $tenant   = makeCtrAmdTenant();
    $admin    = makeCtrAmdAdmin($tenant->id);
    $contract = makeCtrAmdContract($tenant, ['status' => 'DRAFT']);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/amendments/create")
        ->assertStatus(403);

    $this->actingAs($admin)->post("/admin/contracts/{$contract->id}/amendments", [
        'reason'  => 'Test',
        'rate_ro' => 9.0,
    ])->assertStatus(403);
});

it('crée un avenant en DRAFT avec les changements détectés', function () {
    $tenant   = makeCtrAmdTenant();
    $admin    = makeCtrAmdAdmin($tenant->id);
    $contract = makeCtrAmdContract($tenant, ['rate_ro' => 2.0]);

    $response = $this->actingAs($admin)->post("/admin/contracts/{$contract->id}/amendments", [
        'reason'  => 'Révision tarifaire',
        'rate_ro' => '4.5',
    ]);

    $response->assertRedirect();

    $amendment = ContractAmendment::where('contract_id', $contract->id)->first();

    expect($amendment)->not->toBeNull()
        ->and($amendment->status)->toBe('DRAFT')
        ->and($amendment->sequence)->toBe(1)
        ->and($amendment->amendment_number)->toBe('AV-' . $contract->contract_number . '-001')
        ->and($amendment->changes)->toHaveKey('rate_ro')
        ->and((string) $amendment->changes['rate_ro']['after'])->toBe('4.5');

    $this->assertDatabaseHas('audit_logs', [
        'user_id'     => $admin->id,
        'action'      => 'amendment.created',
        'entity_type' => 'ContractAmendment',
        'entity_id'   => $amendment->id,
    ]);
});

it('refuse la création d\'un avenant sans aucune modification détectée (422)', function () {
    $tenant   = makeCtrAmdTenant();
    $admin    = makeCtrAmdAdmin($tenant->id);
    $contract = makeCtrAmdContract($tenant);

    $this->actingAs($admin)->post("/admin/contracts/{$contract->id}/amendments", [
        'reason' => 'Aucun changement réel',
    ])->assertStatus(422);

    expect(ContractAmendment::where('contract_id', $contract->id)->count())->toBe(0);
});

// ── Détail ──────────────────────────────────────────────────────────

it('consulte le détail d\'un avenant', function () {
    $tenant    = makeCtrAmdTenant();
    $admin     = makeCtrAmdAdmin($tenant->id);
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/amendments/{$amendment->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/contracts/amendments/show')
            ->where('amendment.id', $amendment->id)
        );
});

it('isolation tenant : accès refusé à un avenant d\'une autre filiale (403)', function () {
    $tenantA   = makeCtrAmdTenant();
    $tenantB   = makeCtrAmdTenant();
    $admin     = makeCtrAmdAdmin($tenantA->id);
    $contractB = makeCtrAmdContract($tenantB);
    $amendment = makeCtrAmdAmendment($contractB);

    $this->actingAs($admin)->get("/admin/contracts/{$contractB->id}/amendments/{$amendment->id}")
        ->assertStatus(403);
});

// ── Workflow : submit ─────────────────────────────────────────────

// [BUG] Voir en-tête de fichier — Notification::notifyMany() n'existe pas
// sur App\Models\Notification. Ce test reflète le comportement CORRECT
// attendu (soumission réussie, statut PENDING) et échoue donc actuellement.
it('soumet un avenant en DRAFT pour validation [BUG possible: Notification::notifyMany]', function () {
    $tenant    = makeCtrAmdTenant();
    $admin     = makeCtrAmdAdmin($tenant->id);
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract, ['created_by' => $admin->id]);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/amendments/{$amendment->id}/submit")
        ->assertRedirect();

    $amendment->refresh();
    expect($amendment->status)->toBe('PENDING')
        ->and($amendment->submitted_at)->not->toBeNull()
        ->and((string) $amendment->submitted_by)->toBe((string) $admin->id);
});

it('impossible de soumettre un avenant qui n\'est pas en brouillon (422)', function () {
    $tenant    = makeCtrAmdTenant();
    $admin     = makeCtrAmdAdmin($tenant->id);
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract, ['status' => 'PENDING']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/amendments/{$amendment->id}/submit")
        ->assertStatus(422);
});

it('sans permission contracts.edit, la soumission d\'avenant est refusée (403)', function () {
    $tenant    = makeCtrAmdTenant();
    $viewer    = makeCtrAmdUserWithPermissions($tenant, ['contracts.view']);
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract);

    $this->actingAs($viewer)->patch("/admin/contracts/{$contract->id}/amendments/{$amendment->id}/submit")
        ->assertStatus(403);

    expect($amendment->fresh()->status)->toBe('DRAFT');
});

// ── Workflow : approve ────────────────────────────────────────────

// [BUG] Voir en-tête de fichier — Notification::notify() n'existe pas sur
// App\Models\Notification. Ce test reflète le comportement CORRECT attendu
// (approbation réussie + application des changements au contrat) et
// échoue donc actuellement.
it('approuve un avenant en attente et applique les changements au contrat [BUG possible: Notification::notify]', function () {
    $tenant    = makeCtrAmdTenant();
    $sa        = makeCtrAmdSuperAdmin();
    $creator   = makeCtrAmdAdmin($tenant->id);
    $contract  = makeCtrAmdContract($tenant, ['rate_ro' => 2.0, 'rate_rg' => 1.0]);
    $amendment = makeCtrAmdAmendment($contract, [
        'status'     => 'PENDING',
        'created_by' => $creator->id,
        'changes'    => ['rate_ro' => ['before' => '2.0000', 'after' => '4.5']],
    ]);

    $this->actingAs($sa)->patch(
        "/admin/contracts/{$contract->id}/amendments/{$amendment->id}/approve",
        ['notes' => 'Validé']
    )->assertRedirect();

    $amendment->refresh();
    $contract->refresh();

    expect($amendment->status)->toBe('APPROVED')
        ->and($amendment->applied_at)->not->toBeNull()
        ->and((float) $contract->rate_ro)->toBe(4.5)
        // rate_ro amendé => premium_rate recalculé (rate_ro + rate_rg)
        ->and((float) $contract->premium_rate)->toBe(5.5);
});

it('admin_filiale ne peut pas approuver un avenant (permission manquante, 403)', function () {
    $tenant    = makeCtrAmdTenant();
    $admin     = makeCtrAmdAdmin($tenant->id);
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract, ['status' => 'PENDING']);

    $this->actingAs($admin)->patch("/admin/contracts/{$contract->id}/amendments/{$amendment->id}/approve")
        ->assertStatus(403);

    expect($amendment->fresh()->status)->toBe('PENDING');
});

it('impossible d\'approuver un avenant qui n\'est pas en attente (422)', function () {
    $tenant    = makeCtrAmdTenant();
    $sa        = makeCtrAmdSuperAdmin();
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract, ['status' => 'DRAFT']);

    $this->actingAs($sa)->patch("/admin/contracts/{$contract->id}/amendments/{$amendment->id}/approve")
        ->assertStatus(422);
});

// ── Workflow : reject ─────────────────────────────────────────────

// [BUG] Voir en-tête de fichier — Notification::notify() n'existe pas sur
// App\Models\Notification. Ce test reflète le comportement CORRECT attendu
// (rejet réussi) et échoue donc actuellement.
it('rejette un avenant en attente avec motif [BUG possible: Notification::notify]', function () {
    $tenant    = makeCtrAmdTenant();
    $sa        = makeCtrAmdSuperAdmin();
    $creator   = makeCtrAmdAdmin($tenant->id);
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract, ['status' => 'PENDING', 'created_by' => $creator->id]);

    $this->actingAs($sa)->patch(
        "/admin/contracts/{$contract->id}/amendments/{$amendment->id}/reject",
        ['reason' => 'Taux non conforme']
    )->assertRedirect();

    $amendment->refresh();
    expect($amendment->status)->toBe('REJECTED')
        ->and($amendment->review_notes)->toContain('Taux non conforme');
});

it('le motif est obligatoire pour rejeter un avenant', function () {
    $tenant    = makeCtrAmdTenant();
    $sa        = makeCtrAmdSuperAdmin();
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract, ['status' => 'PENDING']);

    $this->actingAs($sa)->patch(
        "/admin/contracts/{$contract->id}/amendments/{$amendment->id}/reject",
        ['reason' => '']
    )->assertSessionHasErrors(['reason']);

    expect($amendment->fresh()->status)->toBe('PENDING');
});

it('sans permission contracts.validate, le rejet d\'avenant est refusé (403)', function () {
    $tenant    = makeCtrAmdTenant();
    $admin     = makeCtrAmdAdmin($tenant->id);
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract, ['status' => 'PENDING']);

    $this->actingAs($admin)->patch(
        "/admin/contracts/{$contract->id}/amendments/{$amendment->id}/reject",
        ['reason' => 'x']
    )->assertStatus(403);

    expect($amendment->fresh()->status)->toBe('PENDING');
});

// ── Non authentifié ───────────────────────────────────────────────

it('redirige vers /login si non authentifié', function () {
    $tenant    = makeCtrAmdTenant();
    $contract  = makeCtrAmdContract($tenant);
    $amendment = makeCtrAmdAmendment($contract);

    $this->get("/admin/contracts/{$contract->id}/amendments")->assertRedirect('/login');
    $this->patch("/admin/contracts/{$contract->id}/amendments/{$amendment->id}/submit")
        ->assertRedirect('/login');
});
