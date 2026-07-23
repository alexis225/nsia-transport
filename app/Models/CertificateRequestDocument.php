<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateRequestDocument extends Model
{
    use HasUuids;

    protected $fillable = [
        'certificate_request_id',
        'file_path',
        'file_original_name',
        'file_mime_type',
        'file_size',
        'document_type',
        'uploaded_by',
    ];

    // ── Types de pièces jointes ────────────────────────────────
    const TYPE_BL                  = 'BL';
    const TYPE_INVOICE             = 'FACTURE';
    const TYPE_FDI                 = 'FDI';
    const TYPE_TRANSPORT_DOCUMENT  = 'DOCUMENTS_TRANSPORT';
    const TYPE_OTHER               = 'AUTRE';

    const TYPES = [
        self::TYPE_BL,
        self::TYPE_INVOICE,
        self::TYPE_FDI,
        self::TYPE_TRANSPORT_DOCUMENT,
        self::TYPE_OTHER,
    ];

    const TYPE_LABELS = [
        self::TYPE_BL                 => 'BL (Bill of Lading)',
        self::TYPE_INVOICE            => 'Facture',
        self::TYPE_FDI                => 'FDI',
        self::TYPE_TRANSPORT_DOCUMENT => 'Document de transport',
        self::TYPE_OTHER              => 'Autre justificatif',
    ];

    public function certificateRequest(): BelongsTo
    {
        return $this->belongsTo(CertificateRequest::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
