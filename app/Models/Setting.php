<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Paramètres généraux de l'application (clé/valeur, un seul jeu de
 * valeurs pour toute l'application — pas par filiale). Voir
 * database/migrations/..._create_app_settings_table.php.
 */
class Setting extends Model
{
    protected $table = 'app_settings';
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'value', 'label'];

    const KEY_NN300_CEILING = 'nn300_ceiling';
    const KEY_TREATY_LIMIT  = 'treaty_limit';

    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::rememberForever("app_setting.{$key}", fn () => static::find($key)?->value ?? $default);
    }

    public static function set(string $key, string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("app_setting.{$key}");
    }
}
