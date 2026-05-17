<?php

namespace App\Observers;
 
use App\Models\Certificate;
use App\Services\CommissionService;
 
class CertificateObserver
{
    public function __construct(private CommissionService $service) {}
 
    /**
     * Déclenché quand status passe à ISSUED
     */
    public function updated(Certificate $certificate): void
    {
        if (
            $certificate->isDirty('status') &&
            $certificate->status === Certificate::STATUS_ISSUED
        ) {
            $this->service->calculate($certificate);
        }
 
        // Annuler la commission si certificat annulé
        if (
            $certificate->isDirty('status') &&
            $certificate->status === Certificate::STATUS_CANCELLED
        ) {
            $this->service->cancel($certificate);
        }
    }
}
 
