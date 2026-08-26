<?php

/**
 * ============================================================
 * Tests Pest — Module audit_logs : AuditLogController
 * ============================================================
 * Lancer : php artisan test --filter AuditLogControllerTest
 * ============================================================
 */

use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeAud — module audit_logs) ────────────────

function makeAudUser(string $role, array $permissions = [], ?string $tenantId = null): User
{
    $tenant = $role === 'super_admin'
        ? null
        : ($tenantId ?? Tenant::factory()->create()->id);

    $user = User::factory()->create([
        'tenant_id' => $tenant,
        'is_active' => true,
    ]);

    $user->assignRole($role);

    if ($permissions) {
        $user->givePermissionTo($permissions);
    }

    return $user;
}

function makeAudLog(array $overrides = []): AuditLog
{
    return AuditLog::create(array_merge([
        'tenant_id'   => null,
        'user_id'     => null,
        'action'      => 'test.action',
        'entity_type' => 'Test',
        'entity_id'   => (string) \Illuminate\Support\Str::uuid(),
        'severity'    => AuditLog::SEVERITY_INFO,
    ], $overrides));
}

// ── Non authentifié ───────────────────────────────────────────────

it('redirige vers login si non authentifié (index)', function () {
    $this->get('/admin/audit-logs')->assertRedirect('/login');
});

it('redirige vers login si non authentifié (export)', function () {
    $this->get('/admin/audit-logs/export')->assertRedirect('/login');
});

it('redirige vers login si non authentifié (purge)', function () {
    $this->delete('/admin/audit-logs/purge', ['days' => 90])->assertRedirect('/login');
});

it('redirige vers login si non authentifié (show)', function () {
    $log = makeAudLog();
    $this->get("/admin/audit-logs/{$log->id}")->assertRedirect('/login');
});

// ── Liste (index) ─────────────────────────────────────────────────

it('refuse la liste sans la permission audit_logs.view', function () {
    $user = makeAudUser('admin_filiale');

    $this->actingAs($user)
        ->get('/admin/audit-logs')
        ->assertStatus(403);
});

it('autorise la liste avec la permission audit_logs.view', function () {
    $user = makeAudUser('admin_filiale', ['audit_logs.view']);

    $this->actingAs($user)
        ->get('/admin/audit-logs')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('admin/audit-logs/index'));
});

it('super_admin voit la liste des audit logs (toutes filiales)', function () {
    $user = makeAudUser('super_admin');

    $this->actingAs($user)
        ->get('/admin/audit-logs')
        ->assertStatus(200);
});

// ── Détail (show) ─────────────────────────────────────────────────

it('affiche le détail d\'un log de sa propre filiale', function () {
    $user = makeAudUser('admin_filiale', ['audit_logs.view']);
    $log  = makeAudLog(['tenant_id' => $user->tenant_id, 'action' => 'certificate.issue']);

    $this->actingAs($user)
        ->get("/admin/audit-logs/{$log->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/audit-logs/show')
            ->where('log.id', $log->id)
        );
});

it('refuse le détail d\'un log d\'une autre filiale', function () {
    $user = makeAudUser('admin_filiale', ['audit_logs.view']);
    $log  = makeAudLog(['tenant_id' => Tenant::factory()->create()->id]);

    $this->actingAs($user)
        ->get("/admin/audit-logs/{$log->id}")
        ->assertStatus(403);
});

it('super_admin peut voir le détail d\'un log de n\'importe quelle filiale', function () {
    $user = makeAudUser('super_admin');
    $log  = makeAudLog(['tenant_id' => Tenant::factory()->create()->id]);

    $this->actingAs($user)
        ->get("/admin/audit-logs/{$log->id}")
        ->assertStatus(200);
});

// ── Export CSV ──────────────────────────────────────────────────

it('refuse l\'export sans la permission audit_logs.export', function () {
    $user = makeAudUser('admin_filiale', ['audit_logs.view']);

    $this->actingAs($user)
        ->get('/admin/audit-logs/export')
        ->assertStatus(403);
});

it('autorise l\'export CSV avec la permission audit_logs.export', function () {
    $user = makeAudUser('admin_filiale', ['audit_logs.export']);
    makeAudLog(['tenant_id' => $user->tenant_id, 'action' => 'certificate.issue']);

    $response = $this->actingAs($user)->get('/admin/audit-logs/export');

    $response->assertStatus(200);
    expect($response->headers->get('Content-Type'))->toContain('text/csv');
});

// ── Purge ───────────────────────────────────────────────────────

it('refuse la purge à un admin_filiale même avec audit_logs.view (rôle super_admin requis)', function () {
    $user = makeAudUser('admin_filiale', ['audit_logs.view', 'audit_logs.export']);

    $this->actingAs($user)
        ->delete('/admin/audit-logs/purge', ['days' => 90])
        ->assertStatus(403);
});

it('autorise la purge au super_admin et supprime les logs antérieurs', function () {
    $user = makeAudUser('super_admin');

    $oldLog = makeAudLog(['action' => 'old.action', 'created_at' => now()->subDays(400)]);
    $newLog = makeAudLog(['action' => 'new.action', 'created_at' => now()->subDays(1)]);

    $this->actingAs($user)
        ->delete('/admin/audit-logs/purge', ['days' => 365])
        ->assertRedirect();

    $this->assertDatabaseMissing('audit_logs', ['id' => $oldLog->id]);
    $this->assertDatabaseHas('audit_logs', ['id' => $newLog->id]);
});

it('valide que le paramètre days est requis pour la purge', function () {
    $user = makeAudUser('super_admin');

    $this->actingAs($user)
        ->delete('/admin/audit-logs/purge', [])
        ->assertSessionHasErrors(['days']);
});

it('valide que le paramètre days respecte le minimum de 30', function () {
    $user = makeAudUser('super_admin');

    $this->actingAs($user)
        ->delete('/admin/audit-logs/purge', ['days' => 5])
        ->assertSessionHasErrors(['days']);
});
