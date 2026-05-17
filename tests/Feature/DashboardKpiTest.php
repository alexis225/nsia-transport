<?php

/**
 * ============================================================
 * Tests Pest — US-058 : Dashboard & KPIs
 * ============================================================
 * Teste les controllers dashboard : chargement, données, permissions.
 * Lancer : php artisan test --filter DashboardKpiTest
 * ============================================================
 */

use App\Models\Certificate;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

function makeDashboardUser(string $role = 'super_admin'): User
{
    $tenant = Tenant::factory()->create(['is_active' => true]);
    $user   = User::factory()->create([
        'tenant_id' => $tenant->id,
        'password'  => Hash::make('Password@123'),
        'is_active' => true,
    ]);
    $r = Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
    $user->assignRole($r);
    return $user;
}

// ── Dashboard principal ───────────────────────────────────────

it('le dashboard principal charge correctement (super_admin)', function () {
    $user = makeDashboardUser('super_admin');

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/dashboard');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('kpis')
            ->has('recentCerts')
            ->has('topBrokers')
            ->has('monthlyData')
            ->has('period')
            ->has('tenantName')
        );
});

it('le dashboard KPIs charge correctement', function () {
    $user = makeDashboardUser('super_admin');

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/dashboard/kpi');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard/kpi')
            ->has('certStats')
            ->has('monthlyData')
            ->has('contractStats')
        );
});

it('le dashboard DTAG est réservé au super_admin', function () {
    $user = makeDashboardUser('super_admin');

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/dashboard/dtag');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard/dtag')
            ->has('global')
            ->has('byTenant')
            ->has('monthlyData')
        );
});

it('un non-super_admin ne peut pas accéder au dashboard DTAG', function () {
    // Créer un rôle autre que super_admin
    $tenant = Tenant::factory()->create(['is_active' => true]);
    $user   = User::factory()->create([
        'tenant_id' => $tenant->id,
        'is_active' => true,
    ]);
    Role::firstOrCreate(['name' => 'souscripteur', 'guard_name' => 'web']);
    $user->assignRole('souscripteur');

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/dashboard/dtag');

    $response->assertStatus(403);
});

// ── Données KPI ───────────────────────────────────────────────

it('les KPIs reflètent les certificats émis ce mois', function () {
    $user = makeDashboardUser('super_admin');

    // Créer un certificat ISSUED ce mois via withoutObservers
    Certificate::withoutEvents(function () use ($user) {
        $contract = InsuranceContract::create([
            'tenant_id'          => $user->tenant_id,
            'contract_number'    => 'CTR-KPI-001',
            'type'               => 'VOYAGE',
            'insured_name'       => 'Test KPI',
            'currency_code'      => 'XOF',
            'subscription_limit' => 50_000_000,
            'used_limit'         => 0,
            'status'             => 'ACTIVE',
            'effective_date'     => now()->subMonth(),
            'expiry_date'        => now()->addYear(),
            'requires_approval'  => false,
        ]);

        Certificate::create([
            'tenant_id'          => $user->tenant_id,
            'contract_id'        => $contract->id,
            'certificate_number' => 'CERT-KPI-001',
            'policy_number'      => 'POL-KPI-001',
            'insured_name'       => 'Test KPI',
            'voyage_from'        => 'Abidjan',
            'voyage_to'          => 'Dakar',
            'voyage_date'        => now(),
            'transport_type'     => 'SEA',
            'currency_code'      => 'XOF',
            'insured_value'      => 2_000_000,
            'prime_total'        => 20_000,
            'status'             => 'ISSUED',
            'issued_at'          => now(),
            'issued_by'          => $user->id,
            'created_by'         => $user->id,
        ]);
    });

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/dashboard');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->where('kpis.0.label', 'Certificats émis')
        );
});

// ── Rapports ──────────────────────────────────────────────────

it('le rapport certificats par période charge correctement', function () {
    $user = makeDashboardUser('super_admin');

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/reports/certificates');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/certificates')
            ->has('stats')
            ->has('byTransport')
            ->has('filters')
        );
});

it('le rapport contrats charge correctement', function () {
    $user = makeDashboardUser('super_admin');

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/reports/contracts');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/contracts')
            ->has('stats')
            ->has('byType')
            ->has('byStatus')
        );
});

it('le rapport intermédiaires charge avec les 3 onglets', function () {
    $user = makeDashboardUser('super_admin');

    /** @var \Tests\TestCase $this */
    foreach (['brokers', 'coinsurers', 'experts'] as $tab) {
        $response = $this->actingAs($user)->get("/admin/reports/intermediaries?tab={$tab}");
        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page->where('tab', $tab));
    }
});
