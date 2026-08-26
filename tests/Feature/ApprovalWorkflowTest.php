<?php

/**
 * ============================================================
 * Tests Pest — Module Escalade NN300 (Approval Workflow)
 * ============================================================
 * Couvre ApprovalWorkflowService (triggerIfNeeded/approve/reject)
 * et ApprovalWorkflowController (routes /admin/approvals/*).
 * Le timeout/auto-escalade (checkExpired + commande artisan
 * nsia:check-escalades) est couvert séparément dans
 * tests/Feature/EscaladeCheckTest.php.
 *
 * Lancer : php artisan test --filter ApprovalWorkflowTest
 * ============================================================
 */

use App\Models\ApprovalRequest;
use App\Models\Broker;
use App\Models\Certificate;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ApprovalWorkflowService;
use App\Services\CertificatePdfService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

beforeEach(function () {
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeAppr — pas de conflit avec les autres suites) ──

function makeApprTenant(): Tenant
{
    $tenant = Tenant::factory()->create();
    // Seede les 3 règles NN300 par défaut (pct du plein, plafond cumulé,
    // nombre de certificats) pour CE tenant — cf. ApprovalWorkflowSeeder.
    Artisan::call('db:seed', ['--class' => 'ApprovalWorkflowSeeder']);
    return $tenant;
}

function makeApprContract(Tenant $tenant, array $overrides = []): InsuranceContract
{
    $broker = Broker::create([
        'tenant_id'       => $tenant->id,
        'code'            => 'BRK-APR-' . Str::random(4),
        'name'            => 'Courtage Escalade',
        'type'            => Broker::TYPE_LOCAL,
        'country_code'    => 'CI',
        'commission_rate' => 5.0,
        'is_active'       => true,
    ]);

    return InsuranceContract::create(array_merge([
        'tenant_id'              => $tenant->id,
        'broker_id'               => $broker->id,
        'contract_number'         => 'CTR-APR-' . Str::random(6),
        'type'                    => 'OPEN_POLICY',
        'insured_name'            => 'Importateur Escalade SA',
        'currency_code'           => 'XOF',
        'subscription_limit'      => 1_000_000_000,
        'used_limit'              => 0,
        'plein'                   => 10_000_000,
        'escalade_enabled'        => true,
        'escalade_threshold_pct'  => null, // utilise le défaut de la règle (15%)
        'certificates_limit'      => null,
        'certificates_count'      => 0,
        'status'                  => 'ACTIVE',
        'effective_date'          => now()->subMonth(),
        'expiry_date'             => now()->addYear(),
        'requires_approval'       => false,
    ], $overrides));
}

function makeApprCertificate(Tenant $tenant, InsuranceContract $contract, array $overrides = []): Certificate
{
    return Certificate::create(array_merge([
        'tenant_id'          => $tenant->id,
        'contract_id'        => $contract->id,
        'certificate_number' => 'CERT-APR-' . Str::random(6),
        'policy_number'      => 'POL-APR-' . Str::random(6),
        'insured_name'       => 'Importateur Test Escalade',
        'voyage_from'        => 'Abidjan',
        'voyage_to'          => 'Lomé',
        'voyage_date'        => now()->addWeek(),
        'transport_type'     => 'SEA',
        'currency_code'      => 'XOF',
        'insured_value'      => 2_000_000,
        'prime_total'        => 20_000,
        'status'             => Certificate::STATUS_DRAFT,
    ], $overrides));
}

function makeApprAdminFiliale(Tenant $tenant): User
{
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

function makeApprSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

// Rôle qui possède les permissions workflow.approve/workflow.reject (cf.
// RolesAndPermissionsSeeder) mais qui n'est PAS un rôle d'étape valide
// (STEP_ROLES = admin_filiale|super_admin dans ApprovalWorkflowController) —
// utile aussi bien comme "soumetteur" neutre que comme cas de refus 403.
function makeApprSouscripteur(Tenant $tenant): User
{
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('souscripteur');
    return $user;
}

// ══════════════════════════════════════════════════════════════
// triggerIfNeeded() — déclenchement
// ══════════════════════════════════════════════════════════════

it('déclenche une escalade quand la valeur du certificat dépasse le seuil % du plein du contrat', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant); // plein = 10_000_000
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]); // 20% > 15%

    $triggered = app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);

    expect($triggered)->toBeTrue();

    $this->assertDatabaseHas('approval_requests', [
        'entity_type'  => 'CERTIFICATE',
        'entity_id'    => $certificate->id,
        'current_step' => 1,
        'total_steps'  => 2,
        'status'       => ApprovalRequest::STATUS_PENDING,
        'requested_by' => $submitter->id,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'action'      => 'escalade.triggered',
        'entity_type' => 'Certificate',
        'entity_id'   => $certificate->id,
        'user_id'     => $submitter->id,
    ]);
});

