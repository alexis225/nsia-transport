<?php

use App\Http\Controllers\Auth\MfaSetupController;
use App\Http\Controllers\Auth\SocialAuthController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

// ── Page d'accueil ───────────────────────────────────────────
// Route::inertia('/', 'welcome', [
//     'canRegister' => Features::enabled(Features::registration()),
// ])->name('home');

Route::redirect('/', '/login')->name('home');

// ── Zone authentifiée ────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    
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

    Route::get('/admin/users', fn () => 'ok')->middleware('permission:users.view')->name('admin.users');
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