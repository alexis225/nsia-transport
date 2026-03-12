<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'token_hash',
        'ip_address',
        'user_agent',
        'device_type',
        'last_activity',
        'expires_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'last_activity' => 'datetime',
            'expires_at'    => 'datetime',
            'revoked_at'    => 'datetime',
            'created_at'    => 'datetime',
        ];
    }

    // ── Helpers ──────────────────────────────────────────────
    public function isValid(): bool
    {
        return is_null($this->revoked_at)
            && $this->expires_at->isFuture();
    }

    public function revoke(): void
    {
        $this->update(['revoked_at' => now()]);
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->whereNull('revoked_at')
                     ->where('expires_at', '>', now());
    }

    // ── Relations ────────────────────────────────────────────
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}