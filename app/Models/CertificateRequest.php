<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class CertificateRequest extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'broker_id',
        'created_by',
        'reference',
        'submitted_at',
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
        'info_requested_at',
        'info_request_notes',
        'completed_at',
        'completion_notes',
        'closed_at',
        'certificate_id',
        'guce_certificate_id',
    ];

    protected function casts(): array
    {
        return [
            'voyage_date' => 'date',
            'estimated_value' => 'decimal:2',
            'submitted_at' => 'datetime',
            'assigned_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'info_requested_at' => 'datetime',
            'completed_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    // ── Constantes ───────────────────────────────────────────
    // Workflow complet (Module 1 — rapport DTAG 14/08/2026) :
    // DRAFT → PENDING → IN_REVIEW → INFO_REQUESTED → COMPLETED →
    // APPROVED → FULFILLED → CLOSED · REJECTED (terminal, depuis
    // PENDING/IN_REVIEW/INFO_REQUESTED/COMPLETED).
    const STATUS_DRAFT = 'DRAFT';

    const STATUS_PENDING = 'PENDING';

    const STATUS_IN_REVIEW = 'IN_REVIEW';

    const STATUS_INFO_REQUESTED = 'INFO_REQUESTED';

    const STATUS_COMPLETED = 'COMPLETED';

    const STATUS_APPROVED = 'APPROVED';

    const STATUS_FULFILLED = 'FULFILLED';

    const STATUS_CLOSED = 'CLOSED';

    const STATUS_REJECTED = 'REJECTED';

    // ── Référence unique (rapport 1.3) — attribuée dès la création,
    // y compris pour un brouillon, afin que toute demande en base
    // dispose d'une référence.
    public static function nextReference(): string
    {
        $seq = DB::selectOne("SELECT nextval('certificate_request_reference_seq') AS val")->val;

        return 'DEM-'.now()->format('Y').'-'.str_pad((string) $seq, 6, '0', STR_PAD_LEFT);
    }

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->reference)) {
                $model->reference = self::nextReference();
            }
        });
    }

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
