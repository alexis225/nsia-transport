<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * ============================================================
 * InsuranceContract Model — US-014
 * ============================================================
 * Table : insurance_contracts
 * Types : OPEN_POLICY | VOYAGE | ANNUAL_VOYAGE
 * Statuts : DRAFT | ACTIVE | SUSPENDED | EXPIRED | CANCELLED
 * ============================================================
 */
class InsuranceContract extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $table = 'insurance_contracts';

    protected $fillable = [
        'tenant_id', 'broker_id',
        'contract_number', 'type',
        'insured_name', 'insured_address', 'insured_email', 'insured_phone',
        'currency_code', 'subscription_limit', 'used_limit',
        'premium_rate', 'deductible',
        'rate_ro', 'rate_rg', 'rate_surprime', 'rate_accessories', 'rate_tax',
        'coverage_type', 'clauses', 'exclusions',
        'incoterm_code', 'transport_mode_id', 'transport_mode_detail',
        'covered_countries',
        'effective_date', 'expiry_date', 'notice_period_days',
        'requires_approval', 'approved_by', 'approved_at',
        'validation_notes', 'suspended_at', 'suspension_reason',
        'status', 'notes',
        'certificates_count', 'certificates_limit',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'effective_date'     => 'date',
        'expiry_date'        => 'date',
        'approved_at'        => 'datetime',
        'suspended_at'       => 'datetime',
        'requires_approval'  => 'boolean',
        'subscription_limit' => 'decimal:2',
        'used_limit'         => 'decimal:2',
        'premium_rate'       => 'decimal:5',
        'deductible'         => 'decimal:2',
        'rate_ro'            => 'decimal:4',
        'rate_rg'            => 'decimal:4',
        'rate_surprime'      => 'decimal:4',
        'rate_accessories'   => 'decimal:4',
        'rate_tax'           => 'decimal:4',
        'clauses'            => 'array',
        'exclusions'         => 'array',
        'covered_countries'  => 'array',
        'certificates_count' => 'integer',
        'certificates_limit' => 'integer',
        'notice_period_days' => 'integer',
    ];

    // ── Constantes ────────────────────────────────────────────
    const TYPE_OPEN_POLICY    = 'OPEN_POLICY';
    const TYPE_VOYAGE         = 'VOYAGE';
    const TYPE_ANNUAL_VOYAGE  = 'ANNUAL_VOYAGE';

    const STATUS_DRAFT     = 'DRAFT';
    const STATUS_ACTIVE    = 'ACTIVE';
    const STATUS_SUSPENDED = 'SUSPENDED';
    const STATUS_EXPIRED   = 'EXPIRED';
    const STATUS_CANCELLED = 'CANCELLED';

    const COVERAGE_TOUS_RISQUES  = 'TOUS_RISQUES';
    const COVERAGE_FAP_SAUF      = 'FAP_SAUF';
    const COVERAGE_FAP_ABSOLUE   = 'FAP_ABSOLUE';

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    public function transportMode(): BelongsTo
    {
        return $this->belongsTo(TransportMode::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // public function certificates(): HasMany
    // {
    //     return $this->hasMany(Certificate::class, 'contract_id'); // US-017
    // }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    // ── Helpers ───────────────────────────────────────────────
    public function isActive(): bool    { return $this->status === self::STATUS_ACTIVE; }
    public function isDraft(): bool     { return $this->status === self::STATUS_DRAFT; }
    public function isExpired(): bool   { return $this->expiry_date->isPast(); }

    public function canIssue(): bool
    {
        return $this->isActive()
            && ! $this->isExpired()
            && ($this->certificates_limit === null || $this->certificates_count < $this->certificates_limit)
            && ($this->subscription_limit === null || (float) $this->used_limit < (float) $this->subscription_limit);
    }

    public function remainingLimit(): ?float
    {
        if ($this->subscription_limit === null) return null;
        return max(0, (float) $this->subscription_limit - (float) $this->used_limit);
    }

    public function usagePercent(): float
    {
        if (! $this->subscription_limit || (float) $this->subscription_limit === 0.0) return 0;
        return min(100, round(((float) $this->used_limit / (float) $this->subscription_limit) * 100, 1));
    }

    /**
     * Génère le prochain numéro de contrat
     * ex: CI-OP-2024-000123
     */
    public static function generateContractNumber(string $tenantCode, string $type): string
    {
        $typeCode = match($type) {
            'OPEN_POLICY'   => 'OP',
            'ANNUAL_VOYAGE' => 'AV',
            default         => 'VG',
        };
        $year  = now()->format('Y');
        $count = static::whereYear('created_at', $year)->count() + 1;
        return strtoupper($tenantCode) . '-' . $typeCode . '-' . $year . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);
    }
}