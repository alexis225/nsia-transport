<?php

/**
 * ============================================================
 * Tests Pest — US-058 : CommissionService
 * ============================================================
 * Lancer : php artisan test --filter CommissionServiceTest
 * ============================================================
 */

use App\Models\Broker;
use App\Models\Certificate;
use App\Models\CommissionRule;
use App\Models\CommissionTransaction;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use App\Services\CommissionService;
use Illuminate\Support\Str;

// ── Helper ────────────────────────────────────────────────────
function makeCommissionFixture(array $ruleOverrides = []): array
{
    $tenant = Tenant::factory()->create();

    $broker = Broker::create([
        'tenant_id'       => $tenant->id,
        'code'            => 'BRK-' . Str::random(4),
        'name'            => 'Courtage Test',
        'type'            => Broker::TYPE_LOCAL,
        'country_code'    => 'CI',
        'commission_rate' => 5.00,
        'is_active'       => true,
    ]);

    $contract = InsuranceContract::create([
        'tenant_id'          => $tenant->id,
        'broker_id'          => $broker->id,
        'contract_number'    => 'CTR-' . Str::random(6),
        'type'               => 'OPEN_POLICY',
        'insured_name'       => 'Société Test SA',
        'currency_code'      => 'XOF',
        'subscription_limit' => 100_000_000,
        'used_limit'         => 0,
        'status'             => 'ACTIVE',
        'effective_date'     => now()->subMonth(),
        'expiry_date'        => now()->addYear(),
        'requires_approval'  => false,
    ]);

    $rule = CommissionRule::create(array_merge([
        'tenant_id'      => $tenant->id,
        'broker_id'      => $broker->id,
        'contract_id'    => $contract->id,
        'rate_pct'       => 10.00,
        'base_type'      => 'prime_total',
        'is_active'      => true,
        'effective_date' => now()->subMonth()->toDateString(),
    ], $ruleOverrides));

    $certificate = Certificate::create([
        'tenant_id'          => $tenant->id,
        'contract_id'        => $contract->id,
        'certificate_number' => 'CERT-' . Str::random(6),
        'policy_number'      => 'POL-' . Str::random(6),
        'insured_name'       => 'Importateur Test',
        'voyage_from'        => 'Abidjan',
        'voyage_to'          => 'Lagos',
        'voyage_date'        => now()->addWeek(),
        'transport_type'     => 'SEA',
        'currency_code'      => 'XOF',
        'insured_value'      => 5_000_000,
        'prime_total'        => 50_000,
        'status'             => 'DRAFT',
    ]);

    return compact('tenant', 'broker', 'contract', 'rule', 'certificate');
}

// ── Tests ─────────────────────────────────────────────────────

it('calcule la commission sur la base prime_total', function () {
    ['certificate' => $certificate] = makeCommissionFixture([
        'rate_pct' => 10.0, 'base_type' => 'prime_total',
    ]);

    $tx = app(CommissionService::class)->calculate($certificate);

    expect($tx)->not->toBeNull()
        ->and((float) $tx->prime_brute)->toBe(50_000.0)
        ->and((float) $tx->rate_pct)->toBe(10.0)
        ->and((float) $tx->commission)->toBe(5_000.0)
        ->and((float) $tx->prime_nette)->toBe(45_000.0)
        ->and($tx->status)->toBe(CommissionTransaction::STATUS_PENDING);
});

it('calcule la commission sur la base insured_value', function () {
    ['certificate' => $certificate] = makeCommissionFixture([
        'rate_pct' => 2.0, 'base_type' => 'insured_value',
    ]);

    $tx = app(CommissionService::class)->calculate($certificate);

    expect($tx)->not->toBeNull()
        ->and((float) $tx->prime_brute)->toBe(5_000_000.0)
        ->and((float) $tx->commission)->toBe(100_000.0);
});

it('calcule la commission sur un montant personnalisé', function () {
    ['certificate' => $certificate] = makeCommissionFixture([
        'rate_pct'           => 5.0,
        'base_type'          => 'custom_amount',
        'custom_base_amount' => 200_000,
    ]);

    $tx = app(CommissionService::class)->calculate($certificate);

    expect($tx)->not->toBeNull()
        ->and((float) $tx->prime_brute)->toBe(200_000.0)
        ->and((float) $tx->commission)->toBe(10_000.0);
});

