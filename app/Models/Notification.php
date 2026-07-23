<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ============================================================
 * Notification Model — US-025
 * ============================================================
 * Table : notifications (driver Eloquent Laravel)
 *
 * Colonnes :
 *   id, type, notifiable_type, notifiable_id,
 *   data (JSON), read_at, tenant_id, channel,
 *   created_at, updated_at
 *
 * NB : La méthode statique s'appelle send() et non notify()
 * pour éviter le conflit avec le trait Notifiable de Laravel.
 * ============================================================
 */
class Notification extends Model
{
    use HasUuids;

    // ── Canaux ────────────────────────────────────────────────
    const CHANNEL_IN_APP  = 'IN_APP';
    const CHANNEL_EMAIL   = 'EMAIL';
    const CHANNEL_SMS     = 'SMS';
    const CHANNEL_WEBHOOK = 'WEBHOOK';

    // ── Types ─────────────────────────────────────────────────
    const TYPE_CERT_SUBMITTED    = 'CertificateSubmitted';
    const TYPE_CERT_ISSUED       = 'CertificateIssued';
    const TYPE_CERT_REJECTED     = 'CertificateRejected';
    const TYPE_CERT_CANCELLED    = 'CertificateCancelled';
    const TYPE_CONTRACT_EXPIRING = 'ContractExpiring';
    const TYPE_CONTRACT_LIMIT    = 'ContractLimitReached';

    // Demandes partenaires (CertificateRequest)
    const TYPE_CERT_REQUEST_CREATED   = 'CertificateRequestCreated';
    const TYPE_CERT_REQUEST_IN_REVIEW = 'CertificateRequestInReview';
    const TYPE_CERT_REQUEST_REJECTED  = 'CertificateRequestRejected';

    protected $fillable = [
        'type',
        'notifiable_type',
        'notifiable_id',
        'data',
        'read_at',
        'tenant_id',
        'channel',
    ];

    protected $casts = [
        'data'    => 'array',
        'read_at' => 'datetime',
    ];

    // ── Relations ─────────────────────────────────────────────
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // ── Scopes ────────────────────────────────────────────────
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeForUser($query, string $userId)
    {
        return $query->where('notifiable_type', 'App\\Models\\User')
                     ->where('notifiable_id', $userId);
    }

    public function scopeInApp($query)
    {
        return $query->where('channel', self::CHANNEL_IN_APP);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // ── Helpers ───────────────────────────────────────────────
    public function isRead(): bool
    {
        return ! is_null($this->read_at);
    }

    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Crée une notification in-app pour un utilisateur.
     * NB : nommé "send" (pas "notify") pour éviter le conflit
     * avec le trait Notifiable de Laravel.
     */
    public static function send(
        User   $user,
        string $type,
        string $title,
        string $body,
        array  $data = [],
        string $channel = self::CHANNEL_IN_APP
    ): self {
        return static::create([
            'type'            => $type,
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $user->id,
            'tenant_id'       => $user->tenant_id,
            'channel'         => $channel,
            'data'            => array_merge($data, [
                'title' => $title,
                'body'  => $body,
            ]),
        ]);
    }

    /**
     * Notifie plusieurs utilisateurs d'un coup
     */
    public static function sendToMany(
        iterable $users,
        string   $type,
        string   $title,
        string   $body,
        array    $data = []
    ): void {
        foreach ($users as $user) {
            static::send($user, $type, $title, $body, $data);
        }
    }

    /**
     * Anti-doublon : vérifie si déjà notifié aujourd'hui
     */
    public static function alreadySentToday(User $user, string $type, string $entityId): bool
    {
        return static::forUser($user->id)
            ->ofType($type)
            ->whereDate('created_at', today())
            ->whereJsonContains('data->entity_id', $entityId)
            ->exists();
    }
}