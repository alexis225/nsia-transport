<?php

/**
 * ============================================================
 * Tests Pest — Module certificate_templates : Modèles de
 * certificats + positions d'impression sur souches pré-imprimées
 * ============================================================
 * Lancer : php artisan test --filter CertificateTemplateTest
 * ============================================================
 */

use App\Models\CertificatePrintTemplate;
use App\Models\CertificateTemplate;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CertificatePrePrintedService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeTpl — évite toute collision inter-fichiers) ─
function makeTplSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

function makeTplAdminFiliale(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

function makeTplTemplate(Tenant $tenant, array $overrides = []): CertificateTemplate
{
    return CertificateTemplate::create(array_merge([
        'tenant_id'    => $tenant->id,
        'name'         => 'Modèle Test',
        'code'         => strtoupper(Illuminate\Support\Str::random(6)),
        'type'         => CertificateTemplate::TYPE_CERTIFICAT_ASSURANCE,
        'company_name' => 'NSIA Test',
        'currency_code' => 'XOF',
        'is_active'    => true,
    ], $overrides));
}

function makeTplValidPayload(string $tenantId, array $overrides = []): array
{
    return array_merge([
        'tenant_id'     => $tenantId,
        'name'          => 'Ordre d\'assurance NSIA Test',
        'code'          => strtoupper(Illuminate\Support\Str::random(6)),
        'type'          => CertificateTemplate::TYPE_CERTIFICAT_ASSURANCE,
        'company_name'  => 'NSIA Test',
        'currency_code' => 'XOF',
        'number_padding' => 6,
    ], $overrides);
}

function makeTplCallPrintMethod(string $method, mixed ...$args): mixed
{
    $service = new CertificatePrePrintedService();
    $ref     = new ReflectionMethod($service, $method);
    $ref->setAccessible(true);
    return $ref->invoke($service, ...$args);
}

// ── Tests HTTP — accès / permissions (CertificateTemplateController) ─

it('redirige vers /login si non authentifié', function () {
    $this->get('/admin/certificate-templates')->assertRedirect('/login');
});

it('admin_filiale ne peut pas accéder aux modèles de certificats (rôle super_admin requis)', function () {
    $admin = makeTplAdminFiliale();

    $this->actingAs($admin)
        ->get('/admin/certificate-templates')
        ->assertStatus(403);
});

it('super_admin liste les modèles de certificats', function () {
    $superAdmin = makeTplSuperAdmin();
    $tenant     = Tenant::factory()->create();
    makeTplTemplate($tenant);

    $this->actingAs($superAdmin)
        ->get('/admin/certificate-templates')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/certificate-templates/index')
            ->has('templates')
            ->has('tenantsWithoutTemplate')
            ->has('types')
        );
});

it("super_admin garde accès même si le module certificate_templates est désactivé pour la filiale visée", function () {
    // EnsureModuleEnabled court-circuite systématiquement pour super_admin
    // (tenant_id null) — cf. app/Http/Middleware/EnsureModuleEnabled.php.
    $superAdmin = makeTplSuperAdmin();
    Tenant::factory()->create(['modules' => ['certificate_templates' => false]]);

    $this->actingAs($superAdmin)
        ->get('/admin/certificate-templates')
        ->assertStatus(200);
});

// ── Tests HTTP — création (store) ────────────────────────────────

it('super_admin peut créer un modèle de certificat pour une filiale', function () {
    $superAdmin = makeTplSuperAdmin();
    $tenant     = Tenant::factory()->create();

    $payload = makeTplValidPayload($tenant->id, ['code' => 'NEWCODE']);

    $response = $this->actingAs($superAdmin)->post('/admin/certificate-templates', $payload);

    $template = CertificateTemplate::where('code', 'NEWCODE')->firstOrFail();

    $response->assertRedirect(route('admin.certificate-templates.show', ['certificateTemplate' => $template->id]));

    $this->assertDatabaseHas('certificate_templates', [
        'tenant_id' => $tenant->id,
        'code'      => 'NEWCODE',
        'created_by' => $superAdmin->id,
    ]);
});

it('le code du modèle doit être unique (toutes filiales confondues)', function () {
    $superAdmin = makeTplSuperAdmin();
    $tenantA    = Tenant::factory()->create();
    $tenantB    = Tenant::factory()->create();

    makeTplTemplate($tenantA, ['code' => 'DUPCODE']);

    $payload = makeTplValidPayload($tenantB->id, ['code' => 'DUPCODE']);

    $this->actingAs($superAdmin)
        ->post('/admin/certificate-templates', $payload)
        ->assertSessionHasErrors(['code']);
});

it("une filiale ne peut avoir qu'un seul modèle actif (contrainte tenant_id unique)", function () {
    $superAdmin = makeTplSuperAdmin();
    $tenant     = Tenant::factory()->create();

    makeTplTemplate($tenant, ['code' => 'FIRSTCODE']);

    $payload = makeTplValidPayload($tenant->id, ['code' => 'SECONDCODE']);

    $this->actingAs($superAdmin)
        ->post('/admin/certificate-templates', $payload)
        ->assertSessionHasErrors(['tenant_id']);
});

