<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GuceCertificate extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'imported_by',
        'guce_reference',
        'certificate_number',
        'policy_number',
        'fdi_reference',
        'insured_name',
        'insured_address',
        'cargo_description',
        'weight',
        'marks',
        'vessel',
        'origin',
        'destination',
        'transit_date',
        'insured_value',
        'currency',
        'total_premium',
        'file_path',
        'file_original_name',
        'file_mime_type',
        'notes',
    ];

    protected $casts = [
        'transit_date' => 'date',
        'insured_value' => 'decimal:2',
        'total_premium' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function importedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by', 'id');
    }

    public function isWord(): bool
    {
        return in_array($this->file_mime_type, [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    public function isPdf(): bool
    {
        return $this->file_mime_type === 'application/pdf';
    }
}
