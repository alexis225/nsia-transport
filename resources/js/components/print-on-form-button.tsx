import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    certificateId: string;
    templateId: string;
    // Modèles disposant d'un positionnement FPDF calibré côté serveur
    // (cf. config/certificate_layouts.php) — passé depuis
    // CertificateController::show() via la prop printOnFormTemplates.
    availableTemplates: string[];
    // Décalage imprimante (mm), propre au poste — cf. show.tsx / localStorage.
    offsetX?: number;
    offsetY?: number;
}

// Ouvre le PDF généré par CertificatePrePrintedService (FPDF), positionné
// aux coordonnées exactes de la souche physique pré-imprimée — à imprimer
// directement (Ctrl+P) par-dessus le carnet déjà chargé dans l'imprimante.
export default function PrintOnFormButton({ certificateId, templateId, availableTemplates, offsetX = 0, offsetY = 0 }: Props) {
    const supported = availableTemplates.includes(templateId);
    const offsetQs  = (offsetX || offsetY) ? `&offset_x=${offsetX}&offset_y=${offsetY}` : '';

    return (
        <a
            href={supported ? route('admin.certificates.print-on-form', { certificate: certificateId }) + `?template=${templateId}${offsetQs}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            title={supported ? undefined : `Aucun positionnement calibré pour « ${templateId} » (voir config/certificate_layouts.php)`}
            aria-disabled={!supported}
            style={{ pointerEvents: supported ? 'auto' : 'none' }}
        >
            <Button
                disabled={!supported}
                style={{ background: supported ? '#1e3a8a' : undefined, color: supported ? '#fff' : undefined, display: 'flex', alignItems: 'center', gap: 6 }}
            >
                <Printer size={14} /> Imprimer sur souche
            </Button>
        </a>
    );
}
