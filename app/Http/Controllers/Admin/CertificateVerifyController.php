<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Services\CertificateQrService;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * CertificateVerifyController — US-021/026
 * ============================================================
 * Page publique de vérification d'authenticité d'un certificat.
 * Accessible sans authentification via le QR code.
 * URL : /verify/{token}
 * ============================================================
 */
class CertificateVerifyController extends Controller
{
    public function __construct(
        private CertificateQrService $qrService
    ) {}

    public function show(string $token): Response
    {
        $certificate = Certificate::where('qr_token', $token)
            ->with([
                'tenant:id,name,code',
                'contract:id,contract_number',
                'issuedBy:id,first_name,last_name',
                'template:id,company_name,logo_path,company_address',
            ])
            ->first();

        if (! $certificate) {
            return Inertia::render('public/verify', [
                'status'      => 'not_found',
                'certificate' => null,
            ]);
        }

        // Enregistrer la vérification
        $this->qrService->recordVerification($certificate);

        // Données publiques limitées (pas de données financières)
        $publicData = [
            'certificate_number' => $certificate->certificate_number,
            'policy_number'      => $certificate->policy_number,
            'insured_name'       => $certificate->insured_name,
            'voyage_date'        => $certificate->voyage_date?->format('d/m/Y'),
            'voyage_from'        => $certificate->voyage_from,
            'voyage_to'          => $certificate->voyage_to,
            'transport_type'     => $certificate->transport_type,
            'status'             => $certificate->status,
            'issued_at'          => $certificate->issued_at?->format('d/m/Y à H:i'),
            'currency_code'      => $certificate->currency_code,
            'tenant'             => [
                'name' => $certificate->tenant?->name,
                'code' => $certificate->tenant?->code,
            ],
            'issuer'             => $certificate->issuedBy
                ? $certificate->issuedBy->first_name . ' ' . $certificate->issuedBy->last_name
                : null,
            'template_company'   => $certificate->template?->company_name,
            'template_logo'      => $certificate->template?->logo_path
                ? asset('storage/' . $certificate->template->logo_path)
                : null,
            'verification_count' => $certificate->verification_count,
        ];

        $isValid = $certificate->status === Certificate::STATUS_ISSUED
            && $certificate->cancelled_at === null;

        return Inertia::render('public/verify', [
            'status'      => $isValid ? 'valid' : ($certificate->status === 'CANCELLED' ? 'cancelled' : 'invalid'),
            'certificate' => $publicData,
            'verifiedAt'  => now()->format('d/m/Y à H:i'),
        ]);
    }
}