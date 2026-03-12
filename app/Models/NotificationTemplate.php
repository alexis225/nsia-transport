<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationTemplate extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'event',
        'channel',
        'subject',
        'body',
        'locale',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // ── Constantes événements ────────────────────────────────
    const EVENT_CERTIFICATE_SUBMITTED  = 'CERTIFICATE_SUBMITTED';
    const EVENT_CERTIFICATE_APPROVED   = 'CERTIFICATE_APPROVED';
    const EVENT_CERTIFICATE_ISSUED     = 'CERTIFICATE_ISSUED';
    const EVENT_CERTIFICATE_CANCELLED  = 'CERTIFICATE_CANCELLED';
    const EVENT_APPROVAL_NEEDED        = 'APPROVAL_NEEDED';
    const EVENT_CONTRACT_EXPIRING      = 'CONTRACT_EXPIRING';
    const EVENT_CONTRACT_LIMIT_REACHED = 'CONTRACT_LIMIT_REACHED';
    const EVENT_COMMISSION_VALIDATED   = 'COMMISSION_VALIDATED';
    const EVENT_REPORT_READY           = 'REPORT_READY';
    const EVENT_USER_CREATED           = 'USER_CREATED';
    const EVENT_USER_BLOCKED           = 'USER_BLOCKED';
    const EVENT_PDF_READY              = 'PDF_READY';

    // ── Constantes canaux ────────────────────────────────────
    const CHANNEL_EMAIL   = 'EMAIL';
    const CHANNEL_SMS     = 'SMS';
    const CHANNEL_IN_APP  = 'IN_APP';
    const CHANNEL_WEBHOOK = 'WEBHOOK';

    // ── Scopes ───────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForEvent($query, string $event, string $channel, string $locale = 'fr')
    {
        return $query->where('event', $event)
                     ->where('channel', $channel)
                     ->where('locale', $locale);
    }

    // ── Relations ────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}