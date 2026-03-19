<?php

namespace App\Http\Middleware;

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

            // ── Auth + permissions + rôles ────────────────────
            'auth' => $user ? [
                'user' => array_merge($user->toArray(), [
                    'permissions' => $user->getAllPermissions()->pluck('name')->values(),
                    'roles'       => $user->getRoleNames()->values(),
                    'tenant'      => $user->tenant?->only(['id', 'name', 'code']),
                    'avatar_path' => $user->avatar_path
                        ? asset('storage/' . $user->avatar_path)
                        : null,
                ]),
            ] : null,
        ];
    }
}