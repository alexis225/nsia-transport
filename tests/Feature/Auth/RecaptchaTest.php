<?php

/**
 * ============================================================
 * Tests Pest — App\Http\Middleware\VerifyRecaptcha
 * ============================================================
 * Vérifie que login/register/forgot-password sont bien protégés
 * quand des clés reCAPTCHA sont configurées, que le score/l'action
 * Google sont respectés, et que les autres routes Fortify (2FA...)
 * ne sont pas affectées.
 * Lancer : php artisan test --filter RecaptchaTest
 * ============================================================
 */

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    config(['services.recaptcha.secret_key' => 'fake-secret-key', 'services.recaptcha.min_score' => 0.5]);
    RateLimiter::clear('login|recaptcha-test@nsia-ci.com|127.0.0.1');
});

function makeRecaptchaUser(): User
{
    $tenant = Tenant::factory()->create();

    return User::factory()->create([
        'tenant_id' => $tenant->id,
        'email' => 'recaptcha-test@nsia-ci.com',
        'password' => Hash::make('Password@123'),
        'is_active' => true,
        'mfa_enabled' => false,
    ]);
}

function fakeGoogleSiteverify(bool $success, string $action = 'login', float $score = 0.9): void
{
    Http::fake([
        'https://www.google.com/recaptcha/api/siteverify' => Http::response([
            'success' => $success,
            'action' => $action,
            'score' => $score,
        ]),
    ]);
}

it('bloque le login sans g-recaptcha-response quand des clés sont configurées', function () {
    makeRecaptchaUser();

    $this->post('/login', [
        'email' => 'recaptcha-test@nsia-ci.com',
        'password' => 'Password@123',
    ])->assertSessionHasErrors(['g-recaptcha-response']);

    $this->assertGuest();
});

it('bloque le login si Google renvoie success=false', function () {
    makeRecaptchaUser();
    fakeGoogleSiteverify(success: false);

    $this->post('/login', [
        'email' => 'recaptcha-test@nsia-ci.com',
        'password' => 'Password@123',
        'g-recaptcha-response' => 'un-token',
    ])->assertSessionHasErrors(['g-recaptcha-response']);

    $this->assertGuest();
});

it('bloque le login si le score est sous le seuil configuré', function () {
    makeRecaptchaUser();
    fakeGoogleSiteverify(success: true, action: 'login', score: 0.1);

    $this->post('/login', [
        'email' => 'recaptcha-test@nsia-ci.com',
        'password' => 'Password@123',
        'g-recaptcha-response' => 'un-token',
    ])->assertSessionHasErrors(['g-recaptcha-response']);

    $this->assertGuest();
});

it("bloque le login si l'action Google ne correspond pas (anti-rejeu entre formulaires)", function () {
    makeRecaptchaUser();
    fakeGoogleSiteverify(success: true, action: 'register', score: 0.9);

    $this->post('/login', [
        'email' => 'recaptcha-test@nsia-ci.com',
        'password' => 'Password@123',
        'g-recaptcha-response' => 'un-token-genere-pour-register',
    ])->assertSessionHasErrors(['g-recaptcha-response']);

    $this->assertGuest();
});

it('autorise le login avec un token valide (success, bonne action, bon score)', function () {
    makeRecaptchaUser();
    fakeGoogleSiteverify(success: true, action: 'login', score: 0.9);

    $this->post('/login', [
        'email' => 'recaptcha-test@nsia-ci.com',
        'password' => 'Password@123',
        'g-recaptcha-response' => 'un-bon-token',
    ])->assertRedirect();

    $this->assertAuthenticated();
});

it("n'affecte pas les routes Fortify hors login/register/forgot-password (ex: two-factor-challenge)", function () {
    $user = makeRecaptchaUser();
    session(['login.id' => $user->id]);

    // Aucun g-recaptcha-response fourni, aucun Http::fake ne répond
    // (si le middleware essayait de vérifier ici, l'appel HTTP réel
    // échouerait/serait bloqué par Http::preventStrayRequests()).
    Http::preventStrayRequests();

    $this->get('/two-factor-challenge')->assertOk();
});

it('laisse passer sans vérification quand RECAPTCHA_SECRET_KEY est vide (comportement par défaut des tests)', function () {
    config(['services.recaptcha.secret_key' => null]);
    makeRecaptchaUser();

    $this->post('/login', [
        'email' => 'recaptcha-test@nsia-ci.com',
        'password' => 'Password@123',
    ])->assertRedirect();

    $this->assertAuthenticated();
});
