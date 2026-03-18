<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasUuids;

    // Table partitionnée — append-only, jamais de update/delete
    public $timestamps = false;

    // Empêcher toute modification après création
    protected static function booted(): void
    {
        static::updating(fn () => false);
        static::deleting(fn () => false);
    }

    protected $fillable = [
        'tenant_id',
        'user_id',
        'user_email',
        'session_id',
        'action',
        'entity_type',
        'entity_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'request_id',
        'severity',
        'auditable_type',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'metadata'   => 'array',
            'created_at' => 'datetime',
        ];
    }

    // ── Constantes sévérité ──────────────────────────────────
    const SEVERITY_INFO     = 'INFO';
    const SEVERITY_WARNING  = 'WARNING';
    const SEVERITY_ERROR    = 'ERROR';
    const SEVERITY_CRITICAL = 'CRITICAL';

    // ── Scopes ───────────────────────────────────────────────
    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForEntity($query, string $type, string $id)
    {
        return $query->where('entity_type', $type)->where('entity_id', $id);
    }

    public function scopeCritical($query)
    {
        return $query->whereIn('severity', [self::SEVERITY_WARNING, self::SEVERITY_ERROR, self::SEVERITY_CRITICAL]);
    }

    public function scopeForAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}