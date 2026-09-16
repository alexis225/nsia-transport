<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ============================================================
 * ContractPremiumRate
 * ============================================================
 * Taux R.O./R.G. spécifique à un type de conditionnement (Conteneur,
 * Conventionnel, Vrac, Groupage, Bout en bout) pour un contrat donné —
 * surcharge InsuranceContract::rate_ro/rate_rg quand le certificat émis
 * précise ce type (cf. InsuranceContract::premiumRateFor()).
 * ============================================================
 */
class ContractPremiumRate extends Model
{
    use HasUuids;

    public const TYPES = ['CONTAINER', 'GROUPAGE', 'CONVENTIONNEL', 'BOUT_EN_BOUT', 'VRAC'];

    protected $fillable = [
        'contract_id',
        'conditioning_type',
        'rate_ro',
        'rate_rg',
    ];

    protected function casts(): array
    {
        return [
            'rate_ro' => 'decimal:4',
            'rate_rg' => 'decimal:4',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(InsuranceContract::class, 'contract_id');
    }
}
