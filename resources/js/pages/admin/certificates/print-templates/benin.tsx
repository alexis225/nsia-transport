import type { FieldPosition } from './overlay-types';
import StubOverlay from './stub-overlay';
import type { CertificateForPrint } from './types';

// ============================================================
// ⚠️ CALIBRAGE PRÉ-VALIDÉ SUR APERÇU PDF UNIQUEMENT — PAS ENCORE
// VÉRIFIÉ SUR UN TIRAGE PAPIER RÉEL.
// Positions ajustées le 2026-08-31 par itérations successives via
// CertificatePrePrintedService::preview() (fond = storage/app/public/
// formulaires/benin.pdf, déposé par NSIA), chaque champ vérifié
// visuellement dans sa case sur le PDF scanné réel de la souche
// "CERTIFICAT MARITIME - TEMPLATE - ASSURANCES - BENIN.pdf" (Arrêté
// N° 331/MF/DC/DGAE/DCA, Cotonou). Contrairement au Togo (calibré en
// 2 passes AVEC vérification photo d'un tirage papier réel — cf.
// togo.tsx), cette calibration n'a été confrontée qu'à l'aperçu
// écran : reste à confirmer qu'aucun décalage d'échelle/marge
// d'impression ne déplace les champs une fois réellement imprimés
// par-dessus la souche physique (mode ?calibrate=1 + mesure à la
// règle, comme pour le Togo).
//
// Différences structurelles vs le Togo :
//   - Pas de tableau DECOMPTE DE PRIME (RO/RG/Surprime) sur cette
//     souche : uniquement un encart libre "RESUME DES PRINCIPALES
//     CONDITIONS D'ASSURANCE" — le détail de prime n'y a donc pas
//     d'emplacement dédié ; seuls prime_total et amount_prime_nette
//     sont provisoirement placés en haut de cet encart.
//   - "Marchandise" est une case libre unique (pas de colonnes
//     Marques/N° colis/Poids/Nature séparées comme au Togo) : seul le
//     champ `nature` y est positionné, les autres (marks, weight...)
//     sont positionnés dans leurs petites cases dédiées à droite.
//   - Pas de cases à cocher AVION/NAVIRE/ROUTIER ni CONTAINER/VRAC.
//   - "Voyage : TRAVEL" est une case libre unique — mappée sur
//     `voyage_from` faute de champ combiné dédié côté backend.
export const BENIN_POSITIONS: FieldPosition[] = [
    // ── En-tête ──
    { key: 'certificate_number',       top: 62,    left: 160, width: 38, fontSize: 8 },
    { key: 'policy_number',            top: 97,    left: 152, width: 28 },
    { key: 'issue_date',               top: 97,    left: 185, width: 20 },

    // ── ASSURE ──
    { key: 'insured_name_and_address', top: 89,    left: 16,  width: 118, fontSize: 8 },

    // ── MARCHANDISE / POIDS / MARQUES ──
    { key: 'nature',                   top: 110,   left: 16,  width: 118, fontSize: 8 },
    { key: 'weight',                   top: 106,   left: 152, width: 30 },
    { key: 'marks',                    top: 120,   left: 152, width: 40 },

    // ── NAVIRE / VOYAGE ──
    { key: 'vessel_name',              top: 138,   left: 16,  width: 118 },
    { key: 'voyage_from',              top: 138,   left: 152, width: 40 },

    // ── VALEUR D'ASSURANCE ──
    { key: 'insured_value',            top: 184,   left: 16,  width: 80 },
    { key: 'insured_value_letters',    top: 184,   left: 152, width: 42, fontSize: 8 },

    // ── RESUME DES PRINCIPALES CONDITIONS D'ASSURANCE (encart libre) ──
    { key: 'amount_prime_nette',       top: 228,   left: 20,  width: 80 },
    { key: 'prime_total',              top: 234,   left: 20,  width: 80, fontSize: 11 },
];

interface Props {
    certificate: CertificateForPrint;
    calibrate?: boolean;
    positionsOverride?: FieldPosition[] | null;
}

export default function TemplateBenin({ certificate, calibrate, positionsOverride }: Props) {
    return <StubOverlay certificate={certificate} positions={positionsOverride ?? BENIN_POSITIONS} calibrate={calibrate}/>;
}
