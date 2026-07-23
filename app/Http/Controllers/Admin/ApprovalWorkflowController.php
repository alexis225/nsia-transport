<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\ApprovalWorkflowConfig;
use App\Models\Certificate;
use App\Models\Tenant;
use App\Services\ApprovalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * ApprovalWorkflowController v2 — US-035
 * ============================================================
 * Utilise approval_requests (instances) et
 * approval_workflows (config).
 * ============================================================
 */
class ApprovalWorkflowController extends Controller
{
    public function __construct(
        private ApprovalWorkflowService $service
    ) {}

    // ── Liste des escalades en attente ────────────────────────
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $requests = ApprovalRequest::with([
                'workflowConfig:id,name,steps_config,trigger_condition',
                'requestedBy:id,first_name,last_name',
                'decisions.approver:id,first_name,last_name',
                'tenant:id,name,code',
            ])
            ->where('entity_type', 'CERTIFICATE')
            ->where('status', ApprovalRequest::STATUS_PENDING)
            ->when(! $isSA, function ($q) use ($user) {
                $q->where('tenant_id', $user->tenant_id);
                // Filtrer selon le rôle et l'étape courante
                $q->where(function ($q) use ($user) {
                    if ($user->hasRole('admin_filiale')) {
                        $q->where('current_step', 1);
                    }
                    // super_admin voit tout
                });
            })
            ->orderBy('due_date', 'asc')
            ->get();

        // Chargement en masse des certificats/contrats concernés (évite le N+1)
        $certificates = Certificate::with('contract:id,contract_number')
            ->whereIn('id', $requests->pluck('entity_id'))
            ->get()
            ->keyBy('id');

        $requests = $requests->map(fn ($r) => $this->formatRequest($r, $certificates->get($r->entity_id)));

