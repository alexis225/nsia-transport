import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronLeft, FileText, Download, Trash2, MessageSquare, Check, Award, FileQuestion, X, Upload, Send, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Document {
    id: string;
    file_original_name: string;
    file_size: number | null;
    document_type: string | null;
}

type RequestStatus = 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'INFO_REQUESTED' | 'COMPLETED' | 'APPROVED' | 'FULFILLED' | 'CLOSED' | 'REJECTED';

interface CertificateRequestDetail {
    id: string;
    reference: string | null;
    status: RequestStatus;
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
    info_requested_at: string | null;
    info_request_notes: string | null;
    completed_at: string | null;
    completion_notes: string | null;
    closed_at: string | null;
    assigned_to: { first_name: string; last_name: string } | null;
    assigned_at: string | null;
    reviewed_by: { first_name: string; last_name: string } | null;
    reviewed_at: string | null;
    certificate: { id: string; certificate_number: string; qr_token: string | null } | null;
    guce_certificate: { id: string; certificate_number: string; file_original_name: string } | null;
    created_at: string;
    submitted_at: string | null;
    documents: Document[];
}

interface Props { certificateRequest: CertificateRequestDetail; }

export default function PartnerCertificateRequestShow({ certificateRequest: cr }: Props) {
    const { t } = useTranslation('certificates');

    const STATUS_STYLES: Record<RequestStatus, { bg: string; color: string; label: string }> = {
        DRAFT:          { bg: '#f1f5f9', color: '#64748b', label: t('shared.requestStatus.DRAFT') },
        PENDING:        { bg: '#fffbeb', color: '#b45309', label: t('shared.requestStatus.PENDING') },
        IN_REVIEW:      { bg: '#eff6ff', color: '#1d4ed8', label: t('shared.requestStatus.IN_REVIEW') },
        INFO_REQUESTED: { bg: '#fff7ed', color: '#c2410c', label: t('shared.requestStatus.INFO_REQUESTED') },
        COMPLETED:      { bg: '#eef2ff', color: '#4338ca', label: t('shared.requestStatus.COMPLETED') },
        APPROVED:       { bg: '#f0fdf4', color: '#15803d', label: t('shared.requestStatus.APPROVED') },
        FULFILLED:      { bg: '#f0fdf4', color: '#15803d', label: t('shared.requestStatus.FULFILLED') },
        CLOSED:         { bg: '#f1f5f9', color: '#475569', label: t('shared.requestStatus.CLOSED') },
        REJECTED:       { bg: '#fef2f2', color: '#b91c1c', label: t('shared.requestStatus.REJECTED') },
    };

    const DOCUMENT_TYPE_LABELS: Record<string, string> = {
        BL: t('shared.documentType.BL'),
        FACTURE: t('shared.documentType.FACTURE'),
        FDI: t('shared.documentType.FDI'),
        DOCUMENTS_TRANSPORT: t('shared.documentType.DOCUMENTS_TRANSPORT'),
        AUTRE: t('shared.documentType.AUTRE'),
    };

    const TRANSPORT_LABELS: Record<string, string> = {
        SEA: t('shared.transport.SEA'), AIR: t('shared.transport.AIR'), ROAD: t('shared.transport.ROAD'),
        RAIL: t('shared.transport.RAIL'), MULTIMODAL: t('shared.transport.MULTIMODAL'),
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('partner.requests.index.breadcrumb'), href: '/partner/certificate-requests' },
        { title: cr.insured_name ?? t('partner.requests.show.defaultInsuredName'), href: `/partner/certificate-requests/${cr.id}` },
    ];

    const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const s = STATUS_STYLES[cr.status];

    function cancel() {
        if (!confirm(t('partner.requests.show.cancel.confirm'))) {
            return;
        }

        router.delete(route('partner.certificate-requests.destroy', { certificateRequest: cr.id }));
    }

    const completeForm = useForm({
        completion_notes: '',
        documents:        [] as File[],
        document_types:   [] as string[],
    });

    function addCompletionFiles(files: FileList | null) {
        if (!files || files.length === 0) return;

        completeForm.setData({
            ...completeForm.data,
            documents:      [...completeForm.data.documents, ...Array.from(files)],
            document_types: [...completeForm.data.document_types, ...Array.from(files).map(() => 'AUTRE')],
        });
    }

    function removeCompletionFile(index: number) {
        completeForm.setData({
            ...completeForm.data,
            documents:      completeForm.data.documents.filter((_, i) => i !== index),
            document_types: completeForm.data.document_types.filter((_, i) => i !== index),
        });
    }

    function submitCompletion(e: React.FormEvent) {
        e.preventDefault();
        completeForm.post(route('partner.certificate-requests.complete', { certificateRequest: cr.id }), { forceFormData: true });
    }

    // ── Brouillon : ajout de pièces avant transmission ─────────
    const draftDocsForm = useForm({ documents: [] as File[], document_types: [] as string[] });

    function addDraftFiles(type: string, files: FileList | null) {
        if (!files || files.length === 0) return;

        draftDocsForm.setData({
            ...draftDocsForm.data,
            documents:      [...draftDocsForm.data.documents, ...Array.from(files)],
            document_types: [...draftDocsForm.data.document_types, ...Array.from(files).map(() => type)],
        });
    }

    function removeDraftFile(index: number) {
        draftDocsForm.setData({
            ...draftDocsForm.data,
            documents:      draftDocsForm.data.documents.filter((_, i) => i !== index),
            document_types: draftDocsForm.data.document_types.filter((_, i) => i !== index),
        });
    }

    function saveDraftDocs(e: React.FormEvent) {
        e.preventDefault();
        draftDocsForm.post(route('partner.certificate-requests.update', { certificateRequest: cr.id }), {
            forceFormData: true,
            onSuccess: () => draftDocsForm.reset(),
        });
    }

    function submitDraft() {
        if (cr.documents.length + draftDocsForm.data.documents.length === 0) {
            alert(t('partner.requests.show.draft.needDocuments'));
            return;
        }
        if (!confirm(t('partner.requests.show.draft.confirmSubmit'))) return;

        router.post(route('partner.certificate-requests.submit', { certificateRequest: cr.id }));
    }

    const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '20px' };
    const labelStyle: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3, display: 'block' };
    const valueStyle: React.CSSProperties = { fontSize: 13, color: '#1e293b' };

    const timelineSteps = [
        { label: t('partner.requests.show.timeline.submitted'), done: !!cr.submitted_at, date: cr.submitted_at, by: null as string | null },
        { label: t('partner.requests.show.timeline.assigned'), done: !!cr.assigned_at, date: cr.assigned_at, by: cr.assigned_to ? `${cr.assigned_to.first_name} ${cr.assigned_to.last_name}` : null },
        ...(cr.info_requested_at ? [{
            label: t('partner.requests.show.timeline.infoRequested'),
            done: true,
            date: cr.info_requested_at,
            by: cr.completed_at ? t('partner.requests.show.timeline.completedOn', { date: fmt(cr.completed_at) }) : t('partner.requests.show.timeline.toComplete'),
        }] : []),
        {
            label: cr.status === 'REJECTED' ? t('partner.requests.show.timeline.rejected') : t('partner.requests.show.timeline.approved'),
            done: !!cr.reviewed_at,
            date: cr.reviewed_at,
            by: cr.reviewed_by ? `${cr.reviewed_by.first_name} ${cr.reviewed_by.last_name}` : null,
        },
        {
            label: t('partner.requests.show.timeline.issued'),
            done: !!(cr.certificate || cr.guce_certificate),
            date: null,
            by: cr.certificate ? t('partner.requests.show.timeline.issuedNumber', { number: cr.certificate.certificate_number }) : (cr.guce_certificate ? t('partner.requests.show.timeline.issuedNumber', { number: cr.guce_certificate.certificate_number }) : null),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('partner.requests.show.title', { name: cr.insured_name ?? '' })} />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href={route('partner.certificate-requests.index')}>
                            <button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                <ChevronLeft size={16} />
                            </button>
                        </Link>
                        <div>
                            <h1 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{cr.insured_name ?? t('partner.requests.show.defaultInsuredName')}</h1>
                            <p style={{ color: '#64748b', fontSize: '12.5px', margin: '2px 0 0' }}>
                                {cr.reference ? <>{t('partner.requests.show.reference', { reference: cr.reference })} </> : null}
                                {cr.status === 'DRAFT' ? t('partner.requests.show.draftSaved') : t('partner.requests.show.submittedOn', { date: fmt(cr.created_at) })}
                            </p>
                        </div>
                    </div>
                    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '5px 14px', fontSize: 12.5, fontWeight: 600 }}>{s.label}</span>
                </div>

                {/* Timeline de suivi */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>{t('partner.requests.show.timeline.title')}</h2>
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

                {cr.status === 'DRAFT' && (
                    <div style={{ ...cardStyle, background: '#f8fafc', borderColor: '#e2e8f0' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
                            <AlertCircle size={16} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{t('partner.requests.show.draft.title')}</div>
                                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>
                                    {t('partner.requests.show.draft.hint')}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={saveDraftDocs}>
                            {draftDocsForm.data.documents.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                    {draftDocsForm.data.documents.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                                            <FileText size={14} color="#334155" />
                                            <span style={{ flex: 1, fontSize: 12, color: '#334155' }}>{f.name}</span>
                                            <button type="button" onClick={() => removeDraftFile(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: '#334155', border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', background: '#fff' }}>
                                    <Upload size={14} /> {t('partner.requests.show.draft.addDocuments')}
                                    <input type="file" multiple hidden onChange={e => { addDraftFiles('AUTRE', e.target.files); e.target.value = ''; }} />
                                </label>
                                {draftDocsForm.data.documents.length > 0 && (
                                    <Button type="submit" disabled={draftDocsForm.processing} variant="outline">
                                        {t('partner.requests.show.draft.saveDocuments')}
                                    </Button>
                                )}
                                <Button type="button" onClick={submitDraft} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                                    <Send size={14} /> {t('partner.requests.show.draft.submit')}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {(cr.certificate || cr.guce_certificate) && (
                    <div style={{ ...cardStyle, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#15803d', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Award size={16} /> {t('partner.requests.show.available.title')}
                        </h2>
                        <p style={{ fontSize: 13, color: '#166534', margin: '0 0 12px' }}>
                            {t('partner.requests.show.available.number', { number: cr.certificate ? cr.certificate.certificate_number : cr.guce_certificate?.certificate_number })}
                        </p>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            {cr.certificate && (
                                <>
                                    <a href={route('partner.certificate-requests.certificate.download', { certificateRequest: cr.id })}
                                       style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#15803d', fontWeight: 600, textDecoration: 'none' }}>
                                        <Download size={13} /> {t('partner.requests.show.available.download')}
                                    </a>
                                    {cr.certificate.qr_token && (
                                        <a href={route('certificate.verify', { token: cr.certificate.qr_token })} target="_blank" rel="noreferrer"
                                           style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#15803d', fontWeight: 500, textDecoration: 'none' }}>
                                            {t('partner.requests.show.available.verify')}
                                        </a>
                                    )}
                                </>
                            )}
                            {cr.guce_certificate && (
                                <a href={route('partner.certificate-requests.guce-certificate.download', { certificateRequest: cr.id })}
                                   style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#15803d', fontWeight: 600, textDecoration: 'none' }}>
                                    <Download size={13} /> {t('partner.requests.show.available.download')}
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {cr.status === 'INFO_REQUESTED' && (
                    <div style={{ ...cardStyle, background: '#fff7ed', borderColor: '#fed7aa' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
                            <FileQuestion size={16} color="#c2410c" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#9a3412' }}>{t('partner.requests.show.infoRequested.title')}</div>
                                <div style={{ fontSize: 12.5, color: '#9a3412', marginTop: 3 }}>{cr.info_request_notes}</div>
                            </div>
                        </div>

                        <form onSubmit={submitCompletion}>
                            <textarea
                                value={completeForm.data.completion_notes}
                                onChange={e => completeForm.setData('completion_notes', e.target.value)}
                                placeholder={t('partner.requests.show.infoRequested.notesPlaceholder')}
                                rows={2}
                                style={{ width: '100%', padding: '8px 10px', border: '1px solid #fed7aa', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: 10, background: '#fff' }}
                            />

                            {completeForm.data.documents.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                    {completeForm.data.documents.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff', border: '1px solid #fed7aa', borderRadius: 6 }}>
                                            <FileText size={14} color="#9a3412" />
                                            <span style={{ flex: 1, fontSize: 12, color: '#7c2d12' }}>{f.name}</span>
                                            <button type="button" onClick={() => removeCompletionFile(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9a3412', display: 'flex' }}>
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: '#9a3412', border: '1px solid #fed7aa', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', background: '#fff' }}>
                                    <Upload size={14} /> {t('partner.requests.show.infoRequested.addDocuments')}
                                    <input type="file" multiple hidden onChange={e => { addCompletionFiles(e.target.files); e.target.value = ''; }} />
                                </label>
                                <Button type="submit" disabled={completeForm.processing} className="bg-[#c2410c] hover:bg-[#9a3412] text-white">
                                    {t('partner.requests.show.infoRequested.submit')}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {cr.status === 'REJECTED' && cr.review_notes && (
                    <div style={{ ...cardStyle, background: '#fef2f2', borderColor: '#fecaca' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <MessageSquare size={16} color="#b91c1c" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#991b1b' }}>{t('partner.requests.show.rejected.title')}</div>
                                <div style={{ fontSize: 12.5, color: '#991b1b', marginTop: 3 }}>{cr.review_notes}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={cardStyle}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>{t('partner.requests.show.shipment.title')}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div><span style={labelStyle}>{t('partner.requests.show.shipment.country')}</span><span style={valueStyle}>{cr.country_code ?? '—'}</span></div>
                        <div><span style={labelStyle}>{t('partner.requests.show.shipment.transportMode')}</span><span style={valueStyle}>{cr.transport_type ? TRANSPORT_LABELS[cr.transport_type] : '—'}</span></div>
                        <div><span style={labelStyle}>{t('partner.requests.show.shipment.route')}</span><span style={valueStyle}>{cr.voyage_from && cr.voyage_to ? `${cr.voyage_from} → ${cr.voyage_to}` : '—'}</span></div>
                        <div><span style={labelStyle}>{t('partner.requests.show.shipment.date')}</span><span style={valueStyle}>{cr.voyage_date ? fmt(cr.voyage_date) : '—'}</span></div>
                        <div style={{ gridColumn: '1/-1' }}><span style={labelStyle}>{t('partner.requests.show.shipment.cargo')}</span><span style={valueStyle}>{cr.cargo_description ?? '—'}</span></div>
                        <div><span style={labelStyle}>{t('partner.requests.show.shipment.estimatedValue')}</span><span style={valueStyle}>{cr.estimated_value ? `${Number(cr.estimated_value).toLocaleString('fr-FR')} ${cr.currency_code ?? ''}` : '—'}</span></div>
                    </div>
                    {cr.notes && (
                        <div style={{ marginTop: 16 }}>
                            <span style={labelStyle}>{t('partner.requests.show.shipment.notes')}</span>
                            <span style={valueStyle}>{cr.notes}</span>
                        </div>
                    )}
                </div>

                <div style={cardStyle}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>{t('partner.requests.show.documents.title')}</h2>
                    {cr.documents.length === 0 ? (
                        <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0 }}>{t('partner.requests.show.documents.empty')}</p>
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
                                        {doc.file_size && <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8' }}>{t('partner.requests.show.documents.sizeKo', { size: (doc.file_size / 1024).toFixed(0) })}</p>}
                                    </div>
                                    <a href={route('partner.certificate-requests.documents.download', { certificateRequest: cr.id, document: doc.id })}>
                                        <button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer', color: '#16a34a' }}>
                                            <Download size={14} />
                                        </button>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href={route('partner.certificate-requests.index')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
                        <ChevronLeft size={14} /> {t('partner.requests.show.backToList')}
                    </Link>
                    {(cr.status === 'DRAFT' || cr.status === 'PENDING') && (
                        <Button variant="outline" onClick={cancel} style={{ color: '#dc2626', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Trash2 size={14} /> {cr.status === 'DRAFT' ? t('partner.requests.show.cancel.deleteDraft') : t('partner.requests.show.cancel.cancelRequest')}
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
