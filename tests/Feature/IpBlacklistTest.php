<?php

/**
 * ============================================================
 * Tests Pest — US-058 : IpBlacklist & RecordFailedLogin
 * ============================================================
 * Lancer : php artisan test --filter IpBlacklistTest
 * ============================================================
 */

use App\Http\Middleware\CheckIpBlacklist;
use App\Listeners\RecordFailedLogin;
use App\Models\IpBlacklist;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

// ── isBlocked() — requête CIDR PostgreSQL ─────────────────────

it('détecte une IP bloquée dans une plage CIDR', function () {
    DB::table('ip_blacklist')->insert([
        'id'       => (string) \Illuminate\Support\Str::uuid(),
        'ip_range' => '192.168.1.0/24',
        'reason'   => 'Test',
    ]);

    expect(IpBlacklist::isBlocked('192.168.1.100'))->toBeTrue()
        ->and(IpBlacklist::isBlocked('192.168.2.1'))->toBeFalse();
});

it('détecte une IP exacte bloquée', function () {
    DB::table('ip_blacklist')->insert([
        'id'       => (string) \Illuminate\Support\Str::uuid(),
        'ip_range' => '10.0.0.5/32',
        'reason'   => 'Exact',
    ]);

    expect(IpBlacklist::isBlocked('10.0.0.5'))->toBeTrue()
        ->and(IpBlacklist::isBlocked('10.0.0.6'))->toBeFalse();
});

it('ignore les entrées expirées', function () {
    DB::table('ip_blacklist')->insert([
        'id'        => (string) \Illuminate\Support\Str::uuid(),
        'ip_range'  => '172.16.0.0/16',
        'expires_at'=> now()->subHour()->toDateTimeString(),
        'reason'    => 'Expired',
    ]);

    expect(IpBlacklist::isBlocked('172.16.1.1'))->toBeFalse();
});

it('retourne false si la table est vide', function () {
    expect(IpBlacklist::isBlocked('1.2.3.4'))->toBeFalse();
});

// ── CheckIpBlacklist middleware ────────────────────────────────

it('bloque les requêtes avec IP blacklistée', function () {
    DB::table('ip_blacklist')->insert([
        'id'      => (string) \Illuminate\Support\Str::uuid(),
        'ip_range'=> '203.0.113.0/24',
    ]);
    Cache::forget('ip_blocked_203.0.113.42');

    $response = $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.42'])
                     ->get('/');

    $response->assertStatus(403);
});

it('laisse passer les requêtes avec IP non bloquée', function () {
    Cache::forget('ip_blocked_8.8.8.8');

    $response = $this->withServerVariables(['REMOTE_ADDR' => '8.8.8.8'])
                     ->get('/');

    // Redirige vers login (302) — pas bloqué
    $response->assertStatus(302);
});

// ── RecordFailedLogin listener ─────────────────────────────────

it('incrémente failed_login_attempts à chaque échec', function () {
    $tenant = Tenant::factory()->create();
    $user   = User::factory()->create([
        'tenant_id'             => $tenant->id,
        'failed_login_attempts' => 2,
        'is_active'             => true,
    ]);

    $event = new Failed('web', $user, ['email' => $user->email, 'password' => 'wrong']);
    app(RecordFailedLogin::class)->handle($event);

    expect($user->fresh()->failed_login_attempts)->toBe(3)
        ->and($user->fresh()->locked_until)->toBeNull(); // pas encore verrouillé (< 5)
});

it('verrouille le compte après 5 tentatives', function () {
    $tenant = Tenant::factory()->create();
    $user   = User::factory()->create([
        'tenant_id'             => $tenant->id,
        'failed_login_attempts' => 4,
        'is_active'             => true,
    ]);

    $event = new Failed('web', $user, ['email' => $user->email, 'password' => 'wrong']);
    app(RecordFailedLogin::class)->handle($event);

    $fresh = $user->fresh();
    expect($fresh->failed_login_attempts)->toBe(5)
        ->and($fresh->locked_until)->not->toBeNull()
        ->and($fresh->locked_until->isFuture())->toBeTrue();
});

it('gère les tentatives sans utilisateur valide (login inconnu)', function () {
    $event = new Failed('web', null, ['email' => 'inconnu@test.com', 'password' => 'wrong']);

    // Doit s'exécuter sans erreur même sans User
    expect(fn () => app(RecordFailedLogin::class)->handle($event))->not->toThrow(Exception::class);
});
