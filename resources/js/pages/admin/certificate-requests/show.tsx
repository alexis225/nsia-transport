import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    FileText,
    Download,
    CheckCircle2,
    XCircle,
    Briefcase,
    UserCheck,
    Award,
    Link2,
    Check,
    Plus,
    Upload,
    FileQuestion,
    Archive,
} from 'lucide-react';
import { useState } from 'react';
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

type RequestStatus =
    | 'PENDING'
    | 'IN_REVIEW'
    | 'INFO_REQUESTED'
    | 'COMPLETED'
    | 'APPROVED'
    | 'FULFILLED'
    | 'CLOSED'
    | 'REJECTED';

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
    created_at: string;
    assigned_at: string | null;
    reviewed_at: string | null;
    broker: { id: string; name: string; code: string; type: string } | null;
    created_by: { first_name: string; last_name: string; email: string } | null;
    assigned_to: { first_name: string; last_name: string } | null;
    reviewed_by: { first_name: string; last_name: string } | null;
    certificate: {
        id: string;
        certificate_number: string;
        status: string;
    } | null;
    guce_certificate: {
        id: string;
        certificate_number: string;
        insured_name: string;
    } | null;
    documents: Document[];
}

interface AvailableCertificate {
    id: string;
    certificate_number: string;
    insured_name: string;
}

interface Props {
    certificateRequest: CertificateRequestDetail;
    availableCertificates: AvailableCertificate[];
    availableGuceCertificates: AvailableCertificate[];
}

