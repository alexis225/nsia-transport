<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommissionRule extends Model
{
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'broker_id',
        'contract_id',
        'rate_pct',
        'base_type',
        'custom_base_amount',
        'effective_date',
        'end_date',
        'is_active',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'rate_pct'           => 'decimal:2',
            'custom_base_amount' => 'decimal:2',
            'effective_date'     => 'date',
            'end_date'           => 'date',
            'is_active'          => 'boolean',
            'created_at'         => 'datetime',
            'updated_at'         => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    const APPLIES_PREMIUM     = 'PREMIUM';
    const APPLIES_NET_PREMIUM = 'NET_PREMIUM';
    const BASE_PRIME_TOTAL   = 'prime_total';
    const BASE_INSURED_VALUE = 'insured_value';
    const BASE_CUSTOM_AMOUNT = 'custom_amount';

    const BASE_TYPE_LABELS = [
        'prime_total'   => 'Prime brute (prime_total)',
        'insured_value' => 'Valeur assurée (insured_value)',
        'custom_amount' => 'Montant fixe configurable',
    ];
    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where('effective_date', '<=', now())
                     ->where(fn ($q) => $q->whereNull('end_date')
                                          ->orWhere('end_date', '>=', now()));
    }

    public function scopeForBroker($query, string $brokerId)
    {
        return $query->where('broker_id', $brokerId);
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo      { return $this->belongsTo(Tenant::class); }
    public function broker(): BelongsTo      { return $this->belongsTo(Broker::class); }
    public function contract(): BelongsTo    { return $this->belongsTo(InsuranceContract::class, 'contract_id'); }
    public function createdByUser(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }

    public function transactions(): HasMany
    {
        return $this->hasMany(CommissionTransaction::class, 'rule_id');
    }

    public static function findApplicable(
        string  $brokerId,
        ?string $contractId = null,
        ?string $date = null
    ): ?self {
        $date = $date ?? now()->toDateString();
 
        // 1. Chercher un taux spécifique au contrat
        if ($contractId) {
            $contractRule = static::where('broker_id', $brokerId)
                ->where('contract_id', $contractId)
                ->where('is_active', true)
                ->where('effective_date', '<=', $date)
                ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $date))
                ->orderBy('effective_date', 'desc')
                ->first();
 
            if ($contractRule) return $contractRule;
        }
 
        // 2. Fallback : taux général du broker (sans contrat spécifique)
        return static::where('broker_id', $brokerId)
            ->whereNull('contract_id')
            ->where('is_active', true)
            ->where('effective_date', '<=', $date)
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $date))
            ->orderBy('effective_date', 'desc')
            ->first();
    }

}