it('retourne null si pas de courtier sur le contrat', function () {
    $tenant = Tenant::factory()->create();

    $contract = InsuranceContract::create([
        'tenant_id'          => $tenant->id,
        'broker_id'          => null,
        'contract_number'    => 'CTR-NB-' . Str::random(4),
        'type'               => 'VOYAGE',
        'insured_name'       => 'Test Sans Courtier',
        'currency_code'      => 'XOF',
        'subscription_limit' => 50_000_000,
        'used_limit'         => 0,
        'status'             => 'ACTIVE',
        'effective_date'     => now()->subMonth(),
        'expiry_date'        => now()->addYear(),
        'requires_approval'  => false,
    ]);

    $certificate = Certificate::create([
        'tenant_id'          => $tenant->id,
        'contract_id'        => $contract->id,
        'certificate_number' => 'CERT-NB-' . Str::random(4),
        'policy_number'      => 'POL-NB-' . Str::random(4),
        'insured_name'       => 'Test',
        'voyage_from'        => 'Abidjan',
        'voyage_to'          => 'Lagos',
        'voyage_date'        => now()->addWeek(),
        'transport_type'     => 'SEA',
        'currency_code'      => 'XOF',
        'insured_value'      => 1_000_000,
        'prime_total'        => 10_000,
        'status'             => 'DRAFT',
    ]);

    expect(app(CommissionService::class)->calculate($certificate))->toBeNull();
});

it('retourne null si aucune règle de commission applicable', function () {
    $tenant = Tenant::factory()->create();

    $broker = Broker::create([
        'tenant_id' => $tenant->id, 'code' => 'BRK-NR-' . Str::random(3),
        'name' => 'Broker Sans Règle', 'type' => Broker::TYPE_LOCAL,
        'country_code' => 'CI', 'commission_rate' => 5.00, 'is_active' => true,
    ]);

    $contract = InsuranceContract::create([
        'tenant_id' => $tenant->id, 'broker_id' => $broker->id,
        'contract_number' => 'CTR-NR-' . Str::random(4),
        'type' => 'VOYAGE', 'insured_name' => 'Test',
        'currency_code' => 'XOF', 'subscription_limit' => 10_000_000, 'used_limit' => 0,
        'status' => 'ACTIVE',
        'effective_date' => now()->subMonth(), 'expiry_date' => now()->addYear(),
        'requires_approval' => false,
    ]);

    $certificate = Certificate::create([
        'tenant_id' => $tenant->id, 'contract_id' => $contract->id,
        'certificate_number' => 'CERT-NR-' . Str::random(4),
        'policy_number'      => 'POL-NR-' . Str::random(4),
        'insured_name' => 'Test', 'voyage_from' => 'A', 'voyage_to' => 'B',
        'voyage_date' => now()->addWeek(), 'transport_type' => 'AIR',
        'currency_code' => 'XOF', 'insured_value' => 500_000, 'prime_total' => 5_000,
        'status' => 'DRAFT',
    ]);

    expect(app(CommissionService::class)->calculate($certificate))->toBeNull();
});

it('ne crée pas de doublon si une commission existe déjà', function () {
    ['certificate' => $certificate] = makeCommissionFixture();

    $service = app(CommissionService::class);
    $tx1 = $service->calculate($certificate);
    $tx2 = $service->calculate($certificate);

    expect($tx1->id)->toBe($tx2->id)
        ->and(CommissionTransaction::where('certificate_id', $certificate->id)->count())->toBe(1);
});

it('annule la commission liée à un certificat', function () {
    ['certificate' => $certificate] = makeCommissionFixture();

    $service = app(CommissionService::class);
    $service->calculate($certificate);
    $service->cancel($certificate);

    expect(
        CommissionTransaction::where('certificate_id', $certificate->id)
            ->where('status', CommissionTransaction::STATUS_PENDING)
            ->count()
    )->toBe(0);
});
