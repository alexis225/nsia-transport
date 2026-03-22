<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Currency;
use App\Models\Incoterm;
use App\Models\MerchandiseCategory;
use App\Models\TransportMode;
use Illuminate\Database\Seeder;

/**
 * ============================================================
 * ReferentialSeeder
 * ============================================================
 * Peuple les tables de référence immuables :
 *   - countries        (pays NSIA prioritaires + ISO principaux)
 *   - currencies       (devises utilisées dans les 12 pays)
 *   - incoterms        (11 règles Incoterms 2020)
 *   - transport_modes  (6 modes)
 *   - merchandise_categories (catégories globales)
 *
 * Lancer : php artisan db:seed --class=ReferentialSeeder
 * ============================================================
 */
class ReferentialSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedCountries();
        $this->seedCurrencies();
        $this->seedIncoterms();
        $this->seedTransportModes();
        $this->seedMerchandiseCategories();
    }

    // ════════════════════════════════════════════════════════
    // PAYS
    // ════════════════════════════════════════════════════════
    private function seedCountries(): void
    {
        $this->command->info('🌍 Création des pays...');

        $countries = [
            // ── Filiales NSIA (prioritaires) ─────────────────
            ['code' => 'CI', 'name_fr' => "Côte d'Ivoire",        'name_en' => "Ivory Coast",      'region' => 'Afrique de l\'Ouest'],
            ['code' => 'SN', 'name_fr' => 'Sénégal',               'name_en' => 'Senegal',          'region' => 'Afrique de l\'Ouest'],
            ['code' => 'ML', 'name_fr' => 'Mali',                   'name_en' => 'Mali',             'region' => 'Afrique de l\'Ouest'],
            ['code' => 'BF', 'name_fr' => 'Burkina Faso',           'name_en' => 'Burkina Faso',     'region' => 'Afrique de l\'Ouest'],
            ['code' => 'GN', 'name_fr' => 'Guinée',                 'name_en' => 'Guinea',           'region' => 'Afrique de l\'Ouest'],
            ['code' => 'GW', 'name_fr' => 'Guinée-Bissau',          'name_en' => 'Guinea-Bissau',    'region' => 'Afrique de l\'Ouest'],
            ['code' => 'TG', 'name_fr' => 'Togo',                   'name_en' => 'Togo',             'region' => 'Afrique de l\'Ouest'],
            ['code' => 'BJ', 'name_fr' => 'Bénin',                  'name_en' => 'Benin',            'region' => 'Afrique de l\'Ouest'],
            ['code' => 'CM', 'name_fr' => 'Cameroun',               'name_en' => 'Cameroon',         'region' => 'Afrique Centrale'],
            ['code' => 'CG', 'name_fr' => 'Congo',                  'name_en' => 'Republic of Congo','region' => 'Afrique Centrale'],
            ['code' => 'GA', 'name_fr' => 'Gabon',                  'name_en' => 'Gabon',            'region' => 'Afrique Centrale'],
            ['code' => 'MG', 'name_fr' => 'Madagascar',             'name_en' => 'Madagascar',       'region' => 'Afrique de l\'Est'],

            // ── Partenaires commerciaux fréquents ────────────
            ['code' => 'FR', 'name_fr' => 'France',                 'name_en' => 'France',           'region' => 'Europe'],
            ['code' => 'DE', 'name_fr' => 'Allemagne',              'name_en' => 'Germany',          'region' => 'Europe'],
            ['code' => 'GB', 'name_fr' => 'Royaume-Uni',            'name_en' => 'United Kingdom',   'region' => 'Europe'],
            ['code' => 'ES', 'name_fr' => 'Espagne',                'name_en' => 'Spain',            'region' => 'Europe'],
            ['code' => 'IT', 'name_fr' => 'Italie',                 'name_en' => 'Italy',            'region' => 'Europe'],
            ['code' => 'NL', 'name_fr' => 'Pays-Bas',               'name_en' => 'Netherlands',      'region' => 'Europe'],
            ['code' => 'BE', 'name_fr' => 'Belgique',               'name_en' => 'Belgium',          'region' => 'Europe'],
            ['code' => 'CN', 'name_fr' => 'Chine',                  'name_en' => 'China',            'region' => 'Asie'],
            ['code' => 'IN', 'name_fr' => 'Inde',                   'name_en' => 'India',            'region' => 'Asie'],
            ['code' => 'JP', 'name_fr' => 'Japon',                  'name_en' => 'Japan',            'region' => 'Asie'],
            ['code' => 'US', 'name_fr' => 'États-Unis',             'name_en' => 'United States',    'region' => 'Amérique du Nord'],
            ['code' => 'CA', 'name_fr' => 'Canada',                 'name_en' => 'Canada',           'region' => 'Amérique du Nord'],
            ['code' => 'BR', 'name_fr' => 'Brésil',                 'name_en' => 'Brazil',           'region' => 'Amérique du Sud'],
            ['code' => 'MA', 'name_fr' => 'Maroc',                  'name_en' => 'Morocco',          'region' => 'Afrique du Nord'],
            ['code' => 'TN', 'name_fr' => 'Tunisie',                'name_en' => 'Tunisia',          'region' => 'Afrique du Nord'],
            ['code' => 'DZ', 'name_fr' => 'Algérie',                'name_en' => 'Algeria',          'region' => 'Afrique du Nord'],
            ['code' => 'EG', 'name_fr' => 'Égypte',                 'name_en' => 'Egypt',            'region' => 'Afrique du Nord'],
            ['code' => 'ZA', 'name_fr' => 'Afrique du Sud',         'name_en' => 'South Africa',     'region' => 'Afrique Australe'],
            ['code' => 'NG', 'name_fr' => 'Nigéria',                'name_en' => 'Nigeria',          'region' => 'Afrique de l\'Ouest'],
            ['code' => 'GH', 'name_fr' => 'Ghana',                  'name_en' => 'Ghana',            'region' => 'Afrique de l\'Ouest'],

        ];

        foreach ($countries as $country) {
            Country::firstOrCreate(['code' => $country['code']], $country);
        }

        $this->command->info('✅ ' . count($countries) . ' pays créés.');
    }

    // ════════════════════════════════════════════════════════
    // DEVISES
    // ════════════════════════════════════════════════════════
    private function seedCurrencies(): void
    {
        $this->command->info('💱 Création des devises...');

        $currencies = [
            // ── Devises NSIA ──────────────────────────────────
            ['code' => 'XOF', 'name' => 'Franc CFA BCEAO',      'symbol' => 'F CFA', 'is_active' => true],
            ['code' => 'XAF', 'name' => 'Franc CFA BEAC',        'symbol' => 'F CFA', 'is_active' => true],
            ['code' => 'GNF', 'name' => 'Franc guinéen',          'symbol' => 'FG',    'is_active' => true],
            ['code' => 'MGA', 'name' => 'Ariary malgache',        'symbol' => 'Ar',    'is_active' => true],
            // ── Devises internationales ───────────────────────
            ['code' => 'EUR', 'name' => 'Euro',                   'symbol' => '€',     'is_active' => true],
            ['code' => 'USD', 'name' => 'Dollar américain',       'symbol' => '$',     'is_active' => true],
            ['code' => 'GBP', 'name' => 'Livre sterling',         'symbol' => '£',     'is_active' => true],
            ['code' => 'CHF', 'name' => 'Franc suisse',           'symbol' => 'CHF',   'is_active' => true],
            ['code' => 'JPY', 'name' => 'Yen japonais',           'symbol' => '¥',     'is_active' => true],
            ['code' => 'CNY', 'name' => 'Yuan renminbi',          'symbol' => '¥',     'is_active' => true],
            ['code' => 'AED', 'name' => 'Dirham des EAU',         'symbol' => 'AED',   'is_active' => true],
            ['code' => 'MAD', 'name' => 'Dirham marocain',        'symbol' => 'MAD',   'is_active' => true],
            ['code' => 'NGN', 'name' => 'Naira nigérian',         'symbol' => '₦',     'is_active' => true],
            ['code' => 'GHS', 'name' => 'Cedi ghanéen',           'symbol' => 'GH₵',   'is_active' => true],
            ['code' => 'ZAR', 'name' => 'Rand sud-africain',      'symbol' => 'R',     'is_active' => true],
            ['code' => 'SGD', 'name' => 'Dollar de Singapour',    'symbol' => 'S$',    'is_active' => true],
        ];

        foreach ($currencies as $currency) {
            Currency::firstOrCreate(['code' => $currency['code']], $currency);
        }

        $this->command->info('✅ ' . count($currencies) . ' devises créées.');
    }

    // ════════════════════════════════════════════════════════
    // INCOTERMS 2020
    // ════════════════════════════════════════════════════════
    private function seedIncoterms(): void
    {
        $this->command->info('📋 Création des Incoterms 2020...');

        $incoterms = [
            // ── Tous modes ────────────────────────────────────
            ['code' => 'EXW', 'name' => 'Ex Works',                       'compatible_modes' => ['SEA','AIR','ROAD','RAIL','MULTIMODAL'], 'description' => "Le vendeur met les marchandises à disposition dans ses locaux."],
            ['code' => 'FCA', 'name' => 'Free Carrier',                   'compatible_modes' => ['SEA','AIR','ROAD','RAIL','MULTIMODAL'], 'description' => "Le vendeur livre les marchandises au transporteur désigné par l'acheteur."],
            ['code' => 'CPT', 'name' => 'Carriage Paid To',               'compatible_modes' => ['SEA','AIR','ROAD','RAIL','MULTIMODAL'], 'description' => "Le vendeur paie le transport jusqu'au lieu de destination."],
            ['code' => 'CIP', 'name' => 'Carriage and Insurance Paid To', 'compatible_modes' => ['SEA','AIR','ROAD','RAIL','MULTIMODAL'], 'description' => "Le vendeur paie le transport et l'assurance jusqu'à destination."],
            ['code' => 'DAP', 'name' => 'Delivered at Place',             'compatible_modes' => ['SEA','AIR','ROAD','RAIL','MULTIMODAL'], 'description' => "Le vendeur livre au lieu de destination convenu, non dédouané."],
            ['code' => 'DPU', 'name' => 'Delivered at Place Unloaded',    'compatible_modes' => ['SEA','AIR','ROAD','RAIL','MULTIMODAL'], 'description' => "Le vendeur livre et décharge les marchandises à destination."],
            ['code' => 'DDP', 'name' => 'Delivered Duty Paid',            'compatible_modes' => ['SEA','AIR','ROAD','RAIL','MULTIMODAL'], 'description' => "Le vendeur supporte tous les coûts et risques, y compris les droits."],

            // ── Maritime / fluvial uniquement ─────────────────
            ['code' => 'FAS', 'name' => 'Free Alongside Ship',            'compatible_modes' => ['SEA'], 'description' => "Le vendeur livre le long du navire au port d'expédition."],
            ['code' => 'FOB', 'name' => 'Free On Board',                  'compatible_modes' => ['SEA'], 'description' => "Le vendeur livre à bord du navire au port d'expédition."],
            ['code' => 'CFR', 'name' => 'Cost and Freight',               'compatible_modes' => ['SEA'], 'description' => "Le vendeur paie le fret jusqu'au port de destination."],
            ['code' => 'CIF', 'name' => 'Cost, Insurance and Freight',    'compatible_modes' => ['SEA'], 'description' => "Le vendeur paie le fret et l'assurance jusqu'au port de destination."],
        ];

        foreach ($incoterms as $incoterm) {
            Incoterm::firstOrCreate(['code' => $incoterm['code']], $incoterm);
        }

        $this->command->info('✅ ' . count($incoterms) . ' incoterms créés.');
    }

    // ════════════════════════════════════════════════════════
    // MODES DE TRANSPORT
    // ════════════════════════════════════════════════════════
    private function seedTransportModes(): void
    {
        $this->command->info('🚢 Création des modes de transport...');

        $modes = [
            ['code' => 'SEA',        'name_fr' => 'Maritime',    'name_en' => 'Sea',        'icon' => 'ship'],
            ['code' => 'AIR',        'name_fr' => 'Aérien',      'name_en' => 'Air',        'icon' => 'plane'],
            ['code' => 'ROAD',       'name_fr' => 'Routier',     'name_en' => 'Road',       'icon' => 'truck'],
            ['code' => 'RAIL',       'name_fr' => 'Ferroviaire', 'name_en' => 'Rail',       'icon' => 'train'],
            ['code' => 'MULTIMODAL', 'name_fr' => 'Multimodal',  'name_en' => 'Multimodal', 'icon' => 'layers'],
            ['code' => 'POSTAL',     'name_fr' => 'Postal',      'name_en' => 'Postal',     'icon' => 'package'],
        ];

        foreach ($modes as $mode) {
            TransportMode::firstOrCreate(['code' => $mode['code']], $mode);
        }

        $this->command->info('✅ ' . count($modes) . ' modes de transport créés.');
    }

    // ════════════════════════════════════════════════════════
    // CATÉGORIES DE MARCHANDISES
    // ════════════════════════════════════════════════════════
    private function seedMerchandiseCategories(): void
    {
        $this->command->info('📦 Création des catégories de marchandises...');

        // Catégories globales (tenant_id = NULL)
        $categories = [
            // ── Niveau 1 — Catégories principales ────────────
            ['code' => 'AGRI',    'name' => 'Produits agricoles',         'risk_level' => 1, 'parent' => null],
            ['code' => 'INDUS',   'name' => 'Produits industriels',       'risk_level' => 2, 'parent' => null],
            ['code' => 'CHIMIE',  'name' => 'Produits chimiques',         'risk_level' => 3, 'parent' => null],
            ['code' => 'ELEC',    'name' => 'Électronique & High-Tech',   'risk_level' => 2, 'parent' => null],
            ['code' => 'TEXTI',   'name' => 'Textile & Habillement',      'risk_level' => 1, 'parent' => null],
            ['code' => 'ALIM',    'name' => 'Denrées alimentaires',       'risk_level' => 2, 'parent' => null],
            ['code' => 'MACH',    'name' => 'Machines & Équipements',     'risk_level' => 2, 'parent' => null],
            ['code' => 'METAL',   'name' => 'Métaux & Minéraux',          'risk_level' => 2, 'parent' => null],
            ['code' => 'HYDRO',   'name' => 'Hydrocarbures & Énergie',    'risk_level' => 3, 'parent' => null],
            ['code' => 'PHARMA',  'name' => 'Pharmaceutique & Médical',   'risk_level' => 2, 'parent' => null],
            ['code' => 'VEHIC',   'name' => 'Véhicules & Transport',      'risk_level' => 2, 'parent' => null],
            ['code' => 'DIVERS',  'name' => 'Marchandises diverses',      'risk_level' => 1, 'parent' => null],

            // ── Niveau 2 — Sous-catégories AGRI ─────────────
            ['code' => 'CACAO',   'name' => 'Cacao & dérivés',            'risk_level' => 1, 'parent' => 'AGRI'],
            ['code' => 'CAFE',    'name' => 'Café & dérivés',             'risk_level' => 1, 'parent' => 'AGRI'],
            ['code' => 'COTON',   'name' => 'Coton & fibres',             'risk_level' => 1, 'parent' => 'AGRI'],
            ['code' => 'BOIS',    'name' => 'Bois & produits forestiers', 'risk_level' => 1, 'parent' => 'AGRI'],
            ['code' => 'CAOUTCH', 'name' => 'Caoutchouc naturel',         'risk_level' => 1, 'parent' => 'AGRI'],
            ['code' => 'OLEAGI',  'name' => 'Oléagineux & huiles',        'risk_level' => 1, 'parent' => 'AGRI'],

            // ── Niveau 2 — Sous-catégories CHIMIE ────────────
            ['code' => 'CHIMIE_D','name' => 'Produits chimiques dangereux','risk_level' => 3, 'parent' => 'CHIMIE'],
            ['code' => 'CHIMIE_I','name' => 'Produits chimiques industriels','risk_level' => 2, 'parent' => 'CHIMIE'],
            ['code' => 'ENGRAIS', 'name' => 'Engrais & fertilisants',     'risk_level' => 2, 'parent' => 'CHIMIE'],

            // ── Niveau 2 — Sous-catégories ALIM ─────────────
            ['code' => 'CEREALES','name' => 'Céréales & farines',         'risk_level' => 1, 'parent' => 'ALIM'],
            ['code' => 'SUCRE',   'name' => 'Sucre & confiseries',        'risk_level' => 1, 'parent' => 'ALIM'],
            ['code' => 'POISSON', 'name' => 'Poisson & produits de mer',  'risk_level' => 2, 'parent' => 'ALIM'],
            ['code' => 'BOISSONS','name' => 'Boissons & alcools',         'risk_level' => 1, 'parent' => 'ALIM'],
        ];

        $createdIds = [];

        foreach ($categories as $cat) {
            $parentId = null;
            if ($cat['parent'] && isset($createdIds[$cat['parent']])) {
                $parentId = $createdIds[$cat['parent']];
            }

            $category = MerchandiseCategory::firstOrCreate(
                ['code' => $cat['code'], 'tenant_id' => null],
                [
                    'name'       => $cat['name'],
                    'risk_level' => $cat['risk_level'],
                    'parent_id'  => $parentId,
                    'is_active'  => true,
                ]
            );

            $createdIds[$cat['code']] = $category->id;
        }

        $this->command->info('✅ ' . count($categories) . ' catégories de marchandises créées.');
    }
}