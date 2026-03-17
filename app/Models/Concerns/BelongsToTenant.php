<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * ============================================================
 * BelongsToTenant Trait — US-003
 * ============================================================
 * Ajouter ce trait sur tous les modèles qui appartiennent
 * à une filiale : Certificate, Contract, Broker, etc.
 *
 * Usage :
 *   class Certificate extends Model {
 *       use BelongsToTenant;
 *   }
 *
 * Le scope global filtre automatiquement par tenant_id
 * sauf pour le SUPER ADMIN (tenant_id = null).
 * ============================================================
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        // Scope global : filtrer par tenant_id automatiquement
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = app()->bound('current_tenant_id')
                ? app('current_tenant_id')
                : null;

            // Super admin → pas de filtre tenant
            if ($tenantId) {
                $builder->where(
                    (new static)->getTable() . '.tenant_id',
                    $tenantId
                );
            }
        });

        // À la création : injecter tenant_id automatiquement
        static::creating(function (Model $model) {
            if (
                empty($model->tenant_id) &&
                app()->bound('current_tenant_id')
            ) {
                $model->tenant_id = app('current_tenant_id');
            }
        });
    }

    // ── Ignorer le scope tenant (ex: pour les jobs async) ────
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope('tenant');
    }
}