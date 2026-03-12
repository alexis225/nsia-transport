<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommissionRule extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'broker_id',
        'contract_id',
        'rate',
        'applies_to',
        'effective_date',
        'expiry_date',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'rate'           => 'decimal:2',
            'effective_date' => 'date',
            'expiry_date'    => 'date',
            'is_active'      => 'boolean',
            'created_at'     => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    const APPLIES_PREMIUM     = 'PREMIUM';
    const APPLIES_NET_PREMIUM = 'NET_PREMIUM';

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where('effective_date', '<=', now())
                     ->where(fn ($q) => $q->whereNull('expiry_date')
                                          ->orWhere('expiry_date', '>=', now()));
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
}