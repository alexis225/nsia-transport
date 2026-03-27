<?php

namespace App\Notifications;

use App\Models\Certificate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CertificateIssued extends Notification implements ShouldQueue
{
    use Queueable;
 
    public function __construct(public Certificate $certificate) {}
 
    public function via(object $notifiable): array { return ['database', 'mail']; }
 
    public function toArray(object $notifiable): array
    {
        return [
            'type'               => 'certificate.issued',
            'icon'               => 'check-circle',
            'color'              => 'success',
            'url'                => route('admin.certificates.show', $this->certificate),
            'certificate_id'     => $this->certificate->id,
            'certificate_number' => $this->certificate->certificate_number,
            'insured_name'       => $this->certificate->insured_name,
            'reason'             => null,
            'contract_number'    => $this->certificate->policy_number,
            'days_left'          => null,
            'usage_percent'      => null,
        ];
    }
 
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->view('notifications.email', [
                'greeting'    => "Bonjour {$notifiable->first_name},",
                'introLines'  => [
                    "Votre certificat a été émis avec succès.",
                    "**N° :** {$this->certificate->certificate_number}",
                    "**Assuré :** {$this->certificate->insured_name}",
                ],
                'actionText'  => 'Télécharger le certificat',
                'actionUrl'   => route('admin.certificates.show', $this->certificate),
                'outroLines'  => [],
                'salutation'  => 'NSIA Transport',
                'subject'     => "Certificat {$this->certificate->certificate_number} émis",
            ]);
    }
}