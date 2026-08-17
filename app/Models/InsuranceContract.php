<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * ============================================================
 * InsuranceContract Model — US-014
 * ============================================================
 * Table : insurance_contracts
 * Types : OPEN_POLICY | VOYAGE | ANNUAL_VOYAGE
 * Statuts : DRAFT | ACTIVE | SUSPENDED | EXPIRED | CANCELLED
 * ============================================================
 */
class InsuranceContract extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $table = 'insurance_contracts';

    protected $fillable = [
        'tenant_id', 'broker_id', 'subscriber_id',
        'subscriber_name', 'subscriber_address', 'subscriber_email', 'subscriber_phone',
        'contract_number', 'type',
        'insured_name', 'insured_address', 'insured_email', 'insured_phone',
        'currency_code', 'subscription_limit', 'used_limit', 'treaty_limit',
        'plein', 'escalade_enabled', 'escalade_threshold_pct',
        'premium_rate', 'deductible',
        'rate_ro', 'rate_rg', 'accessories_amount', 'rate_tax',
        'coverage_type', 'clauses', 'exclusions',
        'incoterm_code', 'transport_mode_id', 'conditioning_types',
        'covered_countries',
        'effective_date', 'expiry_date', 'notice_period_days',
        'requires_approval', 'approved_by', 'approved_at', 'nn300_unlocked_at',
        'validation_notes', 'suspended_at', 'suspension_reason',
        'status', 'notes',
        'certificates_count', 'certificates_limit',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'effective_date'     => 'date',
        'expiry_date'        => 'date',
        'approved_at'        => 'datetime',
        'nn300_unlocked_at'  => 'datetime',
        'suspended_at'       => 'datetime',
        'requires_approval'  => 'boolean',
        'subscription_limit' => 'decimal:2',
        'used_limit'         => 'decimal:2',
        'treaty_limit'       => 'decimal:2',
        'plein'              => 'decimal:2',
        'escalade_enabled'   => 'boolean',
        'escalade_threshold_pct' => 'decimal:2',
        'premium_rate'       => 'decimal:5',
        'deductible'         => 'decimal:2',
        'rate_ro'            => 'decimal:4',
        'rate_rg'            => 'decimal:4',
        'accessories_amount' => 'decimal:2',
        'rate_tax'           => 'decimal:4',
        'clauses'            => 'array',
        'exclusions'         => 'array',
        'covered_countries'  => 'array',
        'conditioning_types' => 'array',
        'certificates_count' => 'integer',
        'certificates_limit' => 'integer',
        'notice_period_days' => 'integer',
        // US-051 — Chiffrement données PII (non-queryables)
        'insured_address'    => 'encrypted',
        'insured_phone'      => 'encrypted',
        'subscriber_address' => 'encrypted',
        'subscriber_phone'   => 'encrypted',
    ];

    // ── Constantes ────────────────────────────────────────────
    const TYPE_OPEN_POLICY    = 'OPEN_POLICY';
    const TYPE_VOYAGE         = 'VOYAGE';
    const TYPE_ANNUAL_VOYAGE  = 'ANNUAL_VOYAGE';
    // Police tiers chargeur — fonctionnement identique à la police ouverte
    // (pas de verrou "un seul certificat" contrairement au type VOYAGE).
    const TYPE_TIERS_CHARGEUR = 'TIERS_CHARGEUR';

    const STATUS_DRAFT     = 'DRAFT';
    const STATUS_ACTIVE    = 'ACTIVE';
    const STATUS_SUSPENDED = 'SUSPENDED';
    const STATUS_EXPIRED   = 'EXPIRED';
    const STATUS_CANCELLED = 'CANCELLED';

    const COVERAGE_TOUS_RISQUES  = 'TOUS_RISQUES';
    const COVERAGE_FAP_SAUF      = 'FAP_SAUF';
    const COVERAGE_FAP_ABSOLUE   = 'FAP_ABSOLUE';

    // Valeurs de repli si le paramètre général (Setting, /admin/settings)
    // n'existe pas encore — la vraie valeur active est toujours lue via
    // Setting::get(). Plafond NN300 : au-delà, un contrat requiert une
    // validation DTAG (super_admin) avant activation. Plafond Traité :
    // au-delà, alerte informative pour placement en réassurance
    // facultative (non bloquant).
    const NN300_STANDARD_CEILING = 2000000000.00;
    const TREATY_DEFAULT_LIMIT   = 6000000000.00;

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    // Coassureurs participant à ce contrat, chacun avec sa propre part de
    // coassurance PROPRE à ce contrat (contract_coinsurers.share_rate) —
    // un même coassureur peut avoir un taux différent sur un autre contrat.
    public function coinsurers(): BelongsToMany
    {
        return $this->belongsToMany(
            Coinsurer::class,
            'contract_coinsurers',
            'contract_id',
            'coinsurer_id'
        )->withPivot('share_rate');
    }

    // Experts mandatés sur ce contrat (expertise/suivi sinistres) — simple
    // liaison, pas de part financière contrairement aux coassureurs.
    public function experts(): BelongsToMany
    {
        return $this->belongsToMany(Expert::class, 'contract_experts', 'contract_id', 'expert_id');
    }

    // Souscripteur en charge du contrat
    public function subscriber(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subscriber_id');
    }

    public function transportMode(): BelongsTo
    {
        return $this->belongsTo(TransportMode::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class, 'contract_id');
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    // ── Helpers ───────────────────────────────────────────────
    public function isActive(): bool    { return $this->status === self::STATUS_ACTIVE; }
    public function isDraft(): bool     { return $this->status === self::STATUS_DRAFT; }
    public function isExpired(): bool   { return $this->expiry_date->isPast(); }

    public function canIssue(): bool
    {
        $ceiling = $this->effectiveCeiling();

        return $this->isActive()
            && ! $this->isExpired()
            && ($this->certificates_limit === null || $this->certificates_count < $this->certificates_limit)
            && ($ceiling === null || (float) $this->used_limit < $ceiling);
    }

    // Une fois qu'un contrat ayant dépassé le plafond NN300 est approuvé
    // par le Groupe (DTAG, cf. InsuranceContractController::approve()),
    // toutes les valeurs de certificats ultérieurs situées entre le
    // plafond NN300 et le plafond Traité sont automatiquement autorisées —
    // le plafond effectivement opposable au contrat devient le plafond
    // Traité au lieu du plafond NN300.
    public function isNn300Unlocked(): bool
    {
        return $this->nn300_unlocked_at !== null;
    }

    public function effectiveCeiling(): ?float
    {
        if ($this->isNn300Unlocked() && $this->treaty_limit !== null) {
            return (float) $this->treaty_limit;
        }

        return $this->subscription_limit !== null ? (float) $this->subscription_limit : null;
    }

    // Garde-fou minimal pour l'émission de certificats : ne vérifie que le
    // statut du contrat, PAS les plafonds cumulés (ceux-ci déclenchent
    // désormais une escalade NN300 au lieu d'un blocage — cf. canIssue()
    // qui reste utilisé tel quel pour l'affichage du badge de statut).
    public function isActiveAndValid(): bool
    {
        return $this->isActive() && ! $this->isExpired();
    }

    // Le certificat en cours de soumission ferait-il dépasser le plafond
    // effectivement opposable au contrat (NN300, ou Traité si le contrat a
    // été débloqué — cf. effectiveCeiling()) une fois sa valeur ajoutée ?
    public function exceedsSubscriptionLimit(float $additionalValue = 0): bool
    {
        $ceiling = $this->effectiveCeiling();
        if ($ceiling === null) return false;
        return ((float) $this->used_limit + $additionalValue) > $ceiling;
    }

    public function reachedCertificatesLimit(): bool
    {
        if ($this->certificates_limit === null) return false;
        return $this->certificates_count >= $this->certificates_limit;
    }

    // Le Plein d'Assurance de ce contrat (valeur maximum assurée par
    // voyage et par moyen de transport) dépasse-t-il le plafond NN300
    // (paramètre général de l'application, cf. Setting) ? Détermine si
    // une validation DTAG est requise avant activation.
    public function exceedsNn300StandardCeiling(): bool
    {
        $nn300Ceiling = (float) Setting::get(Setting::KEY_NN300_CEILING, self::NN300_STANDARD_CEILING);

        return (float) $this->plein > $nn300Ceiling;
    }

    // Le certificat en cours de soumission ferait-il dépasser le Plafond
    // Traité cumulé (au-delà : alerte de placement en réassurance
    // facultative, non bloquant — cf. CertificateController::submit()).
    public function exceedsTreatyLimit(float $additionalValue = 0): bool
    {
        if ($this->treaty_limit === null) return false;
        return ((float) $this->used_limit + $additionalValue) > (float) $this->treaty_limit;
    }

    public function remainingLimit(): ?float
    {
        $ceiling = $this->effectiveCeiling();
        if ($ceiling === null) return null;
        return max(0, $ceiling - (float) $this->used_limit);
    }

    public function usagePercent(): float
    {
        $ceiling = $this->effectiveCeiling();
        if (! $ceiling) return 0;
        return min(100, round(((float) $this->used_limit / $ceiling) * 100, 1));
    }

    // Le "plein" est le plafond assurable pour UN certificat (distinct du
    // plafond NN300 cumulé ci-dessus). Null = pas de plein défini.
    public function exceedsPlein(float $insuredValue): bool
    {
        if ($this->plein === null || (float) $this->plein <= 0) return false;
        return $insuredValue > (float) $this->plein;
    }

    /**
     * Génère le prochain numéro de contrat
     * ex: CI-OP-2024-000123
     */
    public static function generateContractNumber(string $tenantCode, string $type): string
    {
        $typeCode = match($type) {
            'OPEN_POLICY'   => 'OP',
            'ANNUAL_VOYAGE' => 'AV',
            default         => 'VG',
        };
        $year  = now()->format('Y');
        $count = static::whereYear('created_at', $year)->count() + 1;
        return strtoupper($tenantCode) . '-' . $typeCode . '-' . $year . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);
    }
}