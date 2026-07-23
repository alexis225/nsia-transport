import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, FileText, Download, CheckCircle2, XCircle, Briefcase, UserCheck, Award, Link2, Check, Plus, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Document {
    id: string;
    file_original_name: string;
    file_size: number | null;
    document_type: string | null;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    BL: 'BL (Bill of Lading)',
    FACTURE: 'Facture',
    FDI: 'FDI',
    DOCUMENTS_TRANSPORT: 'Document de transport',
    AUTRE: 'Autre justificatif',
};

interface CertificateRequestDetail {
    id: string;
    status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
    country_code: string | null;
    insured_name: string | null;
    voyage_from: string | null;
    voyage_to: string | null;
    voyage_date: string | null;
    transport_type: string | null;
    cargo_description: string | null;
    estimated_value: string | null;
    currency_code: string | null;
    notes: string | null;
    review_notes: string | null;
    created_at: string;
    assigned_at: string | null;
    reviewed_at: string | null;
    broker: { id: string; name: string; code: string; type: string } | null;
    created_by: { first_name: string; last_name: string; email: string } | null;
    assigned_to: { first_name: string; last_name: string } | null;
    reviewed_by: { first_name: string; last_name: string } | null;
    certificate: { id: string; certificate_number: string; status: string } | null;
    guce_certificate: { id: string; certificate_number: string; insured_name: string } | null;
    documents: Document[];
}

interface AvailableCertificate { id: string; certificate_number: string; insured_name: string; }

interface Props {
    certificateRequest: CertificateRequestDetail;
    availableCertificates: AvailableCertificate[];
    availableGuceCertificates: AvailableCertificate[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:   { bg: '#fffbeb', color: '#b45309', label: 'En attente' },
    IN_REVIEW: { bg: '#eff6ff', color: '#1d4ed8', label: "En cours d'examen" },
    APPROVED:  { bg: '#f0fdf4', color: '#15803d', label: 'Approuvée' },
    REJECTED:  { bg: '#fef2f2', color: '#b91c1c', label: 'Rejetée' },
};

const TRANSPORT_LABELS: Record<string, string> = {
    SEA: 'Maritime', AIR: 'Aérien', ROAD: 'Routier', RAIL: 'Ferroviaire', MULTIMODAL: 'Multimodal',
};

export default function AdminCertificateRequestShow({ certificateRequest: cr, availableCertificates, availableGuceCertificates }: Props) {
    const [reviewNotes, setReviewNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [selectedCertificateId, setSelectedCertificateId] = useState('');
    const [selectedGuceCertificateId, setSelectedGuceCertificateId] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Demandes partenaires', href: '/admin/certificate-requests' },
        { title: cr.insured_name ?? 'Demande', href: `/admin/certificate-requests/${cr.id}` },
    ];

    const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const s = STATUS_STYLES[cr.status];
    const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' };
    const labelStyle: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3, display: 'block' };
    const valueStyle: React.CSSProperties = { fontSize: 13, color: '#1e293b' };

    function assign() {
        setProcessing(true);
        router.patch(route('admin.certificate-requests.assign', { certificateRequest: cr.id }), {}, { onFinish: () => setProcessing(false) });
    }

    function approve() {
        setProcessing(true);
        router.patch(route('admin.certificate-requests.approve', { certificateRequest: cr.id }), { review_notes: reviewNotes }, { onFinish: () => setProcessing(false) });
    }

    function reject() {
        if (!reviewNotes.trim()) {
            alert('Merci de préciser un motif de rejet.');

            return;
        }

        setProcessing(true);
        router.patch(route('admin.certificate-requests.reject', { certificateRequest: cr.id }), { review_notes: reviewNotes }, { onFinish: () => setProcessing(false) });
    }

    function linkCertificate() {
        if (!selectedCertificateId) {
            return;
        }

        setProcessing(true);
        router.patch(route('admin.certificate-requests.link-certificate', { certificateRequest: cr.id }), { certificate_id: selectedCertificateId }, { onFinish: () => setProcessing(false) });
    }

    function linkGuceCertificate() {
        if (!selectedGuceCertificateId) {
            return;
        }

        setProcessing(true);
        router.patch(route('admin.certificate-requests.link-certificate', { certificateRequest: cr.id }), { guce_certificate_id: selectedGuceCertificateId }, { onFinish: () => setProcessing(false) });
    }

