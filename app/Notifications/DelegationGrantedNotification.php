<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DelegationGrantedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public UserRoleGrant $grant,public User $grantor,public string $roleLabel){}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->view('notifications.email', [
                'greeting'   => "Bonjour {$notifiable->first_name},",
                'introLines' => [
                    "{$this->grantor->first_name} {$this->grantor->last_name} vous a délégué temporairement le rôle **{$this->roleLabel}**.",
                    "**Expire le :** " . $this->grant->expires_at?->format('d/m/Y à H:i'),
                    $this->grant->reason ? "**Motif :** {$this->grant->reason}" : '',
                    "Pendant la durée de la délégation, vous disposez de toutes les permissions associées au rôle {$this->roleLabel}.",
                ],
                'actionText'  => 'Voir mes délégations',
                'actionUrl'   => route('admin.delegations.index'),
                'outroLines'  => ['La délégation expirera automatiquement à la date indiquée.'],
                'salutation'  => 'NSIA Transport',
                'subject'     => "Délégation de rôle reçue : {$this->roleLabel} — NSIA Transport",
        ]);

    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
