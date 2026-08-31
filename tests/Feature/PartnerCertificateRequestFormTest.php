<?php

/**
 * ============================================================
 * Tests Pest — Accès partenaire au formulaire de demande de
 * certificat + à sa liste de demandes (Module 1, rapport DTAG).
 * ============================================================
 * Lancer : php artisan test --filter PartnerCertificateRequestFormTest
 * ============================================================
 */

use App\Models\Broker;
use App\Models\CertificateRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

beforeEach(function () {
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

function makePartnerFormTenant(): Tenant
{
    return Tenant::factory()->create();
}

function makePartnerFormUser(Tenant $tenant, string $role = 'courtier_local'): array
{
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole($role);

    $broker = Broker::create([
        'tenant_id'       => $tenant->id,
        'user_id'         => $user->id,
        'code'            => 'BRK-PF-' . Str::random(6),
        'name'            => 'Courtier Formulaire Test',
        'type'            => Broker::TYPE_LOCAL,
        'country_code'    => 'CI',
        'commission_rate' => 5.00,
        'is_active'       => true,
    ]);

    return compact('user', 'broker');
}

it("un partenaire connecté (courtier_local) accède au formulaire de nouvelle demande", function () {
    $tenant = makePartnerFormTenant();
    ['user' => $partner] = makePartnerFormUser($tenant);

    $this->actingAs($partner)
        ->get(route('partner.certificate-requests.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('partner/certificate-requests/create'));
});

it("un partenaire connecté (partenaire_etranger) accède aussi au formulaire", function () {
    $tenant = makePartnerFormTenant();
    ['user' => $partner] = makePartnerFormUser($tenant, 'partenaire_etranger');

    $this->actingAs($partner)
        ->get(route('partner.certificate-requests.create'))
        ->assertOk();
});

it("un partenaire peut soumettre une demande de certificat avec pièces jointes", function () {
    Storage::fake('local');

    $tenant = makePartnerFormTenant();
    ['user' => $partner, 'broker' => $broker] = makePartnerFormUser($tenant);

    $this->actingAs($partner)
        ->post(route('partner.certificate-requests.store'), [
            'insured_name'      => 'SOTRACI',
            'voyage_from'       => 'Abidjan',
            'voyage_to'         => 'Le Havre',
            'voyage_date'       => now()->addDays(10)->toDateString(),
            'transport_type'    => 'SEA',
            'cargo_description' => 'Véhicules neufs',
            'estimated_value'   => 25_000_000,
            'currency_code'     => 'XOF',
            'notes'             => 'Départ imminent.',
            'documents'         => [UploadedFile::fake()->create('facture.pdf', 100, 'application/pdf')],
            'document_types'    => ['FACTURE'],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('certificate_requests', [
        'tenant_id'    => $tenant->id,
        'broker_id'    => $broker->id,
        'created_by'   => $partner->id,
        'insured_name' => 'SOTRACI',
        'status'       => CertificateRequest::STATUS_PENDING,
    ]);

    $req = CertificateRequest::where('insured_name', 'SOTRACI')->firstOrFail();
    expect($req->documents()->count())->toBe(1);
});

it("la demande soumise sans aucune pièce jointe est refusée", function () {
    $tenant = makePartnerFormTenant();
    ['user' => $partner] = makePartnerFormUser($tenant);

    $this->actingAs($partner)
        ->post(route('partner.certificate-requests.store'), [
            'insured_name' => 'SOTRACI',
        ])
        ->assertSessionHasErrors(['documents']);
});

it("un partenaire voit sa liste de demandes et uniquement les siennes", function () {
    $tenant = makePartnerFormTenant();
    ['user' => $partnerA, 'broker' => $brokerA] = makePartnerFormUser($tenant);
    ['broker' => $brokerB] = makePartnerFormUser($tenant);

    CertificateRequest::create([
        'tenant_id' => $tenant->id, 'broker_id' => $brokerA->id, 'created_by' => $partnerA->id,
        'insured_name' => 'DEMANDE A', 'status' => CertificateRequest::STATUS_PENDING,
    ]);
    CertificateRequest::create([
        'tenant_id' => $tenant->id, 'broker_id' => $brokerB->id, 'created_by' => $partnerA->id,
        'insured_name' => 'DEMANDE B (autre courtier)', 'status' => CertificateRequest::STATUS_PENDING,
    ]);

    $this->actingAs($partnerA)
        ->get(route('partner.certificate-requests.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('partner/certificate-requests/index')
            ->where('certificateRequests.total', 1)
        );
});

it("un partenaire ne peut pas consulter la demande d'un autre courtier", function () {
    $tenant = makePartnerFormTenant();
    ['user' => $partnerA] = makePartnerFormUser($tenant);
    ['broker' => $brokerB] = makePartnerFormUser($tenant);

    $req = CertificateRequest::create([
        'tenant_id' => $tenant->id, 'broker_id' => $brokerB->id, 'created_by' => $partnerA->id,
        'insured_name' => 'DEMANDE B', 'status' => CertificateRequest::STATUS_PENDING,
    ]);

    $this->actingAs($partnerA)
        ->get(route('partner.certificate-requests.show', $req))
        ->assertStatus(403);
});

it("un utilisateur non-partenaire (souscripteur) n'accède pas à l'espace partenaire", function () {
    $tenant = makePartnerFormTenant();
    $staff = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $staff->assignRole('souscripteur');

    $this->actingAs($staff)
        ->get(route('partner.certificate-requests.create'))
        ->assertStatus(403);
});

it("un visiteur non authentifié est redirigé vers /login", function () {
    $this->get(route('partner.certificate-requests.index'))->assertRedirect('/login');
    $this->get(route('partner.certificate-requests.create'))->assertRedirect('/login');
});
