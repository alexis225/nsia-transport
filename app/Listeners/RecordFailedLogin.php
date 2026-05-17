<?php

namespace App\Listeners;

use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Support\Facades\Cache;

/**
 * US-050 — Enregistrement des tentatives de connexion échouées.
 * Incrémente failed_login_attempts et verrouille le compte après 5 échecs.
 * Collecte aussi les IPs suspectes pour alerter les admins.
 */
class RecordFailedLogin
{
    public function handle(Failed $event): void
    {
        $ip = request()->ip();

        /** @var User|null $user */
        $user = $event->user;

        if ($user instanceof User) {
            $attempts = ($user->failed_login_attempts ?? 0) + 1;

            $updates = [
                'failed_login_attempts' => $attempts,
                'last_login_ip'         => $ip,
            ];

            // Verrouiller après 5 tentatives (30 min)
            if ($attempts >= 5) {
                $updates['locked_until'] = now()->addMinutes(30);
            }

            $user->update($updates);
        }

        // Compteur brut par IP en cache (pour détecter les attaques sans compte valide)
        $cacheKey = "failed_login_ip_{$ip}";
        $ipCount  = (int) Cache::get($cacheKey, 0) + 1;
        Cache::put($cacheKey, $ipCount, 3600); // 1 heure

        // Invalider le cache de blacklist pour cette IP si elle est maintenant bloquée
        Cache::forget("ip_blocked_{$ip}");
    }
}
