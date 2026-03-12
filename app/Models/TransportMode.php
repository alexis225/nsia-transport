<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransportMode extends Model
{
    public $timestamps = false;

    protected $fillable = ['code', 'name_fr', 'name_en', 'icon'];

    // ── Constantes ───────────────────────────────────────────
    const SEA        = 'SEA';
    const AIR        = 'AIR';
    const ROAD       = 'ROAD';
    const RAIL       = 'RAIL';
    const MULTIMODAL = 'MULTIMODAL';
    const POSTAL     = 'POSTAL';

    // ── Relations ────────────────────────────────────────────
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }
}