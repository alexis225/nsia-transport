<?php

/**
 * ============================================================
 * Tests Pest — Module exports : AsyncExportController / Job
 * ============================================================
 * Lancer : php artisan test --filter AsyncExportTest
 * ============================================================
 */

use App\Jobs\AsyncCertificateExportJob;
use App\Models\ReportExecution;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeExp — module exports) ────────────────────

function makeExpUser(?string $role = 'admin_filiale', ?string $tenantId = null): User
{
    $tenant = ($role === 'super_admin')
        ? null
        : ($tenantId ?? Tenant::factory()->create()->id);

    $user = User::factory()->create([
        'tenant_id' => $tenant,
        'is_active' => true,
    ]);

    if ($role) {
        $user->assignRole($role);
    }

    return $user;
}

function makeExpExecution(User $user, array $overrides = []): ReportExecution
{
    return ReportExecution::create(array_merge([
        'tenant_id'    => $user->tenant_id,
        'requested_by' => $user->id,
        'format'       => 'CSV',
        'status'       => ReportExecution::STATUS_QUEUED,
        'parameters'   => [],
    ], $overrides));
}

// ── Non authentifié ────────────────────────────────────────────────

it('redirige vers login si non authentifié (index exports)', function () {
    $this->get('/admin/exports')->assertRedirect('/login');
});

it('redirige vers login si non authentifié (dispatch export)', function () {
    $this->post('/admin/exports/certificates')->assertRedirect('/login');
});

it('redirige vers login si non authentifié (status export)', function () {
    $this->get('/admin/exports/' . \Illuminate\Support\Str::uuid() . '/status')
        ->assertRedirect('/login');
});

// ── Déclenchement d'un export (dispatchCertificates) ──────────────

it('refuse le déclenchement d\'un export sans la permission certificates.view', function () {
    Queue::fake();

    $user = makeExpUser(null); // aucun rôle => aucune permission

    $this->actingAs($user)
        ->postJson('/admin/exports/certificates', ['status' => 'ISSUED'])
        ->assertStatus(403);

    Queue::assertNothingPushed();
});

it('déclenche un export asynchrone de certificats et crée un ReportExecution QUEUED', function () {
    Queue::fake();

    $user = makeExpUser('admin_filiale');

    $response = $this->actingAs($user)->postJson('/admin/exports/certificates', [
        'status' => 'ISSUED',
    ]);

    $response->assertStatus(200)->assertJsonStructure(['message', 'execution_id']);

    $executionId = $response->json('execution_id');

    $this->assertDatabaseHas('report_executions', [
        'id'           => $executionId,
        'requested_by' => $user->id,
        'tenant_id'    => $user->tenant_id,
        'status'       => ReportExecution::STATUS_QUEUED,
        'format'       => 'CSV',
    ]);

    Queue::assertPushed(AsyncCertificateExportJob::class);
});

// ── Statut d'un export ────────────────────────────────────────────

it('consulte le statut d\'un export appartenant à l\'utilisateur courant', function () {
    $user      = makeExpUser('admin_filiale');
    $execution = makeExpExecution($user, ['status' => ReportExecution::STATUS_PROCESSING]);

    $this->actingAs($user)
        ->get("/admin/exports/{$execution->id}/status")
        ->assertStatus(200)
        ->assertJson(['status' => ReportExecution::STATUS_PROCESSING]);
});

it('un utilisateur ne peut pas consulter le statut d\'un export d\'un autre utilisateur', function () {
    $owner     = makeExpUser('admin_filiale');
    $execution = makeExpExecution($owner);

    $stranger = makeExpUser('admin_filiale'); // autre filiale (tenant distinct par défaut)

    $this->actingAs($stranger)
        ->get("/admin/exports/{$execution->id}/status")
        ->assertStatus(404);
});

// ── Liste des exports (index) ─────────────────────────────────────

it('liste uniquement les exports de l\'utilisateur courant', function () {
    $user  = makeExpUser('admin_filiale');
    $other = makeExpUser('admin_filiale');

    makeExpExecution($user);
    makeExpExecution($other);

    $this->actingAs($user)
        ->get('/admin/exports')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/exports/index')
            ->has('executions', 1)
        );
});

// ── Téléchargement ─────────────────────────────────────────────────

it('refuse le téléchargement d\'un export non terminé', function () {
    $user      = makeExpUser('admin_filiale');
    $execution = makeExpExecution($user, ['status' => ReportExecution::STATUS_QUEUED]);

    $this->actingAs($user)
        ->get("/admin/exports/{$execution->id}/download")
        ->assertStatus(404);
});

it('un utilisateur ne peut pas télécharger l\'export d\'un autre utilisateur', function () {
    $owner     = makeExpUser('admin_filiale');
    $execution = makeExpExecution($owner, ['status' => ReportExecution::STATUS_COMPLETED]);

    $stranger = makeExpUser('admin_filiale');

    $this->actingAs($stranger)
        ->get("/admin/exports/{$execution->id}/download")
        ->assertStatus(404);
});

// ── Suppression ─────────────────────────────────────────────────────

it('supprime un export appartenant à l\'utilisateur courant', function () {
    $user      = makeExpUser('admin_filiale');
    $execution = makeExpExecution($user);

    $this->actingAs($user)
        ->delete("/admin/exports/{$execution->id}")
        ->assertStatus(200)
        ->assertJson(['message' => 'Export supprimé.']);

    $this->assertDatabaseMissing('report_executions', ['id' => $execution->id]);
});

it('un utilisateur ne peut pas supprimer l\'export d\'un autre utilisateur', function () {
    $owner     = makeExpUser('admin_filiale');
    $execution = makeExpExecution($owner);

    $stranger = makeExpUser('admin_filiale');

    $this->actingAs($stranger)
        ->delete("/admin/exports/{$execution->id}")
        ->assertStatus(404);

    $this->assertDatabaseHas('report_executions', ['id' => $execution->id]);
});
