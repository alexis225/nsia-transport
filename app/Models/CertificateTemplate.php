<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * ============================================================
 * CertificateTemplate — US-013
 * ============================================================
 */
class CertificateTemplate extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'name', 'code', 'type',
        'company_name', 'company_address', 'company_phone',
        'company_email', 'company_website', 'company_rccm',
        'company_capital', 'logo_path',
        'legal_framework', 'police_prefix', 'currency_code', 'city',
        'is_bilingual', 'has_container_options', 'has_flight_number',
        'has_vessel_name', 'has_currency_rate',
        'prime_breakdown_lines',
        'footer_text', 'claims_text', 'conditions_text',
        'number_prefix', 'number_padding', 'last_number',
        'is_active', 'created_by',
    ];

    protected $casts = [
        'is_bilingual'           => 'boolean',
        'has_container_options'  => 'boolean',
        'has_flight_number'      => 'boolean',
        'has_vessel_name'        => 'boolean',
        'has_currency_rate'      => 'boolean',
        'is_active'              => 'boolean',
        'prime_breakdown_lines'  => 'array',
        'number_padding'         => 'integer',
        'last_number'            => 'integer',
    ];

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // ── Helpers ───────────────────────────────────────────────
    /**
     * Génère le prochain numéro de certificat formaté
     * ex: N°041260
     */
    public function generateNextNumber(): string
    {
        $this->increment('last_number');
        $num = str_pad($this->last_number, $this->number_padding, '0', STR_PAD_LEFT);
        return ($this->number_prefix ?? 'N°') . $num;
    }

    /**
     * Retourne le logo via storage
     */
    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path
            ? asset('storage/' . $this->logo_path)
            : null;
    }
}