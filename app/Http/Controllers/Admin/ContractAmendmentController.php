<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ContractAmendment;
use App\Models\InsuranceContract;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * ContractAmendmentController — US-028
 * ============================================================
 * Workflow : DRAFT → PENDING → APPROVED (appliqué) | REJECTED
 * ============================================================
 */
class ContractAmendmentController extends Controller
{
    // ── Liste des avenants d'un contrat ──────────────────────
    public function index(InsuranceContract $contract): Response
    {
        $this->authorizeTenant($contract);

        $amendments = ContractAmendment::with([
                'submittedBy:id,first_name,last_name',
                'reviewedBy:id,first_name,last_name',
                'createdBy:id,first_name,last_name',
            ])
            ->where('contract_id', $contract->id)
            ->orderBy('sequence', 'desc')
            ->get();

        return Inertia::render('admin/contracts/amendments/index', [
            'contract'   => $contract->load('tenant:id,name,code'),
            'amendments' => $amendments,
            'can'        => [
                'create'   => auth()->user()->can('contracts.edit'),
                'validate' => auth()->user()->can('contracts.validate'),
            ],
        ]);
    }

    // ── Formulaire création avenant ──────────────────────────
    public function create(InsuranceContract $contract): Response
    {
        $this->authorizeTenant($contract);
        abort_if($contract->status !== InsuranceContract::STATUS_ACTIVE, 403,
            'Seul un contrat actif peut faire l\'objet d\'un avenant.');

        return Inertia::render('admin/contracts/amendments/create', [
            'contract' => $contract->load(['broker', 'transportMode', 'tenant']),
        ]);
    }

    // ── Créer l'avenant (DRAFT) ───────────────────────────────
    public function store(Request $request, InsuranceContract $contract): RedirectResponse
    {
        $this->authorizeTenant($contract);
        abort_if($contract->status !== InsuranceContract::STATUS_ACTIVE, 403);

        $request->validate([
            'reason'               => ['required', 'string', 'max:255'],
            'description'          => ['nullable', 'string'],
            'premium_rate'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_ro'              => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_rg'              => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_surprime'        => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_accessories'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_tax'             => ['nullable', 'numeric', 'min:0', 'max:100'],
            'subscription_limit'   => ['nullable', 'numeric', 'min:0'],
            'effective_date'       => ['nullable', 'date'],
            'expiry_date'          => ['nullable', 'date'],
            'notice_period_days'   => ['nullable', 'integer', 'min:0'],
            'clauses'              => ['nullable', 'array'],
            'exclusions'           => ['nullable', 'array'],
            'broker_id'            => ['nullable', 'uuid', 'exists:brokers,id'],
            'incoterm_code'        => ['nullable', 'string'],
            'transport_mode_id'    => ['nullable', 'exists:transport_modes,id'],
            'coverage_type'        => ['nullable', 'in:TOUS_RISQUES,FAP_SAUF,FAP_ABSOLUE'],
        ]);

        $newValues = $request->except(['reason', 'description', '_token', '_method']);
        $changes   = ContractAmendment::computeChanges($contract, $newValues);

        abort_if(empty($changes), 422, 'Aucune modification détectée.');

        $sequence = ContractAmendment::where('contract_id', $contract->id)->max('sequence') + 1;

        $amendment = ContractAmendment::create([
            'contract_id'      => $contract->id,
            'tenant_id'        => $contract->tenant_id,
            'amendment_number' => ContractAmendment::generateNumber($contract, $sequence),
            'sequence'         => $sequence,
            'reason'           => $request->reason,
            'description'      => $request->description,
            'changes'          => $changes,
            'status'           => ContractAmendment::STATUS_DRAFT,
            'created_by'       => $request->user()->id,
        ]);

        $this->log($amendment, $request, 'amendment.created');

        return redirect()->route('admin.contracts.amendments.show', [
            'contract'  => $contract->id,
            'amendment' => $amendment->id,
        ])->with('status', "Avenant {$amendment->amendment_number} créé.");
    }

