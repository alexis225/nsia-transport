<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\ApprovalWorkflowConfig;
use App\Services\ApprovalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                'workflowConfig:id,name,steps_config',
                'requestedBy:id,first_name,last_name',
                'decisions.approver:id,first_name,last_name',
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
            ->get()
            ->map(fn ($r) => $this->formatRequest($r));

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
            'workflow'    => $this->formatRequest($approvalRequest),
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

    // ── Formater pour le frontend ─────────────────────────────
    private function formatRequest(ApprovalRequest $r): array
    {
        $config       = $r->workflowConfig;
        $stepConfig   = $config?->getStep($r->current_step);
        $hoursLeft    = $r->due_date
            ? max(0, now()->diffInMinutes($r->due_date, false) / 60)
            : 0;

        // Calcul threshold depuis la config du workflow
        $thresholdPct = 15; // défaut
        if ($config?->trigger_condition) {
            $cond = $config->trigger_condition;
            if (isset($cond['insured_value_pct_of_contract'])) {
                $thresholdPct = array_values($cond['insured_value_pct_of_contract'])[0] ?? 15;
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
            'contract'     => null, // chargé séparément dans show()
            'certificate'  => null, // chargé séparément dans show()
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