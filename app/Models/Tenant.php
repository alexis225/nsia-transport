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

    // public function definition(): array
    // {
    //     return [
    //         // 'id' => Str::uuid(),  ← supprimer, HasUuids s'en charge
    //         'name'                      => 'NSIA ' . fake()->country(),
    //         'code'                      => strtoupper(fake()->unique()->lexify('??')),
    //         'is_active'                 => true,
    //         'settings'                  => json_encode([]),
    //         'subscription_limit_config' => json_encode(['nn300_limit' => 1000000]),
    //     ];
    // }
}