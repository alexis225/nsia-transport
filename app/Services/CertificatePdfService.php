<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CertificateTemplate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

/**
 * ============================================================
 * CertificatePdfService — US-019
 * ============================================================
 * Génère le PDF d'un certificat d'assurance transport.
 * Utilise le template de la filiale pour :
 *   - le recto (certificat complet avec filigrane)
 *   - le verso (formalités sinistre)
 *
 * Installation DomPDF :
 *   composer require barryvdh/laravel-dompdf
 *   php artisan vendor:publish --provider="Barryvdh\DomPDF\ServiceProvider"
 * ============================================================
 */
class CertificatePdfService
{
    /**
     * Génère le PDF, le stocke et retourne le path
     */
    public function generate(Certificate $certificate): string
    {
        $certificate->loadMissing([
            'template',
            'contract:id,contract_number,insured_name,coverage_type',
            'tenant:id,name,code',
            'issuedBy:id,first_name,last_name',
        ]);

        $template = $certificate->template
            ?? CertificateTemplate::where('tenant_id', $certificate->tenant_id)
                                   ->where('is_active', true)
                                   ->first();

        $html = view('pdf.certificate', [
            'certificate' => $certificate,
            'template'    => $template,
            'logoBase64'  => $this->getLogoBase64($template),
        ])->render();

        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'DejaVu Sans',
                'dpi'                  => 150,
                'defaultPaperSize'     => 'a4',
            ]);

        $path     = "certificates/{$certificate->tenant->code}/{$certificate->certificate_number}.pdf";
        $pdfContent = $pdf->output();

        Storage::disk('public')->put($path, $pdfContent);

        // Mettre à jour le certificat avec le chemin PDF
        $certificate->update([
            'pdf_path'         => $path,
            'pdf_generated_at' => now(),
        ]);

        return $path;
    }

    /**
     * Retourne le PDF en stream (téléchargement direct)
     */
    public function download(Certificate $certificate): \Symfony\Component\HttpFoundation\Response
    {
        // Regénérer si absent
        if (! $certificate->pdf_path || ! Storage::disk('public')->exists($certificate->pdf_path)) {
            $this->generate($certificate);
            $certificate->refresh();
        }

        $certificate->loadMissing(['template', 'contract', 'tenant', 'issuedBy']);
        $template = $certificate->template
            ?? CertificateTemplate::where('tenant_id', $certificate->tenant_id)->first();

        $html = view('pdf.certificate', [
            'certificate' => $certificate,
            'template'    => $template,
            'logoBase64'  => $this->getLogoBase64($template),
        ])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'DejaVu Sans',
                'dpi'                  => 150,
            ])
            ->download("{$certificate->certificate_number}.pdf");
    }

    /**
     * Retourne le PDF en stream (affichage dans navigateur)
     */
    public function stream(Certificate $certificate): \Symfony\Component\HttpFoundation\Response
    {
        $certificate->loadMissing(['template', 'contract', 'tenant', 'issuedBy']);
        $template = $certificate->template
            ?? CertificateTemplate::where('tenant_id', $certificate->tenant_id)->first();

        $html = view('pdf.certificate', [
            'certificate' => $certificate,
            'template'    => $template,
            'logoBase64'  => $this->getLogoBase64($template),
        ])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'DejaVu Sans',
                'dpi'                  => 150,
            ])
            ->stream("{$certificate->certificate_number}.pdf");
    }

    /**
     * Convertit le logo en base64 pour l'intégrer au PDF (DomPDF ne supporte pas les URLs)
     */
    private function getLogoBase64(?CertificateTemplate $template): ?string
    {
        if (! $template?->logo_path) return null;
        if (! Storage::disk('public')->exists($template->logo_path)) return null;

        $content   = Storage::disk('public')->get($template->logo_path);
        $extension = pathinfo($template->logo_path, PATHINFO_EXTENSION);
        $mime      = match (strtolower($extension)) {
            'png'  => 'image/png',
            'webp' => 'image/webp',
            'svg'  => 'image/svg+xml',
            default => 'image/jpeg',
        };

        return "data:{$mime};base64," . base64_encode($content);
    }
}