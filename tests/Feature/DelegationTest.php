<?php

/**
 * ============================================================
 * Tests Pest — US-036 : Délégations de rôle temporaires
 * ============================================================
 * Couvre DelegationService (create/revoke/expireOverdue),
 * DelegationController (HTTP) et la commande artisan
 * nsia:check-delegations.
 *
 * Lancer : php artisan test --filter DelegationTest
 * ============================================================
 */

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UserRoleGrant;
use App\Services\DelegationService;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeDeleg — pas de conflit avec les autres fichiers) ─

function makeDelegTenant(): Tenant
{
    return Tenant::factory()->create();
}

function makeDelegAdmin(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('admin_filiale');
    return $user;
}

function makeDelegSuperAdmin(): User
{
    $user = User::factory()->create(['tenant_id' => null, 'is_active' => true]);
    $user->assignRole('super_admin');
    return $user;
}

function makeDelegSouscripteur(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('souscripteur');
    return $user;
}

function makeDelegCourtier(?string $tenantId = null): User
{
    $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id, 'is_active' => true]);
    $user->assignRole('courtier_local');
    return $user;
}

/**
 * Crée un UserRoleGrant directement en base (sans passer par le service),
 * utile pour les scénarios de revoke()/expireOverdue() où l'on veut
 * un état de départ précis.
 */
function makeDelegGrant(User $grantee, User $grantor, array $overrides = []): UserRoleGrant
{
    return UserRoleGrant::create(array_merge([
        'user_id'    => $grantee->id,
        'tenant_id'  => $grantor->tenant_id,
        'role_name'  => 'souscripteur',
        'granted_by' => $grantor->id,
        'granted_at' => now(),
        'expires_at' => now()->addDays(7),
        'revoked_by' => null,
        'revoked_at' => null,
        'reason'     => null,
    ], $overrides));
}

// ══════════════════════════════════════════════════════════════
// DelegationService::create()
// ══════════════════════════════════════════════════════════════

it('DelegationService::create crée un UserRoleGrant avec les bons champs', function () {
    $tenant   = makeDelegTenant();
    $grantor  = makeDelegAdmin($tenant->id);
    $grantee  = makeDelegCourtier($tenant->id);
    $expires  = now()->addDays(10)->toDateTimeString();

    $grant = app(DelegationService::class)->create(
        $grantor, $grantee, 'courtier_local', $expires, 'Remplacement congés'
    );

    expect($grant)->toBeInstanceOf(UserRoleGrant::class)
        ->and((string) $grant->user_id)->toBe((string) $grantee->id)
        ->and((string) $grant->granted_by)->toBe((string) $grantor->id)
        ->and((string) $grant->tenant_id)->toBe((string) $grantor->tenant_id)
        ->and($grant->role_name)->toBe('courtier_local')
        ->and($grant->reason)->toBe('Remplacement congés')
        ->and($grant->revoked_at)->toBeNull()
        ->and($grant->granted_at)->not->toBeNull();

    $this->assertDatabaseHas('user_role_grants', [
        'id'         => $grant->id,
        'user_id'    => $grantee->id,
        'granted_by' => $grantor->id,
        'role_name'  => 'courtier_local',
    ]);
});

it('DelegationService::create envoie une notification au délégataire et au délégant', function () {
    $tenant  = makeDelegTenant();
    $grantor = makeDelegAdmin($tenant->id);
    $grantee = makeDelegCourtier($tenant->id);

    $grant = app(DelegationService::class)->create(
        $grantor, $grantee, 'courtier_local', now()->addDays(5)->toDateTimeString()
    );

    $this->assertDatabaseHas('notifications', [
        'type'            => 'DelegationGranted',
        'notifiable_type' => User::class,
        'notifiable_id'   => $grantee->id,
    ]);

    $this->assertDatabaseHas('notifications', [
        'type'            => 'DelegationCreated',
        'notifiable_type' => User::class,
        'notifiable_id'   => $grantor->id,
    ]);

    expect(Notification::where('notifiable_id', $grantee->id)->count())->toBe(1)
        ->and(Notification::where('notifiable_id', $grantor->id)->count())->toBe(1);
});

