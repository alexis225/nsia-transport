import { Head, Link } from '@inertiajs/react';
import { FileJson, Edit2, CheckCircle2, Circle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { PRINT_TEMPLATES } from '../print-templates/registry';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Certificats', href: '/admin/certificates' },
    { title: 'Modèles d\'impression', href: '/admin/certificates/print-models' },
    { title: 'Positions des champs (JSON)', href: '/admin/certificate-print-templates' },
];

interface Override {
    template_id: string;
    positions: unknown[] | null;
    base_pdf_path: string | null;
    updated_at: string | null;
}

interface Props {
    overrides: Record<string, Override>;
}

export default function PrintPositionsIndex({ overrides }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Positions des champs — Modèles d'impression — NSIA Transport" />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileJson size={18} color="#3b82f6" />
                        </div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Positions des champs (JSON)
                        </h1>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                        Modifiez directement les coordonnées (mm) de chaque carnet sans passer par un déploiement de code —
                        collez ou importez le JSON, et joignez éventuellement le PDF de la souche scannée comme repère visuel.
                        Une fois enregistrée, la surcharge s'applique immédiatement aux deux modes d'impression
                        (« Aperçu HTML » et « Imprimer sur souche »/FPDF). Pour recalibrer visuellement un champ, utilisez le
                        calibreur (<code style={{ fontSize: 11 }}>/tools/calibreur_nsia_togo.html</code>) : glissez-déposez les
                        champs sur une image de la souche, copiez le JSON généré, puis collez-le ou importez-le ci-dessous.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {PRINT_TEMPLATES.map(tpl => {
                        const override = overrides[tpl.id];
                        const customized = !!override;

                        return (
                            <div key={tpl.id} style={{
                                background: '#fff',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: 12,
                                padding: '18px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 28 }}>{tpl.countryFlag}</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{tpl.name}</p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{tpl.country}</p>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5, width: 'fit-content',
                                    fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px',
                                    background: customized ? '#f0fdf4' : '#f1f5f9',
                                    color: customized ? '#15803d' : '#64748b',
                                }}>
                                    {customized ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                    {customized ? 'Personnalisé' : 'Par défaut'}
                                </div>

                                {customized && override.updated_at && (
                                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                                        Mis à jour le {new Date(override.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        {' — '}{(override.positions?.length ?? 0)} champ{(override.positions?.length ?? 0) > 1 ? 's' : ''}
                                    </p>
                                )}

                                <Link href={route('admin.certificate-print-templates.edit', { templateId: tpl.id })}
                                      style={{
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                          padding: '8px 14px', background: '#1e3a5f', color: '#fff',
                                          borderRadius: 8, textDecoration: 'none', fontSize: 12.5, fontWeight: 600,
                                      }}>
                                    <Edit2 size={13} /> Éditer le JSON
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
