import type { FieldPosition } from './overlay-types';

// Import direct d'un export du Designer pdfme (https://pdfme.com/) — le
// format natif ({schemas, basePdf, ...}) diffère du nôtre (x/y en mm dans
// schemas[page][] + basePdf en PDF base64 séparé) mais reste convertible
// à la volée : x/y → left/top, basePdf → fichier PDF de référence extrait
// automatiquement, variables[0] (ou {cle} dans "content") → key.

interface PdfmeSchemaItem {
    name?: string;
    variables?: string[];
    type?: string;
    content?: string;
    text?: string;
    position?: { x: number; y: number };
    width?: number;
    fontSize?: number;
    alignment?: string;
    fontName?: string;
}

interface PdfmeExport {
    schemas: PdfmeSchemaItem[][];
    basePdf: string;
}

export function isPdfmeExport(value: unknown): value is PdfmeExport {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const v = value as Record<string, unknown>;

    return (
        Array.isArray(v.schemas) &&
        typeof v.basePdf === 'string' &&
        v.basePdf.startsWith('data:application/pdf')
    );
}

export interface PdfmeConversionResult {
    positions: FieldPosition[];
    skippedFields: number;
    skippedPages: number;
}

// Ne convertit que la 1ère page — nos carnets sont recto simple.
export function convertPdfmeExport(pdfme: PdfmeExport): PdfmeConversionResult {
    const page = Array.isArray(pdfme.schemas[0]) ? pdfme.schemas[0] : [];
    const positions: FieldPosition[] = [];
    let skippedFields = 0;

    for (const item of page) {
        const key = extractKey(item);

        if (!key || !item.position) {
            skippedFields++;
            continue;
        }

        const align =
            item.alignment === 'center' || item.alignment === 'right'
                ? item.alignment
                : 'left';

        positions.push({
            key,
            top: item.position.y,
            left: item.position.x,
            width: item.width,
            fontSize: item.fontSize,
            align,
            bold: item.fontName?.toLowerCase().includes('bold')
                ? true
                : undefined,
        });
    }

    return {
        positions,
        skippedFields,
        skippedPages: Math.max(0, pdfme.schemas.length - 1),
    };
}

// Le Designer pdfme n'a pas de convention unique pour lier un champ à une
// donnée — selon le type et la version, la clé se trouve dans "variables"
// (multiVariableText, ex. variables:["issue_date"]) OU directement dans le
// "name"/"text"/"content" du champ sous la forme littérale "{issue_date}"
// (type "text" simple, cf. souches calibrées à la main). On essaie les
// deux : "variables" est déjà la clé nue, les autres doivent matcher {cle}.
function extractKey(item: PdfmeSchemaItem): string | null {
    if (
        Array.isArray(item.variables) &&
        item.variables.length > 0 &&
        typeof item.variables[0] === 'string'
    ) {
        return item.variables[0];
    }

    for (const raw of [item.name, item.text, item.content]) {
        if (typeof raw === 'string') {
            const m = raw.match(/^\{(\w+)\}$/);

            if (m) {
                return m[1];
            }
        }
    }

    return null;
}

// Décode le data URI base64 du basePdf en File — pour réutiliser le même
// champ d'upload "base_pdf" que le formulaire, sans dupliquer le PDF
// (potentiellement volumineux) dans la colonne JSON des positions.
export function pdfmeBasePdfToFile(dataUri: string, filename: string): File {
    const [meta, base64] = dataUri.split(',');
    const mimeMatch = meta.match(/data:([^;]+);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], filename, { type: mime });
}