it('DelegationService::create crée un audit_log delegation.created', function () {
    $tenant  = makeDelegTenant();
    $grantor = makeDelegAdmin($tenant->id);
    $grantee = makeDelegCourtier($tenant->id);

    $grant = app(DelegationService::class)->create(
        $grantor, $grantee, 'courtier_local', now()->addDays(5)->toDateTimeString(), 'Motif test'
    );

    $this->assertDatabaseHas('audit_logs', [
        'tenant_id'   => $grantor->tenant_id,
        'user_id'     => $grantor->id,
        'action'      => 'delegation.created',
        'entity_type' => 'UserRoleGrant',
        'entity_id'   => $grant->id,
        'severity'    => 'WARNING',
    ]);

    $log = AuditLog::where('entity_id', $grant->id)->where('action', 'delegation.created')->first();
    expect($log)->not->toBeNull()
        ->and($log->new_values['role'])->toBe('courtier_local')
        ->and($log->new_values['reason'])->toBe('Motif test');
});

// ══════════════════════════════════════════════════════════════
// DelegationService::revoke()
// ══════════════════════════════════════════════════════════════

it('DelegationService::revoke renseigne revoked_by et revoked_at', function () {
    $tenant  = makeDelegTenant();
    $grantor = makeDelegAdmin($tenant->id);
    $grantee = makeDelegCourtier($tenant->id);
    $grant   = makeDelegGrant($grantee, $grantor);

    app(DelegationService::class)->revoke($grant, $grantor, 'Fin de mission');

    $grant->refresh();

    expect((string) $grant->revoked_by)->toBe((string) $grantor->id)
        ->and($grant->revoked_at)->not->toBeNull()
        ->and($grant->reason)->toContain('Révocation : Fin de mission');
});

it('DelegationService::revoke notifie le délégataire', function () {
    $tenant  = makeDelegTenant();
    $grantor = makeDelegAdmin($tenant->id);
    $grantee = makeDelegCourtier($tenant->id);
    $grant   = makeDelegGrant($grantee, $grantor);

    app(DelegationService::class)->revoke($grant, $grantor, 'Test révocation');

    $this->assertDatabaseHas('notifications', [
        'type'            => 'DelegationRevoked',
        'notifiable_type' => User::class,
        'notifiable_id'   => $grantee->id,
    ]);
});

it('DelegationService::revoke crée un audit_log delegation.revoked', function () {
    $tenant  = makeDelegTenant();
    $grantor = makeDelegAdmin($tenant->id);
    $grantee = makeDelegCourtier($tenant->id);
    $grant   = makeDelegGrant($grantee, $grantor);

    app(DelegationService::class)->revoke($grant, $grantor, 'Motif révocation');

    $this->assertDatabaseHas('audit_logs', [
        'tenant_id'   => $grant->tenant_id,
        'user_id'     => $grantor->id,
        'action'      => 'delegation.revoked',
        'entity_type' => 'UserRoleGrant',
        'entity_id'   => $grant->id,
        'severity'    => 'WARNING',
    ]);
});

// ══════════════════════════════════════════════════════════════
// DelegationService::expireOverdue()
// ══════════════════════════════════════════════════════════════

