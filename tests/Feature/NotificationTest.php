<?php

/**
 * ============================================================
 * Tests Pest — Module notifications
 * ============================================================
 * Couvre : NotificationHelper, Notification, NotificationPreference,
 * NotificationController (flux admin/notifications/feed) et
 * NotificationCenterController (admin/notifications).
 *
 * Lancer : php artisan test --filter NotificationTest
 * ============================================================
 */

use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\Tenant;
use App\Models\User;
use App\Services\NotificationHelper;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $this->artisan('db:seed --class=RolesAndPermissionsSeeder');
});

// ── Helpers (préfixe makeNotif — module notifications) ────────────

function makeNotifUser(string $role = 'admin_filiale', ?string $tenantId = null): User
{
    $tenant = $role === 'super_admin'
        ? null
        : ($tenantId ?? Tenant::factory()->create()->id);

    $user = User::factory()->create([
        'tenant_id' => $tenant,
        'is_active' => true,
    ]);

    $user->assignRole($role);

    return $user;
}

// ── Non authentifié ───────────────────────────────────────────────

it('redirige vers login si non authentifié (flux notifications)', function () {
    $this->get('/admin/notifications/feed')->assertRedirect('/login');
});

it('redirige vers login si non authentifié (centre notifications)', function () {
    $this->get('/admin/notifications')->assertRedirect('/login');
});

it('redirige vers login si non authentifié (marquer comme lue)', function () {
    $this->patch('/admin/notifications/feed/' . Str::uuid() . '/read')
        ->assertRedirect('/login');
});

it('redirige vers login si non authentifié (préférences)', function () {
    $this->post('/admin/notifications/preferences', ['preferences' => []])
        ->assertRedirect('/login');
});

// ── NotificationHelper / modèle Notification ──────────────────────

it('NotificationHelper::send persiste une notification in-app avec les bons champs', function () {
    $user = makeNotifUser();

    NotificationHelper::send(
        $user,
        Notification::TYPE_CERT_ISSUED,
        'Certificat émis',
        'Votre certificat est prêt.',
        ['certificate_id' => 'CERT-001']
    );

    $this->assertDatabaseHas('notifications', [
        'notifiable_type' => 'App\\Models\\User',
        'notifiable_id'   => $user->id,
        'type'            => Notification::TYPE_CERT_ISSUED,
        'tenant_id'       => $user->tenant_id,
        'channel'         => Notification::CHANNEL_IN_APP,
    ]);

    $notif = Notification::forUser($user->id)->first();

    expect($notif)->not->toBeNull()
        ->and($notif->data['title'])->toBe('Certificat émis')
        ->and($notif->data['body'])->toBe('Votre certificat est prêt.')
        ->and($notif->data['certificate_id'])->toBe('CERT-001')
        ->and($notif->isRead())->toBeFalse();
});

it('NotificationHelper::sendToMany notifie chaque utilisateur donné', function () {
    $tenant = Tenant::factory()->create();
    $u1 = makeNotifUser('admin_filiale', $tenant->id);
    $u2 = makeNotifUser('admin_filiale', $tenant->id);

    NotificationHelper::sendToMany([$u1, $u2], 'SystemAlert', 'Alerte', 'Message système.');

    expect(Notification::forUser($u1->id)->count())->toBe(1)
        ->and(Notification::forUser($u2->id)->count())->toBe(1);
});

it('NotificationPreference::accepts est vrai par défaut puis faux après désactivation', function () {
    $user = makeNotifUser();

    expect(NotificationPreference::accepts($user, 'CertificateIssued', 'in_app'))->toBeTrue();

    NotificationPreference::updateOrCreate(
        ['user_id' => $user->id, 'event_type' => 'CertificateIssued'],
        ['in_app' => false, 'email' => true]
    );

    expect(NotificationPreference::accepts($user, 'CertificateIssued', 'in_app'))->toBeFalse()
        ->and(NotificationPreference::accepts($user, 'CertificateIssued', 'email'))->toBeTrue();
});

