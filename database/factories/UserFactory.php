<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected static ?string $password = null;

    public function definition(): array
    {
        return [
            'id'                    => Str::uuid(),
            'tenant_id'             => Tenant::factory(),
            'first_name'            => fake()->firstName(),
            'last_name'             => fake()->lastName(),
            'email'                 => fake()->unique()->safeEmail(),
            'email_verified_at'     => now(),
            'password'              => static::$password ??= Hash::make('password'),
            'is_active'             => true,
            'failed_login_attempts' => 0,
            'locked_until'          => null,
            'mfa_enabled'           => false,
            'remember_token'        => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}