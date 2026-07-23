<?php

namespace App\Services;

use App\Models\ApprovalDecision;
use App\Models\ApprovalRequest;
use App\Models\ApprovalWorkflowConfig;
use App\Models\AuditLog;
use App\Models\Certificate;
use App\Models\InsuranceContract;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * ============================================================
 * ApprovalWorkflowService v2 — US-035
 * ============================================================
 * Adapté aux tables existantes :
 *   approval_workflows  → configuration des règles
 *   approval_requests   → instances en cours
 *   approval_decisions  → décisions par étape
 * ============================================================
 */
class ApprovalWorkflowService
{
    // ══════════════════════════════════════════════════════════
    // DÉCLENCHEMENT
    // ══════════════════════════════════════════════════════════

    /**
     * Vérifie si une escalade est nécessaire et la déclenche.
     * Retourne true si une escalade a été déclenchée.
     */
    public function triggerIfNeeded(
        Certificate $certificate,
        InsuranceContract $contract,
        User $submitter
    ): bool {
        // Vérifier si escalade désactivée pour ce contrat
        if ($contract->escalade_enabled === false) return false;

        // Trouver le workflow applicable
        $workflowConfig = ApprovalWorkflowConfig::findForCertificate($certificate, $contract);
        if (! $workflowConfig) return false;

        // Déclencher
        $this->trigger($certificate, $contract, $workflowConfig, $submitter);
        return true;
    }

    /**
     * Déclenche le workflow — crée l'approval_request
     */
    public function trigger(
        Certificate $certificate,
        InsuranceContract $contract,
        ApprovalWorkflowConfig $config,
        User $submitter
    ): ApprovalRequest {
        $totalSteps  = $config->totalSteps();
        $step1Config = $config->getStep(1);
        $timeout     = $step1Config['timeout_hours'] ?? 48;

        $request = ApprovalRequest::create([
            'tenant_id'    => $certificate->tenant_id,
            'entity_type'  => 'CERTIFICATE',
            'entity_id'    => $certificate->id,
            'workflow_id'  => $config->id,
            'current_step' => 1,
            'total_steps'  => $totalSteps,
            'status'       => ApprovalRequest::STATUS_PENDING,
            'requested_by' => $submitter->id,
            'due_date'     => ApprovalRequest::computeDueDate(now(), $timeout),
            'notes'        => "Escalade NN300 déclenchée — valeur certificat : {$certificate->insured_value} {$certificate->currency_code}",
        ]);

        // Notifier les approbateurs de l'étape 1
        $this->notifyStepApprovers($request, $config, 1, $certificate);

        $this->audit($certificate, $submitter, 'escalade.triggered', [
            'workflow' => $config->name,
            'step'     => 1,
            'role'     => $step1Config['role'] ?? '—',
        ]);

        return $request;
    }

    // ══════════════════════════════════════════════════════════
    // APPROBATION
    // ══════════════════════════════════════════════════════════

    public function approve(ApprovalRequest $request, User $approver, ?string $comment = null): void
    {
        $config = $request->workflowConfig;
        abort_if(! $config, 500, 'Configuration du workflow introuvable.');

        DB::transaction(function () use ($request, $approver, $comment, $config) {

            // Enregistrer la décision
            ApprovalDecision::create([
                'request_id'  => $request->id,
                'step_number' => $request->current_step,
                'approver_id' => $approver->id,
                'decision'    => ApprovalDecision::DECISION_APPROVED,
                'comment'     => $comment,
                'decided_at'  => now(),
            ]);

            if ($request->isLastStep()) {
                // Dernière étape → émission automatique
                $request->update([
                    'status'      => ApprovalRequest::STATUS_APPROVED,
                    'resolved_by' => $approver->id,
                    'resolved_at' => now(),
                ]);

                $certificate = $request->certificate();
                $this->issueCertificate($certificate, $approver, $request);

                $this->audit($certificate, $approver, 'escalade.approved', [
                    'step'        => $request->current_step,
                    'auto_issued' => true,
                ]);

            } else {
                // Passer à l'étape suivante
                $nextStep       = $request->current_step + 1;
                $nextStepConfig = $config->getStep($nextStep);
                $timeout        = $nextStepConfig['timeout_hours'] ?? 48;

                $request->update([
                    'current_step' => $nextStep,
                    'due_date'     => ApprovalRequest::computeDueDate(now(), $timeout),
                ]);

                $certificate = $request->certificate();
                $this->notifyStepApprovers($request, $config, $nextStep, $certificate);

                $this->audit($certificate, $approver, 'escalade.step_approved', [
                    'step'      => $request->current_step - 1,
                    'next_step' => $nextStep,
                ]);
            }
        });
    }

