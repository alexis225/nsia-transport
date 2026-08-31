<?php

/**
 * ============================================================
 * Tests Pest — Module 1 : Demande de certificats d'assurance
 * ============================================================
 * Workflow complet issu du rapport DTAG du 14/08/2026 :
 * DRAFT (Brouillon) → PENDING (Transmise) → IN_REVIEW (En cours
 *   d'analyse) → INFO_REQUESTED (Complément demandé) → [partenaire
 *     complète → COMPLETED (Complétée)] → APPROVED (Validée)
 *   → FULFILLED (Certificat émis) → CLOSED (Clôturée)
 * REJECTED (Rejetée) — terminal.
 * Lancer : php artisan test --filter CertificateRequestWorkflowTest
 * ============================================================
 */

use App\Models\Broker;
use App\Models\Certificate;
use App\Models\CertificateRequest;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;

beforeEach(function () {
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers ──────────────────────────────────────────────────
function makeCertReqTenant(): Tenant
{
    return Tenant::factory()->create();
}

function makeCertReqStaff(Tenant $tenant, string $role = 'souscripteur'): User
{
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole($role);
    return $user;
}

function makeCertReqPartner(Tenant $tenant): array
{
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('courtier_local');

    $broker = Broker::create([
        'tenant_id'       => $tenant->id,
        'user_id'         => $user->id,
        'code'            => 'BRK-' . Str::random(6),
        'name'            => 'Courtier Test',
        'type'            => Broker::TYPE_LOCAL,
        'country_code'    => 'CI',
        'commission_rate' => 5.00,
        'is_active'       => true,
    ]);

    return compact('user', 'broker');
}

function makeCertReqRequest(Tenant $tenant, Broker $broker, User $creator, array $overrides = []): CertificateRequest
{
    return CertificateRequest::create(array_merge([
        'tenant_id'    => $tenant->id,
        'broker_id'    => $broker->id,
        'created_by'   => $creator->id,
        'insured_name' => 'IVOIRE LOGISTIQUE',
        'voyage_from'  => 'Abidjan',
        'voyage_to'    => 'Le Havre',
        'status'       => CertificateRequest::STATUS_PENDING,
    ], $overrides));
}

function makeCertReqIssuedCertificate(Tenant $tenant): Certificate
{
    $broker = Broker::create([
        'tenant_id' => $tenant->id, 'code' => 'BRK-CERT-' . Str::random(4),
        'name' => 'Courtier Cert', 'type' => Broker::TYPE_LOCAL,
        'country_code' => 'CI', 'commission_rate' => 5.0, 'is_active' => true,
    ]);

    $contract = InsuranceContract::create([
        'tenant_id' => $tenant->id, 'broker_id' => $broker->id,
        'contract_number' => 'CTR-CERTREQ-' . Str::random(6),
        'type' => 'VOYAGE', 'insured_name' => 'IVOIRE LOGISTIQUE',
        'currency_code' => 'XOF', 'subscription_limit' => 100_000_000, 'used_limit' => 0,
        'status' => 'ACTIVE', 'effective_date' => now()->subMonth(), 'expiry_date' => now()->addYear(),
        'requires_approval' => false,
    ]);

    return Certificate::withoutEvents(fn () => Certificate::create([
        'tenant_id' => $tenant->id, 'contract_id' => $contract->id,
        'certificate_number' => 'CERT-CR-' . Str::random(6), 'policy_number' => 'POL-CR-' . Str::random(6),
        'insured_name' => 'IVOIRE LOGISTIQUE', 'voyage_from' => 'Abidjan', 'voyage_to' => 'Le Havre',
        'voyage_date' => now()->addWeek(), 'transport_type' => 'SEA', 'currency_code' => 'XOF',
        'insured_value' => 5_000_000, 'prime_total' => 50_000, 'status' => 'ISSUED', 'issued_at' => now(),
    ]));
}

// ── Tests ─────────────────────────────────────────────────────

it('un souscripteur peut prendre en charge une demande transmise', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner);

    $this->actingAs($staff)
        ->patch(route('admin.certificate-requests.assign', $req))
        ->assertRedirect();

    expect($req->fresh()->status)->toBe(CertificateRequest::STATUS_IN_REVIEW)
        ->and($req->fresh()->assigned_to)->toBe($staff->id);
});

it('le souscripteur peut demander un complément — la demande passe en INFO_REQUESTED', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_IN_REVIEW, 'assigned_to' => $staff->id]);

    $this->actingAs($staff)
        ->patch(route('admin.certificate-requests.request-info', $req), [
            'info_request_notes' => 'Merci de joindre la facture commerciale et le connaissement définitif.',
        ])
        ->assertRedirect();

    $req->refresh();
    expect($req->status)->toBe(CertificateRequest::STATUS_INFO_REQUESTED)
        ->and($req->info_requested_at)->not->toBeNull()
        ->and($req->info_request_notes)->toBe('Merci de joindre la facture commerciale et le connaissement définitif.');
});

it("le partenaire complète son dossier et la demande passe en COMPLETED (cas n°2 du rapport)", function () {
    $tenant = makeCertReqTenant();
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, [
        'status'             => CertificateRequest::STATUS_INFO_REQUESTED,
        'info_requested_at'  => now(),
        'info_request_notes' => 'Facture manquante.',
    ]);

    $this->actingAs($partner)
        ->post(route('partner.certificate-requests.complete', $req), [
            'completion_notes' => 'Facture jointe.',
        ])
        ->assertRedirect();

    $req->refresh();
    expect($req->status)->toBe(CertificateRequest::STATUS_COMPLETED)
        ->and($req->completed_at)->not->toBeNull()
        ->and($req->completion_notes)->toBe('Facture jointe.');
});