// ── Marquage comme lue (NotificationController::markRead) ────────

it('marque comme lue une notification appartenant à l\'utilisateur courant', function () {
    $user  = makeNotifUser();
    $notif = Notification::send($user, 'CertificateIssued', 'Titre', 'Corps');

    $this->actingAs($user)
        ->patch("/admin/notifications/feed/{$notif->id}/read")
        ->assertStatus(200)
        ->assertJson(['ok' => true]);

    expect($notif->fresh()->read_at)->not->toBeNull();
});

it('ne marque pas comme lue une notification appartenant à un autre utilisateur', function () {
    $owner = makeNotifUser();
    $other = makeNotifUser();

    $notif = Notification::send($owner, 'CertificateIssued', 'Titre', 'Corps');

    // Le contrôleur restreint la mise à jour via notifiable_id — vérifie
    // que la notification d'un tiers n'est PAS marquée comme lue,
    // même si la réponse HTTP reste 200/ok (le endpoint ne révèle pas
    // l'existence de la ressource).
    $this->actingAs($other)
        ->patch("/admin/notifications/feed/{$notif->id}/read")
        ->assertStatus(200);

    expect($notif->fresh()->read_at)->toBeNull();
});

it('marque toutes les notifications de l\'utilisateur courant comme lues', function () {
    $user  = makeNotifUser();
    $other = makeNotifUser();

    $n1 = Notification::send($user, 'CertificateIssued', 'T1', 'B1');
    $n2 = Notification::send($user, 'CertificateSubmitted', 'T2', 'B2');
    $n3 = Notification::send($other, 'CertificateIssued', 'T3', 'B3');

    $this->actingAs($user)
        ->patch('/admin/notifications/feed/read-all')
        ->assertStatus(200)
        ->assertJson(['ok' => true]);

    expect($n1->fresh()->read_at)->not->toBeNull()
        ->and($n2->fresh()->read_at)->not->toBeNull()
        ->and($n3->fresh()->read_at)->toBeNull();
});

// ── Flux de notifications (NotificationController::index) ────────

it('liste le flux de notifications avec le compteur non lues', function () {
    $user = makeNotifUser();

    Notification::send($user, 'CertificateIssued', 'Titre 1', 'Corps 1');
    Notification::send($user, 'CertificateSubmitted', 'Titre 2', 'Corps 2');

    $response = $this->actingAs($user)->get('/admin/notifications/feed');

    $response->assertStatus(200)
        ->assertJsonCount(2, 'notifications')
        ->assertJson(['unread_count' => 2]);
});

it('le flux ne retourne que les notifications de l\'utilisateur courant', function () {
    $user  = makeNotifUser();
    $other = makeNotifUser();

    Notification::send($user, 'CertificateIssued', 'Titre 1', 'Corps 1');
    Notification::send($other, 'CertificateIssued', 'Titre autre', 'Corps autre');

    $response = $this->actingAs($user)->get('/admin/notifications/feed');

    $response->assertStatus(200)->assertJsonCount(1, 'notifications');
});

// ── Centre de notifications (NotificationCenterController) ───────

it('affiche le centre de notifications', function () {
    $user = makeNotifUser();

    $this->actingAs($user)
        ->get('/admin/notifications')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('admin/notifications/index')
            ->has('stats')
            ->has('preferences')
        );
});

it('sauvegarde les préférences de notification', function () {
    $user = makeNotifUser();

    $response = $this->actingAs($user)->post('/admin/notifications/preferences', [
        'preferences' => [
            ['event_type' => 'CertificateIssued', 'in_app' => false, 'email' => true],
        ],
    ]);

    $response->assertStatus(200)->assertJson(['ok' => true]);

    $this->assertDatabaseHas('notification_preferences', [
        'user_id'    => $user->id,
        'event_type' => 'CertificateIssued',
        'in_app'     => false,
        'email'      => true,
    ]);
});
