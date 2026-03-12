<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coinsurer extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'country_code',
        'share_rate',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'share_rate' => 'decimal:2',
            'is_active'  => 'boolean',
        ];
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function contracts(): BelongsToMany
    {
        return $this->belongsToMany(
            InsuranceContract::class,
            'contract_coinsurers',
            'coinsurer_id',
            'contract_id'
        )->withPivot('share_rate');
    }
}