it('ne déclenche aucune escalade si la valeur du certificat est sous tous les seuils', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant); // plein = 10_000_000, subscription_limit = 1e9
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 1_000_000]); // 10% < 15%

    $triggered = app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);

    expect($triggered)->toBeFalse();
    $this->assertDatabaseMissing('approval_requests', ['entity_id' => $certificate->id]);
});

it('déclenche une escalade quand le plafond NN300 cumulé du contrat serait dépassé', function () {
    $tenant   = makeApprTenant();
    $contract = makeApprContract($tenant, [
        'plein'              => null, // désactive la règle % du plein
        'subscription_limit' => 1_000_000,
        'used_limit'         => 900_000,
    ]);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 200_000]); // 900k+200k > 1M

    $triggered = app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);

    expect($triggered)->toBeTrue();
    $this->assertDatabaseHas('approval_requests', [
        'entity_id'    => $certificate->id,
        'current_step' => 1,
    ]);
});

it('déclenche une escalade quand le contrat a atteint son nombre maximal de certificats', function () {
    $tenant   = makeApprTenant();
    $contract = makeApprContract($tenant, [
        'plein'              => null,
        'subscription_limit' => null,
        'certificates_limit' => 3,
        'certificates_count' => 3,
    ]);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 100_000]);

    $triggered = app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);

    expect($triggered)->toBeTrue();
});

it('ne déclenche rien si l’escalade est désactivée sur le contrat, même au-delà du seuil', function () {
    $tenant   = makeApprTenant();
    $contract = makeApprContract($tenant, ['escalade_enabled' => false]);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 5_000_000]); // 50% > 15%

    $triggered = app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);

    expect($triggered)->toBeFalse();
    $this->assertDatabaseMissing('approval_requests', ['entity_id' => $certificate->id]);
});

// ══════════════════════════════════════════════════════════════
// approve() — approbation d'une étape
// ══════════════════════════════════════════════════════════════

it('approve() à une étape non finale fait passer à l’étape suivante sans émettre le certificat', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    $service = app(ApprovalWorkflowService::class);
    $service->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $approver = makeApprAdminFiliale($tenant);
    $service->approve($request, $approver, 'RAS étape 1');

    $request->refresh();
    expect($request->status)->toBe(ApprovalRequest::STATUS_PENDING)
        ->and($request->current_step)->toBe(2);

    $this->assertDatabaseHas('approval_decisions', [
        'request_id'  => $request->id,
        'step_number' => 1,
        'approver_id' => $approver->id,
        'decision'    => 'APPROVED',
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'action'    => 'escalade.step_approved',
        'entity_id' => $certificate->id,
    ]);

    expect($certificate->fresh()->status)->toBe(Certificate::STATUS_DRAFT);
});

it('approve() à la dernière étape émet automatiquement le certificat (ISSUED)', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    $service = app(ApprovalWorkflowService::class);
    $service->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    // Étape 1 (admin_filiale)
    $service->approve($request, makeApprAdminFiliale($tenant), 'OK étape 1');
    expect($request->current_step)->toBe(2);

    // La génération PDF réelle (DomPDF + vues) est hors périmètre de ce test
    // unitaire — on isole ApprovalWorkflowService en mockant le service PDF.
    $this->mock(CertificatePdfService::class, function ($mock) {
        $mock->shouldReceive('generate')->once()->andReturn('certificates/FAKE/CERT-APR.pdf');
    });

    $superAdmin = makeApprSuperAdmin();
    $service->approve($request, $superAdmin, 'OK étape finale');

    $request->refresh();
    expect($request->status)->toBe(ApprovalRequest::STATUS_APPROVED)
        ->and((string) $request->resolved_by)->toBe((string) $superAdmin->id)
        ->and($request->resolved_at)->not->toBeNull();

    $certificate->refresh();
    expect($certificate->status)->toBe(Certificate::STATUS_ISSUED)
        ->and((string) $certificate->issued_by)->toBe((string) $superAdmin->id)
        ->and($certificate->issued_at)->not->toBeNull();

    $this->assertDatabaseHas('audit_logs', [
        'action'    => 'escalade.approved',
        'entity_id' => $certificate->id,
    ]);
});

// ══════════════════════════════════════════════════════════════
// reject() — rejet d'une étape
// ══════════════════════════════════════════════════════════════