it('expireOverdue traite les grants expirés non révoqués et ignore les autres', function () {
    $tenant  = makeDelegTenant();
    $grantor = makeDelegAdmin($tenant->id);

    $granteeExpired  = makeDelegCourtier($tenant->id);
    $granteeRevoked  = makeDelegCourtier($tenant->id);
    $granteeFuture   = makeDelegCourtier($tenant->id);
    $granteePermanent = makeDelegCourtier($tenant->id);

    // Expiré et non révoqué → doit être traité
    $expiredGrant = makeDelegGrant($granteeExpired, $grantor, [
        'expires_at' => now()->subDay(),
    ]);

    // Expiré MAIS déjà révoqué → ignoré
    makeDelegGrant($granteeRevoked, $grantor, [
        'expires_at' => now()->subDay(),
        'revoked_by' => $grantor->id,
        'revoked_at' => now()->subHours(2),
    ]);

    // Non expiré → ignoré
    makeDelegGrant($granteeFuture, $grantor, [
        'expires_at' => now()->addDay(),
    ]);

    // Permanent (expires_at null) → ignoré
    makeDelegGrant($granteePermanent, $grantor, [
        'expires_at' => null,
    ]);

    $count = app(DelegationService::class)->expireOverdue();

    expect($count)->toBe(1);

    // Notifications envoyées aux deux parties du grant expiré
    $this->assertDatabaseHas('notifications', [
        'type'            => 'DelegationExpired',
        'notifiable_type' => User::class,
        'notifiable_id'   => $granteeExpired->id,
    ]);
    $this->assertDatabaseHas('notifications', [
        'type'            => 'DelegationExpiredGrantor',
        'notifiable_type' => User::class,
        'notifiable_id'   => $grantor->id,
    ]);

    // Aucune notification "expired" pour les grants ignorés
    expect(Notification::where('notifiable_id', $granteeRevoked->id)->where('type', 'DelegationExpired')->count())->toBe(0)
        ->and(Notification::where('notifiable_id', $granteeFuture->id)->where('type', 'DelegationExpired')->count())->toBe(0)
        ->and(Notification::where('notifiable_id', $granteePermanent->id)->where('type', 'DelegationExpired')->count())->toBe(0);
});

/**
 * DelegationService::expireOverdue() (app/Services/DelegationService.php:153-...) ne met à jour
 * aucun champ du grant traité (pas de revoked_at ni de flag dédié — expiré reste dérivé de
 * expires_at). L'idempotence d'un appel répété (scheduler horaire) repose donc sur
 * Notification::alreadySentToday() : un grant déjà notifié aujourd'hui n'est pas recompté ni
 * renotifié tant qu'il n'a pas été traité un jour différent.
 */
it('expireOverdue() est idempotent : un second appel le même jour ne renotifie pas le même grant', function () {
    $tenant  = makeDelegTenant();
    $grantor = makeDelegAdmin($tenant->id);
    $grantee = makeDelegCourtier($tenant->id);

    makeDelegGrant($grantee, $grantor, ['expires_at' => now()->subDay()]);

    $service = app(DelegationService::class);

    $firstRun  = $service->expireOverdue();
    $secondRun = $service->expireOverdue();

    expect($firstRun)->toBe(1)
        ->and($secondRun)->toBe(0);

    // Une seule notification "DelegationExpired" pour ce grantee malgré les deux appels
    expect(Notification::where('notifiable_id', $grantee->id)->where('type', 'DelegationExpired')->count())->toBe(1);
});

// ══════════════════════════════════════════════════════════════
// HTTP — DelegationController
// ══════════════════════════════════════════════════════════════

it('GET /admin/delegations liste les délégations pour un admin_filiale', function () {
    $tenant = makeDelegTenant();
    $admin  = makeDelegAdmin($tenant->id);

    $this->actingAs($admin)
        ->get('/admin/delegations')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/delegations/index')
            ->has('granted')
            ->has('received')
            ->has('colleagues')
            ->has('delegatableRoles')
            ->where('can.create', true)
        );
});

