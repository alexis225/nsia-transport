<?php

/**
 * ============================================================
 * Tests Pest — Auto-escalade sur timeout (Module Escalade NN300)
 * ============================================================
 * Couvre ApprovalWorkflowService::checkExpired() et la commande
 * artisan nsia:check-escalades (App\Console\Commands\EscaladeCheck)
 * qui l'invoque — cf. documentation-technique.html #escalade :
 * "Si le délai (due_date) expire, nsia:check-escalades (horaire)
 * fait automatiquement remonter à l'étape suivante, ou rejette si
 * c'était la dernière étape."
 *
 * Lancer : php artisan test --filter EscaladeCheckTest
 * ============================================================
 */

use App\Models\ApprovalRequest;
use App\Models\Broker;
use App\Models\Certificate;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ApprovalWorkflowService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (mêmes conventions que ApprovalWorkflowTest.php) ───

function makeApprCheckTenant(): Tenant
{
    $tenant = Tenant::factory()->create();
    Artisan::call('db:seed', ['--class' => 'ApprovalWorkflowSeeder']);

    return $tenant;
}

function makeApprCheckContract(Tenant $tenant, array $overrides = []): InsuranceContract
{
    $broker = Broker::create([
        'tenant_id' => $tenant->id,
        'code' => 'BRK-CHK-'.Str::random(4),
        'name' => 'Courtage Check',
        'type' => Broker::TYPE_LOCAL,
        'country_code' => 'CI',
        'commission_rate' => 5.0,
        'is_active' => true,
    ]);

    return InsuranceContract::create(array_merge([
        'tenant_id' => $tenant->id,
        'broker_id' => $broker->id,
        'contract_number' => 'CTR-CHK-'.Str::random(6),
        'type' => 'OPEN_POLICY',
        'insured_name' => 'Importateur Check SA',
        'currency_code' => 'XOF',
        'subscription_limit' => 1_000_000_000,
        'used_limit' => 0,
        'plein' => 10_000_000,
        'escalade_enabled' => true,
        'escalade_threshold_pct' => null,
        'certificates_limit' => null,
        'certificates_count' => 0,
        'status' => 'ACTIVE',
        'effective_date' => now()->subMonth(),
        'expiry_date' => now()->addYear(),
        'requires_approval' => false,
    ], $overrides));
}

function makeApprCheckCertificate(Tenant $tenant, InsuranceContract $contract, array $overrides = []): Certificate
{
    return Certificate::create(array_merge([
        'tenant_id' => $tenant->id,
        'contract_id' => $contract->id,
        'certificate_number' => 'CERT-CHK-'.Str::random(6),
        'policy_number' => 'POL-CHK-'.Str::random(6),
        'insured_name' => 'Importateur Test Check',
        'voyage_from' => 'Abidjan',
        'voyage_to' => 'Cotonou',
        'voyage_date' => now()->addWeek(),
        'transport_type' => 'SEA',
        'currency_code' => 'XOF',
        'insured_value' => 2_000_000, // 20% du plein par défaut > 15%
        'prime_total' => 20_000,
        'status' => Certificate::STATUS_DRAFT,
    ], $overrides));
}

function makeApprCheckSouscripteur(Tenant $tenant): User
{
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('souscripteur');

    return $user;
}

// ══════════════════════════════════════════════════════════════
// checkExpired() — auto-escalade / auto-rejet sur dépassement délai
// ══════════════════════════════════════════════════════════════

it('checkExpired() fait passer automatiquement à l’étape suivante quand le délai de l’étape 1 est dépassé', function () {
    $tenant = makeApprCheckTenant();
    $contract = makeApprCheckContract($tenant);
    $submitter = makeApprCheckSouscripteur($tenant);
    $certificate = makeApprCheckCertificate($tenant, $contract);

    $service = app(ApprovalWorkflowService::class);
    $service->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    expect($request->current_step)->toBe(1)
        ->and($request->total_steps)->toBe(2);

    // Simule le dépassement du délai d'approbation (due_date déjà passée)
    $request->update(['due_date' => now()->subHour()]);

    $count = $service->checkExpired();

    expect($count)->toBe(1);

    $request->refresh();
    expect($request->status)->toBe(ApprovalRequest::STATUS_PENDING)
        ->and($request->current_step)->toBe(2);

    $this->assertDatabaseHas('approval_decisions', [
        'request_id' => $request->id,
        'step_number' => 1,
        'approver_id' => null,
        'decision' => 'DELEGATED', // seule valeur disponible pour "escalade auto" (cf. service)
    ]);

    // Pas encore de décision finale sur le certificat
    expect($certificate->fresh()->status)->toBe(Certificate::STATUS_DRAFT);
});

