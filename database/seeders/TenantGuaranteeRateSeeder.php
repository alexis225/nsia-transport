<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TaxRule;
use App\Models\TenantGuaranteeRate;
use App\Models\TransportMode;
use Illuminate\Database\Seeder;

/**
 * ============================================================
 * TenantGuaranteeRateSeeder
 * ============================================================
 * Tarifs minimum réglementaires par filiale NSIA et par garantie
 * (FAP Sauf / Tous Risques), et taux de taxe par défaut par
 * filiale × mode de transport (indépendant du pays de
 * destination) — barème fourni par le Groupe (NSIA), applicable
 * à toutes les catégories de marchandise, "selon les
 * réglementations locales par pays".
 *
 * Les fourchettes "[1500 FCFA - 2 500 FCFA]" du barème sont
 * interprétées comme plancher = la borne basse (1 500 FCFA) ;
 * la fourchette complète est conservée en note pour référence.
 * ============================================================
 */
class TenantGuaranteeRateSeeder extends Seeder
{
    public function run(): void
    {
        // ── Tarifs minimum par garantie ────────────────────────
        // [code_filiale, taux_min_fap_sauf, taux_min_tous_risques,
        //  accessoires_min_fap_sauf, accessoires_min_tous_risques,
        //  prime_nette_min_fap_sauf, prime_nette_min_tous_risques, notes]
        $barème = [
            // ** Obligation d'assurance locale + taux minimum FAP Sauf
            ['CI', 0.15, 0.20, 2500,  2500,  5000,   5000,   'Accessoires : dont 500 FCFA de quote-part ASAC.'],
            ['CM', 0.20, 0.20, 3100,  3100,  10000,  10000,  'Accessoires : dont 600 FCFA de quote-part ASAC (maximum à intégrer).'],
            ['SN', 0.15, 0.20, 1500,  1500,  5000,   5000,   'Accessoires : fourchette réglementaire 1 500 – 2 500 FCFA, plancher retenu 1 500 FCFA.'],
            ['CG', 0.20, 0.35, 25000, 25000, 10000,  17500,  'Accessoires : dont 15 000 FCFA de quote-part GUOT. Prime nette minimum distincte par garantie (FAP Sauf 10 000 / Tous Risques 17 500 FCFA).'],
            ['GN', 0.15, 0.25, 50000, 50000, 250000, 250000, 'Montants en Franc guinéen (GNF).'],
            ['GW', 0.15, 0.20, 1500,  1500,  5000,   5000,   'Accessoires : fourchette réglementaire 1 500 – 2 500 FCFA, plancher retenu 1 500 FCFA.'],
            // * Obligation d'assurance locale (sans taux minimum FAP Sauf spécifique au-delà du barème commun)
            ['GA', 0.15, 0.20, 1500,  1500,  5000,   5000,   'Accessoires : fourchette réglementaire 1 500 – 2 500 FCFA, plancher retenu 1 500 FCFA.'],
            // Sans astérisque — pas d'obligation d'assurance locale mais barème minimum applicable
            ['TG', 0.15, 0.20, 1500,  1500,  5000,   5000,   'Accessoires : fourchette réglementaire 1 500 – 2 500 FCFA, plancher retenu 1 500 FCFA.'],
            ['ML', 0.15, 0.20, 1500,  1500,  5000,   5000,   'Accessoires : fourchette réglementaire 1 500 – 2 500 FCFA, plancher retenu 1 500 FCFA.'],
            ['BJ', 0.15, 0.20, 1500,  1500,  5000,   5000,   'Accessoires : fourchette réglementaire 1 500 – 2 500 FCFA, plancher retenu 1 500 FCFA.'],
        ];

        foreach ($barème as [$code, $fapSauf, $tousRisques, $accFapSauf, $accTousRisques, $pnFapSauf, $pnTousRisques, $notes]) {
            $tenant = Tenant::where('code', $code)->first();
            if (! $tenant) continue;

            TenantGuaranteeRate::updateOrCreate(
                ['tenant_id' => $tenant->id, 'coverage_type' => TenantGuaranteeRate::COVERAGE_FAP_SAUF],
                [
                    'min_rate_pct'           => $fapSauf,
                    'min_accessories_amount' => $accFapSauf,
                    'min_net_premium'        => $pnFapSauf,
                    'notes'                  => $notes,
                ]
            );

            TenantGuaranteeRate::updateOrCreate(
                ['tenant_id' => $tenant->id, 'coverage_type' => TenantGuaranteeRate::COVERAGE_TOUS_RISQUES],
                [
                    'min_rate_pct'           => $tousRisques,
                    'min_accessories_amount' => $accTousRisques,
                    'min_net_premium'        => $pnTousRisques,
                    'notes'                  => $notes,
                ]
            );
        }

        $this->seedDefaultTaxRules();
    }

    // ── Taux de taxe par défaut par filiale × mode de transport ──
    private function seedDefaultTaxRules(): void
    {
        $modes = TransportMode::whereIn('code', ['SEA', 'AIR', 'ROAD'])->get()->keyBy('code');
        $sea = $modes['SEA']?->id;
        $air = $modes['AIR']?->id;
        $road = $modes['ROAD']?->id;

        // Anciennes données de démo (mêmes valeurs 3.5/5/2 % dupliquées à
        // l'identique sur toutes les filiales) désactivées plutôt que
        // supprimées, remplacées par le barème réel ci-dessous.
        TaxRule::query()->update(['is_active' => false]);

        // ── Taux différenciés par mode de transport ──
        $parMode = [
            'CI' => ['SEA' => 0,    'AIR' => 7,    'ROAD' => 14.5],
            'SN' => ['SEA' => 6,    'AIR' => 6,    'ROAD' => 14],
        ];

        foreach ($parMode as $code => $rates) {
            $tenant = Tenant::where('code', $code)->first();
            if (! $tenant) continue;

            foreach (['SEA' => $sea, 'AIR' => $air, 'ROAD' => $road] as $modeCode => $modeId) {
                if (! $modeId) continue;

                TaxRule::updateOrCreate(
                    ['tenant_id' => $tenant->id, 'transport_mode_id' => $modeId, 'country_code' => null],
                    [
                        'rate_pct'       => $rates[$modeCode],
                        'effective_date' => now()->startOfYear(),
                        'end_date'       => null,
                        'is_active'      => true,
                        'notes'          => 'Taux par défaut par mode de transport (barème Groupe) — indépendant du pays de destination.',
                    ]
                );
            }
        }

        // ── Taxe unique, tous modes de transport ──
        $unique = [
            'CM' => 19.25,
            'GA' => 6,
            'TG' => 6,
            'ML' => 5,
            'CG' => 15,
            'GN' => 8,
            'GW' => 15,
            'BJ' => 6,
        ];

        foreach ($unique as $code => $ratePct) {
            $tenant = Tenant::where('code', $code)->first();
            if (! $tenant) continue;

            TaxRule::updateOrCreate(
                ['tenant_id' => $tenant->id, 'transport_mode_id' => null, 'country_code' => null],
                [
                    'rate_pct'       => $ratePct,
                    'effective_date' => now()->startOfYear(),
                    'end_date'       => null,
                    'is_active'      => true,
                    'notes'          => 'Taxe unique par défaut (barème Groupe) — indépendante du mode de transport et du pays de destination.',
                ]
            );
        }
    }
}
