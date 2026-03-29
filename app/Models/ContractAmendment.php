<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ============================================================
 * ContractAmendment Model — US-028
 * ============================================================
 * Table : contract_amendments
 * Workflow : DRAFT → PENDING → APPROVED | REJECTED
 * ============================================================
 */
class ContractAmendment extends Model
{
    use HasUuids;

    protected $fillable = [
        'contract_id', 'tenant_id',
        'amendment_number', 'sequence',
        'reason', 'description', 'changes',
        'status',
        'submitted_by', 'submitted_at',
        'reviewed_by',  'reviewed_at', 'review_notes',
        'applied_at', 'created_by',
    ];

    protected $casts = [
        'changes'      => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at'  => 'datetime',
        'applied_at'   => 'datetime',
    ];

    const STATUS_DRAFT    = 'DRAFT';
    const STATUS_PENDING  = 'PENDING';
    const STATUS_APPROVED = 'APPROVED';
    const STATUS_REJECTED = 'REJECTED';

    // ── Relations ────────────────────────────────────────────
    public function contract(): BelongsTo
    {
        return $this->belongsTo(InsuranceContract::class, 'contract_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Helpers ───────────────────────────────────────────────
    public function isDraft(): bool    { return $this->status === self::STATUS_DRAFT; }
    public function isPending(): bool  { return $this->status === self::STATUS_PENDING; }
    public function isApproved(): bool { return $this->status === self::STATUS_APPROVED; }
    public function isRejected(): bool { return $this->status === self::STATUS_REJECTED; }

    /**
     * Génère le numéro d'avenant
     * ex: AV-CI-OP-2024-000001-002
     */
    public static function generateNumber(InsuranceContract $contract, int $sequence): string
    {
        return 'AV-' . $contract->contract_number . '-' . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Calcule les différences entre l'état actuel et les nouvelles valeurs
     */
    public static function computeChanges(InsuranceContract $contract, array $newValues): array
    {
        $trackableFields = [
            'premium_rate', 'rate_ro', 'rate_rg', 'rate_surprime',
            'rate_accessories', 'rate_tax', 'subscription_limit',
            'effective_date', 'expiry_date', 'notice_period_days',
            'clauses', 'exclusions', 'broker_id',
            'incoterm_code', 'transport_mode_id', 'coverage_type',
        ];

        $changes = [];
        foreach ($trackableFields as $field) {
            if (! array_key_exists($field, $newValues)) continue;

            $before = $contract->$field;
            $after  = $newValues[$field];

            // Normaliser pour comparaison
            $beforeStr = is_array($before) ? json_encode($before) : (string)($before ?? '');
            $afterStr  = is_array($after)  ? json_encode($after)  : (string)($after  ?? '');

            if ($beforeStr !== $afterStr) {
                $changes[$field] = [
                    'before' => $before,
                    'after'  => $after,
                ];
            }
        }

        return $changes;
    }
}