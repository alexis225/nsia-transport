<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CertificatePrintTemplate;
use Carbon\Carbon;
use FPDF;
use InvalidArgumentException;
use setasign\Fpdi\Tcpdf\Fpdi as TcpdfFpdi;

/**
 * ============================================================
 * CertificatePrePrintedService
 * ============================================================
 * Génère un PDF (FPDF) destiné à être imprimé directement par-dessus
 * une souche physique pré-imprimée par NSIA (carnet numéroté avec
 * cadres/mentions légales déjà présents sur le papier) — seules les
 * valeurs variables du certificat sont positionnées, aux coordonnées
 * (mm) définies dans config/certificate_layouts.php.
 *
 * L'extraction des valeurs (buildFieldValues) est un miroir volontaire
 * de resources/js/pages/admin/certificates/print-templates/
 * build-field-values.ts, pour que les deux pipelines d'impression
 * (overlay HTML/CSS existant et celui-ci) restent cohérents.
 * ============================================================
 */
class CertificatePrePrintedService
{
    // $calibrate = true : ignore les valeurs du certificat et imprime à la
    // place une grille de repère (tous les 10mm) + le nom de chaque champ
    // configuré, à la position exacte où il serait imprimé — à poser bien
    // à plat sur la souche physique réelle (pas de photo en angle) pour
    // mesurer les écarts à la règle et corriger config/certificate_layouts.php.
    // Miroir du mode ?calibrate=1 de l'overlay HTML/CSS existant
    // (cf. stub-overlay.tsx / CalibrationGrid).
    // $offsetX/$offsetY (mm) : décalage d'impression propre à un poste/une
    // imprimante — cf. resolveLayout(). Contrairement au calibrage des
    // positions (partagé par tout le monde), cet offset est réglé et
    // conservé côté navigateur (localStorage), jamais enregistré ici.
    public function generate(Certificate $certificate, string $templateId, bool $calibrate = false, float $offsetX = 0.0, float $offsetY = 0.0): string
    {
        $layout = $this->resolveLayout($templateId, $offsetX, $offsetY);

        if (! $layout) {
            throw new InvalidArgumentException("Aucun positionnement défini pour le modèle « {$templateId} » (voir config/certificate_layouts.php).");
        }

        $pdf = new FPDF('P', 'mm', 'A4');
        $pdf->SetAutoPageBreak(false);
        $pdf->SetMargins(0, 0, 0);
        $pdf->AddPage();
        $pdf->SetTextColor(0, 0, 0);

        if ($calibrate) {
            $this->drawCalibrationGrid($pdf, $layout);

            return $pdf->Output('S');
        }

        $certificate->loadMissing(['tenant', 'contract', 'issuedBy']);
        $values = $this->buildFieldValues($certificate);

        foreach ($layout as $key => $pos) {
            $text = $values[$key] ?? '';

            if ($text === '') {
                continue;
            }

            $fontSize = $pos['fontSize'] ?? 9;
            $align = match ($pos['align'] ?? 'L') {
                'center', 'C' => 'C',
                'right', 'R' => 'R',
                default => 'L',
            };

            $pdf->SetFont('Arial', ! empty($pos['bold']) ? 'B' : '', $fontSize);
            $pdf->SetXY($pos['left'], $pos['top']);
            // Cell (ligne unique, pas de retour à la ligne) : chaque
            // souche n'offre qu'un espace vertical fixe par champ — un
            // MultiCell débordant recouvrirait le champ suivant imprimé
            // sur le papier pré-imprimé.
            $pdf->Cell($pos['width'] ?? 0, $fontSize / 2.5, $this->toLatin1($text), 0, 0, $align);
        }

        return $pdf->Output('S');
    }

    // Positions effectives d'un modèle : la surcharge enregistrée en base
    // (via /admin/certificate-print-templates — édition JSON manuelle ou
    // import du fichier généré par le calibreur, cf.
    // public/tools/calibreur_nsia_togo.html) prime sur les coordonnées
    // codées en dur de config/certificate_layouts.php, sans déploiement.
    // Utilisée par generate(), preview() et le mode calibrate — les trois
    // doivent refléter les mêmes positions (+ le même offset imprimante).
    private function resolveLayout(string $templateId, float $offsetX = 0.0, float $offsetY = 0.0): ?array
    {
        $override = CertificatePrintTemplate::where('template_id', $templateId)->value('positions');

        $layout = $override
            ? $this->normalizeOverride($override)
            : config("certificate_layouts.{$templateId}");

        if (! $layout) {
            return null;
        }

        return ($offsetX === 0.0 && $offsetY === 0.0) ? $layout : $this->applyOffset($layout, $offsetX, $offsetY);
    }

