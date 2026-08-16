<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Broker;
use App\Models\Coinsurer;
use App\Models\CommissionRule;
use App\Models\Incoterm;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use App\Models\TransportMode;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * InsuranceContractController — US-014
 * ============================================================
 */
class InsuranceContractController extends Controller
{
    // ── Liste ────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $contracts = InsuranceContract::with([
                'tenant:id,name,code',
                'broker:id,name,code',
                'createdBy:id,first_name,last_name',
            ])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->search, fn ($q) =>
                $q->where(fn ($q) =>
                    $q->where('contract_number', 'ilike', "%{$request->search}%")
                      ->orWhere('insured_name',   'ilike', "%{$request->search}%")
                      ->orWhereHas('broker', fn ($q) => $q->where('name', 'ilike', "%{$request->search}%"))
                )
            )
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->type,   fn ($q) => $q->where('type', $request->type))
            ->when($request->tenant_id && $isSA, fn ($q) => $q->where('tenant_id', $request->tenant_id))
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/contracts/index', [
            'contracts' => $contracts,
            'filters'   => $request->only(['search', 'status', 'type', 'tenant_id']),
            'isSA'      => $isSA,
            'tenants'   => $isSA ? Tenant::orderBy('name')->get(['id', 'name', 'code']) : collect(),
            'can' => [
                'create'   => $user->can('contracts.create'),
                'edit'     => $user->can('contracts.edit'),
                'delete'   => $user->can('contracts.delete'),
                'validate' => $user->can('contracts.validate'),
            ],
        ]);
    }

    // ── Créer — formulaire ───────────────────────────────────
    public function create(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        return Inertia::render('admin/contracts/create', [
            'tenants'         => $isSA ? Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'currency_code']) : collect(),
            'brokers'         => Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
                                       ->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'type', 'commission_rate']),
            'coinsurers'      => Coinsurer::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
                                       ->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'subscribers'     => $this->subscribers($user, $isSA),
            'incoterms'       => Incoterm::orderBy('code')->get(['code', 'name']),
            'transportModes'  => TransportMode::orderBy('name_fr')->get(['id', 'code', 'name_fr']),
            'currencies'      => ['XOF', 'XAF', 'GNF', 'MGA', 'NGN', 'EUR', 'USD'],
            'defaultTenantId' => $user->tenant_id,
        ]);
    }

    // ── Souscripteurs sélectionnables (rôle "souscripteur") ──
    private function subscribers($user, bool $isSA)
    {
        return User::whereHas('roles', fn ($q) => $q->where('name', 'souscripteur'))
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name']);
    }

    // ── Créer — store ────────────────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateContract($request);
        $commissionRate = $validated['commission_rate'] ?? null;
        unset($validated['commission_rate']);
        $coinsurers = $validated['coinsurers'] ?? [];
        unset($validated['coinsurers']);

        $tenant  = Tenant::find($validated['tenant_id']);
        $validated['contract_number'] = InsuranceContract::generateContractNumber(
            $tenant->code, $validated['type']
        );
        // Devise imposée par la filiale — tous les montants du contrat et
        // de ses certificats doivent être exprimés dans cette monnaie.
        $validated['currency_code'] = $tenant->currency_code;
        $validated['status']     = InsuranceContract::STATUS_DRAFT;
        $validated['created_by'] = $request->user()->id;
        $validated['updated_by'] = $request->user()->id;

        $exceedsNn300 = $this->applyNn300Defaults($validated);

        $contract = InsuranceContract::create($validated);

        $this->syncCommissionRate($contract, $commissionRate, $request->user());
        $this->syncCoinsurers($contract, $coinsurers);

        AuditLog::create([
            'tenant_id'   => $contract->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => 'contract.created',
            'entity_type' => 'InsuranceContract',
            'entity_id'   => $contract->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => ['contract_number' => $contract->contract_number, 'type' => $contract->type],
        ]);

        $status = "Contrat {$contract->contract_number} créé.";
        if ($exceedsNn300) {
            $status .= ' Ce contrat dépasse le plafond NN300 standard ('
                . number_format(InsuranceContract::NN300_STANDARD_CEILING, 0, ',', ' ') . ' ' . $contract->currency_code
                . ') — une validation du Groupe (DTAG) sera requise avant activation.';
        }

        return redirect()->route('admin.contracts.show', $contract)
            ->with('status', $status);
    }

    // ── Défauts NN300 / Plafond Traité ───────────────────────
    // Applique les valeurs par défaut (2 Mds / 6 Mds FCFA) quand non
    // renseignées, et force requires_approval si le plafond NN300
    // déclaré/importé dépasse le seuil standard groupe — le contrat ne
    // pourra alors être activé (submit()) que via une validation DTAG
    // (approve(), réservé au rôle super_admin — cf. contracts.validate).
    // Retourne true si le dépassement a été détecté.
    private function applyNn300Defaults(array &$validated): bool
    {
        $validated['subscription_limit'] = $validated['subscription_limit'] ?? InsuranceContract::NN300_STANDARD_CEILING;
        $validated['treaty_limit']       = $validated['treaty_limit'] ?? InsuranceContract::TREATY_DEFAULT_LIMIT;

        $exceedsNn300 = (float) $validated['subscription_limit'] > InsuranceContract::NN300_STANDARD_CEILING;
        if ($exceedsNn300) {
            $validated['requires_approval'] = true;
        }

        return $exceedsNn300;
    }

    // ── Détail ───────────────────────────────────────────────
    public function show(InsuranceContract $contract): Response
    {
        $this->authorizeTenant($contract);

        $contract->load([
            'tenant:id,name,code,currency_code',
            'broker:id,name,code,type,email,phone',
            'subscriber:id,first_name,last_name,email',
            'transportMode:id,code,name_fr',
            'createdBy:id,first_name,last_name',
            'approvedBy:id,first_name,last_name',
            'coinsurers:id,name,email,phone',
        ]);

        return Inertia::render('admin/contracts/show', [
            'contract' => $contract,
            'can' => [
                'edit'      => auth()->user()->can('contracts.edit'),
                'validate'  => auth()->user()->can('contracts.validate'),
                'terminate' => auth()->user()->can('contracts.edit'),
            ],
        ]);
    }

    // ── Éditer ───────────────────────────────────────────────
    public function edit(InsuranceContract $contract): Response
    {
        $this->authorizeTenant($contract);
        abort_if($contract->status === InsuranceContract::STATUS_ACTIVE, 403, 'Un contrat actif ne peut pas être modifié directement.');

        $contract->load(['broker', 'transportMode', 'tenant', 'coinsurers']);
        $user = auth()->user();
        $isSA = $user->hasRole('super_admin');

        return Inertia::render('admin/contracts/edit', [
            'contract'       => $contract,
            'tenants'        => $isSA ? Tenant::where('is_active', true)->orderBy('name')->get(['id','name','code','currency_code']) : collect(),
            'brokers'        => Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
                                      ->where('is_active', true)->orderBy('name')->get(['id','name','code','type','commission_rate']),
            'coinsurers'     => Coinsurer::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
                                      ->where('is_active', true)->orderBy('name')->get(['id','name']),
            'subscribers'    => $this->subscribers($user, $isSA),
            'incoterms'      => Incoterm::orderBy('code')->get(['code','name']),
            'transportModes' => TransportMode::orderBy('name_fr')->get(['id','code','name_fr']),
            'currencies'     => ['XOF','XAF','GNF','MGA','NGN','EUR','USD'],
            'commissionRate' => CommissionRule::where('contract_id', $contract->id)
                ->where('is_active', true)
                ->orderBy('effective_date', 'desc')
                ->value('rate_pct'),
        ]);
    }

    // ── Modifier ─────────────────────────────────────────────
    public function update(Request $request, InsuranceContract $contract): RedirectResponse
    {
        $this->authorizeTenant($contract);
        $validated = $this->validateContract($request);
        $commissionRate = $validated['commission_rate'] ?? null;
        unset($validated['commission_rate']);
        $coinsurers = $validated['coinsurers'] ?? [];
        unset($validated['coinsurers']);
        $validated['updated_by'] = $request->user()->id;

        // Devise imposée par la filiale — tous les montants du contrat et
        // de ses certificats doivent être exprimés dans cette monnaie.
        $validated['currency_code'] = Tenant::find($validated['tenant_id'])->currency_code;

        $exceedsNn300 = $this->applyNn300Defaults($validated);

        $contract->update($validated);

        $this->syncCommissionRate($contract, $commissionRate, $request->user());
        $this->syncCoinsurers($contract, $coinsurers);

        $status = 'Contrat mis à jour.';
        if ($exceedsNn300) {
            $status .= ' Ce contrat dépasse le plafond NN300 standard — validation DTAG requise avant activation.';
        }

        return redirect()->route('admin.contracts.show', $contract)
            ->with('status', $status);
    }

    // ── Taux de commission spécifique au contrat ─────────────
    // Crée/actualise ou désactive la CommissionRule liée au contrat —
    // le taux "au niveau du contrat" prime sur le taux général du
    // courtier via CommissionRule::findApplicable() (déjà en place).
    private function syncCommissionRate(InsuranceContract $contract, ?float $rate, User $user): void
    {
        if (! $contract->broker_id) return;

        $existing = CommissionRule::where('contract_id', $contract->id)
            ->where('broker_id', $contract->broker_id)
            ->orderBy('effective_date', 'desc')
            ->first();

        if ($rate === null) {
            $existing?->update(['is_active' => false]);
            return;
        }

        if ($existing) {
            $existing->update(['rate_pct' => $rate, 'is_active' => true]);
            return;
        }

        CommissionRule::create([
            'tenant_id'       => $contract->tenant_id,
            'broker_id'       => $contract->broker_id,
            'contract_id'     => $contract->id,
            'rate_pct'        => $rate,
            'base_type'       => CommissionRule::BASE_PRIME_TOTAL,
            'effective_date'  => $contract->effective_date ?? now(),
            'is_active'       => true,
            'notes'           => 'Taux défini depuis le formulaire du contrat.',
            'created_by'      => $user->id,
        ]);
    }

    // ── Coassureurs du contrat ────────────────────────────────
    // Un même coassureur peut être associé à plusieurs contrats avec un
    // taux de coassurance différent d'un contrat à l'autre — le taux se
    // précise ici, au cas par cas, jamais au niveau du coassureur lui-même
    // (cf. Coinsurer, qui ne porte plus que ses coordonnées).
    private function syncCoinsurers(InsuranceContract $contract, array $coinsurers): void
    {
        $sync = collect($coinsurers)
            ->filter(fn ($c) => ! empty($c['coinsurer_id']))
            ->mapWithKeys(fn ($c) => [$c['coinsurer_id'] => ['share_rate' => $c['share_rate']]])
            ->toArray();

        $contract->coinsurers()->sync($sync);
    }

    // ── Supprimer ────────────────────────────────────────────
    public function destroy(Request $request, InsuranceContract $contract): RedirectResponse
    {
        $this->authorizeTenant($contract);
        abort_if($contract->status === InsuranceContract::STATUS_ACTIVE, 403, 'Impossible de supprimer un contrat actif.');

        $number = $contract->contract_number;
        $contract->delete();

        return redirect()->route('admin.contracts.index')
            ->with('status', "Contrat {$number} supprimé.");
    }

    // ══════════════════════════════════════════════════════════
    // WORKFLOW
    // ══════════════════════════════════════════════════════════

    // ── Soumettre pour approbation ───────────────────────────
    public function submit(Request $request, InsuranceContract $contract): RedirectResponse
    {
        $this->authorizeTenant($contract);
        abort_if($contract->status !== InsuranceContract::STATUS_DRAFT, 422, 'Seul un brouillon peut être soumis.');

        if ($contract->requires_approval) {
            $contract->update(['status' => 'PENDING_APPROVAL']);
        } else {
            // Auto-activation si pas d'approbation requise
            $contract->update([
                'status'      => InsuranceContract::STATUS_ACTIVE,
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);
        }

        $this->log($contract, $request, 'contract.submitted');

        return back()->with('status', $contract->requires_approval
            ? 'Contrat soumis pour approbation.'
            : 'Contrat activé automatiquement.');
    }

    // ── Approuver / Activer ──────────────────────────────────
    public function approve(Request $request, InsuranceContract $contract): RedirectResponse
    {
        abort_if(! $request->user()->can('contracts.validate'), 403);
        abort_if(! in_array($contract->status, ['DRAFT', 'PENDING_APPROVAL']), 422);

        $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        $contract->update([
            'status'           => InsuranceContract::STATUS_ACTIVE,
            'approved_by'      => $request->user()->id,
            'approved_at'      => now(),
            'validation_notes' => $request->notes,
        ]);

        $this->log($contract, $request, 'contract.approved', ['notes' => $request->notes]);

        return back()->with('status', "Contrat {$contract->contract_number} approuvé et activé.");
    }

    // ── Rejeter ──────────────────────────────────────────────
    public function reject(Request $request, InsuranceContract $contract): RedirectResponse
    {
        abort_if(! $request->user()->can('contracts.validate'), 403);
        abort_if($contract->status !== 'PENDING_APPROVAL', 422);

        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $contract->update([
            'status'           => InsuranceContract::STATUS_DRAFT,
            'validation_notes' => 'REJETÉ : ' . $request->reason,
        ]);

        $this->log($contract, $request, 'contract.rejected', ['reason' => $request->reason], 'WARNING');

        return back()->with('status', 'Contrat rejeté — renvoyé en brouillon.');
    }

    // ── Suspendre ────────────────────────────────────────────
    public function suspend(Request $request, InsuranceContract $contract): RedirectResponse
    {
        $this->authorizeTenant($contract);
        abort_if($contract->status !== InsuranceContract::STATUS_ACTIVE, 422);

        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $contract->update([
            'status'           => InsuranceContract::STATUS_SUSPENDED,
            'suspended_at'     => now(),
            'suspension_reason'=> $request->reason,
        ]);

        $this->log($contract, $request, 'contract.suspended', ['reason' => $request->reason], 'WARNING');

        return back()->with('status', 'Contrat suspendu.');
    }

    // ── Réactiver ────────────────────────────────────────────
    public function reactivate(Request $request, InsuranceContract $contract): RedirectResponse
    {
        abort_if(! $request->user()->can('contracts.validate'), 403);
        abort_if($contract->status !== InsuranceContract::STATUS_SUSPENDED, 422);

        $contract->update([
            'status'       => InsuranceContract::STATUS_ACTIVE,
            'suspended_at' => null,
        ]);

        $this->log($contract, $request, 'contract.reactivated');

        return back()->with('status', 'Contrat réactivé.');
    }

    // ── Annuler ──────────────────────────────────────────────
    public function cancel(Request $request, InsuranceContract $contract): RedirectResponse
    {
        $this->authorizeTenant($contract);
        abort_if(! in_array($contract->status, [
            InsuranceContract::STATUS_ACTIVE,
            InsuranceContract::STATUS_SUSPENDED,
        ]), 422);

        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $contract->update([
            'status'           => InsuranceContract::STATUS_CANCELLED,
            'validation_notes' => 'ANNULÉ : ' . $request->reason,
        ]);

        $this->log($contract, $request, 'contract.cancelled', ['reason' => $request->reason], 'WARNING');

        return back()->with('status', 'Contrat annulé.');
    }

    // ── Validation ───────────────────────────────────────────
    private function validateContract(Request $request): array
    {
        return $request->validate([
            'tenant_id'            => ['required', 'uuid', 'exists:tenants,id'],
            'broker_id'            => ['nullable', 'uuid', 'exists:brokers,id'],
            'commission_rate'      => ['nullable', 'numeric', 'min:0', 'max:100'],
            'coinsurers'                    => ['nullable', 'array'],
            'coinsurers.*.coinsurer_id'     => ['required', 'uuid', 'exists:coinsurers,id', 'distinct'],
            'coinsurers.*.share_rate'       => ['required', 'numeric', 'min:0.01', 'max:100'],
            'subscriber_id'        => ['nullable', 'uuid', 'exists:users,id'],
            'type'                 => ['required', 'in:OPEN_POLICY,VOYAGE,ANNUAL_VOYAGE,TIERS_CHARGEUR'],
            'insured_name'         => ['required', 'string', 'max:200'],
            'insured_address'      => ['nullable', 'string'],
            'insured_email'        => ['nullable', 'email'],
            'insured_phone'        => ['nullable', 'string', 'max:30'],
            'currency_code'        => ['required', 'size:3'],
            'subscription_limit'   => ['nullable', 'numeric', 'min:0'],
            'treaty_limit'         => ['nullable', 'numeric', 'min:0'],
            'plein'                => ['nullable', 'numeric', 'min:0'],
            'escalade_enabled'     => ['boolean'],
            'escalade_threshold_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'premium_rate'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'deductible'           => ['nullable', 'numeric', 'min:0'],
            'rate_ro'              => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_rg'              => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_divers'          => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_surprime'        => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_accessories'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_tax'             => ['nullable', 'numeric', 'min:0', 'max:100'],
            'coverage_type'        => ['nullable', 'in:TOUS_RISQUES,FAP_SAUF,FAP_ABSOLUE'],
            'clauses'              => ['nullable', 'array'],
            'exclusions'           => ['nullable', 'array'],
            'incoterm_code'        => ['nullable', 'string', 'exists:incoterms,code'],
            'transport_mode_id'    => ['nullable', 'exists:transport_modes,id'],
            'transport_mode_detail'=> ['nullable', 'string', 'max:100'],
            'covered_countries'    => ['nullable', 'array'],
            'effective_date'       => ['required', 'date'],
            'expiry_date'          => ['required', 'date', 'after:effective_date'],
            'notice_period_days'   => ['integer', 'min:0', 'max:365'],
            'requires_approval'    => ['boolean'],
            'certificates_limit'   => ['nullable', 'integer', 'min:1'],
            'notes'                => ['nullable', 'string'],
        ]);
    }

    // ── Audit log helper ─────────────────────────────────────
    private function log(InsuranceContract $contract, Request $request, string $action, array $newValues = [], string $severity = 'INFO'): void
    {
        AuditLog::create([
            'tenant_id'   => $contract->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => $action,
            'entity_type' => 'InsuranceContract',
            'entity_id'   => $contract->id,
            'severity'    => $severity,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => $newValues ?: null,
        ]);
    }

    // ── Isolation tenant ─────────────────────────────────────
    private function authorizeTenant(InsuranceContract $contract): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        if ((string) $user->tenant_id !== (string) $contract->tenant_id) abort(403);
    }
}