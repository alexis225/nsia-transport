<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRoleGrant extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'role_name',
        'granted_by',
        'granted_at',
        'expires_at',
        'revoked_by',
        'revoked_at',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    // ── Helpers ──────────────────────────────────────────────
    public function isActive(): bool
    {
        return is_null($this->revoked_at)
            && (is_null($this->expires_at) || $this->expires_at->isFuture());
    }

    public function revoke(string $revokedBy): void
    {
        $this->update([
            'revoked_by' => $revokedBy,
            'revoked_at' => now(),
        ]);
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->whereNull('revoked_at')
                     ->where(fn ($q) => $q->whereNull('expires_at')
                                          ->orWhere('expires_at', '>', now()));
    }

    // ── Relations ────────────────────────────────────────────
    public function user(): BelongsTo      { return $this->belongsTo(User::class); }
    public function tenant(): BelongsTo    { return $this->belongsTo(Tenant::class); }
    public function grantedBy(): BelongsTo { return $this->belongsTo(User::class, 'granted_by'); }
    public function revokedBy(): BelongsTo { return $this->belongsTo(User::class, 'revoked_by'); }
}