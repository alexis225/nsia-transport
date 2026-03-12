<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Certificate extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'contract_id',
        'broker_id',
        'template_id',
        'certificate_number',
        'sequence_number',
        'type',
        'parent_id',
        'shipper_name',
        'shipper_address',
        'shipper_country',
        'consignee_name',
        'consignee_address',
        'consignee_country',
        'transport_mode_id',
        'vessel_name',
        'voyage_number',
        'bill_of_lading',
        'flight_number',
        'container_number',
        'loading_port',
        'discharge_port',
        'place_of_delivery',
        'departure_date',
        'arrival_date',
        'merchandise_description',
        'merchandise_category_id',
        'packing_type',
        'quantity',
        'quantity_unit',
        'gross_weight',
        'weight_unit',
        'marks_and_numbers',
        'currency_code',
        'insured_value',
        'premium_amount',
        'incoterm_code',
        'invoice_number',
        'invoice_amount',
        'invoice_currency',
        'coverage_type',
        'clauses',
        'special_conditions',
        'qr_code_data',
        'qr_code_path',
        'digital_signature',
        'seal_path',
        'pdf_path',
        'pdf_generated_at',
        'state_platform_ref',
        'state_platform_issued_at',
        'status',
        'issued_at',
        'cancelled_at',
        'cancellation_reason',
        'expiry_date',
        'notes',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected $hidden = [
        'digital_signature',
    ];

    protected function casts(): array
    {
        return [
            'departure_date'           => 'date',
            'arrival_date'             => 'date',
            'expiry_date'              => 'date',
            'insured_value'            => 'decimal:2',
            'premium_amount'           => 'decimal:2',
            'invoice_amount'           => 'decimal:2',
            'quantity'                 => 'decimal:3',
            'gross_weight'             => 'decimal:3',
            'clauses'                  => 'array',
            'metadata'                 => 'array',
            'pdf_generated_at'         => 'datetime',
            'state_platform_issued_at' => 'datetime',
            'issued_at'                => 'datetime',
            'cancelled_at'             => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    const TYPE_ORIGINAL     = 'ORIGINAL';
    const TYPE_DUPLICATE    = 'DUPLICATE';
    const TYPE_ENDORSEMENT  = 'ENDORSEMENT';
    const TYPE_CANCELLATION = 'CANCELLATION';

    const STATUS_DRAFT            = 'DRAFT';
    const STATUS_SUBMITTED        = 'SUBMITTED';
    const STATUS_PENDING_APPROVAL = 'PENDING_APPROVAL';
    const STATUS_APPROVED         = 'APPROVED';
    const STATUS_ISSUED           = 'ISSUED';
    const STATUS_CANCELLED        = 'CANCELLED';
    const STATUS_EXPIRED          = 'EXPIRED';

    // ── Helpers métier ───────────────────────────────────────
    public function isIssued(): bool
    {
        return $this->status === self::STATUS_ISSUED;
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, [
            self::STATUS_ISSUED,
            self::STATUS_APPROVED,
        ]);
    }

    public function hasPdf(): bool
    {
        return ! is_null($this->pdf_path);
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeIssued($query)
    {
        return $query->where('status', self::STATUS_ISSUED);
    }

    public function scopeOfTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->whereRaw(
            "to_tsvector('french',
                coalesce(certificate_number,'') || ' ' ||
                coalesce(shipper_name,'') || ' ' ||
                coalesce(consignee_name,'') || ' ' ||
                coalesce(merchandise_description,'') || ' ' ||
                coalesce(bill_of_lading,'') || ' ' ||
                coalesce(invoice_number,'')
            ) @@ plainto_tsquery('french', ?)",
            [$term]
        );
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(InsuranceContract::class, 'contract_id');
    }

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class, 'template_id');
    }

    public function transportMode(): BelongsTo
    {
        return $this->belongsTo(TransportMode::class);
    }

    public function merchandiseCategory(): BelongsTo
    {
        return $this->belongsTo(MerchandiseCategory::class, 'merchandise_category_id');
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_code', 'code');
    }

    public function incoterm(): BelongsTo
    {
        return $this->belongsTo(Incoterm::class, 'incoterm_code', 'code');
    }

    public function shipperCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'shipper_country', 'code');
    }

    public function consigneeCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'consignee_country', 'code');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Certificate::class, 'parent_id');
    }

    public function duplicates(): HasMany
    {
        return $this->hasMany(Certificate::class, 'parent_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(CertificateHistory::class, 'certificate_id');
    }

    public function commissionTransaction(): HasMany
    {
        return $this->hasMany(CommissionTransaction::class, 'certificate_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}