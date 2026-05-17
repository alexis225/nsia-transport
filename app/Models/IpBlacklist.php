<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IpBlacklist extends Model
{
    use HasUuids;

    protected $table = 'ip_blacklist';

    public $timestamps = false;

    protected $fillable = [
        'ip_range',
        'reason',
        'blocked_by',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    // ── Helpers ──────────────────────────────────────────────
    public function isActive(): bool
    {
        return is_null($this->expires_at) || $this->expires_at->isFuture();
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where(fn ($q) => $q->whereNull('expires_at')
                                          ->orWhere('expires_at', '>', now()));
    }

    /**
     * Vérifie si une IP est dans une plage bloquée.
     * Utilise l'opérateur CIDR natif PostgreSQL <<= (contained by or equals).
     */
    public static function isBlocked(string $ip): bool
    {
        // Le cast ::inet est requis pour que PostgreSQL connaisse le type du paramètre lié
        return static::active()
            ->whereRaw('?::inet <<= ip_range', [$ip])
            ->exists();
    }

    // ── Relations ────────────────────────────────────────────
    public function blockedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_by');
    }
}