    // ══════════════════════════════════════════════════════════
    // REJET
    // ══════════════════════════════════════════════════════════

    public function reject(ApprovalRequest $request, User $approver, string $reason): void
    {
        DB::transaction(function () use ($request, $approver, $reason) {

            ApprovalDecision::create([
                'request_id'  => $request->id,
                'step_number' => $request->current_step,
                'approver_id' => $approver->id,
                'decision'    => ApprovalDecision::DECISION_REJECTED,
                'comment'     => $reason,
                'decided_at'  => now(),
            ]);

            $request->update([
                'status'      => ApprovalRequest::STATUS_REJECTED,
                'resolved_by' => $approver->id,
                'resolved_at' => now(),
                'notes'       => "Rejeté à l'étape {$request->current_step} : {$reason}",
            ]);

            $certificate = $request->certificate();
            $certificate->update([
                'status'           => Certificate::STATUS_DRAFT,
                'validation_notes' => "Escalade rejetée (étape {$request->current_step}) : {$reason}",
            ]);

            $this->notifyCreator($request, 'rejected', $reason);

            $this->audit($certificate, $approver, 'escalade.rejected', [
                'step'   => $request->current_step,
                'reason' => $reason,
            ], 'WARNING');
        });
    }

    // ══════════════════════════════════════════════════════════
    // TIMEOUT — Scheduler horaire
    // ══════════════════════════════════════════════════════════

    public function checkExpired(): int
    {
        $expired = ApprovalRequest::where('status', ApprovalRequest::STATUS_PENDING)
            ->where('due_date', '<=', now())
            ->with(['workflowConfig'])
            ->get();

        foreach ($expired as $request) {
            DB::transaction(function () use ($request) {
                $config = $request->workflowConfig;

                // Enregistrer l'expiration
                ApprovalDecision::create([
                    'request_id'  => $request->id,
                    'step_number' => $request->current_step,
                    'approver_id' => null,
                    'decision'    => ApprovalDecision::DECISION_DELEGATED,
                    // DELEGATED = escalade automatique (seule valeur disponible sans EXPIRED)
                    'comment'     => 'Délai dépassé — escalade automatique',
                    'decided_at'  => now(),
                ]);

                if (! $request->isLastStep() && $config) {
                    // Passer à l'étape suivante
                    $nextStep       = $request->current_step + 1;
                    $nextStepConfig = $config->getStep($nextStep);
                    $timeout        = $nextStepConfig['timeout_hours'] ?? 48;

                    $request->update([
                        'current_step' => $nextStep,
                        'due_date'     => ApprovalRequest::computeDueDate(now(), $timeout),
                    ]);

                    $certificate = $request->certificate();
                    if ($certificate) {
                        $this->notifyStepApprovers($request, $config, $nextStep, $certificate);
                    }

                } else {
                    // Dernière étape expirée → rejet automatique
                    $request->update([
                        'status'      => ApprovalRequest::STATUS_REJECTED,
                        'resolved_at' => now(),
                        'notes'       => 'Rejet automatique — délai de toutes les étapes dépassé.',
                    ]);

                    $certificate = $request->certificate();
                    if ($certificate) {
                        $certificate->update([
                            'status'           => Certificate::STATUS_DRAFT,
                            'validation_notes' => 'Escalade NN300 expirée — aucun approbateur n\'a répondu.',
                        ]);
                        $this->notifyCreator($request, 'expired', null);
                    }
                }
            });
        }

        return $expired->count();
    }