    const timelineSteps = [
        { label: 'Demande soumise', done: true, date: cr.created_at, by: cr.created_by ? `${cr.created_by.first_name} ${cr.created_by.last_name}` : null },
        { label: 'Prise en charge', done: !!cr.assigned_at, date: cr.assigned_at, by: cr.assigned_to ? `${cr.assigned_to.first_name} ${cr.assigned_to.last_name}` : null },
        {
            label: cr.status === 'REJECTED' ? 'Demande rejetée' : 'Demande approuvée',
            done: !!cr.reviewed_at,
            date: cr.reviewed_at,
            by: cr.reviewed_by ? `${cr.reviewed_by.first_name} ${cr.reviewed_by.last_name}` : null,
        },
        {
            label: 'Certificat disponible',
            done: !!(cr.certificate || cr.guce_certificate),
            date: null,
            by: cr.certificate ? `N° ${cr.certificate.certificate_number}` : (cr.guce_certificate ? `N° ${cr.guce_certificate.certificate_number} (GUCE)` : null),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Demande — ${cr.insured_name ?? ''} — NSIA Transport`} />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href={route('admin.certificate-requests.index')}>
                            <button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                <ChevronLeft size={16} />
                            </button>
                        </Link>
                        <div>
                            <h1 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{cr.insured_name ?? 'Demande de certificat'}</h1>
                            <p style={{ color: '#64748b', fontSize: '12.5px', margin: '2px 0 0' }}>Soumise le {fmt(cr.created_at)} par {cr.created_by ? `${cr.created_by.first_name} ${cr.created_by.last_name}` : '—'}</p>
                        </div>
                    </div>
                    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '5px 14px', fontSize: 12.5, fontWeight: 600 }}>{s.label}</span>
                </div>

                {/* Timeline de suivi de bout en bout */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Suivi de la demande</h2>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {timelineSteps.map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: step.done ? '#16a34a' : '#e2e8f0', color: '#fff', flexShrink: 0,
                                    }}>
                                        {step.done && <Check size={13} />}
                                    </div>
                                    {i < timelineSteps.length - 1 && (
                                        <div style={{ width: 2, flex: 1, minHeight: 24, background: timelineSteps[i + 1].done ? '#16a34a' : '#e2e8f0' }} />
                                    )}
                                </div>
                                <div style={{ paddingBottom: 18 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: step.done ? '#0f172a' : '#94a3b8' }}>{step.label}</div>
                                    {step.done && (
                                        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                                            {step.date && fmt(step.date)}{step.date && step.by ? ' — ' : ''}{step.by ?? ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={cardStyle}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Briefcase size={16} /> Courtier / Partenaire
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div><span style={labelStyle}>Nom</span><span style={valueStyle}>{cr.broker?.name ?? '—'}</span></div>
                        <div><span style={labelStyle}>Code</span><span style={valueStyle}>{cr.broker?.code ?? '—'}</span></div>
                        <div><span style={labelStyle}>Email de contact</span><span style={valueStyle}>{cr.created_by?.email ?? '—'}</span></div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Expédition</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div><span style={labelStyle}>Pays concerné</span><span style={valueStyle}>{cr.country_code ?? '—'}</span></div>
                        <div><span style={labelStyle}>Mode de transport</span><span style={valueStyle}>{cr.transport_type ? TRANSPORT_LABELS[cr.transport_type] : '—'}</span></div>
                        <div><span style={labelStyle}>Trajet</span><span style={valueStyle}>{cr.voyage_from && cr.voyage_to ? `${cr.voyage_from} → ${cr.voyage_to}` : '—'}</span></div>
                        <div><span style={labelStyle}>Date du voyage</span><span style={valueStyle}>{cr.voyage_date ? fmt(cr.voyage_date) : '—'}</span></div>
                        <div style={{ gridColumn: '1/-1' }}><span style={labelStyle}>Marchandise</span><span style={valueStyle}>{cr.cargo_description ?? '—'}</span></div>
                        <div><span style={labelStyle}>Valeur estimée</span><span style={valueStyle}>{cr.estimated_value ? `${Number(cr.estimated_value).toLocaleString('fr-FR')} ${cr.currency_code ?? ''}` : '—'}</span></div>
                    </div>
                    {cr.notes && (
                        <div style={{ marginTop: 16 }}>
                            <span style={labelStyle}>Notes du partenaire</span>
                            <span style={valueStyle}>{cr.notes}</span>
                        </div>
                    )}
                </div>

                <div style={cardStyle}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>Pièces justificatives</h2>
                    {cr.documents.length === 0 ? (
                        <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0 }}>Aucun document joint.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {cr.documents.map(doc => (
                                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                                    <FileText size={17} color="#64748b" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <p style={{ margin: 0, fontWeight: 500, fontSize: 12.5, color: '#0f172a' }}>{doc.file_original_name}</p>
                                            {doc.document_type && (
                                                <span style={{ fontSize: 10.5, fontWeight: 500, color: '#3b82f6', background: '#eff6ff', borderRadius: 10, padding: '1px 7px' }}>
                                                    {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                                                </span>
                                            )}
                                        </div>
                                        {doc.file_size && <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8' }}>{(doc.file_size / 1024).toFixed(0)} Ko</p>}
                                    </div>
                                    <a href={route('admin.certificate-requests.documents.download', { certificateRequest: cr.id, document: doc.id })}>
                                        <button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer', color: '#16a34a' }}>
                                            <Download size={14} />
                                        </button>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {(cr.status === 'PENDING' || cr.status === 'IN_REVIEW') && (
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Traitement</h2>

                        {cr.status === 'PENDING' && (
                            <div style={{ marginBottom: 16 }}>
                                <Button onClick={assign} disabled={processing} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <UserCheck size={15} /> Prendre en charge
                                </Button>
                            </div>
                        )}

                        <textarea
                            value={reviewNotes}
                            onChange={e => setReviewNotes(e.target.value)}
                            placeholder="Notes de traitement (obligatoire en cas de rejet)..."
                            rows={3}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: 14 }}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <Button onClick={approve} disabled={processing} className="bg-[#16a34a] hover:bg-[#15803d] text-white" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CheckCircle2 size={15} /> Approuver
                            </Button>
                            <Button onClick={reject} disabled={processing} variant="outline" style={{ color: '#dc2626', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <XCircle size={15} /> Rejeter
                            </Button>
                        </div>
                    </div>
                )}

                {cr.status === 'APPROVED' && !cr.certificate && !cr.guce_certificate && (
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Link2 size={16} /> Génération ou importation du certificat
                        </h2>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px' }}>
                            Créez le certificat depuis un contrat actif, ou importez-le depuis la plateforme GUCE, puis rattachez-le ici pour mettre le certificat à disposition du partenaire.
                        </p>

                        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                            <Link href="/admin/certificates/create">
                                <Button type="button" variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Plus size={14} /> Créer un certificat
                                </Button>
                            </Link>
                            <Link href="/admin/guce-certificates/create">
                                <Button type="button" variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Upload size={14} /> Importer un certificat GUCE
                                </Button>
                            </Link>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <select value={selectedCertificateId} onChange={e => setSelectedCertificateId(e.target.value)}
                                        style={{ flex: 1, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                    <option value="">Rattacher un certificat émis...</option>
                                    {availableCertificates.map(c => (
                                        <option key={c.id} value={c.id}>{c.certificate_number} — {c.insured_name}</option>
                                    ))}
                                </select>
                                <Button onClick={linkCertificate} disabled={processing || !selectedCertificateId} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white">
                                    Rattacher
                                </Button>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <select value={selectedGuceCertificateId} onChange={e => setSelectedGuceCertificateId(e.target.value)}
                                        style={{ flex: 1, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                    <option value="">Rattacher un certificat GUCE importé...</option>
                                    {availableGuceCertificates.map(c => (
                                        <option key={c.id} value={c.id}>{c.certificate_number} — {c.insured_name}</option>
                                    ))}
                                </select>
                                <Button onClick={linkGuceCertificate} disabled={processing || !selectedGuceCertificateId} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white">
                                    Rattacher
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {(cr.certificate || cr.guce_certificate) && (
                    <div style={{ ...cardStyle, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#15803d', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Award size={16} /> Certificat disponible {cr.guce_certificate && !cr.certificate ? '(importé GUCE)' : ''}
                        </h2>
                        <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>
                            N° {cr.certificate ? cr.certificate.certificate_number : cr.guce_certificate?.certificate_number}
                        </p>
                        {cr.certificate && (
                            <Link href={`/admin/certificates/${cr.certificate.id}`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#15803d', fontWeight: 500, marginTop: 8, textDecoration: 'none' }}>
                                Voir le certificat →
                            </Link>
                        )}
                        {cr.guce_certificate && (
                            <Link href={`/admin/guce-certificates/${cr.guce_certificate.id}`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#15803d', fontWeight: 500, marginTop: 8, textDecoration: 'none' }}>
                                Voir le certificat GUCE →
                            </Link>
                        )}
                        <p style={{ fontSize: 11.5, color: '#166534', marginTop: 10, opacity: .8 }}>Le partenaire a été notifié et peut le télécharger depuis son espace.</p>
                    </div>
                )}

                {cr.status !== 'PENDING' && cr.status !== 'IN_REVIEW' && cr.review_notes && (
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Notes de traitement</h2>
                        <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{cr.review_notes}</p>
                        {cr.reviewed_by && <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '8px 0 0' }}>Par {cr.reviewed_by.first_name} {cr.reviewed_by.last_name}</p>}
                    </div>
                )}

                <Link href={route('admin.certificate-requests.index')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
                    <ChevronLeft size={14} /> Retour aux demandes
                </Link>
            </div>
        </AppLayout>
    );
}
