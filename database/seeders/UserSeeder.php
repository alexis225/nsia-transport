<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('👤 Création des utilisateurs...');

        // Super Admin — pas de tenant
        //$this->createUser(null, 'super_admin', 'Admin', 'DTAG','admin@nsia-groupe.com', 'SuperAdmin@2026!');
        $this->createUser(null, 'super_admin', 'Admin', 'DTAG','jean-louis.goueguy@groupensia.com', 'SuperAdmin@2026!');

        // Un user par rôle par filiale (sauf DTAG)
        $filiales = DB::table('tenants')->where('code', '!=', 'DTAG')->get();

        foreach ($filiales as $tenant) {
            $code = strtolower($tenant->code);
            $this->createUser($tenant->code, 'admin_filiale',  'Admin',        $tenant->code, "admin.{$code}@nsia-{$code}.com",        "Admin@{$tenant->code}2026!");
            $this->createUser($tenant->code, 'souscripteur',   'Souscripteur', $tenant->code, "souscripteur.{$code}@nsia-{$code}.com", "Souscript@{$tenant->code}2026!");
            $this->createUser($tenant->code, 'courtier_local', 'Courtier',     $tenant->code, "courtier.{$code}@nsia-{$code}.com",     "Courtier@{$tenant->code}2026!");
        }

        // Client démo CI
        $this->createUser('CI', 'client', 'Jean', 'Kouassi',
            'jean.kouassi@demo.ci', 'Client@Demo2026!');

        $this->command->info('✅ Utilisateurs créés avec succès.');
    }

    private function createUser(
        ?string $tenantCode,
        string  $role,
        string  $firstName,
        string  $lastName,
        string  $email,
        string  $password,
    ): void {
        // Récupérer le tenant_id UUID via DB::table (pas via modèle)
        $tenantId = null;
        $timezone = 'Africa/Abidjan';

        if ($tenantCode !== null) {
            $tenant = DB::table('tenants')->where('code', $tenantCode)->first();
            if ($tenant) {
                $tenantId = $tenant->id;  // ← UUID string direct depuis PostgreSQL
                $settings = json_decode($tenant->settings, true);
                $timezone = $settings['timezone'] ?? 'Africa/Abidjan';
            }
        }

        // Créer le user via Eloquent (HasUuids génère l'UUID auto)
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'tenant_id'           => $tenantId,
                'first_name'          => $firstName,
                'last_name'           => $lastName,
                'password'            => Hash::make($password),
                'email_verified_at'   => now(),
                'is_active'           => true,
                'locale'              => 'fr',
                'timezone'            => $timezone,
                'password_changed_at' => now(),
            ]
        );

        // Assigner le rôle Spatie
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->syncRoles([$role]);

        $label = $tenantCode ?? 'DTAG (global)';
        $this->command->line("    <info>[{$label}]</info> {$role} → {$email}");
    }
}