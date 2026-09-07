import type { FieldPosition } from './overlay-types';
import StubOverlay from './stub-overlay';
import type { CertificateForPrint } from './types';

// ============================================================
// Coordonnées calibrées via le Designer pdfme, en 2 passes :
// 1) positionnement initial sur le PDF scanné de la souche Togo ;
// 2) réajustement fin par glisser-déposer directement sur le PDF
//    propre "Modèle Certificat Carnet Togo.pdf" fourni par NSIA
//    (2026-08-18), après vérification photo de la grille ?calibrate=1
//    superposée à une vraie souche imprimée. Cette 2e passe a corrigé
//    un décalage vertical d'environ 12 à 16mm sur tout le bloc DETAIL
//    DE L'EXPEDITION (marks → insured_value), qui n'était pas visible
//    lors du 1er calibrage. Le bloc DECOMPTE DE PRIME était déjà
//    quasi exact et n'a quasiment pas bougé.
//
// certificate_number : ABSENT du positionnement Togo — le "Nr ______" du
// formulaire est un numéro de série pré-imprimé par l'imprimeur sur la
// souche physique (encre identique au reste du formulaire), pas une
// valeur à superposer par l'appli. Décision confirmée le 2026-08-18.
//
// insured_address : le formulaire Togo n'a qu'une seule ligne libre sous
// "ASSURE :" (la ligne suivante est le texte légal pré-imprimé "Agissant
// tant pour son compte..."). Décision confirmée le 2026-08-19 : nom et
// adresse sont imprimés sur cette unique ligne via le champ combiné
// insured_name_and_address (cf. build-field-values.ts), en plus petit
// pour limiter le risque de débordement sur les lignes pré-imprimées.
//
// 2026-08-19 : recalibrage complet via l'aperçu FPDI/TCPDF fond+données,
// y compris voyage_via/flight_number (vérifiés avec des valeurs de test
// injectées en mémoire — tombaient resp. sur "N° Vol :" et
// "MODE DE GARANTIE :"). transport_air/transport_sea/transport_road
// restent volontairement absents : la souche Togo n'a pas de cases à
// cocher AVION/NAVIRE/ROUTIER (confirmé sur le PDF de référence).
//
// ⚠️ Pour l'impression FPDF (CertificatePrePrintedService), c'est
// config/certificate_layouts.php qui fait foi — SAUF si une surcharge
// existe dans la table certificate_print_templates (créée depuis
// /admin/certificate-print-templates), auquel cas c'est ELLE qui prime
// sur ce fichier ET sur le PHP. Les deux doivent être tenus synchronisés
// manuellement avec ce fichier .tsx (utilisé par l'ancien rendu HTML/CSS).
//
// Différences structurelles constatées vs le positionnement générique :
//   - Pas de cases à cocher CONTAINER/CONVENTIONNEL/GROUPAGE/BOUT EN
//     BOUT ni AVION/NAVIRE/ROUTIER sur cette souche (contrairement au
//     Gabon) — ces champs sont donc omis pour le Togo.
//   - Pas de ligne "Divers" dans le DECOMPTE DE PRIME (seulement
//     RO/CFA, RG/CFA, SURPRIME), puis un second encart TOTAL / COUT DE
//     POLICE (= Accessoires) / TAXES / PRIME A PAYER.
export const TOGO_POSITIONS: FieldPosition[] = [
    // ── En-tête ──
    { key: 'policy_number', top: 57.8, left: 154.6, width: 47.1 },
    { key: 'issue_date', top: 44, left: 144.4, width: 36 },

    // ── ASSURE (nom + adresse combinés) ──
    {
        key: 'insured_name_and_address',
        top: 65,
        left: 30,
        width: 91,
        fontSize: 8,
    },
    { key: 'insured_ref', top: 87.1, left: 160.7, width: 41.5 },

    // ── VOYAGE (colonne gauche : Date expédition / DE / Via / N° Vol) ──
    { key: 'voyage_date', top: 85.4, left: 94.9, width: 40.8 },
    { key: 'voyage_from', top: 89.8, left: 62.1, width: 73.6 },
    { key: 'voyage_via', top: 95.9, left: 64.1, width: 73.3 },
    {
        key: 'flight_number',
        top: 103.3,
        left: 66.9,
        width: 28,
        align: 'center',
    },
    // ── VOYAGE (colonne droite : à / M-S / Mode de garantie) ──
    { key: 'voyage_to', top: 92, left: 141.4, width: 58.2 },
    { key: 'vessel_name', top: 96, left: 150.8, width: 50 },
    { key: 'guarantee_mode', top: 106.3, left: 96.1, width: 106.9 },

    // ── Détail de l'expédition ──
    { key: 'marks', top: 139.9, left: 16.5, width: 29.3, align: 'center' },
    {
        key: 'package_numbers',
        top: 139.5,
        left: 51.5,
        width: 27.8,
        align: 'center',
    },
    {
        key: 'package_count',
        top: 140.5,
        left: 80.9,
        width: 11.6,
        align: 'center',
    },
    { key: 'weight', top: 139.5, left: 91.8, width: 14.3, align: 'center' },
    { key: 'nature', top: 139.1, left: 109.3, width: 64.9, align: 'center' },
    { key: 'packaging', top: 143.9, left: 109.1, width: 66.2, align: 'center' },
    { key: 'insured_value', top: 141.3, left: 172.6, width: 28.8 },

    // ── Valeur d'assurance / Unité monétaire ──
    { key: 'currency_code', top: 176, left: 148.2, width: 22.5 },
    { key: 'insured_value_letters', top: 184.2, left: 89.1, width: 107.2 },

    // ── DECOMPTE DE PRIME (RO/RG/SURPRIME — pas de ligne Divers) ──
    { key: 'rate_ro', top: 221.3, left: 135.7, width: 19.8, align: 'center' },
    { key: 'amount_ro', top: 221.3, left: 151.7, width: 43, align: 'center' },
    { key: 'rate_rg', top: 225.4, left: 136.1, width: 20.4, align: 'center' },
    { key: 'amount_rg', top: 225.4, left: 152.7, width: 42.5, align: 'center' },
    {
        key: 'rate_surprime',
        top: 230.4,
        left: 135.6,
        width: 20.6,
        align: 'center',
    },
    {
        key: 'amount_surprime',
        top: 230.4,
        left: 152.4,
        width: 43.6,
        align: 'center',
    },

    // ── TOTAL / COUT DE POLICE / TAXES / PRIME A PAYER ──
    {
        key: 'amount_prime_nette',
        top: 240.2,
        left: 149.6,
        width: 46,
        align: 'center',
    },
    {
        key: 'amount_accessoires',
        top: 246.8,
        left: 148.3,
        width: 45.2,
        align: 'center',
    },
    { key: 'amount_taxe', top: 252.2, left: 149.5, width: 46, align: 'center' },
    {
        key: 'prime_total',
        top: 258.7,
        left: 150.3,
        width: 44.5,
        align: 'center',
        fontSize: 11,
    },
];

interface Props {
    certificate: CertificateForPrint;
    calibrate?: boolean;
    positionsOverride?: FieldPosition[] | null;
}

export default function TemplateTogo({
    certificate,
    calibrate,
    positionsOverride,
}: Props) {
    return (
        <StubOverlay
            certificate={certificate}
            positions={positionsOverride ?? TOGO_POSITIONS}
            calibrate={calibrate}
        />
    );
}
