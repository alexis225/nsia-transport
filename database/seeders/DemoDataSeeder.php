<?php

namespace Database\Seeders;

use App\Models\ApprovalRequest;
use App\Models\ApprovalWorkflowConfig;
use App\Models\Broker;
use App\Models\Certificate;
use App\Models\CertificateRequest;
use App\Models\Coinsurer;
use App\Models\CommissionRule;
use App\Models\CommissionTransaction;
use App\Models\ContractAmendment;
use App\Models\Expert;
use App\Models\GuceCertificate;
use App\Models\InsuranceContract;
use App\Models\Notification;
use App\Models\Tenant;
use App\Models\TaxRule;
use App\Models\TransportMode;
use App\Models\User;
use App\Models\UserRoleGrant;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Seeder;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * ============================================================
 * DemoDataSeeder — Données fictives pour présentation
 * ============================================================
 * Génère un jeu de données réaliste pour démontrer TOUTES
 * les fonctionnalités de NSIA Transport :
 *
 *   - Coassureurs (référentiel filiale) + association par contrat avec
 *     part de coassurance propre (contract_coinsurers.share_rate)
 *   - Experts (référentiel filiale) associés à certains contrats
 *   - Contrats actifs avec valeurs variées (plein / plafond NN300),
 *     conditionnement (Conteneur/Conventionnel/Vrac) et bloc Souscripteur
 *   - Certificats : DRAFT, SUBMITTED, ISSUED, CANCELLED, REPLACED, DUPLICATA
 *   - Avenants sur contrats
 *   - Escalades NN300 EN COURS — les 3 types de déclencheur :
 *       dépassement du plein, plafond cumulé dépassé, nombre de
 *       certificats atteint (module Escalade — Renforcement)
 *   - Délégations de rôle (active, expirée, révoquée)
 *   - Règles de commission (général + spécifique contrat)
 *   - Transactions de commission (pending + paid)
 *   - Référentiel de taxes (filiale × transport × pays)
 *   - Demandes partenaires — les 4 statuts (nouvelle demande,
 *     en traitement, rejetée, certificat mis à disposition)
 *   - Certificats GUCE importés
 *   - Notifications variées (lues/non lues)
 *
 * Lancer : php artisan db:seed --class=DemoDataSeeder
 * Prérequis : TenantSeeder, ReferentialSeeder,
 *             RolesAndPermissionsSeeder, UserSeeder,
 *             ApprovalWorkflowSeeder déjà exécutés
 * ============================================================
 */
class DemoDataSeeder extends Seeder
{
    private array $countries = [
        'Côte d\'Ivoire' => ['Abidjan', 'Bouaké', 'San-Pedro'],
        'Sénégal'        => ['Dakar', 'Thiès'],
        'Bénin'          => ['Cotonou', 'Porto-Novo'],
        'Togo'           => ['Lomé'],
        'Cameroun'       => ['Douala', 'Yaoundé'],
        'France'         => ['Le Havre', 'Marseille'],
        'Chine'          => ['Shanghai', 'Guangzhou'],
        'Émirats Arabes Unis' => ['Dubaï'],
    ];

    // Code ISO2 pour chaque pays ci-dessus, uniquement quand présent dans
    // le référentiel countries (destination_country_code a une contrainte
    // FK) — 'Émirats Arabes Unis' n'y figure pas, donc volontairement absent.
    private array $countryIsoCodes = [
        'Côte d\'Ivoire' => 'CI', 'Sénégal' => 'SN', 'Bénin' => 'BJ',
        'Togo' => 'TG', 'Cameroun' => 'CM', 'France' => 'FR', 'Chine' => 'CN',
    ];

    private array $merchandises = [
        ['nature' => 'Véhicules neufs',          'packaging' => 'RoRo'],
        ['nature' => 'Électronique grand public', 'packaging' => 'Conteneurs 40\'HC'],
        ['nature' => 'Produits pharmaceutiques',  'packaging' => 'Conteneurs réfrigérés'],
        ['nature' => 'Matériaux de construction', 'packaging' => 'Conteneurs 20\''],
        ['nature' => 'Textile et confection',     'packaging' => 'Cartons palettisés'],
        ['nature' => 'Pièces détachées auto',     'packaging' => 'Caisses bois'],
        ['nature' => 'Denrées alimentaires',      'packaging' => 'Conteneurs réfrigérés'],
        ['nature' => 'Équipements industriels',   'packaging' => 'Caisses métalliques'],
        ['nature' => 'Mobilier de bureau',        'packaging' => 'Cartons + films'],
        ['nature' => 'Cosmétiques',               'packaging' => 'Cartons palettisés'],
    ];

    private array $companyNames = [
        'SOTRACI', 'IVOIRE LOGISTIQUE', 'CIM TRANSIT', 'AFRICA SHIPPING CO',
        'TRANSCONTAINERS SARL', 'OCEAN FREIGHT IVOIRE', 'WEST AFRICA TRADING',
        'GROUPE KONE & FILS', 'NSIA AUTOMOBILES', 'PHARMA DISTRIBUTION CI',
        'COMPTOIR COMMERCIAL ABIDJAN', 'SOCIÉTÉ NOUVELLE D\'IMPORT-EXPORT',
        'TROPICAL GOODS SA', 'ATLANTIC TRADE CORP', 'SAHEL DISTRIBUTION',
    ];

    private array $transportTypes = ['SEA', 'AIR', 'ROAD', 'MULTIMODAL', 'RIVER'];
    private array $voyageModes    = ['CONTAINER', 'GROUPAGE', 'CONVENTIONNEL', 'BOUT_EN_BOUT'];

    // Noms de navires / codes compagnie aérienne — pour peupler
    // vessel_name (SEA/RIVER) et flight_number (AIR) sur une partie des
    // certificats démo (auparavant toujours NULL, cf. voyage_via ci-dessous).
    private array $vesselNames  = ['MV NSIA STAR', 'MSC ABIDJAN', 'CMA CGM TOGO', 'MV AFRICA TRADER', 'MAERSK LOMÉ'];
    private array $airlineCodes = ['AF', 'ET', 'RAM', 'KQ', 'TK'];

    public function run(): void
    {
        $this->command->info('🚀 Génération des données de démonstration...');

        $tenants = Tenant::all();
        if ($tenants->isEmpty()) {
            $this->command->error('Aucune filiale trouvée. Lancez TenantSeeder d\'abord.');
            return;
        }

        foreach ($tenants as $tenant) {
            $this->command->info("  → Filiale : {$tenant->name}");
            $this->seedForTenant($tenant);
        }

        $this->command->info('');
        $this->command->info('✅ Données de démonstration générées avec succès !');
        $this->printSummary();
    }

    // ════════════════════════════════════════════════════════
    private function seedForTenant(Tenant $tenant): void
    {
        $users = User::where('tenant_id', $tenant->id)->get();
        if ($users->isEmpty()) return;

        $admin        = $users->first(fn ($u) => $u->hasRole('admin_filiale')) ?? $users->first();
        $souscripteur = $users->first(fn ($u) => $u->hasRole('souscripteur')) ?? $users->first();
        $courtierUser = $users->first(fn ($u) => $u->hasRole('courtier_local'));

        // ── 1. Courtiers (inclut le courtier de démo relié à un login) ──
        $brokers = $this->seedBrokers($tenant, $courtierUser);

        // ── 2. Coassureurs (référentiel filiale — pas de taux ici) ──────
        $coinsurers = $this->seedCoinsurers($tenant);

        // ── 3. Experts (référentiel filiale) ────────────────────────────
        $experts = $this->seedExperts($tenant);

        // ── 4. Contrats (10 par filiale) ───────────────────────
        $contracts = $this->seedContracts($tenant, $brokers, $souscripteur, $coinsurers, $experts);

        // ── 5. Avenants sur 30% des contrats ───────────────────
        $this->seedAmendments($contracts, $souscripteur);

        // ── 6. Certificats (variés : statuts, montants) ────────
        $certificates = $this->seedCertificates($tenant, $contracts, $souscripteur);

        // ── 7. Remplacement de certificat (statut REPLACED) ─────
        $this->seedCertificateReplacement($tenant, $certificates, $souscripteur);

        // ── 8. Escalades NN300 — 3 types de déclencheur ─────────
        $this->seedEscalades($tenant, $certificates, $contracts, $souscripteur, $admin);

        // ── 9. Règles + transactions de commission ──────────────
        $this->seedCommissionRules($tenant, $brokers, $contracts, $admin);

        // ── 10. Référentiel de taxes ──────────────────────────────
        $this->seedTaxRules($tenant, $admin);

        // ── 11. Demandes partenaires ───────────────────────────────
        $demoBroker = $courtierUser
            ? $brokers->first(fn ($b) => $b->user_id === $courtierUser->id)
            : null;
        $this->seedCertificateRequests($tenant, $demoBroker ?? $brokers->first(), $courtierUser, $admin, $certificates);

        // ── 12. Certificats GUCE importés ─────────────────────────
        $this->seedGuceCertificates($tenant, $admin);

        // ── 13. Délégations ───────────────────────────────────────
        $this->seedDelegations($tenant, $users, $admin);

        // ── 14. Notifications variées ─────────────────────────────
        $this->seedNotifications($users);
    }

