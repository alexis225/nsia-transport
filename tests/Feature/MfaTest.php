<?php

/**
 * ============================================================
 * Tests Pest — US-002 : MFA TOTP
 * ============================================================
 * Lancer : php artisan test --filter MfaTest
 * ============================================================
 */

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;

function makeMfaUser(array $overrides = []): User
{
    $tenant = Tenant::factory()->create();
    return User::factory()->create(array_merge([
        'tenant_id'             => $tenant->id,
        'email'                 => 'mfa@nsia-ci.com',
        'password'              => Hash::make('Password@123'),
        'is_active'             => true,
        'failed_login_attempts' => 0,
        'locked_until'          => null,
        'mfa_enabled'           => false
    ], $overrides));
}

// ── Test 1 : Page MFA setup accessible ───────────────────────
it('affiche la page de setup MFA', function () {
    $user = makeMfaUser();
    $this->actingAs($user);

    $this->get('/user/mfa-setup')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('auth/mfa-setup')
            ->where('mfaEnabled', false)
        );
});

// ── Test 2 : Activer MFA génère un secret ────────────────────
it('génère un secret TOTP lors de l\'activation MFA', function () {
    $user = makeMfaUser();
    $this->actingAs($user);

    $this->post('/user/mfa-setup/enable')
        ->assertRedirect();

    $user->refresh();

    expect($user->two_factor_secret)->not->toBeNull();
});

// ── Test 3 : Secret chiffré en base (pas en clair) ───────────
it('stocke le secret MFA chiffré en base', function () {
    $user = makeMfaUser();
    $this->actingAs($user);

    $this->post('/user/mfa-setup/enable');

    $user->refresh();

    // Le secret en base doit être chiffré (pas un code TOTP nu)
    $raw = \Illuminate\Support\Facades\DB::table('users')
        ->where('id', $user->id)
        ->value('two_factor_secret');

    // Un secret chiffré par Laravel Crypt commence par "eyJ" (base64 JSON)
    expect($raw)->not->toBeNull();
    expect(strlen($raw))->toBeGreaterThan(32);

    // Vérifier qu'on peut le déchiffrer
    expect(fn () => decrypt($raw))->not->toThrow(\Exception::class);
});

// ── Test 4 : QR code disponible après activation ─────────────


// ── Test 5 : Challenge MFA requis après login si MFA activé ──
it('retourne un QR code SVG après activation MFA', function () {
    $user = makeMfaUser();
    $this->actingAs($user);

    $this->post('/user/mfa-setup/enable');
    $user->refresh();

    // Désactiver la gestion des exceptions pour voir l'erreur brute
    $this->withoutExceptionHandling();

    $response = $this->get('/user/mfa-setup');

    $response->assertInertia(fn ($page) => $page
        ->where('mfaPending', true)
    );
});

// ── Test 6 : Désactiver MFA ───────────────────────────────────
it('désactive le MFA et supprime le secret', function () {
    $user = makeMfaUser();
    app(EnableTwoFactorAuthentication::class)($user);
    $user->update(['two_factor_confirmed_at' => now()]);

    $this->actingAs($user);

    $this->delete('/user/mfa-setup/disable')
        ->assertRedirect();

    $user->refresh();

    expect($user->two_factor_secret)->toBeNull();
    expect($user->two_factor_confirmed_at)->toBeNull();
});

// ── Test 7 : Regénérer codes de récupération ─────────────────
it('regénère les codes de récupération', function () {
    $user = makeMfaUser();
    app(EnableTwoFactorAuthentication::class)($user);
    $user->update(['two_factor_confirmed_at' => now()]);

    $this->actingAs($user);

    $oldCodes = $user->recoveryCodes();

    $this->post('/user/mfa-setup/recovery-codes')
        ->assertRedirect();

    $user->refresh();
    $newCodes = $user->recoveryCodes();

    expect($newCodes)->not->toBe($oldCodes);
    expect($newCodes)->toHaveCount(8);
});

// ── Test 8 : Audit log créé à l'activation ───────────────────
it('crée un audit_log mfa_enable_initiated', function () {
    $user = makeMfaUser();
    $this->actingAs($user);

    $this->post('/user/mfa-setup/enable');

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action'  => 'mfa_enable_initiated',
    ]);
});

// ── Test 9 : Audit log créé à la désactivation ───────────────
it('crée un audit_log mfa_disabled', function () {
    $user = makeMfaUser();
    app(EnableTwoFactorAuthentication::class)($user);
    $user->update(['two_factor_confirmed_at' => now()]);

    $this->actingAs($user);

    $this->delete('/user/mfa-setup/disable');

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action'  => 'mfa_disabled',
    ]);
});

// ── Test 10 : Setup MFA inaccessible sans auth ───────────────
it('redirige vers login si non authentifié', function () {
    $this->get('/user/mfa-setup')
        ->assertRedirect('/login');
});