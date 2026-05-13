<?php

namespace App\Services;

use App\Models\User;

/**
 * ============================================================
 * NotificationHelper — Helper notifications in-app
 * ============================================================
 * Évite le conflit de namespace entre :
 *   App\Models\Notification       (modèle custom)
 *   Illuminate\Notifications\Notification (Laravel base)
 *
 * À utiliser dans TOUS les services à la place de
 * Notification::notify() ou Notification::notifyMany().
 *
 * Usage :
 *   NotificationHelper::send($user, 'type', 'titre', 'corps', [...]);
 *   NotificationHelper::sendToMany($users, 'type', 'titre', 'corps', [...]);
 * ============================================================
 */
class NotificationHelper
{
    public static function send(
        User   $user,
        string $type,
        string $title,
        string $body,
        array  $data = []
    ): void {
        \App\Models\Notification::send($user, $type, $title, $body, $data);
    }

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
}