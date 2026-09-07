import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import TemplateBenin from './print-templates/benin';
import TemplateCameroun from './print-templates/cameroun';
import TemplateCongo from './print-templates/congo';
import TemplateGabon from './print-templates/gabon';
import TemplateGuineeConakry from './print-templates/guinee-conakry';
import type { FieldPosition } from './print-templates/overlay-types';
import { PRINT_TEMPLATES } from './print-templates/registry';
import TemplateSenegal from './print-templates/senegal';
import TemplateTogo from './print-templates/togo';
import type { CertificateForPrint } from './print-templates/types';
// ── Ajouter les imports des nouveaux templates ici ──

interface Props {
    certificate: CertificateForPrint;
    templateId: string;
    calibrate?: boolean;
    // Positions mm surchargées depuis l'admin (cf. /admin/certificate-print-templates) —
    // null/absent = le composant du pays garde ses coordonnées codées en dur.
    positionsOverride?: FieldPosition[] | null;
}

/* Registre des composants — ajouter ici chaque nouveau template */
const TEMPLATE_COMPONENTS: Record<
    string,
    React.ComponentType<{
        certificate: CertificateForPrint;
        calibrate?: boolean;
        positionsOverride?: FieldPosition[] | null;
    }>
> = {
    'guinee-conakry': TemplateGuineeConakry,
    gabon: TemplateGabon,
    togo: TemplateTogo,
    senegal: TemplateSenegal,
    cameroun: TemplateCameroun,
    congo: TemplateCongo,
    benin: TemplateBenin,
    // ── Enregistrer ici les nouveaux templates ──
};

export default function CertificatePrint({
    certificate: cert,
    templateId,
    calibrate = false,
    positionsOverride = null,
}: Props) {
    const TemplateComponent = TEMPLATE_COMPONENTS[templateId];
    const templateMeta = PRINT_TEMPLATES.find((t) => t.id === templateId);

    useEffect(() => {
        // Pas d'impression auto en mode calibration
        if (calibrate) {
            return;
        }

        const timer = setTimeout(() => window.print(), 600);

        return () => clearTimeout(timer);
    }, [calibrate]);

    return (
        <>
            <Head
                title={`Certificat ${cert.certificate_number} — ${templateMeta?.name ?? templateId}`}
            />

            {/* Boutons (masqués à l'impression) */}
            <div
                className="no-print"
                style={{
                    position: 'fixed',
                    top: 12,
                    right: 12,
                    zIndex: 9999,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                }}
            >
                {calibrate && (
                    <span
                        style={{
                            fontSize: 12,
                            color: '#b45309',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: 6,
                            padding: '6px 10px',
                            maxWidth: 340,
                        }}
                    >
                        Mode calibration — grille de repère (mm) affichée. Dans
                        la boîte d'impression, vérifiez « Échelle : 100% /
                        Taille réelle » (PAS « Ajuster à la page ») et « Marges
                        : Aucune », sinon la grille elle-même sera faussée.
                    </span>
                )}
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: '8px 18px',
                        background: '#1e3a5f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                    }}
                >
                    Imprimer
                </button>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        padding: '8px 14px',
                        background: '#64748b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                    }}
                >
                    ← Retour
                </button>
            </div>

            <style>{`
                @page {
                    size: ${templateMeta?.paperSize ?? 'A4'} ${templateMeta?.orientation ?? 'portrait'};
                    margin: 0;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #fff; font-family: Arial, Helvetica, sans-serif; }

                .no-print { display: flex; }
                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff !important; }
                    html, body { width: 210mm; }
                }

                /* Page de souche — AUCUNE bordure/fond : imprimée par-dessus
                   un papier déjà pré-imprimé (numérotation, cadres, mentions
                   légales). Seuls les champs variables sont positionnés. */
                .stub-page {
                    position: relative;
                    width: 210mm;
                    height: 297mm;
                    margin: 0 auto;
                    background: #fff;
                    color: #000;
                }
                .stub-field {
                    position: absolute;
                    white-space: pre-wrap;
                    line-height: 1.25;
                }
                .stub-field--calibrate {
                    outline: 1pt dashed #dc2626;
                    background: rgba(220,38,38,0.08);
                    min-height: 4mm;
                    min-width: 4mm;
                }
                .stub-field-key {
                    display: block;
                    font-size: 7pt;
                    font-weight: 700;
                    color: #dc2626;
                    font-family: monospace;
                    background: #fff;
                }

                /* Grille de calibration (mode ?calibrate=1 uniquement) — traits
                   et chiffres volontairement épais/foncés pour rester lisibles
                   après impression + photo (une grille fine à 25% d'opacité ne
                   survit pas au papier + à une photo de test). */
                .calibration-grid { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
                .grid-line { position: absolute; }
                .grid-line--v { top: 0; bottom: 0; border-left: 0.75pt solid rgba(29,78,216,0.55); }
                .grid-line--h { left: 0; right: 0; border-top: 0.75pt solid rgba(29,78,216,0.55); }
                .grid-line--major.grid-line--v { border-left: 1.5pt solid #1d4ed8; }
                .grid-line--major.grid-line--h { border-top: 1.5pt solid #1d4ed8; }
                .grid-line span { position: absolute; font-size: 6pt; color: #1d4ed8; background: #fff; padding: 0 1pt; }
                .grid-line--major span { font-size: 8pt; font-weight: 700; }
                .grid-line--v span { top: 0; left: 1pt; }
                .grid-line--h span { top: -7pt; left: 1pt; }

                /* Filigrane brouillon */
                .watermark {
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%) rotate(-35deg);
                    font-size: 72pt; font-weight: 900; color: rgba(180,0,0,0.08);
                    pointer-events: none; user-select: none; white-space: nowrap;
                    letter-spacing: 0.1em; z-index: 0;
                }
            `}</style>

            {/* Filigrane selon le statut — un certificat non Approuvé n'a pas
                de valeur légale ; Remplacé/Annulé affichent leur propre
                mention plutôt que le générique BROUILLON. */}
            {cert.status !== 'ISSUED' && (
                <div className="watermark">
                    {cert.status === 'REPLACED'
                        ? 'REMPLACÉ'
                        : cert.status === 'CANCELLED'
                          ? 'ANNULÉ'
                          : 'BROUILLON'}
                </div>
            )}

            {/* Template introuvable */}
            {!TemplateComponent && (
                <div
                    style={{
                        padding: 40,
                        textAlign: 'center',
                        color: '#dc2626',
                        fontFamily: 'Arial',
                    }}
                >
                    <p style={{ fontSize: 18, fontWeight: 700 }}>
                        Modèle introuvable
                    </p>
                    <p style={{ marginTop: 8, color: '#64748b' }}>
                        Le modèle « {templateId} » n'existe pas.
                    </p>
                </div>
            )}

            {/* Rendu du template sélectionné */}
            {TemplateComponent && (
                <TemplateComponent
                    certificate={cert}
                    calibrate={calibrate}
                    positionsOverride={positionsOverride}
                />
            )}
        </>
    );
}
