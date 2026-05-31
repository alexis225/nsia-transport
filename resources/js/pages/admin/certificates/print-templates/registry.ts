export interface PrintTemplate {
    id: string;
    name: string;
    country: string;         // code ISO 2 ou nom complet
    countryFlag: string;     // emoji drapeau
    description: string;
    paperSize: 'A4' | 'A5';
    orientation: 'portrait' | 'landscape';
}

export const PRINT_TEMPLATES: PrintTemplate[] = [
    {
        id: 'guinee-conakry',
        name: 'Modèle Guinée Conakry',
        country: 'Guinée Conakry',
        countryFlag: '🇬🇳',
        description: 'Certificat d\'assurance — Agréé par les autorités guinéennes',
        paperSize: 'A4',
        orientation: 'portrait',
    },
    {
        id: 'gabon',
        name: 'Modèle Gabon',
        country: 'Gabon',
        countryFlag: '🇬🇦',
        description: 'Ordre d\'assurance valant certificat — NSIA Gabon (CIMA)',
        paperSize: 'A4',
        orientation: 'portrait',
    },
    {
        id: 'togo',
        name: 'Modèle Togo',
        country: 'Togo',
        countryFlag: '🇹🇬',
        description: 'Ordre d\'assurance obligatoire — Loi 87/07 du 03-06-87 (CIMA)',
        paperSize: 'A4',
        orientation: 'portrait',
    },
    // ── Ajouter les nouveaux modèles ici au fur et à mesure ──
];

export function getTemplate(id: string): PrintTemplate | undefined {
    return PRINT_TEMPLATES.find(t => t.id === id);
}
