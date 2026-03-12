<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Broker extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'code',
        'name',
        'type',
        'country_code',
        'address',
        'email',
        'phone',
        'registration_number',
        'commission_rate',
        'is_active',
        'blocked_by',
        'blocked_at',
        'blocked_reason',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'is_active'       => 'boolean',
            'blocked_at'      => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    const TYPE_LOCAL   = 'LOCAL';
    const TYPE_FOREIGN = 'FOREIGN_PARTNER';

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name',  'ilike', "%{$term}%")
              ->orWhere('code', 'ilike', "%{$term}%")
              ->orWhere('email','ilike', "%{$term}%");
        });
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function blockedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_by');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(InsuranceContract::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function commissionRules(): HasMany
    {
        return $this->hasMany(CommissionRule::class);
    }

    public function commissionTransactions(): HasMany
    {
        return $this->hasMany(CommissionTransaction::class);
    }
}