<?php

/**
 * ============================================================
 * Tests Pest — Module GUCE : Certificats GUCE (import + OCR)
 * ============================================================
 * Lancer : php artisan test --filter GuceCertificateTest
 * ============================================================
 */

use App\Models\GuceCertificate;
use App\Models\Tenant;
use App\Models\User;
use App\Services\GuceExtractionService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeGuce — évite toute collision inter-fichiers) ─
function makeGuceAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');

    return $user;
}

function makeGuceSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');

    return $user;
}

function makeGuceCourtier(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('courtier_local');

    return $user;
}

function makeGuceCertificateRecord(Tenant $tenant, User $importedBy, array $overrides = []): GuceCertificate
{
    return GuceCertificate::create(array_merge([
        'tenant_id' => $tenant->id,
        'imported_by' => $importedBy->id,
        'guce_reference' => 'INS-'.uniqid(),
        'certificate_number' => 'CERT-'.uniqid(),
        'insured_name' => 'Importateur Test',
        'currency' => 'XOF',
        'file_path' => 'guce-certificates/'.uniqid().'.pdf',
        'file_original_name' => 'certificat.pdf',
        'file_mime_type' => 'application/pdf',
    ], $overrides));
}

function makeGuceCallMethod(string $method, mixed ...$args): mixed
{
    $service = new GuceExtractionService;
    $ref = new ReflectionMethod($service, $method);
    $ref->setAccessible(true);

    return $ref->invoke($service, ...$args);
}

// ── Tests HTTP — accès / permissions ───────────────────────────

it('redirige vers /login si non authentifié', function () {
    $this->get('/admin/guce-certificates')->assertRedirect('/login');
});

it('un compte purement courtier (non staff) est redirigé vers son espace partenaire', function () {
    $courtier = makeGuceCourtier();

    $this->actingAs($courtier)
        ->get('/admin/guce-certificates')
        ->assertRedirect(route('partner.dashboard'));
});

it('admin_filiale liste les certificats GUCE de sa filiale', function () {
    $admin = makeGuceAdmin();

    $this->actingAs($admin)
        ->get('/admin/guce-certificates')
        ->assertStatus(200);
});

it('le module désactivé pour la filiale bloque l\'accès avec 403', function () {
    $tenant = Tenant::factory()->create(['modules' => ['guce_certificates' => false]]);
    $admin = makeGuceAdmin($tenant->id);

    $this->actingAs($admin)
        ->get('/admin/guce-certificates')
        ->assertStatus(403);
});

// ── Tests HTTP — import (store) ─────────────────────────────────

it('admin_filiale peut importer un certificat GUCE avec un fichier', function () {
    Storage::fake('private');
    $admin = makeGuceAdmin();
    $file = UploadedFile::fake()->create('certificat.pdf', 100, 'application/pdf');

    $this->actingAs($admin)
        ->post('/admin/guce-certificates', [
            'guce_reference' => 'INS2026-UNIQUE-001',
            'certificate_number' => 'CERT-GUCE-001',
            'insured_name' => 'Importateur Test',
            'file' => $file,
        ])
        ->assertRedirect(route('admin.guce-certificates.index'));

    $this->assertDatabaseHas('guce_certificates', [
        'guce_reference' => 'INS2026-UNIQUE-001',
        'certificate_number' => 'CERT-GUCE-001',
        'tenant_id' => $admin->tenant_id,
        'imported_by' => $admin->id,
        'currency' => 'XOF',
    ]);

    $cert = GuceCertificate::where('guce_reference', 'INS2026-UNIQUE-001')->firstOrFail();
    Storage::disk('private')->assertExists($cert->file_path);
});

it('le fichier est obligatoire pour importer un certificat GUCE', function () {
    $admin = makeGuceAdmin();

    $this->actingAs($admin)
        ->post('/admin/guce-certificates', [
            'guce_reference' => 'INS-NOFILE-001',
            'certificate_number' => 'CERT-NOFILE-001',
            'insured_name' => 'Test',
        ])
        ->assertSessionHasErrors(['file']);

    $this->assertDatabaseMissing('guce_certificates', ['guce_reference' => 'INS-NOFILE-001']);
});

it('la référence GUCE doit être unique', function () {
    $admin = makeGuceAdmin();
    makeGuceCertificateRecord($admin->tenant, $admin, ['guce_reference' => 'INS-DUP-001']);

    $file = UploadedFile::fake()->create('certificat.pdf', 50, 'application/pdf');

    $this->actingAs($admin)
        ->post('/admin/guce-certificates', [
            'guce_reference' => 'INS-DUP-001',
            'certificate_number' => 'CERT-DUP-002',
            'insured_name' => 'Test',
            'file' => $file,
        ])
        ->assertSessionHasErrors(['guce_reference']);
});

// ── Tests HTTP — isolation tenant (show/download/destroy) ───────

it("admin_filiale ne peut pas consulter un certificat GUCE d'une autre filiale", function () {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();
    $adminA = makeGuceAdmin($tenantA->id);
    $adminB = makeGuceAdmin($tenantB->id);

    $cert = makeGuceCertificateRecord($tenantB, $adminB);

    $this->actingAs($adminA)
        ->get("/admin/guce-certificates/{$cert->id}")
        ->assertStatus(403);
});