it('checkExpired() rejette automatiquement le certificat si le délai de la DERNIÈRE étape est dépassé', function () {
    $tenant = makeApprCheckTenant();
    $contract = makeApprCheckContract($tenant);
    $submitter = makeApprCheckSouscripteur($tenant);
    $certificate = makeApprCheckCertificate($tenant, $contract, ['created_by' => $submitter->id]);

    $service = app(ApprovalWorkflowService::class);
    $service->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    // Place la requête directement sur la dernière étape (2/2) et simule
    // le dépassement de son délai.
    $request->update(['current_step' => 2, 'due_date' => now()->subHour()]);

    $count = $service->checkExpired();

    expect($count)->toBe(1);

    $request->refresh();
    expect($request->status)->toBe(ApprovalRequest::STATUS_REJECTED);

    $certificate->refresh();
    expect($certificate->status)->toBe(Certificate::STATUS_REJECTED)
        ->and($certificate->rejection_reason)->not->toBeNull();

    $this->assertDatabaseHas('approval_decisions', [
        'request_id' => $request->id,
        'step_number' => 2,
        'decision' => 'DELEGATED',
    ]);

    $this->assertDatabaseHas('notifications', [
        'notifiable_id' => $submitter->id,
        'notifiable_type' => User::class,
        'type' => 'EscaladeDecision',
    ]);
});

it('checkExpired() ne touche pas aux escalades dont le délai n’est pas dépassé', function () {
    $tenant = makeApprCheckTenant();
    $contract = makeApprCheckContract($tenant);
    $submitter = makeApprCheckSouscripteur($tenant);
    $certificate = makeApprCheckCertificate($tenant, $contract);

    $service = app(ApprovalWorkflowService::class);
    $service->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    // due_date par défaut (48h ouvrées) est dans le futur → rien à faire
    $count = $service->checkExpired();

    expect($count)->toBe(0);
    expect($request->fresh()->current_step)->toBe(1)
        ->and($request->fresh()->status)->toBe(ApprovalRequest::STATUS_PENDING);
});

// ══════════════════════════════════════════════════════════════
// Commande artisan nsia:check-escalades
// ══════════════════════════════════════════════════════════════

it('la commande nsia:check-escalades exécute checkExpired() et fait avancer les escalades expirées', function () {
    $tenant = makeApprCheckTenant();
    $contract = makeApprCheckContract($tenant);
    $submitter = makeApprCheckSouscripteur($tenant);
    $certificate = makeApprCheckCertificate($tenant, $contract);

    app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();
    $request->update(['due_date' => now()->subHour()]);

    // Convention du projet : toutes les commandes artisan custom utilisent
    // le préfixe nsia: (cf. App\Console\Commands\EscaladeCheck::$signature
    // et la note de documentation-technique.html sur le mismatch corrigé
    // app:check-escalades → nsia:check-escalades).
    $this->artisan('nsia:check-escalades')
        ->assertExitCode(0);

    expect($request->fresh()->current_step)->toBe(2);
});

it('la commande nsia:check-escalades ne fait rien si aucune escalade n’est expirée', function () {
    $tenant = makeApprCheckTenant();
    $contract = makeApprCheckContract($tenant);
    $submitter = makeApprCheckSouscripteur($tenant);
    $certificate = makeApprCheckCertificate($tenant, $contract);

    app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $this->artisan('nsia:check-escalades')
        ->assertExitCode(0);

    expect($request->fresh()->current_step)->toBe(1)
        ->and($request->fresh()->status)->toBe(ApprovalRequest::STATUS_PENDING);
});
