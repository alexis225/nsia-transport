<?php

/**
 * ============================================================
 * Tests Pest — US-058 : Workflow certificat (DRAFT → ISSUED)
 * ============================================================
 * Lancer : php artisan test --filter CertificateWorkflowTest
 * ============================================================
 */

use App\Models\Broker;
use App\Models\Certificate;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

// ── Helpers (noms uniques — pas de conflit avec UserBlockTest) ─
function makeWorkflowAdmin(): User
{
    $tenant = Tenant::factory()->create();
    $user   = User::factory()->create([
        'tenant_id' => $tenant->id,
        'password'  => Hash::make('Password@123'),
        'is_active' => true,
    ]);
    Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
    $user->assignRole('super_admin');
    return $user;
}

function makeWorkflowContract(Tenant $tenant): InsuranceContract
{
    $broker = Broker::create([
        'tenant_id'    => $tenant->id, 'code' => 'BRK-WF',
        'name'         => 'Courtage Workflow', 'type' => Broker::TYPE_LOCAL,
        'country_code' => 'CI', 'commission_rate' => 5.0, 'is_active' => true,
    ]);

    return InsuranceContract::create([
        'tenant_id'          => $tenant->id,
        'broker_id'          => $broker->id,
        'contract_number'    => 'CTR-WF-' . uniqid(),
        'type'               => 'OPEN_POLICY',
        'insured_name'       => 'Importateur CI',
        'currency_code'      => 'XOF',
        'subscription_limit' => 100_000_000,
        'used_limit'         => 0,
        'status'             => 'ACTIVE',
        'effective_date'     => now()->subMonth(),
        'expiry_date'        => now()->addYear(),
        'requires_approval'  => false,
    ]);
}

// ── Tests statuts ─────────────────────────────────────────────

it('peut créer un certificat en DRAFT', function () {
    $user     = makeWorkflowAdmin();
    $contract = makeWorkflowContract($user->tenant);

    $cert = Certificate::create([
        'tenant_id'          => $user->tenant_id,
        'contract_id'        => $contract->id,
        'certificate_number' => 'CERT-WF-001',
        'policy_number'      => 'POL-WF-001',
        'insured_name'       => 'Test Importateur',
        'voyage_from'        => 'Abidjan Port',
        'voyage_to'          => 'Dakar',
        'voyage_date'        => now()->addDays(7),
        'transport_type'     => 'SEA',
        'currency_code'      => 'XOF',
        'insured_value'      => 2_500_000,
        'prime_total'        => 25_000,
        'status'             => Certificate::STATUS_DRAFT,
        'created_by'         => $user->id,
    ]);

    expect($cert->isDraft())->toBeTrue()
        ->and($cert->status)->toBe('DRAFT')
        ->and($cert->submitted_at)->toBeNull()
        ->and($cert->issued_at)->toBeNull();
});

it('transition DRAFT → SUBMITTED met à jour submitted_at', function () {
    $user     = makeWorkflowAdmin();
    $contract = makeWorkflowContract($user->tenant);

    $cert = Certificate::create([
        'tenant_id'          => $user->tenant_id,
        'contract_id'        => $contract->id,
        'certificate_number' => 'CERT-WF-002',
        'policy_number'      => 'POL-WF-002',
        'insured_name'       => 'Test',
        'voyage_from'        => 'A', 'voyage_to' => 'B',
        'voyage_date'        => now()->addWeek(),
        'transport_type'     => 'AIR',
        'currency_code'      => 'XOF',
        'insured_value'      => 1_000_000,
        'prime_total'        => 10_000,
        'status'             => Certificate::STATUS_DRAFT,
        'created_by'         => $user->id,
    ]);

    $cert->update([
        'status'       => Certificate::STATUS_SUBMITTED,
        'submitted_at' => now(),
        'submitted_by' => $user->id,
    ]);

    expect($cert->fresh()->isSubmitted())->toBeTrue()
        ->and($cert->fresh()->submitted_at)->not->toBeNull();
});

it('transition SUBMITTED → ISSUED met à jour issued_at', function () {
    $user     = makeWorkflowAdmin();
    $contract = makeWorkflowContract($user->tenant);

    /** @var Certificate $cert */
    $cert = null;

    // Désactiver les observers pour éviter l'appel CommissionService sans règle
    Certificate::withoutEvents(function () use ($user, $contract, &$cert) {
        $cert = Certificate::create([
            'tenant_id'          => $user->tenant_id,
            'contract_id'        => $contract->id,
            'certificate_number' => 'CERT-WF-003',
            'policy_number'      => 'POL-WF-003',
            'insured_name'       => 'Test',
            'voyage_from'        => 'A', 'voyage_to' => 'B',
            'voyage_date'        => now()->addWeek(),
            'transport_type'     => 'SEA',
            'currency_code'      => 'XOF',
            'insured_value'      => 3_000_000,
            'prime_total'        => 30_000,
            'status'             => Certificate::STATUS_SUBMITTED,
            'submitted_at'       => now(),
            'submitted_by'       => $user->id,
            'created_by'         => $user->id,
        ]);

        $cert->update([
            'status'    => Certificate::STATUS_ISSUED,
            'issued_at' => now(),
            'issued_by' => $user->id,
        ]);
    });

    expect($cert)->not->toBeNull()
        ->and($cert->fresh()->isIssued())->toBeTrue()
        ->and($cert->fresh()->issued_at)->not->toBeNull()
        ->and((string) $cert->fresh()->issued_by)->toBe((string) $user->id);
});

it('annulation passe le certificat en CANCELLED', function () {
    $user     = makeWorkflowAdmin();
    $contract = makeWorkflowContract($user->tenant);

    /** @var Certificate $cert */
    $cert = null;

    Certificate::withoutEvents(function () use ($user, $contract, &$cert) {
        $cert = Certificate::create([
            'tenant_id'          => $user->tenant_id,
            'contract_id'        => $contract->id,
            'certificate_number' => 'CERT-WF-004',
            'policy_number'      => 'POL-WF-004',
            'insured_name'       => 'Test',
            'voyage_from'        => 'A', 'voyage_to' => 'B',
            'voyage_date'        => now()->addWeek(),
            'transport_type'     => 'ROAD',
            'currency_code'      => 'XOF',
            'insured_value'      => 500_000,
            'prime_total'        => 5_000,
            'status'             => Certificate::STATUS_ISSUED,
            'issued_at'          => now(),
            'issued_by'          => $user->id,
            'created_by'         => $user->id,
        ]);

        $cert->update([
            'status'              => Certificate::STATUS_CANCELLED,
            'cancelled_at'        => now(),
            'cancellation_reason' => 'Raison de test',
        ]);
    });

    expect($cert)->not->toBeNull()
        ->and($cert->fresh()->isCancelled())->toBeTrue()
        ->and($cert->fresh()->cancellation_reason)->toBe('Raison de test');
});

// ── Tests HTTP ────────────────────────────────────────────────

it('liste les certificats accessibles en GET /admin/certificates', function () {
    $user = makeWorkflowAdmin();

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/certificates');

    $response->assertStatus(200);
});

it('la recherche avancée répond avec un formulaire vide par défaut', function () {
    $user = makeWorkflowAdmin();

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/certificates/search');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/certificates/search')
            ->where('hasSearch', false)
            ->has('filters')
        );
});

it('la recherche avec critères retourne des résultats', function () {
    $user = makeWorkflowAdmin();

    /** @var \Tests\TestCase $this */
    $response = $this->actingAs($user)->get('/admin/certificates/search?status=ISSUED');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/certificates/search')
            ->where('hasSearch', true)
            ->has('results')
        );
});
