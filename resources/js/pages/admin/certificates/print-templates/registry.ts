export interface PrintTemplate {
    id: string;
    name: string;
    country: string;         // code ISO 2 ou nom complet
    countryFlag: string;     // emoji drapeau
    description: string;
    paperSize: 'A4' | 'A5';
    orientation: 'portrait' | 'landscape';
    // Code Tenant (filiale) correspondant — permet la présélection
    // automatique du modèle depuis le pays du certificat (cf. show.tsx).
    tenantCode: string;
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
        tenantCode: 'GN',
    },
    {
        id: 'gabon',
        name: 'Modèle Gabon',
        country: 'Gabon',
        countryFlag: '🇬🇦',
        description: 'Ordre d\'assurance valant certificat — NSIA Gabon (CIMA)',
        paperSize: 'A4',
        orientation: 'portrait',
        tenantCode: 'GA',
    },
    {
        id: 'togo',
        name: 'Modèle Togo',
        country: 'Togo',
        countryFlag: '🇹🇬',
        description: 'Ordre d\'assurance obligatoire — Loi 87/07 du 03-06-87 (CIMA)',
        paperSize: 'A4',
        orientation: 'portrait',
        tenantCode: 'TG',
    },
    {
        id: 'senegal',
        name: 'Modèle Sénégal',
        country: 'Sénégal',
        countryFlag: '🇸🇳',
        description: 'Ordre d\'assurance obligatoire — NSIA Sénégal (CIMA)',
        paperSize: 'A4',
        orientation: 'portrait',
        tenantCode: 'SN',
    },
    {
        id: 'cameroun',
        name: 'Modèle Cameroun',
        country: 'Cameroun',
        countryFlag: '🇨🇲',
        description: 'Ordre d\'assurance obligatoire — NSIA Cameroun (CIMA)',
        paperSize: 'A4',
        orientation: 'portrait',
        tenantCode: 'CM',
    },
    {
        id: 'congo',
        name: 'Modèle Congo',
        country: 'Congo',
        countryFlag: '🇨🇬',
        description: 'Ordre d\'assurance obligatoire — NSIA Congo (CIMA)',
        paperSize: 'A4',
        orientation: 'portrait',
        tenantCode: 'CG',
    },
    // ── Ajouter les nouveaux modèles ici au fur et à mesure ──
];

export function getTemplate(id: string): PrintTemplate | undefined {
    return PRINT_TEMPLATES.find(t => t.id === id);
}

// Résout le modèle correspondant au code filiale d'un certificat
// (présélection automatique — cf. show.tsx / CertificateController::print()).
export function getTemplateForTenantCode(tenantCode: string | null | undefined): PrintTemplate | undefined {
    if (!tenantCode) {
return undefined;
}

    return PRINT_TEMPLATES.find(t => t.tenantCode === tenantCode);
}
