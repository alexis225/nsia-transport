import { Head, Link, useForm } from '@inertiajs/react';
import {
    Upload,
    FileText,
    X,
    AlertCircle,
    ChevronLeft,
    Building2,
} from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Country {
    code: string;
    name_fr: string;
}
interface Tenant {
    id: string;
    name: string;
    code: string;
}
interface Props {
    countries: Country[];
    tenant: Tenant | null;
    tenants: Tenant[];
}

export default function PartnerCertificateRequestCreate({
    countries,
    tenant,
    tenants,
}: Props) {
    const { t } = useTranslation('certificates');
    const { t: tc } = useTranslation('common');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('partner.requests.index.breadcrumb'),
            href: '/partner/certificate-requests',
        },
        {
            title: t('partner.requests.create.breadcrumb'),
            href: '/partner/certificate-requests/create',
        },
    ];

    const DOCUMENT_TYPES: { key: string; label: string; hint: string }[] = [
        {
            key: 'BL',
            label: t('partner.requests.create.documentTypes.BL.label'),
            hint: t('partner.requests.create.documentTypes.BL.hint'),
        },
        {
            key: 'FACTURE',
            label: t('partner.requests.create.documentTypes.FACTURE.label'),
            hint: t('partner.requests.create.documentTypes.FACTURE.hint'),
        },
        {
            key: 'FDI',
            label: t('partner.requests.create.documentTypes.FDI.label'),
            hint: t('partner.requests.create.documentTypes.FDI.hint'),
        },
        {
            key: 'DOCUMENTS_TRANSPORT',
            label: t(
                'partner.requests.create.documentTypes.DOCUMENTS_TRANSPORT.label',
            ),
            hint: t(
                'partner.requests.create.documentTypes.DOCUMENTS_TRANSPORT.hint',
            ),
        },
        {
            key: 'AUTRE',
            label: t('partner.requests.create.documentTypes.AUTRE.label'),
            hint: t('partner.requests.create.documentTypes.AUTRE.hint'),
        },
    ];

    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const { data, setData, post, transform, processing, errors } = useForm({
        tenant_id: tenants.length > 0 ? (tenant?.id ?? '') : '',
        country_code: '',
        insured_name: '',
        voyage_from: '',
        voyage_to: '',
        voyage_date: '',
        transport_type: '',
        cargo_description: '',
        estimated_value: '',
        currency_code: 'XOF',
        notes: '',
        documents: [] as File[],
        document_types: [] as string[],
    });

    function addFiles(type: string, files: FileList | null) {
        if (!files || files.length === 0) {
            return;
        }

        setData({
            ...data,
            documents: [...data.documents, ...Array.from(files)],
            document_types: [
                ...data.document_types,
                ...Array.from(files).map(() => type),
            ],
        });
    }

    function removeFile(index: number) {
        setData({
            ...data,
            documents: data.documents.filter((_, i) => i !== index),
            document_types: data.document_types.filter((_, i) => i !== index),
        });
    }

    function submit(e: React.FormEvent, saveAs: 'draft' | 'submit') {
        e.preventDefault();
        transform((d) => ({ ...d, save_as: saveAs }));
        post(route('partner.certificate-requests.store'), {
            forceFormData: true,
        });
    }

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '5px',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px 10px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
    };
    const errorStyle: React.CSSProperties = {
        color: '#dc2626',
        fontSize: '12px',
        marginTop: '3px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    };
    const cardStyle: React.CSSProperties = {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('partner.requests.create.title')} />

            <div
                style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px',
                    }}
                >
                    <Link href={route('partner.certificate-requests.index')}>
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
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: 0,
                            }}
                        >
                            {t('partner.requests.create.heading')}
                        </h1>
                        <p
                            style={{
                                color: '#64748b',
                                fontSize: '13px',
                                margin: '2px 0 0',
                            }}
                        >
                            {t('partner.requests.create.subtitle')}
                        </p>
                    </div>
                </div>

                <form onSubmit={(e) => submit(e, 'submit')}>
                    <div style={cardStyle}>
                        <h2
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: '0 0 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Building2 size={16} />{' '}
                            {t('partner.requests.create.tenant.title')}
                        </h2>
                        {tenants.length > 0 ? (
                            <div>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={data.tenant_id}
                                    onChange={(e) =>
                                        setData('tenant_id', e.target.value)
                                    }
                                >
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.code})
                                        </option>
                                    ))}
                                </select>
                                <div
                                    style={{
                                        fontSize: 11.5,
                                        color: '#94a3b8',
                                        marginTop: 6,
                                    }}
                                >
                                    {t(
                                        'partner.requests.create.tenant.multipleHint',
                                    )}
                                </div>
                                {errors.tenant_id && (
                                    <p style={errorStyle}>
                                        <AlertCircle size={12} />
                                        {errors.tenant_id}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 12px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 6,
                                    fontSize: 13,
                                    color: '#374151',
                                }}
                            >
                                {tenant
                                    ? `${tenant.name} (${tenant.code})`
                                    : '—'}
                                <span
                                    style={{ color: '#94a3b8', fontSize: 11.5 }}
                                >
                                    {t(
                                        'partner.requests.create.tenant.attachedHint',
                                    )}
                                </span>
                            </div>
                        )}
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
                            {t('partner.requests.create.shipment.title')}
                        </h2>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '14px',
                            }}
                        >
                            <div>
                                <label style={labelStyle}>
                                    {t(
                                        'partner.requests.create.shipment.insuredName',
                                    )}
                                </label>
                                <input
                                    style={{
                                        ...inputStyle,
                                        borderColor: errors.insured_name
                                            ? '#fca5a5'
                                            : '#e2e8f0',
                                    }}
                                    value={data.insured_name}
                                    onChange={(e) =>
                                        setData('insured_name', e.target.value)
                                    }
                                    placeholder={t(
                                        'partner.requests.create.shipment.insuredNamePlaceholder',
                                    )}
                                />
                                {errors.insured_name && (
                                    <p style={errorStyle}>
                                        <AlertCircle size={12} />
                                        {errors.insured_name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    {t(
                                        'partner.requests.create.shipment.country',
                                    )}
                                </label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={data.country_code}
                                    onChange={(e) =>
                                        setData('country_code', e.target.value)
                                    }
                                >
                                    <option value="">
                                        {t(
                                            'partner.requests.create.shipment.countryPlaceholder',
                                        )}
                                    </option>
                                    {countries.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.name_fr}
                                        </option>
                                    ))}
                                </select>
                                {errors.country_code && (
                                    <p style={errorStyle}>
                                        <AlertCircle size={12} />
                                        {errors.country_code}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    {t('partner.requests.create.shipment.from')}
                                </label>
                                <input
                                    style={inputStyle}
                                    value={data.voyage_from}
                                    onChange={(e) =>
                                        setData('voyage_from', e.target.value)
                                    }
                                    placeholder={t(
                                        'partner.requests.create.shipment.fromPlaceholder',
                                    )}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    {t('partner.requests.create.shipment.to')}
                                </label>
                                <input
                                    style={inputStyle}
                                    value={data.voyage_to}
                                    onChange={(e) =>
                                        setData('voyage_to', e.target.value)
                                    }
                                    placeholder={t(
                                        'partner.requests.create.shipment.toPlaceholder',
                                    )}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    {t('partner.requests.create.shipment.date')}
                                </label>
                                <input
                                    type="date"
                                    style={inputStyle}
                                    value={data.voyage_date}
                                    onChange={(e) =>
                                        setData('voyage_date', e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    {t(
                                        'partner.requests.create.shipment.transportMode',
                                    )}
                                </label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={data.transport_type}
                                    onChange={(e) =>
                                        setData(
                                            'transport_type',
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        {t(
                                            'partner.requests.create.shipment.transportModeUnspecified',
                                        )}
                                    </option>
                                    <option value="SEA">
                                        {t('shared.transport.SEA')}
                                    </option>
                                    <option value="AIR">
                                        {t('shared.transport.AIR')}
                                    </option>
                                    <option value="ROAD">
                                        {t('shared.transport.ROAD')}
                                    </option>
                                    <option value="RAIL">
                                        {t('shared.transport.RAIL')}
                                    </option>
                                    <option value="MULTIMODAL">
                                        {t('shared.transport.MULTIMODAL')}
                                    </option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label style={labelStyle}>
                                    {t(
                                        'partner.requests.create.shipment.cargoDescription',
                                    )}
                                </label>
                                <textarea
                                    style={{
                                        ...inputStyle,
                                        resize: 'vertical',
                                    }}
                                    rows={2}
                                    value={data.cargo_description}
                                    onChange={(e) =>
                                        setData(
                                            'cargo_description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'partner.requests.create.shipment.cargoDescriptionPlaceholder',
                                    )}
                                />
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
                            {t('partner.requests.create.value.title')}
                        </h2>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr',
                                gap: '14px',
                            }}
                        >
                            <div>
                                <label style={labelStyle}>
                                    {t(
                                        'partner.requests.create.value.estimatedValue',
                                    )}
                                </label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={data.estimated_value}
                                    onChange={(e) =>
                                        setData(
                                            'estimated_value',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'partner.requests.create.value.estimatedValuePlaceholder',
                                    )}
                                />
                                {errors.estimated_value && (
                                    <p style={errorStyle}>
                                        <AlertCircle size={12} />
                                        {errors.estimated_value}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    {t(
                                        'partner.requests.create.value.currency',
                                    )}
                                </label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={data.currency_code}
                                    onChange={(e) =>
                                        setData('currency_code', e.target.value)
                                    }
                                >
                                    <option value="XOF">XOF</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="XAF">XAF</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <h2
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: '0 0 4px',
                            }}
                        >
                            {t('partner.requests.create.documents.title')}
                        </h2>
                        <p
                            style={{
                                fontSize: 12,
                                color: '#94a3b8',
                                margin: '0 0 16px',
                            }}
                        >
                            {t('partner.requests.create.documents.hint')}
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14,
                            }}
                        >
                            {DOCUMENT_TYPES.map((docType) => {
                                const files = data.documents
                                    .map((file, i) => ({ file, i }))
                                    .filter(
                                        ({ i }) =>
                                            data.document_types[i] ===
                                            docType.key,
                                    );

                                return (
                                    <div
                                        key={docType.key}
                                        style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 8,
                                            padding: 14,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom:
                                                    files.length > 0 ? 10 : 0,
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: '#1e293b',
                                                    }}
                                                >
                                                    {docType.label}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: '#94a3b8',
                                                    }}
                                                >
                                                    {docType.hint}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRefs.current[
                                                        docType.key
                                                    ]?.click()
                                                }
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                    padding: '6px 12px',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: 6,
                                                    background: '#f8fafc',
                                                    cursor: 'pointer',
                                                    fontSize: 12,
                                                    color: '#374151',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                <Upload size={13} />{' '}
                                                {t(
                                                    'partner.requests.create.documents.add',
                                                )}
                                            </button>
                                            <input
                                                ref={(el) => {
                                                    fileInputRefs.current[
                                                        docType.key
                                                    ] = el;
                                                }}
                                                type="file"
                                                multiple
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    addFiles(
                                                        docType.key,
                                                        e.target.files,
                                                    );
                                                    e.target.value = '';
                                                }}
                                            />
                                        </div>

                                        {files.length > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 6,
                                                }}
                                            >
                                                {files.map(({ file, i }) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 8,
                                                            padding: '8px 10px',
                                                            background:
                                                                '#f0fdf4',
                                                            border: '1px solid #bbf7d0',
                                                            borderRadius: 6,
                                                        }}
                                                    >
                                                        <FileText
                                                            size={15}
                                                            color="#16a34a"
                                                        />
                                                        <div
                                                            style={{
                                                                flex: 1,
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <p
                                                                style={{
                                                                    margin: 0,
                                                                    fontWeight: 500,
                                                                    fontSize: 12,
                                                                    color: '#15803d',
                                                                    overflow:
                                                                        'hidden',
                                                                    textOverflow:
                                                                        'ellipsis',
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                }}
                                                            >
                                                                {file.name}
                                                            </p>
                                                            <p
                                                                style={{
                                                                    margin: 0,
                                                                    fontSize: 11,
                                                                    color: '#64748b',
                                                                }}
                                                            >
                                                                {t(
                                                                    'partner.requests.create.documents.sizeKo',
                                                                    {
                                                                        size: (
                                                                            file.size /
                                                                            1024
                                                                        ).toFixed(
                                                                            0,
                                                                        ),
                                                                    },
                                                                )}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeFile(i)
                                                            }
                                                            style={{
                                                                border: 'none',
                                                                background:
                                                                    'none',
                                                                cursor: 'pointer',
                                                                color: '#dc2626',
                                                            }}
                                                        >
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
                        {errors.documents && (
                            <p style={errorStyle}>
                                <AlertCircle size={12} />
                                {errors.documents}
                            </p>
                        )}
                    </div>

                    <div style={cardStyle}>
                        <h2
                            style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: '0 0 12px',
                            }}
                        >
                            {t('partner.requests.create.notes.title')}
                        </h2>
                        <textarea
                            style={{ ...inputStyle, resize: 'vertical' }}
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder={t(
                                'partner.requests.create.notes.placeholder',
                            )}
                        />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Link
                            href={route('partner.certificate-requests.index')}
                        >
                            <Button type="button" variant="outline">
                                {tc('actions.cancel')}
                            </Button>
                        </Link>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={(e) => submit(e, 'draft')}
                        >
                            {processing
                                ? t('partner.requests.create.sending')
                                : t('partner.requests.create.saveDraft')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-[#1e3a8a] text-white hover:bg-[#1e40af]"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Upload size={15} />
                            {processing
                                ? t('partner.requests.create.sending')
                                : t('partner.requests.create.submit')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
