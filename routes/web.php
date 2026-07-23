<?php

use App\Http\Controllers\Admin\ApprovalWorkflowController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\BrokerController;
use App\Http\Controllers\Admin\CertificateController;
use App\Http\Controllers\Admin\CertificateRequestController;
use App\Http\Controllers\Admin\CertificateTemplateController;
use App\Http\Controllers\Admin\ContractAmendmentController;
use App\Http\Controllers\Admin\ContractLimitController;
use App\Http\Controllers\Admin\DelegationController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\CertificateReportController;
use App\Http\Controllers\Admin\AsyncExportController;
use App\Http\Controllers\Admin\CertificateSearchController;
use App\Http\Controllers\Admin\ContractReportController;
use App\Http\Controllers\Admin\DtagDashboardController;
use App\Http\Controllers\Admin\IntermediaryReportController;
use App\Http\Controllers\Admin\IpBlacklistController;
use App\Http\Controllers\Admin\KpiDashboardController;
use App\Http\Controllers\Admin\InsuranceContractController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\ReferenceController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\MfaSetupController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Admin\CertificateVerifyController;
use App\Http\Controllers\Admin\CoinsurersController;
use App\Http\Controllers\Admin\CommissionController;
use App\Http\Controllers\Admin\ExpertController;
use App\Http\Controllers\Admin\NotificationCenterController;
use App\Http\Controllers\Admin\GuceCertificateController;
use App\Http\Controllers\Admin\TaxRuleController;
use App\Http\Controllers\Partner\CertificateRequestController as PartnerCertificateRequestController;
use App\Http\Controllers\Partner\PartnerDashboardController;
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
Route::get('/verify/{token}', [CertificateVerifyController::class, 'show'])->name('certificate.verify')->where('token', '[a-zA-Z0-9]+');

// ── Alias dashboard (compatibilité Fortify / boilerplate tests) ─
Route::get('/dashboard', function () {
    if (! auth()->check()) {
        return redirect()->route('login');
    }
    return redirect()->route('admin.dashboard');
})->name('dashboard');