it('reject() rejette le certificat et n’avance pas à l’étape suivante', function () {
    $tenant    = makeApprTenant();
    $contract  = makeApprContract($tenant);
    $creator   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, [
        'insured_value' => 2_000_000,
        'created_by'    => $creator->id,
    ]);

    $service = app(ApprovalWorkflowService::class);
    $service->triggerIfNeeded($certificate, $contract, $creator);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $approver = makeApprAdminFiliale($tenant);
    $service->reject($request, $approver, 'Documents manquants');

    $request->refresh();
    expect($request->status)->toBe(ApprovalRequest::STATUS_REJECTED)
        ->and($request->current_step)->toBe(1); // pas d'avancement d'étape

    $certificate->refresh();
    expect($certificate->status)->toBe(Certificate::STATUS_REJECTED)
        ->and($certificate->rejection_reason)->toContain('Documents manquants');

    $this->assertDatabaseHas('approval_decisions', [
        'request_id'  => $request->id,
        'decision'    => 'REJECTED',
        'approver_id' => $approver->id,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'action'    => 'escalade.rejected',
        'severity'  => 'WARNING',
        'entity_id' => $certificate->id,
    ]);

    $this->assertDatabaseHas('notifications', [
        'notifiable_id'   => $creator->id,
        'notifiable_type' => User::class,
        'type'            => 'EscaladeDecision',
    ]);
});

// ══════════════════════════════════════════════════════════════
// Routes HTTP — ApprovalWorkflowController
// ══════════════════════════════════════════════════════════════

it('un admin_filiale approuve via HTTP une escalade en étape 1 et passe à l’étape suivante', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $approver = makeApprAdminFiliale($tenant);

    $this->actingAs($approver)
        ->patch(route('admin.approvals.approve', $request), ['notes' => 'RAS'])
        ->assertRedirect(route('admin.approvals.index'));

    expect($request->fresh()->current_step)->toBe(2);
});

it('un admin_filiale rejette via HTTP une escalade — le certificat repasse en REJECTED', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $approver = makeApprAdminFiliale($tenant);

    $this->actingAs($approver)
        ->patch(route('admin.approvals.reject', $request), ['reason' => 'Pièces non conformes'])
        ->assertRedirect(route('admin.approvals.index'));

    expect($request->fresh()->status)->toBe(ApprovalRequest::STATUS_REJECTED);
    expect($certificate->fresh()->status)->toBe(Certificate::STATUS_REJECTED);
});

it('le motif est obligatoire pour rejeter via HTTP', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $approver = makeApprAdminFiliale($tenant);

    $this->actingAs($approver)
        ->patch(route('admin.approvals.reject', $request), ['reason' => ''])
        ->assertSessionHasErrors(['reason']);

    expect($request->fresh()->status)->toBe(ApprovalRequest::STATUS_PENDING);
});

// NB : le rôle "souscripteur" possède pourtant les permissions
// workflow.approve/workflow.reject (cf. RolesAndPermissionsSeeder) — mais
// ApprovalWorkflowController::authorizeApprover() n'autorise QUE le rôle
// configuré sur l'étape courante (STEP_ROLES = admin_filiale|super_admin),
// sans jamais vérifier ces permissions. Ce test reflète donc le
// comportement RÉEL (contrôle par rôle d'étape, pas par permission) — cf.
// app/Http/Controllers/Admin/ApprovalWorkflowController.php:392-407.
it('refuse (403) l’approbation par un utilisateur dont le rôle ne correspond pas à l’étape', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $wrongUser = makeApprSouscripteur($tenant);

    $this->actingAs($wrongUser)
        ->patch(route('admin.approvals.approve', $request), ['notes' => 'RAS'])
        ->assertStatus(403);

    expect($request->fresh()->current_step)->toBe(1);
});

it('refuse (403) le rejet par un utilisateur dont le rôle ne correspond pas à l’étape', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $wrongUser = makeApprSouscripteur($tenant);

    $this->actingAs($wrongUser)
        ->patch(route('admin.approvals.reject', $request), ['reason' => 'Test'])
        ->assertStatus(403);

    expect($request->fresh()->status)->toBe(ApprovalRequest::STATUS_PENDING);
});

it('un admin_filiale d’une autre filiale ne peut pas approuver', function () {
    $tenant      = makeApprTenant();
    $otherTenant = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $foreignAdmin = makeApprAdminFiliale($otherTenant);

    $this->actingAs($foreignAdmin)
        ->patch(route('admin.approvals.approve', $request), ['notes' => 'RAS'])
        ->assertStatus(403);
});

it('redirige vers /login si non authentifié pour approuver', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    app(ApprovalWorkflowService::class)->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $this->patch(route('admin.approvals.approve', $request), ['notes' => 'RAS'])
        ->assertRedirect('/login');
});

it('refuse (422) d’agir sur une escalade déjà résolue', function () {
    $tenant      = makeApprTenant();
    $contract    = makeApprContract($tenant);
    $submitter   = makeApprSouscripteur($tenant);
    $certificate = makeApprCertificate($tenant, $contract, ['insured_value' => 2_000_000]);

    $service = app(ApprovalWorkflowService::class);
    $service->triggerIfNeeded($certificate, $contract, $submitter);
    $request = ApprovalRequest::where('entity_id', $certificate->id)->firstOrFail();

    $approver = makeApprAdminFiliale($tenant);
    $service->reject($request, $approver, 'Rejet initial');

    $this->actingAs($approver)
        ->patch(route('admin.approvals.approve', $request), ['notes' => 'Trop tard'])
        ->assertStatus(422);
});
