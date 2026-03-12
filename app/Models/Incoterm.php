<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incoterm extends Model
{
    public $timestamps   = false;
    public $incrementing = false;
    protected $keyType   = 'string';
    protected $primaryKey = 'code';

    protected $fillable = ['code', 'name', 'description', 'compatible_modes'];

    protected function casts(): array
    {
        return ['compatible_modes' => 'array'];
    }
}