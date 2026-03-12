<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionTransaction extends Model
{
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'broker_id',
        'certificate_id',
        'contract_id',
        'rule_id',
        'currency_code',
        'gross_premium',
        'commission_rate',
        'commission_amount',
        'net_premium',
        'period_month',
        'status',
        'settled_at',
    ];

    protected function casts(): array
    {
        return [
            'gross_premium'     => 'decimal:2',
            'commission_rate'   => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'net_premium'       => 'decimal:2',
            'settled_at'        => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    const STATUS_PENDING   = 'PENDING';
    const STATUS_VALIDATED = 'VALIDATED';
    const STATUS_PAID      = 'PAID';
    const STATUS_DISPUTED  = 'DISPUTED';

    // ── Scopes ───────────────────────────────────────────────
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period_month', $period);
    }

    public function scopeForBroker($query, string $brokerId)
    {
        return $query->where('broker_id', $brokerId);
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo   { return $this->belongsTo(Tenant::class); }
    public function broker(): BelongsTo   { return $this->belongsTo(Broker::class); }
    public function contract(): BelongsTo { return $this->belongsTo(InsuranceContract::class, 'contract_id'); }
    public function rule(): BelongsTo     { return $this->belongsTo(CommissionRule::class, 'rule_id'); }
    public function currency(): BelongsTo { return $this->belongsTo(Currency::class, 'currency_code', 'code'); }
}