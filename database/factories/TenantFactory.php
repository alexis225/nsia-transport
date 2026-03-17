<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        return [
            'name'                      => 'NSIA ' . fake()->country(),
            'code'                      => strtoupper(fake()->unique()->lexify('??')),
            'country_code'              => fake()->countryCode(),
            'currency_code'             => 'XOF',
            'is_active'                 => true,
            'settings'                  => json_encode([]),
            'subscription_limit_config' => json_encode(['nn300_limit' => 1000000]),
        ];
    }
}