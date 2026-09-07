import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit2,
    Award,
    Send,
    CheckCircle,
    XCircle,
    StopCircle,
    X,
    FileText,
    Ship,
    Plane,
    Truck,
    DollarSign,
    AlertCircle,
    Printer,
    QrCode,
    ExternalLink,
    Download,
    Copy,
    Repeat,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PrintOnFormButton from '@/components/print-on-form-button';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    PRINT_TEMPLATES,
    getTemplateForTenantCode,
} from './print-templates/registry';

interface ExpeditionItem {
    marks: string;
    package_numbers: string;
    package_count: number;
    weight: string;
    nature: string;
    packaging: string;
    insured_value: number;
}
interface PrimeLine {
    key: string;
    label: string;
    label_en: string | null;
    rate: number;
    amount: number;
}
interface Certificate {
    id: string;
    certificate_number: string;
    policy_number: string;
    status: string;
    insured_name: string;
    insured_ref: string | null;
    voyage_date: string;
    voyage_from: string;
    voyage_to: string;
    voyage_via: string | null;
    transport_type: string | null;
    vessel_name: string | null;
    flight_number: string | null;
    voyage_mode: string | null;
    expedition_items: ExpeditionItem[];
    currency_code: string;
    insured_value: string;
    insured_value_letters: string | null;
    guarantee_mode: string | null;
    prime_breakdown: PrimeLine[] | null;
    prime_total: string | null;
    prime_nette: string | null;
    destination_country_code: string | null;
    destination_country: { code: string; name_fr: string } | null;
    exchange_currency: string | null;
    exchange_rate: string | null;
    validation_notes: string | null;
    cancellation_reason: string | null;
    rejection_reason: string | null;
    submitted_at: string | null;
    issued_at: string | null;
    cancelled_at: string | null;
    rejected_at: string | null;
    replaced_at: string | null;
    pdf_path: string | null;
    qr_token: string | null;
    created_at: string;
    document_type: string;
    parent_id: string | null;
    duplicate_count: number;
    reissued_at: string | null;
    reissue_reason: string | null;
    parent: { certificate_number: string } | null;
    duplicates: {
        id: string;
        certificate_number: string;
        reissued_at: string | null;
    }[];
    reissued_by: { first_name: string; last_name: string } | null;
    replacement: { id: string; certificate_number: string } | null;
    replaces: {
        id: string;
        certificate_number: string;
        replaced_at: string | null;
    } | null;
    tenant: { id: string; name: string; code: string } | null;
    contract: {
        id: string;
        contract_number: string;
        insured_name: string;
    } | null;
    template: { name: string; is_bilingual: boolean } | null;
    submitted_by: { first_name: string; last_name: string } | null;
    issued_by: { first_name: string; last_name: string } | null;
    created_by: { first_name: string; last_name: string } | null;
}
interface Props {
    certificate: Certificate;
    can: { edit: boolean; validate: boolean; cancel: boolean };
    printOnFormTemplates: string[];
}

