<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory;
    use HasUuids;       // ← PK UUID
    use HasRoles;
    use Notifiable;
    use SoftDeletes;
    use TwoFactorAuthenticatable;


    // ── UUID ──────────────────────────────────────────────
    protected $keyType   = 'string';
    public $incrementing = false;

   protected $fillable = [
    'tenant_id', 'first_name', 'last_name', 'email', 'password',
    'phone', 'avatar_path', 'locale', 'timezone', 'is_active',
    'mfa_enabled', 'mfa_secret', 'blocked_by', 'blocked_at',
    'blocked_reason', 'password_changed_at', 'created_by',
    'email_verified_at',
    'last_login_at',   // ← ajouter
    'last_login_ip',   // ← ajouter
    'failed_login_attempts', // ← ajouter
    'locked_until',    // ← ajouter
];

    // ── Hidden ────────────────────────────────────────────
    protected $hidden = [
        'password',
        'mfa_secret',
        'remember_token',
    ];

    // ── Casts ─────────────────────────────────────────────
    protected function casts(): array
    {
        return [
            'email_verified_at'   => 'datetime',
            'password_changed_at' => 'datetime',
            'last_login_at'       => 'datetime',
            'blocked_at'          => 'datetime',
            'blocked_by'          => 'string',
            'locked_until'        => 'datetime',
            'password'            => 'hashed',
            'is_active'           => 'boolean',
            'mfa_enabled'         => 'boolean',
        ];
    }

    // ── Relations ─────────────────────────────────────────
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    // ── Helpers ───────────────────────────────────────────
    public function isSuperAdmin(): bool
    {
        return $this->tenant_id === null;
    }

    public function isLocked(): bool
    {
        return $this->locked_until !== null
            && $this->locked_until->isFuture();
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}