    // ── Détail d'un avenant ───────────────────────────────────
    public function show(InsuranceContract $contract, ContractAmendment $amendment): Response
    {
        $this->authorizeTenant($contract);

        $amendment->load([
            'submittedBy:id,first_name,last_name',
            'reviewedBy:id,first_name,last_name',
            'createdBy:id,first_name,last_name',
        ]);

        return Inertia::render('admin/contracts/amendments/show', [
            'contract'  => $contract->load('tenant:id,name,code'),
            'amendment' => $amendment,
            'can'       => [
                'validate' => auth()->user()->can('contracts.validate'),
                'edit'     => auth()->user()->can('contracts.edit') && $amendment->isDraft(),
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // WORKFLOW
    // ══════════════════════════════════════════════════════════

    // ── Soumettre pour validation ─────────────────────────────
    public function submit(Request $request, InsuranceContract $contract, ContractAmendment $amendment): RedirectResponse
    {
        $this->authorizeTenant($contract);
        abort_if(! $amendment->isDraft(), 422);

        $amendment->update([
            'status'       => ContractAmendment::STATUS_PENDING,
            'submitted_by' => $request->user()->id,
            'submitted_at' => now(),
        ]);

        // Notifier les validateurs
        $validators = User::where('tenant_id', $contract->tenant_id)
            ->whereHas('roles', fn ($q) =>
                $q->whereIn('name', ['admin_filiale', 'super_admin'])
            )
            ->where('id', '!=', $request->user()->id)
            ->get();

        Notification::notifyMany(
            $validators,
            'AmendmentPending',
            "Avenant en attente de validation",
            "{$amendment->amendment_number} — {$contract->contract_number}",
            [
                'icon'             => 'alert-triangle',
                'color'            => 'warning',
                'url'              => route('admin.contracts.amendments.show', [
                    'contract'  => $contract->id,
                    'amendment' => $amendment->id,
                ]),
                'entity_id'        => $amendment->id,
                'amendment_number' => $amendment->amendment_number,
            ]
        );

        $this->log($amendment, $request, 'amendment.submitted');

        return back()->with('status', 'Avenant soumis pour validation.');
    }

    // ── Approuver et appliquer ────────────────────────────────
    public function approve(Request $request, InsuranceContract $contract, ContractAmendment $amendment): RedirectResponse
    {
        abort_if(! $request->user()->can('contracts.validate'), 403);
        abort_if(! $amendment->isPending(), 422);

        $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        DB::transaction(function () use ($amendment, $contract, $request) {
            // Appliquer les changements au contrat
            $updates = [];
            foreach ($amendment->changes as $field => $change) {
                $updates[$field] = $change['after'];
            }
            $contract->update($updates);

            // Marquer l'avenant comme approuvé
            $amendment->update([
                'status'       => ContractAmendment::STATUS_APPROVED,
                'reviewed_by'  => $request->user()->id,
                'reviewed_at'  => now(),
                'review_notes' => $request->notes,
                'applied_at'   => now(),
            ]);
        });

        // Notifier le créateur de l'avenant
        $creator = User::find($amendment->created_by);
        if ($creator) {
            Notification::notify(
                $creator,
                'AmendmentApproved',
                "Avenant approuvé et appliqué",
                "{$amendment->amendment_number} a été approuvé",
                [
                    'icon'      => 'check-circle',
                    'color'     => 'success',
                    'url'       => route('admin.contracts.show', $contract),
                    'entity_id' => $amendment->id,
                ]
            );
        }

        $this->log($amendment, $request, 'amendment.approved', ['notes' => $request->notes]);

        return redirect()->route('admin.contracts.show', $contract)
            ->with('status', "Avenant {$amendment->amendment_number} approuvé et appliqué au contrat.");
    }

    // ── Rejeter ───────────────────────────────────────────────
    public function reject(Request $request, InsuranceContract $contract, ContractAmendment $amendment): RedirectResponse
    {
        abort_if(! $request->user()->can('contracts.validate'), 403);
        abort_if(! $amendment->isPending(), 422);

        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $amendment->update([
            'status'       => ContractAmendment::STATUS_REJECTED,
            'reviewed_by'  => $request->user()->id,
            'reviewed_at'  => now(),
            'review_notes' => 'REJETÉ : ' . $request->reason,
        ]);

        $creator = User::find($amendment->created_by);
        if ($creator) {
            Notification::notify(
                $creator,
                'AmendmentRejected',
                "Avenant rejeté",
                "{$amendment->amendment_number} — {$request->reason}",
                [
                    'icon'      => 'x-circle',
                    'color'     => 'danger',
                    'url'       => route('admin.contracts.amendments.show', [
                        'contract'  => $contract->id,
                        'amendment' => $amendment->id,
                    ]),
                    'entity_id' => $amendment->id,
                ]
            );
        }

        $this->log($amendment, $request, 'amendment.rejected', ['reason' => $request->reason], 'WARNING');

        return back()->with('status', 'Avenant rejeté.');
    }

    // ── Helpers ───────────────────────────────────────────────
    private function log(ContractAmendment $amendment, Request $request, string $action, array $extra = [], string $severity = 'INFO'): void
    {
        AuditLog::create([
            'tenant_id'   => $amendment->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => $action,
            'entity_type' => 'ContractAmendment',
            'entity_id'   => $amendment->id,
            'severity'    => $severity,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => $extra ?: null,
        ]);
    }

    private function authorizeTenant(InsuranceContract $contract): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        if ((string) $user->tenant_id !== (string) $contract->tenant_id) abort(403);
    }
}