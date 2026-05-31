import { useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { Upload, FileText, X, AlertCircle, ChevronLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Certificats GUCE', href: '/admin/guce-certificates' },
    { title: 'Importer', href: '/admin/guce-certificates/create' },
];

export default function GuceCertificatesCreate() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
        total_premium: '',
        notes: '',
        file: null as File | null,
    });

    function handleFile(file: File) {
        setSelectedFile(file);
        setData('file', file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }

    function removeFile() {
        setSelectedFile(null);
        setData('file', null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
            <Head title="Importer un certificat GUCE" />

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
                            Importer un certificat GUCE
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0' }}>
                            Uploadez le fichier et renseignez les références du certificat
                        </p>
                    </div>
                </div>

                <form onSubmit={submit}>

                    {/* Zone d'upload */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>
                            Fichier du certificat <span style={{ color: '#dc2626' }}>*</span>
                        </h2>

                        {selectedFile ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                                <FileText size={20} color="#16a34a" />
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#15803d' }}>{selectedFile.name}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                        {(selectedFile.size / 1024).toFixed(0)} Ko
                                    </p>
                                </div>
                                <button type="button" onClick={removeFile}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}>
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
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
                                    Glissez-déposez ou cliquez pour sélectionner
                                </p>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>
                                    PDF, DOC ou DOCX — 10 Mo maximum
                                </p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                        {errors.file && <p style={errorStyle}><AlertCircle size={12} />{errors.file}</p>}
                    </div>

                    {/* Références GUCE */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                            Références GUCE
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <Field label="Référence requête GUCE" name="guce_reference" required placeholder="ex: INS2024101765" />
                            <Field label="N° Certificat" name="certificate_number" required placeholder="ex: 41612024005384" />
                            <Field label="Application à la police N°" name="policy_number" placeholder="ex: 4300616200005F" />
                            <Field label="Référence FDI" name="fdi_reference" placeholder="ex: 240118075 DU 2024-08-22" />
                        </div>
                    </div>

                    {/* Assuré */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                            Assuré
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <Field label="Nom de l'assuré" name="insured_name" required placeholder="ex: SOS BOULONNERIE" />
                            <div>
                                <label style={labelStyle}>Adresse</label>
                                <textarea
                                    value={data.insured_address}
                                    onChange={e => setData('insured_address', e.target.value)}
                                    placeholder="01 BP 1262 ABIDJAN..."
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Transport & marchandises */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                            Transport & Marchandises
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <Field label="Navire / Moyen de transport" name="vessel" placeholder="ex: CMA CGM EIFFEL 0BAJFS1MA" />
                            <Field label="Date du voyage" name="transit_date" type="date" />
                            <Field label="Départ (Origine)" name="origin" placeholder="ex: France (LE HAVRE)" />
                            <Field label="Destination" name="destination" placeholder="ex: Cote d'Ivoire (ABIDJAN)" />
                            <div>
                                <label style={labelStyle}>Description des marchandises</label>
                                <textarea
                                    value={data.cargo_description}
                                    onChange={e => setData('cargo_description', e.target.value)}
                                    placeholder="1 Palettes DE FILMEE NOIR BOULONNERIE..."
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <Field label="Poids" name="weight" placeholder="ex: 228 kg" />
                                <Field label="Marques" name="marks" placeholder="ex: TGBU938632/7" />
                            </div>
                        </div>
                    </div>

                    {/* Valeurs financières */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                            Valeurs financières
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                            <Field label="Valeur assurée" name="insured_value" type="number" placeholder="ex: 1181398.24" />
                            <Field label="Prime totale" name="total_premium" type="number" placeholder="ex: 7500" />
                            <div>
                                <label style={labelStyle}>Devise</label>
                                <select
                                    value={data.currency}
                                    onChange={e => setData('currency', e.target.value)}
                                    style={{ ...inputStyle }}>
                                    <option value="XOF">XOF (Franc CFA)</option>
                                    <option value="EUR">EUR (Euro)</option>
                                    <option value="USD">USD (Dollar)</option>
                                    <option value="XAF">XAF (Franc CFA CEMAC)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
                            Notes
                        </h2>
                        <textarea
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            placeholder="Informations complémentaires..."
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <Link href="/admin/guce-certificates">
                            <Button type="button" variant="outline">Annuler</Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            style={{ background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={15} />
                            {processing ? 'Importation...' : 'Importer le certificat'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

const errorStyle: React.CSSProperties = {
    color: '#dc2626', fontSize: '12px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px',
};
