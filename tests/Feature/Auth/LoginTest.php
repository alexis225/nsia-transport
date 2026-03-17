<?php

/**
 * ============================================================
 * Tests Pest — US-001 : Connexion Fortify + Inertia
 * ============================================================
 * Fortify expose POST /login — on teste ce endpoint directement.
 * Lancer : php artisan test --filter LoginTest
 * ============================================================
 */

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    RateLimiter::clear('login|test@nsia-ci.com|127.0.0.1');
});

function makeUser(array $overrides = []): User
{
    $tenant = Tenant::factory()->create();
    return User::factory()->create(array_merge([
        'tenant_id'             => $tenant->id,
        'email'                 => 'test@nsia-ci.com',
        'password'              => Hash::make('Password@123'),
        'is_active'             => true,
        'failed_login_attempts' => 0,
        'locked_until'          => null,
        'mfa_enabled'           => false,
    ], $overrides));
}

// ── Test 1 : Login réussi → redirect dashboard ────────────────
it('redirige vers /dashboard sur login réussi', function () {
    makeUser();

    $this->post('/login', [
        'email'    => 'test@nsia-ci.com',
        'password' => 'Password@123',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticated();
});

// ── Test 2 : Mauvais mot de passe → erreur session ───────────
it('retourne une erreur sur mot de passe incorrect', function () {
    makeUser();

    $this->post('/login', [
        'email'    => 'test@nsia-ci.com',
        'password' => 'mauvais',
    ])->assertSessionHasErrors();

    $this->assertGuest();
});

// ── Test 3 : Email inexistant ────────────────────────────────
it('retourne une erreur sur email inexistant', function () {
    $this->post('/login', [
        'email'    => 'inconnu@nsia.com',
        'password' => 'Password@123',
    ])->assertSessionHasErrors();
});

// ── Test 4 : Lockout après 5 tentatives ──────────────────────
it('bloque après 5 tentatives échouées', function () {
    makeUser();

    foreach (range(1, 5) as $i) {
        $this->post('/login', ['email' => 'test@nsia-ci.com', 'password' => 'mauvais']);
    }

    // 6ème tentative → rate limiter → 429
    $this->post('/login', [
        'email'    => 'test@nsia-ci.com',
        'password' => 'Password@123',
    ])->assertStatus(429);
});

// ── Test 5 : Compte désactivé ────────────────────────────────
it('refuse la connexion si is_active = false', function () {
    makeUser(['is_active' => false]);

    $this->post('/login', [
        'email'    => 'test@nsia-ci.com',
        'password' => 'Password@123',
    ])->assertSessionHasErrors();

    $this->assertGuest();
});

// ── Test 6 : Compte verrouillé ───────────────────────────────
it('refuse la connexion si locked_until est dans le futur', function () {
    makeUser(['locked_until' => now()->addMinutes(5)]);

    $this->post('/login', [
        'email'    => 'test@nsia-ci.com',
        'password' => 'Password@123',
    ])->assertSessionHasErrors();

    $this->assertGuest();
});

// ── Test 7 : Page login renvoie vue Inertia ───────────────────
it('affiche la page Inertia Auth/Login', function () {
    $this->get('/login')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('auth/login'));
});

// ── Test 8 : Page login redirige si déjà connecté ────────────
it('redirige un utilisateur déjà connecté', function () {
    $user = makeUser();
    $this->actingAs($user);

    $this->get('/login')->assertRedirect('/dashboard');
});

// ── Test 9 : Logout invalide la session ──────────────────────
it('déconnecte et invalide la session', function () {
    $user = makeUser();
    $this->actingAs($user);

    $this->post('/logout')->assertRedirect('/');

    $this->assertGuest();
});

// ── Test 10 : last_login_at mis à jour ───────────────────────
it('met à jour last_login_at après connexion réussie', function () {
    $user = makeUser();

    $this->post('/login', [
        'email'    => 'test@nsia-ci.com',
        'password' => 'Password@123',
    ]);

    expect($user->fresh()->last_login_at)->not->toBeNull();
    expect($user->fresh()->failed_login_attempts)->toBe(0);
});

// ── Test 11 : Audit log sur login réussi ─────────────────────
it('crée un audit_log login_success', function () {
    $user = makeUser();

    $this->post('/login', [
        'email'    => 'test@nsia-ci.com',
        'password' => 'Password@123',
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action'  => 'login_success',
    ]);
});

// ── Test 12 : Audit log sur login échoué ─────────────────────
it('crée un audit_log login_failed sur mauvais mot de passe', function () {
    $user = makeUser();

    $this->post('/login', [
        'email'    => 'test@nsia-ci.com',
        'password' => 'mauvais',
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action'  => 'login_failed',
    ]);
});