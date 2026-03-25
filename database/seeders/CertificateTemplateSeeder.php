<?php

namespace Database\Seeders;

use App\Models\CertificateTemplate;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

/**
 * ============================================================
 * CertificateTemplateSeeder — US-013
 * ============================================================
 * Pré-charge les modèles de certificats pour :
 *   - NSIA Gabon    (Ordre d'assurance, XAF)
 *   - NSIA Guinée   (Certificat d'assurance bilingue, GNF)
 *   - NSIA Togo     (Ordre d'assurance, XOF)
 *
 * Usage : php artisan db:seed --class=CertificateTemplateSeeder
 * ============================================================
 */
class CertificateTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedGabon();
        $this->seedGuinee();
        $this->seedTogo();

        $this->command->info('✅ Modèles de certificats chargés.');
    }

    // ── NSIA Gabon ───────────────────────────────────────────
    private function seedGabon(): void
    {
        $tenant = Tenant::where('code', 'GA')->first();
        if (! $tenant) {
            $this->command->warn('⚠ Filiale GA (Gabon) introuvable — template ignoré.');
            return;
        }

        CertificateTemplate::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'name'             => 'Ordre d\'assurance NSIA Gabon',
                'code'             => 'GA',
                'type'             => 'ordre_assurance',
                'company_name'     => 'NSIA Gabon',
                'company_address'  => 'Résidence les Frangipaniers - B.P.2221 et 2225 - Libreville',
                'company_phone'    => '91-76.00.54 - Fax: 241.01.74.17.02',
                'company_email'    => 'nsiagabon@groupensia.com',
                'company_rccm'     => 'RCCM N° 2000 B 00254',
                'company_capital'  => '1.200.000.000 F CFA',
                'legal_framework'  => 'Entreprise régie par le code des assurances CIMA S.A avec Conseil d\'Administration',
                'currency_code'    => 'XAF',
                'city'             => 'LIBREVILLE',
                'number_prefix'    => 'N°',
                'number_padding'   => 6,
                'last_number'      => 41259,
                'is_bilingual'     => false,
                'has_container_options' => true,
                'has_flight_number'     => true,
                'has_vessel_name'       => true,
                'has_currency_rate'     => false,
                'prime_breakdown_lines' => [
                    ['key' => 'ro',         'label' => 'R.O. /C.F.A',    'label_en' => null],
                    ['key' => 'rg',         'label' => 'R.G. /C.F.A',    'label_en' => null],
                    ['key' => 'surprime',   'label' => 'SUR PR lN',       'label_en' => null],
                    ['key' => 'divers',     'label' => 'DIVERS',          'label_en' => null],
                    ['key' => 'prime_nette','label' => 'PRIME NETTE',     'label_en' => null],
                ],
                'footer_text'   => 'IMPORTANT : LE PRESENT ORDRE D\'ASSURANCE NE VAUT CERTIFICAT D\'ASSURANCE QUE REVETU DE LA SIGNATURE ET DU CACHET DE L\'ASSUREUR.',
                'is_active'     => true,
            ]
        );

        $this->command->info('  ✅ Gabon OK');
    }

    // ── NSIA Guinée ──────────────────────────────────────────
    private function seedGuinee(): void
    {
        $tenant = Tenant::where('code', 'GN')->first();
        if (! $tenant) {
            $this->command->warn('⚠ Filiale GN (Guinée) introuvable — template ignoré.');
            return;
        }

        CertificateTemplate::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'name'             => 'Certificat d\'assurance NSIA Guinée',
                'code'             => 'GN',
                'type'             => 'certificat_assurance',
                'company_name'     => 'NSIA Assurances',
                'company_address'  => 'Immeuble NSIA - BP 5884 Conakry Guinée',
                'company_phone'    => '(+224) 666 18 12 82 / 625 00 00 70',
                'company_email'    => 'nsiaguinee@groupensia.com',
                'company_website'  => 'www.groupensia.com',
                'company_rccm'     => 'RCCM/GC-KAL/024,618A/2009',
                'company_capital'  => '13 000 000 000 GNF',
                'legal_framework'  => 'Société Anonyme — Entreprise régie par le code des Assurances de la Guinée',
                'currency_code'    => 'GNF',
                'city'             => 'CONAKRY',
                'number_prefix'    => 'N°',
                'number_padding'   => 7,
                'last_number'      => 27651,
                'is_bilingual'     => true,
                'has_container_options' => false,
                'has_flight_number'     => false,
                'has_vessel_name'       => true,
                'has_currency_rate'     => false,
                'prime_breakdown_lines' => [
                    ['key' => 'ro',            'label' => 'R.O',          'label_en' => 'O.R'],
                    ['key' => 'rg',            'label' => 'R.G',          'label_en' => 'W.R'],
                    ['key' => 'supprime',      'label' => 'Supprime',     'label_en' => 'Supprime'],
                    ['key' => 'prime_nette',   'label' => 'Prime Nette',  'label_en' => 'Net Premium'],
                    ['key' => 'accessoires',   'label' => 'Accessoires',  'label_en' => 'Accessories'],
                    ['key' => 'taxe',          'label' => 'Taxe',         'label_en' => 'Tax'],
                    ['key' => 'prime_totale',  'label' => 'Prime Total',  'label_en' => 'Total Premium'],
                ],
                'footer_text'   => 'Toutes indemnités pour perte ou avaries seront payées, dans les conditions prévues à l\'article 27 des Conditions Générales entre les mains du porteur de l\'original du certificat d\'assurance et des pièces justificatives de la réclamation.',
                'is_active'     => true,
            ]
        );

        $this->command->info('  ✅ Guinée OK');
    }

    // ── NSIA Togo ────────────────────────────────────────────
    private function seedTogo(): void
    {
        $tenant = Tenant::where('code', 'TG')->first();
        if (! $tenant) {
            $this->command->warn('⚠ Filiale TG (Togo) introuvable — template ignoré.');
            return;
        }

        CertificateTemplate::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'name'             => 'Ordre d\'assurance NSIA Togo',
                'code'             => 'TG',
                'type'             => 'ordre_assurance',
                'company_name'     => 'NSIA Assurances',
                'company_address'  => 'Siège Social : Rue Brazza derrière Poste Centrale - 01 BP 1120 Lomé',
                'company_phone'    => '(228) 22 23 49 00 - Fax: (228) 22 20 81 52',
                'company_email'    => 'nsiatogo@groupensia.com',
                'company_capital'  => 'F.CFA 5.962.400.000',
                'legal_framework'  => 'Entreprise régie par le code des Assurances des États Membres de la CIMA',
                'currency_code'    => 'XOF',
                'city'             => 'LOME',
                'number_prefix'    => 'Nr',
                'number_padding'   => 6,
                'last_number'      => 8755,
                'is_bilingual'     => false,
                'has_container_options' => false,
                'has_flight_number'     => true,
                'has_vessel_name'       => true,
                'has_currency_rate'     => true,
                'prime_breakdown_lines' => [
                    ['key' => 'ro',           'label' => 'RO/CFA',         'label_en' => null],
                    ['key' => 'rg',           'label' => 'RG/CFA',         'label_en' => null],
                    ['key' => 'surprime',     'label' => 'SURPRIME',       'label_en' => null],
                    ['key' => 'total',        'label' => 'TOTAL',          'label_en' => null],
                    ['key' => 'cout_police',  'label' => 'COUT DE POLICE', 'label_en' => null],
                    ['key' => 'taxes',        'label' => 'TAXES',          'label_en' => null],
                    ['key' => 'prime_payer',  'label' => 'PRIME A PAYER',  'label_en' => null],
                ],
                'footer_text'   => 'IMPORTANT : LE PRESENT ORDRE D\'ASSURANCE NE VAUT CERTIFICAT D\'ASSURANCE QUE REVETU DE LA SIGNATURE ET DU CACHET DE L\'ASSUREUR.',
                'is_active'     => true,
            ]
        );

        $this->command->info('  ✅ Togo OK');
    }
}