it('le type du modèle doit être une valeur autorisée', function () {
    $superAdmin = makeTplSuperAdmin();
    $tenant     = Tenant::factory()->create();

    $payload = makeTplValidPayload($tenant->id, ['type' => 'type_inexistant']);

    $this->actingAs($superAdmin)
        ->post('/admin/certificate-templates', $payload)
        ->assertSessionHasErrors(['type']);
});

// ── Tests HTTP — modification / suppression ──────────────────────

it('super_admin peut modifier un modèle existant', function () {
    $superAdmin = makeTplSuperAdmin();
    $tenant     = Tenant::factory()->create();
    $template   = makeTplTemplate($tenant, ['code' => 'EDITME', 'name' => 'Ancien nom']);

    $payload = makeTplValidPayload($tenant->id, ['code' => 'EDITME', 'name' => 'Nouveau nom']);

    $this->actingAs($superAdmin)
        ->put("/admin/certificate-templates/{$template->id}", $payload)
        ->assertRedirect(route('admin.certificate-templates.index'));

    expect($template->fresh()->name)->toBe('Nouveau nom');
});

it('super_admin peut supprimer un modèle de certificat', function () {
    $superAdmin = makeTplSuperAdmin();
    $tenant     = Tenant::factory()->create();
    $template   = makeTplTemplate($tenant);

    $this->actingAs($superAdmin)
        ->delete("/admin/certificate-templates/{$template->id}")
        ->assertRedirect(route('admin.certificate-templates.index'));

    $this->assertSoftDeleted('certificate_templates', ['id' => $template->id]);
});

// ── Tests HTTP — logo ─────────────────────────────────────────────

it('super_admin peut uploader un logo pour un modèle de certificat', function () {
    Storage::fake('public');
    $superAdmin = makeTplSuperAdmin();
    $tenant     = Tenant::factory()->create();
    $template   = makeTplTemplate($tenant);

    $logo = UploadedFile::fake()->image('logo.png', 100, 100);

    $this->actingAs($superAdmin)
        ->post("/admin/certificate-templates/{$template->id}/logo", ['logo' => $logo])
        ->assertRedirect();

    $template->refresh();
    expect($template->logo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($template->logo_path);
});

it("l'upload du logo rejette un fichier qui n'est pas une image", function () {
    Storage::fake('public');
    $superAdmin = makeTplSuperAdmin();
    $tenant     = Tenant::factory()->create();
    $template   = makeTplTemplate($tenant);

    $notImage = UploadedFile::fake()->create('document.pdf', 20, 'application/pdf');

    $this->actingAs($superAdmin)
        ->post("/admin/certificate-templates/{$template->id}/logo", ['logo' => $notImage])
        ->assertSessionHasErrors(['logo']);

    expect($template->fresh()->logo_path)->toBeNull();
});

/**
 * ⚠️ BUG SUSPECTÉ — app/Http/Controllers/Admin/CertificateTemplateController.php
 * La route DELETE /admin/certificate-templates/{certificateTemplate}/logo
 * (routes/web.php ligne 398, name: admin.certificate-templates.logo.remove)
 * pointe vers l'action `removeLogo`, qui n'existe PAS dans
 * CertificateTemplateController (seule `updateLogo` y est définie). Ce test
 * documente le comportement CORRECT attendu — par analogie avec
 * TenantController::removeLogo() (app/Http/Controllers/Admin/TenantController.php
 * ligne 283) qui suit exactement ce pattern (delete du fichier si présent,
 * logo_path => null, back()->with('status', 'Logo supprimé.')) — et échouera
 * tant que la méthode manquante n'est pas ajoutée au contrôleur.
 */
it('super_admin peut supprimer le logo d\'un modèle de certificat', function () {
    Storage::fake('public');
    $superAdmin = makeTplSuperAdmin();
    $tenant     = Tenant::factory()->create();
    $template   = makeTplTemplate($tenant, ['logo_path' => 'logos/certificates/existing.png']);
    Storage::disk('public')->put($template->logo_path, 'contenu-test');

    $this->actingAs($superAdmin)
        ->delete("/admin/certificate-templates/{$template->id}/logo")
        ->assertRedirect();

    expect($template->fresh()->logo_path)->toBeNull();
    Storage::disk('public')->assertMissing('logos/certificates/existing.png');
});

// ── Tests HTTP — CertificatePrintTemplateController ───────────────

it("super_admin consulte l'index des positions d'impression", function () {
    $superAdmin = makeTplSuperAdmin();

    $this->actingAs($superAdmin)
        ->get('/admin/certificate-print-templates')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/certificates/print-positions/index')
            ->has('overrides')
        );
});

it('admin_filiale ne peut pas accéder aux positions d\'impression', function () {
    $admin = makeTplAdminFiliale();

    $this->actingAs($admin)
        ->get('/admin/certificate-print-templates')
        ->assertStatus(403);
});