    // ════════════════════════════════════════════════════════
    // 1. COURTIERS
    // ════════════════════════════════════════════════════════
    private function seedBrokers(Tenant $tenant, ?User $courtierUser): \Illuminate\Support\Collection
    {
        $brokers = Broker::where('tenant_id', $tenant->id)->get();

        if ($brokers->count() < 3) {
            $names = ['ASSUR COURTAGE CI', 'GLOBAL BROKER SERVICES', 'NSIA COURTAGE PARTNERS'];

            foreach ($names as $i => $name) {
                $broker = Broker::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'code' => 'BRK-' . $tenant->code . '-' . ($i + 1)],
                    [
                        'name'         => $name,
                        'type'         => $i === 1 ? Broker::TYPE_FOREIGN : Broker::TYPE_LOCAL,
                        'country_code' => strlen($tenant->code) === 2 ? $tenant->code : 'CI',
                        'email'        => Str::slug($name) . '@courtage-demo.com',
                        'phone'        => '+225 07 ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99),
                        'address'      => 'Abidjan, Plateau',
                        'is_active'    => true,
                    ]
                );
                if (! $brokers->contains('id', $broker->id)) $brokers->push($broker);
            }
        }

        // Le courtier de démo créé par UserSeeder (relié à un compte de
        // connexion réel) doit figurer dans la collection — c'est lui qui
        // sert de demandeur pour les demandes partenaires ci-dessous, afin
        // que le Directeur puisse se connecter et voir ses propres demandes.
        if ($courtierUser && ! $brokers->contains('user_id', $courtierUser->id)) {
            $demoBroker = Broker::where('tenant_id', $tenant->id)->where('user_id', $courtierUser->id)->first();
            if ($demoBroker) $brokers->push($demoBroker);
        }

        return $brokers;
    }

    // ════════════════════════════════════════════════════════
    // 2. COASSUREURS (référentiel filiale — Renforcement)
    // ════════════════════════════════════════════════════════
    // Un coassureur est identifié sur une filiale avec simplement ses
    // coordonnées — AUCUN taux à ce niveau, un même coassureur pouvant
    // intervenir sur plusieurs contrats avec des parts différentes
    // (cf. contract_coinsurers.share_rate dans seedContracts()).
    private function seedCoinsurers(Tenant $tenant): \Illuminate\Support\Collection
    {
        $coinsurers = Coinsurer::where('tenant_id', $tenant->id)->get();
        if ($coinsurers->count() >= 3) return $coinsurers;

        $names = ['SUNU ASSURANCES', 'ALLIANZ AFRIQUE', 'SANLAM ASSURANCES'];

        foreach ($names as $name) {
            $coinsurer = Coinsurer::firstOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $name],
                [
                    'country_code' => strlen($tenant->code) === 2 ? $tenant->code : 'CI',
                    'address'      => 'Abidjan, Plateau',
                    'email'        => Str::slug($name) . '@coassureur-demo.com',
                    'phone'        => '+225 07 ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99),
                    'is_active'    => true,
                ]
            );
            if (! $coinsurers->contains('id', $coinsurer->id)) $coinsurers->push($coinsurer);
        }

        return $coinsurers;
    }

    // ════════════════════════════════════════════════════════
    // 3. EXPERTS (référentiel filiale)
    // ════════════════════════════════════════════════════════
    private function seedExperts(Tenant $tenant): \Illuminate\Support\Collection
    {
        $experts = Expert::where('tenant_id', $tenant->id)->get();
        if ($experts->count() >= 2) return $experts;

        $names = ['CABINET EXPERTISE MARITIME CI', 'AFRICA CARGO SURVEYORS'];

        foreach ($names as $name) {
            $expert = Expert::firstOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $name],
                [
                    'country_code' => strlen($tenant->code) === 2 ? $tenant->code : 'CI',
                    'email'        => Str::slug($name) . '@expertise-demo.com',
                    'phone'        => '+225 05 ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99),
                    'is_active'    => true,
                ]
            );
            if (! $experts->contains('id', $expert->id)) $experts->push($expert);
        }

        return $experts;
    }

    // ════════════════════════════════════════════════════════
    // 4. CONTRATS
    // ════════════════════════════════════════════════════════
    private function seedContracts(Tenant $tenant, $brokers, ?User $subscriber, $coinsurers = null, $experts = null): \Illuminate\Support\Collection
    {
        $existing = InsuranceContract::where('tenant_id', $tenant->id)->count();
        if ($existing >= 12) {
            return InsuranceContract::where('tenant_id', $tenant->id)->get();
        }

        $contracts = collect();
        $conditioningCycle = [['CONTAINER'], ['CONVENTIONNEL'], ['VRAC'], ['CONTAINER', 'CONVENTIONNEL']];

        for ($i = 1; $i <= 10; $i++) {
            $companyName = $this->companyNames[array_rand($this->companyNames)];

            // "Plein" — plafond assurable PAR certificat (distinct du
            // plafond NN300 cumulé ci-dessous).
            $plein = [
                5_000_000, 15_000_000, 25_000_000, 50_000_000,
                75_000_000, 100_000_000, 150_000_000, 200_000_000,
                300_000_000, 500_000_000,
            ][$i - 1];

            $startDate = now()->subMonths(rand(1, 6));

            $contract = InsuranceContract::create([
                'tenant_id'              => $tenant->id,
                'broker_id'              => $brokers->isNotEmpty() ? $brokers->random()->id : null,
                'subscriber_id'          => $subscriber?->id,
                'contract_number'        => 'CT-' . $tenant->code . '-' . now()->format('y') . '-' . str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                'insured_name'           => $companyName,
                'type'                   => match (true) {
                    $i % 5 === 0 => InsuranceContract::TYPE_VOYAGE,
                    $i === 7     => InsuranceContract::TYPE_TIERS_CHARGEUR, // fonctionne comme une police ouverte
                    $i % 3 === 0 => InsuranceContract::TYPE_ANNUAL_VOYAGE,
                    default      => InsuranceContract::TYPE_OPEN_POLICY,
                },
                // Devise imposée par la filiale (Renforcement — plus de
                // choix libre de devise sur le contrat).
                'currency_code'          => $tenant->currency_code,
                'plein'                  => $plein,
                'subscription_limit'     => $plein * 3, // ~3 certificats avant le plafond cumulé
                'used_limit'             => 0,
                'certificates_limit'     => $i % 5 === 0 ? 3 : null,
                'certificates_count'     => 0,
                'escalade_threshold_pct' => $i % 5 === 0 ? 10.00 : null, // seuil custom sur 1 contrat sur 5
                'escalade_enabled'       => true,
                'conditioning_types'     => $conditioningCycle[($i - 1) % count($conditioningCycle)],
                'status'                 => $i === 10 ? InsuranceContract::STATUS_EXPIRED : InsuranceContract::STATUS_ACTIVE,
                'effective_date'         => $startDate,
                'expiry_date'            => $startDate->copy()->addYear(),
                'created_by'             => $subscriber?->id,
                'updated_by'             => $subscriber?->id,
                'created_at'             => $startDate,
            ]);

            // Coassureurs sur 1 contrat sur 3 — part de coassurance propre à
            // CE contrat (un même coassureur peut avoir un taux différent
            // sur un autre contrat, cf. Renforcement §3).
            if ($coinsurers && $coinsurers->count() >= 2 && $i % 3 === 0) {
                $contract->coinsurers()->attach([
                    $coinsurers->get(0)->id => ['share_rate' => 30.00],
                    $coinsurers->get(1)->id => ['share_rate' => 15.00],
                ]);
            }

            // Experts sur 1 contrat sur 4, associés dès la création
            // (Renforcement §5 — plus besoin d'attendre un sinistre).
            if ($experts && $experts->isNotEmpty() && $i % 4 === 0) {
                $contract->experts()->attach($experts->random()->id);
            }

            $contracts->push($contract);
        }

        // ── Contrat 11 — Dépassement du plafond NN300 standard (2 Mds
        // FCFA), en attente de validation Groupe/DTAG (Renforcement
        // escalade NN300). Visible dans /admin/contracts (statut "En
        // attente d'approbation") — seul super_admin peut l'approuver.
        $nn300Number = 'CT-' . $tenant->code . '-' . now()->format('y') . '-0011';
        if (InsuranceContract::where('tenant_id', $tenant->id)->where('contract_number', $nn300Number)->doesntExist()) {
            $contracts->push(InsuranceContract::create([
                'tenant_id'              => $tenant->id,
                'broker_id'              => $brokers->isNotEmpty() ? $brokers->random()->id : null,
                'subscriber_id'          => $subscriber?->id,
                'contract_number'        => $nn300Number,
                'insured_name'           => 'GROUPE INDUSTRIEL PANAFRICAIN',
                'type'                   => InsuranceContract::TYPE_OPEN_POLICY,
                'currency_code'          => $tenant->currency_code,
                'plein'                  => 800_000_000,
                'subscription_limit'     => 3_000_000_000, // > 2 Mds standard groupe → validation DTAG requise
                'treaty_limit'           => 6_000_000_000,
                'used_limit'             => 0,
                'requires_approval'      => true,
                'escalade_enabled'       => true,
                'status'                 => 'PENDING_APPROVAL',
                'effective_date'         => now(),
                'expiry_date'            => now()->addYear(),
                'created_by'             => $subscriber?->id,
                'updated_by'             => $subscriber?->id,
            ]));
        }

        // ── Contrat 12 — Contrat Abonnement (police ouverte) arrivant à
        // échéance dans 2 mois — démontre l'alerte 3 mois + rappel
        // mensuel (nsia:check-contracts).
        $abonnementNumber = 'CT-' . $tenant->code . '-' . now()->format('y') . '-0012';
        if (InsuranceContract::where('tenant_id', $tenant->id)->where('contract_number', $abonnementNumber)->doesntExist()) {
            $contracts->push(InsuranceContract::create([
                'tenant_id'              => $tenant->id,
                'broker_id'              => $brokers->isNotEmpty() ? $brokers->random()->id : null,
                'subscriber_id'          => $subscriber?->id,
                'contract_number'        => $abonnementNumber,
                'insured_name'           => 'COMPTOIR COMMERCIAL ABIDJAN',
                'type'                   => InsuranceContract::TYPE_OPEN_POLICY,
                'currency_code'          => $tenant->currency_code,
                'plein'                  => 50_000_000,
                'subscription_limit'     => 2_000_000_000,
                'treaty_limit'           => 6_000_000_000,
                'used_limit'             => 0,
                'escalade_enabled'       => true,
                'status'                 => InsuranceContract::STATUS_ACTIVE,
                'effective_date'         => now()->subMonths(10),
                'expiry_date'            => now()->addMonths(2), // dans la fenêtre d'alerte 3 mois
                'notice_period_days'     => 60,
                'created_by'             => $subscriber?->id,
                'updated_by'             => $subscriber?->id,
            ]));
        }

        return $contracts;
    }

    // ════════════════════════════════════════════════════════
    // 3. AVENANTS
    // ════════════════════════════════════════════════════════
    private function seedAmendments($contracts, ?User $creator): void
    {
        if (! class_exists(ContractAmendment::class)) return;

        $eligible = $contracts->where('status', 'ACTIVE')->take(3);

        foreach ($eligible as $i => $contract) {
            $existing = ContractAmendment::where('contract_id', $contract->id)->exists();
            if ($existing) continue;

            $oldPlein = (float) $contract->plein;
            $newPlein = round($oldPlein * 1.20, 2); // +20%

            ContractAmendment::create([
                'tenant_id'        => $contract->tenant_id,
                'contract_id'      => $contract->id,
                'amendment_number' => 'AV-' . $contract->contract_number . '-' . str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
                'sequence'         => 1,
                'reason'           => 'Augmentation de la valeur assurée',
                'description'      => 'Augmentation du plein du contrat suite à extension du contrat commercial.',
                'changes'          => [
                    'plein' => ['before' => $oldPlein, 'after' => $newPlein],
                ],
                'status'       => 'APPROVED',
                'submitted_by' => $creator?->id,
                'submitted_at' => now()->subDays(rand(21, 40)),
                'reviewed_by'  => $creator?->id,
                'reviewed_at'  => now()->subDays(rand(1, 20)),
                'applied_at'   => now()->subDays(rand(1, 20)),
                'created_by'   => $creator?->id,
                'created_at'   => now()->subDays(rand(21, 40)),
            ]);
        }
    }

    // ════════════════════════════════════════════════════════
    // 4. CERTIFICATS
    // ════════════════════════════════════════════════════════
    private function seedCertificates(Tenant $tenant, $contracts, ?User $creator): \Illuminate\Support\Collection
    {
        $existing = Certificate::where('tenant_id', $tenant->id)->count();
        if ($existing >= 15) {
            return Certificate::where('tenant_id', $tenant->id)->get();
        }

        $certificates = collect();
        $activeContracts = $contracts->where('status', 'ACTIVE');
        if ($activeContracts->isEmpty()) return $certificates;

        $countriesKeys = array_keys($this->countries);
        $statuses = [
            'DRAFT', 'DRAFT',
            'SUBMITTED', 'SUBMITTED',
            'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED',
            'CANCELLED',
        ];

        // Préfixé par le code filiale : certificate_number est unique
        // globalement (toutes filiales confondues), pas seulement par tenant.
        $certNumber = 100000;

        foreach ($statuses as $idx => $status) {
            $contract = $activeContracts->random();
            $merch    = $this->merchandises[array_rand($this->merchandises)];

            $fromCountry = $countriesKeys[array_rand($countriesKeys)];
            $toCountry   = $countriesKeys[array_rand($countriesKeys)];
            while ($toCountry === $fromCountry) {
                $toCountry = $countriesKeys[array_rand($countriesKeys)];
            }
            $fromCity = $this->countries[$fromCountry][array_rand($this->countries[$fromCountry])];
            $toCity   = $this->countries[$toCountry][array_rand($this->countries[$toCountry])];

            // ~35% des certificats ont un point de transit ; le pays de
            // transit est distinct des pays de départ/arrivée.
            $viaCountry = null;
            if (rand(1, 100) <= 35) {
                $viaCountry = $countriesKeys[array_rand($countriesKeys)];
                while (in_array($viaCountry, [$fromCountry, $toCountry], true)) {
                    $viaCountry = $countriesKeys[array_rand($countriesKeys)];
                }
            }
            $viaCity = $viaCountry ? $this->countries[$viaCountry][array_rand($this->countries[$viaCountry])] : null;

            $transportType = $this->transportTypes[array_rand($this->transportTypes)];
            // Navire renseigné ~70% du temps pour SEA/RIVER, vol ~70% du
            // temps pour AIR — le reste volontairement vide (données réelles
            // parfois incomplètes).
            $vesselName   = in_array($transportType, ['SEA', 'RIVER'], true) && rand(1, 100) <= 70
                ? $this->vesselNames[array_rand($this->vesselNames)] : null;
            $flightNumber = $transportType === 'AIR' && rand(1, 100) <= 70
                ? $this->airlineCodes[array_rand($this->airlineCodes)] . ' ' . rand(100, 999) : null;

            // Valeur du certificat calée sur le "plein" (plafond par
            // certificat) du contrat — certains proches/dépassant le seuil
            // d'escalade configuré.
            $plein        = (float) ($contract->plein ?: 10_000_000);
            $thresholdPct = (float) ($contract->escalade_threshold_pct ?? 15);

            $valueRatio = match (true) {
                $idx === 2 => ($thresholdPct / 100) * 1.5,  // dépasse le seuil → escalade
                $idx === 5 => ($thresholdPct / 100) * 0.95, // juste sous le seuil
                default    => rand(2, 12) / 100,             // valeur normale
            };

            $insuredValue = round($plein * $valueRatio, 2);
            $voyageDate   = now()->subDays(rand(0, 60));
            $certNumber++;

            $primeBreakdown = $this->buildDemoPrimeBreakdown($contract, $insuredValue);
            $primeBreakdownByKey = collect($primeBreakdown)->keyBy('key');
            $primeTotal = $primeBreakdownByKey->get('prime_totale')['amount'] ?? 0;
            $primeNette = $primeBreakdownByKey->get('prime_nette')['amount'] ?? 0;

            $cert = Certificate::create([
                'tenant_id'        => $tenant->id,
                'contract_id'      => $contract->id,
                'document_type'    => Certificate::DOC_TYPE_ORIGINAL,
                'certificate_number' => 'N°' . $tenant->code . '-' . str_pad((string) $certNumber, 6, '0', STR_PAD_LEFT),
                'policy_number'    => $contract->contract_number,
                'insured_name'     => $contract->insured_name,
                'insured_ref'      => 'RC-' . rand(100000, 999999) . ' / ' . $tenant->code,
                'voyage_date'      => $voyageDate,
                'voyage_from'      => "{$fromCity}, {$fromCountry}",
                'voyage_to'        => "{$toCity}, {$toCountry}",
                'voyage_via'       => $viaCity ? "{$viaCity}, {$viaCountry}" : null,
                'origin_country_code'      => $this->countryIsoCodes[$fromCountry] ?? null,
                'destination_country_code' => $this->countryIsoCodes[$toCountry] ?? null,
                'transport_type'   => $transportType,
                'vessel_name'      => $vesselName,
                'flight_number'    => $flightNumber,
                'voyage_mode'      => $this->voyageModes[array_rand($this->voyageModes)],
                'expedition_items' => [[
                    'marks'          => 'NSIA-' . rand(100, 999),
                    'package_numbers'=> '1 à ' . rand(5, 50),
                    'package_count'  => rand(5, 50),
                    'weight'         => rand(500, 25000) . ' kg',
                    'nature'         => $merch['nature'],
                    'packaging'      => $merch['packaging'],
                    'insured_value'  => $insuredValue,
                ]],
                'currency_code'        => $contract->currency_code,
                'insured_value'        => $insuredValue,
                'insured_value_letters'=> $this->numberToFrenchWords($insuredValue) . ' ' . $contract->currency_code,
                'guarantee_mode'       => 'Tous risques',
                'rate_divers'          => 0.05,
                'rate_surprime'        => 0.02,
                'prime_breakdown'      => $primeBreakdown,
                'prime_total'          => $primeTotal,
                'prime_nette'          => $primeNette,
                'status'      => $status,
                'created_by'  => $creator?->id,
                'created_at'  => $voyageDate->copy()->subDays(rand(1, 5)),
            ]);

            // Compléter selon le statut
            if (in_array($status, ['SUBMITTED', 'ISSUED', 'CANCELLED'])) {
                $cert->submitted_at = $cert->created_at->copy()->addHours(2);
                $cert->submitted_by = $creator?->id;
            }
            if ($status === 'ISSUED') {
                $cert->issued_at = $cert->submitted_at->copy()->addHours(rand(1, 24));
                $cert->issued_by = $creator?->id;
                $cert->qr_token  = Str::random(48);
            }
            if ($status === 'CANCELLED') {
                $cert->cancelled_at        = now()->subDays(rand(1, 10));
                $cert->cancellation_reason = 'Annulation à la demande du client — voyage reporté.';
            }
            $cert->save();

            $certificates->push($cert);
        }

        // Créer 1 duplicata sur le premier certificat ISSUED
        $originalIssued = $certificates->first(fn ($c) => $c->status === 'ISSUED');
        if ($originalIssued && ! $originalIssued->duplicate_count) {
            $duplicate = $originalIssued->replicate();
            $duplicate->id                  = (string) Str::uuid();
            $duplicate->parent_id           = $originalIssued->id;
            $duplicate->document_type       = Certificate::DOC_TYPE_DUPLICATA;
            $duplicate->certificate_number  = $originalIssued->certificate_number . '-D1';
            $duplicate->reissued_at         = now();
            $duplicate->reissued_by         = $creator?->id;
            $duplicate->reissue_reason      = 'Document original perdu par le client.';
            $duplicate->qr_token            = Str::random(48);
            $duplicate->created_at          = now();
            $duplicate->save();

            $originalIssued->update(['duplicate_count' => 1]);
            $certificates->push($duplicate);
        }

        return $certificates;
    }

    // ════════════════════════════════════════════════════════
    // 4bis. REMPLACEMENT DE CERTIFICAT (statut REPLACED — Renforcement)
    // ════════════════════════════════════════════════════════
    // Démontre le 6ᵉ statut demandé par la DTAG : un certificat ISSUED
    // remplacé par un nouveau, avec mention croisée (replaced_by_certificate_id
    // / replaces), même logique que CertificateController::replace().
    private function seedCertificateReplacement(Tenant $tenant, $certificates, ?User $creator): void
    {
        // Idempotence : un seul remplacement démo par filiale. Sans ce
        // garde-fou au niveau filiale, chaque nouveau passage du seeder
        // choisirait un autre certificat ISSUED encore éligible parmi les
        // 8 générés par seedCertificates() et en ajouterait un de plus.
        if (Certificate::where('tenant_id', $tenant->id)->where('status', 'REPLACED')->exists()) return;

        $old = $certificates->first(fn ($c) =>
            $c->status === 'ISSUED'
            && $c->document_type === Certificate::DOC_TYPE_ORIGINAL
            && ! $c->duplicate_count
        );
        if (! $old) return;

        $newNumber = $old->certificate_number . '-R1';
        if (Certificate::where('certificate_number', $newNumber)->exists()) return;

        $new = Certificate::create([
            'tenant_id'                 => $tenant->id,
            'contract_id'               => $old->contract_id,
            'document_type'             => Certificate::DOC_TYPE_ORIGINAL,
            'certificate_number'        => $newNumber,
            'policy_number'             => $old->policy_number,
            'insured_name'              => $old->insured_name,
            'insured_ref'               => $old->insured_ref,
            'voyage_date'               => $old->voyage_date,
            'voyage_from'               => $old->voyage_from,
            'voyage_to'                 => $old->voyage_to,
            'voyage_via'                => $old->voyage_via,
            'origin_country_code'       => $old->origin_country_code,
            'destination_country_code'  => $old->destination_country_code,
            'transport_type'            => $old->transport_type,
            'vessel_name'               => $old->vessel_name,
            'flight_number'             => $old->flight_number,
            'voyage_mode'               => $old->voyage_mode,
            'expedition_items'          => $old->expedition_items,
            'currency_code'             => $old->currency_code,
            'insured_value'             => $old->insured_value,
            'insured_value_letters'     => $old->insured_value_letters,
            'guarantee_mode'            => $old->guarantee_mode,
            'rate_divers'               => $old->rate_divers,
            'rate_surprime'             => $old->rate_surprime,
            'prime_breakdown'           => $old->prime_breakdown,
            'prime_total'               => $old->prime_total,
            'prime_nette'               => $old->prime_nette,
            'status'                    => Certificate::STATUS_ISSUED,
            'created_by'                => $creator?->id,
            'submitted_at'              => now(),
            'submitted_by'              => $creator?->id,
            'issued_at'                 => now(),
            'issued_by'                 => $creator?->id,
            'qr_token'                  => Str::random(48),
        ]);

        $old->update([
            'status'                     => Certificate::STATUS_REPLACED,
            'replaced_at'                => now(),
            'replaced_by_certificate_id' => $new->id,
        ]);

        $certificates->push($new);
    }

    // Décompte de prime — même formule et mêmes clés que le calcul réel
    // (CertificateController::buildPrimeBreakdown) :
    //   Prime Nette = Prime(RO) + Prime(RG) + Prime(Divers) + Prime(Surprime)
    //   Taxe        = Taux de taxe × (Prime Nette + Accessoires)
    //   Prime TTC   = Prime Nette + Accessoires + Taxe
    // Prime Nette positionnée juste avant Accessoires (cf. CertificateTemplateSeeder).
    private function buildDemoPrimeBreakdown(InsuranceContract $contract, float $insuredValue, float $rateDivers = 0.05, float $rateSurprime = 0.02): array
    {
        $lineAmount = fn (float $rate): float => $rate > 0 ? round($insuredValue * $rate / 100, 2) : 0;

        $rateRo     = (float) ($contract->rate_ro ?: 0.35);
        $rateRg     = (float) ($contract->rate_rg ?: 0.10);
        $taxRatePct = 5.00; // taux indicatif de démo — le référentiel réel passe par TaxRule

        $ro = $lineAmount($rateRo);
        $rg = $lineAmount($rateRg);
        $divers = $lineAmount($rateDivers);
        $surprime = $lineAmount($rateSurprime);
        $primeNette = round($ro + $rg + $divers + $surprime, 2);

        // Accessoires : montant fixe porté par le contrat (pas un taux).
        $accessoires = (float) ($contract->accessories_amount ?: 0);
        $taxe        = round(($primeNette + $accessoires) * $taxRatePct / 100, 2);
        $primeTotale = round($primeNette + $accessoires + $taxe, 2);

        $lines = [
            ['key' => 'ro',           'label' => 'R.O.',        'rate' => $rateRo,       'amount' => $ro],
            ['key' => 'rg',           'label' => 'R.G.',        'rate' => $rateRg,       'amount' => $rg],
            ['key' => 'divers',       'label' => 'Divers',      'rate' => $rateDivers,   'amount' => $divers],
            ['key' => 'surprime',     'label' => 'Surprime',    'rate' => $rateSurprime, 'amount' => $surprime],
            ['key' => 'prime_nette',  'label' => 'Prime Nette', 'rate' => null,          'amount' => $primeNette],
            ['key' => 'accessoires',  'label' => 'Accessoires', 'rate' => null,          'amount' => $accessoires],
            ['key' => 'taxe',         'label' => 'Taxe',        'rate' => $taxRatePct,   'amount' => $taxe],
            ['key' => 'prime_totale', 'label' => 'Prime Total', 'rate' => null,          'amount' => $primeTotale],
        ];

        return array_map(fn ($line) => [...$line, 'label_en' => null], $lines);
    }

    // ════════════════════════════════════════════════════════
    // 5. ESCALADES NN300 — 3 types de déclencheur (Renforcement)
    // ════════════════════════════════════════════════════════
    private function seedEscalades(Tenant $tenant, $certificates, $contracts, ?User $creator, ?User $admin): void
    {
        if (! class_exists(ApprovalRequest::class) || ! class_exists(ApprovalWorkflowConfig::class)) return;

        $configs = ApprovalWorkflowConfig::where('tenant_id', $tenant->id)
            ->where('entity_type', 'CERTIFICATE')
            ->where('is_active', true)
            ->get();
        if ($configs->isEmpty()) return;

        // Tri déterministe (numéro de contrat) — sinon get(1)/get(2) ci-dessous
        // pointeraient vers un contrat différent à chaque passage du seeder
        // (la collection $contracts vient d'une requête sans ORDER BY côté
        // Postgres une fois seedContracts() en mode "déjà existant"), et
        // quickDemoCertificate() générerait un nouveau certificat déterministe
        // pour CE contrat-là — donc plus de certificats à chaque relance.
        $activeContracts = $contracts->where('status', 'ACTIVE')->sortBy('contract_number')->values();
        if ($activeContracts->isEmpty()) return;

        // A. Dépassement du "plein" (%) — sur le certificat SUBMITTED déjà généré
        $pctConfig = $configs->first(fn ($c) => isset($c->trigger_condition['insured_value_pct_of_contract']));
        if ($pctConfig) {
            $cert = $certificates->first(fn ($c) => $c->status === 'SUBMITTED');
            if ($cert) {
                $this->createEscaladeRequest($tenant, $cert, $pctConfig, $creator, $admin,
                    "Escalade NN300 — valeur certificat : {$cert->insured_value} {$cert->currency_code} (dépassement du plein)");
            }
        }

        // B. Plafond NN300 cumulé dépassé (renforcement)
        $subConfig = $configs->first(fn ($c) => isset($c->trigger_condition['subscription_limit_exceeded']));
        if ($subConfig && $activeContracts->count() > 1) {
            $contract = $activeContracts->get(1);
            $contract->update(['used_limit' => round((float) $contract->subscription_limit * 0.90, 2)]);

            $overValue = round((float) $contract->subscription_limit * 0.15, 2);
            $cert = $this->quickDemoCertificate($tenant, $contract, $creator, $overValue, 'B');

            $this->createEscaladeRequest($tenant, $cert, $subConfig, $creator, $admin,
                "Escalade NN300 — la soumission dépasse le plafond NN300 cumulé du contrat {$contract->contract_number}");
        }

        // C. Nombre de certificats maximal atteint (renforcement)
        $certsConfig = $configs->first(fn ($c) => isset($c->trigger_condition['certificates_limit_reached']));
        if ($certsConfig && $activeContracts->count() > 2) {
            $contract = $activeContracts->get(2);
            $contract->update(['certificates_limit' => 3, 'certificates_count' => 3]);

            $cert = $this->quickDemoCertificate($tenant, $contract, $creator, round((float) $contract->plein * 0.05, 2), 'C');

            $this->createEscaladeRequest($tenant, $cert, $certsConfig, $creator, $admin,
                "Escalade NN300 — le contrat {$contract->contract_number} a atteint son nombre maximal de certificats");
        }
    }

    // Certificat minimal SUBMITTED, dédié aux scénarios d'escalade B et C.
    // Numéro DÉTERMINISTE (dérivé du contrat + suffixe de scénario, pas un
    // compteur en mémoire réinitialisé à chaque exécution) + firstOrCreate,
    // pour que le seeder reste rejouable sans violer l'unicité de
    // certificate_number lors d'un second passage sur la même base.
    private function quickDemoCertificate(Tenant $tenant, InsuranceContract $contract, ?User $creator, float $insuredValue, string $suffix): Certificate
    {
        $now = now();
        $number = 'N°ESC-' . $contract->contract_number . '-' . $suffix;

        return Certificate::firstOrCreate(
            ['certificate_number' => $number],
            [
                'tenant_id'          => $tenant->id,
                'contract_id'        => $contract->id,
                'document_type'      => Certificate::DOC_TYPE_ORIGINAL,
                'policy_number'      => $contract->contract_number,
                'insured_name'       => $contract->insured_name,
                'voyage_date'        => $now->copy()->subDays(2),
                'voyage_from'        => 'Abidjan, Côte d\'Ivoire',
                'voyage_to'          => 'Le Havre, France',
                'origin_country_code'      => 'CI',
                'destination_country_code' => 'FR',
                'transport_type'     => 'SEA',
                'voyage_mode'        => 'CONTAINER',
                'expedition_items'   => [[
                    'marks' => 'NSIA-DEMO', 'package_count' => 10, 'weight' => '5000 kg',
                    'nature' => 'Marchandises diverses', 'packaging' => 'Conteneurs',
                ]],
                'currency_code'         => $contract->currency_code,
                'insured_value'         => $insuredValue,
                'insured_value_letters' => $this->numberToFrenchWords($insuredValue) . ' ' . $contract->currency_code,
                'guarantee_mode'        => 'Tous risques',
                'prime_total'           => round($insuredValue * 0.005, 2),
                'prime_nette'           => round($insuredValue * 0.005, 2),
                'status'                => 'SUBMITTED',
                'created_by'            => $creator?->id,
                'submitted_at'          => $now,
                'submitted_by'          => $creator?->id,
            ]
        );
    }

    private function createEscaladeRequest(Tenant $tenant, Certificate $cert, ApprovalWorkflowConfig $config, ?User $creator, ?User $admin, string $note): void
    {
        if (ApprovalRequest::where('entity_id', $cert->id)->exists()) return;

        ApprovalRequest::create([
            'tenant_id'    => $tenant->id,
            'entity_type'  => 'CERTIFICATE',
            'entity_id'    => $cert->id,
            'workflow_id'  => $config->id,
            'current_step' => 1,
            'total_steps'  => count($config->steps_config ?? []),
            'status'       => 'PENDING',
            'requested_by' => $creator?->id,
            'due_date'     => now()->addHours(36), // dans le délai
            'notes'        => $note,
        ]);

        if ($admin) {
            Notification::send(
                $admin,
                'EscaladeNN300',
                'Escalade NN300 — Approbation Admin Filiale',
                $note,
                ['icon' => 'trending-up', 'color' => 'danger', 'url' => '/admin/approvals']
            );
        }
    }

    // ════════════════════════════════════════════════════════
    // 6. RÈGLES DE COMMISSION
    // ════════════════════════════════════════════════════════
    private function seedCommissionRules(Tenant $tenant, $brokers, $contracts, ?User $creator): void
    {
        if (! class_exists(CommissionRule::class) || $brokers->isEmpty()) return;

        foreach ($brokers as $idx => $broker) {
            $exists = CommissionRule::where('broker_id', $broker->id)
                ->whereNull('contract_id')
                ->exists();
            if ($exists) continue;

            CommissionRule::create([
                'tenant_id'      => $tenant->id,
                'broker_id'      => $broker->id,
                'contract_id'    => null,
                'rate_pct'       => [10.00, 12.50, 8.00][$idx % 3],
                'base_type'      => CommissionRule::BASE_PRIME_TOTAL,
                'effective_date' => now()->subMonths(3),
                'is_active'      => true,
                'notes'          => 'Taux général négocié pour ' . now()->format('Y'),
                'created_by'     => $creator?->id,
            ]);
        }

        // Une règle spécifique sur un contrat avec taux préférentiel
        // (surcharge — nouveauté « override par contrat »)
        $bigContract = $contracts->where('status', 'ACTIVE')->sortByDesc('plein')->first();
        if ($bigContract && $brokers->isNotEmpty()) {
            $exists = CommissionRule::where('contract_id', $bigContract->id)->exists();
            if (! $exists) {
                CommissionRule::create([
                    'tenant_id'      => $tenant->id,
                    'broker_id'      => $brokers->first()->id,
                    'contract_id'    => $bigContract->id,
                    'rate_pct'       => 15.00,
                    'base_type'      => CommissionRule::BASE_PRIME_TOTAL,
                    'effective_date' => now()->subMonth(),
                    'is_active'      => true,
                    'notes'          => 'Taux préférentiel — gros volume (override contrat)',
                    'created_by'     => $creator?->id,
                ]);
            }
        }

        // Générer les transactions de commission pour les certificats ISSUED
        $issuedCerts = Certificate::where('tenant_id', $tenant->id)
            ->where('status', 'ISSUED')
            ->where('document_type', Certificate::DOC_TYPE_ORIGINAL)
            ->get();

        foreach ($issuedCerts as $cert) {
            if (! $cert->contract || ! $cert->contract->broker_id) continue;

            $exists = CommissionTransaction::where('certificate_id', $cert->id)->exists();
            if ($exists) continue;

            $rule = CommissionRule::findApplicable($cert->contract->broker_id, $cert->contract_id, $cert->issued_at?->toDateString());
            if (! $rule) continue;

            $primeBrute = (float) $cert->prime_total;
            $commission = round($primeBrute * (float) $rule->rate_pct / 100, 2);

            CommissionTransaction::create([
                'tenant_id'          => $tenant->id,
                'certificate_id'     => $cert->id,
                'contract_id'        => $cert->contract_id,
                'broker_id'          => $cert->contract->broker_id,
                'commission_rule_id' => $rule->id,
                'currency_code'      => $cert->currency_code,
                'prime_brute'        => $primeBrute,
                'rate_pct'           => $rule->rate_pct,
                'commission'         => $commission,
                'prime_nette'        => $primeBrute - $commission,
                'period_month'       => $cert->issued_at->format('Y-m'),
                'status'             => rand(0, 1) ? 'PAID' : 'PENDING',
                'paid_at'            => rand(0, 1) ? now()->subDays(rand(1, 15)) : null,
                'created_at'         => $cert->issued_at,
            ]);
        }
    }

    // ════════════════════════════════════════════════════════
    // 7. RÉFÉRENTIEL DE TAXES
    // ════════════════════════════════════════════════════════
    private function seedTaxRules(Tenant $tenant, ?User $admin): void
    {
        if (! class_exists(TaxRule::class)) return;

        $existing = TaxRule::where('tenant_id', $tenant->id)->count();
        if ($existing >= 3) return;

        $modes = TransportMode::whereIn('code', ['SEA', 'AIR', 'ROAD'])->get()->keyBy('code');

        // (mode de transport, pays de destination, taux %)
        $combos = [
            ['SEA', 'CI', 3.50],
            ['AIR', 'FR', 5.00],
            ['ROAD', 'TG', 2.00],
        ];

        foreach ($combos as [$modeCode, $countryCode, $rate]) {
            $mode = $modes->get($modeCode);
            if (! $mode) continue;

            TaxRule::firstOrCreate(
                ['tenant_id' => $tenant->id, 'transport_mode_id' => $mode->id, 'country_code' => $countryCode],
                [
                    'rate_pct'       => $rate,
                    'effective_date' => now()->subMonths(6),
                    'is_active'      => true,
                    'notes'          => 'Taux de démonstration',
                    'created_by'     => $admin?->id,
                ]
            );
        }
    }

    // ════════════════════════════════════════════════════════
    // 8. DEMANDES PARTENAIRES — les 4 statuts du cycle de vie
    // ════════════════════════════════════════════════════════
    private function seedCertificateRequests(Tenant $tenant, ?Broker $broker, ?User $courtierUser, ?User $admin, $certificates): void
    {
        if (! class_exists(CertificateRequest::class) || ! $broker || ! $courtierUser) return;

        $existing = CertificateRequest::where('tenant_id', $tenant->id)->count();
        if ($existing >= 4) return;

        $issuedCert = $certificates->first(fn ($c) => $c->status === 'ISSUED' && $c->document_type === Certificate::DOC_TYPE_ORIGINAL);

        $scenarios = [
            [
                'status'       => CertificateRequest::STATUS_PENDING,
                'insured_name' => 'DOUALA FREIGHT EXPRESS',
                'notes'        => 'Nouvelle demande — en attente de prise en charge.',
            ],
            [
                'status'       => CertificateRequest::STATUS_IN_REVIEW,
                'insured_name' => 'SAHEL IMPORT SARL',
                'notes'        => 'Demande en cours de traitement par la filiale.',
                'assigned'     => true,
            ],
            [
                'status'        => CertificateRequest::STATUS_REJECTED,
                'insured_name'  => 'ATLANTIC CARGO LTD',
                'notes'         => 'Dossier incomplet.',
                'review_notes'  => 'Pièces justificatives manquantes — merci de renvoyer la facture commerciale.',
            ],
            [
                'status'            => CertificateRequest::STATUS_APPROVED,
                'insured_name'      => 'WEST AFRICA TRADING',
                'notes'             => 'Certificat mis à disposition.',
                'review_notes'      => 'Dossier conforme — approuvé.',
                'link_certificate'  => true,
            ],
        ];

        foreach ($scenarios as $i => $s) {
            $exists = CertificateRequest::where('tenant_id', $tenant->id)
                ->where('insured_name', $s['insured_name'])->exists();
            if ($exists) continue;

            $createdAt = now()->subDays(10 - $i * 2);

            $req = CertificateRequest::create([
                'tenant_id'         => $tenant->id,
                'broker_id'         => $broker->id,
                'created_by'        => $courtierUser->id,
                'country_code'      => 'CI',
                'insured_name'      => $s['insured_name'],
                'voyage_from'       => 'Abidjan, Côte d\'Ivoire',
                'voyage_to'         => 'Le Havre, France',
                'voyage_date'       => now()->addDays(rand(5, 20)),
                'transport_type'    => 'SEA',
                'cargo_description' => 'Marchandises diverses',
                'estimated_value'   => rand(5, 50) * 1_000_000,
                'currency_code'     => 'XOF',
                'notes'             => $s['notes'],
                'status'            => $s['status'],
                'created_at'        => $createdAt,
            ]);

            if (! empty($s['assigned']) || in_array($s['status'], [CertificateRequest::STATUS_REJECTED, CertificateRequest::STATUS_APPROVED], true)) {
                $req->assigned_to = $admin?->id;
                $req->assigned_at = $createdAt->copy()->addHours(3);
            }
            if (in_array($s['status'], [CertificateRequest::STATUS_REJECTED, CertificateRequest::STATUS_APPROVED], true)) {
                $req->reviewed_by  = $admin?->id;
                $req->reviewed_at  = $createdAt->copy()->addDay();
                $req->review_notes = $s['review_notes'];
            }
            if (! empty($s['link_certificate']) && $issuedCert) {
                $req->certificate_id = $issuedCert->id;
            }
            $req->save();
        }
    }

    // ════════════════════════════════════════════════════════
    // 9. CERTIFICATS GUCE
    // ════════════════════════════════════════════════════════
    private function seedGuceCertificates(Tenant $tenant, ?User $admin): void
    {
        if (! class_exists(GuceCertificate::class) || ! $admin) return;

        $existing = GuceCertificate::where('tenant_id', $tenant->id)->count();
        if ($existing >= 2) return;

        $samples = [
            ['ref' => 'INS' . now()->format('Y') . '-' . strtoupper($tenant->code) . '-01', 'name' => 'IVOIRE LOGISTIQUE', 'value' => 45_000_000],
            ['ref' => 'INS' . now()->format('Y') . '-' . strtoupper($tenant->code) . '-02', 'name' => 'TROPICAL GOODS SA',  'value' => 22_500_000],
        ];

        foreach ($samples as $s) {
            $path = 'guce-certificates/demo/' . Str::uuid() . '.pdf';

            GuceCertificate::firstOrCreate(
                ['guce_reference' => $s['ref']],
                [
                    'tenant_id'          => $tenant->id,
                    'imported_by'        => $admin->id,
                    'certificate_number' => (string) rand(10000000000000, 99999999999999),
                    'insured_name'       => $s['name'],
                    'cargo_description'  => 'Marchandises diverses import/export',
                    'origin'             => 'Shanghai, Chine',
                    'destination'        => 'Abidjan, Côte d\'Ivoire',
                    'transit_date'       => now()->subDays(rand(5, 30)),
                    'insured_value'      => $s['value'],
                    'currency'           => 'XOF',
                    'net_premium'        => round($s['value'] * 0.004, 2),
                    'total_premium'      => round($s['value'] * 0.005, 2),
                    'file_path'          => $path,
                    'file_original_name' => 'certificat-guce-demo.pdf',
                    'file_mime_type'     => 'application/pdf',
                    'notes'              => 'Certificat de démonstration — import GUCE.',
                ]
            );

            // Un vrai fichier est écrit sur le disque pour que le bouton
            // "Télécharger" fonctionne réellement en démo — sans ça,
            // file_path pointe vers un fichier qui n'a jamais existé et le
            // téléchargement échoue systématiquement (404).
            if (! Storage::disk('private')->exists($path)) {
                $placeholder = Pdf::loadHTML(
                    '<h2>Certificat GUCE — ' . e($s['ref']) . '</h2>'
                    . '<p>Document de démonstration généré automatiquement — aucun certificat officiel réel.</p>'
                    . '<p>Assuré : ' . e($s['name']) . '</p>'
                )->output();

                Storage::disk('private')->put($path, $placeholder);
            }
        }
    }

    // ════════════════════════════════════════════════════════
    // 10. DÉLÉGATIONS
    // ════════════════════════════════════════════════════════
    private function seedDelegations(Tenant $tenant, $users, ?User $admin): void
    {
        if (! class_exists(UserRoleGrant::class) || ! $admin) return;

        // UserSeeder ne crée qu'UN seul utilisateur par rôle par filiale — on
        // ne peut donc pas s'appuyer sur 2 souscripteurs distincts. On utilise
        // à la place le souscripteur et le courtier de la filiale comme les
        // deux bénéficiaires distincts nécessaires aux 3 scénarios.
        $souscripteur = $users->first(fn ($u) => $u->hasRole('souscripteur'));
        $courtier     = $users->first(fn ($u) => $u->hasRole('courtier_local'));
        if (! $souscripteur) return;

        // 1. Délégation ACTIVE — le souscripteur reçoit temporairement le rôle admin_filiale
        if (! UserRoleGrant::where('user_id', $souscripteur->id)->where('granted_by', $admin->id)->where('role_name', 'admin_filiale')->exists()) {
            UserRoleGrant::create([
                'user_id'    => $souscripteur->id,
                'tenant_id'  => $tenant->id,
                'role_name'  => 'admin_filiale',
                'granted_by' => $admin->id,
                'granted_at' => now()->subDays(2),
                'expires_at' => now()->addDays(5),
                'reason'     => 'Remplacement pendant congés annuels',
            ]);
        }

        // 2. Délégation EXPIRÉE — le courtier avait reçu temporairement le rôle souscripteur
        if ($courtier && ! UserRoleGrant::where('user_id', $courtier->id)->where('granted_by', $admin->id)->where('expires_at', '<', now())->exists()) {
            UserRoleGrant::create([
                'user_id'    => $courtier->id,
                'tenant_id'  => $tenant->id,
                'role_name'  => 'souscripteur',
                'granted_by' => $admin->id,
                'granted_at' => now()->subDays(30),
                'expires_at' => now()->subDays(5),
                'reason'     => 'Mission temporaire',
            ]);
        }

        // 3. Délégation RÉVOQUÉE — le souscripteur avait reçu délégation courtier_local
        if (! UserRoleGrant::where('user_id', $souscripteur->id)->whereNotNull('revoked_at')->exists()) {
            UserRoleGrant::create([
                'user_id'    => $souscripteur->id,
                'tenant_id'  => $tenant->id,
                'role_name'  => 'courtier_local',
                'granted_by' => $admin->id,
                'granted_at' => now()->subDays(15),
                'expires_at' => now()->addDays(10),
                'revoked_by' => $admin->id,
                'revoked_at' => now()->subDays(3),
                'reason'     => 'Délégation de validation courtier | Révocation : Retour anticipé de congés',
            ]);
        }
    }

    // ════════════════════════════════════════════════════════
    // 11. NOTIFICATIONS
    // ════════════════════════════════════════════════════════
    private function seedNotifications($users): void
    {
        $admin = $users->first(fn ($u) => $u->hasRole('admin_filiale')) ?? $users->first();
        if (! $admin) return;

        $existing = Notification::forUser($admin->id)->count();
        if ($existing >= 5) return;

        $samples = [
            ['type' => 'CertificateIssued',        'title' => 'Certificat émis',              'body' => 'N° 100123 émis avec succès', 'icon' => 'check-circle', 'color' => 'success', 'read' => true],
            ['type' => 'CertificateSubmitted',     'title' => 'Certificat en attente',        'body' => 'N° 100125 — SOTRACI en attente de validation', 'icon' => 'clock', 'color' => 'warning', 'read' => false],
            ['type' => 'CertificateRequestCreated','title' => 'Nouvelle demande de certificat','body' => 'Nouvelle demande partenaire à traiter', 'icon' => 'inbox', 'color' => 'info', 'read' => false],
            ['type' => 'ContractExpiring',         'title' => 'Contrat expirant bientôt',     'body' => 'CT-2025-0010 expire dans 15 jours', 'icon' => 'alert-triangle', 'color' => 'warning', 'read' => false],
            ['type' => 'EscaladeNN300',            'title' => 'Escalade NN300 — Niveau 1',    'body' => 'Un certificat dépasse le seuil configuré', 'icon' => 'trending-up', 'color' => 'danger', 'read' => false],
            ['type' => 'DelegationGranted',        'title' => 'Délégation reçue',             'body' => 'Vous avez reçu une délégation temporaire', 'icon' => 'user-check', 'color' => 'info', 'read' => true],
            ['type' => 'CertificateCancelled',     'title' => 'Certificat annulé',            'body' => 'N° 100130 a été annulé', 'icon' => 'x-circle', 'color' => 'danger', 'read' => true],
        ];

        foreach ($samples as $i => $s) {
            $notif = Notification::send($admin, $s['type'], $s['title'], $s['body'], [
                'icon'  => $s['icon'],
                'color' => $s['color'],
                'url'   => '/admin/dashboard',
            ]);
            if ($s['read']) {
                $notif->update(['read_at' => now()->subHours(rand(1, 48))]);
            }
            // Espacer les dates
            $notif->update(['created_at' => now()->subHours($i * 6)]);
        }
    }

    // ════════════════════════════════════════════════════════
    // HELPER : Nombre en lettres (français simplifié)
    // ════════════════════════════════════════════════════════
    private function numberToFrenchWords(float $number): string
    {
        $number = (int) $number;
        if ($number === 0) return 'zéro';

        $units = ['', 'mille', 'million', 'milliard'];
        $groups = [];
        while ($number > 0) {
            $groups[] = $number % 1000;
            $number = (int) ($number / 1000);
        }

        $result = [];
        foreach (array_reverse($groups, true) as $i => $group) {
            if ($group === 0) continue;
            $result[] = number_format($group, 0, '', ' ') . ($units[$i] ? ' ' . $units[$i] : '');
        }

        return implode(' ', $result);
    }

    // ════════════════════════════════════════════════════════
    private function printSummary(): void
    {
        $this->command->table(
            ['Entité', 'Total créé'],
            [
                ['Courtiers',              Broker::count()],
                ['Coassureurs',            class_exists(Coinsurer::class) ? Coinsurer::count() : 0],
                ['Experts',                class_exists(Expert::class) ? Expert::count() : 0],
                ['Contrats',               InsuranceContract::count()],
                ['Certificats',            Certificate::count()],
                ['  - dont DRAFT',         Certificate::where('status', 'DRAFT')->count()],
                ['  - dont SUBMITTED',     Certificate::where('status', 'SUBMITTED')->count()],
                ['  - dont ISSUED',        Certificate::where('status', 'ISSUED')->count()],
                ['  - dont REPLACED',      Certificate::where('status', 'REPLACED')->count()],
                ['  - dont CANCELLED',     Certificate::where('status', 'CANCELLED')->count()],
                ['  - dont DUPLICATA',     Certificate::where('document_type', Certificate::DOC_TYPE_DUPLICATA)->count()],
                ['Avenants',               class_exists(ContractAmendment::class) ? ContractAmendment::count() : 0],
                ['Escalades NN300 (3 types)', class_exists(ApprovalRequest::class) ? ApprovalRequest::count() : 0],
                ['  - dont contrats en attente DTAG (> 2 Mds)', InsuranceContract::where('status', 'PENDING_APPROVAL')->count()],
                ['  - dont Abonnement < 3 mois avant échéance', InsuranceContract::whereIn('type', [InsuranceContract::TYPE_OPEN_POLICY, InsuranceContract::TYPE_TIERS_CHARGEUR])->where('status', 'ACTIVE')->whereBetween('expiry_date', [now(), now()->addMonths(3)])->count()],
                ['Règles de commission',   class_exists(CommissionRule::class) ? CommissionRule::count() : 0],
                ['Transactions commission', class_exists(CommissionTransaction::class) ? CommissionTransaction::count() : 0],
                ['Taux de taxe',           class_exists(TaxRule::class) ? TaxRule::count() : 0],
                ['Demandes partenaires',   class_exists(CertificateRequest::class) ? CertificateRequest::count() : 0],
                ['Certificats GUCE',       class_exists(GuceCertificate::class) ? GuceCertificate::count() : 0],
                ['Délégations',            class_exists(UserRoleGrant::class) ? UserRoleGrant::count() : 0],
                ['Notifications',          Notification::count()],
            ]
        );

        $this->command->info('');
        $this->command->info('🎯 Pages clés à montrer pour la démo :');
        $this->command->line('   • /admin/certificates            → Liste avec tous les statuts');
        $this->command->line('   • /admin/certificates/create        → Pays de provenance/destination, mode fluvial/lagunaire, devise cotation + aperçu prime (nouveau)');
        $this->command->line('   • /admin/contracts                → Contrats + plein / plafond NN300, filtrez "En attente d\'approbation" → contrat #0011 (> 2 Mds, réservé DTAG)');
        $this->command->line('   • /admin/contracts/limits          → Suivi plafonds + recherche rapide (nouveau)');
        $this->command->line('   • /admin/approvals                 → Escalades NN300 — les 3 types de déclencheur + libellé "Valeur maximum déclarée ou importée" (nouveau)');
        $this->command->line('   • /admin/approvals/configs         → Gestion des seuils par filiale');
        $this->command->line('   • /admin/reports/contracts          → Filtre par plafond NN300 (nouveau)');
        $this->command->line('   • /admin/reports/intermediaries     → Filtres filiale / type de contrat / type de courtier (nouveau)');
        $this->command->line('   • Contrat #0012 (Abonnement, échéance dans 2 mois) → `php artisan nsia:check-contracts` déclenche l\'alerte 3 mois (nouveau)');
        $this->command->line('   • /admin/certificate-requests      → Demandes partenaires (nouveau)');
        $this->command->line('   • /admin/taxes/rules               → Référentiel de taxes (nouveau)');
        $this->command->line('   • /admin/guce-certificates         → Certificats GUCE importés (nouveau)');
        $this->command->line('   • /admin/delegations                → Délégations (active/expirée/révoquée)');
        $this->command->line('   • /admin/commissions/rules          → Règles de commission (dont override contrat)');
        $this->command->line('   • /admin/commissions/bordereau      → Bordereau + export PDF/Excel/CSV');
        $this->command->line('   • /admin/notifications              → Centre de notifications');
        $this->command->line('   • /partner                          → Espace partenaire (voir identifiants ci-dessous)');
        $this->command->info('');
        $this->command->info('👤 Connexion espace partenaire (par filiale) : courtier.<code>@nsia-<code>.com / Courtier@<CODE>2026!');
        $this->command->line('   Exemple filiale Côte d\'Ivoire : courtier.ci@nsia-ci.com / Courtier@CI2026!');
    }
}
