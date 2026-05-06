<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Models\Role;

/**
 * ============================================================
 * UserRoleGrant Model — US-036
 * ============================================================
 * Table : user_role_grants (MIGRATION 04 existante)
 *
 * Colonnes :
 *   user_id     → délégataire (reçoit le rôle)
 *   granted_by  → délégant (accorde le rôle)
 *   role_name   → rôle Spatie délégué ex: 'souscripteur'
 *   expires_at  → expiration (null = permanent)
 *   revoked_at  → révocation manuelle (null = pas révoqué)
 *   reason      → motif de la délégation
 * ============================================================
 */
class UserRoleGrant extends Model
{
    use HasUuids;
    public $timestamps = false;
    protected $fillable = [
        'user_id',
        'tenant_id',
        'role_name',
        'granted_by',
        'granted_at',
        'expires_at',
        'revoked_by',
        'revoked_at',
        'reason',
    ];

    protected $casts = [
        'granted_at' => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    // Rôles déléguables par un admin_filiale
    const DELEGATABLE_ROLES = [
        'souscripteur'  => 'Souscripteur',
        'admin_filiale' => 'Admin Filiale',
        'courtier_local'=> 'Courtier local',
    ];

    // ── Relations ─────────────────────────────────────────────
    public function grantee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function grantor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    // ── Helpers ───────────────────────────────────────────────

    /**
     * Délégation active = pas révoquée + pas expirée
     */
    public function isActive(): bool
    {
        return is_null($this->revoked_at)
            && (is_null($this->expires_at) || now()->isBefore($this->expires_at));
    }

    public function isExpired(): bool
    {
        return is_null($this->revoked_at)
            && ! is_null($this->expires_at)
            && now()->isAfter($this->expires_at);
    }

    public function isRevoked(): bool
    {
        return ! is_null($this->revoked_at);
    }

    public function status(): string
    {
        if ($this->isRevoked()) return 'REVOKED';
        if ($this->isExpired()) return 'EXPIRED';
        return 'ACTIVE';
    }

    /**
     * Vérifie si un utilisateur a une permission via un rôle délégué actif
     * Utilisé dans Gate::before() — AuthServiceProvider
     */
    public static function hasGrantedPermission(User $user, string $permission): bool
    {
        $activeGrants = static::where('user_id', $user->id)
           ->where('tenant_id', $user->tenant_id)
            ->whereNull('revoked_at')
            ->where(fn ($q) =>
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now())
            )
            ->pluck('role_name');

        foreach ($activeGrants as $roleName) {
            $role = Role::findByName($roleName, 'web');
            if ($role && $role->hasPermissionTo($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Retourne tous les rôles délégués actifs d'un utilisateur
     */
    public static function activeRolesFor(User $user): array
    {
        return static::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNull('revoked_at')
            ->where(fn ($q) =>
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now())
            )
            ->pluck('role_name')
            ->toArray();
    }

    // ── Scopes ────────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->whereNull('revoked_at')
            ->where(fn ($q) =>
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now())
            );
    }

    public function scopeExpired($query)
    {
        return $query->whereNull('revoked_at')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now());
    }
}