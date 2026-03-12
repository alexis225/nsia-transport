<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InsuranceContract extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'broker_id',
        'contract_number',
        'type',
        'insured_name',
        'insured_address',
        'insured_email',
        'insured_phone',
        'currency_code',
        'subscription_limit',
        'used_limit',
        'premium_rate',
        'deductible',
        'coverage_type',
        'clauses',
        'exclusions',
        'effective_date',
        'expiry_date',
        'notice_period_days',
        'requires_approval',
        'approved_by',
        'approved_at',
        'status',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'subscription_limit' => 'decimal:2',
            'used_limit'         => 'decimal:2',
            'premium_rate'       => 'decimal:5',
            'deductible'         => 'decimal:2',
            'clauses'            => 'array',
            'exclusions'         => 'array',
            'effective_date'     => 'date',
            'expiry_date'        => 'date',
            'requires_approval'  => 'boolean',
            'approved_at'        => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    const TYPE_OPEN_POLICY    = 'OPEN_POLICY';
    const TYPE_VOYAGE         = 'VOYAGE';
    const TYPE_ANNUAL_VOYAGE  = 'ANNUAL_VOYAGE';

    const STATUS_DRAFT     = 'DRAFT';
    const STATUS_ACTIVE    = 'ACTIVE';
    const STATUS_SUSPENDED = 'SUSPENDED';
    const STATUS_EXPIRED   = 'EXPIRED';
    const STATUS_CANCELLED = 'CANCELLED';

    // ── Helpers métier ───────────────────────────────────────
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isExpired(): bool
    {
        return $this->expiry_date->isPast() || $this->status === self::STATUS_EXPIRED;
    }

    public function hasAvailableLimit(float $amount): bool
    {
        if (is_null($this->subscription_limit)) return true;
        return ($this->used_limit + $amount) <= $this->subscription_limit;
    }

    public function getRemainingLimitAttribute(): ?float
    {
        if (is_null($this->subscription_limit)) return null;
        return $this->subscription_limit - $this->used_limit;
    }

    public function getUsagePercentageAttribute(): ?float
    {
        if (is_null($this->subscription_limit) || $this->subscription_limit == 0) return null;
        return round(($this->used_limit / $this->subscription_limit) * 100, 2);
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeOfTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->where('status', self::STATUS_ACTIVE)
                     ->whereBetween('expiry_date', [now(), now()->addDays($days)]);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('contract_number', 'ilike', "%{$term}%")
              ->orWhere('insured_name',   'ilike', "%{$term}%");
        });
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_code', 'code');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function coinsurers(): BelongsToMany
    {
        return $this->belongsToMany(
            Coinsurer::class,
            'contract_coinsurers',
            'contract_id',
            'coinsurer_id'
        )->withPivot('share_rate');
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class, 'contract_id');
    }

    public function commissionRules(): HasMany
    {
        return $this->hasMany(CommissionRule::class, 'contract_id');
    }

    public function commissionTransactions(): HasMany
    {
        return $this->hasMany(CommissionTransaction::class, 'contract_id');
    }
}