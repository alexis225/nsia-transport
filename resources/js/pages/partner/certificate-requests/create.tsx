import { Head, Link, useForm } from '@inertiajs/react';
import { Upload, FileText, X, AlertCircle, ChevronLeft, Building2 } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mes demandes', href: '/partner/certificate-requests' },
    { title: 'Nouvelle demande', href: '/partner/certificate-requests/create' },
];

interface Country { code: string; name_fr: string; }
interface Tenant { id: string; name: string; code: string; }
interface Props {
    countries: Country[];
    tenant: Tenant | null;
    tenants: Tenant[];
}

const DOCUMENT_TYPES: { key: string; label: string; hint: string }[] = [
    { key: 'BL',                   label: 'BL (Bill of Lading)',    hint: 'Connaissement maritime' },
    { key: 'FACTURE',              label: 'Facture',                hint: 'Facture commerciale' },
    { key: 'FDI',                  label: 'FDI',                    hint: 'Fiche de déclaration d\'importation' },
    { key: 'DOCUMENTS_TRANSPORT',  label: 'Documents de transport', hint: 'LTA, CMR, bordereau...' },
    { key: 'AUTRE',                label: 'Autres justificatifs',   hint: 'Tout autre document utile' },
];

export default function PartnerCertificateRequestCreate({ countries, tenant, tenants }: Props) {
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const { data, setData, post, processing, errors } = useForm({
        tenant_id:          tenants.length > 0 ? (tenant?.id ?? '') : '',
        country_code:       '',
        insured_name:       '',
        voyage_from:        '',
        voyage_to:          '',
        voyage_date:        '',
        transport_type:     '',
        cargo_description:  '',
        estimated_value:    '',
        currency_code:      'XOF',
        notes:              '',
        documents:          [] as File[],
        document_types:     [] as string[],
    });

    function addFiles(type: string, files: FileList | null) {
        if (!files || files.length === 0) {
            return;
        }

        setData({
            ...data,
            documents:      [...data.documents, ...Array.from(files)],
            document_types: [...data.document_types, ...Array.from(files).map(() => type)],
        });
    }

    function removeFile(index: number) {
        setData({
            ...data,
            documents:      data.documents.filter((_, i) => i !== index),
            document_types: data.document_types.filter((_, i) => i !== index),
        });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('partner.certificate-requests.store'), { forceFormData: true });
    }

    const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '5px' };
    const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
    const errorStyle: React.CSSProperties = { color: '#dc2626', fontSize: '12px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' };
    const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle demande de certificat — NSIA Transport" />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <Link href={route('partner.certificate-requests.index')}>
                        <button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                            <ChevronLeft size={16} />
                        </button>
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Nouvelle demande de certificat</h1>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0' }}>Décrivez l'expédition et joignez vos pièces justificatives</p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={16} /> Filiale
                        </h2>
                        {tenants.length > 0 ? (
                            <div>
                                <select style={{ ...inputStyle, cursor: 'pointer' }} value={data.tenant_id} onChange={e => setData('tenant_id', e.target.value)}>
                                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                                </select>
                                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 6 }}>
                                    Vous opérez dans plusieurs filiales — sélectionnez celle concernée par cette demande
                                </div>
                                {errors.tenant_id && <p style={errorStyle}><AlertCircle size={12} />{errors.tenant_id}</p>}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#374151' }}>
                                {tenant ? `${tenant.name} (${tenant.code})` : '—'}
                                <span style={{ color: '#94a3b8', fontSize: 11.5 }}>— votre filiale de rattachement</span>
                            </div>
                        )}
                    </div>

                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Expédition</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Nom de l'assuré</label>
                                <input style={{ ...inputStyle, borderColor: errors.insured_name ? '#fca5a5' : '#e2e8f0' }}
                                       value={data.insured_name} onChange={e => setData('insured_name', e.target.value)} placeholder="Raison sociale de l'assuré" />
                                {errors.insured_name && <p style={errorStyle}><AlertCircle size={12} />{errors.insured_name}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Pays concerné</label>
                                <select style={{ ...inputStyle, cursor: 'pointer' }} value={data.country_code} onChange={e => setData('country_code', e.target.value)}>
                                    <option value="">Sélectionnez un pays</option>
                                    {countries.map(c => <option key={c.code} value={c.code}>{c.name_fr}</option>)}
                                </select>
                                {errors.country_code && <p style={errorStyle}><AlertCircle size={12} />{errors.country_code}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Lieu de départ</label>
                                <input style={inputStyle} value={data.voyage_from} onChange={e => setData('voyage_from', e.target.value)} placeholder="ex: Abidjan" />
                            </div>
                            <div>
                                <label style={labelStyle}>Lieu de destination</label>
                                <input style={inputStyle} value={data.voyage_to} onChange={e => setData('voyage_to', e.target.value)} placeholder="ex: Lomé" />
                            </div>
                            <div>
                                <label style={labelStyle}>Date du voyage</label>
                                <input type="date" style={inputStyle} value={data.voyage_date} onChange={e => setData('voyage_date', e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Mode de transport</label>
                                <select style={{ ...inputStyle, cursor: 'pointer' }} value={data.transport_type} onChange={e => setData('transport_type', e.target.value)}>
                                    <option value="">Non précisé</option>
                                    <option value="SEA">Maritime</option>
                                    <option value="AIR">Aérien</option>
                                    <option value="ROAD">Routier</option>
                                    <option value="RAIL">Ferroviaire</option>
                                    <option value="MULTIMODAL">Multimodal</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label style={labelStyle}>Description de la marchandise</label>
                                <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2}
                                          value={data.cargo_description} onChange={e => setData('cargo_description', e.target.value)}
                                          placeholder="Nature, quantité, conditionnement..." />
                            </div>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Valeur estimée</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Valeur estimée</label>
                                <input type="number" style={inputStyle} value={data.estimated_value} onChange={e => setData('estimated_value', e.target.value)} placeholder="ex: 5000000" />
                                {errors.estimated_value && <p style={errorStyle}><AlertCircle size={12} />{errors.estimated_value}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Devise</label>
                                <select style={{ ...inputStyle, cursor: 'pointer' }} value={data.currency_code} onChange={e => setData('currency_code', e.target.value)}>
                                    <option value="XOF">XOF</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="XAF">XAF</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                            Pièces justificatives <span style={{ color: '#dc2626' }}>*</span>
                        </h2>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>
                            Joignez au moins un document, réparti selon les catégories ci-dessous. PDF, JPG, PNG, DOC ou DOCX — 10 Mo max. par fichier.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {DOCUMENT_TYPES.map(docType => {
                                const files = data.documents
                                    .map((file, i) => ({ file, i }))
                                    .filter(({ i }) => data.document_types[i] === docType.key);

                                return (
                                    <div key={docType.key} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: files.length > 0 ? 10 : 0 }}>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{docType.label}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{docType.hint}</div>
                                            </div>
                                            <button type="button"
                                                    onClick={() => fileInputRefs.current[docType.key]?.click()}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', cursor: 'pointer', fontSize: 12, color: '#374151', fontWeight: 500 }}>
                                                <Upload size={13} /> Ajouter
                                            </button>
                                            <input ref={el => {
 fileInputRefs.current[docType.key] = el; 
}}
                                                   type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                   style={{ display: 'none' }} onChange={e => {
                                                        addFiles(docType.key, e.target.files);
                                                        e.target.value = '';
                                                    }} />
                                        </div>

                                        {files.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {files.map(({ file, i }) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
                                                        <FileText size={15} color="#16a34a" />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ margin: 0, fontWeight: 500, fontSize: 12, color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                                                            <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{(file.size / 1024).toFixed(0)} Ko</p>
                                                        </div>
                                                        <button type="button" onClick={() => removeFile(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}>
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {errors.documents && <p style={errorStyle}><AlertCircle size={12} />{errors.documents}</p>}
                    </div>

                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Notes complémentaires</h2>
                        <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
                                  value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Informations utiles pour le traitement de la demande..." />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <Link href={route('partner.certificate-requests.index')}>
                            <Button type="button" variant="outline">Annuler</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Upload size={15} />
                            {processing ? 'Envoi…' : 'Soumettre la demande'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
