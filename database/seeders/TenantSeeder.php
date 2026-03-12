<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🏢 Création des filiales NSIA...');

        $tenants = [
            ['code' => 'DTAG', 'name' => 'NSIA Groupe (DTAG)',  'country_code' => 'CI', 'currency_code' => 'XOF', 'has_state_platform' => false, 'state_platform_name' => null,   'state_platform_api_url' => null,                     'settings' => ['timezone' => 'Africa/Abidjan',      'locale' => 'fr']],
            ['code' => 'CI',   'name' => "NSIA Côte d'Ivoire",  'country_code' => 'CI', 'currency_code' => 'XOF', 'has_state_platform' => true,  'state_platform_name' => 'GUCE',  'state_platform_api_url' => 'https://api.guce.ci/v1',  'settings' => ['timezone' => 'Africa/Abidjan',      'locale' => 'fr']],
            ['code' => 'SN',   'name' => 'NSIA Sénégal',        'country_code' => 'SN', 'currency_code' => 'XOF', 'has_state_platform' => true,  'state_platform_name' => 'ORBUS', 'state_platform_api_url' => 'https://api.orbus.sn/v1', 'settings' => ['timezone' => 'Africa/Dakar',        'locale' => 'fr']],
            ['code' => 'ML',   'name' => 'NSIA Mali',           'country_code' => 'ML', 'currency_code' => 'XOF', 'has_state_platform' => false, 'state_platform_name' => null,   'state_platform_api_url' => null,                     'settings' => ['timezone' => 'Africa/Bamako',       'locale' => 'fr']],
            ['code' => 'BF',   'name' => 'NSIA Burkina Faso',   'country_code' => 'BF', 'currency_code' => 'XOF', 'has_state_platform' => false, 'state_platform_name' => null,   'state_platform_api_url' => null,                     'settings' => ['timezone' => 'Africa/Ouagadougou',  'locale' => 'fr']],
            ['code' => 'GN',   'name' => 'NSIA Guinée',         'country_code' => 'GN', 'currency_code' => 'GNF', 'has_state_platform' => false, 'state_platform_name' => null,   'state_platform_api_url' => null,                     'settings' => ['timezone' => 'Africa/Conakry',      'locale' => 'fr']],
            ['code' => 'TG',   'name' => 'NSIA Togo',           'country_code' => 'TG', 'currency_code' => 'XOF', 'has_state_platform' => false, 'state_platform_name' => null,   'state_platform_api_url' => null,                     'settings' => ['timezone' => 'Africa/Lome',         'locale' => 'fr']],
            ['code' => 'BJ',   'name' => 'NSIA Bénin',          'country_code' => 'BJ', 'currency_code' => 'XOF', 'has_state_platform' => false, 'state_platform_name' => null,   'state_platform_api_url' => null,                     'settings' => ['timezone' => 'Africa/Porto-Novo',   'locale' => 'fr']],
            ['code' => 'CM',   'name' => 'NSIA Cameroun',       'country_code' => 'CM', 'currency_code' => 'XAF', 'has_state_platform' => false, 'state_platform_name' => null,   'state_platform_api_url' => null,                     'settings' => ['timezone' => 'Africa/Douala',       'locale' => 'fr']],
            ['code' => 'CG',   'name' => 'NSIA Congo',          'country_code' => 'CG', 'currency_code' => 'XAF', 'has_state_platform' => true,  'state_platform_name' => 'GUOT',  'state_platform_api_url' => 'https://api.guot.cg/v1',  'settings' => ['timezone' => 'Africa/Brazzaville',  'locale' => 'fr']],
            ['code' => 'GA',   'name' => 'NSIA Gabon',          'country_code' => 'GA', 'currency_code' => 'XAF', 'has_state_platform' => false, 'state_platform_name' => null,   'state_platform_api_url' => null,                     'settings' => ['timezone' => 'Africa/Libreville',   'locale' => 'fr']],
            ['code' => 'MG',   'name' => 'NSIA Madagascar',     'country_code' => 'MG', 'currency_code' => 'MGA', 'has_state_platform' => false, 'state_platform_name' => null,   'state_platform_api_url' => null,                     'settings' => ['timezone' => 'Indian/Antananarivo', 'locale' => 'fr']],
        ];

        foreach ($tenants as $data) {
            if (DB::table('tenants')->where('code', $data['code'])->exists()) {
                $this->command->line("  → <comment>{$data['code']}</comment> déjà existant, ignoré.");
                continue;
            }

            // Générer l'UUID côté PHP — on maîtrise la valeur
            $id = (string) Str::uuid();

            DB::table('tenants')->insert([
                'id'                        => $id,
                'code'                      => $data['code'],
                'name'                      => $data['name'],
                'country_code'              => $data['country_code'],
                'currency_code'             => $data['currency_code'],
                'has_state_platform'        => $data['has_state_platform'],
                'state_platform_name'       => $data['state_platform_name'],
                'state_platform_api_url'    => $data['state_platform_api_url'],
                'is_active'                 => true,
                'settings'                  => json_encode($data['settings']),
                'subscription_limit_config' => json_encode([]),
                'created_at'                => now(),
                'updated_at'                => now(),
            ]);

            $this->command->line("  → <info>{$data['code']}</info> — {$data['name']} ({$id})");
        }

        $this->command->info('✅ ' . count($tenants) . ' filiales traitées.');
    }
}