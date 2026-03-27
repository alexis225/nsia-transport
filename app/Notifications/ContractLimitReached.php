<?php

namespace App\Notifications;

use App\Models\InsuranceContract;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContractLimitReached extends Notification implements ShouldQueue
{
    use Queueable;
 
    public function __construct(
        public InsuranceContract $contract,
        public float $usagePercent
    ) {}
 
    public function via(object $notifiable): array { return ['database', 'mail']; }
 
    public function toArray(object $notifiable): array
    {
        return [
            'type'               => 'contract.limit_reached',
            'icon'               => 'trending-up',
            'color'              => 'danger',
            'url'                => route('admin.contracts.show', $this->contract),
            'certificate_id'     => null,
            'certificate_number' => null,
            'insured_name'       => $this->contract->insured_name,
            'reason'             => null,
            'contract_number'    => $this->contract->contract_number,
            'days_left'          => null,
            'usage_percent'      => $this->usagePercent,
        ];
    }
 
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->view('notifications.email', [
                'greeting'    => "Bonjour {$notifiable->first_name},",
                'introLines'  => [
                    "Le plafond NN300 est atteint à **{$this->usagePercent}%**.",
                    "**Contrat :** {$this->contract->contract_number}",
                    "**Assuré :** {$this->contract->insured_name}",
                    "**Utilisé :** " . number_format((float)$this->contract->used_limit, 0, ',', ' ')
                        . " / " . number_format((float)$this->contract->subscription_limit, 0, ',', ' ')
                        . " {$this->contract->currency_code}",
                ],
                'actionText'  => 'Voir le contrat',
                'actionUrl'   => route('admin.contracts.show', $this->contract),
                'outroLines'  => [],
                'salutation'  => 'NSIA Transport',
                'subject'     => "Alerte plafond NN300 — {$this->contract->contract_number} ({$this->usagePercent}%)",
            ]);
    }
}