    // Décalage uniforme (mm) appliqué à toutes les positions — compense
    // l'enregistrement/le bac papier propre à une imprimante donnée sans
    // toucher au calibrage maître partagé par tous les postes.
    private function applyOffset(array $layout, float $offsetX, float $offsetY): array
    {
        foreach ($layout as $key => $pos) {
            $layout[$key]['left'] = ($pos['left'] ?? 0) + $offsetX;
            $layout[$key]['top'] = ($pos['top'] ?? 0) + $offsetY;
        }

        return $layout;
    }

    // Convertit le format JSON édité côté admin — un tableau d'objets
    // { key, top, left, width?, fontSize?, align?, bold? } (même forme
    // que FieldPosition côté React, cf. overlay-types.ts) — vers le
    // format interne indexé par clé utilisé par le reste de ce service.
    private function normalizeOverride(array $positions): array
    {
        $layout = [];

        foreach ($positions as $pos) {
            if (empty($pos['key'])) {
                continue;
            }

            $layout[$pos['key']] = [
                'top' => (float) ($pos['top'] ?? 0),
                'left' => (float) ($pos['left'] ?? 0),
                'width' => isset($pos['width']) ? (float) $pos['width'] : null,
                'fontSize' => isset($pos['fontSize']) ? (float) $pos['fontSize'] : null,
                'align' => $pos['align'] ?? 'left',
                'bold' => ! empty($pos['bold']),
            ];
        }

        return $layout;
    }

