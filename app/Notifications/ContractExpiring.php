<?php

namespace App\Notifications;

use App\Models\InsuranceContract;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContractExpiring extends Notification implements ShouldQueue
{
    use Queueable;
 
    public function __construct(
        public InsuranceContract $contract,
        public int $daysLeft
    ) {}
 
    public function via(object $notifiable): array { return ['database', 'mail']; }
 
    public function toArray(object $notifiable): array
    {
        return [
            'type'            => 'contract.expiring',
            'icon'            => 'alert-triangle',
            'color'           => $this->daysLeft <= 7 ? 'danger' : 'warning',
            'url'             => route('admin.contracts.show', $this->contract),
            'certificate_id'  => null,
            'certificate_number' => null,
            'insured_name'    => $this->contract->insured_name,
            'reason'          => null,
            'contract_number' => $this->contract->contract_number,
            'days_left'       => $this->daysLeft,
            'usage_percent'   => null,
        ];
    }
 
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->view('notifications.email', [
                'greeting'    => "Bonjour {$notifiable->first_name},",
                'introLines'  => [
                    "Le contrat suivant expire dans **{$this->daysLeft} jours**.",
                    "**N° :** {$this->contract->contract_number}",
                    "**Assuré :** {$this->contract->insured_name}",
                    "**Expiration :** {$this->contract->expiry_date->format('d/m/Y')}",
                ],
                'actionText'  => 'Voir le contrat',
                'actionUrl'   => route('admin.contracts.show', $this->contract),
                'outroLines'  => [],
                'salutation'  => 'NSIA Transport',
                'subject'     => "Contrat {$this->contract->contract_number} expire dans {$this->daysLeft} jours",
            ]);
    }
}
