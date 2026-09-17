import type { FieldPosition } from './overlay-types';
import StubOverlay from './stub-overlay';
import type { CertificateForPrint } from './types';

// ============================================================
// Coordonnées calibrées visuellement dans le Designer pdfme sur le PDF
// réel de la souche ("CERTIFICAT MARITIME - TEMPLATE - ASSURANCES -
// BENIN.pdf", Arrêté N° 331/MF/DC/DGAE/DCA, Cotonou), puis converties
// depuis l'export JSON pdfme le 2026-09-17 : chaque `position.{x,y}`
// (mm, coin haut-gauche) devient {left, top}, `width` et `fontSize`
// sont repris tels quels.
//
// Différences structurelles vs le Togo :
//   - Pas de cases à cocher AVION/NAVIRE/ROUTIER ni CONTAINER/VRAC.
//   - Voyage éclaté en voyage_from / voyage_to (séparateur "-" imprimé
//     sur la souche entre les deux, pas besoin d'un champ dédié).
export const BENIN_POSITIONS: FieldPosition[] = [
    // ── En-tête ──
    {
        key: 'certificate_number',
        top: 60.17,
        left: 126.74,
        width: 67.47,
        fontSize: 13,
    },
    {
        key: 'policy_number',
        top: 83.09,
        left: 140.89,
        width: 28.57,
        fontSize: 11,
    },
    { key: 'voyage_date', top: 88.02, left: 172.9, width: 21.17, fontSize: 11 },

    // ── ASSURE ──
    {
        key: 'insured_name',
        top: 89.33,
        left: 35.98,
        width: 62.71,
        fontSize: 11,
    },

    // ── MARCHANDISE / POIDS / MARQUES ──
    { key: 'nature', top: 110.5, left: 16.67, width: 43.92, fontSize: 11 },
    {
        key: 'package_count',
        top: 110.16,
        left: 61.91,
        width: 37.57,
        fontSize: 11,
    },
    { key: 'weight', top: 100.63, left: 123.82, width: 28.84, fontSize: 13 },
    {
        key: 'package_numbers',
        top: 100.71,
        left: 161.52,
        width: 32.28,
        fontSize: 13,
    },
    { key: 'marks', top: 113.41, left: 117.21, width: 75.94, fontSize: 11 },

    // ── NAVIRE / VOYAGE ──
    {
        key: 'vessel_name',
        top: 134.17,
        left: 17.06,
        width: 81.76,
        fontSize: 11,
    },
    {
        key: 'voyage_from',
        top: 134.85,
        left: 104.11,
        width: 38.1,
        fontSize: 11,
    },
    { key: 'voyage_to', top: 134.14, left: 149.22, width: 45.24, fontSize: 11 },

    // ── VALEUR D'ASSURANCE ──
    {
        key: 'insured_value',
        top: 182.38,
        left: 16.65,
        width: 82.81,
        fontSize: 11,
    },
    {
        key: 'insured_value_letters',
        top: 178.77,
        left: 105.84,
        width: 88.64,
        fontSize: 11,
    },

    // ── Pied de page (Cotonou, le …) ──
    {
        key: 'issue_date',
        top: 238.9,
        left: 130.75,
        width: 43.39,
        fontSize: 10,
    },

    // ── COURTIER / EXPERT ──
    {
        key: 'expert_name',
        top: 164.45,
        left: 17.67,
        width: 83.08,
        fontSize: 13,
    },
    {
        key: 'broker_name',
        top: 164.3,
        left: 103.45,
        width: 90.22,
        fontSize: 13,
    },

    // ── RESUME DES PRINCIPALES CONDITIONS D'ASSURANCE ──
    {
        key: 'special_conditions',
        top: 197.59,
        left: 45.27,
        width: 50.01,
        fontSize: 11,
    },

    // ── DECOMPTE DE PRIME — colonnes TAUX % / MONTANT calibrées ──
    { key: 'rate_ro', top: 219.6, left: 71.7, width: 13.23, fontSize: 10 },
    { key: 'amount_ro', top: 219.6, left: 86.52, width: 25.66, fontSize: 10 },
    { key: 'rate_rg', top: 227.6, left: 70.7, width: 14.55, fontSize: 10 },
    { key: 'amount_rg', top: 228.28, left: 85.61, width: 27.52, fontSize: 10 },
    {
        key: 'rate_surprime',
        top: 235.22,
        left: 69.32,
        width: 15.61,
        fontSize: 10,
    },
    {
        key: 'amount_surprime',
        top: 237.22,
        left: 85.29,
        width: 26.99,
        fontSize: 10,
    },
    {
        key: 'prime_total',
        top: 229.87,
        left: 131.18,
        width: 61.91,
        fontSize: 13,
    },
    {
        key: 'amount_prime_nette',
        top: 206.42,
        left: 131.3,
        width: 63.76,
        fontSize: 10,
    },
    {
        key: 'amount_accessoires',
        top: 216.3,
        left: 131.84,
        width: 62.97,
        fontSize: 10,
    },
    {
        key: 'amount_taxe',
        top: 223.43,
        left: 131.31,
        width: 63.5,
        fontSize: 10,
    },
];

interface Props {
    certificate: CertificateForPrint;
    calibrate?: boolean;
    positionsOverride?: FieldPosition[] | null;
}

export default function TemplateBenin({
    certificate,
    calibrate,
    positionsOverride,
}: Props) {
    return (
        <StubOverlay
            certificate={certificate}
            positions={positionsOverride ?? BENIN_POSITIONS}
            calibrate={calibrate}
        />
    );
}
