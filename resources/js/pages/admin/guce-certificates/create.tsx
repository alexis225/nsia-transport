import { Head, Link, useForm } from '@inertiajs/react';
import { Upload, FileText, X, AlertCircle, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// Champs GuceCertificate que l'extraction automatique (Mindee) sait
// pré-remplir — cf. config('services.mindee.field_map') côté backend.
const EXTRACTABLE_FIELDS = [
    'guce_reference', 'certificate_number', 'policy_number', 'fdi_reference',
    'insured_name', 'insured_address', 'cargo_description', 'weight', 'marks',
    'vessel', 'origin', 'destination', 'transit_date',
    'insured_value', 'currency', 'net_premium', 'total_premium',
] as const;

function readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));

    return match ? decodeURIComponent(match[1]) : null;
}

export default function GuceCertificatesCreate() {
    const { t } = useTranslation('certificates');
    const { t: tc } = useTranslation('common');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('guce.index.heading'), href: '/admin/guce-certificates' },
        { title: t('guce.create.breadcrumb'), href: '/admin/guce-certificates/create' },
    ];

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [extracting, setExtracting] = useState(false);
    const [extractionStatus, setExtractionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [extractionMessage, setExtractionMessage] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        guce_reference: '',
        certificate_number: '',
        policy_number: '',
        fdi_reference: '',
        insured_name: '',
        insured_address: '',
        cargo_description: '',
        weight: '',
        marks: '',
        vessel: '',
        origin: '',
        destination: '',
        transit_date: '',
        insured_value: '',
        currency: 'XOF',
        net_premium: '',
        total_premium: '',
        notes: '',
        file: null as File | null,
    });

    function handleFile(file: File) {
        setSelectedFile(file);
        setData('file', file);
        void extractFromFile(file);
    }

    // Extraction automatique des données du PDF (Mindee) pour
    // pré-remplir le formulaire — purement indicative, l'utilisateur
    // reste libre de corriger ou compléter chaque champ avant envoi.
    async function extractFromFile(file: File) {
        setExtracting(true);
        setExtractionStatus('idle');
        setExtractionMessage(null);

        const body = new FormData();
        body.append('file', file);

        try {
            const res = await fetch('/admin/guce-certificates/extract', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': readCookie('XSRF-TOKEN') ?? '',
                },
                body,
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                setExtractionStatus('error');
                setExtractionMessage(json.message ?? t('guce.create.fileSection.extractionErrorGeneric'));

                return;
            }

            let filled = 0;

            for (const field of EXTRACTABLE_FIELDS) {
                const value = json.data?.[field];

                if (value !== null && value !== undefined && value !== '') {
                    setData(field, field === 'transit_date' ? String(value).slice(0, 10) : String(value));
                    filled++;
                }
            }

            setExtractionStatus('success');
            setExtractionMessage(filled > 0
                ? t('guce.create.fileSection.extractionSuccess', { count: filled })
                : t('guce.create.fileSection.extractionNoData'));
        } catch {
            setExtractionStatus('error');
            setExtractionMessage(t('guce.create.fileSection.extractionErrorFallback'));
        } finally {
            setExtracting(false);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];

        if (file) {
handleFile(file);
}
    }

    function removeFile() {
        setSelectedFile(null);
        setData('file', null);
        setExtractionStatus('idle');
        setExtractionMessage(null);

        if (fileInputRef.current) {
fileInputRef.current.value = '';
}
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/guce-certificates', {
            forceFormData: true,
        });
    }

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '5px',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px',
        fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    };
    const errorStyle: React.CSSProperties = {
        color: '#dc2626', fontSize: '12px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px',
    };

    function Field({ label, name, required, type = 'text', placeholder }: {
        label: string; name: keyof typeof data; required?: boolean; type?: string; placeholder?: string;
    }) {
        return (
            <div>
                <label style={labelStyle}>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</label>
                <input
                    type={type}
                    value={data[name] as string}
                    onChange={e => setData(name, e.target.value)}
                    placeholder={placeholder}
                    style={{ ...inputStyle, borderColor: errors[name] ? '#fca5a5' : '#e2e8f0' }}
                />
                {errors[name] && (
                    <p style={errorStyle}><AlertCircle size={12} />{errors[name]}</p>
                )}
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('guce.create.title')} />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

                {/* En-tête */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <Link href="/admin/guce-certificates">
                        <button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                            <ChevronLeft size={16} />
                        </button>
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            {t('guce.create.heading')}
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0' }}>
                            {t('guce.create.subtitle')}
                        </p>
                    </div>
                </div>

                <form onSubmit={submit}>

                    {/* Zone d'upload */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>
                            {t('guce.create.fileSection.title')} <span style={{ color: '#dc2626' }}>*</span>
                        </h2>

                        {selectedFile ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                                <FileText size={20} color="#16a34a" />
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#15803d' }}>{selectedFile.name}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                        {t('guce.create.fileSection.sizeKo', { size: (selectedFile.size / 1024).toFixed(0) })}
                                    </p>
                                </div>
                                <button type="button" onClick={removeFile}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}>
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div
                                onDragOver={e => {
 e.preventDefault(); setDragOver(true);
}}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${dragOver ? '#16a34a' : '#cbd5e1'}`,
                                    borderRadius: '8px', padding: '32px', textAlign: 'center',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    background: dragOver ? '#f0fdf4' : '#f8fafc',
                                }}>
                                <Upload size={28} style={{ margin: '0 auto 8px', display: 'block', color: '#94a3b8' }} />
                                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                                    {t('guce.create.fileSection.dropText')}
                                </p>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>
                                    {t('guce.create.fileSection.dropHint')}
                                </p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            style={{ display: 'none' }}
                            onChange={e => {
 const f = e.target.files?.[0];

 if (f) {
handleFile(f);
}
}}
                        />
                        {errors.file && <p style={errorStyle}><AlertCircle size={12} />{errors.file}</p>}

                        {extracting && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '13px', color: '#1d4ed8' }}>
                                <Loader2 size={14} className="animate-spin" />
                                {t('guce.create.fileSection.extracting')}
                            </div>
                        )}
                        {!extracting && extractionStatus === 'success' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '13px', color: '#15803d' }}>
                                <Sparkles size={14} />
                                {extractionMessage}
                            </div>
                        )}
                        {!extracting && extractionStatus === 'error' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', fontSize: '13px', color: '#c2410c' }}>
                                <AlertCircle size={14} />
                                {extractionMessage}
                            </div>
                        )}
                    </div>

                    {/* Références GUCE */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                            {t('guce.create.references.title')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <Field label={t('guce.create.references.guceReference')} name="guce_reference" required placeholder={t('guce.create.references.guceReferencePlaceholder')} />
                            <Field label={t('guce.create.references.certificateNumber')} name="certificate_number" required placeholder={t('guce.create.references.certificateNumberPlaceholder')} />
                            <Field label={t('guce.create.references.policyNumber')} name="policy_number" placeholder={t('guce.create.references.policyNumberPlaceholder')} />
                            <Field label={t('guce.create.references.fdiReference')} name="fdi_reference" placeholder={t('guce.create.references.fdiReferencePlaceholder')} />
                        </div>
                    </div>

                    {/* Assuré */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                            {t('guce.create.insured.title')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <Field label={t('guce.create.insured.name')} name="insured_name" required placeholder={t('guce.create.insured.namePlaceholder')} />
                            <div>
                                <label style={labelStyle}>{t('guce.create.insured.address')}</label>
                                <textarea
                                    value={data.insured_address}
                                    onChange={e => setData('insured_address', e.target.value)}
                                    placeholder={t('guce.create.insured.addressPlaceholder')}
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Transport & marchandises */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                            {t('guce.create.transport.title')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <Field label={t('guce.create.transport.vessel')} name="vessel" placeholder={t('guce.create.transport.vesselPlaceholder')} />
                            <Field label={t('guce.create.transport.transitDate')} name="transit_date" type="date" />
                            <Field label={t('guce.create.transport.origin')} name="origin" placeholder={t('guce.create.transport.originPlaceholder')} />
                            <Field label={t('guce.create.transport.destination')} name="destination" placeholder={t('guce.create.transport.destinationPlaceholder')} />
                            <div>
                                <label style={labelStyle}>{t('guce.create.transport.cargoDescription')}</label>
                                <textarea
                                    value={data.cargo_description}
                                    onChange={e => setData('cargo_description', e.target.value)}
                                    placeholder={t('guce.create.transport.cargoDescriptionPlaceholder')}
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <Field label={t('guce.create.transport.weight')} name="weight" placeholder={t('guce.create.transport.weightPlaceholder')} />
                                <Field label={t('guce.create.transport.marks')} name="marks" placeholder={t('guce.create.transport.marksPlaceholder')} />
                            </div>
                        </div>
                    </div>

                    {/* Valeurs financières */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                            {t('guce.create.financial.title')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <Field label={t('guce.create.financial.insuredValue')} name="insured_value" type="number" placeholder={t('guce.create.financial.insuredValuePlaceholder')} />
                            <Field label={t('guce.create.financial.netPremium')} name="net_premium" type="number" placeholder={t('guce.create.financial.netPremiumPlaceholder')} />
                            <Field label={t('guce.create.financial.totalPremium')} name="total_premium" type="number" placeholder={t('guce.create.financial.totalPremiumPlaceholder')} />
                            <div>
                                <label style={labelStyle}>{t('guce.create.financial.currency')}</label>
                                <select
                                    value={data.currency}
                                    onChange={e => setData('currency', e.target.value)}
                                    style={{ ...inputStyle }}>
                                    <option value="XOF">{t('guce.create.financial.currencyOptions.XOF')}</option>
                                    <option value="EUR">{t('guce.create.financial.currencyOptions.EUR')}</option>
                                    <option value="USD">{t('guce.create.financial.currencyOptions.USD')}</option>
                                    <option value="XAF">{t('guce.create.financial.currencyOptions.XAF')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
                            {t('guce.create.notes.title')}
                        </h2>
                        <textarea
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            placeholder={t('guce.create.notes.placeholder')}
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <Link href="/admin/guce-certificates">
                            <Button type="button" variant="outline">{tc('actions.cancel')}</Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            style={{ background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={15} />
                            {processing ? t('guce.create.importing') : t('guce.create.import')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
