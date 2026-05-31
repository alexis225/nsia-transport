import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import type { CertificateForPrint } from './print-templates/types';
import { PRINT_TEMPLATES } from './print-templates/registry';
import TemplateGuineeConakry from './print-templates/guinee-conakry';
import TemplateGabon         from './print-templates/gabon';
import TemplateTogo          from './print-templates/togo';
// ── Ajouter les imports des nouveaux templates ici ──

interface Props {
    certificate: CertificateForPrint;
    templateId: string;
}

/* Registre des composants — ajouter ici chaque nouveau template */
const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<{ certificate: CertificateForPrint }>> = {
    'guinee-conakry': TemplateGuineeConakry,
    'gabon':          TemplateGabon,
    'togo':           TemplateTogo,
    // ── Enregistrer ici les nouveaux templates ──
};

export default function CertificatePrint({ certificate: cert, templateId }: Props) {
    const TemplateComponent = TEMPLATE_COMPONENTS[templateId];
    const templateMeta      = PRINT_TEMPLATES.find(t => t.id === templateId);

    useEffect(() => {
        const timer = setTimeout(() => window.print(), 600);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title={`Certificat ${cert.certificate_number} — ${templateMeta?.name ?? templateId}`} />

            {/* Boutons (masqués à l'impression) */}
            <div className="no-print" style={{
                position: 'fixed', top: 12, right: 12, zIndex: 9999,
                display: 'flex', gap: 8,
            }}>
                <button onClick={() => window.print()} style={{
                    padding: '8px 18px', background: '#1e3a5f', color: '#fff',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}>
                    Imprimer
                </button>
                <button onClick={() => window.history.back()} style={{
                    padding: '8px 14px', background: '#64748b', color: '#fff',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
                }}>
                    ← Retour
                </button>
            </div>

            <style>{`
                @page {
                    size: ${templateMeta?.paperSize ?? 'A4'} ${templateMeta?.orientation ?? 'portrait'};
                    margin: 8mm 10mm;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #fff; font-family: Arial, Helvetica, sans-serif; }

                .no-print { display: flex; }
                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff !important; }
                    html, body { width: 210mm; }
                }

                /* Conteneur A4 */
                .cert-page {
                    width: 190mm;
                    min-height: 277mm;
                    margin: 8mm auto;
                    background: #fff;
                    font-size: 9pt;
                    color: #000;
                    border: 1px solid #aaa;
                    padding: 0;
                }
                @media print {
                    .cert-page { margin: 0; width: 190mm; border: none; }
                }

                /* Cellules grille communes à tous les templates */
                .cell {
                    border: 0.5pt solid #666;
                    padding: 3pt 5pt;
                    vertical-align: top;
                    min-height: 18pt;
                }
                .cell-label     { font-size: 7.5pt; color: #333; line-height: 1.3; }
                .cell-label-en  { font-size: 6.5pt; color: #666; font-style: italic; }
                .cell-value     { font-size: 9.5pt; font-weight: 600; color: #000; margin-top: 2pt; line-height: 1.35; }

                /* Filigrane brouillon */
                .watermark {
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%) rotate(-35deg);
                    font-size: 72pt; font-weight: 900; color: rgba(180,0,0,0.08);
                    pointer-events: none; user-select: none; white-space: nowrap;
                    letter-spacing: 0.1em; z-index: 0;
                }
            `}</style>

            {/* Filigrane si brouillon */}
            {cert.status !== 'ISSUED' && (
                <div className="watermark">BROUILLON</div>
            )}

            {/* Template introuvable */}
            {!TemplateComponent && (
                <div style={{ padding: 40, textAlign: 'center', color: '#dc2626', fontFamily: 'Arial' }}>
                    <p style={{ fontSize: 18, fontWeight: 700 }}>Modèle introuvable</p>
                    <p style={{ marginTop: 8, color: '#64748b' }}>Le modèle « {templateId} » n'existe pas.</p>
                </div>
            )}

            {/* Rendu du template sélectionné */}
            {TemplateComponent && <TemplateComponent certificate={cert} />}
        </>
    );
}