it("super_admin peut consulter un certificat GUCE de n'importe quelle filiale", function () {
    $tenant = Tenant::factory()->create();
    $importer = makeGuceAdmin($tenant->id);
    $superAdmin = makeGuceSuperAdmin();

    $cert = makeGuceCertificateRecord($tenant, $importer);

    $this->actingAs($superAdmin)
        ->get("/admin/guce-certificates/{$cert->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('admin/guce-certificates/show'));
});

it('le téléchargement retourne 404 si le fichier physique est absent', function () {
    Storage::fake('private');
    $admin = makeGuceAdmin();
    $cert = makeGuceCertificateRecord($admin->tenant, $admin, [
        'file_path' => 'guce-certificates/introuvable.pdf',
    ]);

    $this->actingAs($admin)
        ->get("/admin/guce-certificates/{$cert->id}/download")
        ->assertStatus(404);
});

it('admin_filiale peut supprimer un certificat GUCE de sa propre filiale', function () {
    Storage::fake('private');
    $admin = makeGuceAdmin();
    $cert = makeGuceCertificateRecord($admin->tenant, $admin);
    Storage::disk('private')->put($cert->file_path, 'contenu-test');

    $this->actingAs($admin)
        ->delete("/admin/guce-certificates/{$cert->id}")
        ->assertRedirect(route('admin.guce-certificates.index'));

    $this->assertSoftDeleted('guce_certificates', ['id' => $cert->id]);
    Storage::disk('private')->assertMissing($cert->file_path);
});

it("admin_filiale ne peut pas supprimer un certificat GUCE d'une autre filiale", function () {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();
    $adminA = makeGuceAdmin($tenantA->id);
    $adminB = makeGuceAdmin($tenantB->id);

    $cert = makeGuceCertificateRecord($tenantB, $adminB);

    $this->actingAs($adminA)
        ->delete("/admin/guce-certificates/{$cert->id}")
        ->assertStatus(403);

    $this->assertDatabaseHas('guce_certificates', ['id' => $cert->id, 'deleted_at' => null]);
});

// ── Tests unitaires purs — GuceExtractionService::normalizeDate ─

it('normalizeDate conserve un format ISO déjà correct', function () {
    expect(makeGuceCallMethod('normalizeDate', '2026-02-18'))->toBe('2026-02-18');
});

it('normalizeDate convertit un format avec séparateur slash (d/m/Y)', function () {
    expect(makeGuceCallMethod('normalizeDate', '18/02/2026'))->toBe('2026-02-18');
});

it('normalizeDate convertit un format avec séparateur tiret (d-m-Y)', function () {
    expect(makeGuceCallMethod('normalizeDate', '18-02-2026'))->toBe('2026-02-18');
});

it('normalizeDate convertit un format avec séparateur point (d.m.Y)', function () {
    expect(makeGuceCallMethod('normalizeDate', '18.02.2026'))->toBe('2026-02-18');
});

it('normalizeDate retourne null pour une valeur vide ou nulle', function () {
    expect(makeGuceCallMethod('normalizeDate', null))->toBeNull()
        ->and(makeGuceCallMethod('normalizeDate', ''))->toBeNull()
        ->and(makeGuceCallMethod('normalizeDate', '   '))->toBeNull();
});

it('normalizeDate retourne null (sans exception) pour une valeur non parsable', function () {
    expect(makeGuceCallMethod('normalizeDate', 'nondispo'))->toBeNull();
});

// ── Tests unitaires purs — GuceExtractionService::normalizeNumber ─

it('normalizeNumber gère une virgule décimale simple', function () {
    expect(makeGuceCallMethod('normalizeNumber', '1251283,50'))->toBe('1251283.50');
});

it('normalizeNumber gère les milliers en point + décimale en virgule', function () {
    expect(makeGuceCallMethod('normalizeNumber', '1.251.283,50'))->toBe('1251283.50');
});

it('normalizeNumber gère les milliers en virgule + décimale en point', function () {
    expect(makeGuceCallMethod('normalizeNumber', '1,251,283.50'))->toBe('1251283.50');
});

it('normalizeNumber nettoie un symbole de devise et des espaces', function () {
    expect(makeGuceCallMethod('normalizeNumber', '1 251 283,50 XOF'))->toBe('1251283.50');
});

it('normalizeNumber retourne null pour une valeur vide ou non numérique', function () {
    expect(makeGuceCallMethod('normalizeNumber', null))->toBeNull()
        ->and(makeGuceCallMethod('normalizeNumber', ''))->toBeNull()
        ->and(makeGuceCallMethod('normalizeNumber', 'abc'))->toBeNull();
});

// ── Test unitaire — extract() sans configuration Mindee ──────────

it('extract() lève une RuntimeException si Mindee n\'est pas configuré', function () {
    config(['services.mindee.api_key' => null, 'services.mindee.model_id' => null]);

    $service = app(GuceExtractionService::class);

    expect(fn () => $service->extract('/chemin/inexistant.pdf'))
        ->toThrow(RuntimeException::class);
});
