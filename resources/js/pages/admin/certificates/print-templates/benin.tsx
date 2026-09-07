import type { FieldPosition } from './overlay-types';
import StubOverlay from './stub-overlay';
import type { CertificateForPrint } from './types';

// ============================================================
// Coordonnées calibrées visuellement dans le Designer pdfme sur le PDF
// réel de la souche ("CERTIFICAT MARITIME - TEMPLATE - ASSURANCES -
// BENIN.pdf", Arrêté N° 331/MF/DC/DGAE/DCA, Cotonou), puis converties
// depuis l'export JSON pdfme le 2026-09-03 : chaque `position.{x,y}`
// (mm, coin haut-gauche) devient {left, top}, `width` et `fontSize`
// sont repris tels quels.
//
// ⚠️ Comme pour le Togo à l'issue de sa 1re passe, ce calibrage n'a
// pas encore été confronté à un tirage papier réel : imprimer en mode
// ?calibrate=1 sur une vraie souche, à plat, et mesurer à la règle
// avant usage en production (une mise à l'échelle du lecteur PDF à
// l'impression décalerait tous les champs).
//
// Différences structurelles vs le Togo :
//   - Pas de tableau DECOMPTE DE PRIME (RO/RG/Surprime) sur cette
//     souche : uniquement un encart libre "RESUME DES PRINCIPALES
//     CONDITIONS D'ASSURANCE". Le calibrage pdfme n'y place aucun
//     champ — le détail de prime n'est donc pas imprimé ici.
//   - Pas de cases à cocher AVION/NAVIRE/ROUTIER ni CONTAINER/VRAC.
export const BENIN_POSITIONS: FieldPosition[] = [
    // ── En-tête ──
    {
        key: 'certificate_number',
        top: 60.7,
        left: 126.74,
        width: 67.47,
        fontSize: 13,
    },
    {
        key: 'policy_number',
        top: 83.62,
        left: 140.89,
        width: 28.57,
        fontSize: 13,
    },
    { key: 'voyage_date', top: 88.55, left: 172.9, width: 21.17, fontSize: 13 },

    // ── ASSURE ──
    {
        key: 'insured_name',
        top: 89.86,
        left: 35.98,
        width: 62.71,
        fontSize: 13,
    },

    // ── MARCHANDISE / POIDS / MARQUES ──
    { key: 'nature', top: 111.03, left: 16.67, width: 43.92, fontSize: 13 },
    {
        key: 'package_count',
        top: 110.69,
        left: 61.91,
        width: 37.57,
        fontSize: 13,
    },
    { key: 'weight', top: 101.16, left: 123.82, width: 28.84, fontSize: 13 },
    { key: 'marks', top: 113.94, left: 117.21, width: 75.94, fontSize: 13 },

    // ── NAVIRE / VOYAGE ──
    { key: 'vessel_name', top: 134.7, left: 17.06, width: 81.76, fontSize: 13 },
    { key: 'voyage_via', top: 127.44, left: 117.6, width: 75.41, fontSize: 13 },

    // ── VALEUR D'ASSURANCE ──
    {
        key: 'insured_value',
        top: 182.91,
        left: 16.65,
        width: 82.81,
        fontSize: 13,
    },
    {
        key: 'insured_value_letters',
        top: 179.3,
        left: 105.84,
        width: 88.64,
        fontSize: 13,
    },

    // ── Pied de page (Cotonou, le …) ──
    {
        key: 'issue_date',
        top: 234.67,
        left: 134.22,
        width: 43.39,
        fontSize: 13,
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