        return Inertia::render('admin/approvals/index', [
            'workflows' => $requests,
            'isSA'      => $isSA,
        ]);
    }

    // ── Détail d'une escalade ─────────────────────────────────
    public function show(ApprovalRequest $approvalRequest): Response
    {
        $this->authorizeApprover($approvalRequest);

        $approvalRequest->load([
            'workflowConfig',
            'requestedBy:id,first_name,last_name',
            'resolvedBy:id,first_name,last_name',
            'decisions.approver:id,first_name,last_name',
        ]);

        $certificate = $approvalRequest->certificate();
        $contract    = $certificate?->contract()->with('tenant')->first();

        return Inertia::render('admin/approvals/show', [
            'workflow'    => $this->formatRequest($approvalRequest, $certificate),
            'certificate' => $certificate ? [
                'id'                 => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'insured_name'       => $certificate->insured_name,
                'insured_value'      => (float) $certificate->insured_value,
                'currency_code'      => $certificate->currency_code,
                'voyage_from'        => $certificate->voyage_from,
                'voyage_to'          => $certificate->voyage_to,
                'voyage_date'        => $certificate->voyage_date?->format('d/m/Y'),
            ] : null,
            'contract'    => $contract ? [
                'id'                   => $contract->id,
                'contract_number'      => $contract->contract_number,
                'insured_name'         => $contract->insured_name,
                'insured_value'        => (float) $contract->insured_value,
                'currency_code'        => $contract->currency_code,
                'escalade_threshold_pct' => $contract->escalade_threshold_pct ?? 15,
            ] : null,
            'can'         => [
                'approve' => $this->canAct(auth()->user(), $approvalRequest),
                'reject'  => $this->canAct(auth()->user(), $approvalRequest),
            ],
        ]);
    }

    // ── Approuver ─────────────────────────────────────────────
    public function approve(Request $request, ApprovalRequest $approvalRequest): RedirectResponse
    {
        $this->authorizeApprover($approvalRequest);
        abort_if(! $approvalRequest->isPending(), 422);

        $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        $this->service->approve($approvalRequest, $request->user(), $request->notes);

        $isLast = $approvalRequest->fresh()->isLastStep()
            || $approvalRequest->fresh()->isApproved();

        $message = $isLast
            ? 'Approuvé — certificat émis automatiquement.'
            : "Approuvé — transmis à l'étape suivante.";

        return redirect()->route('admin.approvals.index')->with('status', $message);
    }

    // ── Rejeter ───────────────────────────────────────────────
    public function reject(Request $request, ApprovalRequest $approvalRequest): RedirectResponse
    {
        $this->authorizeApprover($approvalRequest);
        abort_if(! $approvalRequest->isPending(), 422);

        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $this->service->reject($approvalRequest, $request->user(), $request->reason);

        return redirect()->route('admin.approvals.index')
            ->with('status', 'Escalade rejetée — certificat remis en brouillon.');
    }

    // ══════════════════════════════════════════════════════════
    // GESTION DES SEUILS & VALIDATIONS HIÉRARCHIQUES (par filiale)
    // ══════════════════════════════════════════════════════════

    private const TRIGGER_TYPES = [
        'insured_value_pct_of_contract',
        'subscription_limit_exceeded',
        'certificates_limit_reached',
    ];

    private const STEP_ROLES = ['admin_filiale', 'super_admin'];

    // ── Liste des règles d'escalade configurées ────────────────
    public function configs(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $configs = ApprovalWorkflowConfig::with('tenant:id,name,code')
            ->where('entity_type', ApprovalWorkflowConfig::ENTITY_CERTIFICATE)
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->tenant_id && $isSA, fn ($q) => $q->where('tenant_id', $request->tenant_id))
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => $this->formatConfig($c));

        return Inertia::render('admin/approvals/configs', [
            'configs'         => $configs,
            'tenants'         => $isSA ? Tenant::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']) : collect(),
            'filters'         => $request->only(['tenant_id']),
            'isSA'            => $isSA,
            'defaultTenantId' => $user->tenant_id,
        ]);
    }

    // ── Créer une règle ─────────────────────────────────────────
    public function storeConfig(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(! ($user->hasRole('admin_filiale') || $user->hasRole('super_admin')), 403);
        $isSA = $user->hasRole('super_admin');

        $validated = $this->validateConfig($request, $isSA);

        ApprovalWorkflowConfig::create([
            'tenant_id'         => $isSA ? $validated['tenant_id'] : $user->tenant_id,
            'name'              => $validated['name'],
            'entity_type'       => ApprovalWorkflowConfig::ENTITY_CERTIFICATE,
            'trigger_condition' => $this->buildTriggerCondition($validated),
            'steps_config'      => $this->buildStepsConfig($validated['steps']),
            'is_active'         => true,
        ]);

        return back()->with('status', 'Règle d\'escalade créée.');
    }

    // ── Modifier une règle ───────────────────────────────────────
    public function updateConfig(Request $request, ApprovalWorkflowConfig $config): RedirectResponse
    {
        $this->authorizeTenant($config->tenant_id);
        $isSA = $request->user()->hasRole('super_admin');

        $validated = $this->validateConfig($request, $isSA);

        $config->update([
            'tenant_id'         => $isSA ? $validated['tenant_id'] : $config->tenant_id,
            'name'              => $validated['name'],
            'trigger_condition' => $this->buildTriggerCondition($validated),
            'steps_config'      => $this->buildStepsConfig($validated['steps']),
        ]);

        return back()->with('status', 'Règle d\'escalade mise à jour.');
    }

    // ── Activer / désactiver une règle ───────────────────────────
    public function toggleConfig(ApprovalWorkflowConfig $config): RedirectResponse
    {
        $this->authorizeTenant($config->tenant_id);
        $config->update(['is_active' => ! $config->is_active]);

        return back()->with('status', $config->is_active ? 'Règle activée.' : 'Règle désactivée.');
    }

    // ── Supprimer une règle ──────────────────────────────────────
    public function destroyConfig(ApprovalWorkflowConfig $config): RedirectResponse
    {
        $this->authorizeTenant($config->tenant_id);

        abort_if(
            $config->requests()->where('status', ApprovalRequest::STATUS_PENDING)->exists(),
            422,
            'Impossible de supprimer cette règle : des escalades sont en cours.'
        );

        $config->delete();

        return back()->with('status', 'Règle supprimée.');
    }

    private function validateConfig(Request $request, bool $isSA): array
    {
        return $request->validate([
            'tenant_id'             => [$isSA ? 'required' : 'nullable', 'uuid', 'exists:tenants,id'],
            'name'                  => ['required', 'string', 'max:150'],
            'trigger_type'          => ['required', Rule::in(self::TRIGGER_TYPES)],
            'threshold_pct'         => ['required_if:trigger_type,insured_value_pct_of_contract', 'nullable', 'numeric', 'min:0', 'max:100'],
            'steps'                 => ['required', 'array', 'min:1', 'max:2'],
            'steps.*.role'          => ['required', Rule::in(self::STEP_ROLES)],
            'steps.*.timeout_hours' => ['required', 'integer', 'min:1', 'max:240'],
        ]);
    }

    private function buildTriggerCondition(array $validated): array
    {
        return match ($validated['trigger_type']) {
            'insured_value_pct_of_contract' => ['insured_value_pct_of_contract' => ['>' => (float) $validated['threshold_pct']]],
            'subscription_limit_exceeded'   => ['subscription_limit_exceeded' => true],
            'certificates_limit_reached'    => ['certificates_limit_reached' => true],
        };
    }

    private function buildStepsConfig(array $steps): array
    {
        return collect($steps)->values()->map(fn ($s, $i) => [
            'step'          => $i + 1,
            'role'          => $s['role'],
            'label'         => $s['role'] === 'super_admin' ? 'Approbation Super Admin (DTAG)' : 'Approbation Admin Filiale',
            'timeout_hours' => (int) $s['timeout_hours'],
        ])->toArray();
    }

    private function formatConfig(ApprovalWorkflowConfig $c): array
    {
        $cond = $c->trigger_condition ?? [];
        $triggerType = match (true) {
            isset($cond['subscription_limit_exceeded']) => 'subscription_limit_exceeded',
            isset($cond['certificates_limit_reached'])  => 'certificates_limit_reached',
            default                                      => 'insured_value_pct_of_contract',
        };

        return [
            'id'            => $c->id,
            'name'          => $c->name,
            'trigger_type'  => $triggerType,
            'threshold_pct' => $triggerType === 'insured_value_pct_of_contract'
                ? (float) (array_values($cond['insured_value_pct_of_contract'] ?? ['>' => 15])[0] ?? 15)
                : null,
            'is_active'     => $c->is_active,
            'tenant'        => $c->tenant ? ['id' => $c->tenant->id, 'name' => $c->tenant->name, 'code' => $c->tenant->code] : null,
            'steps'         => collect($c->steps_config ?? [])->map(fn ($s) => [
                'step'          => $s['step'],
                'role'          => $s['role'],
                'label'         => $s['label'] ?? null,
                'timeout_hours' => $s['timeout_hours'] ?? 48,
            ])->values()->toArray(),
        ];
    }

    private function authorizeTenant(string $tenantId): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        abort_if(! $user->hasRole('admin_filiale'), 403);
        abort_if((string) $user->tenant_id !== (string) $tenantId, 403);
    }

    // ── Formater pour le frontend ─────────────────────────────
    private function formatRequest(ApprovalRequest $r, ?Certificate $certificate = null): array
    {
        $config       = $r->workflowConfig;
        $stepConfig   = $config?->getStep($r->current_step);
        $hoursLeft    = $r->due_date
            ? max(0, now()->diffInMinutes($r->due_date, false) / 60)
            : 0;

        $certificate ??= $r->certificate();
        $contract     = $certificate?->contract;

        // Calcul threshold depuis la config du workflow
        $thresholdPct    = 15; // défaut
        $thresholdAmount = null;
        if ($config?->trigger_condition) {
            $cond = $config->trigger_condition;
            if (isset($cond['insured_value_pct_of_contract'])) {
                $thresholdPct    = (float) ($contract?->escalade_threshold_pct
                    ?? (array_values($cond['insured_value_pct_of_contract'])[0] ?? 15));
                $thresholdAmount = $contract?->plein !== null
                    ? round((float) $contract->plein * $thresholdPct / 100, 2)
                    : null;
            } elseif (isset($cond['insured_value'])) {
                $thresholdAmount = (float) (array_values($cond['insured_value'])[0] ?? 0);
            }
        }

        return [
            'id'           => $r->id,
            'entity_type'  => $r->entity_type,
            'entity_id'    => $r->entity_id,
            'current_step' => $r->current_step,
            'total_steps'  => $r->total_steps,
            'status'       => $r->status,
            'threshold_pct'=> $thresholdPct,
            'threshold_amount' => $thresholdAmount,
            'current_level'=> $r->current_step,   // alias pour compatibilité frontend
            'hours_left'   => round($hoursLeft, 1),
            'is_overdue'   => $r->isOverdue(),
            'triggered_at' => $r->created_at->toISOString(),
            'expires_at'   => $r->due_date?->toISOString(),
            'workflow_name'=> $config?->name,
            'step_label'   => $stepConfig['label'] ?? "Étape {$r->current_step}",
            'step_role'    => $stepConfig['role']  ?? '—',
            'triggered_by' => $r->requestedBy
                ? ['name' => $r->requestedBy->first_name . ' ' . $r->requestedBy->last_name]
                : null,
            'decisions'    => $r->decisions->map(fn ($d) => [
                'level'      => $d->step_number,
                'decision'   => $d->decision,
                'notes'      => $d->comment,
                'decided_at' => $d->decided_at->toISOString(),
                'approver'   => $d->approver
                    ? ['name' => $d->approver->first_name . ' ' . $d->approver->last_name]
                    : null,
            ])->toArray(),
            'contract'     => $contract ? [
                'id'              => $contract->id,
                'contract_number' => $contract->contract_number,
            ] : null,
            'certificate'  => $certificate ? [
                'id'                 => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'insured_name'       => $certificate->insured_name,
                'insured_value'      => (float) $certificate->insured_value,
                'currency_code'      => $certificate->currency_code,
            ] : null,
            'tenant'       => $r->tenant ? [
                'name' => $r->tenant->name,
                'code' => $r->tenant->code,
            ] : null,
        ];
    }

    private function authorizeApprover(ApprovalRequest $request): void
    {
        $user   = auth()->user();
        $config = $request->workflowConfig;
        if (! $config) abort(500);
        if ($user->hasRole('super_admin')) return;

        $stepConfig = $config->getStep($request->current_step);
        $role       = $stepConfig['role'] ?? '';

        abort_if(! $user->hasRole($role), 403);

        if ($role !== 'super_admin') {
            abort_if((string) $user->tenant_id !== (string) $request->tenant_id, 403);
        }
    }

    private function canAct(object $user, ApprovalRequest $request): bool
    {
        if (! $request->isPending()) return false;
        $config     = $request->workflowConfig;
        if (! $config) return false;
        $stepConfig = $config->getStep($request->current_step);
        $role       = $stepConfig['role'] ?? '';
        return $user->hasRole($role) || $user->hasRole('super_admin');
    }
}