<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ============================================================
 * NotificationPreference Model — US-037
 * ============================================================
 * Table : notification_preferences
 *
 * Colonnes :
 *   id, user_id, event_type, in_app, email,
 *   created_at, updated_at
 * ============================================================
 */
class NotificationPreference extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'event_type',
        'in_app',
        'email',
    ];

    protected $casts = [
        'in_app' => 'boolean',
        'email'  => 'boolean',
    ];

    // ── Tous les types d'événements configurables ─────────────
    const EVENT_TYPES = [
        // Certificats
        'CertificateSubmitted'   => 'Certificat soumis',
        'CertificateIssued'      => 'Certificat émis',
        'CertificateRejected'    => 'Certificat rejeté',
        'CertificateCancelled'   => 'Certificat annulé',
        // Contrats
        'ContractExpiring'       => 'Contrat expirant bientôt',
        'ContractLimitReached'   => 'Plafond NN300 atteint',
        // Escalades
        'EscaladeNN300'          => 'Escalade NN300',
        'EscaladeDecision'       => 'Décision escalade',
        'EscaladeTimeout'        => 'Délai escalade dépassé',
        // Délégations
        'DelegationGranted'      => 'Délégation reçue',
        'DelegationCreated'      => 'Délégation créée',
        'DelegationRevoked'      => 'Délégation révoquée',
        'DelegationExpired'      => 'Délégation expirée',
        // Système
        'SystemAlert'            => 'Alertes système',
    ];

    // ── Relations ─────────────────────────────────────────────
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Helpers ───────────────────────────────────────────────

    /**
     * Récupère les préférences d'un user avec valeurs par défaut (tout activé)
     */
    public static function forUser(User $user): array
    {
        $saved = static::where('user_id', $user->id)
            ->get()
            ->keyBy('event_type')
            ->toArray();

        $result = [];
        foreach (static::EVENT_TYPES as $type => $label) {
            $result[$type] = [
                'label'  => $label,
                'in_app' => isset($saved[$type]) ? (bool) $saved[$type]['in_app'] : true,
                'email'  => isset($saved[$type]) ? (bool) $saved[$type]['email']  : true,
            ];
        }

        return $result;
    }

    /**
     * Vérifie si un user accepte les notifications
     * pour un type et un canal donnés.
     * Utilisé dans NotificationHelper::send() avant d'envoyer.
     */
    public static function accepts(User $user, string $eventType, string $channel): bool
    {
        $pref = static::where('user_id', $user->id)
            ->where('event_type', $eventType)
            ->first();

        // Par défaut : tout activé si pas de préférence sauvegardée
        if (! $pref) return true;

        return match ($channel) {
            'in_app' => (bool) $pref->in_app,
            'email'  => (bool) $pref->email,
            default  => true,
        };
    }

    /**
     * Désactiver tous les canaux d'un user (désabonnement total)
     */
    public static function unsubscribeAll(User $user): void
    {
        foreach (array_keys(static::EVENT_TYPES) as $type) {
            static::updateOrCreate(
                ['user_id' => $user->id, 'event_type' => $type],
                ['in_app' => false, 'email' => false]
            );
        }
    }
}