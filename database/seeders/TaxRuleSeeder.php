<?php

namespace Database\Seeders;

use App\Models\TaxRule;
use App\Models\Tenant;
use App\Models\TransportMode;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * ============================================================
 * TaxRuleSeeder — Référentiel officiel de taxes par filiale
 * ============================================================
 * Barème fourni par la Direction technique (taxe sur prime
 * d'assurance transport, applicable quelle que soit la
 * destination — cf. TaxRule::findApplicable()) :
 *
 *  - NSIA Côte d'Ivoire : Maritime néant, Aérien 7%, Terrestre 14,5%
 *  - NSIA Sénégal       : Maritime 6%, Aérien 6%, Terrestre 14%
 *  - Autres filiales    : taxe unique, tous modes de transport
 * ============================================================
 */
class TaxRuleSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🧾 Référentiel de taxes (barème officiel)...');

        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->first();
        $modes = TransportMode::whereIn('code', ['SEA', 'AIR', 'ROAD'])->get()->keyBy('code');

        // Filiales avec un taux distinct par mode de transport.
        $byMode = [
            'CI' => ['SEA' => 0.00, 'AIR' => 7.00, 'ROAD' => 14.50],
            'SN' => ['SEA' => 6.00, 'AIR' => 6.00, 'ROAD' => 14.00],
        ];

        // Filiales à taxe unique, quel que soit le mode de transport.
        $flat = [
            'CM' => 19.25,
            'GA' => 6.00,
            'TG' => 6.00,
            'ML' => 5.00,
            'CG' => 15.00,
            'GN' => 8.00,
            'GW' => 15.00,
            'BJ' => 6.00,
        ];

        foreach ($byMode as $tenantCode => $rates) {
            $tenant = Tenant::where('code', $tenantCode)->first();
            if (! $tenant) {
                continue;
            }

            foreach ($rates as $modeCode => $rate) {
                $mode = $modes->get($modeCode);
                if (! $mode) {
                    continue;
                }

                $this->upsert($tenant->id, $mode->id, $rate, $admin);
            }
        }

        foreach ($flat as $tenantCode => $rate) {
            $tenant = Tenant::where('code', $tenantCode)->first();
            if (! $tenant) {
                continue;
            }

            // Taxe unique : pas de mode de transport ni de pays de
            // destination spécifiques (règle générique de la filiale).
            $this->upsert($tenant->id, null, $rate, $admin);
        }

        $this->command->info('✅ Référentiel de taxes à jour.');
    }

    private function upsert(string $tenantId, ?int $transportModeId, float $rate, ?User $admin): void
    {
        TaxRule::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'transport_mode_id' => $transportModeId,
                'country_code' => null,
            ],
            [
                'rate_pct' => $rate,
                'effective_date' => now()->toDateString(),
                'end_date' => null,
                'is_active' => true,
                'notes' => 'Barème officiel',
                'created_by' => $admin?->id,
            ]
        );
    }
}
