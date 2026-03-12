<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateSequence extends Model
{
    // Clé primaire composite — pas de HasUuids
    public $incrementing = false;
    public $timestamps   = false;

    protected $primaryKey = null; // composite : (tenant_id, year, prefix)

    protected $fillable = [
        'tenant_id',
        'year',
        'prefix',
        'last_value',
    ];

    protected function casts(): array
    {
        return [
            'year'       => 'integer',
            'last_value' => 'integer',
            'updated_at' => 'datetime',
        ];
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}