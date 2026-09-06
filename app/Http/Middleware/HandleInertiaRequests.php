<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),

            'name'        => config('app.name'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

            // Langue resolue par SetLocale + catalogue pour le selecteur.
            // Les traductions elles-memes vivent dans resources/js/locales/
            // et sont chargees par le bundle, pas transmises ici.
            'locale'  => app()->getLocale(),
            'locales' => config('app.locale_names'),

            // ── Auth + permissions + rôles ────────────────────
            'auth' => $user ? [
                'user' => array_merge($user->toArray(), [
                    'permissions' => $user->getAllPermissions()->pluck('name')->values(),
                    'roles'       => $user->getRoleNames()->values(),
                    'tenant'      => $user->tenant ? [
                        ...$user->tenant->only(['id', 'name', 'code']),
                        'modules' => collect(Tenant::MODULES)->keys()
                            ->mapWithKeys(fn ($key) => [$key => $user->tenant->hasModule($key)]),
                    ] : null,
                    'avatar_path' => $user->avatar_path
                        ? asset('storage/' . $user->avatar_path)
                        : null,
                ]),
            ] : null,
        ];
    }
}