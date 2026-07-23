<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
            'commission_rate'     => 'decimal:2',
            'is_active'           => 'boolean',
            'blocked_at'          => 'datetime',
            // US-051 — Chiffrement données PII (non-queryables)
            'address'             => 'encrypted',
            'phone'               => 'encrypted',
            'registration_number' => 'encrypted',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    // Valeurs contrainte DB : fix_brokers_type_constraint migration
    const TYPE_LOCAL   = 'courtier_local';
    const TYPE_FOREIGN = 'partenaire_etranger';

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

    // Toutes les filiales dans lesquelles ce courtier peut opérer
    // (inclut sa filiale principale — voir syncTenants()).
    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'broker_tenant')->withTimestamps();
    }

    // Synchronise les filiales du courtier en garantissant que
    // la filiale principale (tenant_id) est toujours incluse.
    public function syncTenants(array $tenantIds): void
    {
        $this->tenants()->sync(array_unique(array_filter([$this->tenant_id, ...$tenantIds])));
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

    public function certificateRequests(): HasMany
    {
        return $this->hasMany(CertificateRequest::class);
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