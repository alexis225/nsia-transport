import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Printer, FileText, AlertTriangle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { PRINT_TEMPLATES } from './print-templates/registry';

export default function PrintModels() {
    const { t } = useTranslation('certificates');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('shared.breadcrumb'), href: '/admin/certificates' },
        { title: t('printModels.breadcrumb'), href: '/admin/certificates/print-models' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('printModels.title')} />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

                {/* En-tête */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Printer size={18} color="#3b82f6" />
                        </div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            {t('printModels.heading')}
                        </h1>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                        {t('printModels.description')}
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
                        <strong>{t('printModels.calibrationWarning.title')}</strong>{' '}
                        {t('printModels.calibrationWarning.text', {
                            param: '?calibrate=1',
                            path: 'print-templates/<pays>.tsx',
                        })}
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
                    <strong style={{ color: '#374151' }}>{t('printModels.info.title')}</strong><br />
                    {t('printModels.info.text')}
                </div>

            </div>
        </AppLayout>
    );
}
