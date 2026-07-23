<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ============================================================
 * TaxRule
 * ============================================================
 * Référentiel de taxes par filiale × mode de transport × pays.
 * Remplace la saisie manuelle de InsuranceContract::rate_tax —
 * le taux est toujours résolu automatiquement à l'émission via
 * findApplicable().
 * ============================================================
 */
class TaxRule extends Model
{
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'transport_mode_id',
        'country_code',
        'rate_pct',
        'effective_date',
        'end_date',
        'is_active',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'rate_pct'       => 'decimal:2',
            'effective_date' => 'date',
            'end_date'       => 'date',
            'is_active'      => 'boolean',
        ];
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where('effective_date', '<=', now())
                     ->where(fn ($q) => $q->whereNull('end_date')
                                          ->orWhere('end_date', '>=', now()));
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo        { return $this->belongsTo(Tenant::class); }
    public function transportMode(): BelongsTo { return $this->belongsTo(TransportMode::class); }
    public function country(): BelongsTo       { return $this->belongsTo(Country::class, 'country_code', 'code'); }
    public function createdByUser(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }

    /**
     * Résout le taux applicable pour une filiale / mode de transport /
     * pays donnés, à une date donnée (défaut aujourd'hui).
     */
    public static function findApplicable(
        string  $tenantId,
        ?int    $transportModeId,
        ?string $countryCode,
        ?string $date = null
    ): ?self {
        if (! $transportModeId || ! $countryCode) return null;

        $date = $date ?? now()->toDateString();

        return static::where('tenant_id', $tenantId)
            ->where('transport_mode_id', $transportModeId)
            ->where('country_code', $countryCode)
            ->where('is_active', true)
            ->where('effective_date', '<=', $date)
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $date))
            ->orderBy('effective_date', 'desc')
            ->first();
    }
}
