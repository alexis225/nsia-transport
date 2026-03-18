<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Event;
use SocialiteProviders\Manager\SocialiteWasCalled;
use SocialiteProviders\Microsoft\MicrosoftExtendSocialite;
use Inertia\Inertia;
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        Gate::before(function ($user, $ability) {
            return $user->hasRole('super_admin') ? true : null;
        });
        
        Event::listen(SocialiteWasCalled::class, function (SocialiteWasCalled $event) {
            $event->extendSocialite('microsoft', MicrosoftExtendSocialite::class);
        });

        // Vider le cache Spatie à chaque requête (dev uniquement)
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        Inertia::share([
            'auth' => fn () => auth()->user() ? [
                'user' => array_merge(auth()->user()->toArray(), [
                    'permissions' => auth()->user()->getAllPermissions()->pluck('name'),
                    'roles'       => auth()->user()->getRoleNames(),
                    'tenant'      => auth()->user()->tenant?->only(['id', 'name', 'code']),
                                            'avatar_path' => auth()->user()->avatar_path
                            ? asset('storage/' . auth()->user()->avatar_path)
                            : null,
                ]),
            ] : null,
        ]);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

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
