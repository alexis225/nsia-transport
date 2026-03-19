<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\MfaSetupController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;

// ── Accueil → login ──────────────────────────────────────────
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// ── Zone authentifiée ────────────────────────────────────────
Route::middleware(['auth', 'verified', 'tenant.isolation'])->group(function () {

    // Dashboard
    Route::inertia('admin/dashboard', 'dashboard')->name('admin.dashboard');

    // ── MFA Setup — US-002 ───────────────────────────────────
    Route::get('/user/mfa-setup', [MfaSetupController::class, 'show'])
        ->name('user.mfa-setup');
    Route::post('/user/mfa-setup/enable', [MfaSetupController::class, 'enable'])
        ->name('mfa.enable');
    Route::delete('/user/mfa-setup/disable', [MfaSetupController::class, 'disable'])
        ->name('mfa.disable');
    Route::post('/user/mfa-setup/recovery-codes', [MfaSetupController::class, 'regenerateRecoveryCodes'])
        ->name('mfa.recovery-codes.regenerate');

    // ── Avatar — US-009 ──────────────────────────────────────
    Route::post('/settings/avatar', [ProfileController::class, 'updateAvatar'])
        ->name('profile.avatar.update');
    Route::delete('/settings/avatar', [ProfileController::class, 'removeAvatar'])
        ->name('profile.avatar.remove');

    Route::get('/admin/audit-logs', [AuditLogController::class, 'index'])
        ->middleware('permission:audit_logs.view')
        ->name('admin.audit-logs.index');

    Route::get('/admin/audit-logs/export', [AuditLogController::class, 'export'])
        ->middleware('permission:audit_logs.export')
        ->name('admin.audit-logs.export');

    Route::delete('/admin/audit-logs/purge', [AuditLogController::class, 'purge'])
        ->middleware('role:super_admin')
        ->name('admin.audit-logs.purge');

    Route::get('/admin/audit-logs/{auditLog}', [AuditLogController::class, 'show'])
        ->middleware('permission:audit_logs.view')
        ->name('admin.audit-logs.show');

    // ── Module Admin ─────────────────────────────────────────
    Route::prefix('admin')->group(function () {

        // ── Utilisateurs — US-007/008/004 ────────────────────
        Route::get('/users', [UserController::class, 'index'])
            ->middleware('permission:users.view')
            ->name('admin.users.index');

        Route::get('/users/create', [UserController::class, 'create'])
            ->middleware('permission:users.create')
            ->name('admin.users.create');

        Route::post('/users', [UserController::class, 'store'])
            ->middleware('permission:users.create')
            ->name('admin.users.store');

        Route::get('/users/{user}', [UserController::class, 'show'])
            ->middleware('permission:users.view')
            ->name('admin.users.show');

        Route::get('/users/{user}/edit', [UserController::class, 'edit'])
            ->middleware('permission:users.edit')
            ->name('admin.users.edit');

        Route::put('/users/{user}', [UserController::class, 'update'])
            ->middleware('permission:users.edit')
            ->name('admin.users.update');

        Route::delete('/users/{user}', [UserController::class, 'destroy'])
            ->middleware('permission:users.delete')
            ->name('admin.users.destroy');

        Route::patch('/users/{user}/block', [UserController::class, 'block'])
            ->middleware('permission:users.block')
            ->name('admin.users.block');

        Route::patch('/users/{user}/unblock', [UserController::class, 'unblock'])
            ->middleware('permission:users.unblock')
            ->name('admin.users.unblock');

        // ── Rôles & Permissions — US-003 ─────────────────────
        Route::middleware('role:super_admin')->group(function () {

            Route::get('/roles', [RoleController::class, 'index'])
                ->name('admin.roles.index');

            Route::post('/roles', [RoleController::class, 'store'])
                ->name('admin.roles.store');

            Route::get('/roles/{role}', [RoleController::class, 'show'])
                ->name('admin.roles.show');

            Route::put('/roles/{role}', [RoleController::class, 'update'])
                ->name('admin.roles.update');

            Route::delete('/roles/{role}', [RoleController::class, 'destroy'])
                ->name('admin.roles.destroy');

            Route::post('/roles/assign-user', [RoleController::class, 'assignToUser'])
                ->name('admin.roles.assign-user');

            // ── Filiales — US-011 ─────────────────────────────
            Route::get('/tenants', [TenantController::class, 'index'])
                ->name('admin.tenants.index');

            Route::get('/tenants/create', [TenantController::class, 'create'])
                ->name('admin.tenants.create');

            Route::post('/tenants', [TenantController::class, 'store'])
                ->name('admin.tenants.store');

            Route::get('/tenants/{tenant}', [TenantController::class, 'show'])
                ->name('admin.tenants.show');

            Route::get('/tenants/{tenant}/edit', [TenantController::class, 'edit'])
                ->name('admin.tenants.edit');

            Route::put('/tenants/{tenant}', [TenantController::class, 'update'])
                ->name('admin.tenants.update');

            Route::patch('/tenants/{tenant}/toggle', [TenantController::class, 'toggleActive'])
                ->name('admin.tenants.toggle');
            Route::get('/tenants/{tenant}/config', [TenantController::class, 'config'])
    ->name('admin.tenants.config');
        });
    });
});

// ── OAuth Social — US-001 ────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])
        ->name('auth.social.redirect')
        ->where('provider', 'google|microsoft');

    Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])
        ->name('auth.social.callback')
        ->where('provider', 'google|microsoft');
});

require __DIR__.'/settings.php';