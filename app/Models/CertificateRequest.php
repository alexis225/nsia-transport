<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CertificateRequest extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'broker_id',
        'created_by',
        'country_code',
        'insured_name',
        'voyage_from',
        'voyage_to',
        'voyage_date',
        'transport_type',
        'cargo_description',
        'estimated_value',
        'currency_code',
        'notes',
        'status',
        'assigned_to',
        'assigned_at',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
        'certificate_id',
        'guce_certificate_id',
    ];

    protected function casts(): array
    {
        return [
            'voyage_date'     => 'date',
            'estimated_value' => 'decimal:2',
            'assigned_at'     => 'datetime',
            'reviewed_at'     => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    const STATUS_PENDING    = 'PENDING';
    const STATUS_IN_REVIEW  = 'IN_REVIEW';
    const STATUS_APPROVED   = 'APPROVED';
    const STATUS_REJECTED   = 'REJECTED';

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function certificate(): BelongsTo
    {
        return $this->belongsTo(Certificate::class);
    }

    public function guceCertificate(): BelongsTo
    {
        return $this->belongsTo(GuceCertificate::class);
    }

    public function isFulfilled(): bool
    {
        return $this->certificate_id !== null || $this->guce_certificate_id !== null;
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CertificateRequestDocument::class);
    }
}
