<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * ============================================================
 * CertificatePrintTemplate
 * ============================================================
 * Surcharge des coordonnées (mm) d'un modèle de carnet — voir
 * resources/js/pages/admin/certificates/print-templates/registry.ts
 * pour la liste des template_id valides.
 * ============================================================
 */
class CertificatePrintTemplate extends Model
{
    use HasUuids;

    protected $fillable = [
        'template_id', 'positions', 'base_pdf_path', 'updated_by',
    ];

    protected $casts = [
        'positions' => 'array',
    ];

    public function getBasePdfUrlAttribute(): ?string
    {
        return $this->base_pdf_path ? asset('storage/'.$this->base_pdf_path) : null;
    }
}