    // ══════════════════════════════════════════════════════════
    // HELPERS PRIVÉS
    // ══════════════════════════════════════════════════════════

    private function issueCertificate(Certificate $certificate, User $approver, ApprovalRequest $request): void
    {
        $certificate->update([
            'status'           => Certificate::STATUS_ISSUED,
            'issued_at'        => now(),
            'issued_by'        => $approver->id,
            'validation_notes' => 'Émis automatiquement suite à l\'approbation de l\'escalade NN300.',
        ]);

        app(\App\Services\CertificatePdfService::class)->generate($certificate);

        $this->notifyCreator($request, 'approved', null);
    }

    private function notifyStepApprovers(
        ApprovalRequest $request,
        ApprovalWorkflowConfig $config,
        int $step,
        Certificate $certificate
    ): void {
        $stepConfig = $config->getStep($step);
        if (! $stepConfig) return;

        $role    = $stepConfig['role'];
        $label   = $stepConfig['label'] ?? "Étape {$step}";
        $timeout = $stepConfig['timeout_hours'] ?? 48;

        $query = User::whereHas('roles', fn ($q) => $q->where('name', $role));

        // Si pas super_admin → filtrer par filiale
        if ($role !== 'super_admin') {
            $query->where('tenant_id', $request->tenant_id);
        }

        $approvers = $query->get();

        Notification::sendToMany(
            $approvers,
            'EscaladeNN300',
            "Escalade NN300 — {$label}",
            "Certificat {$certificate->certificate_number} — décision requise sous {$timeout}h ouvrables",
            [
                'icon'               => 'trending-up',
                'color'              => 'danger',
                'url'                => route('admin.approvals.show', $request),
                'entity_id'          => $request->id,
                'certificate_number' => $certificate->certificate_number,
                'step'               => $step,
                'due_date'           => $request->due_date?->toISOString(),
            ]
        );
    }

    private function notifyCreator(ApprovalRequest $request, string $outcome, ?string $reason): void
    {
        $certificate = $request->certificate();
        if (! $certificate) return;

        $creator = User::find($certificate->created_by);
        if (! $creator) return;

        $configs = [
            'approved' => ['title' => 'Certificat approuvé et émis',   'color' => 'success', 'icon' => 'check-circle'],
            'rejected' => ['title' => 'Escalade rejetée',              'color' => 'danger',  'icon' => 'x-circle'],
            'expired'  => ['title' => 'Escalade expirée — délai',      'color' => 'danger',  'icon' => 'x-circle'],
        ];

        $cfg  = $configs[$outcome] ?? $configs['rejected'];
        $body = $outcome === 'approved'
            ? "N° {$certificate->certificate_number} émis automatiquement."
            : "N° {$certificate->certificate_number}" . ($reason ? " — {$reason}" : '');

        Notification::send($creator, 'EscaladeDecision', $cfg['title'], $body, [
            'icon'  => $cfg['icon'],
            'color' => $cfg['color'],
            'url'   => route('admin.certificates.show', $certificate),
        ]);
    }

    private function audit(Certificate $cert, User $user, string $action, array $data = [], string $severity = 'INFO'): void
    {
        AuditLog::create([
            'tenant_id'   => $cert->tenant_id,
            'user_id'     => $user->id,
            'action'      => $action,
            'entity_type' => 'Certificate',
            'entity_id'   => $cert->id,
            'severity'    => $severity,
            'ip_address'  => request()->ip(),
            'user_agent'  => request()->userAgent(),
            'new_values'  => $data ?: null,
        ]);
    }
}