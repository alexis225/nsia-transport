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
        'tenant_id',
        'entity_type',
        'entity_id',
        'workflow_id',
        'current_step',
        'total_steps',
        'status',
        'requested_by',
        'resolved_by',
        'resolved_at',
        'due_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'current_step' => 'integer',
            'total_steps'  => 'integer',
            'resolved_at'  => 'datetime',
            'due_date'     => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    const STATUS_PENDING   = 'PENDING';
    const STATUS_APPROVED  = 'APPROVED';
    const STATUS_REJECTED  = 'REJECTED';
    const STATUS_CANCELLED = 'CANCELLED';

    // ── Helpers ──────────────────────────────────────────────
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isOverdue(): bool
    {
        return $this->isPending()
            && $this->due_date
            && $this->due_date->isPast();
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeForEntity($query, string $type, string $id)
    {
        return $query->where('entity_type', $type)->where('entity_id', $id);
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    public function requestedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function resolvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function decisions(): HasMany
    {
        return $this->hasMany(ApprovalDecision::class, 'request_id');
    }
}