it('le souscripteur peut valider une demande COMPLETED', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_COMPLETED]);

    $this->actingAs($staff)
        ->patch(route('admin.certificate-requests.approve', $req), ['review_notes' => 'Dossier conforme après complément.'])
        ->assertRedirect();

    expect($req->fresh()->status)->toBe(CertificateRequest::STATUS_APPROVED);
});

it('une demande brouillon transmise reçoit une référence unique et devient PENDING', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_DRAFT, 'reference' => null]);

    \App\Models\CertificateRequestDocument::create([
        'certificate_request_id' => $req->id,
        'file_path'              => 'certificate-requests/x/y.pdf',
        'file_original_name'     => 'y.pdf',
        'file_mime_type'         => 'application/pdf',
        'file_size'              => 100,
        'document_type'          => 'AUTRE',
        'uploaded_by'            => $partner->id,
    ]);

    $this->actingAs($partner)
        ->post(route('partner.certificate-requests.submit', $req))
        ->assertRedirect();

    $req->refresh();
    expect($req->status)->toBe(CertificateRequest::STATUS_PENDING)
        ->and($req->reference)->not->toBeNull()
        ->and($req->reference)->toStartWith('DEM-')
        ->and($req->submitted_at)->not->toBeNull();
});

it('refuse de transmettre un brouillon sans aucune pièce jointe', function () {
    $tenant = makeCertReqTenant();
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_DRAFT, 'reference' => null]);

    $this->actingAs($partner)
        ->post(route('partner.certificate-requests.submit', $req))
        ->assertStatus(422);

    expect($req->fresh()->status)->toBe(CertificateRequest::STATUS_DRAFT);
});

it('les brouillons sont invisibles dans la file du staff', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_DRAFT, 'reference' => null, 'insured_name' => 'DRAFT ONLY']);

    $response = $this->actingAs($staff)->get(route('admin.certificate-requests.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('certificateRequests.data', fn ($data) => collect($data)->pluck('insured_name')->doesntContain('DRAFT ONLY')));
});

it('un partenaire ne peut pas compléter une demande qui ne le concerne pas', function () {
    $tenant = makeCertReqTenant();
    ['broker' => $broker] = makeCertReqPartner($tenant);
    ['user' => $otherPartner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $otherPartner, ['status' => CertificateRequest::STATUS_INFO_REQUESTED]);

    $this->actingAs($otherPartner)
        ->post(route('partner.certificate-requests.complete', $req), ['completion_notes' => 'x'])
        ->assertStatus(403);
});

it('refuse de demander un complément sur une demande déjà validée', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_APPROVED]);

    $this->actingAs($staff)
        ->patch(route('admin.certificate-requests.request-info', $req), ['info_request_notes' => 'x'])
        ->assertStatus(422);
});

it('valider une demande la fait passer en APPROVED', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_IN_REVIEW]);

    $this->actingAs($staff)
        ->patch(route('admin.certificate-requests.approve', $req), ['review_notes' => 'Dossier conforme.'])
        ->assertRedirect();

    expect($req->fresh()->status)->toBe(CertificateRequest::STATUS_APPROVED);
});

it('rattacher un certificat émis fait passer la demande en FULFILLED (Certificat émis)', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_APPROVED]);
    $cert = makeCertReqIssuedCertificate($tenant);

    $this->actingAs($staff)
        ->patch(route('admin.certificate-requests.link-certificate', $req), ['certificate_id' => $cert->id])
        ->assertRedirect();

    $req->refresh();
    expect($req->status)->toBe(CertificateRequest::STATUS_FULFILLED)
        ->and($req->certificate_id)->toBe($cert->id);
});

it('clôturer une demande FULFILLED la fait passer en CLOSED', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $cert = makeCertReqIssuedCertificate($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, [
        'status' => CertificateRequest::STATUS_FULFILLED,
        'certificate_id' => $cert->id,
    ]);

    $this->actingAs($staff)
        ->patch(route('admin.certificate-requests.close', $req))
        ->assertRedirect();

    $req->refresh();
    expect($req->status)->toBe(CertificateRequest::STATUS_CLOSED)
        ->and($req->closed_at)->not->toBeNull();
});

it('refuse de clôturer une demande dont le certificat n\'a pas encore été émis', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_APPROVED]);

    $this->actingAs($staff)
        ->patch(route('admin.certificate-requests.close', $req))
        ->assertStatus(422);
});

it('rejeter une demande depuis INFO_REQUESTED est autorisé', function () {
    $tenant = makeCertReqTenant();
    $staff = makeCertReqStaff($tenant);
    ['broker' => $broker, 'user' => $partner] = makeCertReqPartner($tenant);
    $req = makeCertReqRequest($tenant, $broker, $partner, ['status' => CertificateRequest::STATUS_INFO_REQUESTED]);

    $this->actingAs($staff)
        ->patch(route('admin.certificate-requests.reject', $req), ['review_notes' => 'Dossier non recevable.'])
        ->assertRedirect();

    expect($req->fresh()->status)->toBe(CertificateRequest::STATUS_REJECTED);
});
