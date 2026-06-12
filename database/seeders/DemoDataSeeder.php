<?php

namespace Database\Seeders;

use App\Models\ApprovalRequest;
use App\Models\ApprovalWorkflowConfig;
use App\Models\Broker;
use App\Models\Certificate;
use App\Models\CommissionRule;
use App\Models\ContractAmendment;
use App\Models\InsuranceContract;
use App\Models\Notification;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UserRoleGrant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;

/**
 * ============================================================
 * DemoDataSeeder — Données fictives pour présentation
 * ============================================================
 * Génère un jeu de données réaliste pour démontrer TOUTES
 * les fonctionnalités de NSIA Transport :
 *
 *   - Contrats actifs avec valeurs variées
 *   - Certificats : DRAFT, SUBMITTED, ISSUED, CANCELLED, DUPLICATA
 *   - Certificats proches/dépassant le seuil NN300 (escalade)
 *   - Avenants sur contrats
 *   - Workflows d'escalade en cours (niveaux 1 et 2)
 *   - Délégations de rôle (active, expirée, révoquée)
 *   - Règles de commission (général + spécifique contrat)
 *   - Transactions de commission (pending + paid)
 *   - Notifications variées (lues/non lues)
 *   - Historique audit
 *
 * Lancer : php artisan db:seed --class=DemoDataSeeder
 * Prérequis : TenantSeeder, RolesAndPermissionsSeeder,
 *             UserSeeder, ApprovalWorkflowSeeder déjà exécutés
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

    private array $transportTypes = ['SEA', 'AIR', 'ROAD', 'MULTIMODAL'];
    private array $voyageModes    = ['CONTAINER', 'GROUPAGE', 'CONVENTIONNEL', 'BOUT_EN_BOUT'];

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

        $admin       = $users->first(fn ($u) => $u->hasRole('admin_filiale')) ?? $users->first();
        $souscripteur = $users->first(fn ($u) => $u->hasRole('souscripteur')) ?? $users->first();

        // ── 1. Courtiers ───────────────────────────────────────
        $brokers = $this->seedBrokers($tenant);

        // ── 2. Contrats (10 par filiale) ───────────────────────
        $contracts = $this->seedContracts($tenant, $brokers, $souscripteur);

        // ── 3. Avenants sur 30% des contrats ───────────────────
        $this->seedAmendments($contracts, $souscripteur);

        // ── 4. Certificats (variés : statuts, montants) ────────
        $certificates = $this->seedCertificates($tenant, $contracts, $souscripteur);

        // ── 5. Escalades NN300 ──────────────────────────────────
        $this->seedEscalades($tenant, $certificates, $contracts, $souscripteur, $admin);

        // ── 6. Règles de commission ─────────────────────────────
        $this->seedCommissionRules($tenant, $brokers, $contracts, $admin);

        // ── 7. Délégations ───────────────────────────────────────
        $this->seedDelegations($tenant, $users, $admin);

        // ── 8. Notifications variées ─────────────────────────────
        $this->seedNotifications($users);
    }

    // ════════════════════════════════════════════════════════
    // 1. COURTIERS
    // ════════════════════════════════════════════════════════
    private function seedBrokers(Tenant $tenant): \Illuminate\Support\Collection
    {
        $existing = Broker::where('tenant_id', $tenant->id)->get();
        if ($existing->count() >= 3) return $existing;

        $names = ['ASSUR COURTAGE CI', 'GLOBAL BROKER SERVICES', 'NSIA COURTAGE PARTNERS'];
        $brokers = collect();

        foreach ($names as $i => $name) {
            $brokers->push(Broker::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'BRK-' . $tenant->code . '-' . ($i + 1)],
                [
                    'name'    => $name,
                    'email'   => Str::slug($name) . '@courtage-demo.com',
                    'phone'   => '+225 07 ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99) . ' ' . rand(10, 99),
                    'address' => 'Abidjan, Plateau',
                    'status'  => 'ACTIVE',
                ]
            ));
        }

        return $brokers;
    }

    // ════════════════════════════════════════════════════════
    // 2. CONTRATS
    // ════════════════════════════════════════════════════════
    private function seedContracts(Tenant $tenant, $brokers, ?User $creator): \Illuminate\Support\Collection
    {
        $existing = InsuranceContract::where('tenant_id', $tenant->id)->count();
        if ($existing >= 8) {
            return InsuranceContract::where('tenant_id', $tenant->id)->get();
        }

        $contracts = collect();
        $currencies = ['XOF', 'EUR', 'USD'];

        for ($i = 1; $i <= 10; $i++) {
            $companyName = $this->companyNames[array_rand($this->companyNames)];
            $value = [
                5_000_000, 15_000_000, 25_000_000, 50_000_000,
                75_000_000, 100_000_000, 150_000_000, 200_000_000,
                300_000_000, 500_000_000,
            ][$i - 1];

            $startDate = now()->subMonths(rand(1, 6));

            $contracts->push(InsuranceContract::create([
                'tenant_id'              => $tenant->id,
                'broker_id'              => $brokers->isNotEmpty() ? $brokers->random()->id : null,
                'contract_number'        => 'CT-' . $tenant->code . '-' . now()->format('y') . '-' . str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                'insured_name'           => $companyName,
                'insured_ref'            => 'RC-' . rand(100000, 999999) . ' / ' . $tenant->code,
                'type'                   => $i % 4 === 0 ? 'CADRE' : 'AU_VOYAGE',
                'currency_code'          => $currencies[array_rand($currencies)],
                'insured_value'          => $value,
                'subscription_limit'     => $value * 0.30, // 30% plafond NN300
                'escalade_threshold_pct' => $i % 5 === 0 ? 10.00 : null, // seuil custom sur 1 contrat sur 5
                'escalade_enabled'       => true,
                'status'                 => $i === 10 ? 'EXPIRED' : 'ACTIVE',
                'start_date'             => $startDate,
                'end_date'               => $startDate->copy()->addYear(),
                'created_by'             => $creator?->id,
                'updated_by'             => $creator?->id,
                'created_at'             => $startDate,
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

        foreach ($eligible as $contract) {
            $existing = ContractAmendment::where('contract_id', $contract->id)->exists();
            if ($existing) continue;

            $newValue = $contract->insured_value * 1.20; // +20%

            ContractAmendment::create([
                'tenant_id'      => $contract->tenant_id,
                'contract_id'    => $contract->id,
                'amendment_type' => 'VALUE_INCREASE',
                'description'    => 'Augmentation de la valeur assurée suite à extension du contrat commercial.',
                'old_values'     => ['insured_value' => (string) $contract->insured_value],
                'new_values'     => ['insured_value' => (string) $newValue],
                'status'         => 'APPROVED',
                'requested_by'   => $creator?->id,
                'approved_by'    => $creator?->id,
                'approved_at'    => now()->subDays(rand(1, 20)),
                'created_at'     => now()->subDays(rand(21, 40)),
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

        $certNumber = 100000 + (int) substr(md5($tenant->id), 0, 4) % 9000;

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

            // Valeur du certificat : variée, certains proches/dépassant le seuil NN300
            $contractValue = (float) $contract->insured_value;
            $thresholdPct  = (float) ($contract->escalade_threshold_pct ?? 15);

            $valueRatio = match (true) {
                $idx === 2 => ($thresholdPct / 100) * 1.5,  // dépasse le seuil → escalade
                $idx === 5 => ($thresholdPct / 100) * 0.95, // juste sous le seuil
                default    => rand(2, 12) / 100,             // valeur normale
            };

            $insuredValue = round($contractValue * $valueRatio, 2);
            $primeRate    = 0.005; // 0.5%
            $primeTotal   = round($insuredValue * $primeRate, 2);

            $voyageDate  = now()->subDays(rand(0, 60));
            $certNumber++;

            $cert = Certificate::create([
                'tenant_id'        => $tenant->id,
                'contract_id'      => $contract->id,
                'document_type'    => 'original',
                'certificate_number' => 'N°' . str_pad((string) $certNumber, 6, '0', STR_PAD_LEFT),
                'policy_number'    => $contract->contract_number,
                'insured_name'     => $contract->insured_name,
                'insured_ref'      => $contract->insured_ref,
                'voyage_date'      => $voyageDate,
                'voyage_from'      => "{$fromCity}, {$fromCountry}",
                'voyage_to'        => "{$toCity}, {$toCountry}",
                'voyage_via'       => null,
                'transport_type'   => $this->transportTypes[array_rand($this->transportTypes)],
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
                'prime_breakdown'      => [
                    ['key' => 'prime_base', 'label' => 'Prime de base', 'rate' => 0.5, 'amount' => $primeTotal * 0.85],
                    ['key' => 'taxe',       'label' => 'Taxes & accessoires', 'rate' => 0.075, 'amount' => $primeTotal * 0.15],
                ],
                'prime_total' => $primeTotal,
                'status'      => $status === 'SUBMITTED' && $idx === 2 ? 'SUBMITTED' : $status,
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
        if ($originalIssued && $originalIssued->duplicate_count === 0) {
            $duplicate = $originalIssued->replicate();
            $duplicate->id                  = (string) Str::uuid7();
            $duplicate->parent_id           = $originalIssued->id;
            $duplicate->document_type       = 'duplicata';
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
    // 5. ESCALADES NN300
    // ════════════════════════════════════════════════════════
    private function seedEscalades(Tenant $tenant, $certificates, $contracts, ?User $creator, ?User $admin): void
    {
        if (! class_exists(ApprovalRequest::class) || ! class_exists(ApprovalWorkflowConfig::class)) return;

        $config = ApprovalWorkflowConfig::where('tenant_id', $tenant->id)
            ->where('entity_type', 'CERTIFICATE')
            ->where('is_active', true)
            ->first();
        if (! $config) return;

        // Trouver le certificat SUBMITTED dépassant le seuil (idx=2 dans seedCertificates)
        $escaladeCert = $certificates->first(fn ($c) =>
            $c->status === 'SUBMITTED'
        );
        if (! $escaladeCert) return;

        $existing = ApprovalRequest::where('entity_id', $escaladeCert->id)->exists();
        if ($existing) return;

        $contract = $contracts->firstWhere('id', $escaladeCert->contract_id);

        ApprovalRequest::create([
            'tenant_id'    => $tenant->id,
            'entity_type'  => 'CERTIFICATE',
            'entity_id'    => $escaladeCert->id,
            'workflow_id'  => $config->id,
            'current_step' => 1,
            'total_steps'  => count($config->steps_config ?? []),
            'status'       => 'PENDING',
            'requested_by' => $creator?->id,
            'due_date'     => now()->addHours(36), // dans le délai
            'notes'        => "Escalade NN300 déclenchée — valeur certificat : {$escaladeCert->insured_value} {$escaladeCert->currency_code}",
        ]);

        // Notifier l'admin filiale
        if ($admin) {
            \App\Models\Notification::send(
                $admin,
                'EscaladeNN300',
                'Escalade NN300 — Approbation Admin Filiale',
                "Certificat {$escaladeCert->certificate_number} dépasse le seuil configuré",
                [
                    'icon'  => 'trending-up',
                    'color' => 'danger',
                    'url'   => '/admin/approvals',
                ]
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
                'base_type'      => 'prime_total',
                'effective_date' => now()->subMonths(3),
                'is_active'      => true,
                'notes'          => 'Taux général négocié pour ' . now()->format('Y'),
                'created_by'     => $creator?->id,
            ]);
        }

        // Une règle spécifique sur un contrat avec taux préférentiel
        $bigContract = $contracts->where('status', 'ACTIVE')->sortByDesc('insured_value')->first();
        if ($bigContract && $brokers->isNotEmpty()) {
            $exists = CommissionRule::where('contract_id', $bigContract->id)->exists();
            if (! $exists) {
                CommissionRule::create([
                    'tenant_id'      => $tenant->id,
                    'broker_id'      => $brokers->first()->id,
                    'contract_id'    => $bigContract->id,
                    'rate_pct'       => 15.00,
                    'base_type'      => 'prime_total',
                    'effective_date' => now()->subMonth(),
                    'is_active'      => true,
                    'notes'          => 'Taux préférentiel — gros volume',
                    'created_by'     => $creator?->id,
                ]);
            }
        }

        // Générer les transactions de commission pour les certificats ISSUED
        $issuedCerts = Certificate::where('tenant_id', $tenant->id)
            ->where('status', 'ISSUED')
            ->where('document_type', 'original')
            ->get();

        foreach ($issuedCerts as $cert) {
            if (! $cert->contract || ! $cert->contract->broker_id) continue;

            $exists = \App\Models\CommissionTransaction::where('certificate_id', $cert->id)->exists();
            if ($exists) continue;

            $rule = CommissionRule::findApplicable($cert->contract->broker_id, $cert->contract_id, $cert->issued_at?->toDateString());
            if (! $rule) continue;

            $primeBrute = (float) $cert->prime_total;
            $commission = round($primeBrute * (float) $rule->rate_pct / 100, 2);

            \App\Models\CommissionTransaction::create([
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
    // 7. DÉLÉGATIONS
    // ════════════════════════════════════════════════════════
    private function seedDelegations(Tenant $tenant, $users, ?User $admin): void
    {
        if (! class_exists(UserRoleGrant::class) || ! $admin) return;

        $souscripteurs = $users->filter(fn ($u) => $u->hasRole('souscripteur'));
        if ($souscripteurs->count() < 2) return;

        // 1. Délégation ACTIVE
        $grantee1 = $souscripteurs->first();
        if (! UserRoleGrant::where('user_id', $grantee1->id)->where('granted_by', $admin->id)->exists()) {
            UserRoleGrant::create([
                'user_id'    => $grantee1->id,
                'tenant_id'  => $tenant->id,
                'role_name'  => 'souscripteur',
                'granted_by' => $admin->id,
                'granted_at' => now()->subDays(2),
                'expires_at' => now()->addDays(5),
                'reason'     => 'Remplacement pendant congés annuels',
            ]);
        }

        // 2. Délégation EXPIRÉE
        if ($souscripteurs->count() > 1) {
            $grantee2 = $souscripteurs->get(1);
            if (! UserRoleGrant::where('user_id', $grantee2->id)->where('granted_by', $admin->id)->where('expires_at', '<', now())->exists()) {
                UserRoleGrant::create([
                    'user_id'    => $grantee2->id,
                    'tenant_id'  => $tenant->id,
                    'role_name'  => 'souscripteur',
                    'granted_by' => $admin->id,
                    'granted_at' => now()->subDays(30),
                    'expires_at' => now()->subDays(5),
                    'reason'     => 'Mission temporaire — Mai 2026',
                ]);
            }
        }

        // 3. Délégation RÉVOQUÉE
        $grantee3 = $souscripteurs->first();
        if (! UserRoleGrant::where('user_id', $grantee3->id)->whereNotNull('revoked_at')->exists()) {
            UserRoleGrant::create([
                'user_id'    => $grantee3->id,
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
    // 8. NOTIFICATIONS
    // ════════════════════════════════════════════════════════
    private function seedNotifications($users): void
    {
        $admin = $users->first(fn ($u) => $u->hasRole('admin_filiale')) ?? $users->first();
        if (! $admin) return;

        $existing = Notification::forUser($admin->id)->count();
        if ($existing >= 5) return;

        $samples = [
            ['type' => 'CertificateIssued',     'title' => 'Certificat émis',          'body' => 'N° 100123 émis avec succès', 'icon' => 'check-circle', 'color' => 'success', 'read' => true],
            ['type' => 'CertificateSubmitted',  'title' => 'Certificat en attente',    'body' => 'N° 100125 — SOTRACI en attente de validation', 'icon' => 'clock', 'color' => 'warning', 'read' => false],
            ['type' => 'ContractExpiring',      'title' => 'Contrat expirant bientôt', 'body' => 'CT-2025-0010 expire dans 15 jours', 'icon' => 'alert-triangle', 'color' => 'warning', 'read' => false],
            ['type' => 'EscaladeNN300',         'title' => 'Escalade NN300 — Niveau 1','body' => 'Un certificat dépasse le seuil configuré', 'icon' => 'trending-up', 'color' => 'danger', 'read' => false],
            ['type' => 'DelegationGranted',     'title' => 'Délégation reçue',         'body' => 'Vous avez reçu une délégation temporaire', 'icon' => 'user-check', 'color' => 'info', 'read' => true],
            ['type' => 'CertificateCancelled',  'title' => 'Certificat annulé',        'body' => 'N° 100130 a été annulé', 'icon' => 'x-circle', 'color' => 'danger', 'read' => true],
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
                ['Contrats',               InsuranceContract::count()],
                ['Certificats',            Certificate::count()],
                ['  - dont DRAFT',         Certificate::where('status', 'DRAFT')->count()],
                ['  - dont SUBMITTED',     Certificate::where('status', 'SUBMITTED')->count()],
                ['  - dont ISSUED',        Certificate::where('status', 'ISSUED')->count()],
                ['  - dont CANCELLED',     Certificate::where('status', 'CANCELLED')->count()],
                ['  - dont DUPLICATA',     Certificate::where('document_type', 'duplicata')->count()],
                ['Avenants',               class_exists(ContractAmendment::class) ? ContractAmendment::count() : 0],
                ['Escalades NN300',        class_exists(ApprovalRequest::class) ? ApprovalRequest::count() : 0],
                ['Règles de commission',   class_exists(CommissionRule::class) ? CommissionRule::count() : 0],
                ['Transactions commission', class_exists(\App\Models\CommissionTransaction::class) ? \App\Models\CommissionTransaction::count() : 0],
                ['Délégations',            class_exists(UserRoleGrant::class) ? UserRoleGrant::count() : 0],
                ['Notifications',          Notification::count()],
            ]
        );

        $this->command->info('');
        $this->command->info('🎯 Pages clés à montrer pour la démo :');
        $this->command->line('   • /admin/certificates          → Liste avec tous les statuts');
        $this->command->line('   • /admin/contracts              → Contrats + plafonds NN300');
        $this->command->line('   • /admin/contracts/limits        → Suivi plafonds');
        $this->command->line('   • /admin/approvals               → Escalade NN300 en attente');
        $this->command->line('   • /admin/delegations             → Délégations (active/expirée/révoquée)');
        $this->command->line('   • /admin/commissions/rules       → Règles de commission');
        $this->command->line('   • /admin/commissions/bordereau   → Bordereau + export PDF/Excel/CSV');
        $this->command->line('   • /admin/notifications           → Centre de notifications');
        $this->command->line('   • /admin/history                 → Historique & audit');
    }
}
