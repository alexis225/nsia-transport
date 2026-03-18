<?php

use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserBlockController;
use App\Http\Controllers\Auth\MfaSetupController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

// ── Page d'accueil ───────────────────────────────────────────
// Route::inertia('/', 'welcome', [
//     'canRegister' => Features::enabled(Features::registration()),
// ])->name('home');

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// ── Zone authentifiée ────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
   
    Route::post('/settings/avatar',   [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/settings/avatar', [ProfileController::class, 'removeAvatar'])->name('profile.avatar.remove');
        // Page de setup MFA (dans les paramètres utilisateur)
    Route::get('/user/mfa-setup', [MfaSetupController::class, 'show'])
        ->name('mfa.setup');
 
    // Activer MFA
    Route::post('/user/mfa-setup/enable', [MfaSetupController::class, 'enable'])
        ->name('mfa.enable');
 
    // Désactiver MFA
    Route::delete('/user/mfa-setup/disable', [MfaSetupController::class, 'disable'])
        ->name('mfa.disable');
 
    // Regénérer codes de récupération
    Route::post('/user/mfa-setup/recovery-codes', [MfaSetupController::class, 'regenerateRecoveryCodes'])
        ->name('mfa.recovery-codes.regenerate');

        // ── Utilisateurs — US-003/004 ────────────────────────────
    Route::middleware(['tenant.isolation', 'role:super_admin'])->prefix('admin')->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
        Route::get('/users', fn () => 'ok')->middleware('permission:users.view')->name('users');
        Route::patch('/users/{user}/block', [UserBlockController::class, 'block'])->middleware('permission:users.block')->name('users.block');
        Route::patch('/users/{user}/unblock', [UserBlockController::class, 'unblock'])->middleware('permission:users.unblock')->name('users.unblock');
        Route::get('/roles',              [RoleController::class, 'index'])        ->name('roles.index');
        Route::post('/roles',             [RoleController::class, 'store'])        ->name('roles.store');
        Route::get('/roles/{role}',       [RoleController::class, 'show'])         ->name('roles.show');
        Route::put('/roles/{role}',       [RoleController::class, 'update'])       ->name('roles.update');
        Route::delete('/roles/{role}',    [RoleController::class, 'destroy'])      ->name('roles.destroy');
        Route::post('/roles/assign-user', [RoleController::class, 'assignToUser'])->name('roles.assign-user');
    });
 
});


Route::middleware('guest')->group(function () {

    // Redirection vers Google / Microsoft
    Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])
        ->name('auth.social.redirect')
        ->where('provider', 'google|microsoft');

    // Callback OAuth
    Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])
        ->name('auth.social.callback')
        ->where('provider', 'google|microsoft');
});

require __DIR__.'/settings.php';