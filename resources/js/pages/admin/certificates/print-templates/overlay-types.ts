// Position d'un champ imprimé par-dessus une souche physique
// pré-imprimée (papier déjà porteur des bordures/mentions légales/
// numérotation de sécurité — seule la valeur variable est imprimée,
// à l'emplacement exact de la case correspondante sur le papier).
export interface FieldPosition {
    // Identifiant du champ — doit correspondre à une clé retournée par
    // buildFieldValues() (voir build-field-values.ts).
    key: string;
    // Coordonnées en millimètres depuis le coin haut-gauche de la page.
    top: number;
    left: number;
    // Largeur en mm (optionnel — utile pour l'alignement centré/droite
    // ou pour laisser le texte s'enrouler sur plusieurs lignes).
    width?: number;
    fontSize?: number; // pt, défaut 9
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
}
