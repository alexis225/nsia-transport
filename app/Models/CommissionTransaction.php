<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionTransaction extends Model
{
        use HasUuids;
 
    protected $fillable = [
        'tenant_id', 'certificate_id', 'contract_id',
        'broker_id', 'commission_rule_id',
        'currency_code',
        'prime_brute', 'rate_pct', 'commission', 'prime_nette',
        'period_month',
        'status', 'paid_at', 'paid_by',
    ];
 
    protected $casts = [
        'prime_brute'  => 'decimal:2',
        'rate_pct'     => 'decimal:2',
        'commission'   => 'decimal:2',
        'prime_nette'  => 'decimal:2',
        'paid_at'      => 'datetime',
    ];
 
    const STATUS_PENDING   = 'PENDING';
    const STATUS_PAID      = 'PAID';
    const STATUS_CANCELLED = 'CANCELLED';
 
    // ── Relations ─────────────────────────────────────────────
    public function tenant(): BelongsTo      { return $this->belongsTo(Tenant::class); }
    public function certificate(): BelongsTo { return $this->belongsTo(Certificate::class); }
    public function contract(): BelongsTo    { return $this->belongsTo(InsuranceContract::class, 'contract_id'); }
    public function broker(): BelongsTo      { return $this->belongsTo(Broker::class); }
    public function rule(): BelongsTo        { return $this->belongsTo(CommissionRule::class, 'commission_rule_id'); }
    public function paidBy(): BelongsTo      { return $this->belongsTo(User::class, 'paid_by'); }
 
    // ── Helpers ───────────────────────────────────────────────
    public function isPending(): bool   { return $this->status === self::STATUS_PENDING; }
    public function isPaid(): bool      { return $this->status === self::STATUS_PAID; }
    public function isCancelled(): bool { return $this->status === self::STATUS_CANCELLED; }

}