it('super_admin peut enregistrer les positions JSON d\'un modèle de carnet', function () {
    $superAdmin = makeTplSuperAdmin();

    $positions = [
        ['key' => 'certificate_number', 'top' => 12.5, 'left' => 20.0, 'width' => 30, 'fontSize' => 9, 'align' => 'left', 'bold' => false],
    ];

    $this->actingAs($superAdmin)
        ->post('/admin/certificate-print-templates/test_template', [
            'positions' => json_encode($positions),
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'Positions mises à jour.');

    $record = CertificatePrintTemplate::where('template_id', 'test_template')->firstOrFail();
    expect($record->positions[0]['key'])->toBe('certificate_number')
        ->and((string) $record->updated_by)->toBe((string) $superAdmin->id);
});

it('un JSON de positions invalide est rejeté', function () {
    $superAdmin = makeTplSuperAdmin();

    $this->actingAs($superAdmin)
        ->post('/admin/certificate-print-templates/test_template_invalid', [
            'positions' => 'ceci-nest-pas-du-json',
        ])
        ->assertSessionHasErrors(['positions']);

    $this->assertDatabaseMissing('certificate_print_templates', ['template_id' => 'test_template_invalid']);
});

it('super_admin peut réinitialiser (supprimer) la surcharge de positions d\'un modèle', function () {
    $superAdmin = makeTplSuperAdmin();
    CertificatePrintTemplate::create([
        'template_id' => 'test_reset',
        'positions'   => [['key' => 'foo', 'top' => 1, 'left' => 1]],
        'updated_by'  => $superAdmin->id,
    ]);

    $this->actingAs($superAdmin)
        ->delete('/admin/certificate-print-templates/test_reset')
        ->assertRedirect()
        ->assertSessionHas('status', 'Positions réinitialisées aux valeurs par défaut.');

    $this->assertDatabaseMissing('certificate_print_templates', ['template_id' => 'test_reset']);
});

// ── Tests unitaires purs — CertificatePrePrintedService (réflexion) ─

it('normalizeOverride convertit le format JSON édité (liste) en format interne indexé par clé', function () {
    $result = makeTplCallPrintMethod('normalizeOverride', [
        ['key' => 'certificate_number', 'top' => 10.5, 'left' => 20, 'width' => 30, 'fontSize' => 9, 'align' => 'center', 'bold' => true],
        ['key' => '', 'top' => 5, 'left' => 5], // clé vide → ignoré
    ]);

    expect($result)->toBe([
        'certificate_number' => [
            'top' => 10.5, 'left' => 20.0, 'width' => 30.0, 'fontSize' => 9.0, 'align' => 'center', 'bold' => true,
        ],
    ]);
});

it('normalizeOverride applique des valeurs par défaut pour les champs optionnels absents', function () {
    $result = makeTplCallPrintMethod('normalizeOverride', [
        ['key' => 'issue_date', 'top' => 1, 'left' => 2],
    ]);

    expect($result)->toBe([
        'issue_date' => [
            'top' => 1.0, 'left' => 2.0, 'width' => null, 'fontSize' => null, 'align' => 'left', 'bold' => false,
        ],
    ]);
});

it('applyOffset décale toutes les positions d\'un layout du même offsetX/offsetY', function () {
    $layout = [
        'a' => ['top' => 10.0, 'left' => 20.0],
        'b' => ['top' => 0.0, 'left' => 0.0],
    ];

    $result = makeTplCallPrintMethod('applyOffset', $layout, 5.0, -2.0);

    expect($result['a']['top'])->toBe(8.0)
        ->and($result['a']['left'])->toBe(25.0)
        ->and($result['b']['top'])->toBe(-2.0)
        ->and($result['b']['left'])->toBe(5.0);
});

it('resolveLayout retourne la configuration codée en dur quand aucune surcharge n\'existe en base', function () {
    $result = makeTplCallPrintMethod('resolveLayout', 'togo');

    expect($result)->not->toBeNull()
        ->and($result['policy_number']['top'])->toBe(57.8)
        ->and($result['policy_number']['left'])->toBe(154.6);
});

it("resolveLayout privilégie la surcharge enregistrée en base sur la configuration codée en dur", function () {
    CertificatePrintTemplate::create([
        'template_id' => 'test_override_priority',
        'positions'   => [['key' => 'policy_number', 'top' => 1.0, 'left' => 2.0]],
    ]);

    $result = makeTplCallPrintMethod('resolveLayout', 'test_override_priority');

    expect($result)->toBe([
        'policy_number' => [
            'top' => 1.0, 'left' => 2.0, 'width' => null, 'fontSize' => null, 'align' => 'left', 'bold' => false,
        ],
    ]);
});

it('resolveLayout retourne null pour un template_id inconnu sans surcharge', function () {
    $result = makeTplCallPrintMethod('resolveLayout', 'template_totalement_inconnu');

    expect($result)->toBeNull();
});
