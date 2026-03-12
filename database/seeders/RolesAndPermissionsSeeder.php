<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * ============================================================
 * RolesAndPermissionsSeeder
 * ============================================================
 * Crée toutes les permissions et tous les rôles de la plateforme
 * NSIA Transport, puis leur assigne les permissions appropriées.
 *
 * Hiérarchie des rôles :
 *   super_admin        → accès total (Gate::before → true)
 *   admin_filiale      → gestion complète de sa filiale
 *   souscripteur       → création + validation certificats
 *   courtier_local     → soumission certificats de sa filiale
 *   partenaire_etranger→ soumission + consultation multi-pays
 *   client             → consultation uniquement
 *
 * Lancer : php artisan db:seed --class=RolesAndPermissionsSeeder
 * ============================================================
 */
class RolesAndPermissionsSeeder extends Seeder
{
    // ── Toutes les permissions de la plateforme ──────────────
    private array $permissions = [

        // ── Utilisateurs ─────────────────────────────────────
        'user.viewAny',
        'user.view',
        'user.create',
        'user.update',
        'user.delete',
        'user.block',
        'user.unblock',
        'user.resetPassword',
        'user.viewSessions',
        'user.revokeSessions',

        // ── Tenants (filiales) — DTAG uniquement ─────────────
        'tenant.viewAny',
        'tenant.view',
        'tenant.create',
        'tenant.update',
        'tenant.delete',
        'tenant.toggleActive',

        // ── Courtiers ─────────────────────────────────────────
        'broker.viewAny',
        'broker.view',
        'broker.create',
        'broker.update',
        'broker.delete',
        'broker.block',
        'broker.unblock',

        // ── Coassureurs ──────────────────────────────────────
        'coinsurer.viewAny',
        'coinsurer.view',
        'coinsurer.create',
        'coinsurer.update',
        'coinsurer.delete',

        // ── Experts ───────────────────────────────────────────
        'expert.viewAny',
        'expert.view',
        'expert.create',
        'expert.update',
        'expert.delete',

        // ── Référentiels (pays, devises, incoterms...) ────────
        'referential.viewAny',
        'referential.manage',   // create + update + delete

        // ── Contrats d'assurance ──────────────────────────────
        'contract.viewAny',
        'contract.view',
        'contract.create',
        'contract.update',
        'contract.delete',
        'contract.approve',
        'contract.suspend',
        'contract.cancel',
        'contract.viewLimit',

        // ── Certificats ───────────────────────────────────────
        'certificate.viewAny',
        'certificate.view',
        'certificate.create',
        'certificate.update',
        'certificate.submit',
        'certificate.approve',
        'certificate.issue',
        'certificate.cancel',
        'certificate.duplicate',
        'certificate.downloadPdf',
        'certificate.viewHistory',
        'certificate.verifyQr',

        // ── Templates de certificats ──────────────────────────
        'template.viewAny',
        'template.view',
        'template.create',
        'template.update',
        'template.delete',
        'template.setDefault',

        // ── Workflows d'approbation ───────────────────────────
        'workflow.viewAny',
        'workflow.view',
        'workflow.create',
        'workflow.update',
        'workflow.delete',

        // ── Approbations (actions sur les demandes) ───────────
        'approval.viewPending',
        'approval.approve',
        'approval.reject',
        'approval.delegate',

        // ── Commissions ───────────────────────────────────────
        'commission.viewAny',
        'commission.view',
        'commission.create',
        'commission.update',
        'commission.delete',
        'commission.validate',
        'commission.markPaid',

        // ── Rapports ─────────────────────────────────────────
        'report.viewAny',
        'report.view',
        'report.create',
        'report.update',
        'report.delete',
        'report.execute',
        'report.download',

        // ── Notifications ─────────────────────────────────────
        'notification.viewAny',
        'notification.markRead',
        'notification.template.manage',

        // ── Audit ─────────────────────────────────────────────
        'audit.viewAny',
        'audit.view',
        'audit.export',

        // ── Sécurité (IP blacklist) ───────────────────────────
        'security.viewAny',
        'security.manage',

        // ── Catégories marchandises ───────────────────────────
        'merchandise.viewAny',
        'merchandise.manage',

        // ── Dashboard & KPI ───────────────────────────────────
        'dashboard.view',
        'dashboard.viewKpi',
        'dashboard.viewKpiGlobal',  // toutes filiales — DTAG seulement
    ];

