<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateHistory extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'certificate_id',
        'action',
        'old_data',
        'new_data',
        'changed_fields',
        'performed_by',
        'performed_at',
        'ip_address',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'old_data'       => 'array',
            'new_data'       => 'array',
            'changed_fields' => 'array',
            'performed_at'   => 'datetime',
        ];
    }

    // ── Constantes actions ───────────────────────────────────
    const ACTION_CREATED       = 'CREATED';
    const ACTION_UPDATED       = 'UPDATED';
    const ACTION_SUBMITTED     = 'SUBMITTED';
    const ACTION_APPROVED      = 'APPROVED';
    const ACTION_ISSUED        = 'ISSUED';
    const ACTION_CANCELLED     = 'CANCELLED';
    const ACTION_DUPLICATED    = 'DUPLICATED';
    const ACTION_PDF_GENERATED = 'PDF_GENERATED';

    // ── Relations ────────────────────────────────────────────
    public function performedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}