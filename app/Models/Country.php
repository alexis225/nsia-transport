<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    public $timestamps  = false;
    public $incrementing = false;
    protected $keyType  = 'string';
    protected $primaryKey = 'code';

    protected $fillable = ['code', 'name_fr', 'name_en', 'region'];
}