<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * ============================================================
 * Certificate Model — US-016/017/018
 * ============================================================
 * Table : certificates
 * Statuts : DRAFT | SUBMITTED | ISSUED | CANCELLED
 * ============================================================
 */
class Certificate extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'contract_id', 'template_id',
        'certificate_number', 'policy_number',
        'insured_name', 'insured_ref',
        'voyage_date', 'voyage_from', 'voyage_to', 'voyage_via',
        'transport_type', 'vessel_name', 'flight_number', 'voyage_mode',
        'expedition_items',
        'currency_code', 'insured_value', 'insured_value_letters',
        'guarantee_mode', 'prime_breakdown', 'prime_total',
        'exchange_currency', 'exchange_rate',
        'status', 'submitted_at', 'issued_at', 'cancelled_at',
        'cancellation_reason', 'issued_by', 'submitted_by', 'validation_notes',
        'pdf_path', 'pdf_generated_at', 'created_by',
    ];

    protected $casts = [
        'voyage_date'       => 'date',
        'submitted_at'      => 'datetime',
        'issued_at'         => 'datetime',
        'cancelled_at'      => 'datetime',
        'pdf_generated_at'  => 'datetime',
        'expedition_items'  => 'array',
        'prime_breakdown'   => 'array',
        'insured_value'     => 'decimal:2',
        'prime_total'       => 'decimal:2',
        'exchange_rate'     => 'decimal:6',
    ];

    // ── Constantes ────────────────────────────────────────────
    const STATUS_DRAFT     = 'DRAFT';
    const STATUS_SUBMITTED = 'SUBMITTED';
    const STATUS_ISSUED    = 'ISSUED';
    const STATUS_CANCELLED = 'CANCELLED';

    const TRANSPORT_SEA       = 'SEA';
    const TRANSPORT_AIR       = 'AIR';
    const TRANSPORT_ROAD      = 'ROAD';
    const TRANSPORT_RAIL      = 'RAIL';
    const TRANSPORT_MULTIMODAL= 'MULTIMODAL';

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(InsuranceContract::class, 'contract_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class, 'template_id');
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ───────────────────────────────────────────────
    public function scopeIssued($query)    { return $query->where('status', self::STATUS_ISSUED); }
    public function scopePending($query)   { return $query->where('status', self::STATUS_SUBMITTED); }
    public function scopeForTenant($query, string $tenantId) { return $query->where('tenant_id', $tenantId); }

    // ── Helpers ───────────────────────────────────────────────
    public function isDraft(): bool     { return $this->status === self::STATUS_DRAFT; }
    public function isSubmitted(): bool { return $this->status === self::STATUS_SUBMITTED; }
    public function isIssued(): bool    { return $this->status === self::STATUS_ISSUED; }
    public function isCancelled(): bool { return $this->status === self::STATUS_CANCELLED; }
    public function hasPdf(): bool      { return ! empty($this->pdf_path); }

    /**
     * Calcule le total du décompte de prime
     */
    public function computePrimeTotal(): float
    {
        if (empty($this->prime_breakdown)) return 0;
        return collect($this->prime_breakdown)->sum('amount');
    }

    /**
     * Génère le N° certificat depuis le template
     */
    public static function generateNumber(CertificateTemplate $template): string
    {
        $template->increment('last_number');
        $num = str_pad($template->last_number, $template->number_padding, '0', STR_PAD_LEFT);
        return ($template->number_prefix ?? 'N°') . $num;
    }
}