// ── Zone authentifiée ────────────────────────────────────────
Route::middleware(['auth', 'verified', 'tenant.isolation', 'staff.only'])->group(function () {
    Route::prefix('admin/commissions')->name('admin.commissions.')->middleware('module:commissions')->group(function(){
        Route::get('/rules',                 [CommissionController::class, 'rules'])      ->name('rules');
        Route::post('/rules',                [CommissionController::class, 'storeRule'])  ->name('rules.store');
        Route::patch('/rules/{rule}/toggle', [CommissionController::class, 'toggleRule']) ->name('rules.toggle');
        Route::get('/bordereau',             [CommissionController::class, 'bordereau'])  ->name('bordereau');
        Route::get('/export/{format}',       [CommissionController::class, 'export'])     ->name('export');

    });
    Route::prefix('admin/taxes')->name('admin.taxes.')->middleware('module:taxes')->group(function () {
        Route::get('/rules',                 [TaxRuleController::class, 'rules'])      ->name('rules');
        Route::post('/rules',                [TaxRuleController::class, 'storeRule'])  ->name('rules.store');
        Route::patch('/rules/{rule}/toggle', [TaxRuleController::class, 'toggleRule']) ->name('rules.toggle');
    });
    Route::prefix('admin/notifications/feed')->name('admin.notifications.feed.')->middleware('module:notifications')->group(function () {
        // Liste + compteur non lus (polled toutes les 30s)
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        // Marquer toutes comme lues
        Route::patch('/read-all', [NotificationController::class, 'markAllRead'])->name('markAllRead');
        // Marquer une comme lue
        Route::patch('/{id}/read', [NotificationController::class, 'markRead'])->name('markRead');
        // Supprimer une notification
        Route::delete('/{id}', [NotificationController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('admin/notifications')->name('admin.notifications.')->middleware('module:notifications')->group(function () {
       
            Route::get('/',[NotificationCenterController::class, 'index'])->name('index');
                // GET /admin/notifications
            Route::patch('/mark-all-read',[NotificationCenterController::class, 'markAllRead'])->name('markAllRead');
                // PATCH /admin/notifications/mark-all-read
            Route::delete('/clear-read',[NotificationCenterController::class, 'clearRead'])->name('clearRead');
            // DELETE /admin/notifications/clear-read
            Route::post('/preferences',[NotificationCenterController::class, 'savePreferences'])->name('preferences');

    });
    Route::prefix('admin/contracts/{contract}/amendments')->name('admin.contracts.amendments.')->middleware('module:contracts')->group(function () {
        Route::get('/',[ContractAmendmentController::class, 'index'])->middleware('permission:contracts.view')->name('index');
        Route::get('/create',[ContractAmendmentController::class, 'create'])->middleware('permission:contracts.edit')->name('create');
        Route::post('/',[ContractAmendmentController::class, 'store'])->middleware('permission:contracts.edit')->name('store');
        Route::get('/{amendment}',[ContractAmendmentController::class, 'show'])->middleware('permission:contracts.view')->name('show');
        Route::patch('/{amendment}/submit',[ContractAmendmentController::class, 'submit'])->middleware('permission:contracts.edit')->name('submit');
        Route::patch('/{amendment}/approve',[ContractAmendmentController::class, 'approve'])->middleware('permission:contracts.validate')->name('approve');
        Route::patch('/{amendment}/reject',[ContractAmendmentController::class, 'reject'])->middleware('permission:contracts.validate')->name('reject');
    });
  
    //Approval Workflow
    Route::prefix('admin/approvals')->name('admin.approvals.')->middleware('module:approvals')->group(function () {
        Route::get('/',[ApprovalWorkflowController::class, 'index'])->name('index');
        // Gestion des seuils & validations hiérarchiques par filiale
        Route::get('/configs',[ApprovalWorkflowController::class, 'configs'])->name('configs');
        Route::post('/configs',[ApprovalWorkflowController::class, 'storeConfig'])->name('configs.store');
        Route::patch('/configs/{config}',[ApprovalWorkflowController::class, 'updateConfig'])->name('configs.update');
        Route::patch('/configs/{config}/toggle',[ApprovalWorkflowController::class, 'toggleConfig'])->name('configs.toggle');
        Route::delete('/configs/{config}',[ApprovalWorkflowController::class, 'destroyConfig'])->name('configs.destroy');
        Route::get('/{workflow}',[ApprovalWorkflowController::class, 'show'])->name('show');
        Route::patch('/{workflow}/approve',[ApprovalWorkflowController::class, 'approve'])->name('approve');
        Route::patch('/{workflow}/reject',[ApprovalWorkflowController::class, 'reject'])->name('reject');
    });

    Route::prefix('admin/delegations')->name('admin.delegations.')->middleware('module:delegations')->group(function () {
        Route::get('/',                [DelegationController::class, 'index'])->name('index');
        Route::post('/',               [DelegationController::class, 'store'])->name('store');
        Route::patch('/{grant}/revoke',[DelegationController::class, 'revoke'])->name('revoke');
    });
    // Page tableau de bord plafonds multi-contrats
    Route::get('/contracts/limits',[ContractLimitController::class, 'index'])->middleware(['permission:contracts.view', 'module:contracts'])->name('admin.contracts.limits');
    // API polling — état plafond d'un contrat
    Route::get('/contracts/{contract}/limit-status',[ContractLimitController::class, 'status'])->middleware(['permission:contracts.view', 'module:contracts'])->name('admin.contracts.limit-status');
    // Dashboard
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/dashboard/pending',[DashboardController::class, 'pending'])->middleware('permission:certificates.validate')->name('admin.dashboard.pending');
    // US-043 — Dashboard KPIs filiale
    Route::get('/admin/dashboard/kpi',[KpiDashboardController::class, 'index'])->middleware(['permission:certificates.view', 'module:kpi'])->name('admin.dashboard.kpi');
    // US-044 — État des certificats par période
    Route::get('/admin/reports/certificates',[CertificateReportController::class, 'index'])->middleware(['permission:certificates.view', 'module:reports'])->name('admin.reports.certificates');
    // US-045 — État des contrats
    Route::get('/admin/reports/contracts',[ContractReportController::class, 'index'])->middleware(['permission:contracts.view', 'module:reports'])->name('admin.reports.contracts');
    // US-046 — État des intermédiaires
    Route::get('/admin/reports/intermediaries',[IntermediaryReportController::class, 'index'])->middleware(['permission:brokers.view', 'module:reports'])->name('admin.reports.intermediaries');
    // US-047 — Export asynchrone
    Route::middleware('module:exports')->group(function () {
        Route::get('/admin/exports',                        [AsyncExportController::class, 'index'])           ->middleware('permission:certificates.view')->name('admin.exports.index');
        Route::post('/admin/exports/certificates',          [AsyncExportController::class, 'dispatchCertificates'])->middleware('permission:certificates.view')->name('admin.exports.dispatch');
        Route::get('/admin/exports/{execution}/download',   [AsyncExportController::class, 'download'])        ->middleware('permission:certificates.view')->name('admin.exports.download');
        Route::get('/admin/exports/{execution}/status',     [AsyncExportController::class, 'status'])          ->middleware('permission:certificates.view')->name('admin.exports.status');
        Route::delete('/admin/exports/{execution}',         [AsyncExportController::class, 'destroy'])         ->middleware('permission:certificates.view')->name('admin.exports.destroy');
    });
    // US-048 — Dashboard DTAG multi-filiales
    Route::get('/admin/dashboard/dtag', [DtagDashboardController::class, 'index'])->middleware('role:super_admin')->name('admin.dashboard.dtag');
    // US-050 — IP Blacklist
    Route::prefix('admin/security/ip-blacklist')->name('admin.security.ip-blacklist.')->middleware('role:super_admin')->group(function () {
        Route::get('/',          [IpBlacklistController::class, 'index'])  ->name('index');
        Route::post('/',         [IpBlacklistController::class, 'store'])  ->name('store');
        Route::delete('/{id}',   [IpBlacklistController::class, 'destroy'])->name('destroy');
        Route::patch('/unlock/{userId}', [IpBlacklistController::class, 'unlockUser'])->name('unlock');
    });
    // US-055 — Recherche avancée certificats
    Route::get('/admin/certificates/search', [CertificateSearchController::class, 'index'])->middleware(['permission:certificates.view', 'module:certificates'])->name('admin.certificates.search');

    // Certificats GUCE (import depuis plateformes étatiques)
    Route::prefix('admin/guce-certificates')->name('admin.guce-certificates.')->middleware(['auth', 'module:guce_certificates'])->group(function () {
        Route::get('/',                              [GuceCertificateController::class, 'index'])   ->name('index');
        Route::get('/create',                        [GuceCertificateController::class, 'create'])  ->name('create');
        Route::post('/extract',                      [GuceCertificateController::class, 'extract']) ->name('extract');
        Route::post('/',                             [GuceCertificateController::class, 'store'])   ->name('store');
        Route::get('/{guceCertificate}',             [GuceCertificateController::class, 'show'])    ->name('show');
        Route::get('/{guceCertificate}/download',    [GuceCertificateController::class, 'download'])->name('download');
        Route::delete('/{guceCertificate}',          [GuceCertificateController::class, 'destroy']) ->name('destroy');
    });
    // ── MFA Setup — US-002 ───────────────────────────────────
    Route::get('/user/mfa-setup', [MfaSetupController::class, 'show'])->name('user.mfa-setup');
    Route::post('/user/mfa-setup/enable', [MfaSetupController::class, 'enable'])->name('mfa.enable');
    Route::delete('/user/mfa-setup/disable', [MfaSetupController::class, 'disable'])->name('mfa.disable');
    Route::post('/user/mfa-setup/recovery-codes', [MfaSetupController::class, 'regenerateRecoveryCodes'])->name('mfa.recovery-codes.regenerate');
    // ── Avatar — US-009 ──────────────────────────────────────
    Route::post('/settings/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/settings/avatar', [ProfileController::class, 'removeAvatar'])->name('profile.avatar.remove');

    Route::middleware('module:audit_logs')->group(function () {
        Route::get('/admin/audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit_logs.view')->name('admin.audit-logs.index');

        Route::get('/admin/audit-logs/export', [AuditLogController::class, 'export'])->middleware('permission:audit_logs.export')->name('admin.audit-logs.export');

        Route::delete('/admin/audit-logs/purge', [AuditLogController::class, 'purge'])->middleware('role:super_admin')->name('admin.audit-logs.purge');

        Route::get('/admin/audit-logs/{auditLog}', [AuditLogController::class, 'show'])->middleware('permission:audit_logs.view')->name('admin.audit-logs.show');
    });
    // ── INSURANCE CONTRACTS ─────────────────────────────────────────────
    Route::middleware('module:contracts')->group(function () {
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
    });
    // ── Module Admin ─────────────────────────────────────────
        Route::prefix('admin')->group(function () {
           
            Route::middleware('module:certificates')->group(function () {
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
                Route::get('/certificates/print-models',[CertificateController::class, 'printModels'])->middleware('permission:certificates.view')->name('admin.certificates.print-models');

                Route::post('/certificates/{certificate}/duplicate',[CertificateController::class, 'duplicate'])->middleware('permission:certificates.create')->name('admin.certificates.duplicate');

                Route::get('/certificates/{certificate}',[CertificateController::class, 'show'])->middleware('permission:certificates.view')->name('admin.certificates.show');
                Route::get('/certificates/{certificate}/print',[CertificateController::class, 'print'])->middleware('permission:certificates.view')->name('admin.certificates.print');

                Route::delete('/certificates/{certificate}',[CertificateController::class, 'destroy'])->middleware('permission:certificates.create')->name('admin.certificates.destroy');
                Route::post('/certificates',[CertificateController::class, 'store'])->middleware('permission:certificates.create')->name('admin.certificates.store');

                Route::get('/certificates/{certificate}/edit',[CertificateController::class, 'edit'])->middleware('permission:certificates.create')->name('admin.certificates.edit');

                Route::put('/certificates/{certificate}',[CertificateController::class, 'update'])->middleware('permission:certificates.create')->name('admin.certificates.update');

                Route::patch('/certificates/{certificate}/submit',[CertificateController::class, 'submit'])->middleware('permission:certificates.create')->name('admin.certificates.submit');

                // ── US-018 : Validation ───────────────────────────────
                Route::patch('/certificates/{certificate}/issue',[CertificateController::class, 'issue'])->middleware('permission:certificates.validate')->name('admin.certificates.issue');

                Route::patch('/certificates/{certificate}/reject',[CertificateController::class, 'reject'])->middleware('permission:certificates.validate')->name('admin.certificates.reject');

                Route::patch('/certificates/{certificate}/cancel',[CertificateController::class, 'cancel'])->middleware('permission:certificates.cancel')->name('admin.certificates.cancel');
            });

            // ── Demandes de certificat (espace partenaire) ────────
            Route::middleware('module:brokers')->group(function () {
                Route::get('/certificate-requests',[CertificateRequestController::class, 'index'])->middleware('permission:certificates.view')->name('admin.certificate-requests.index');
                Route::get('/certificate-requests/{certificateRequest}',[CertificateRequestController::class, 'show'])->middleware('permission:certificates.view')->name('admin.certificate-requests.show');
                Route::patch('/certificate-requests/{certificateRequest}/assign',[CertificateRequestController::class, 'assign'])->middleware('permission:certificates.validate')->name('admin.certificate-requests.assign');
                Route::patch('/certificate-requests/{certificateRequest}/approve',[CertificateRequestController::class, 'approve'])->middleware('permission:certificates.validate')->name('admin.certificate-requests.approve');
                Route::patch('/certificate-requests/{certificateRequest}/reject',[CertificateRequestController::class, 'reject'])->middleware('permission:certificates.validate')->name('admin.certificate-requests.reject');
                Route::patch('/certificate-requests/{certificateRequest}/link-certificate',[CertificateRequestController::class, 'linkCertificate'])->middleware('permission:certificates.validate')->name('admin.certificate-requests.link-certificate');
                Route::get('/certificate-requests/{certificateRequest}/documents/{document}/download',[CertificateRequestController::class, 'downloadDocument'])->middleware('permission:certificates.view')->name('admin.certificate-requests.documents.download');
            });
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
            Route::middleware('module:brokers')->group(function () {
                Route::get('/brokers', [BrokerController::class, 'index'])->middleware('permission:brokers.view')->name('admin.brokers.index');

                Route::get('/brokers/create', [BrokerController::class, 'create'])->middleware('permission:brokers.create')->name('admin.brokers.create');

                Route::post('/brokers', [BrokerController::class, 'store'])->middleware('permission:brokers.create')->name('admin.brokers.store');

                Route::get('/brokers/{broker}', [BrokerController::class, 'show'])->middleware('permission:brokers.view')->name('admin.brokers.show');

                Route::get('/brokers/{broker}/edit', [BrokerController::class, 'edit'])->middleware('permission:brokers.edit')->name('admin.brokers.edit');

                Route::put('/brokers/{broker}', [BrokerController::class, 'update'])->middleware('permission:brokers.edit')->name('admin.brokers.update');

                Route::delete('/brokers/{broker}', [BrokerController::class, 'destroy'])->middleware('permission:brokers.delete')->name('admin.brokers.destroy');

                Route::patch('/brokers/{broker}/toggle', [BrokerController::class, 'toggle'])->middleware('permission:brokers.edit')->name('admin.brokers.toggle');
            });

            // ── Coassureurs — US-041 ──────────────────────────
            Route::middleware('module:coinsurers')->group(function () {
                Route::get('/coinsurers', [CoinsurersController::class, 'index'])->middleware('permission:coinsurers.view')->name('admin.coinsurers.index');
                Route::get('/coinsurers/create', [CoinsurersController::class, 'create'])->middleware('permission:coinsurers.create')->name('admin.coinsurers.create');
                Route::post('/coinsurers', [CoinsurersController::class, 'store'])->middleware('permission:coinsurers.create')->name('admin.coinsurers.store');
                Route::get('/coinsurers/{coinsurer}', [CoinsurersController::class, 'show'])->middleware('permission:coinsurers.view')->name('admin.coinsurers.show');
                Route::get('/coinsurers/{coinsurer}/edit', [CoinsurersController::class, 'edit'])->middleware('permission:coinsurers.edit')->name('admin.coinsurers.edit');
                Route::put('/coinsurers/{coinsurer}', [CoinsurersController::class, 'update'])->middleware('permission:coinsurers.edit')->name('admin.coinsurers.update');
                Route::delete('/coinsurers/{coinsurer}', [CoinsurersController::class, 'destroy'])->middleware('permission:coinsurers.delete')->name('admin.coinsurers.destroy');
                Route::patch('/coinsurers/{coinsurer}/toggle', [CoinsurersController::class, 'toggle'])->middleware('permission:coinsurers.edit')->name('admin.coinsurers.toggle');
            });

            // ── Experts — US-042 ──────────────────────────────
            Route::middleware('module:experts')->group(function () {
                Route::get('/experts', [ExpertController::class, 'index'])->middleware('permission:experts.view')->name('admin.experts.index');
                Route::get('/experts/create', [ExpertController::class, 'create'])->middleware('permission:experts.create')->name('admin.experts.create');
                Route::post('/experts', [ExpertController::class, 'store'])->middleware('permission:experts.create')->name('admin.experts.store');
                Route::get('/experts/{expert}', [ExpertController::class, 'show'])->middleware('permission:experts.view')->name('admin.experts.show');
                Route::get('/experts/{expert}/edit', [ExpertController::class, 'edit'])->middleware('permission:experts.edit')->name('admin.experts.edit');
                Route::put('/experts/{expert}', [ExpertController::class, 'update'])->middleware('permission:experts.edit')->name('admin.experts.update');
                Route::delete('/experts/{expert}', [ExpertController::class, 'destroy'])->middleware('permission:experts.delete')->name('admin.experts.destroy');
                Route::patch('/experts/{expert}/toggle', [ExpertController::class, 'toggle'])->middleware('permission:experts.edit')->name('admin.experts.toggle');
            });

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
            Route::patch('/tenants/{tenant}/modules', [TenantController::class, 'updateModules'])->name('admin.tenants.modules');
            //-─ Référentiels — US-010 ─────────────────────────────
            Route::get('/reference', [ReferenceController::class, 'index'])->name('admin.reference.index');
            Route::post('/reference/{tab}',[ReferenceController::class, 'store'])->name('admin.reference.store');
            Route::put('/reference/{tab}/{id}',[ReferenceController::class, 'update'])->name('admin.reference.update');
            Route::patch('/reference/{tab}/{id}/toggle',     [ReferenceController::class, 'toggle'])->name('admin.reference.toggle');
            //Certifcate templates
            Route::middleware('module:certificate_templates')->group(function () {
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
});

// ── Espace partenaire / courtier ──────────────────────────────
Route::middleware(['auth', 'verified', 'tenant.isolation', 'role:courtier_local|partenaire_etranger', 'module:brokers'])
    ->prefix('partner')->name('partner.')->group(function () {
        Route::get('/', [PartnerDashboardController::class, 'index'])->name('dashboard');

        Route::get('/certificates', [PartnerCertificateRequestController::class, 'certificates'])->name('certificates.index');

        Route::prefix('certificate-requests')->name('certificate-requests.')->group(function () {
            Route::get('/',       [PartnerCertificateRequestController::class, 'index'])->name('index');
            Route::get('/create', [PartnerCertificateRequestController::class, 'create'])->name('create');
            Route::post('/',      [PartnerCertificateRequestController::class, 'store'])->name('store');
            Route::get('/{certificateRequest}', [PartnerCertificateRequestController::class, 'show'])->name('show');
            Route::delete('/{certificateRequest}', [PartnerCertificateRequestController::class, 'destroy'])->name('destroy');
            Route::get('/{certificateRequest}/documents/{document}/download',
                [PartnerCertificateRequestController::class, 'downloadDocument'])->name('documents.download');
            Route::get('/{certificateRequest}/certificate/download',
                [PartnerCertificateRequestController::class, 'downloadCertificate'])->name('certificate.download');
            Route::get('/{certificateRequest}/guce-certificate/download',
                [PartnerCertificateRequestController::class, 'downloadGuceCertificate'])->name('guce-certificate.download');
        });

        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
        Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    });

// ── OAuth Social — US-001 ────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('auth.social.redirect')->where('provider', 'google|microsoft');
    Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])->name('auth.social.callback')->where('provider', 'google|microsoft');
});

require __DIR__.'/settings.php';