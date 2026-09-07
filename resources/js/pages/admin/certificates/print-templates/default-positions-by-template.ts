import { BENIN_POSITIONS } from './benin';
import { CAMEROUN_POSITIONS } from './cameroun';
import { CONGO_POSITIONS } from './congo';
import { GABON_POSITIONS } from './gabon';
import { GUINEE_CONAKRY_POSITIONS } from './guinee-conakry';
import type { FieldPosition } from './overlay-types';
import { SENEGAL_POSITIONS } from './senegal';
import { TOGO_POSITIONS } from './togo';

// Coordonnées codées en dur de chaque pays — utilisées par le formulaire
// d'édition JSON (/admin/certificate-print-templates) comme point de
// départ tant qu'aucune surcharge n'a été enregistrée en base.
export const DEFAULT_POSITIONS_BY_TEMPLATE: Record<string, FieldPosition[]> = {
    'guinee-conakry': GUINEE_CONAKRY_POSITIONS,
    gabon: GABON_POSITIONS,
    togo: TOGO_POSITIONS,
    senegal: SENEGAL_POSITIONS,
    cameroun: CAMEROUN_POSITIONS,
    congo: CONGO_POSITIONS,
    benin: BENIN_POSITIONS,
    // ── Enregistrer ici les nouveaux templates ──
};
