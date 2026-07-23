<?php

use App\Http\Middleware\CheckIpBlacklist;
use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\EnsureModuleEnabled;
use App\Http\Middleware\EnsureStaffAccess;
use App\Http\Middleware\EnsureTenantIsolation;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetTenantContext;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            CheckIpBlacklist::class,  // US-050
        ]);
        $middleware->alias([
            'permission'       => CheckPermission::class,
            'tenant.isolation' => EnsureTenantIsolation::class,
            'staff.only'       => EnsureStaffAccess::class,
            'module'           => EnsureModuleEnabled::class,
            'tenant.context'   => SetTenantContext::class,   // US-052
            'role'             => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
