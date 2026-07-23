import type { FieldPosition } from './overlay-types';

// ⚠️ COORDONNÉES PLACEHOLDER — point de départ générique, PAS calibrées
// sur une souche physique réelle. Chaque pays doit ajuster ses propres
// valeurs (top/left en mm) après un test d'impression sur le papier
// pré-imprimé NSIA réel : ouvrez la page d'impression avec
// « ?calibrate=1 » pour afficher une grille de repère (tous les 10 mm)
// et le nom de chaque champ, imprimez sur le papier réel, mesurez les
// écarts au feutre/règle, puis corrigez les nombres ci-dessous (ou dans
// le fichier du pays, qui peut surcharger indépendamment ces valeurs).
export const DEFAULT_FIELD_POSITIONS: FieldPosition[] = [
    { key: 'certificate_number',    top: 25,  left: 140, width: 60,  fontSize: 12, bold: true },
    { key: 'policy_number',         top: 32,  left: 140, width: 60 },
    { key: 'issue_place',           top: 38,  left: 140, width: 25 },
    { key: 'issue_date',            top: 38,  left: 170, width: 30 },

    { key: 'insured_name',          top: 50,  left: 20,  width: 110, bold: true },
    { key: 'insured_address',       top: 55,  left: 20,  width: 110 },
    { key: 'insured_ref',           top: 50,  left: 140, width: 60 },

    { key: 'voyage_date',           top: 68,  left: 60,  width: 40 },
    { key: 'voyage_from',           top: 73,  left: 40,  width: 55 },
    { key: 'voyage_to',             top: 73,  left: 105, width: 55 },
    { key: 'voyage_via',            top: 78,  left: 40,  width: 120 },

    { key: 'transport_air',         top: 85,  left: 25,  width: 6,  align: 'center' },
    { key: 'flight_number',         top: 85,  left: 45,  width: 40 },
    { key: 'transport_sea',         top: 85,  left: 90,  width: 6,  align: 'center' },
    { key: 'vessel_name',           top: 85,  left: 110, width: 60 },
    { key: 'transport_road',        top: 90,  left: 25,  width: 6,  align: 'center' },
    { key: 'voyage_mode',           top: 90,  left: 45,  width: 100 },

    { key: 'marks',                 top: 102, left: 20,  width: 30 },
    { key: 'package_numbers',       top: 102, left: 55,  width: 30 },
    { key: 'weight',                top: 102, left: 90,  width: 20 },
    { key: 'nature',                top: 102, left: 115, width: 50 },
    { key: 'packaging',             top: 107, left: 115, width: 50 },
    { key: 'insured_value',         top: 102, left: 170, width: 30, align: 'right', bold: true },
    { key: 'insured_value_letters', top: 114, left: 20,  width: 170 },

    { key: 'guarantee_mode',        top: 128, left: 130, width: 65 },
    { key: 'rate_ro',               top: 135, left: 150, width: 20, align: 'right' },
    { key: 'amount_ro',             top: 135, left: 172, width: 25, align: 'right' },
    { key: 'rate_rg',               top: 140, left: 150, width: 20, align: 'right' },
    { key: 'amount_rg',             top: 140, left: 172, width: 25, align: 'right' },
    { key: 'rate_surprime',         top: 145, left: 150, width: 20, align: 'right' },
    { key: 'amount_surprime',       top: 145, left: 172, width: 25, align: 'right' },
    { key: 'rate_divers',           top: 150, left: 150, width: 20, align: 'right' },
    { key: 'amount_divers',         top: 150, left: 172, width: 25, align: 'right' },
    { key: 'amount_prime_nette',    top: 156, left: 172, width: 25, align: 'right', bold: true },
    { key: 'prime_total',           top: 163, left: 172, width: 25, align: 'right', bold: true, fontSize: 11 },

    { key: 'issued_by',             top: 175, left: 20,  width: 80 },
];
