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
        $this->command->info('🌍 Création du référentiel pays (monde entier)...');

        // Référentiel complet ISO 3166-1 alpha-2, avec indicatif
        // téléphonique (E.164). updateOrCreate (et non firstOrCreate) pour
        // que les pays déjà présents reçoivent aussi leur indicatif lors
        // d'un re-seed.
        $countries = [
            // ── Afrique de l'Ouest ────────────────────────────
            ['code' => 'CI', 'name_fr' => "Côte d'Ivoire",  'name_en' => 'Ivory Coast',       'region' => "Afrique de l'Ouest", 'calling_code' => '+225'],
            ['code' => 'SN', 'name_fr' => 'Sénégal',         'name_en' => 'Senegal',           'region' => "Afrique de l'Ouest", 'calling_code' => '+221'],
            ['code' => 'ML', 'name_fr' => 'Mali',            'name_en' => 'Mali',              'region' => "Afrique de l'Ouest", 'calling_code' => '+223'],
            ['code' => 'BF', 'name_fr' => 'Burkina Faso',    'name_en' => 'Burkina Faso',      'region' => "Afrique de l'Ouest", 'calling_code' => '+226'],
            ['code' => 'GN', 'name_fr' => 'Guinée',          'name_en' => 'Guinea',            'region' => "Afrique de l'Ouest", 'calling_code' => '+224'],
            ['code' => 'GW', 'name_fr' => 'Guinée-Bissau',   'name_en' => 'Guinea-Bissau',     'region' => "Afrique de l'Ouest", 'calling_code' => '+245'],
            ['code' => 'TG', 'name_fr' => 'Togo',            'name_en' => 'Togo',              'region' => "Afrique de l'Ouest", 'calling_code' => '+228'],
            ['code' => 'BJ', 'name_fr' => 'Bénin',           'name_en' => 'Benin',             'region' => "Afrique de l'Ouest", 'calling_code' => '+229'],
            ['code' => 'NG', 'name_fr' => 'Nigéria',         'name_en' => 'Nigeria',           'region' => "Afrique de l'Ouest", 'calling_code' => '+234'],
            ['code' => 'GH', 'name_fr' => 'Ghana',           'name_en' => 'Ghana',             'region' => "Afrique de l'Ouest", 'calling_code' => '+233'],
            ['code' => 'CV', 'name_fr' => 'Cap-Vert',        'name_en' => 'Cabo Verde',        'region' => "Afrique de l'Ouest", 'calling_code' => '+238'],
            ['code' => 'GM', 'name_fr' => 'Gambie',          'name_en' => 'Gambia',            'region' => "Afrique de l'Ouest", 'calling_code' => '+220'],
            ['code' => 'LR', 'name_fr' => 'Libéria',         'name_en' => 'Liberia',           'region' => "Afrique de l'Ouest", 'calling_code' => '+231'],
            ['code' => 'MR', 'name_fr' => 'Mauritanie',      'name_en' => 'Mauritania',        'region' => "Afrique de l'Ouest", 'calling_code' => '+222'],
            ['code' => 'NE', 'name_fr' => 'Niger',           'name_en' => 'Niger',             'region' => "Afrique de l'Ouest", 'calling_code' => '+227'],
            ['code' => 'SL', 'name_fr' => 'Sierra Leone',    'name_en' => 'Sierra Leone',      'region' => "Afrique de l'Ouest", 'calling_code' => '+232'],

            // ── Afrique Centrale ──────────────────────────────
            ['code' => 'CM', 'name_fr' => 'Cameroun',        'name_en' => 'Cameroon',          'region' => 'Afrique Centrale', 'calling_code' => '+237'],
            ['code' => 'CG', 'name_fr' => 'Congo',           'name_en' => 'Republic of Congo',  'region' => 'Afrique Centrale', 'calling_code' => '+242'],
            ['code' => 'GA', 'name_fr' => 'Gabon',           'name_en' => 'Gabon',             'region' => 'Afrique Centrale', 'calling_code' => '+241'],
            ['code' => 'CD', 'name_fr' => 'RD Congo',        'name_en' => 'DR Congo',           'region' => 'Afrique Centrale', 'calling_code' => '+243'],
            ['code' => 'CF', 'name_fr' => 'République Centrafricaine', 'name_en' => 'Central African Republic', 'region' => 'Afrique Centrale', 'calling_code' => '+236'],
            ['code' => 'TD', 'name_fr' => 'Tchad',           'name_en' => 'Chad',              'region' => 'Afrique Centrale', 'calling_code' => '+235'],
            ['code' => 'GQ', 'name_fr' => 'Guinée Équatoriale', 'name_en' => 'Equatorial Guinea', 'region' => 'Afrique Centrale', 'calling_code' => '+240'],
            ['code' => 'ST', 'name_fr' => 'Sao Tomé-et-Principe', 'name_en' => 'Sao Tome and Principe', 'region' => 'Afrique Centrale', 'calling_code' => '+239'],

            // ── Afrique de l'Est ──────────────────────────────
            ['code' => 'MG', 'name_fr' => 'Madagascar',      'name_en' => 'Madagascar',        'region' => "Afrique de l'Est", 'calling_code' => '+261'],
            ['code' => 'KE', 'name_fr' => 'Kenya',           'name_en' => 'Kenya',             'region' => "Afrique de l'Est", 'calling_code' => '+254'],
            ['code' => 'TZ', 'name_fr' => 'Tanzanie',        'name_en' => 'Tanzania',          'region' => "Afrique de l'Est", 'calling_code' => '+255'],
            ['code' => 'ET', 'name_fr' => 'Éthiopie',        'name_en' => 'Ethiopia',          'region' => "Afrique de l'Est", 'calling_code' => '+251'],
            ['code' => 'UG', 'name_fr' => 'Ouganda',         'name_en' => 'Uganda',            'region' => "Afrique de l'Est", 'calling_code' => '+256'],
            ['code' => 'RW', 'name_fr' => 'Rwanda',          'name_en' => 'Rwanda',            'region' => "Afrique de l'Est", 'calling_code' => '+250'],
            ['code' => 'BI', 'name_fr' => 'Burundi',         'name_en' => 'Burundi',           'region' => "Afrique de l'Est", 'calling_code' => '+257'],
            ['code' => 'DJ', 'name_fr' => 'Djibouti',        'name_en' => 'Djibouti',          'region' => "Afrique de l'Est", 'calling_code' => '+253'],
            ['code' => 'ER', 'name_fr' => 'Érythrée',        'name_en' => 'Eritrea',           'region' => "Afrique de l'Est", 'calling_code' => '+291'],
            ['code' => 'KM', 'name_fr' => 'Comores',         'name_en' => 'Comoros',           'region' => "Afrique de l'Est", 'calling_code' => '+269'],
            ['code' => 'MU', 'name_fr' => 'Maurice',         'name_en' => 'Mauritius',         'region' => "Afrique de l'Est", 'calling_code' => '+230'],
            ['code' => 'MW', 'name_fr' => 'Malawi',          'name_en' => 'Malawi',            'region' => "Afrique de l'Est", 'calling_code' => '+265'],
            ['code' => 'MZ', 'name_fr' => 'Mozambique',      'name_en' => 'Mozambique',        'region' => "Afrique de l'Est", 'calling_code' => '+258'],
            ['code' => 'SC', 'name_fr' => 'Seychelles',      'name_en' => 'Seychelles',        'region' => "Afrique de l'Est", 'calling_code' => '+248'],
            ['code' => 'SO', 'name_fr' => 'Somalie',         'name_en' => 'Somalia',           'region' => "Afrique de l'Est", 'calling_code' => '+252'],
            ['code' => 'SS', 'name_fr' => 'Soudan du Sud',   'name_en' => 'South Sudan',       'region' => "Afrique de l'Est", 'calling_code' => '+211'],

            // ── Afrique du Nord ───────────────────────────────
            ['code' => 'MA', 'name_fr' => 'Maroc',           'name_en' => 'Morocco',           'region' => 'Afrique du Nord', 'calling_code' => '+212'],
            ['code' => 'TN', 'name_fr' => 'Tunisie',         'name_en' => 'Tunisia',           'region' => 'Afrique du Nord', 'calling_code' => '+216'],
            ['code' => 'DZ', 'name_fr' => 'Algérie',         'name_en' => 'Algeria',           'region' => 'Afrique du Nord', 'calling_code' => '+213'],
            ['code' => 'EG', 'name_fr' => 'Égypte',          'name_en' => 'Egypt',             'region' => 'Afrique du Nord', 'calling_code' => '+20'],
            ['code' => 'LY', 'name_fr' => 'Libye',           'name_en' => 'Libya',             'region' => 'Afrique du Nord', 'calling_code' => '+218'],
            ['code' => 'SD', 'name_fr' => 'Soudan',          'name_en' => 'Sudan',             'region' => 'Afrique du Nord', 'calling_code' => '+249'],

            // ── Afrique Australe ──────────────────────────────
            ['code' => 'ZA', 'name_fr' => 'Afrique du Sud',  'name_en' => 'South Africa',      'region' => 'Afrique Australe', 'calling_code' => '+27'],
            ['code' => 'AO', 'name_fr' => 'Angola',          'name_en' => 'Angola',            'region' => 'Afrique Australe', 'calling_code' => '+244'],
            ['code' => 'BW', 'name_fr' => 'Botswana',        'name_en' => 'Botswana',          'region' => 'Afrique Australe', 'calling_code' => '+267'],
            ['code' => 'SZ', 'name_fr' => 'Eswatini',        'name_en' => 'Eswatini',          'region' => 'Afrique Australe', 'calling_code' => '+268'],
            ['code' => 'LS', 'name_fr' => 'Lesotho',         'name_en' => 'Lesotho',           'region' => 'Afrique Australe', 'calling_code' => '+266'],
            ['code' => 'NA', 'name_fr' => 'Namibie',         'name_en' => 'Namibia',           'region' => 'Afrique Australe', 'calling_code' => '+264'],
            ['code' => 'ZM', 'name_fr' => 'Zambie',          'name_en' => 'Zambia',            'region' => 'Afrique Australe', 'calling_code' => '+260'],
            ['code' => 'ZW', 'name_fr' => 'Zimbabwe',        'name_en' => 'Zimbabwe',          'region' => 'Afrique Australe', 'calling_code' => '+263'],

            // ── Europe ────────────────────────────────────────
            ['code' => 'FR', 'name_fr' => 'France',          'name_en' => 'France',            'region' => 'Europe', 'calling_code' => '+33'],
            ['code' => 'DE', 'name_fr' => 'Allemagne',       'name_en' => 'Germany',           'region' => 'Europe', 'calling_code' => '+49'],
            ['code' => 'GB', 'name_fr' => 'Royaume-Uni',     'name_en' => 'United Kingdom',    'region' => 'Europe', 'calling_code' => '+44'],
            ['code' => 'ES', 'name_fr' => 'Espagne',         'name_en' => 'Spain',             'region' => 'Europe', 'calling_code' => '+34'],
            ['code' => 'IT', 'name_fr' => 'Italie',          'name_en' => 'Italy',             'region' => 'Europe', 'calling_code' => '+39'],
            ['code' => 'NL', 'name_fr' => 'Pays-Bas',        'name_en' => 'Netherlands',       'region' => 'Europe', 'calling_code' => '+31'],
            ['code' => 'BE', 'name_fr' => 'Belgique',        'name_en' => 'Belgium',           'region' => 'Europe', 'calling_code' => '+32'],
            ['code' => 'AL', 'name_fr' => 'Albanie',         'name_en' => 'Albania',           'region' => 'Europe', 'calling_code' => '+355'],
            ['code' => 'AD', 'name_fr' => 'Andorre',         'name_en' => 'Andorra',           'region' => 'Europe', 'calling_code' => '+376'],
            ['code' => 'AT', 'name_fr' => 'Autriche',        'name_en' => 'Austria',           'region' => 'Europe', 'calling_code' => '+43'],
            ['code' => 'BY', 'name_fr' => 'Biélorussie',     'name_en' => 'Belarus',           'region' => 'Europe', 'calling_code' => '+375'],
            ['code' => 'BA', 'name_fr' => 'Bosnie-Herzégovine', 'name_en' => 'Bosnia and Herzegovina', 'region' => 'Europe', 'calling_code' => '+387'],
            ['code' => 'BG', 'name_fr' => 'Bulgarie',        'name_en' => 'Bulgaria',          'region' => 'Europe', 'calling_code' => '+359'],
            ['code' => 'HR', 'name_fr' => 'Croatie',         'name_en' => 'Croatia',           'region' => 'Europe', 'calling_code' => '+385'],
            ['code' => 'CY', 'name_fr' => 'Chypre',          'name_en' => 'Cyprus',            'region' => 'Europe', 'calling_code' => '+357'],
            ['code' => 'CZ', 'name_fr' => 'Tchéquie',        'name_en' => 'Czechia',           'region' => 'Europe', 'calling_code' => '+420'],
            ['code' => 'DK', 'name_fr' => 'Danemark',        'name_en' => 'Denmark',           'region' => 'Europe', 'calling_code' => '+45'],
            ['code' => 'EE', 'name_fr' => 'Estonie',         'name_en' => 'Estonia',           'region' => 'Europe', 'calling_code' => '+372'],
            ['code' => 'FI', 'name_fr' => 'Finlande',        'name_en' => 'Finland',           'region' => 'Europe', 'calling_code' => '+358'],
            ['code' => 'GR', 'name_fr' => 'Grèce',           'name_en' => 'Greece',            'region' => 'Europe', 'calling_code' => '+30'],
            ['code' => 'HU', 'name_fr' => 'Hongrie',         'name_en' => 'Hungary',           'region' => 'Europe', 'calling_code' => '+36'],
            ['code' => 'IS', 'name_fr' => 'Islande',         'name_en' => 'Iceland',           'region' => 'Europe', 'calling_code' => '+354'],
            ['code' => 'IE', 'name_fr' => 'Irlande',         'name_en' => 'Ireland',           'region' => 'Europe', 'calling_code' => '+353'],
            ['code' => 'LV', 'name_fr' => 'Lettonie',        'name_en' => 'Latvia',            'region' => 'Europe', 'calling_code' => '+371'],
            ['code' => 'LI', 'name_fr' => 'Liechtenstein',   'name_en' => 'Liechtenstein',     'region' => 'Europe', 'calling_code' => '+423'],
            ['code' => 'LT', 'name_fr' => 'Lituanie',        'name_en' => 'Lithuania',         'region' => 'Europe', 'calling_code' => '+370'],
            ['code' => 'LU', 'name_fr' => 'Luxembourg',      'name_en' => 'Luxembourg',        'region' => 'Europe', 'calling_code' => '+352'],
            ['code' => 'MT', 'name_fr' => 'Malte',           'name_en' => 'Malta',             'region' => 'Europe', 'calling_code' => '+356'],
            ['code' => 'MD', 'name_fr' => 'Moldavie',        'name_en' => 'Moldova',           'region' => 'Europe', 'calling_code' => '+373'],
            ['code' => 'MC', 'name_fr' => 'Monaco',          'name_en' => 'Monaco',            'region' => 'Europe', 'calling_code' => '+377'],
            ['code' => 'ME', 'name_fr' => 'Monténégro',      'name_en' => 'Montenegro',        'region' => 'Europe', 'calling_code' => '+382'],
            ['code' => 'MK', 'name_fr' => 'Macédoine du Nord', 'name_en' => 'North Macedonia', 'region' => 'Europe', 'calling_code' => '+389'],
            ['code' => 'NO', 'name_fr' => 'Norvège',         'name_en' => 'Norway',            'region' => 'Europe', 'calling_code' => '+47'],
            ['code' => 'PL', 'name_fr' => 'Pologne',         'name_en' => 'Poland',            'region' => 'Europe', 'calling_code' => '+48'],
            ['code' => 'PT', 'name_fr' => 'Portugal',        'name_en' => 'Portugal',          'region' => 'Europe', 'calling_code' => '+351'],
            ['code' => 'RO', 'name_fr' => 'Roumanie',        'name_en' => 'Romania',           'region' => 'Europe', 'calling_code' => '+40'],
            ['code' => 'RU', 'name_fr' => 'Russie',          'name_en' => 'Russia',            'region' => 'Europe', 'calling_code' => '+7'],
            ['code' => 'SM', 'name_fr' => 'Saint-Marin',     'name_en' => 'San Marino',        'region' => 'Europe', 'calling_code' => '+378'],
            ['code' => 'RS', 'name_fr' => 'Serbie',          'name_en' => 'Serbia',            'region' => 'Europe', 'calling_code' => '+381'],
            ['code' => 'SK', 'name_fr' => 'Slovaquie',       'name_en' => 'Slovakia',          'region' => 'Europe', 'calling_code' => '+421'],
            ['code' => 'SI', 'name_fr' => 'Slovénie',        'name_en' => 'Slovenia',          'region' => 'Europe', 'calling_code' => '+386'],
            ['code' => 'SE', 'name_fr' => 'Suède',           'name_en' => 'Sweden',            'region' => 'Europe', 'calling_code' => '+46'],
            ['code' => 'CH', 'name_fr' => 'Suisse',          'name_en' => 'Switzerland',       'region' => 'Europe', 'calling_code' => '+41'],
            ['code' => 'UA', 'name_fr' => 'Ukraine',         'name_en' => 'Ukraine',           'region' => 'Europe', 'calling_code' => '+380'],
            ['code' => 'VA', 'name_fr' => 'Vatican',         'name_en' => 'Vatican City',      'region' => 'Europe', 'calling_code' => '+379'],

            // ── Asie ──────────────────────────────────────────
            ['code' => 'CN', 'name_fr' => 'Chine',           'name_en' => 'China',             'region' => 'Asie', 'calling_code' => '+86'],
            ['code' => 'IN', 'name_fr' => 'Inde',            'name_en' => 'India',             'region' => 'Asie', 'calling_code' => '+91'],
            ['code' => 'JP', 'name_fr' => 'Japon',           'name_en' => 'Japan',             'region' => 'Asie', 'calling_code' => '+81'],
            ['code' => 'AF', 'name_fr' => 'Afghanistan',     'name_en' => 'Afghanistan',       'region' => 'Asie', 'calling_code' => '+93'],
            ['code' => 'AM', 'name_fr' => 'Arménie',         'name_en' => 'Armenia',           'region' => 'Asie', 'calling_code' => '+374'],
            ['code' => 'AZ', 'name_fr' => 'Azerbaïdjan',     'name_en' => 'Azerbaijan',        'region' => 'Asie', 'calling_code' => '+994'],
            ['code' => 'BH', 'name_fr' => 'Bahreïn',         'name_en' => 'Bahrain',           'region' => 'Asie', 'calling_code' => '+973'],
            ['code' => 'BD', 'name_fr' => 'Bangladesh',      'name_en' => 'Bangladesh',        'region' => 'Asie', 'calling_code' => '+880'],
            ['code' => 'BT', 'name_fr' => 'Bhoutan',         'name_en' => 'Bhutan',            'region' => 'Asie', 'calling_code' => '+975'],
            ['code' => 'BN', 'name_fr' => 'Brunei',          'name_en' => 'Brunei',            'region' => 'Asie', 'calling_code' => '+673'],
            ['code' => 'KH', 'name_fr' => 'Cambodge',        'name_en' => 'Cambodia',          'region' => 'Asie', 'calling_code' => '+855'],
            ['code' => 'GE', 'name_fr' => 'Géorgie',         'name_en' => 'Georgia',           'region' => 'Asie', 'calling_code' => '+995'],
            ['code' => 'ID', 'name_fr' => 'Indonésie',       'name_en' => 'Indonesia',         'region' => 'Asie', 'calling_code' => '+62'],
            ['code' => 'IR', 'name_fr' => 'Iran',            'name_en' => 'Iran',              'region' => 'Asie', 'calling_code' => '+98'],
            ['code' => 'IQ', 'name_fr' => 'Irak',            'name_en' => 'Iraq',              'region' => 'Asie', 'calling_code' => '+964'],
            ['code' => 'IL', 'name_fr' => 'Israël',          'name_en' => 'Israel',            'region' => 'Asie', 'calling_code' => '+972'],
            ['code' => 'JO', 'name_fr' => 'Jordanie',        'name_en' => 'Jordan',            'region' => 'Asie', 'calling_code' => '+962'],
            ['code' => 'KZ', 'name_fr' => 'Kazakhstan',      'name_en' => 'Kazakhstan',        'region' => 'Asie', 'calling_code' => '+7'],
            ['code' => 'KW', 'name_fr' => 'Koweït',          'name_en' => 'Kuwait',            'region' => 'Asie', 'calling_code' => '+965'],
            ['code' => 'KG', 'name_fr' => 'Kirghizistan',    'name_en' => 'Kyrgyzstan',        'region' => 'Asie', 'calling_code' => '+996'],
            ['code' => 'LA', 'name_fr' => 'Laos',            'name_en' => 'Laos',              'region' => 'Asie', 'calling_code' => '+856'],
            ['code' => 'LB', 'name_fr' => 'Liban',           'name_en' => 'Lebanon',           'region' => 'Asie', 'calling_code' => '+961'],
            ['code' => 'MY', 'name_fr' => 'Malaisie',        'name_en' => 'Malaysia',          'region' => 'Asie', 'calling_code' => '+60'],
            ['code' => 'MV', 'name_fr' => 'Maldives',        'name_en' => 'Maldives',          'region' => 'Asie', 'calling_code' => '+960'],
            ['code' => 'MN', 'name_fr' => 'Mongolie',        'name_en' => 'Mongolia',          'region' => 'Asie', 'calling_code' => '+976'],
            ['code' => 'MM', 'name_fr' => 'Myanmar',         'name_en' => 'Myanmar',           'region' => 'Asie', 'calling_code' => '+95'],
            ['code' => 'NP', 'name_fr' => 'Népal',           'name_en' => 'Nepal',             'region' => 'Asie', 'calling_code' => '+977'],
            ['code' => 'KP', 'name_fr' => 'Corée du Nord',   'name_en' => 'North Korea',       'region' => 'Asie', 'calling_code' => '+850'],
            ['code' => 'OM', 'name_fr' => 'Oman',            'name_en' => 'Oman',              'region' => 'Asie', 'calling_code' => '+968'],
            ['code' => 'PK', 'name_fr' => 'Pakistan',        'name_en' => 'Pakistan',          'region' => 'Asie', 'calling_code' => '+92'],
            ['code' => 'PS', 'name_fr' => 'Palestine',       'name_en' => 'Palestine',         'region' => 'Asie', 'calling_code' => '+970'],
            ['code' => 'PH', 'name_fr' => 'Philippines',     'name_en' => 'Philippines',       'region' => 'Asie', 'calling_code' => '+63'],
            ['code' => 'QA', 'name_fr' => 'Qatar',           'name_en' => 'Qatar',             'region' => 'Asie', 'calling_code' => '+974'],
            ['code' => 'SA', 'name_fr' => 'Arabie Saoudite', 'name_en' => 'Saudi Arabia',      'region' => 'Asie', 'calling_code' => '+966'],
            ['code' => 'SG', 'name_fr' => 'Singapour',       'name_en' => 'Singapore',         'region' => 'Asie', 'calling_code' => '+65'],
            ['code' => 'KR', 'name_fr' => 'Corée du Sud',    'name_en' => 'South Korea',       'region' => 'Asie', 'calling_code' => '+82'],
            ['code' => 'LK', 'name_fr' => 'Sri Lanka',       'name_en' => 'Sri Lanka',         'region' => 'Asie', 'calling_code' => '+94'],
            ['code' => 'SY', 'name_fr' => 'Syrie',           'name_en' => 'Syria',             'region' => 'Asie', 'calling_code' => '+963'],
            ['code' => 'TW', 'name_fr' => 'Taïwan',          'name_en' => 'Taiwan',            'region' => 'Asie', 'calling_code' => '+886'],
            ['code' => 'TJ', 'name_fr' => 'Tadjikistan',     'name_en' => 'Tajikistan',        'region' => 'Asie', 'calling_code' => '+992'],
            ['code' => 'TH', 'name_fr' => 'Thaïlande',       'name_en' => 'Thailand',          'region' => 'Asie', 'calling_code' => '+66'],
            ['code' => 'TL', 'name_fr' => 'Timor Oriental',  'name_en' => 'Timor-Leste',       'region' => 'Asie', 'calling_code' => '+670'],
            ['code' => 'TR', 'name_fr' => 'Turquie',         'name_en' => 'Turkey',            'region' => 'Asie', 'calling_code' => '+90'],
            ['code' => 'TM', 'name_fr' => 'Turkménistan',    'name_en' => 'Turkmenistan',      'region' => 'Asie', 'calling_code' => '+993'],
            ['code' => 'AE', 'name_fr' => 'Émirats Arabes Unis', 'name_en' => 'United Arab Emirates', 'region' => 'Asie', 'calling_code' => '+971'],
            ['code' => 'UZ', 'name_fr' => 'Ouzbékistan',     'name_en' => 'Uzbekistan',        'region' => 'Asie', 'calling_code' => '+998'],
            ['code' => 'VN', 'name_fr' => 'Vietnam',         'name_en' => 'Vietnam',           'region' => 'Asie', 'calling_code' => '+84'],
            ['code' => 'YE', 'name_fr' => 'Yémen',           'name_en' => 'Yemen',             'region' => 'Asie', 'calling_code' => '+967'],

            // ── Amérique du Nord ──────────────────────────────
            ['code' => 'US', 'name_fr' => 'États-Unis',      'name_en' => 'United States',     'region' => 'Amérique du Nord', 'calling_code' => '+1'],
            ['code' => 'CA', 'name_fr' => 'Canada',          'name_en' => 'Canada',            'region' => 'Amérique du Nord', 'calling_code' => '+1'],
            ['code' => 'MX', 'name_fr' => 'Mexique',         'name_en' => 'Mexico',            'region' => 'Amérique du Nord', 'calling_code' => '+52'],

            // ── Amérique Centrale & Caraïbes ──────────────────
            ['code' => 'AG', 'name_fr' => 'Antigua-et-Barbuda', 'name_en' => 'Antigua and Barbuda', 'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'BS', 'name_fr' => 'Bahamas',         'name_en' => 'Bahamas',           'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'BB', 'name_fr' => 'Barbade',         'name_en' => 'Barbados',          'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'BZ', 'name_fr' => 'Belize',          'name_en' => 'Belize',            'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+501'],
            ['code' => 'CR', 'name_fr' => 'Costa Rica',      'name_en' => 'Costa Rica',        'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+506'],
            ['code' => 'CU', 'name_fr' => 'Cuba',            'name_en' => 'Cuba',              'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+53'],
            ['code' => 'DM', 'name_fr' => 'Dominique',       'name_en' => 'Dominica',          'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'DO', 'name_fr' => 'République Dominicaine', 'name_en' => 'Dominican Republic', 'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'SV', 'name_fr' => 'Salvador',        'name_en' => 'El Salvador',       'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+503'],
            ['code' => 'GD', 'name_fr' => 'Grenade',         'name_en' => 'Grenada',           'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'GT', 'name_fr' => 'Guatemala',       'name_en' => 'Guatemala',         'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+502'],
            ['code' => 'HT', 'name_fr' => 'Haïti',           'name_en' => 'Haiti',             'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+509'],
            ['code' => 'HN', 'name_fr' => 'Honduras',        'name_en' => 'Honduras',          'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+504'],
            ['code' => 'JM', 'name_fr' => 'Jamaïque',        'name_en' => 'Jamaica',           'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'NI', 'name_fr' => 'Nicaragua',       'name_en' => 'Nicaragua',         'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+505'],
            ['code' => 'PA', 'name_fr' => 'Panama',          'name_en' => 'Panama',            'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+507'],
            ['code' => 'KN', 'name_fr' => 'Saint-Kitts-et-Nevis', 'name_en' => 'Saint Kitts and Nevis', 'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'LC', 'name_fr' => 'Sainte-Lucie',    'name_en' => 'Saint Lucia',       'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'VC', 'name_fr' => 'Saint-Vincent-et-les-Grenadines', 'name_en' => 'Saint Vincent and the Grenadines', 'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],
            ['code' => 'TT', 'name_fr' => 'Trinité-et-Tobago', 'name_en' => 'Trinidad and Tobago', 'region' => 'Amérique Centrale & Caraïbes', 'calling_code' => '+1'],

            // ── Amérique du Sud ───────────────────────────────
            ['code' => 'BR', 'name_fr' => 'Brésil',          'name_en' => 'Brazil',            'region' => 'Amérique du Sud', 'calling_code' => '+55'],
            ['code' => 'AR', 'name_fr' => 'Argentine',       'name_en' => 'Argentina',         'region' => 'Amérique du Sud', 'calling_code' => '+54'],
            ['code' => 'BO', 'name_fr' => 'Bolivie',         'name_en' => 'Bolivia',           'region' => 'Amérique du Sud', 'calling_code' => '+591'],
            ['code' => 'CL', 'name_fr' => 'Chili',           'name_en' => 'Chile',             'region' => 'Amérique du Sud', 'calling_code' => '+56'],
            ['code' => 'CO', 'name_fr' => 'Colombie',        'name_en' => 'Colombia',          'region' => 'Amérique du Sud', 'calling_code' => '+57'],
            ['code' => 'EC', 'name_fr' => 'Équateur',        'name_en' => 'Ecuador',           'region' => 'Amérique du Sud', 'calling_code' => '+593'],
            ['code' => 'GY', 'name_fr' => 'Guyana',          'name_en' => 'Guyana',            'region' => 'Amérique du Sud', 'calling_code' => '+592'],
            ['code' => 'PY', 'name_fr' => 'Paraguay',        'name_en' => 'Paraguay',          'region' => 'Amérique du Sud', 'calling_code' => '+595'],
            ['code' => 'PE', 'name_fr' => 'Pérou',           'name_en' => 'Peru',              'region' => 'Amérique du Sud', 'calling_code' => '+51'],
            ['code' => 'SR', 'name_fr' => 'Suriname',        'name_en' => 'Suriname',          'region' => 'Amérique du Sud', 'calling_code' => '+597'],
            ['code' => 'UY', 'name_fr' => 'Uruguay',         'name_en' => 'Uruguay',           'region' => 'Amérique du Sud', 'calling_code' => '+598'],
            ['code' => 'VE', 'name_fr' => 'Venezuela',       'name_en' => 'Venezuela',         'region' => 'Amérique du Sud', 'calling_code' => '+58'],

            // ── Océanie ───────────────────────────────────────
            ['code' => 'AU', 'name_fr' => 'Australie',       'name_en' => 'Australia',         'region' => 'Océanie', 'calling_code' => '+61'],
            ['code' => 'NZ', 'name_fr' => 'Nouvelle-Zélande', 'name_en' => 'New Zealand',      'region' => 'Océanie', 'calling_code' => '+64'],
            ['code' => 'FJ', 'name_fr' => 'Fidji',           'name_en' => 'Fiji',              'region' => 'Océanie', 'calling_code' => '+679'],
            ['code' => 'KI', 'name_fr' => 'Kiribati',        'name_en' => 'Kiribati',          'region' => 'Océanie', 'calling_code' => '+686'],
            ['code' => 'MH', 'name_fr' => 'Îles Marshall',   'name_en' => 'Marshall Islands',  'region' => 'Océanie', 'calling_code' => '+692'],
            ['code' => 'FM', 'name_fr' => 'Micronésie',      'name_en' => 'Micronesia',        'region' => 'Océanie', 'calling_code' => '+691'],
            ['code' => 'NR', 'name_fr' => 'Nauru',           'name_en' => 'Nauru',             'region' => 'Océanie', 'calling_code' => '+674'],
            ['code' => 'PW', 'name_fr' => 'Palaos',          'name_en' => 'Palau',             'region' => 'Océanie', 'calling_code' => '+680'],
            ['code' => 'PG', 'name_fr' => 'Papouasie-Nouvelle-Guinée', 'name_en' => 'Papua New Guinea', 'region' => 'Océanie', 'calling_code' => '+675'],
            ['code' => 'WS', 'name_fr' => 'Samoa',           'name_en' => 'Samoa',             'region' => 'Océanie', 'calling_code' => '+685'],
            ['code' => 'SB', 'name_fr' => 'Îles Salomon',    'name_en' => 'Solomon Islands',   'region' => 'Océanie', 'calling_code' => '+677'],
            ['code' => 'TO', 'name_fr' => 'Tonga',           'name_en' => 'Tonga',             'region' => 'Océanie', 'calling_code' => '+676'],
            ['code' => 'TV', 'name_fr' => 'Tuvalu',          'name_en' => 'Tuvalu',            'region' => 'Océanie', 'calling_code' => '+688'],
            ['code' => 'VU', 'name_fr' => 'Vanuatu',         'name_en' => 'Vanuatu',           'region' => 'Océanie', 'calling_code' => '+678'],
        ];

        foreach ($countries as $country) {
            Country::updateOrCreate(['code' => $country['code']], $country);
        }

        $this->command->info('✅ '.count($countries).' pays créés/mis à jour.');
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

        $this->command->info('✅ '.count($currencies).' devises créées.');
    }

    // ════════════════════════════════════════════════════════
    // INCOTERMS 2020
    // ════════════════════════════════════════════════════════
    private function seedIncoterms(): void
    {
        $this->command->info('📋 Création des Incoterms 2020...');

        $incoterms = [
            // ── Tous modes ────────────────────────────────────
            ['code' => 'EXW', 'name' => 'Ex Works',                       'compatible_modes' => ['SEA', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL'], 'description' => 'Le vendeur met les marchandises à disposition dans ses locaux.'],
            ['code' => 'FCA', 'name' => 'Free Carrier',                   'compatible_modes' => ['SEA', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL'], 'description' => "Le vendeur livre les marchandises au transporteur désigné par l'acheteur."],
            ['code' => 'CPT', 'name' => 'Carriage Paid To',               'compatible_modes' => ['SEA', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL'], 'description' => "Le vendeur paie le transport jusqu'au lieu de destination."],
            ['code' => 'CIP', 'name' => 'Carriage and Insurance Paid To', 'compatible_modes' => ['SEA', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL'], 'description' => "Le vendeur paie le transport et l'assurance jusqu'à destination."],
            ['code' => 'DAP', 'name' => 'Delivered at Place',             'compatible_modes' => ['SEA', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL'], 'description' => 'Le vendeur livre au lieu de destination convenu, non dédouané.'],
            ['code' => 'DPU', 'name' => 'Delivered at Place Unloaded',    'compatible_modes' => ['SEA', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL'], 'description' => 'Le vendeur livre et décharge les marchandises à destination.'],
            ['code' => 'DDP', 'name' => 'Delivered Duty Paid',            'compatible_modes' => ['SEA', 'AIR', 'ROAD', 'RAIL', 'MULTIMODAL'], 'description' => 'Le vendeur supporte tous les coûts et risques, y compris les droits.'],

            // ── Maritime / fluvial uniquement ─────────────────
            ['code' => 'FAS', 'name' => 'Free Alongside Ship',            'compatible_modes' => ['SEA'], 'description' => "Le vendeur livre le long du navire au port d'expédition."],
            ['code' => 'FOB', 'name' => 'Free On Board',                  'compatible_modes' => ['SEA'], 'description' => "Le vendeur livre à bord du navire au port d'expédition."],
            ['code' => 'CFR', 'name' => 'Cost and Freight',               'compatible_modes' => ['SEA'], 'description' => "Le vendeur paie le fret jusqu'au port de destination."],
            ['code' => 'CIF', 'name' => 'Cost, Insurance and Freight',    'compatible_modes' => ['SEA'], 'description' => "Le vendeur paie le fret et l'assurance jusqu'au port de destination."],
        ];

        foreach ($incoterms as $incoterm) {
            Incoterm::firstOrCreate(['code' => $incoterm['code']], $incoterm);
        }

        $this->command->info('✅ '.count($incoterms).' incoterms créés.');
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
            ['code' => 'RIVER',      'name_fr' => 'Fluvial / Lagunaire', 'name_en' => 'River / Lagoon', 'icon' => 'waves'],
        ];

        foreach ($modes as $mode) {
            TransportMode::firstOrCreate(['code' => $mode['code']], $mode);
        }

        $this->command->info('✅ '.count($modes).' modes de transport créés.');
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
            ['code' => 'CHIMIE_D', 'name' => 'Produits chimiques dangereux', 'risk_level' => 3, 'parent' => 'CHIMIE'],
            ['code' => 'CHIMIE_I', 'name' => 'Produits chimiques industriels', 'risk_level' => 2, 'parent' => 'CHIMIE'],
            ['code' => 'ENGRAIS', 'name' => 'Engrais & fertilisants',     'risk_level' => 2, 'parent' => 'CHIMIE'],

            // ── Niveau 2 — Sous-catégories ALIM ─────────────
            ['code' => 'CEREALES', 'name' => 'Céréales & farines',         'risk_level' => 1, 'parent' => 'ALIM'],
            ['code' => 'SUCRE',   'name' => 'Sucre & confiseries',        'risk_level' => 1, 'parent' => 'ALIM'],
            ['code' => 'POISSON', 'name' => 'Poisson & produits de mer',  'risk_level' => 2, 'parent' => 'ALIM'],
            ['code' => 'BOISSONS', 'name' => 'Boissons & alcools',         'risk_level' => 1, 'parent' => 'ALIM'],
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
                    'name' => $cat['name'],
                    'risk_level' => $cat['risk_level'],
                    'parent_id' => $parentId,
                    'is_active' => true,
                ]
            );

            $createdIds[$cat['code']] = $category->id;
        }

        $this->command->info('✅ '.count($categories).' catégories de marchandises créées.');
    }
}
