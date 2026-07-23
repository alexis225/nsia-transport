<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory, HasUuids;

    protected $keyType   = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'code', 'country_code','currency_code','is_active',
        'settings', 'subscription_limit_config', 'modules',
        'logo_path',
    ];

    protected $casts = [
        'is_active'                 => 'boolean',
        'settings'                  => 'array',
        'subscription_limit_config' => 'array',
        'modules'                   => 'array',
    ];

    // ── Modules métier activables/désactivables par filiale ────
    // Une clé absente du JSON `modules` est considérée activée
    // (permet d'ajouter de nouveaux modules sans migration de données).
    const MODULES = [
        'brokers'           => 'Courtiers & partenaires',
        'coinsurers'        => 'Coassureurs',
        'experts'           => 'Experts',
        'contracts'         => 'Contrats',
        'certificates'      => 'Certificats',
        'guce_certificates' => 'Certificats GUCE',
        'commissions'       => 'Commissions',
        'taxes'             => 'Gestion des taxes',
        'reports'           => 'Rapports',
        'approvals'         => 'Escalades NN300',
        'delegations'       => 'Délégations',
        'certificate_templates' => 'Modèles de certificats',
        'audit_logs'        => 'Audit Logs',
        'notifications'     => 'Notifications',
        'exports'           => 'Mes exports',
        'kpi'               => 'KPI Filiale',
    ];

    public function hasModule(string $key): bool
    {
        return ($this->modules[$key] ?? true) !== false;
    }

    protected static function newFactory(): TenantFactory
    {
        return TenantFactory::new();
    }


    public function users(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class);
    }

    // app/Models/Tenant.php
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}