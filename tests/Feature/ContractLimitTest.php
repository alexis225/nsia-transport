<?php

/**
 * ============================================================
 * Tests Pest — Module Contrats : ContractLimitController
 * ============================================================
 * Lancer : php artisan test --filter ContractLimitTest
 * ============================================================
 */

use App\Models\Certificate;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeCtrLim — propre à ce fichier) ───────────────
function makeCtrLimTenant(array $overrides = []): Tenant
{
    return Tenant::factory()->create($overrides);
}

function makeCtrLimSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

function makeCtrLimAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

// Contrat ACTIVE avec plafond de souscription défini — condition requise
// par ContractLimitController::index() (whereNotNull('subscription_limit')
// ->where('status','ACTIVE')).
function makeCtrLimContract(Tenant $tenant, array $overrides = []): InsuranceContract
{
    return InsuranceContract::create(array_merge([
        'tenant_id'          => $tenant->id,
        'contract_number'    => 'CTR-LIM-' . Str::random(8),
        'type'               => 'OPEN_POLICY',
        'insured_name'       => 'Société Test SA',
        'currency_code'      => $tenant->currency_code,
        'subscription_limit' => 10_000_000,
        'used_limit'         => 0,
        'status'             => 'ACTIVE',
        'effective_date'     => now()->subMonth(),
        'expiry_date'        => now()->addYear(),
        'requires_approval'  => false,
    ], $overrides));
}

function makeCtrLimCertificate(InsuranceContract $contract, array $overrides = []): Certificate
{
    return Certificate::create(array_merge([
        'tenant_id'          => $contract->tenant_id,
        'contract_id'        => $contract->id,
        'certificate_number' => 'CERT-LIM-' . Str::random(6),
        'policy_number'      => 'POL-LIM-' . Str::random(6),
        'insured_name'       => 'Importateur Test',
        'voyage_from'        => 'Abidjan',
        'voyage_to'          => 'Lagos',
        'voyage_date'        => now()->addWeek(),
        'transport_type'     => 'SEA',
        'currency_code'      => $contract->currency_code,
        'insured_value'      => 1_000_000,
        'prime_total'        => 10_000,
        'status'             => Certificate::STATUS_ISSUED,
        'issued_at'          => now(),
    ], $overrides));
}

// ── status() : indicateurs d'un contrat ──────────────────────────────

it('status() retourne les indicateurs de plafond d\'un contrat', function () {
    $tenant   = makeCtrLimTenant();
    $admin    = makeCtrLimAdmin($tenant->id);
    $contract = makeCtrLimContract($tenant, ['subscription_limit' => 10_000_000, 'used_limit' => 5_000_000]);

    $response = $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/limit-status");

    $response->assertStatus(200)
        ->assertJsonPath('contract_id', $contract->id)
        ->assertJsonPath('subscription_limit', 10_000_000)
        ->assertJsonPath('used_limit', 5_000_000)
        ->assertJsonPath('usage_percent', 50)
        ->assertJsonPath('remaining_limit', 5_000_000)
        ->assertJsonPath('alert_level', 'ok')
        ->assertJsonPath('nn300_unlocked', false)
        ->assertJsonPath('can_issue', true);
});

it('alert_level = critical à partir de 95% d\'utilisation du plafond', function () {
    $tenant   = makeCtrLimTenant();
    $admin    = makeCtrLimAdmin($tenant->id);
    $contract = makeCtrLimContract($tenant, ['subscription_limit' => 10_000_000, 'used_limit' => 9_500_000]);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/limit-status")
        ->assertStatus(200)
        ->assertJsonPath('alert_level', 'critical');
});

it('alert_level = warning entre 80% et 95% d\'utilisation du plafond', function () {
    $tenant   = makeCtrLimTenant();
    $admin    = makeCtrLimAdmin($tenant->id);
    $contract = makeCtrLimContract($tenant, ['subscription_limit' => 10_000_000, 'used_limit' => 8_500_000]);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/limit-status")
        ->assertStatus(200)
        ->assertJsonPath('alert_level', 'warning');
});

it('le plafond effectif devient le plafond Traité une fois le NN300 débloqué', function () {
    $tenant   = makeCtrLimTenant();
    $admin    = makeCtrLimAdmin($tenant->id);
    $contract = makeCtrLimContract($tenant, [
        'subscription_limit' => 10_000_000,
        'treaty_limit'       => 20_000_000,
        'used_limit'         => 15_000_000,
        'nn300_unlocked_at'  => now(),
        'requires_approval'  => true,
    ]);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/limit-status")
        ->assertStatus(200)
        ->assertJsonPath('subscription_limit', 20_000_000)
        ->assertJsonPath('nn300_unlocked', true)
        ->assertJsonPath('usage_percent', 75);
});

