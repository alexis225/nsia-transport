import { Head, Link, router } from '@inertiajs/react';
import {
    Search,
    Award,
    ChevronLeft,
    ChevronRight,
    X,
    FileText,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface CertRow {
    id: string;
    certificate_number: string;
    status: string;
    document_type: string | null;
    insured_name: string;
    insured_value: string;
    currency_code: string;
    prime_total: string | null;
    transport_type: string | null;
    voyage_from: string;
    voyage_to: string;
    voyage_date: string;
    issued_at: string | null;
    created_at: string;
    tenant: { name: string; code: string } | null;
    contract: {
        contract_number: string;
        broker: { name: string } | null;
    } | null;
    template: { name: string; type: string } | null;
    issued_by: { first_name: string; last_name: string } | null;
}
interface Paginated<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    results: Paginated<CertRow> | null;
    hasSearch: boolean;
    filters: Record<string, string>;
    brokers: { id: string; name: string }[];
    templates: { id: string; name: string; type: string }[];
    tenants: { id: string; name: string; code: string }[];
    currencies: string[];
    isSA: boolean;
}

const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export default function CertificateSearch({
    results,
    hasSearch,
    filters,
    brokers,
    templates,
    tenants,
    currencies,
    isSA,
}: Props) {
    const { t } = useTranslation('certificates');
    const { t: tc } = useTranslation('common');

    const STATUS_META: Record<
        string,
        { label: string; color: string; bg: string }
    > = {
        ISSUED: {
            label: tc('certificateStatus.ISSUED'),
            color: '#15803d',
            bg: '#f0fdf4',
        },
        SUBMITTED: {
            label: tc('certificateStatus.SUBMITTED'),
            color: '#d97706',
            bg: '#fef3c7',
        },
        DRAFT: {
            label: tc('certificateStatus.DRAFT'),
            color: '#64748b',
            bg: '#f8fafc',
        },
        REJECTED: {
            label: tc('certificateStatus.REJECTED'),
            color: '#dc2626',
            bg: '#fef2f2',
        },
        REPLACED: {
            label: tc('certificateStatus.REPLACED'),
            color: '#475569',
            bg: '#f1f5f9',
        },
        CANCELLED: {
            label: tc('certificateStatus.CANCELLED'),
            color: '#991b1b',
            bg: '#fef2f2',
        },
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('admin.dashboard') },
        {
            title: t('shared.breadcrumb'),
            href: route('admin.certificates.index'),
        },
        { title: t('search.breadcrumb') },
    ];

    const [f, setF] = useState<Record<string, string>>(filters);

    const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

    const apply = () => {
        const params = Object.fromEntries(
            Object.entries(f).filter(([, v]) => v),
        );
        router.get(route('admin.certificates.search'), params, {
            preserveState: false,
        });
    };

    const reset = () => {
        setF({});
        router.get(
            route('admin.certificates.search'),
            {},
            { preserveState: false },
        );
    };

    const paginateTo = (url: string | null) =>
        url && router.visit(url, { preserveState: true });

    const inputStyle = {
        height: 32,
        border: '1.5px solid #e2e8f0',
        borderRadius: 7,
        padding: '0 10px',
        fontSize: 12,
        fontFamily: 'inherit',
        color: '#1e293b',
        background: '#fff',
        outline: 'none',
        width: '100%',
    } as const;

    const selStyle = { ...inputStyle, cursor: 'pointer' };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('search.title')} />
            <style>{`
                .srch-page { padding:4px; display:flex; flex-direction:column; gap:14px; }
                .srch-panel { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; }
                .srch-panel-hdr { padding:11px 16px; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:600; color:#1e293b; display:flex; align-items:center; gap:6px; }
                .srch-body { padding:16px; display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
                .field { display:flex; flex-direction:column; gap:4px; }
                .field-label { font-size:10px; color:#64748b; font-weight:500; text-transform:uppercase; letter-spacing:.04em; }
                .field-span2 { grid-column:span 2; }
                .field-span3 { grid-column:span 3; }
                .btn { height:32px; padding:0 16px; border-radius:7px; border:none; cursor:pointer; font-size:12px; font-family:inherit; display:inline-flex; align-items:center; gap:6px; font-weight:500; }
                .btn-primary { background:#1d4ed8; color:#fff; } .btn-primary:hover { background:#1e3a8a; }
                .btn-danger  { background:#fef2f2; color:#dc2626; border:1.5px solid #fecaca; }
                .btn-sec     { background:#f8fafc; color:#475569; border:1.5px solid #e2e8f0; }
                .results-panel { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; }
                table { width:100%; border-collapse:collapse; }
                th { padding:8px 13px; font-size:9.5px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.07em; text-align:left; background:#f8fafc; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
                td { padding:9px 13px; font-size:12px; color:#334155; border-bottom:1px solid #f8fafc; vertical-align:middle; }
                tr:last-child td { border-bottom:none; }
                tr:hover td { background:#fafafa; }
                .cert-num { font-family:monospace; font-size:12px; font-weight:700; color:#1e293b; }
                .badge { display:inline-block; padding:2px 8px; border-radius:8px; font-size:10px; font-weight:600; }
                .pg-row { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-top:1px solid #f8fafc; }
                .pg-btn { width:28px; height:28px; border-radius:6px; border:1.5px solid #e2e8f0; background:#fff; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; color:#475569; }
                .pg-btn:hover:not(:disabled) { border-color:#1e3a8a; color:#1e3a8a; }
                .pg-btn.act { background:#1e3a8a; border-color:#1e3a8a; color:#fff; }
                .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
                .date-range { display:flex; align-items:center; gap:6px; }
                .date-range input { flex:1; }
                .sep { font-size:11px; color:#94a3b8; flex-shrink:0; }
                @media(max-width:900px) { .srch-body { grid-template-columns:repeat(2,1fr); } }
                @media(max-width:600px) { .srch-body { grid-template-columns:1fr; } .field-span2,.field-span3 { grid-column:span 1; } }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="srch-page">
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div>
                            <h1
                                style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: '#1e293b',
                                }}
                            >
                                {t('search.heading')}
                            </h1>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#94a3b8',
                                    marginTop: 3,
                                }}
                            >
                                {t('search.subtitle')}
                            </p>
                        </div>
                        <Link
                            href={route('admin.certificates.index')}
                            style={{
                                fontSize: 12,
                                color: '#1d4ed8',
                                textDecoration: 'none',
                                background: '#eff6ff',
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: '1px solid #bfdbfe',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                            }}
                        >
                            <FileText size={13} />{' '}
                            {t('search.manageCertificates')}
                        </Link>
                    </div>

                    {/* Formulaire de recherche */}
                    <div className="srch-panel">
                        <div className="srch-panel-hdr">
                            <Search size={14} color="#1d4ed8" />{' '}
                            {t('search.criteria')}
                        </div>
                        <div className="srch-body">
                            {/* Recherche texte */}
                            <div className="field field-span3">
                                <label className="field-label">
                                    {t('search.fields.freeText')}
                                </label>
                                <input
                                    style={inputStyle}
                                    placeholder={t(
                                        'search.fields.freeTextPlaceholder',
                                    )}
                                    value={f.q ?? ''}
                                    onChange={(e) => set('q', e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && apply()
                                    }
                                />
                            </div>

                            {/* Statut */}
                            <div className="field">
                                <label className="field-label">
                                    {t('search.fields.status')}
                                </label>
                                <select
                                    style={selStyle}
                                    value={f.status ?? ''}
                                    onChange={(e) =>
                                        set('status', e.target.value)
                                    }
                                >
                                    <option value="">
                                        {t('search.fields.all')}
                                    </option>
                                    <option value="ISSUED">
                                        {tc('certificateStatus.ISSUED')}
                                    </option>
                                    <option value="SUBMITTED">
                                        {tc('certificateStatus.SUBMITTED')}
                                    </option>
                                    <option value="DRAFT">
                                        {tc('certificateStatus.DRAFT')}
                                    </option>
                                    <option value="REJECTED">
                                        {tc('certificateStatus.REJECTED')}
                                    </option>
                                    <option value="REPLACED">
                                        {tc('certificateStatus.REPLACED')}
                                    </option>
                                    <option value="CANCELLED">
                                        {tc('certificateStatus.CANCELLED')}
                                    </option>
                                </select>
                            </div>

                            {/* Mode transport */}
                            <div className="field">
                                <label className="field-label">
                                    {t('search.fields.transportMode')}
                                </label>
                                <select
                                    style={selStyle}
                                    value={f.transport_type ?? ''}
                                    onChange={(e) =>
                                        set('transport_type', e.target.value)
                                    }
                                >
                                    <option value="">
                                        {t('search.fields.all')}
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

                            {/* Type document */}
                            <div className="field">
                                <label className="field-label">
                                    {t('search.fields.documentType')}
                                </label>
                                <select
                                    style={selStyle}
                                    value={f.document_type ?? ''}
                                    onChange={(e) =>
                                        set('document_type', e.target.value)
                                    }
                                >
                                    <option value="">
                                        {t('search.fields.all')}
                                    </option>
                                    <option value="original">
                                        {t('search.fields.original')}
                                    </option>
                                    <option value="duplicata">
                                        {t('search.fields.duplicata')}
                                    </option>
                                </select>
                            </div>

                            {/* Devise */}
                            <div className="field">
                                <label className="field-label">
                                    {t('search.fields.currency')}
                                </label>
                                <select
                                    style={selStyle}
                                    value={f.currency_code ?? ''}
                                    onChange={(e) =>
                                        set('currency_code', e.target.value)
                                    }
                                >
                                    <option value="">
                                        {t('search.fields.allCurrencies')}
                                    </option>
                                    {currencies.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Mode de garantie */}
                            <div className="field">
                                <label className="field-label">
                                    {t('search.fields.guaranteeMode')}
                                </label>
                                <select
                                    style={selStyle}
                                    value={f.guarantee_mode ?? ''}
                                    onChange={(e) =>
                                        set('guarantee_mode', e.target.value)
                                    }
                                >
                                    <option value="">
                                        {t('search.fields.all')}
                                    </option>
                                    <option value="TOUS_RISQUES">
                                        {t('shared.coverage.TOUS_RISQUES')}
                                    </option>
                                    <option value="FAP_SAUF">
                                        {t('shared.coverage.FAP_SAUF')}
                                    </option>
                                    <option value="FAP_ABSOLUE">
                                        {t('shared.coverage.FAP_ABSOLUE')}
                                    </option>
                                </select>
                            </div>

                            {/* Courtier */}
                            {brokers.length > 0 && (
                                <div className="field">
                                    <label className="field-label">
                                        {t('search.fields.broker')}
                                    </label>
                                    <select
                                        style={selStyle}
                                        value={f.broker_id ?? ''}
                                        onChange={(e) =>
                                            set('broker_id', e.target.value)
                                        }
                                    >
                                        <option value="">
                                            {t('search.fields.all')}
                                        </option>
                                        {brokers.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Modèle certificat */}
                            {templates.length > 0 && (
                                <div className="field">
                                    <label className="field-label">
                                        {t('search.fields.template')}
                                    </label>
                                    <select
                                        style={selStyle}
                                        value={f.template_id ?? ''}
                                        onChange={(e) =>
                                            set('template_id', e.target.value)
                                        }
                                    >
                                        <option value="">
                                            {t('search.fields.all')}
                                        </option>
                                        {templates.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Filiale (SA) */}
                            {isSA && tenants.length > 0 && (
                                <div className="field">
                                    <label className="field-label">
                                        {t('search.fields.subsidiary')}
                                    </label>
                                    <select
                                        style={selStyle}
                                        value={f.tenant_id ?? ''}
                                        onChange={(e) =>
                                            set('tenant_id', e.target.value)
                                        }
                                    >
                                        <option value="">
                                            {t('search.fields.allCurrencies')}
                                        </option>
                                        {tenants.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                [{t.code}] {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Date émission */}
                            <div className="field field-span2">
                                <label className="field-label">
                                    {t('search.fields.issuedDate')}
                                </label>
                                <div className="date-range">
                                    <input
                                        type="date"
                                        style={inputStyle}
                                        value={f.issued_from ?? ''}
                                        onChange={(e) =>
                                            set('issued_from', e.target.value)
                                        }
                                    />
                                    <span className="sep">→</span>
                                    <input
                                        type="date"
                                        style={inputStyle}
                                        value={f.issued_to ?? ''}
                                        onChange={(e) =>
                                            set('issued_to', e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            {/* Date voyage */}
                            <div className="field field-span2">
                                <label className="field-label">
                                    {t('search.fields.voyageDate')}
                                </label>
                                <div className="date-range">
                                    <input
                                        type="date"
                                        style={inputStyle}
                                        value={f.voyage_from_date ?? ''}
                                        onChange={(e) =>
                                            set(
                                                'voyage_from_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <span className="sep">→</span>
                                    <input
                                        type="date"
                                        style={inputStyle}
                                        value={f.voyage_to_date ?? ''}
                                        onChange={(e) =>
                                            set(
                                                'voyage_to_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {/* Valeur assurée */}
                            <div className="field field-span2">
                                <label className="field-label">
                                    {t('search.fields.insuredValue')}
                                </label>
                                <div className="date-range">
                                    <input
                                        type="number"
                                        style={inputStyle}
                                        placeholder={t('index.filters.min')}
                                        value={f.value_min ?? ''}
                                        onChange={(e) =>
                                            set('value_min', e.target.value)
                                        }
                                    />
                                    <span className="sep">—</span>
                                    <input
                                        type="number"
                                        style={inputStyle}
                                        placeholder={t('index.filters.max')}
                                        value={f.value_max ?? ''}
                                        onChange={(e) =>
                                            set('value_max', e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            {/* Boutons */}
                            <div
                                className="field field-span3"
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                    justifyContent: 'flex-end',
                                }}
                            >
                                {hasSearch && (
                                    <button
                                        className="btn btn-danger"
                                        onClick={reset}
                                    >
                                        <X size={12} /> {t('search.clear')}
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary"
                                    onClick={apply}
                                >
                                    <Search size={13} /> {t('search.searchBtn')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Résultats */}
                    {!hasSearch && (
                        <div
                            style={{
                                padding: '40px',
                                textAlign: 'center',
                                color: '#94a3b8',
                                fontSize: 13,
                                background: '#f8fafc',
                                borderRadius: 12,
                                border: '1.5px dashed #e2e8f0',
                            }}
                        >
                            <Search
                                size={32}
                                style={{ marginBottom: 10, opacity: 0.3 }}
                            />
                            <div style={{ fontWeight: 500 }}>
                                {t('search.beforeSearch.title')}
                            </div>
                            <div style={{ fontSize: 11, marginTop: 4 }}>
                                {t('search.beforeSearch.hint')}
                            </div>
                        </div>
                    )}

                    {hasSearch && results && (
                        <div className="results-panel">
                            <div
                                style={{
                                    padding: '11px 16px',
                                    borderBottom: '1px solid #f1f5f9',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Award size={14} color="#1d4ed8" />
                                {t('search.results.found', {
                                    count: results.total,
                                })}
                            </div>
                            {results.data.length === 0 ? (
                                <div
                                    style={{
                                        padding: '40px',
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                        fontSize: 13,
                                    }}
                                >
                                    <Search
                                        size={28}
                                        style={{
                                            marginBottom: 8,
                                            opacity: 0.4,
                                        }}
                                    />
                                    <div>{t('search.results.none')}</div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>
                                                        {t(
                                                            'search.table.number',
                                                        )}
                                                    </th>
                                                    <th>
                                                        {t(
                                                            'search.table.insured',
                                                        )}
                                                    </th>
                                                    <th>
                                                        {t(
                                                            'search.table.broker',
                                                        )}
                                                    </th>
                                                    <th>
                                                        {t('search.table.mode')}
                                                    </th>
                                                    <th>
                                                        {t(
                                                            'search.table.voyage',
                                                        )}
                                                    </th>
                                                    <th>
                                                        {t(
                                                            'search.table.value',
                                                        )}
                                                    </th>
                                                    <th>
                                                        {t(
                                                            'search.table.prime',
                                                        )}
                                                    </th>
                                                    {isSA && (
                                                        <th>
                                                            {t(
                                                                'search.table.subsidiary',
                                                            )}
                                                        </th>
                                                    )}
                                                    <th>
                                                        {t(
                                                            'search.table.status',
                                                        )}
                                                    </th>
                                                    <th>
                                                        {t(
                                                            'search.table.issuedDate',
                                                        )}
                                                    </th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.data.map((c) => {
                                                    const s = STATUS_META[
                                                        c.status
                                                    ] ?? {
                                                        label: c.status,
                                                        color: '#64748b',
                                                        bg: '#f8fafc',
                                                    };

                                                    return (
                                                        <tr key={c.id}>
                                                            <td>
                                                                <div className="cert-num">
                                                                    {
                                                                        c.certificate_number
                                                                    }
                                                                </div>
                                                                {c.document_type ===
                                                                    'duplicata' && (
                                                                    <span
                                                                        style={{
                                                                            fontSize: 9,
                                                                            color: '#7c3aed',
                                                                            background:
                                                                                '#fdf4ff',
                                                                            padding:
                                                                                '0 4px',
                                                                            borderRadius: 4,
                                                                        }}
                                                                    >
                                                                        {t(
                                                                            'search.table.duplicateTag',
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div
                                                                    style={{
                                                                        fontWeight: 500,
                                                                        color: '#1e293b',
                                                                        maxWidth: 140,
                                                                        overflow:
                                                                            'hidden',
                                                                        textOverflow:
                                                                            'ellipsis',
                                                                        whiteSpace:
                                                                            'nowrap',
                                                                    }}
                                                                >
                                                                    {
                                                                        c.insured_name
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: '#64748b',
                                                                    maxWidth: 120,
                                                                    overflow:
                                                                        'hidden',
                                                                    textOverflow:
                                                                        'ellipsis',
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                }}
                                                            >
                                                                {c.contract
                                                                    ?.broker
                                                                    ?.name ??
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                <span
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: '#0284c7',
                                                                        background:
                                                                            '#e0f2fe',
                                                                        padding:
                                                                            '1px 5px',
                                                                        borderRadius: 5,
                                                                    }}
                                                                >
                                                                    {c.transport_type ??
                                                                        '—'}
                                                                </span>
                                                            </td>
                                                            <td
                                                                style={{
                                                                    fontSize: 11,
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        color: '#475569',
                                                                    }}
                                                                >
                                                                    {
                                                                        c.voyage_from
                                                                    }
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                    }}
                                                                >
                                                                    →{' '}
                                                                    {
                                                                        c.voyage_to
                                                                    }
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        color: '#94a3b8',
                                                                        fontSize: 10,
                                                                    }}
                                                                >
                                                                    {fmt(
                                                                        c.voyage_date,
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div
                                                                    style={{
                                                                        fontFamily:
                                                                            'monospace',
                                                                        fontSize: 11,
                                                                    }}
                                                                >
                                                                    {parseFloat(
                                                                        c.insured_value,
                                                                    ).toLocaleString(
                                                                        'fr-FR',
                                                                    )}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: '#94a3b8',
                                                                    }}
                                                                >
                                                                    {
                                                                        c.currency_code
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td
                                                                style={{
                                                                    fontFamily:
                                                                        'monospace',
                                                                    fontSize: 11,
                                                                }}
                                                            >
                                                                {c.prime_total
                                                                    ? parseFloat(
                                                                          c.prime_total,
                                                                      ).toLocaleString(
                                                                          'fr-FR',
                                                                      )
                                                                    : '—'}
                                                            </td>
                                                            {isSA && (
                                                                <td
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: '#64748b',
                                                                    }}
                                                                >
                                                                    {c.tenant
                                                                        ?.code ??
                                                                        '—'}
                                                                </td>
                                                            )}
                                                            <td>
                                                                <span
                                                                    className="badge"
                                                                    style={{
                                                                        color: s.color,
                                                                        background:
                                                                            s.bg,
                                                                    }}
                                                                >
                                                                    {s.label}
                                                                </span>
                                                            </td>
                                                            <td
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: '#64748b',
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                }}
                                                            >
                                                                {c.issued_at
                                                                    ? fmt(
                                                                          c.issued_at,
                                                                      )
                                                                    : '—'}
                                                                {c.issued_by && (
                                                                    <div
                                                                        style={{
                                                                            fontSize: 10,
                                                                            color: '#94a3b8',
                                                                        }}
                                                                    >
                                                                        {
                                                                            c
                                                                                .issued_by
                                                                                .first_name
                                                                        }{' '}
                                                                        {c.issued_by.last_name.charAt(
                                                                            0,
                                                                        )}
                                                                        .
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Link
                                                                    href={route(
                                                                        'admin.certificates.show',
                                                                        {
                                                                            certificate:
                                                                                c.id,
                                                                        },
                                                                    )}
                                                                    style={{
                                                                        fontSize: 11,
                                                                        color: '#1d4ed8',
                                                                        textDecoration:
                                                                            'none',
                                                                    }}
                                                                >
                                                                    {t(
                                                                        'search.table.view',
                                                                    )}
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {results.last_page > 1 && (
                                        <div className="pg-row">
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                {t('search.results.summary', {
                                                    total: results.total,
                                                    current:
                                                        results.current_page,
                                                    last: results.last_page,
                                                })}
                                            </span>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: 4,
                                                }}
                                            >
                                                <button
                                                    className="pg-btn"
                                                    disabled={
                                                        results.current_page ===
                                                        1
                                                    }
                                                    onClick={() =>
                                                        paginateTo(
                                                            results.links[0]
                                                                ?.url ?? null,
                                                        )
                                                    }
                                                >
                                                    <ChevronLeft size={13} />
                                                </button>
                                                {results.links
                                                    .slice(1, -1)
                                                    .map((link, i) => (
                                                        <button
                                                            key={i}
                                                            className={`pg-btn ${link.active ? 'act' : ''}`}
                                                            onClick={() =>
                                                                paginateTo(
                                                                    link.url,
                                                                )
                                                            }
                                                            disabled={!link.url}
                                                            dangerouslySetInnerHTML={{
                                                                __html: link.label,
                                                            }}
                                                        />
                                                    ))}
                                                <button
                                                    className="pg-btn"
                                                    disabled={
                                                        results.current_page ===
                                                        results.last_page
                                                    }
                                                    onClick={() =>
                                                        paginateTo(
                                                            results.links[
                                                                results.links
                                                                    .length - 1
                                                            ]?.url ?? null,
                                                        )
                                                    }
                                                >
                                                    <ChevronRight size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
