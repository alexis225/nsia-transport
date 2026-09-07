<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ============================================================
 * TenantGuaranteeRate
 * ============================================================
 * Tarifs minimum réglementaires par filiale NSIA et par garantie
 * (FAP Sauf / Tous Risques) : taux minimum, accessoires minimum
 * par certificat, prime nette minimum.
 * ============================================================
 */
class TenantGuaranteeRate extends Model
{
    use HasUuids;

    protected $table = 'tenant_guarantee_rates';

    protected $fillable = [
        'tenant_id', 'coverage_type',
        'min_rate_pct', 'min_accessories_amount', 'min_net_premium',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'min_rate_pct' => 'decimal:4',
            'min_accessories_amount' => 'decimal:2',
            'min_net_premium' => 'decimal:2',
        ];
    }

    const COVERAGE_FAP_SAUF = 'FAP_SAUF';

    const COVERAGE_TOUS_RISQUES = 'TOUS_RISQUES';

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Résout les minimums applicables pour une filiale et un type de
     * garantie donnés. FAP_ABSOLUE n'a pas de ligne dédiée dans le barème
     * fourni par filiale — elle retombe sur le plancher TOUS_RISQUES (le
     * plus large des deux garanties couvertes par le barème, par prudence).
     */
    public static function minimumsFor(string $tenantId, ?string $coverageType): ?self
    {
        if ($coverageType === null) {
            return null;
        }

        $lookup = $coverageType === InsuranceContract::COVERAGE_FAP_ABSOLUE
            ? self::COVERAGE_TOUS_RISQUES
            : $coverageType;

        return static::where('tenant_id', $tenantId)
            ->where('coverage_type', $lookup)
            ->first();
    }
}
