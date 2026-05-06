<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\UserRoleGrant;
use Illuminate\Support\Facades\DB;
use App\Models\Notification;
/**
 * ============================================================
 * DelegationService — US-036
 * ============================================================
 * Utilise NotificationHelper::send() pour éviter le conflit
 * de namespace entre App\Models\Notification et
 * Illuminate\Notifications\Notification.
 * ============================================================
 */
class DelegationService
{
    // ══════════════════════════════════════════════════════════
    // CRÉATION
    // ══════════════════════════════════════════════════════════

    public function create(
        User    $grantor,
        User    $grantee,
        string  $roleName,
        string  $expiresAt,
        ?string $reason = null
    ): UserRoleGrant {
        return DB::transaction(function () use ($grantor, $grantee, $roleName, $expiresAt, $reason) {

            $grant = UserRoleGrant::create([
                'user_id'    => $grantee->id,
                'tenant_id'  => $grantor->tenant_id,
                'role_name'  => $roleName,
                'granted_by' => $grantor->id,
                'granted_at' => now(),
                'expires_at' => $expiresAt,
                'reason'     => $reason,
            ]);

            $roleLabel = UserRoleGrant::DELEGATABLE_ROLES[$roleName] ?? $roleName;

            // ── Notification in-app délégataire ───────────────
            Notification::send(
                $grantee,
                'DelegationGranted',
                "Rôle délégué : {$roleLabel}",
                "{$grantor->first_name} {$grantor->last_name} vous a délégué le rôle {$roleLabel}",
                [
                    'icon'       => 'user-check',
                    'color'      => 'info',
                    'url'        => route('admin.delegations.index'),
                    'entity_id'  => $grant->id,
                    'role_name'  => $roleName,
                    'role_label' => $roleLabel,
                    'grantor'    => $grantor->first_name . ' ' . $grantor->last_name,
                    'expires_at' => $expiresAt,
                ]
            );

            // ── Notification in-app délégant (confirmation) ───
            Notification::send(
                $grantor,
                'DelegationCreated',
                "Délégation créée",
                "Vous avez délégué le rôle {$roleLabel} à {$grantee->first_name} {$grantee->last_name}",
                [
                    'icon'      => 'user-check',
                    'color'     => 'success',
                    'url'       => route('admin.delegations.index'),
                    'entity_id' => $grant->id,
                ]
            );

            // ── Audit log ─────────────────────────────────────
            AuditLog::create([
                'tenant_id'   => $grantor->tenant_id,
                'user_id'     => $grantor->id,
                'action'      => 'delegation.created',
                'entity_type' => 'UserRoleGrant',
                'entity_id'   => $grant->id,
                'severity'    => 'WARNING',
                'ip_address'  => request()->ip(),
                'user_agent'  => request()->userAgent(),
                'new_values'  => [
                    'grantee'    => $grantee->email,
                    'role'       => $roleName,
                    'expires_at' => $expiresAt,
                    'reason'     => $reason,
                ],
            ]);

            return $grant;
        });
    }

    // ══════════════════════════════════════════════════════════
    // RÉVOCATION MANUELLE
    // ══════════════════════════════════════════════════════════

    public function revoke(UserRoleGrant $grant, User $revokedBy, ?string $reason = null): void
    {
        DB::transaction(function () use ($grant, $revokedBy, $reason) {

            $grant->update([
                'revoked_by' => $revokedBy->id,
                'revoked_at' => now(),
                'reason'     => $reason
                    ? ($grant->reason
                        ? $grant->reason . ' | Révocation : ' . $reason
                        : 'Révocation : ' . $reason)
                    : $grant->reason,
            ]);

            $roleLabel = UserRoleGrant::DELEGATABLE_ROLES[$grant->role_name] ?? $grant->role_name;
            $grantee   = $grant->grantee;

            if ($grantee) {
                Notification::send(
                    $grantee,
                    'DelegationRevoked',
                    "Délégation révoquée : {$roleLabel}",
                    "Votre délégation du rôle {$roleLabel} a été révoquée" . ($reason ? " : {$reason}" : ''),
                    [
                        'icon'  => 'user-x',
                        'color' => 'warning',
                        'url'   => route('admin.delegations.index'),
                    ]
                );
            }

            AuditLog::create([
                'tenant_id'   => $grant->tenant_id,
                'user_id'     => $revokedBy->id,
                'action'      => 'delegation.revoked',
                'entity_type' => 'UserRoleGrant',
                'entity_id'   => $grant->id,
                'severity'    => 'WARNING',
                'ip_address'  => request()->ip(),
                'user_agent'  => request()->userAgent(),
                'new_values'  => ['reason' => $reason],
            ]);
        });
    }

    // ══════════════════════════════════════════════════════════
    // EXPIRATION AUTOMATIQUE — Scheduler hourly
    // ══════════════════════════════════════════════════════════

    public function expireOverdue(): int
    {
        $expired = UserRoleGrant::whereNull('revoked_at')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->with(['grantee', 'grantor'])
            ->get();

        foreach ($expired as $grant) {
            $roleLabel = UserRoleGrant::DELEGATABLE_ROLES[$grant->role_name] ?? $grant->role_name;

            if ($grant->grantee) {
                Notification::send(
                    $grant->grantee,
                    'DelegationExpired',
                    "Délégation expirée : {$roleLabel}",
                    "Votre délégation du rôle {$roleLabel} a expiré automatiquement.",
                    [
                        'icon'  => 'clock',
                        'color' => 'warning',
                        'url'   => route('admin.delegations.index'),
                    ]
                );
            }

            if ($grant->grantor) {
                Notification::send(
                    $grant->grantor,
                    'DelegationExpiredGrantor',
                    "Délégation expirée",
                    "La délégation du rôle {$roleLabel} accordée à "
                        . "{$grant->grantee?->first_name} {$grant->grantee?->last_name} a expiré.",
                    [
                        'icon'  => 'clock',
                        'color' => 'info',
                        'url'   => route('admin.delegations.index'),
                    ]
                );
            }
        }

        return $expired->count();
    }
}