it('POST /admin/delegations crée une délégation (cas nominal)', function () {
    $tenant   = makeDelegTenant();
    $admin    = makeDelegAdmin($tenant->id);
    $courtier = makeDelegCourtier($tenant->id);

    $this->actingAs($admin)
        ->post('/admin/delegations', [
            'grantee_id' => $courtier->id,
            'role_name'  => 'courtier_local',
            'expires_at' => now()->addDays(3)->toDateString(),
            'reason'     => 'Congés',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('user_role_grants', [
        'user_id'    => $courtier->id,
        'granted_by' => $admin->id,
        'role_name'  => 'courtier_local',
    ]);
});

it('POST /admin/delegations échoue en validation sans grantee_id/role_name/expires_at', function () {
    $tenant = makeDelegTenant();
    $admin  = makeDelegAdmin($tenant->id);

    $this->actingAs($admin)
        ->post('/admin/delegations', [])
        ->assertSessionHasErrors(['grantee_id', 'role_name', 'expires_at']);
});

it('POST /admin/delegations refuse une date d\'expiration passée', function () {
    $tenant   = makeDelegTenant();
    $admin    = makeDelegAdmin($tenant->id);
    $courtier = makeDelegCourtier($tenant->id);

    $this->actingAs($admin)
        ->post('/admin/delegations', [
            'grantee_id' => $courtier->id,
            'role_name'  => 'courtier_local',
            'expires_at' => now()->subDay()->toDateString(),
        ])
        ->assertSessionHasErrors(['expires_at']);
});

it('POST /admin/delegations refuse un role_name non déléguable par un admin_filiale', function () {
    $tenant = makeDelegTenant();
    $admin  = makeDelegAdmin($tenant->id);
    // admin_filiale ne peut déléguer que souscripteur/courtier_local, pas admin_filiale
    $other  = makeDelegAdmin($tenant->id);

    $this->actingAs($admin)
        ->post('/admin/delegations', [
            'grantee_id' => $other->id,
            'role_name'  => 'admin_filiale',
            'expires_at' => now()->addDays(3)->toDateString(),
        ])
        ->assertSessionHasErrors(['role_name']);
});

it('POST /admin/delegations refuse un délégataire d\'une autre filiale pour un admin_filiale', function () {
    $tenantA  = makeDelegTenant();
    $tenantB  = makeDelegTenant();
    $admin    = makeDelegAdmin($tenantA->id);
    $courtier = makeDelegCourtier($tenantB->id);

    $this->actingAs($admin)
        ->post('/admin/delegations', [
            'grantee_id' => $courtier->id,
            'role_name'  => 'courtier_local',
            'expires_at' => now()->addDays(3)->toDateString(),
        ])
        ->assertStatus(403);
});

it('POST /admin/delegations refuse un doublon de délégation active', function () {
    $tenant   = makeDelegTenant();
    $admin    = makeDelegAdmin($tenant->id);
    $courtier = makeDelegCourtier($tenant->id);

    makeDelegGrant($courtier, $admin, [
        'role_name'  => 'courtier_local',
        'expires_at' => now()->addDays(5),
    ]);

    $this->actingAs($admin)
        ->post('/admin/delegations', [
            'grantee_id' => $courtier->id,
            'role_name'  => 'courtier_local',
            'expires_at' => now()->addDays(10)->toDateString(),
        ])
        ->assertSessionHasErrors(['role_name']);
});

it('POST /admin/delegations refuse un souscripteur (rôle non autorisé à déléguer)', function () {
    $tenant       = makeDelegTenant();
    $souscripteur = makeDelegSouscripteur($tenant->id);
    $courtier     = makeDelegCourtier($tenant->id);

    $this->actingAs($souscripteur)
        ->post('/admin/delegations', [
            'grantee_id' => $courtier->id,
            'role_name'  => 'courtier_local',
            'expires_at' => now()->addDays(3)->toDateString(),
        ])
        ->assertStatus(403);
});

it('super_admin peut déléguer le rôle admin_filiale à un utilisateur d\'une autre filiale', function () {
    $superAdmin = makeDelegSuperAdmin();
    $tenant     = makeDelegTenant();
    $courtier   = makeDelegCourtier($tenant->id);

    $this->actingAs($superAdmin)
        ->post('/admin/delegations', [
            'grantee_id' => $courtier->id,
            'role_name'  => 'admin_filiale',
            'expires_at' => now()->addDays(3)->toDateString(),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('user_role_grants', [
        'user_id'    => $courtier->id,
        'granted_by' => $superAdmin->id,
        'role_name'  => 'admin_filiale',
    ]);
});

it('PATCH /admin/delegations/{grant}/revoke révoque une délégation par son délégant', function () {
    $tenant   = makeDelegTenant();
    $admin    = makeDelegAdmin($tenant->id);
    $courtier = makeDelegCourtier($tenant->id);
    $grant    = makeDelegGrant($courtier, $admin);

    $this->actingAs($admin)
        ->patch("/admin/delegations/{$grant->id}/revoke", ['reason' => 'Test HTTP'])
        ->assertRedirect();

    $grant->refresh();
    expect((string) $grant->revoked_by)->toBe((string) $admin->id)
        ->and($grant->revoked_at)->not->toBeNull();
});

it('PATCH /admin/delegations/{grant}/revoke refuse un utilisateur qui n\'est ni le délégant ni super_admin', function () {
    $tenant     = makeDelegTenant();
    $admin      = makeDelegAdmin($tenant->id);
    $otherAdmin = makeDelegAdmin($tenant->id);
    $courtier   = makeDelegCourtier($tenant->id);
    $grant      = makeDelegGrant($courtier, $admin);

    $this->actingAs($otherAdmin)
        ->patch("/admin/delegations/{$grant->id}/revoke", ['reason' => 'Non autorisé'])
        ->assertStatus(403);

    expect($grant->fresh()->revoked_at)->toBeNull();
});

it('PATCH /admin/delegations/{grant}/revoke refuse une délégation déjà révoquée', function () {
    $tenant   = makeDelegTenant();
    $admin    = makeDelegAdmin($tenant->id);
    $courtier = makeDelegCourtier($tenant->id);
    $grant    = makeDelegGrant($courtier, $admin, [
        'revoked_by' => $admin->id,
        'revoked_at' => now()->subHour(),
    ]);

    $this->actingAs($admin)
        ->patch("/admin/delegations/{$grant->id}/revoke", ['reason' => 'Déjà révoquée'])
        ->assertStatus(422);
});

it('super_admin peut révoquer la délégation accordée par un autre admin_filiale', function () {
    $tenant     = makeDelegTenant();
    $admin      = makeDelegAdmin($tenant->id);
    $courtier   = makeDelegCourtier($tenant->id);
    $superAdmin = makeDelegSuperAdmin();
    $grant      = makeDelegGrant($courtier, $admin);

    $this->actingAs($superAdmin)
        ->patch("/admin/delegations/{$grant->id}/revoke", ['reason' => 'Révocation par super admin'])
        ->assertRedirect();

    expect((string) $grant->fresh()->revoked_by)->toBe((string) $superAdmin->id);
});

it('redirige vers /login si non authentifié (index)', function () {
    $this->get('/admin/delegations')->assertRedirect('/login');
});

it('redirige vers /login si non authentifié (store)', function () {
    $tenant   = makeDelegTenant();
    $courtier = makeDelegCourtier($tenant->id);

    $this->post('/admin/delegations', [
        'grantee_id' => $courtier->id,
        'role_name'  => 'courtier_local',
        'expires_at' => now()->addDays(3)->toDateString(),
    ])->assertRedirect('/login');
});

it('redirige vers /login si non authentifié (revoke)', function () {
    $tenant   = makeDelegTenant();
    $admin    = makeDelegAdmin($tenant->id);
    $courtier = makeDelegCourtier($tenant->id);
    $grant    = makeDelegGrant($courtier, $admin);

    $this->patch("/admin/delegations/{$grant->id}/revoke")->assertRedirect('/login');
});

// ══════════════════════════════════════════════════════════════
// Commande artisan nsia:check-delegations
// ══════════════════════════════════════════════════════════════

it('la commande nsia:check-delegations déclenche expireOverdue et notifie', function () {
    $tenant  = makeDelegTenant();
    $grantor = makeDelegAdmin($tenant->id);
    $grantee = makeDelegCourtier($tenant->id);

    makeDelegGrant($grantee, $grantor, ['expires_at' => now()->subHour()]);

    $this->artisan('nsia:check-delegations')
        ->assertExitCode(0);

    $this->assertDatabaseHas('notifications', [
        'type'            => 'DelegationExpired',
        'notifiable_type' => User::class,
        'notifiable_id'   => $grantee->id,
    ]);
});