export default function AdminCertificateRequestShow({
    certificateRequest: cr,
    availableCertificates,
    availableGuceCertificates,
}: Props) {
    const { t } = useTranslation('certificates');

    const STATUS_STYLES: Record<
        RequestStatus,
        { bg: string; color: string; label: string }
    > = {
        PENDING: {
            bg: '#fffbeb',
            color: '#b45309',
            label: t('shared.requestStatus.PENDING'),
        },
        IN_REVIEW: {
            bg: '#eff6ff',
            color: '#1d4ed8',
            label: t('shared.requestStatus.IN_REVIEW'),
        },
        INFO_REQUESTED: {
            bg: '#fff7ed',
            color: '#c2410c',
            label: t('shared.requestStatus.INFO_REQUESTED'),
        },
        COMPLETED: {
            bg: '#eef2ff',
            color: '#4338ca',
            label: t('shared.requestStatus.COMPLETED'),
        },
        APPROVED: {
            bg: '#f0fdf4',
            color: '#15803d',
            label: t('shared.requestStatus.APPROVED'),
        },
        FULFILLED: {
            bg: '#f0fdf4',
            color: '#15803d',
            label: t('shared.requestStatus.FULFILLED'),
        },
        CLOSED: {
            bg: '#f1f5f9',
            color: '#475569',
            label: t('shared.requestStatus.CLOSED'),
        },
        REJECTED: {
            bg: '#fef2f2',
            color: '#b91c1c',
            label: t('shared.requestStatus.REJECTED'),
        },
    };

    const DOCUMENT_TYPE_LABELS: Record<string, string> = {
        BL: t('shared.documentType.BL'),
        FACTURE: t('shared.documentType.FACTURE'),
        FDI: t('shared.documentType.FDI'),
        DOCUMENTS_TRANSPORT: t('shared.documentType.DOCUMENTS_TRANSPORT'),
        AUTRE: t('shared.documentType.AUTRE'),
    };

    const TRANSPORT_LABELS: Record<string, string> = {
        SEA: t('shared.transport.SEA'),
        AIR: t('shared.transport.AIR'),
        ROAD: t('shared.transport.ROAD'),
        RAIL: t('shared.transport.RAIL'),
        MULTIMODAL: t('shared.transport.MULTIMODAL'),
    };

    const [reviewNotes, setReviewNotes] = useState('');
    const [infoRequestNotes, setInfoRequestNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [selectedCertificateId, setSelectedCertificateId] = useState('');
    const [selectedGuceCertificateId, setSelectedGuceCertificateId] =
        useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('requests.index.breadcrumb'),
            href: '/admin/certificate-requests',
        },
        {
            title: cr.insured_name ?? t('requests.show.defaultTitle'),
            href: `/admin/certificate-requests/${cr.id}`,
        },
    ];

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    const s = STATUS_STYLES[cr.status];
    const cardStyle: React.CSSProperties = {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: 10.5,
        fontWeight: 600,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        marginBottom: 3,
        display: 'block',
    };
    const valueStyle: React.CSSProperties = { fontSize: 13, color: '#1e293b' };

    function assign() {
        setProcessing(true);
        router.patch(
            route('admin.certificate-requests.assign', {
                certificateRequest: cr.id,
            }),
            {},
            { onFinish: () => setProcessing(false) },
        );
    }

    function approve() {
        setProcessing(true);
        router.patch(
            route('admin.certificate-requests.approve', {
                certificateRequest: cr.id,
            }),
            { review_notes: reviewNotes },
            { onFinish: () => setProcessing(false) },
        );
    }

    function reject() {
        if (!reviewNotes.trim()) {
            alert(t('requests.show.processing.rejectReasonRequired'));

            return;
        }

        setProcessing(true);
        router.patch(
            route('admin.certificate-requests.reject', {
                certificateRequest: cr.id,
            }),
            { review_notes: reviewNotes },
            { onFinish: () => setProcessing(false) },
        );
    }

    function requestInfo() {
        if (!infoRequestNotes.trim()) {
            alert(t('requests.show.processing.infoNotesRequired'));

            return;
        }

        setProcessing(true);
        router.patch(
            route('admin.certificate-requests.request-info', {
                certificateRequest: cr.id,
            }),
            { info_request_notes: infoRequestNotes },
            { onFinish: () => setProcessing(false) },
        );
    }

    function close() {
        setProcessing(true);
        router.patch(
            route('admin.certificate-requests.close', {
                certificateRequest: cr.id,
            }),
            {},
            { onFinish: () => setProcessing(false) },
        );
    }

    function linkCertificate() {
        if (!selectedCertificateId) {
            return;
        }

        setProcessing(true);
        router.patch(
            route('admin.certificate-requests.link-certificate', {
                certificateRequest: cr.id,
            }),
            { certificate_id: selectedCertificateId },
            { onFinish: () => setProcessing(false) },
        );
    }

    function linkGuceCertificate() {
        if (!selectedGuceCertificateId) {
            return;
        }

        setProcessing(true);
        router.patch(
            route('admin.certificate-requests.link-certificate', {
                certificateRequest: cr.id,
            }),
            { guce_certificate_id: selectedGuceCertificateId },
            { onFinish: () => setProcessing(false) },
        );
    }

    const timelineSteps = [
        {
            label: t('requests.show.timeline.submitted'),
            done: true,
            date: cr.created_at,
            by: cr.created_by
                ? `${cr.created_by.first_name} ${cr.created_by.last_name}`
                : null,
        },
        {
            label: t('requests.show.timeline.assigned'),
            done: !!cr.assigned_at,
            date: cr.assigned_at,
            by: cr.assigned_to
                ? `${cr.assigned_to.first_name} ${cr.assigned_to.last_name}`
                : null,
        },
        ...(cr.info_requested_at
            ? [
                  {
                      label: t('requests.show.timeline.infoRequested'),
                      done: true,
                      date: cr.info_requested_at,
                      by: cr.completed_at
                          ? t('requests.show.timeline.completedOn', {
                                date: fmt(cr.completed_at),
                            })
                          : t('requests.show.timeline.waitingPartner'),
                  },
              ]
            : []),
        {
            label:
                cr.status === 'REJECTED'
                    ? t('requests.show.timeline.rejected')
                    : t('requests.show.timeline.approved'),
            done: !!cr.reviewed_at,
            date: cr.reviewed_at,
            by: cr.reviewed_by
                ? `${cr.reviewed_by.first_name} ${cr.reviewed_by.last_name}`
                : null,
        },
        {
            label: t('requests.show.timeline.issued'),
            done: !!(cr.certificate || cr.guce_certificate),
            date: null,
            by: cr.certificate
                ? t('requests.show.timeline.issuedNumber', {
                      number: cr.certificate.certificate_number,
                  })
                : cr.guce_certificate
                  ? t('requests.show.timeline.issuedNumberGuce', {
                        number: cr.guce_certificate.certificate_number,
                    })
                  : null,
        },
        {
            label: t('requests.show.timeline.closed'),
            done: !!cr.closed_at,
            date: cr.closed_at,
            by: null,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={t('requests.show.title', {
                    name: cr.insured_name ?? '',
                })}
            />

            <div
                style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '24px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <Link href={route('admin.certificate-requests.index')}>
                            <button
                                style={{
                                    border: '1px solid #e2e8f0',
                                    background: '#fff',
                                    borderRadius: '6px',
                                    padding: '6px 8px',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    display: 'flex',
                                }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </Link>
                        <div>
                            <h1
                                style={{
                                    fontSize: '19px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    margin: 0,
                                }}
                            >
                                {cr.insured_name ??
                                    t('requests.show.defaultInsuredName')}
                            </h1>
                            <p
                                style={{
                                    color: '#64748b',
                                    fontSize: '12.5px',
                                    margin: '2px 0 0',
                                }}
                            >
                                {cr.reference ? (
                                    <>
                                        {t('requests.show.reference', {
                                            reference: cr.reference,
                                        })}{' '}
                                    </>
                                ) : null}
                                {t('requests.show.submittedOn', {
                                    date: fmt(cr.created_at),
                                    name: cr.created_by
                                        ? `${cr.created_by.first_name} ${cr.created_by.last_name}`
                                        : '—',
                                })}
                            </p>
                        </div>
                    </div>
                    <span
                        style={{
                            background: s.bg,
                            color: s.color,
                            borderRadius: 20,
                            padding: '5px 14px',
                            fontSize: 12.5,
                            fontWeight: 600,
                        }}
                    >
                        {s.label}
                    </span>
                </div>

                {/* Timeline de suivi de bout en bout */}
                <div style={cardStyle}>
                    <h2
                        style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: '0 0 16px',
                        }}
                    >
                        {t('requests.show.timeline.title')}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {timelineSteps.map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12 }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: step.done
                                                ? '#16a34a'
                                                : '#e2e8f0',
                                            color: '#fff',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {step.done && <Check size={13} />}
                                    </div>
                                    {i < timelineSteps.length - 1 && (
                                        <div
                                            style={{
                                                width: 2,
                                                flex: 1,
                                                minHeight: 24,
                                                background: timelineSteps[i + 1]
                                                    .done
                                                    ? '#16a34a'
                                                    : '#e2e8f0',
                                            }}
                                        />
                                    )}
                                </div>
                                <div style={{ paddingBottom: 18 }}>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: step.done
                                                ? '#0f172a'
                                                : '#94a3b8',
                                        }}
                                    >
                                        {step.label}
                                    </div>
                                    {step.done && (
                                        <div
                                            style={{
                                                fontSize: 11.5,
                                                color: '#94a3b8',
                                                marginTop: 2,
                                            }}
                                        >
                                            {step.date && fmt(step.date)}
                                            {step.date && step.by ? ' — ' : ''}
                                            {step.by ?? ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={cardStyle}>
                    <h2
                        style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: '0 0 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Briefcase size={16} />{' '}
                        {t('requests.show.broker.title')}
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 16,
                        }}
                    >
                        <div>
                            <span style={labelStyle}>
                                {t('requests.show.broker.name')}
                            </span>
                            <span style={valueStyle}>
                                {cr.broker?.name ?? '—'}
                            </span>
                        </div>
                        <div>
                            <span style={labelStyle}>
                                {t('requests.show.broker.code')}
                            </span>
                            <span style={valueStyle}>
                                {cr.broker?.code ?? '—'}
                            </span>
                        </div>
                        <div>
                            <span style={labelStyle}>
                                {t('requests.show.broker.contactEmail')}
                            </span>
                            <span style={valueStyle}>
                                {cr.created_by?.email ?? '—'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h2
                        style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: '0 0 16px',
                        }}
                    >
                        {t('requests.show.shipment.title')}
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 16,
                        }}
                    >
                        <div>
                            <span style={labelStyle}>
                                {t('requests.show.shipment.country')}
                            </span>
                            <span style={valueStyle}>
                                {cr.country_code ?? '—'}
                            </span>
                        </div>
                        <div>
                            <span style={labelStyle}>
                                {t('requests.show.shipment.transportMode')}
                            </span>
                            <span style={valueStyle}>
                                {cr.transport_type
                                    ? TRANSPORT_LABELS[cr.transport_type]
                                    : '—'}
                            </span>
                        </div>
                        <div>
                            <span style={labelStyle}>
                                {t('requests.show.shipment.route')}
                            </span>
                            <span style={valueStyle}>
                                {cr.voyage_from && cr.voyage_to
                                    ? `${cr.voyage_from} → ${cr.voyage_to}`
                                    : '—'}
                            </span>
                        </div>
                        <div>
                            <span style={labelStyle}>
                                {t('requests.show.shipment.voyageDate')}
                            </span>
                            <span style={valueStyle}>
                                {cr.voyage_date ? fmt(cr.voyage_date) : '—'}
                            </span>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <span style={labelStyle}>
                                {t('requests.show.shipment.cargo')}
                            </span>
                            <span style={valueStyle}>
                                {cr.cargo_description ?? '—'}
                            </span>
                        </div>
                        <div>
                            <span style={labelStyle}>
                                {t('requests.show.shipment.estimatedValue')}
                            </span>
                            <span style={valueStyle}>
                                {cr.estimated_value
                                    ? `${Number(cr.estimated_value).toLocaleString('fr-FR')} ${cr.currency_code ?? ''}`
                                    : '—'}
                            </span>
                        </div>
                    </div>
                    {cr.notes && (
                        <div style={{ marginTop: 16 }}>
                            <span style={labelStyle}>
                                {t('requests.show.shipment.partnerNotes')}
                            </span>
                            <span style={valueStyle}>{cr.notes}</span>
                        </div>
                    )}
                </div>

                <div style={cardStyle}>
                    <h2
                        style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: '0 0 14px',
                        }}
                    >
                        {t('requests.show.documents.title')}
                    </h2>
                    {cr.documents.length === 0 ? (
                        <p
                            style={{
                                fontSize: 12.5,
                                color: '#94a3b8',
                                margin: 0,
                            }}
                        >
                            {t('requests.show.documents.empty')}
                        </p>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                        >
                            {cr.documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '10px 12px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 6,
                                    }}
                                >
                                    <FileText size={17} color="#64748b" />
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 500,
                                                    fontSize: 12.5,
                                                    color: '#0f172a',
                                                }}
                                            >
                                                {doc.file_original_name}
                                            </p>
                                            {doc.document_type && (
                                                <span
                                                    style={{
                                                        fontSize: 10.5,
                                                        fontWeight: 500,
                                                        color: '#3b82f6',
                                                        background: '#eff6ff',
                                                        borderRadius: 10,
                                                        padding: '1px 7px',
                                                    }}
                                                >
                                                    {DOCUMENT_TYPE_LABELS[
                                                        doc.document_type
                                                    ] ?? doc.document_type}
                                                </span>
                                            )}
                                        </div>
                                        {doc.file_size && (
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: 11.5,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                {t(
                                                    'requests.show.documents.sizeKo',
                                                    {
                                                        size: (
                                                            doc.file_size / 1024
                                                        ).toFixed(0),
                                                    },
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <a
                                        href={route(
                                            'admin.certificate-requests.documents.download',
                                            {
                                                certificateRequest: cr.id,
                                                document: doc.id,
                                            },
                                        )}
                                    >
                                        <button
                                            style={{
                                                border: '1px solid #e2e8f0',
                                                background: '#fff',
                                                borderRadius: '4px',
                                                padding: '5px 8px',
                                                cursor: 'pointer',
                                                color: '#16a34a',
                                            }}
                                        >
                                            <Download size={14} />
                                        </button>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cr.status === 'INFO_REQUESTED' && (
                    <div
                        style={{
                            ...cardStyle,
                            background: '#fff7ed',
                            borderColor: '#fed7aa',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#c2410c',
                                margin: '0 0 8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <FileQuestion size={16} />{' '}
                            {t('requests.show.infoRequested.title')}
                        </h2>
                        <p
                            style={{
                                fontSize: 13,
                                color: '#7c2d12',
                                margin: 0,
                            }}
                        >
                            {cr.info_request_notes}
                        </p>
                        <p
                            style={{
                                fontSize: 11.5,
                                color: '#9a3412',
                                marginTop: 10,
                                opacity: 0.85,
                            }}
                        >
                            {t('requests.show.infoRequested.hint')}
                        </p>
                    </div>
                )}

                {cr.status === 'COMPLETED' && (
                    <div
                        style={{
                            ...cardStyle,
                            background: '#eef2ff',
                            borderColor: '#c7d2fe',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#4338ca',
                                margin: '0 0 8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <FileQuestion size={16} />{' '}
                            {t('requests.show.completed.title')}
                        </h2>
                        {cr.completion_notes && (
                            <p
                                style={{
                                    fontSize: 13,
                                    color: '#3730a3',
                                    margin: 0,
                                }}
                            >
                                {cr.completion_notes}
                            </p>
                        )}
                    </div>
                )}

                {(cr.status === 'PENDING' ||
                    cr.status === 'IN_REVIEW' ||
                    cr.status === 'COMPLETED') && (
                    <div style={cardStyle}>
                        <h2
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: '0 0 12px',
                            }}
                        >
                            {t('requests.show.processing.title')}
                        </h2>

                        {cr.status === 'PENDING' && (
                            <div style={{ marginBottom: 16 }}>
                                <Button
                                    onClick={assign}
                                    disabled={processing}
                                    variant="outline"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <UserCheck size={15} />{' '}
                                    {t('requests.show.processing.assign')}
                                </Button>
                            </div>
                        )}

                        <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder={t(
                                'requests.show.processing.notesPlaceholder',
                            )}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                resize: 'vertical',
                                marginBottom: 14,
                            }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                gap: 10,
                                marginBottom: 20,
                            }}
                        >
                            <Button
                                onClick={approve}
                                disabled={processing}
                                className="bg-[#16a34a] text-white hover:bg-[#15803d]"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <CheckCircle2 size={15} />{' '}
                                {t('requests.show.processing.approve')}
                            </Button>
                            <Button
                                onClick={reject}
                                disabled={processing}
                                variant="outline"
                                style={{
                                    color: '#dc2626',
                                    borderColor: '#fecaca',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <XCircle size={15} />{' '}
                                {t('requests.show.processing.reject')}
                            </Button>
                        </div>

                        <div
                            style={{
                                borderTop: '1px solid #e2e8f0',
                                paddingTop: 16,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#94a3b8',
                                    margin: '0 0 8px',
                                }}
                            >
                                {t('requests.show.processing.requestInfoHint')}
                            </p>
                            <textarea
                                value={infoRequestNotes}
                                onChange={(e) =>
                                    setInfoRequestNotes(e.target.value)
                                }
                                placeholder={t(
                                    'requests.show.processing.requestInfoPlaceholder',
                                )}
                                rows={2}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    resize: 'vertical',
                                    marginBottom: 10,
                                }}
                            />
                            <Button
                                onClick={requestInfo}
                                disabled={processing}
                                variant="outline"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <FileQuestion size={15} />{' '}
                                {t('requests.show.processing.requestInfo')}
                            </Button>
                        </div>
                    </div>
                )}

                {cr.status === 'APPROVED' &&
                    !cr.certificate &&
                    !cr.guce_certificate && (
                        <div style={cardStyle}>
                            <h2
                                style={{
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    margin: '0 0 4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Link2 size={16} />{' '}
                                {t('requests.show.generation.title')}
                            </h2>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#94a3b8',
                                    margin: '0 0 14px',
                                }}
                            >
                                {t('requests.show.generation.hint')}
                            </p>

                            <div
                                style={{
                                    display: 'flex',
                                    gap: 10,
                                    marginBottom: 18,
                                }}
                            >
                                <Link href="/admin/certificates/create">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Plus size={14} />{' '}
                                        {t(
                                            'requests.show.generation.createCertificate',
                                        )}
                                    </Button>
                                </Link>
                                <Link href="/admin/guce-certificates/create">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Upload size={14} />{' '}
                                        {t(
                                            'requests.show.generation.importGuce',
                                        )}
                                    </Button>
                                </Link>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                }}
                            >
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <select
                                        value={selectedCertificateId}
                                        onChange={(e) =>
                                            setSelectedCertificateId(
                                                e.target.value,
                                            )
                                        }
                                        style={{
                                            flex: 1,
                                            padding: '8px 10px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="">
                                            {t(
                                                'requests.show.generation.linkCertificatePlaceholder',
                                            )}
                                        </option>
                                        {availableCertificates.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.certificate_number} —{' '}
                                                {c.insured_name}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        onClick={linkCertificate}
                                        disabled={
                                            processing || !selectedCertificateId
                                        }
                                        className="bg-[#1e3a8a] text-white hover:bg-[#1e40af]"
                                    >
                                        {t('requests.show.generation.link')}
                                    </Button>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <select
                                        value={selectedGuceCertificateId}
                                        onChange={(e) =>
                                            setSelectedGuceCertificateId(
                                                e.target.value,
                                            )
                                        }
                                        style={{
                                            flex: 1,
                                            padding: '8px 10px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="">
                                            {t(
                                                'requests.show.generation.linkGuceCertificatePlaceholder',
                                            )}
                                        </option>
                                        {availableGuceCertificates.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.certificate_number} —{' '}
                                                {c.insured_name}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        onClick={linkGuceCertificate}
                                        disabled={
                                            processing ||
                                            !selectedGuceCertificateId
                                        }
                                        className="bg-[#1e3a8a] text-white hover:bg-[#1e40af]"
                                    >
                                        {t('requests.show.generation.link')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                {(cr.certificate || cr.guce_certificate) && (
                    <div
                        style={{
                            ...cardStyle,
                            background: '#f0fdf4',
                            borderColor: '#bbf7d0',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#15803d',
                                margin: '0 0 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Award size={16} />{' '}
                            {cr.guce_certificate && !cr.certificate
                                ? t('requests.show.available.titleGuce')
                                : t('requests.show.available.title')}
                        </h2>
                        <p
                            style={{
                                fontSize: 13,
                                color: '#166534',
                                margin: 0,
                            }}
                        >
                            {t('requests.show.available.number', {
                                number: cr.certificate
                                    ? cr.certificate.certificate_number
                                    : cr.guce_certificate?.certificate_number,
                            })}
                        </p>
                        {cr.certificate && (
                            <Link
                                href={`/admin/certificates/${cr.certificate.id}`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 12.5,
                                    color: '#15803d',
                                    fontWeight: 500,
                                    marginTop: 8,
                                    textDecoration: 'none',
                                }}
                            >
                                {t('requests.show.available.viewCertificate')}
                            </Link>
                        )}
                        {cr.guce_certificate && (
                            <Link
                                href={`/admin/guce-certificates/${cr.guce_certificate.id}`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 12.5,
                                    color: '#15803d',
                                    fontWeight: 500,
                                    marginTop: 8,
                                    textDecoration: 'none',
                                }}
                            >
                                {t(
                                    'requests.show.available.viewGuceCertificate',
                                )}
                            </Link>
                        )}
                        <p
                            style={{
                                fontSize: 11.5,
                                color: '#166534',
                                marginTop: 10,
                                opacity: 0.8,
                            }}
                        >
                            {t('requests.show.available.notified')}
                        </p>
                        {cr.status === 'FULFILLED' && (
                            <Button
                                onClick={close}
                                disabled={processing}
                                variant="outline"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginTop: 14,
                                }}
                            >
                                <Archive size={15} />{' '}
                                {t('requests.show.available.close')}
                            </Button>
                        )}
                    </div>
                )}

                {cr.completion_notes && (
                    <div style={cardStyle}>
                        <h2
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: '0 0 8px',
                            }}
                        >
                            {t('requests.show.partnerCompletion.title')}
                        </h2>
                        <p
                            style={{
                                fontSize: 13,
                                color: '#374151',
                                margin: 0,
                            }}
                        >
                            {cr.completion_notes}
                        </p>
                        {cr.completed_at && (
                            <p
                                style={{
                                    fontSize: 11.5,
                                    color: '#94a3b8',
                                    margin: '8px 0 0',
                                }}
                            >
                                {t(
                                    'requests.show.partnerCompletion.resubmittedOn',
                                    { date: fmt(cr.completed_at) },
                                )}
                            </p>
                        )}
                    </div>
                )}

                {cr.status !== 'PENDING' &&
                    cr.status !== 'IN_REVIEW' &&
                    cr.review_notes && (
                        <div style={cardStyle}>
                            <h2
                                style={{
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    margin: '0 0 8px',
                                }}
                            >
                                {t('requests.show.processingNotes.title')}
                            </h2>
                            <p
                                style={{
                                    fontSize: 13,
                                    color: '#374151',
                                    margin: 0,
                                }}
                            >
                                {cr.review_notes}
                            </p>
                            {cr.reviewed_by && (
                                <p
                                    style={{
                                        fontSize: 11.5,
                                        color: '#94a3b8',
                                        margin: '8px 0 0',
                                    }}
                                >
                                    {t('requests.show.processingNotes.by', {
                                        name: `${cr.reviewed_by.first_name} ${cr.reviewed_by.last_name}`,
                                    })}
                                </p>
                            )}
                        </div>
                    )}

                <Link
                    href={route('admin.certificate-requests.index')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: '#64748b',
                        textDecoration: 'none',
                    }}
                >
                    <ChevronLeft size={14} /> {t('requests.show.backToList')}
                </Link>
            </div>
        </AppLayout>
    );
}