function ActionModal({
    title,
    icon: Icon,
    color,
    actionLabel,
    onConfirm,
    onClose,
    requireReason = true,
}: any) {
    const { t: tc } = useTranslation('common');
    const { t } = useTranslation('certificates');
    const [reason, setReason] = useState('');

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                background: 'rgba(15,23,42,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            }}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: 14,
                    width: '100%',
                    maxWidth: 440,
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 24px 64px rgba(0,0,0,.15)',
                }}
            >
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: `${color}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon size={16} color={color} />
                        </div>
                        <p
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#1e293b',
                            }}
                        >
                            {title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                        }}
                    >
                        <X size={17} />
                    </button>
                </div>
                <div
                    style={{
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    {requireReason && (
                        <div>
                            <label
                                style={{
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '.08em',
                                    display: 'block',
                                    marginBottom: 6,
                                }}
                            >
                                {t('show.modals.reasonLabel')}
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '10px 13px',
                                    fontSize: 13,
                                    fontFamily: 'inherit',
                                    color: '#1e293b',
                                    background: '#f8fafc',
                                    border: '1.5px solid #e2e8f0',
                                    borderRadius: 9,
                                    outline: 'none',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Button variant="outline" onClick={onClose}>
                            {tc('actions.cancel')}
                        </Button>
                        <Button
                            onClick={() => onConfirm(reason)}
                            disabled={requireReason && !reason.trim()}
                            style={{
                                background: color,
                                color: '#fff',
                                border: 'none',
                            }}
                        >
                            {actionLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CertificateShow({
    certificate,
    can,
    printOnFormTemplates,
}: Props) {
    const { t } = useTranslation('certificates');
    const { t: tc } = useTranslation('common');

    const STATUS_STYLES: Record<
        string,
        { bg: string; color: string; label: string; dot: string }
    > = {
        DRAFT: {
            bg: '#f8fafc',
            color: '#64748b',
            label: tc('certificateStatus.DRAFT'),
            dot: '#94a3b8',
        },
        SUBMITTED: {
            bg: '#fffbeb',
            color: '#92400e',
            label: tc('certificateStatus.SUBMITTED'),
            dot: '#f59e0b',
        },
        REJECTED: {
            bg: '#fef2f2',
            color: '#dc2626',
            label: tc('certificateStatus.REJECTED'),
            dot: '#ef4444',
        },
        ISSUED: {
            bg: '#f0fdf4',
            color: '#15803d',
            label: tc('certificateStatus.ISSUED'),
            dot: '#22c55e',
        },
        REPLACED: {
            bg: '#f1f5f9',
            color: '#475569',
            label: tc('certificateStatus.REPLACED'),
            dot: '#94a3b8',
        },
        CANCELLED: {
            bg: '#fef2f2',
            color: '#991b1b',
            label: tc('certificateStatus.CANCELLED'),
            dot: '#dc2626',
        },
    };

    const TRANSPORT_LABELS: Record<string, string> = {
        SEA: t('shared.transport.SEA'),
        AIR: t('shared.transport.AIR'),
        ROAD: t('shared.transport.ROAD'),
        RAIL: t('shared.transport.RAIL'),
        MULTIMODAL: t('shared.transport.MULTIMODAL'),
    };

    const [modal, setModal] = useState<string | null>(null);
    const [printModal, setPrintModal] = useState(false);
    const autoTemplate =
        getTemplateForTenantCode(certificate.tenant?.code)?.id ??
        PRINT_TEMPLATES[0]?.id ??
        '';
    const [selectedTemplate, setSelected] = useState<string>(autoTemplate);

    // Décalage imprimante (mm) — propre au poste/imprimante physique, pas
    // au certificat ni au calibrage maître. Conservé en localStorage pour
    // survivre à la navigation ; jamais envoyé au serveur autrement qu'en
    // paramètre de requête ponctuel à l'impression.
    const [printOffset, setPrintOffset] = useState<{ x: number; y: number }>(
        () => {
            try {
                const raw = localStorage.getItem('nsia-print-offset');

                return raw ? JSON.parse(raw) : { x: 0, y: 0 };
            } catch {
                return { x: 0, y: 0 };
            }
        },
    );
    const updateOffset = (patch: Partial<{ x: number; y: number }>) => {
        const next = { ...printOffset, ...patch };
        setPrintOffset(next);

        try {
            localStorage.setItem('nsia-print-offset', JSON.stringify(next));
        } catch {
            /* stockage indisponible, tant pis */
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('shared.breadcrumb'), href: '/admin/certificates' },
        { title: certificate.certificate_number },
    ];

    const ss = STATUS_STYLES[certificate.status] ?? STATUS_STYLES.DRAFT;
    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    const fmtDt = (d: string) =>
        new Date(d).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const action = (routeName: string, payload: Record<string, any> = {}) => {
        router.patch(
            route(routeName, { certificate: certificate.id }),
            payload,
            {
                onSuccess: () => setModal(null),
                // Ne pas fermer la modale sur erreur (ex. escalade NN300 en
                // cours) — l'utilisateur doit voir le message, pas juste
                // constater que rien ne s'est passé.
                onError: (errors) =>
                    alert(
                        Object.values(errors).join('\n') ||
                            t('show.workflow.genericError'),
                    ),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={t('show.title', {
                    number: certificate.certificate_number,
                })}
            />

            {/* ── Modal sélection modèle d'impression ── */}
            {printModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                        background: 'rgba(15,23,42,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 16,
                            width: '100%',
                            maxWidth: 520,
                            border: '1.5px solid #e2e8f0',
                            boxShadow: '0 24px 64px rgba(0,0,0,.18)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <div
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 8,
                                        background: '#eff6ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Printer size={16} color="#3b82f6" />
                                </div>
                                <div>
                                    <p
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            margin: 0,
                                        }}
                                    >
                                        {t('show.printModal.title')}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 11,
                                            color: '#94a3b8',
                                            margin: 0,
                                        }}
                                    >
                                        {t('show.printModal.subtitle')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPrintModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    padding: 4,
                                }}
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {/* Liste des modèles */}
                        <div
                            style={{
                                padding: '16px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                maxHeight: 360,
                                overflowY: 'auto',
                            }}
                        >
                            {PRINT_TEMPLATES.length === 0 && (
                                <p
                                    style={{
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                        fontSize: 13,
                                        padding: '20px 0',
                                    }}
                                >
                                    {t('show.printModal.empty')}
                                </p>
                            )}
                            {PRINT_TEMPLATES.map((tpl) => (
                                <button
                                    key={tpl.id}
                                    onClick={() => setSelected(tpl.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '12px 14px',
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        border:
                                            selectedTemplate === tpl.id
                                                ? '2px solid #3b82f6'
                                                : '1.5px solid #e2e8f0',
                                        background:
                                            selectedTemplate === tpl.id
                                                ? '#eff6ff'
                                                : '#fafafa',
                                        textAlign: 'left',
                                        width: '100%',
                                        fontFamily: 'inherit',
                                        transition: 'all .15s',
                                    }}
                                >
                                    {/* Drapeau */}
                                    <span
                                        style={{ fontSize: 28, flexShrink: 0 }}
                                    >
                                        {tpl.countryFlag}
                                    </span>
                                    {/* Infos */}
                                    <div style={{ flex: 1 }}>
                                        <p
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#1e293b',
                                                margin: '0 0 2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            {tpl.name}
                                            {tpl.id === autoTemplate && (
                                                <span
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: 600,
                                                        color: '#15803d',
                                                        background: '#f0fdf4',
                                                        border: '1px solid #bbf7d0',
                                                        borderRadius: 20,
                                                        padding: '1px 7px',
                                                        textTransform:
                                                            'uppercase',
                                                        letterSpacing: '.04em',
                                                    }}
                                                >
                                                    {t(
                                                        'show.printModal.recommended',
                                                    )}
                                                </span>
                                            )}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: 11,
                                                color: '#64748b',
                                                margin: 0,
                                            }}
                                        >
                                            {tpl.description}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: 10,
                                                color: '#94a3b8',
                                                margin: '2px 0 0',
                                            }}
                                        >
                                            {tpl.paperSize} {tpl.orientation} ·{' '}
                                            {tpl.country}
                                        </p>
                                    </div>
                                    {/* Indicateur sélection */}
                                    {selectedTemplate === tpl.id && (
                                        <div
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                background: '#3b82f6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <CheckCircle
                                                size={13}
                                                color="#fff"
                                            />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div
                            style={{
                                padding: '14px 20px',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                            }}
                        >
                            {printOnFormTemplates.includes(
                                selectedTemplate,
                            ) && (
                                <>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '6px 16px',
                                        }}
                                    >
                                        <a
                                            href={
                                                route(
                                                    'admin.certificates.print-on-form',
                                                    {
                                                        certificate:
                                                            certificate.id,
                                                    },
                                                ) +
                                                `?template=${selectedTemplate}&preview=1&offset_x=${printOffset.x}&offset_y=${printOffset.y}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: 11.5,
                                                color: '#1d4ed8',
                                            }}
                                        >
                                            {t(
                                                'show.printModal.previewCalibration',
                                            )}
                                        </a>
                                        <a
                                            href={
                                                route(
                                                    'admin.certificates.print-on-form',
                                                    {
                                                        certificate:
                                                            certificate.id,
                                                    },
                                                ) +
                                                `?template=${selectedTemplate}&calibrate=1&offset_x=${printOffset.x}&offset_y=${printOffset.y}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: 11.5,
                                                color: '#94a3b8',
                                            }}
                                        >
                                            {t(
                                                'show.printModal.calibrationGrid',
                                            )}
                                        </a>
                                    </div>

                                    {/* Décalage imprimante — propre à ce poste, conservé en
                                        localStorage (cf. commentaire plus haut). Compense un
                                        registre/bac papier différent d'une imprimante à l'autre
                                        sans toucher au calibrage partagé par tous. */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '8px 10px',
                                            background: '#f8fafc',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: '#64748b',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {t('show.printModal.printerOffset')}
                                        </span>
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontSize: 11.5,
                                                color: '#334155',
                                            }}
                                        >
                                            X
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={printOffset.x}
                                                onChange={(e) =>
                                                    updateOffset({
                                                        x:
                                                            parseFloat(
                                                                e.target.value,
                                                            ) || 0,
                                                    })
                                                }
                                                style={{
                                                    width: 60,
                                                    padding: '3px 6px',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: 5,
                                                    fontSize: 11.5,
                                                }}
                                            />
                                        </label>
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontSize: 11.5,
                                                color: '#334155',
                                            }}
                                        >
                                            Y
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={printOffset.y}
                                                onChange={(e) =>
                                                    updateOffset({
                                                        y:
                                                            parseFloat(
                                                                e.target.value,
                                                            ) || 0,
                                                    })
                                                }
                                                style={{
                                                    width: 60,
                                                    padding: '3px 6px',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: 5,
                                                    fontSize: 11.5,
                                                }}
                                            />
                                        </label>
                                        {(printOffset.x !== 0 ||
                                            printOffset.y !== 0) && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateOffset({ x: 0, y: 0 })
                                                }
                                                style={{
                                                    fontSize: 11,
                                                    color: '#dc2626',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                }}
                                            >
                                                {t('show.printModal.reset')}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => setPrintModal(false)}
                                >
                                    {tc('actions.cancel')}
                                </Button>
                                <a
                                    href={
                                        route('admin.certificates.print', {
                                            certificate: certificate.id,
                                        }) + `?template=${selectedTemplate}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        variant="outline"
                                        disabled={!selectedTemplate}
                                        onClick={() => setPrintModal(false)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Printer size={14} />{' '}
                                        {t('show.printModal.htmlPreview')}
                                    </Button>
                                </a>
                                <div onClick={() => setPrintModal(false)}>
                                    <PrintOnFormButton
                                        certificateId={certificate.id}
                                        templateId={selectedTemplate}
                                        availableTemplates={
                                            printOnFormTemplates
                                        }
                                        offsetX={printOffset.x}
                                        offsetY={printOffset.y}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .cs-wrap{width:100%;max-width:960px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .cs-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:flex-start;gap:16px;position:relative;overflow:hidden;}
                .cs-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .cs-hero-num{font-size:22px;font-weight:700;color:#fff;font-family:monospace;letter-spacing:.08em;margin-bottom:4px;}
                .cs-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
                .cs-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .cs-card-hdr{padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .cs-card-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .cs-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .cs-card-body{padding:20px;}
                .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .info-item{display:flex;flex-direction:column;gap:3px;}
                .info-label{font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;}
                .info-value{font-size:13px;color:#1e293b;}

                /* Tableau expédition */
                .exp-table{width:100%;border-collapse:collapse;font-size:12px;}
                .exp-table th{padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em;text-align:left;}
                .exp-table td{padding:8px 10px;border:1px solid #e2e8f0;color:#334155;}
                .exp-table tr:last-child td{font-weight:600;background:#f8fafc;}

                /* Décompte prime */
                .prime-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f8fafc;}
                .prime-row:last-child{border-bottom:none;font-weight:700;}

                /* Workflow */
                .workflow-bar{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
                .btn-wf{padding:7px 14px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:5px;font-family:inherit;transition:all .13s;background:none;}
                .btn-submit{color:#1d4ed8;border-color:#bfdbfe;} .btn-submit:hover{background:#eff6ff;}
                .btn-issue{color:#15803d;border-color:#bbf7d0;} .btn-issue:hover{background:#f0fdf4;}
                .btn-reject{color:#dc2626;border-color:#fecaca;} .btn-reject:hover{background:#fef2f2;}
                .btn-cancel{color:#dc2626;border-color:#fecaca;} .btn-cancel:hover{background:#fef2f2;}
                .notes-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:9px;padding:10px 14px;font-size:12px;color:#15803d;}
                .notes-ko{background:#fef2f2;border:1px solid #fecaca;border-radius:9px;padding:10px 14px;font-size:12px;color:#dc2626;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="cs-wrap">
                    {/* Hero */}
                    <div className="cs-hero">
                        <div
                            style={{ flex: 1, position: 'relative', zIndex: 1 }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 8,
                                }}
                            >
                                <Link
                                    href="/admin/certificates"
                                    style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <ArrowLeft size={16} />
                                </Link>
                                <Award
                                    size={16}
                                    color="rgba(255,255,255,0.6)"
                                />
                            </div>
                            <div className="cs-hero-num">
                                {certificate.certificate_number}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.5)',
                                    marginBottom: 8,
                                }}
                            >
                                {t('show.policy', {
                                    number: certificate.policy_number,
                                    tenant: certificate.tenant?.name,
                                })}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <span
                                    className="cs-badge"
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: ss.dot,
                                        }}
                                    />
                                    {ss.label}
                                </span>
                                {certificate.transport_type && (
                                    <span
                                        className="cs-badge"
                                        style={{
                                            background:
                                                'rgba(255,255,255,0.08)',
                                            color: 'rgba(255,255,255,0.7)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                        }}
                                    >
                                        {TRANSPORT_LABELS[
                                            certificate.transport_type
                                        ] ?? certificate.transport_type}
                                    </span>
                                )}
                                <span
                                    className="cs-badge"
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.7)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                    }}
                                >
                                    <DollarSign size={10} />
                                    {parseFloat(
                                        certificate.insured_value,
                                    ).toLocaleString('fr-FR')}{' '}
                                    {certificate.currency_code}
                                </span>
                            </div>
                        </div>
                        <div
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                display: 'flex',
                                gap: 8,
                            }}
                        >
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button
                                    variant="outline"
                                    onClick={() => setPrintModal(true)}
                                    className="h-9 border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-white/20"
                                >
                                    <Printer size={13} />{' '}
                                    {t('show.actions.print')}
                                </Button>
                                {certificate.status === 'ISSUED' && (
                                    <>
                                        <a
                                            href={route(
                                                'admin.certificates.pdf.download',
                                                { certificate: certificate.id },
                                            )}
                                            target="_blank"
                                        >
                                            <Button
                                                variant="outline"
                                                className="h-9 border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-white/20"
                                            >
                                                <Download size={13} />{' '}
                                                {t('show.actions.pdf')}
                                            </Button>
                                        </a>
                                        {certificate.qr_token && (
                                            <a
                                                href={`/verify/${certificate.qr_token}`}
                                                target="_blank"
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="h-9 border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-white/20"
                                                >
                                                    <QrCode size={13} />{' '}
                                                    {t('show.actions.verify')}
                                                </Button>
                                            </a>
                                        )}
                                        {/* Bouton Duplicata — US-032 */}
                                        {certificate.document_type ===
                                            'original' && (
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setModal('duplicate')
                                                }
                                                className="h-9 border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-white/20"
                                            >
                                                <Copy size={13} />{' '}
                                                {t('show.actions.duplicate')}
                                            </Button>
                                        )}
                                        {can.edit && (
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setModal('replace')
                                                }
                                                className="h-9 border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-white/20"
                                            >
                                                <Repeat size={13} />{' '}
                                                {t('show.actions.replace')}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                            {can.edit &&
                                ['DRAFT', 'REJECTED'].includes(
                                    certificate.status,
                                ) && (
                                    <Link
                                        href={route('admin.certificates.edit', {
                                            certificate: certificate.id,
                                        })}
                                    >
                                        <Button
                                            className="h-9 border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-white/20"
                                            variant="outline"
                                        >
                                            <Edit2 size={13} />{' '}
                                            {t('show.actions.edit')}
                                        </Button>
                                    </Link>
                                )}
                        </div>
                    </div>

                    {/* Workflow */}
                    <div className="workflow-bar">
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: ss.dot,
                                }}
                            />
                            {ss.label}
                            {certificate.issued_at && (
                                <span
                                    style={{ fontSize: 11, color: '#94a3b8' }}
                                >
                                    {t('show.workflow.issuedOn', {
                                        date: fmtDt(certificate.issued_at),
                                    })}
                                </span>
                            )}
                            {certificate.document_type === 'duplicata' && (
                                <span
                                    style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        color: '#fff',
                                        borderRadius: 6,
                                        fontSize: 10,
                                        padding: '2px 8px',
                                        fontWeight: 700,
                                        letterSpacing: '.08em',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                    }}
                                >
                                    {t('show.duplicataBadge')}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {certificate.status === 'DRAFT' && can.edit && (
                                <button
                                    className="btn-wf btn-submit"
                                    onClick={() =>
                                        action('admin.certificates.submit')
                                    }
                                >
                                    <Send size={12} />{' '}
                                    {t('show.workflow.submit')}
                                </button>
                            )}
                            {certificate.status === 'REJECTED' && can.edit && (
                                <Link
                                    href={route('admin.certificates.edit', {
                                        certificate: certificate.id,
                                    })}
                                    className="btn-wf btn-submit"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Edit2 size={12} />{' '}
                                    {t('show.workflow.fixAndResubmit')}
                                </Link>
                            )}
                            {certificate.status === 'SUBMITTED' &&
                                can.validate && (
                                    <>
                                        <button
                                            className="btn-wf btn-issue"
                                            onClick={() => setModal('issue')}
                                        >
                                            <CheckCircle size={12} />{' '}
                                            {t('show.workflow.approve')}
                                        </button>
                                        <button
                                            className="btn-wf btn-reject"
                                            onClick={() => setModal('reject')}
                                        >
                                            <XCircle size={12} />{' '}
                                            {t('show.workflow.reject')}
                                        </button>
                                    </>
                                )}
                            {['SUBMITTED', 'ISSUED'].includes(
                                certificate.status,
                            ) &&
                                can.cancel && (
                                    <button
                                        className="btn-wf btn-cancel"
                                        onClick={() => setModal('cancel')}
                                    >
                                        <StopCircle size={12} />{' '}
                                        {t('show.workflow.cancel')}
                                    </button>
                                )}
                        </div>
                    </div>

                    {/* Notes */}
                    {certificate.status === 'REJECTED' &&
                        certificate.rejection_reason && (
                            <div className="notes-ko">
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 4,
                                    }}
                                >
                                    <AlertCircle size={13} />
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: 11,
                                        }}
                                    >
                                        {t('show.notes.rejectionReason')}
                                    </span>
                                    {certificate.rejected_at && (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: '#94a3b8',
                                            }}
                                        >
                                            · {fmtDt(certificate.rejected_at)}
                                        </span>
                                    )}
                                </div>
                                {certificate.rejection_reason}
                            </div>
                        )}
                    {certificate.status === 'REPLACED' &&
                        certificate.replacement && (
                            <div
                                style={{
                                    background: '#f1f5f9',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 9,
                                    padding: '10px 14px',
                                    fontSize: 12,
                                    color: '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Repeat size={13} />
                                {t('show.notes.replacedBy')}{' '}
                                <a
                                    href={route('admin.certificates.show', {
                                        certificate: certificate.replacement.id,
                                    })}
                                    style={{
                                        fontWeight: 600,
                                        color: '#1d4ed8',
                                        textDecoration: 'none',
                                    }}
                                >
                                    N°{' '}
                                    {certificate.replacement.certificate_number}
                                </a>
                                {certificate.replaced_at && (
                                    <span
                                        style={{
                                            fontSize: 10,
                                            color: '#94a3b8',
                                        }}
                                    >
                                        · {fmtDt(certificate.replaced_at)}
                                    </span>
                                )}
                            </div>
                        )}
                    {certificate.replaces && (
                        <div
                            style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: 9,
                                padding: '10px 14px',
                                fontSize: 12,
                                color: '#1d4ed8',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Repeat size={13} />
                            {t('show.notes.replaces')}{' '}
                            <a
                                href={route('admin.certificates.show', {
                                    certificate: certificate.replaces.id,
                                })}
                                style={{
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                }}
                            >
                                N° {certificate.replaces.certificate_number}
                            </a>
                        </div>
                    )}
                    {certificate.validation_notes && (
                        <div className="notes-ok">
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginBottom: 4,
                                }}
                            >
                                <AlertCircle size={13} />
                                <span style={{ fontWeight: 600, fontSize: 11 }}>
                                    {t('show.notes.notes')}
                                </span>
                            </div>
                            {certificate.validation_notes}
                        </div>
                    )}
                    {certificate.cancellation_reason && (
                        <div className="notes-ko">
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginBottom: 4,
                                }}
                            >
                                <AlertCircle size={13} />
                                <span style={{ fontWeight: 600, fontSize: 11 }}>
                                    {t('show.notes.cancellationReason')}
                                </span>
                            </div>
                            {certificate.cancellation_reason}
                        </div>
                    )}

                    {/* Voyage */}
                    <div className="cs-card">
                        <div className="cs-card-hdr">
                            <div
                                className="cs-card-ico"
                                style={{ background: '#eff6ff' }}
                            >
                                {certificate.transport_type === 'AIR' ? (
                                    <Plane size={15} color="#3b82f6" />
                                ) : certificate.transport_type === 'ROAD' ? (
                                    <Truck size={15} color="#3b82f6" />
                                ) : (
                                    <Ship size={15} color="#3b82f6" />
                                )}
                            </div>
                            <span className="cs-card-ttl">
                                {t('show.voyageCard.title')}
                            </span>
                        </div>
                        <div className="cs-card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">
                                        {t('show.voyageCard.insured')}
                                    </span>
                                    <span
                                        className="info-value"
                                        style={{ fontWeight: 500 }}
                                    >
                                        {certificate.insured_name}
                                    </span>
                                    {certificate.insured_ref && (
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: '#64748b',
                                            }}
                                        >
                                            {certificate.insured_ref}
                                        </span>
                                    )}
                                </div>
                                <div className="info-item">
                                    <span className="info-label">
                                        {t('show.voyageCard.shipDate')}
                                    </span>
                                    <span className="info-value">
                                        {fmt(certificate.voyage_date)}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">
                                        {t('show.voyageCard.from')}
                                    </span>
                                    <span className="info-value">
                                        {certificate.voyage_from}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">
                                        {t('show.voyageCard.to')}
                                    </span>
                                    <span className="info-value">
                                        {certificate.voyage_to}
                                    </span>
                                </div>
                                {certificate.voyage_via && (
                                    <div className="info-item">
                                        <span className="info-label">
                                            {t('show.voyageCard.via')}
                                        </span>
                                        <span className="info-value">
                                            {certificate.voyage_via}
                                        </span>
                                    </div>
                                )}
                                {certificate.destination_country && (
                                    <div className="info-item">
                                        <span className="info-label">
                                            {t(
                                                'show.voyageCard.destinationCountry',
                                            )}
                                        </span>
                                        <span className="info-value">
                                            {
                                                certificate.destination_country
                                                    .name_fr
                                            }
                                        </span>
                                    </div>
                                )}
                                {certificate.vessel_name && (
                                    <div className="info-item">
                                        <span className="info-label">
                                            {t('show.voyageCard.vessel')}
                                        </span>
                                        <span className="info-value">
                                            {certificate.vessel_name}
                                        </span>
                                    </div>
                                )}
                                {certificate.flight_number && (
                                    <div className="info-item">
                                        <span className="info-label">
                                            {t('show.voyageCard.flightNumber')}
                                        </span>
                                        <span className="info-value">
                                            {certificate.flight_number}
                                        </span>
                                    </div>
                                )}
                                {certificate.voyage_mode && (
                                    <div className="info-item">
                                        <span className="info-label">
                                            {t('show.voyageCard.mode')}
                                        </span>
                                        <span className="info-value">
                                            {certificate.voyage_mode}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Détail expédition */}
                    <div className="cs-card">
                        <div className="cs-card-hdr">
                            <div
                                className="cs-card-ico"
                                style={{ background: '#fff7ed' }}
                            >
                                <FileText size={15} color="#f97316" />
                            </div>
                            <span className="cs-card-ttl">
                                {t('show.expedition.title')}
                            </span>
                        </div>
                        <div className="cs-card-body">
                            <div style={{ overflowX: 'auto' }}>
                                <table className="exp-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                {t('show.expedition.marks')}
                                            </th>
                                            <th>
                                                {t(
                                                    'show.expedition.packageNumber',
                                                )}
                                            </th>
                                            <th>
                                                {t('show.expedition.count')}
                                            </th>
                                            <th>
                                                {t('show.expedition.weight')}
                                            </th>
                                            <th>
                                                {t(
                                                    'show.expedition.natureAndPackaging',
                                                )}
                                            </th>
                                            <th>
                                                {t('show.expedition.value')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(
                                            certificate.expedition_items ?? []
                                        ).map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.marks || '—'}</td>
                                                <td>
                                                    {item.package_numbers ||
                                                        '—'}
                                                </td>
                                                <td
                                                    style={{
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {item.package_count || '—'}
                                                </td>
                                                <td>{item.weight || '—'}</td>
                                                <td>
                                                    <div>{item.nature}</div>
                                                    {item.packaging && (
                                                        <div
                                                            style={{
                                                                fontSize: 10,
                                                                color: '#94a3b8',
                                                            }}
                                                        >
                                                            {item.packaging}
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        textAlign: 'right',
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    {Number(
                                                        item.insured_value,
                                                    ).toLocaleString('fr-FR')}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td
                                                colSpan={5}
                                                style={{
                                                    textAlign: 'right',
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {t(
                                                    'show.expedition.totalValue',
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    textAlign: 'right',
                                                    fontFamily: 'monospace',
                                                    fontSize: 14,
                                                }}
                                            >
                                                {parseFloat(
                                                    certificate.insured_value,
                                                ).toLocaleString('fr-FR')}{' '}
                                                {certificate.currency_code}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            {certificate.insured_value_letters && (
                                <div
                                    style={{
                                        marginTop: 10,
                                        padding: '10px 14px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        color: '#475569',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {certificate.insured_value_letters}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Décompte de prime */}
                    {certificate.prime_breakdown &&
                        certificate.prime_breakdown.length > 0 && (
                            <div className="cs-card">
                                <div className="cs-card-hdr">
                                    <div
                                        className="cs-card-ico"
                                        style={{ background: '#fffbeb' }}
                                    >
                                        <DollarSign size={15} color="#f59e0b" />
                                    </div>
                                    <span className="cs-card-ttl">
                                        {t('show.prime.title')}
                                    </span>
                                </div>
                                <div className="cs-card-body">
                                    {certificate.prime_breakdown.map((line) => (
                                        <div
                                            key={line.key}
                                            className="prime-row"
                                        >
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: '#64748b',
                                                }}
                                            >
                                                {line.label}
                                                {line.label_en
                                                    ? ` / ${line.label_en}`
                                                    : ''}
                                                {line.rate > 0 && (
                                                    <span
                                                        style={{
                                                            marginLeft: 8,
                                                            fontSize: 10,
                                                            color: '#94a3b8',
                                                        }}
                                                    >
                                                        {line.rate}%
                                                    </span>
                                                )}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    fontFamily: 'monospace',
                                                    color:
                                                        line.amount > 0
                                                            ? '#1e293b'
                                                            : '#94a3b8',
                                                }}
                                            >
                                                {line.amount > 0
                                                    ? line.amount.toLocaleString(
                                                          'fr-FR',
                                                      )
                                                    : '—'}
                                            </span>
                                        </div>
                                    ))}
                                    <div
                                        className="prime-row"
                                        style={{
                                            borderTop: '1px solid #f1f5f9',
                                            paddingTop: 10,
                                            marginTop: 4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#64748b',
                                            }}
                                        >
                                            {t('show.prime.netPrime')}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontFamily: 'monospace',
                                                color: '#1e293b',
                                            }}
                                        >
                                            {parseFloat(
                                                certificate.prime_nette ?? '0',
                                            ).toLocaleString('fr-FR')}{' '}
                                            {certificate.currency_code}
                                        </span>
                                    </div>
                                    <div
                                        className="prime-row"
                                        style={{
                                            borderTop: '2px solid #e2e8f0',
                                            paddingTop: 10,
                                            marginTop: 4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#1e293b',
                                            }}
                                        >
                                            {t('show.prime.totalPrime')}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: '#1e3a8a',
                                            }}
                                        >
                                            {parseFloat(
                                                certificate.prime_total ?? '0',
                                            ).toLocaleString('fr-FR')}{' '}
                                            {certificate.currency_code}
                                        </span>
                                    </div>
                                    {certificate.guarantee_mode && (
                                        <div
                                            style={{
                                                marginTop: 10,
                                                fontSize: 12,
                                                color: '#64748b',
                                            }}
                                        >
                                            {t('show.prime.guaranteeMode', {
                                                mode: certificate.guarantee_mode,
                                            })}
                                        </div>
                                    )}
                                    {certificate.exchange_currency &&
                                        certificate.exchange_rate && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: '#64748b',
                                                    marginTop: 4,
                                                }}
                                            >
                                                {t('show.prime.rate', {
                                                    from: certificate.exchange_currency,
                                                    rate: certificate.exchange_rate,
                                                    to: certificate.currency_code,
                                                })}
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                    {/* QR Code — certificat émis */}
                    {certificate.status === 'ISSUED' &&
                        certificate.qr_token && (
                            <div className="cs-card">
                                <div className="cs-card-hdr">
                                    <div
                                        className="cs-card-ico"
                                        style={{ background: '#f0fdf4' }}
                                    >
                                        <QrCode size={15} color="#16a34a" />
                                    </div>
                                    <span className="cs-card-ttl">
                                        {t('show.qr.title')}
                                    </span>
                                </div>
                                <div className="cs-card-body">
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 20,
                                        }}
                                    >
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '/verify/' + certificate.qr_token)}`}
                                            alt="QR Code"
                                            style={{
                                                width: 100,
                                                height: 100,
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 8,
                                            }}
                                        />
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: '#64748b',
                                                    marginBottom: 6,
                                                }}
                                            >
                                                {t('show.qr.instructions')}
                                            </div>
                                            <a
                                                href={`/verify/${certificate.qr_token}`}
                                                target="_blank"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                    fontSize: 12,
                                                    color: '#1d4ed8',
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                <ExternalLink size={12} />{' '}
                                                {t('show.qr.openVerification')}
                                            </a>
                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    fontFamily: 'monospace',
                                                    fontSize: 10,
                                                    color: '#94a3b8',
                                                    wordBreak: 'break-all',
                                                }}
                                            >
                                                {window.location.origin}/verify/
                                                {certificate.qr_token}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* Info duplicata — US-032 */}
                    {certificate.document_type === 'duplicata' && (
                        <div
                            className="cs-card"
                            style={{ borderColor: '#bfdbfe' }}
                        >
                            <div className="cs-card-hdr">
                                <div
                                    className="cs-card-ico"
                                    style={{ background: '#eff6ff' }}
                                >
                                    <Copy size={15} color="#3b82f6" />
                                </div>
                                <span className="cs-card-ttl">
                                    {t('show.duplicateInfo.title')}
                                </span>
                            </div>
                            <div className="cs-card-body">
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 10,
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#94a3b8',
                                                textTransform: 'uppercase',
                                                letterSpacing: '.05em',
                                                marginBottom: 3,
                                            }}
                                        >
                                            {t(
                                                'show.duplicateInfo.originalCertificate',
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                fontFamily: 'monospace',
                                                color: '#1e293b',
                                            }}
                                        >
                                            {certificate.parent
                                                ?.certificate_number ?? '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: '#94a3b8',
                                                textTransform: 'uppercase',
                                                letterSpacing: '.05em',
                                                marginBottom: 3,
                                            }}
                                        >
                                            {t(
                                                'show.duplicateInfo.reissueDate',
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: '#1e293b',
                                            }}
                                        >
                                            {certificate.reissued_at
                                                ? fmtDt(certificate.reissued_at)
                                                : '—'}
                                        </div>
                                    </div>
                                    {certificate.reissue_reason && (
                                        <div style={{ gridColumn: '1/-1' }}>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: '#94a3b8',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '.05em',
                                                    marginBottom: 3,
                                                }}
                                            >
                                                {t('show.duplicateInfo.reason')}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: '#475569',
                                                }}
                                            >
                                                {certificate.reissue_reason}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Liste duplicatas émis (si original) */}
                    {certificate.document_type === 'original' &&
                        certificate.duplicates?.length > 0 && (
                            <div className="cs-card">
                                <div className="cs-card-hdr">
                                    <div
                                        className="cs-card-ico"
                                        style={{ background: '#eff6ff' }}
                                    >
                                        <Copy size={15} color="#3b82f6" />
                                    </div>
                                    <span className="cs-card-ttl">
                                        {t('show.duplicatesList.title', {
                                            count: certificate.duplicate_count,
                                        })}
                                    </span>
                                </div>
                                <div className="cs-card-body">
                                    {certificate.duplicates.map((d) => (
                                        <div
                                            key={d.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '5px 0',
                                                borderBottom:
                                                    '1px solid #f8fafc',
                                            }}
                                        >
                                            <a
                                                href={route(
                                                    'admin.certificates.show',
                                                    { certificate: d.id },
                                                )}
                                                style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: '#1d4ed8',
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                {d.certificate_number}
                                            </a>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                {d.reissued_at
                                                    ? fmtDt(d.reissued_at)
                                                    : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* Méta */}
                    <div
                        style={{
                            fontSize: 11,
                            color: '#94a3b8',
                            display: 'flex',
                            gap: 16,
                            flexWrap: 'wrap',
                            padding: '4px 0',
                        }}
                    >
                        {certificate.created_by && (
                            <span>
                                {t('show.meta.createdBy', {
                                    name: `${certificate.created_by.first_name} ${certificate.created_by.last_name}`,
                                })}
                            </span>
                        )}
                        {certificate.submitted_by && (
                            <span>
                                {certificate.submitted_at
                                    ? t('show.meta.submittedByOn', {
                                          name: `${certificate.submitted_by.first_name} ${certificate.submitted_by.last_name}`,
                                          date: fmtDt(certificate.submitted_at),
                                      })
                                    : t('show.meta.submittedBy', {
                                          name: `${certificate.submitted_by.first_name} ${certificate.submitted_by.last_name}`,
                                      })}
                            </span>
                        )}
                        {certificate.issued_by && (
                            <span>
                                {certificate.issued_at
                                    ? t('show.meta.issuedByOn', {
                                          name: `${certificate.issued_by.first_name} ${certificate.issued_by.last_name}`,
                                          date: fmtDt(certificate.issued_at),
                                      })
                                    : t('show.meta.issuedBy', {
                                          name: `${certificate.issued_by.first_name} ${certificate.issued_by.last_name}`,
                                      })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals workflow */}
            {modal === 'issue' && (
                <ActionModal
                    title={t('show.modals.issue.title')}
                    icon={CheckCircle}
                    color="#15803d"
                    actionLabel={t('show.modals.issue.action')}
                    requireReason={false}
                    onConfirm={(n: string) =>
                        action('admin.certificates.issue', { notes: n })
                    }
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'reject' && (
                <ActionModal
                    title={t('show.modals.reject.title')}
                    icon={XCircle}
                    color="#dc2626"
                    actionLabel={t('show.modals.reject.action')}
                    onConfirm={(r: string) =>
                        action('admin.certificates.reject', { reason: r })
                    }
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'cancel' && (
                <ActionModal
                    title={t('show.modals.cancel.title')}
                    icon={StopCircle}
                    color="#dc2626"
                    actionLabel={t('show.modals.cancel.action')}
                    onConfirm={(r: string) =>
                        action('admin.certificates.cancel', { reason: r })
                    }
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'replace' && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                        background: 'rgba(15,23,42,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 14,
                            width: '100%',
                            maxWidth: 440,
                            border: '1.5px solid #e2e8f0',
                            boxShadow: '0 24px 64px rgba(0,0,0,.15)',
                        }}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <div
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 8,
                                        background: '#eff6ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Repeat size={16} color="#3b82f6" />
                                </div>
                                <p
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#1e293b',
                                    }}
                                >
                                    {t('show.modals.replace.title')}
                                </p>
                            </div>
                            <button
                                onClick={() => setModal(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                }}
                            >
                                <X size={17} />
                            </button>
                        </div>
                        <div
                            style={{
                                padding: '16px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    fontSize: 12,
                                    color: '#1d4ed8',
                                }}
                            >
                                {t('show.modals.replace.text', {
                                    number: certificate.certificate_number,
                                })}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => setModal(null)}
                                >
                                    {tc('actions.cancel')}
                                </Button>
                                <Button
                                    onClick={() =>
                                        router.post(
                                            route(
                                                'admin.certificates.replace',
                                                { certificate: certificate.id },
                                            ),
                                        )
                                    }
                                    style={{
                                        background: '#1e3a8a',
                                        color: '#fff',
                                        border: 'none',
                                    }}
                                >
                                    {t('show.modals.replace.action')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Duplicata — US-032 */}
            {modal === 'duplicate' && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                        background: 'rgba(15,23,42,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 14,
                            width: '100%',
                            maxWidth: 440,
                            border: '1.5px solid #e2e8f0',
                            boxShadow: '0 24px 64px rgba(0,0,0,.15)',
                        }}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <div
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 8,
                                        background: '#eff6ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Copy size={16} color="#3b82f6" />
                                </div>
                                <p
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#1e293b',
                                    }}
                                >
                                    {t('show.modals.duplicate.title')}
                                </p>
                            </div>
                            <button
                                onClick={() => setModal(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                }}
                            >
                                <X size={17} />
                            </button>
                        </div>
                        <div
                            style={{
                                padding: '16px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    fontSize: 12,
                                    color: '#1d4ed8',
                                }}
                            >
                                {t('show.modals.duplicate.text', {
                                    number: `${certificate.certificate_number}-D${(certificate.duplicate_count ?? 0) + 1}`,
                                })}
                            </div>
                            <div>
                                <label
                                    style={{
                                        fontSize: 10.5,
                                        fontWeight: 600,
                                        color: '#64748b',
                                        textTransform: 'uppercase',
                                        letterSpacing: '.08em',
                                        display: 'block',
                                        marginBottom: 6,
                                    }}
                                >
                                    {t('show.modals.duplicate.reasonLabel')}
                                </label>
                                <DuplicateForm
                                    certificateId={certificate.id}
                                    onCancel={() => setModal(null)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

// Formulaire interne pour le duplicata
function DuplicateForm({
    certificateId,
    onCancel,
}: {
    certificateId: string;
    onCancel: () => void;
}) {
    const { t } = useTranslation('certificates');
    const { t: tc } = useTranslation('common');
    const { data, setData, post, processing, errors } = useForm({ reason: '' });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
                value={data.reason}
                onChange={(e) => setData('reason', e.target.value)}
                rows={3}
                style={{
                    width: '100%',
                    padding: '10px 13px',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: '#1e293b',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 9,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                }}
                placeholder={t('show.modals.duplicate.reasonPlaceholder')}
            />
            {errors.reason && (
                <p style={{ fontSize: 11, color: '#dc2626' }}>
                    {errors.reason}
                </p>
            )}
            <div
                style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
            >
                <button
                    onClick={onCancel}
                    style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                    }}
                >
                    {tc('actions.cancel')}
                </button>
                <button
                    disabled={processing || !data.reason.trim()}
                    onClick={() =>
                        post(
                            route('admin.certificates.duplicate', {
                                certificate: certificateId,
                            }),
                        )
                    }
                    style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#1e3a8a',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                        opacity: processing || !data.reason.trim() ? 0.5 : 1,
                    }}
                >
                    {processing
                        ? t('show.modals.duplicate.generating')
                        : t('show.modals.duplicate.action')}
                </button>
            </div>
        </div>
    );
}
