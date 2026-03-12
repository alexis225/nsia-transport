<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MerchandiseCategory extends Model
{
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'parent_id',
        'risk_level',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'risk_level' => 'integer',
            'is_active'  => 'boolean',
        ];
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(MerchandiseCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(MerchandiseCategory::class, 'parent_id');
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class, 'merchandise_category_id');
    }
}