    // ── Permissions par rôle ─────────────────────────────────
    private array $rolePermissions = [

        /**
         * SUPER ADMIN (DTAG)
         * Gate::before retourne true → toujours autorisé.
         * On lui assigne quand même toutes les permissions
         * pour que hasPermissionTo() fonctionne aussi.
         */
        'super_admin' => '*', // wildcard = toutes les permissions

        /**
         * ADMIN FILIALE
         * Gestion complète de sa filiale.
         * Ne peut pas gérer les tenants ni les configs globales.
         */
        'admin_filiale' => [
            // Utilisateurs
            'user.viewAny', 'user.view', 'user.create',
            'user.update', 'user.delete', 'user.block',
            'user.unblock', 'user.resetPassword',
            'user.viewSessions', 'user.revokeSessions',
            // Courtiers
            'broker.viewAny', 'broker.view', 'broker.create',
            'broker.update', 'broker.delete', 'broker.block', 'broker.unblock',
            // Coassureurs
            'coinsurer.viewAny', 'coinsurer.view', 'coinsurer.create',
            'coinsurer.update', 'coinsurer.delete',
            // Experts
            'expert.viewAny', 'expert.view', 'expert.create',
            'expert.update', 'expert.delete',
            // Référentiels
            'referential.viewAny', 'referential.manage',
            // Contrats
            'contract.viewAny', 'contract.view', 'contract.create',
            'contract.update', 'contract.delete', 'contract.approve',
            'contract.suspend', 'contract.cancel', 'contract.viewLimit',
            // Certificats
            'certificate.viewAny', 'certificate.view', 'certificate.create',
            'certificate.update', 'certificate.submit', 'certificate.approve',
            'certificate.issue', 'certificate.cancel', 'certificate.duplicate',
            'certificate.downloadPdf', 'certificate.viewHistory', 'certificate.verifyQr',
            // Templates
            'template.viewAny', 'template.view', 'template.create',
            'template.update', 'template.delete', 'template.setDefault',
            // Workflows
            'workflow.viewAny', 'workflow.view', 'workflow.create',
            'workflow.update', 'workflow.delete',
            // Approbations
            'approval.viewPending', 'approval.approve',
            'approval.reject', 'approval.delegate',
            // Commissions
            'commission.viewAny', 'commission.view', 'commission.create',
            'commission.update', 'commission.delete',
            'commission.validate', 'commission.markPaid',
            // Rapports
            'report.viewAny', 'report.view', 'report.create',
            'report.update', 'report.delete', 'report.execute', 'report.download',
            // Notifications
            'notification.viewAny', 'notification.markRead',
            'notification.template.manage',
            // Audit
            'audit.viewAny', 'audit.view', 'audit.export',
            // Sécurité
            'security.viewAny', 'security.manage',
            // Marchandises
            'merchandise.viewAny', 'merchandise.manage',
            // Dashboard
            'dashboard.view', 'dashboard.viewKpi',
        ],

        /**
         * SOUSCRIPTEUR
         * Crée, soumet et valide les certificats.
         * Peut voir les contrats mais pas les modifier.
         */
        'souscripteur' => [
            // Courtiers (lecture)
            'broker.viewAny', 'broker.view',
            // Coassureurs (lecture)
            'coinsurer.viewAny', 'coinsurer.view',
            // Experts (lecture)
            'expert.viewAny', 'expert.view',
            // Référentiels (lecture)
            'referential.viewAny',
            // Contrats (lecture + limite)
            'contract.viewAny', 'contract.view', 'contract.viewLimit',
            // Certificats (tout sauf delete + cancel définitif)
            'certificate.viewAny', 'certificate.view', 'certificate.create',
            'certificate.update', 'certificate.submit', 'certificate.approve',
            'certificate.issue', 'certificate.cancel', 'certificate.duplicate',
            'certificate.downloadPdf', 'certificate.viewHistory', 'certificate.verifyQr',
            // Templates (lecture)
            'template.viewAny', 'template.view',
            // Approbations
            'approval.viewPending', 'approval.approve', 'approval.reject',
            // Commissions (lecture)
            'commission.viewAny', 'commission.view',
            // Rapports (lecture + exécution)
            'report.viewAny', 'report.view', 'report.execute', 'report.download',
            // Notifications
            'notification.viewAny', 'notification.markRead',
            // Marchandises (lecture)
            'merchandise.viewAny',
            // Dashboard
            'dashboard.view', 'dashboard.viewKpi',
        ],

        /**
         * COURTIER LOCAL
         * Soumet des demandes de certificats pour ses clients.
         * Accès limité à sa filiale uniquement.
         */
        'courtier_local' => [
            // Référentiels (lecture)
            'referential.viewAny',
            // Contrats (lecture seule)
            'contract.viewAny', 'contract.view',
            // Certificats (soumission + consultation)
            'certificate.viewAny', 'certificate.view', 'certificate.create',
            'certificate.update', 'certificate.submit',
            'certificate.downloadPdf', 'certificate.viewHistory', 'certificate.verifyQr',
            // Templates (lecture)
            'template.viewAny', 'template.view',
            // Commissions (ses propres commissions)
            'commission.viewAny', 'commission.view',
            // Rapports (lecture seule)
            'report.viewAny', 'report.view', 'report.download',
            // Notifications
            'notification.viewAny', 'notification.markRead',
            // Marchandises (lecture)
            'merchandise.viewAny',
            // Dashboard (limité)
            'dashboard.view',
        ],

        /**
         * PARTENAIRE ÉTRANGER
         * Accès multi-pays, soumission uniquement.
         * Permissions identiques au courtier local + verifyQr.
         */
        'partenaire_etranger' => [
            'referential.viewAny',
            'contract.viewAny', 'contract.view',
            'certificate.viewAny', 'certificate.view', 'certificate.create',
            'certificate.update', 'certificate.submit',
            'certificate.downloadPdf', 'certificate.viewHistory', 'certificate.verifyQr',
            'template.viewAny', 'template.view',
            'commission.viewAny', 'commission.view',
            'report.viewAny', 'report.view', 'report.download',
            'notification.viewAny', 'notification.markRead',
            'merchandise.viewAny',
            'dashboard.view',
        ],

        /**
         * CLIENT
         * Consultation uniquement — ses propres certificats.
         */
        'client' => [
            'certificate.viewAny', 'certificate.view',
            'certificate.downloadPdf', 'certificate.verifyQr',
            'notification.viewAny', 'notification.markRead',
            'dashboard.view',
        ],
    ];

    public function run(): void
    {
        // Vider le cache de permissions spatie
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->command->info('🔐 Création des permissions...');

        // ── Créer toutes les permissions ─────────────────────
        foreach ($this->permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        $this->command->info('✅ ' . count($this->permissions) . ' permissions créées.');
        $this->command->info('👥 Création des rôles et assignation des permissions...');

        // ── Créer les rôles et assigner les permissions ───────
        foreach ($this->rolePermissions as $roleName => $perms) {
            $role = Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web']
            );

            if ($perms === '*') {
                // Super admin reçoit toutes les permissions
                $role->syncPermissions(Permission::all());
                $this->command->line("  → <info>{$roleName}</info> : toutes les permissions");
            } else {
                $role->syncPermissions($perms);
                $this->command->line("  → <info>{$roleName}</info> : " . count($perms) . " permissions");
            }
        }

        // Vider à nouveau le cache après modifications
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->command->info('✅ Rôles et permissions configurés avec succès.');
    }
}