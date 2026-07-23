import { Head } from '@inertiajs/react';
import { Printer, FileText, AlertTriangle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { PRINT_TEMPLATES } from './print-templates/registry';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Certificats', href: '/admin/certificates' },
    { title: 'Modèles d\'impression', href: '/admin/certificates/print-models' },
];

export default function PrintModels() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modèles d'impression — NSIA Transport" />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

                {/* En-tête */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Printer size={18} color="#3b82f6" />
                        </div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Modèles d'impression
                        </h1>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                        Carnets officiels reconnus par les autorités de chaque pays, imprimés par-dessus la souche physique pré-imprimée NSIA.
                        Le modèle correspondant à la filiale du certificat est présélectionné automatiquement, mais reste modifiable à l'impression.
                    </p>
                </div>

                {/* Avertissement calibration */}
                <div style={{
                    marginBottom: 20, padding: '14px 18px',
                    background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.6,
                    display: 'flex', gap: 10,
                }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }}/>
                    <div>
                        <strong>Positionnement des champs à finaliser.</strong> Les coordonnées actuelles sont un point de départ générique,
                        pas encore calibrées sur les souches physiques réelles. Ajoutez <code style={{ background:'#fff7ed', padding:'1px 5px', borderRadius:4 }}>?calibrate=1</code> à
                        l'URL d'impression pour afficher une grille de repère (tous les 10&nbsp;mm) et le nom de chaque champ — imprimez sur la souche réelle,
                        mesurez les écarts, puis ajustez les coordonnées dans le fichier du pays correspondant (<code style={{ background:'#fff7ed', padding:'1px 5px', borderRadius:4 }}>print-templates/&lt;pays&gt;.tsx</code>).
                    </div>
                </div>

                {/* Grille des modèles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {PRINT_TEMPLATES.map(tpl => (
                        <div key={tpl.id} style={{
                            background: '#fff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '18px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}>
                            {/* Drapeau + nom */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 32 }}>{tpl.countryFlag}</span>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{tpl.name}</p>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{tpl.country}</p>
                                </div>
                            </div>

                            {/* Description */}
                            <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                                {tpl.description}
                            </p>

                            {/* Tags */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', borderRadius: 20, padding: '2px 8px', fontWeight: 500 }}>
                                    {tpl.paperSize}
                                </span>
                                <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', borderRadius: 20, padding: '2px 8px', fontWeight: 500 }}>
                                    {tpl.orientation}
                                </span>
                                <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '2px 8px', fontWeight: 600, fontFamily: 'monospace' }}>
                                    {tpl.tenantCode}
                                </span>
                            </div>

                            {/* ID technique */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <FileText size={12} color="#94a3b8" />
                                <code style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{tpl.id}</code>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Note d'information */}
                <div style={{
                    marginTop: 24, padding: '14px 18px',
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 10, fontSize: 12, color: '#64748b', lineHeight: 1.6,
                }}>
                    <strong style={{ color: '#374151' }}>Comment utiliser un modèle ?</strong><br />
                    Ouvrez un certificat → cliquez sur <strong>Imprimer</strong> → choisissez le carnet du pays correspondant → lancez l'impression.
                    Les informations de l'en-tête (siège social, capital, RCCM...) sont configurées dans les <strong>paramètres de la filiale</strong>.
                </div>

            </div>
        </AppLayout>
    );
}
