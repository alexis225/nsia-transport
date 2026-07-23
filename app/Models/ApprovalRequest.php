<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalRequest extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'tenant_id', 'entity_type', 'entity_id',
        'workflow_id', 'current_step', 'total_steps',
        'status', 'requested_by', 'resolved_by',
        'resolved_at', 'due_date', 'notes',
    ];
 
    protected $casts = [
        'resolved_at' => 'datetime',
        'due_date'    => 'datetime',
    ];
 
    const STATUS_PENDING   = 'PENDING';
    const STATUS_APPROVED  = 'APPROVED';
    const STATUS_REJECTED  = 'REJECTED';
    const STATUS_CANCELLED = 'CANCELLED';
 
    // ── Relations ─────────────────────────────────────────────
    public function workflowConfig(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflowConfig::class, 'workflow_id');
    }
 
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
 
    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
 
    public function decisions(): HasMany
    {
        return $this->hasMany(ApprovalDecision::class, 'request_id');
    }
 
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
 
    // ── Résoudre l'entité dynamiquement ─────────────────────
    public function certificate(): ?Certificate
    {
        if ($this->entity_type !== 'CERTIFICATE') return null;
        return Certificate::find($this->entity_id);
    }
 
    // ── Helpers ───────────────────────────────────────────────
    public function isPending(): bool  { return $this->status === self::STATUS_PENDING; }
    public function isApproved(): bool { return $this->status === self::STATUS_APPROVED; }
    public function isRejected(): bool { return $this->status === self::STATUS_REJECTED; }
    public function isLastStep(): bool { return $this->current_step >= $this->total_steps; }
    public function isOverdue(): bool  { return $this->due_date && now()->isAfter($this->due_date); }
 
    /**
     * Calcule la date d'expiration : now + timeout_hours ouvrables (lun-ven)
     */
    public static function computeDueDate(\Carbon\CarbonInterface $from, int $timeoutHours = 48): \Carbon\CarbonInterface
    {
        $remaining = $timeoutHours;
        $current   = $from;

        while ($remaining > 0) {
            $current = $current->addHour();
            if ($current->isWeekday()) {
                $remaining--;
            }
        }

        return $current;
    }
}