it('isolation tenant : refuse le statut de plafond d\'un contrat d\'une autre filiale (403)', function () {
    $tenantA  = makeCtrLimTenant();
    $tenantB  = makeCtrLimTenant();
    $admin    = makeCtrLimAdmin($tenantA->id);
    $contract = makeCtrLimContract($tenantB);

    $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/limit-status")->assertStatus(403);
});

it('redirige vers /login si non authentifié (status)', function () {
    $tenant   = makeCtrLimTenant();
    $contract = makeCtrLimContract($tenant);

    $this->get("/admin/contracts/{$contract->id}/limit-status")->assertRedirect('/login');
});

it('status() retourne les derniers certificats émis dans recent_certs', function () {
    $tenant      = makeCtrLimTenant();
    $admin       = makeCtrLimAdmin($tenant->id);
    $contract    = makeCtrLimContract($tenant);
    $certificate = makeCtrLimCertificate($contract, ['insured_value' => 750_000]);

    $response = $this->actingAs($admin)->get("/admin/contracts/{$contract->id}/limit-status");

    $response->assertStatus(200);
    $certs = collect($response->json('recent_certs'));

    expect($certs->pluck('id'))->toContain($certificate->id);
    $found = $certs->firstWhere('id', $certificate->id);
    expect((float) $found['insured_value'])->toBe(750_000.0)
        ->and($found['status'])->toBe('ISSUED');
});

// ── index() : tableau de bord multi-contrats ─────────────────────────

it('index() liste les contrats actifs avec plafond, triés par consommation décroissante', function () {
    $tenant = makeCtrLimTenant();
    $admin  = makeCtrLimAdmin($tenant->id);

    $lowUsage  = makeCtrLimContract($tenant, ['subscription_limit' => 10_000_000, 'used_limit' => 1_000_000]);
    $highUsage = makeCtrLimContract($tenant, ['subscription_limit' => 10_000_000, 'used_limit' => 9_000_000]);

    $response = $this->actingAs($admin)->get('/admin/contracts/limits');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/contracts/limits')
            ->has('contracts', 2)
            ->where('contracts.0.id', $highUsage->id)
            ->where('contracts.1.id', $lowUsage->id)
        );
});

it('index() ignore les contrats sans plafond de souscription ou non actifs', function () {
    $tenant = makeCtrLimTenant();
    $admin  = makeCtrLimAdmin($tenant->id);

    makeCtrLimContract($tenant, ['subscription_limit' => null]);
    makeCtrLimContract($tenant, ['status' => 'DRAFT']);
    $eligible = makeCtrLimContract($tenant);

    $this->actingAs($admin)->get('/admin/contracts/limits')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->has('contracts', 1)
            ->where('contracts.0.id', $eligible->id)
        );
});

it('index() isole les contrats par filiale pour un admin_filiale', function () {
    $tenantA = makeCtrLimTenant();
    $tenantB = makeCtrLimTenant();
    $admin   = makeCtrLimAdmin($tenantA->id);
    makeCtrLimContract($tenantA);
    makeCtrLimContract($tenantB);

    $this->actingAs($admin)->get('/admin/contracts/limits')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->has('contracts', 1));
});

it('index() calcule les stats globales par niveau d\'alerte', function () {
    $tenant = makeCtrLimTenant();
    $sa     = makeCtrLimSuperAdmin();

    makeCtrLimContract($tenant, ['subscription_limit' => 10_000_000, 'used_limit' => 9_600_000]); // critical
    makeCtrLimContract($tenant, ['subscription_limit' => 10_000_000, 'used_limit' => 8_500_000]); // warning
    makeCtrLimContract($tenant, ['subscription_limit' => 10_000_000, 'used_limit' => 1_000_000]); // ok

    $this->actingAs($sa)->get('/admin/contracts/limits')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->where('stats.total_contracts', 3)
            ->where('stats.critical', 1)
            ->where('stats.warning', 1)
            ->where('stats.ok', 1)
        );
});

it('redirige vers /login si non authentifié (index)', function () {
    $this->get('/admin/contracts/limits')->assertRedirect('/login');
});
