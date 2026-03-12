<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * ============================================================
 * DatabaseSeeder — Orchestration complète
 * ============================================================
 * Ordre d'exécution strict (dépendances) :
 *
 *  1. TenantSeeder              → filiales NSIA (12 pays + DTAG)
 *  2. ReferentialSeeder         → pays, devises, incoterms, modes transport
 *  3. RolesAndPermissionsSeeder → rôles Spatie + toutes les permissions
 *  4. UserSeeder                → super admin + 1 user par rôle par filiale
 *
 * Lancer tout : php artisan db:seed
 * Lancer un seul : php artisan db:seed --class=UserSeeder
 * ============================================================
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔═══════════════════════════════════════════════╗');
        $this->command->info('║   NSIA Transport — Initialisation des données  ║');
        $this->command->info('╚═══════════════════════════════════════════════╝');
        $this->command->info('');

        $this->call([
            TenantSeeder::class,             // 1. filiales
            ReferentialSeeder::class,        // 2. référentiels
            RolesAndPermissionsSeeder::class, // 3. rôles & permissions
            UserSeeder::class,               // 4. utilisateurs
        ]);

        $this->command->info('');
        $this->command->info('✅ Base de données initialisée avec succès !');
        $this->command->info('');
        $this->command->table(
            ['Rôle', 'Email', 'Filiale', 'Mot de passe'],
            [
                ['super_admin',       'admin@nsia-groupe.com',           'Global (DTAG)', 'SuperAdmin@2026!'],
                ['admin_filiale',     'admin.ci@nsia-ci.com',            'Côte dIvoire', 'Admin@CI2026!'],
                ['souscripteur',      'souscripteur.ci@nsia-ci.com',     'Côte d\'Ivoire', 'Souscript@CI2026!'],
                ['courtier_local',    'courtier.ci@nsia-ci.com',         'Côte d\'Ivoire', 'Courtier@CI2026!'],
                ['client',            'jean.kouassi@demo.ci',            'Côte d\'Ivoire', 'Client@Demo2026!'],
            ]
        );
        $this->command->info('  ⚠️  Changez ces mots de passe avant la mise en production !');
        $this->command->info('');
    }
}