<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportExecution extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'report_id',
        'tenant_id',
        'requested_by',
        'parameters',
        'format',
        'status',
        'file_path',
        'file_size',
        'row_count',
        'error_message',
        'started_at',
        'completed_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'parameters'   => 'array',
            'started_at'   => 'datetime',
            'completed_at' => 'datetime',
            'expires_at'   => 'datetime',
            'created_at'   => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    const STATUS_QUEUED     = 'QUEUED';
    const STATUS_PROCESSING = 'PROCESSING';
    const STATUS_COMPLETED  = 'COMPLETED';
    const STATUS_FAILED     = 'FAILED';

    // ── Helpers ──────────────────────────────────────────────
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getDurationAttribute(): ?int
    {
        if (!$this->started_at || !$this->completed_at) return null;
        return $this->started_at->diffInSeconds($this->completed_at);
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    // ── Relations ────────────────────────────────────────────
    public function report(): BelongsTo
    {
        return $this->belongsTo(ReportDefinition::class, 'report_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function requestedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}