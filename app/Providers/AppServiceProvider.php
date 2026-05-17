<?php

namespace App\Providers;

use App\Listeners\RecordFailedLogin;
use App\Models\Certificate;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Failed as LoginFailed;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use SocialiteProviders\Manager\SocialiteWasCalled;
use SocialiteProviders\Microsoft\MicrosoftExtendSocialite;
use App\Observers\CertificateObserver;
class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $this->configureDefaults();
        Certificate::observe(CertificateObserver::class);
        // ── Super admin bypass ────────────────────────────────
        Gate::before(function ($user, $ability) {
            if($user->hasRole('super_admin')){
                return true;
            }

            if (\App\Models\UserRoleGrant::hasGrantedPermission($user, $ability)) {
                return true;
            }

            return null;
        });

        // ── US-050 — Détection tentatives de connexion échouées ──
        Event::listen(LoginFailed::class, RecordFailedLogin::class);

        // ── Microsoft Socialite provider ──────────────────────
        Event::listen(SocialiteWasCalled::class, function (SocialiteWasCalled $event) {
            $event->extendSocialite('microsoft', MicrosoftExtendSocialite::class);
        });

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(app()->isProduction());

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}