    // Aperçu de calibrage (FPDI + TCPDF) : importe le PDF réel de la
    // souche (storage/app/public/formulaires/{templateId}.pdf) comme
    // fond de page, puis superpose les valeurs par-dessus, en rouge —
    // permet de vérifier à l'écran que chaque champ tombe bien dans sa
    // case sans gaspiller de souche papier. À la différence de
    // generate(), ce PDF n'est PAS destiné à être imprimé par-dessus le
    // carnet physique (il contiendrait le formulaire en double).
    public function preview(Certificate $certificate, string $templateId, float $offsetX = 0.0, float $offsetY = 0.0): string
    {
        $layout = $this->resolveLayout($templateId, $offsetX, $offsetY);

        if (! $layout) {
            throw new InvalidArgumentException("Aucun positionnement défini pour le modèle « {$templateId} » (voir config/certificate_layouts.php).");
        }

        $formPath = storage_path("app/public/formulaires/{$templateId}.pdf");

        if (! is_file($formPath)) {
            throw new InvalidArgumentException("Aucun PDF de souche trouvé pour « {$templateId} » (attendu : storage/app/public/formulaires/{$templateId}.pdf).");
        }

        $certificate->loadMissing(['tenant', 'contract', 'issuedBy']);
        $values = $this->buildFieldValues($certificate);

        $pdf = new TcpdfFpdi('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(0, 0, 0);
        $pdf->SetAutoPageBreak(false);

        $pdf->setSourceFile($formPath);
        $tplId = $pdf->importPage(1);

        $pdf->AddPage();
        $pdf->useTemplate($tplId, 0, 0, 210, 297, true);

        // Valeurs en rouge, par-dessus le fond du formulaire — pour bien
        // les distinguer visuellement à l'écran pendant la vérification.
        $pdf->SetTextColor(200, 0, 0);

        foreach ($layout as $key => $pos) {
            $text = $values[$key] ?? '';

            if ($text === '') {
                continue;
            }

            $fontSize = $pos['fontSize'] ?? 9;
            $align = match ($pos['align'] ?? 'L') {
                'center', 'C' => 'C',
                'right', 'R' => 'R',
                default => 'L',
            };

            $pdf->SetFont('helvetica', ! empty($pos['bold']) ? 'B' : '', $fontSize);
            $pdf->SetXY($pos['left'], $pos['top']);
            $pdf->Cell($pos['width'] ?? 0, $fontSize / 2.5, $text, 0, 0, $align);
        }

        return $pdf->Output('apercu-'.$templateId.'.pdf', 'S');
    }

    private function drawCalibrationGrid(FPDF $pdf, array $layout): void
    {
        $width = 210;
        $height = 297;

        $pdf->SetDrawColor(29, 78, 216);
        $pdf->SetFont('Arial', '', 6);
        $pdf->SetTextColor(29, 78, 216);

        for ($x = 0; $x <= $width; $x += 10) {
            $major = $x % 50 === 0;
            $pdf->SetLineWidth($major ? 0.35 : 0.15);
            $pdf->Line($x, 0, $x, $height);
            $pdf->SetXY($x + 0.5, 0.5);
            $pdf->Cell(8, 3, (string) $x);
        }
        for ($y = 0; $y <= $height; $y += 10) {
            $major = $y % 50 === 0;
            $pdf->SetLineWidth($major ? 0.35 : 0.15);
            $pdf->Line(0, $y, $width, $y);
            $pdf->SetXY(0.5, $y + 0.5);
            $pdf->Cell(8, 3, (string) $y);
        }

        // Nom de chaque champ configuré, à sa position exacte — permet
        // d'identifier sur le papier physique quelle case correspond à
        // quelle clé de config/certificate_layouts.php.
        $pdf->SetDrawColor(220, 38, 38);
        $pdf->SetTextColor(220, 38, 38);
        $pdf->SetFont('Arial', 'B', 6);
        $pdf->SetLineWidth(0.2);

        foreach ($layout as $key => $pos) {
            $fontSize = $pos['fontSize'] ?? 9;
            $h = max(3, $fontSize / 2.5);
            $pdf->Rect($pos['left'], $pos['top'], $pos['width'] ?? 15, $h);
            $pdf->SetXY($pos['left'], $pos['top'] - 3);
            $pdf->Cell($pos['width'] ?? 15, 3, $key);
        }

        // Carré de contrôle 50×50mm — mesurez-le à la règle une fois
        // imprimé : s'il ne fait pas exactement 50×50mm, l'échelle
        // d'impression est en cause (pas les coordonnées des champs).
        $pdf->SetDrawColor(220, 38, 38);
        $pdf->SetLineWidth(0.4);
        $pdf->Rect(10, 235, 50, 50);
        $pdf->SetTextColor(220, 38, 38);
        $pdf->SetFont('Arial', 'B', 7);
        $pdf->SetXY(10, 286);
        $pdf->Cell(50, 4, $this->toLatin1('Ce carre doit mesurer 50 x 50mm'), 0, 0, 'C');

        // Bandeau d'avertissement imprimé en dernier, par-dessus tout le
        // reste (donc impossible à manquer, contrairement à un rappel
        // affiché seulement à l'écran) — la moindre marge ou mise à
        // l'échelle appliquée par le lecteur PDF au moment de l'impression
        // fausse TOUTES les coordonnées de cette page, y compris le carré
        // de contrôle ci-dessus.
        $pdf->SetFillColor(220, 38, 38);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('Arial', 'B', 9);
        $pdf->Rect(0, 0, $width, 7, 'F');
        $pdf->SetXY(0, 1.2);
        $pdf->Cell($width, 5, $this->toLatin1('IMPRESSION : Echelle 100% / Taille reelle - Marges : Aucune - sinon reperes faux'), 0, 0, 'C');
    }

    // FPDF (polices core, sans embarquer de police TrueType) n'accepte
    // que du Windows-1252/ISO-8859-1 — nos données viennent en UTF-8.
    private function toLatin1(string $text): string
    {
        return @iconv('UTF-8', 'CP1252//TRANSLIT', $text) ?: $text;
    }

    private function buildFieldValues(Certificate $cert): array
    {
        $contract = $cert->contract;
        $settings = $cert->tenant?->settings ?? [];
        $primes = collect($cert->prime_breakdown ?? []);
        $item = collect($cert->expedition_items ?? [])->first() ?? collect();
        $transportType = $cert->transport_type ?? '';

        $row = function (string $key) use ($primes, $cert) {
            $line = $primes->firstWhere('key', $key);

            return [
                'rate' => $line ? $this->fmtRate((float) ($line['rate'] ?? 0)) : '',
                'amount' => $line ? $this->fmt($line['amount'] ?? null, $cert->currency_code) : '',
            ];
        };

        $ro = $row('ro');
        $rg = $row('rg');
        $surprime = $row('surprime');
        $divers = $row('divers');
        $accessoires = $row('accessoires');
        $taxe = $row('taxe');

        return [
            'certificate_number' => $cert->certificate_number ?? '',
            'policy_number' => $cert->policy_number ?? '',
            'issue_place' => $settings['city'] ?? '',
            'issue_date' => $this->fmtDate($cert->issued_at ?? $cert->created_at),
            'insured_name' => $cert->insured_name ?? '',
            'insured_address' => $contract?->insured_address ?? '',
            // Combiné pour les souches à une seule ligne libre sous
            // ASSURE (ex. Togo) — cf. build-field-values.ts.
            'insured_name_and_address' => collect([$cert->insured_name, $contract?->insured_address])->filter()->implode(' — '),
            'insured_ref' => $cert->insured_ref ?? '',
            'voyage_date' => $this->fmtDate($cert->voyage_date),
            'voyage_from' => $cert->voyage_from ?? '',
            'voyage_to' => $cert->voyage_to ?? '',
            'voyage_via' => $cert->voyage_via ?? '',
            'transport_air' => $transportType === 'AIR' ? 'X' : '',
            'flight_number' => $cert->flight_number ?? '',
            'transport_sea' => $transportType === 'SEA' ? 'X' : '',
            'vessel_name' => $cert->vessel_name ?? '',
            'transport_road' => $transportType === 'ROAD' ? 'X' : '',
            'voyage_mode' => $cert->voyage_mode ?? '',
            'marks' => $item['marks'] ?? '',
            'package_numbers' => $item['package_numbers'] ?? '',
            'package_count' => isset($item['package_count']) ? (string) $item['package_count'] : '',
            'weight' => $item['weight'] ?? '',
            'nature' => $item['nature'] ?? '',
            'packaging' => $item['packaging'] ?? '',
            'insured_value' => $this->fmt($cert->insured_value, $cert->currency_code),
            'insured_value_letters' => $cert->insured_value_letters ?? '',
            'guarantee_mode' => $cert->guarantee_mode ?? $contract?->coverage_type ?? '',
            'rate_ro' => $ro['rate'], 'amount_ro' => $ro['amount'],
            'rate_rg' => $rg['rate'], 'amount_rg' => $rg['amount'],
            'rate_surprime' => $surprime['rate'], 'amount_surprime' => $surprime['amount'],
            'rate_divers' => $divers['rate'], 'amount_divers' => $divers['amount'],
            'rate_accessoires' => $accessoires['rate'], 'amount_accessoires' => $accessoires['amount'],
            'rate_taxe' => $taxe['rate'], 'amount_taxe' => $taxe['amount'],
            // prime_nette est une colonne propre du certificat (somme
            // RO+RG+Divers+Surprime déjà calculée), PAS une ligne de
            // prime_breakdown — contrairement aux autres montants ci-dessus.
            'rate_prime_nette' => '',
            'amount_prime_nette' => $this->fmt($cert->prime_nette, $cert->currency_code),
            'prime_total' => $this->fmt($cert->prime_total, $cert->currency_code),
            'currency_code' => $cert->currency_code ?? '',
            'issued_by' => $cert->issuedBy ? trim($cert->issuedBy->first_name.' '.$cert->issuedBy->last_name) : '',
        ];
    }

    private function fmt($n, ?string $currency = ''): string
    {
        if ($n === null || $n === '') {
            return '';
        }

        $formatted = number_format((float) $n, 2, ',', ' ');

        return $currency ? "{$formatted} {$currency}" : $formatted;
    }

    private function fmtRate(?float $n): string
    {
        // Un taux à 0% (ex. surprime non appliquée) est une valeur réelle
        // à afficher, pas une valeur absente — seul null l'est.
        if ($n === null) {
            return '';
        }

        $formatted = rtrim(rtrim(number_format($n, 4, '.', ''), '0'), '.');

        return "{$formatted} %";
    }

    private function fmtDate($d): string
    {
        if (! $d) {
            return '';
        }

        return Carbon::parse($d)->format('d/m/Y');
    }
}
