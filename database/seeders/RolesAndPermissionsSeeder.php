<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * ============================================================
 * RolesAndPermissionsSeeder — US-003
 * ============================================================
 * 6 rôles NSIA + 55 permissions organisées par module.
 * teams=false — isolation tenant gérée par middleware.
 * ============================================================
 */
class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Utilisateurs
            'users.view', 'users.create', 'users.edit',
            'users.block', 'users.unblock', 'users.delete',
            // Courtiers
            'brokers.view', 'brokers.create', 'brokers.edit', 'brokers.delete',
            // Filiales
            'tenants.view', 'tenants.create', 'tenants.edit', 'tenants.delete',
            // Référentiel
            'referential.view', 'referential.create', 'referential.edit', 'referential.delete',
            // Contrats
            'contracts.view', 'contracts.create', 'contracts.edit',
            'contracts.activate', 'contracts.suspend', 'contracts.cancel', 'contracts.amend',
            // Certificats
            'certificates.view', 'certificates.create', 'certificates.edit',
            'certificates.submit', 'certificates.validate', 'certificates.reject',
            'certificates.cancel', 'certificates.duplicate', 'certificates.download',
            'certificates.verify',
            // Workflow
            'workflow.view', 'workflow.approve', 'workflow.reject',
            'workflow.escalate', 'workflow.delegate',
            // Commissions
            'commissions.view', 'commissions.configure', 'commissions.export',
            // Reporting
            'reports.view', 'reports.export',
            'reports.dashboard_filiale', 'reports.dashboard_dtag',
            'reports.certificates', 'reports.contracts', 'reports.brokers',
            // Notifications
            'notifications.view', 'notifications.preferences',
            // Sécurité
            'security.audit_logs', 'security.ip_blacklist',
            // API
            'api.access', 'api.webhooks',
            // Profil
            'profile.view', 'profile.edit', 'profile.mfa',
            'audit_logs.view',
            'audit_logs.export',
            'brokers.view', 'brokers.create', 'brokers.edit', 'brokers.delete'
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ── 1. SUPER ADMIN ────────────────────────────────────
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // ── 2. ADMIN FILIALE ──────────────────────────────────
        $adminFiliale = Role::firstOrCreate(['name' => 'admin_filiale', 'guard_name' => 'web']);
        $adminFiliale->syncPermissions([
            'users.view', 'users.create', 'users.edit', 'users.block',
            'brokers.view', 'brokers.create', 'brokers.edit', 'brokers.delete',
            'referential.view',
            'contracts.view', 'contracts.create', 'contracts.edit',
            'contracts.activate', 'contracts.suspend', 'contracts.cancel', 'contracts.amend',
            'certificates.view', 'certificates.validate', 'certificates.reject',
            'certificates.cancel', 'certificates.download',
            'workflow.view', 'workflow.approve', 'workflow.reject',
            'workflow.escalate', 'workflow.delegate',
            'commissions.view', 'commissions.configure', 'commissions.export',
            'reports.view', 'reports.export', 'reports.dashboard_filiale',
            'reports.certificates', 'reports.contracts', 'reports.brokers',
            'notifications.view', 'notifications.preferences',
            'security.audit_logs',
            'profile.view', 'profile.edit', 'profile.mfa',
        ]);

        // ── 3. SOUSCRIPTEUR ───────────────────────────────────
        $souscripteur = Role::firstOrCreate(['name' => 'souscripteur', 'guard_name' => 'web']);
        $souscripteur->syncPermissions([
            'brokers.view', 'referential.view',
            'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.activate',
            'certificates.view', 'certificates.create', 'certificates.edit',
            'certificates.submit', 'certificates.validate', 'certificates.reject',
            'certificates.cancel', 'certificates.duplicate', 'certificates.download',
            'workflow.view', 'workflow.approve', 'workflow.reject',
            'commissions.view',
            'reports.view', 'reports.dashboard_filiale',
            'reports.certificates', 'reports.contracts',
            'notifications.view', 'notifications.preferences',
            'profile.view', 'profile.edit', 'profile.mfa',
        ]);

        // ── 4. COURTIER LOCAL ─────────────────────────────────
        $courtierLocal = Role::firstOrCreate(['name' => 'courtier_local', 'guard_name' => 'web']);
        $courtierLocal->syncPermissions([
            'referential.view', 'contracts.view',
            'certificates.view', 'certificates.create', 'certificates.edit',
            'certificates.submit', 'certificates.download', 'certificates.duplicate',
            'commissions.view',
            'notifications.view', 'notifications.preferences',
            'profile.view', 'profile.edit', 'profile.mfa',
        ]);

        // ── 5. PARTENAIRE ÉTRANGER ────────────────────────────
        $partenaireEtranger = Role::firstOrCreate(['name' => 'partenaire_etranger', 'guard_name' => 'web']);
        $partenaireEtranger->syncPermissions([
            'referential.view', 'contracts.view',
            'certificates.view', 'certificates.submit', 'certificates.download',
            'notifications.view',
            'profile.view', 'profile.edit', 'profile.mfa',
        ]);

        // ── 6. CLIENT ─────────────────────────────────────────
        $client = Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);
        $client->syncPermissions([
            'certificates.view', 'certificates.download', 'certificates.verify',
            'notifications.view',
            'profile.view', 'profile.edit', 'profile.mfa',
        ]);

        $this->command->info('✓ 6 rôles et ' . count($permissions) . ' permissions seedés.');
    }
}