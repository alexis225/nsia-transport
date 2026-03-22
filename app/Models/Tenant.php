<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory, HasUuids;

    protected $keyType   = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'code', 'country_code','currency_code','is_active',
        'settings', 'subscription_limit_config',
        'logo_path',
    ];

    protected $casts = [
        'is_active'                 => 'boolean',
        'settings'                  => 'array',
        'subscription_limit_config' => 'array',
    ];

    protected static function newFactory(): TenantFactory
    {
        return TenantFactory::new();
    }


    public function users(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class);
    }

    // app/Models/Tenant.php
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}