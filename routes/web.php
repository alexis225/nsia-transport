<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\BrokerController;
use App\Http\Controllers\Admin\CertificateController;
use App\Http\Controllers\Admin\CertificateTemplateController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InsuranceContractController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\ReferenceController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\MfaSetupController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Public\CertificateVerifyController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;

// ── Accueil → login ──────────────────────────────────────────
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('admin.dashboard');
    }
    return redirect()->route('login');
})->name('home');

// ── Route publique de vérification (sans auth) ────────────────
Route::get('/verify/{token}', [CertificateVerifyController::class, 'show'])
    ->name('certificate.verify')
    ->where('token', '[a-zA-Z0-9]+');


Route::middleware(['auth'])->prefix('admin/notifications')->group(function () {
    // Liste + compteur non lus (polled toutes les 30s)
    Route::get('/', [NotificationController::class, 'index'])
        ->name('admin.notifications.index');
 
    // Marquer toutes comme lues
    Route::patch('/read-all', [NotificationController::class, 'markAllRead'])
        ->name('admin.notifications.read-all');
 
    // Marquer une comme lue
    Route::patch('/{id}/read', [NotificationController::class, 'markRead'])
        ->name('admin.notifications.read');
 
    // Supprimer une notification
    Route::delete('/{id}', [NotificationController::class, 'destroy'])
        ->name('admin.notifications.destroy');
});
// ── Zone authentifiée ────────────────────────────────────────
Route::middleware(['auth', 'verified', 'tenant.isolation'])->group(function () {
    // Dashboard
    Route::inertia('admin/dashboard', 'dashboard')->name('admin.dashboard');
    Route::get('/dashboard/pending',[DashboardController::class, 'pending'])->middleware('permission:certificates.validate')->name('admin.dashboard.pending');
    // ── MFA Setup — US-002 ───────────────────────────────────
    Route::get('/user/mfa-setup', [MfaSetupController::class, 'show'])->name('user.mfa-setup');
    Route::post('/user/mfa-setup/enable', [MfaSetupController::class, 'enable'])->name('mfa.enable');
    Route::delete('/user/mfa-setup/disable', [MfaSetupController::class, 'disable'])->name('mfa.disable');
    Route::post('/user/mfa-setup/recovery-codes', [MfaSetupController::class, 'regenerateRecoveryCodes'])->name('mfa.recovery-codes.regenerate');

    // ── Avatar — US-009 ──────────────────────────────────────
    Route::post('/settings/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/settings/avatar', [ProfileController::class, 'removeAvatar'])->name('profile.avatar.remove');

    Route::get('/admin/audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit_logs.view')->name('admin.audit-logs.index');

    Route::get('/admin/audit-logs/export', [AuditLogController::class, 'export'])->middleware('permission:audit_logs.export')->name('admin.audit-logs.export');

    Route::delete('/admin/audit-logs/purge', [AuditLogController::class, 'purge'])->middleware('role:super_admin')->name('admin.audit-logs.purge');

    Route::get('/admin/audit-logs/{auditLog}', [AuditLogController::class, 'show'])->middleware('permission:audit_logs.view')->name('admin.audit-logs.show');
    // ── INSURANCE CONTRACTS ─────────────────────────────────────────────
    Route::get('/contracts',[InsuranceContractController::class, 'index'])->middleware('permission:contracts.view')->name('admin.contracts.index');

    Route::get('/contracts/create',[InsuranceContractController::class, 'create'])->middleware('permission:contracts.create')->name('admin.contracts.create');

    Route::post('/contracts',[InsuranceContractController::class, 'store'])->middleware('permission:contracts.create')->name('admin.contracts.store');

    Route::get('/contracts/{contract}',[InsuranceContractController::class, 'show'])->middleware('permission:contracts.view')->name('admin.contracts.show');

    Route::get('/contracts/{contract}/edit',[InsuranceContractController::class, 'edit'])->middleware('permission:contracts.edit')->name('admin.contracts.edit');

    Route::put('/contracts/{contract}',[InsuranceContractController::class, 'update'])->middleware('permission:contracts.edit')->name('admin.contracts.update');

    Route::delete('/contracts/{contract}',[InsuranceContractController::class, 'destroy'])->middleware('permission:contracts.delete')->name('admin.contracts.destroy');

    // ── Workflow ──────────────────────────────────────────
    Route::patch('/contracts/{contract}/submit',[InsuranceContractController::class, 'submit'])->middleware('permission:contracts.create')->name('admin.contracts.submit');

    Route::patch('/contracts/{contract}/approve',[InsuranceContractController::class, 'approve'])->middleware('permission:contracts.validate')->name('admin.contracts.approve');

    Route::patch('/contracts/{contract}/reject',[InsuranceContractController::class, 'reject'])->middleware('permission:contracts.validate')->name('admin.contracts.reject');

    Route::patch('/contracts/{contract}/suspend',[InsuranceContractController::class, 'suspend'])->middleware('permission:contracts.edit')->name('admin.contracts.suspend');

    Route::patch('/contracts/{contract}/reactivate',[InsuranceContractController::class, 'reactivate'])->middleware('permission:contracts.validate')->name('admin.contracts.reactivate');

    Route::patch('/contracts/{contract}/cancel',[InsuranceContractController::class, 'cancel'])->middleware('permission:contracts.edit')->name('admin.contracts.cancel');
    // ── Module Admin ─────────────────────────────────────────
        Route::prefix('admin')->group(function () {
           
            Route::get('/certificates/export',[CertificateController::class, 'export'])->middleware('permission:certificates.view')->name('admin.certificates.export');
            // Regénérer le QR token (invalide l'ancien)
            Route::post('/certificates/{certificate}/qr/regenerate',[CertificateController::class, 'regenerateQr'])->middleware('permission:certificates.validate')->name('admin.certificates.qr.regenerate');
            // Télécharger le PDF
            Route::get('/certificates/{certificate}/pdf/download',[CertificateController::class, 'downloadPdf'])->middleware('permission:certificates.view')->name('admin.certificates.pdf.download');
            // Afficher le PDF dans le navigateur
            Route::get('/certificates/{certificate}/pdf/stream',[CertificateController::class, 'streamPdf'])->middleware('permission:certificates.view')->name('admin.certificates.pdf.stream');
            // Regénérer le PDF (force regeneration)
            Route::post('/certificates/{certificate}/pdf/generate',[CertificateController::class, 'generatePdf'])->middleware('permission:certificates.validate')->name('admin.certificates.pdf.generate');
            Route::get('/certificates',[CertificateController::class, 'index'])->middleware('permission:certificates.view')->name('admin.certificates.index');
            // ── US-016 : Soumission ───────────────────────────────
            Route::get('/certificates/create',[CertificateController::class, 'create'])->middleware('permission:certificates.create')->name('admin.certificates.create');
            Route::get('/certificates/{certificate}',[CertificateController::class, 'show'])->middleware('permission:certificates.view')->name('admin.certificates.show');

            Route::delete('/certificates/{certificate}',[CertificateController::class, 'destroy'])->middleware('permission:certificates.create')->name('admin.certificates.destroy');
            Route::post('/certificates',[CertificateController::class, 'store'])->middleware('permission:certificates.create')->name('admin.certificates.store');

            Route::get('/certificates/{certificate}/edit',[CertificateController::class, 'edit'])->middleware('permission:certificates.create')->name('admin.certificates.edit');

            Route::put('/certificates/{certificate}',[CertificateController::class, 'update'])->middleware('permission:certificates.create')->name('admin.certificates.update');

            Route::patch('/certificates/{certificate}/submit',[CertificateController::class, 'submit'])->middleware('permission:certificates.create')->name('admin.certificates.submit');
        
            // ── US-018 : Validation ───────────────────────────────
            Route::patch('/certificates/{certificate}/issue',[CertificateController::class, 'issue'])->middleware('permission:certificates.validate')->name('admin.certificates.issue');

            Route::patch('/certificates/{certificate}/reject',[CertificateController::class, 'reject'])->middleware('permission:certificates.validate')->name('admin.certificates.reject');

            Route::patch('/certificates/{certificate}/cancel',[CertificateController::class, 'cancel'])->middleware('permission:certificates.cancel')->name('admin.certificates.cancel');
        // ── Utilisateurs — US-007/008/004 ────────────────────
            Route::get('/users', [UserController::class, 'index'])->middleware('permission:users.view')->name('admin.users.index');

            Route::get('/users/create', [UserController::class, 'create'])->middleware('permission:users.create')->name('admin.users.create');

            Route::post('/users', [UserController::class, 'store'])->middleware('permission:users.create')->name('admin.users.store');

            Route::get('/users/{user}', [UserController::class, 'show'])->middleware('permission:users.view')->name('admin.users.show');

            Route::get('/users/{user}/edit', [UserController::class, 'edit'])->middleware('permission:users.edit')->name('admin.users.edit');

            Route::put('/users/{user}', [UserController::class, 'update'])->middleware('permission:users.edit')->name('admin.users.update');

            Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete')->name('admin.users.destroy');

            Route::patch('/users/{user}/block', [UserController::class, 'block'])->middleware('permission:users.block')->name('admin.users.block');

            Route::patch('/users/{user}/unblock', [UserController::class, 'unblock'])->middleware('permission:users.unblock')->name('admin.users.unblock');
            Route::get('/brokers', [BrokerController::class, 'index'])->middleware('permission:brokers.view')->name('admin.brokers.index');
        
            Route::get('/brokers/create', [BrokerController::class, 'create'])->middleware('permission:brokers.create')->name('admin.brokers.create');

            Route::post('/brokers', [BrokerController::class, 'store'])->middleware('permission:brokers.create')->name('admin.brokers.store');

            Route::get('/brokers/{broker}', [BrokerController::class, 'show'])->middleware('permission:brokers.view')->name('admin.brokers.show');

            Route::get('/brokers/{broker}/edit', [BrokerController::class, 'edit'])->middleware('permission:brokers.edit')->name('admin.brokers.edit');
        
            Route::put('/brokers/{broker}', [BrokerController::class, 'update'])->middleware('permission:brokers.edit')->name('admin.brokers.update');

            Route::delete('/brokers/{broker}', [BrokerController::class, 'destroy'])->middleware('permission:brokers.delete')->name('admin.brokers.destroy');

            Route::patch('/brokers/{broker}/toggle', [BrokerController::class, 'toggle'])->middleware('permission:brokers.edit')->name('admin.brokers.toggle');
        // ── Rôles & Permissions — US-003 ─────────────────────
        Route::middleware('role:super_admin')->group(function () {

            Route::post('/tenants/{tenant}/logo',   [TenantController::class, 'updateLogo'])->name('admin.tenants.logo.update');
            Route::delete('/tenants/{tenant}/logo', [TenantController::class, 'removeLogo'])->name('admin.tenants.logo.remove');
            Route::get('/roles', [RoleController::class, 'index'])->name('admin.roles.index');

            Route::post('/roles', [RoleController::class, 'store'])->name('admin.roles.store');

            Route::get('/roles/{role}', [RoleController::class, 'show'])->name('admin.roles.show');

            Route::put('/roles/{role}', [RoleController::class, 'update'])->name('admin.roles.update');

            Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('admin.roles.destroy');

            Route::post('/roles/assign-user', [RoleController::class, 'assignToUser'])->name('admin.roles.assign-user');

            // ── Filiales — US-011 ─────────────────────────────
            Route::get('/tenants', [TenantController::class, 'index'])->name('admin.tenants.index');

            Route::get('/tenants/create', [TenantController::class, 'create'])->name('admin.tenants.create');

            Route::post('/tenants', [TenantController::class, 'store'])->name('admin.tenants.store');

            Route::get('/tenants/{tenant}', [TenantController::class, 'show'])->name('admin.tenants.show');

            Route::get('/tenants/{tenant}/edit', [TenantController::class, 'edit'])->name('admin.tenants.edit');

            Route::put('/tenants/{tenant}', [TenantController::class, 'update'])->name('admin.tenants.update');
            Route::patch('/tenants/{tenant}/toggle', [TenantController::class, 'toggleActive'])->name('admin.tenants.toggle');
            Route::get('/tenants/{tenant}/config', [TenantController::class, 'config'])->name('admin.tenants.config');
            //-─ Référentiels — US-010 ─────────────────────────────
            Route::get('/reference', [ReferenceController::class, 'index'])->name('admin.reference.index');
            Route::post('/reference/{tab}',[ReferenceController::class, 'store'])->name('admin.reference.store');
            Route::put('/reference/{tab}/{id}',[ReferenceController::class, 'update'])->name('admin.reference.update');
            Route::patch('/reference/{tab}/{id}/toggle',     [ReferenceController::class, 'toggle'])->name('admin.reference.toggle');
            //Certifcate templates
            Route::get('/certificate-templates',[CertificateTemplateController::class, 'index'])->name('admin.certificate-templates.index');

            Route::get('/certificate-templates/create',[CertificateTemplateController::class, 'create'])->name('admin.certificate-templates.create');

            Route::post('/certificate-templates',[CertificateTemplateController::class, 'store'])->name('admin.certificate-templates.store');

            Route::get('/certificate-templates/{certificateTemplate}',[CertificateTemplateController::class, 'show'])->name('admin.certificate-templates.show');

            Route::get('/certificate-templates/{certificateTemplate}/edit',[CertificateTemplateController::class, 'edit'])->name('admin.certificate-templates.edit');

            Route::put('/certificate-templates/{certificateTemplate}',[CertificateTemplateController::class, 'update'])->name('admin.certificate-templates.update');

            Route::delete('/certificate-templates/{certificateTemplate}',[CertificateTemplateController::class, 'destroy'])->name('admin.certificate-templates.destroy');

            Route::post('/certificate-templates/{certificateTemplate}/logo',[CertificateTemplateController::class, 'updateLogo'])->name('admin.certificate-templates.logo');
            Route::delete('/certificate-templates/{certificateTemplate}/logo',[CertificateTemplateController::class, 'removeLogo'])->name('admin.certificate-templates.logo.remove');
        });
    });
});

// ── OAuth Social — US-001 ────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('auth.social.redirect')->where('provider', 'google|microsoft');
    Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])->name('auth.social.callback')->where('provider', 'google|microsoft');
});

require __DIR__.'/settings.php';