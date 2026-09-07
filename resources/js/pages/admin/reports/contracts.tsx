import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    AlertTriangle,
    CheckCircle,
    Clock,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Types ────────────────────────────────────────────────────
interface ContractRow {
    id: string;
    contract_number: string;
    type: string;
    status: string;
    insured_name: string;
    currency_code: string;
    subscription_limit: string | null;
    used_limit: string | null;
    premium_rate: string | null;
    coverage_type: string | null;
    effective_date: string | null;
    expiry_date: string | null;
    created_at: string;
    certificates_count: number;
    issued_certificates_count: number;
    broker: { name: string; code: string; type: string } | null;
    tenant: { name: string; code: string } | null;
}
interface BreakRow {
    type?: string;
    status?: string;
    count: number;
}
interface Paginated<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    contracts: Paginated<ContractRow>;
    stats: {
        total: number;
        active: number;
        draft: number;
        suspended: number;
        expired: number;
        cancelled: number;
        expiring_30: number;
        expiring_7: number;
        total_limit: number;
        total_used: number;
        requires_approval_count: number;
    };
    avgUsagePct: number | null;
    byType: BreakRow[];
    byStatus: BreakRow[];
    brokers: { id: string; name: string; code: string }[];
    tenants: { id: string; name: string; code: string }[];
    filters: {
        status: string;
        type: string | null;
        broker_id: string | null;
        tenant_id: string | null;
        search: string | null;
        date_from: string | null;
        date_to: string | null;
        date_field: string;
        limit_min: string | null;
        limit_max: string | null;
    };
    isSA: boolean;
}

// ── Constants ────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    ACTIVE: { color: '#15803d', bg: '#f0fdf4' },
    DRAFT: { color: '#64748b', bg: '#f8fafc' },
    SUSPENDED: { color: '#d97706', bg: '#fef3c7' },
    EXPIRED: { color: '#dc2626', bg: '#fef2f2' },
    CANCELLED: { color: '#94a3b8', bg: '#f1f5f9' },
};

// ── Helpers ──────────────────────────────────────────────────
const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
const fmtAmt = (v: string | number) =>
    parseFloat(String(v)).toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

function daysUntil(d: string) {
    return Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);
}

function UsageBar({
    used,
    limit,
}: {
    used: string | null;
    limit: string | null;
}) {
    if (!limit || parseFloat(limit) === 0) {
        return <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>;
    }

    const pct = Math.min(
        Math.round((parseFloat(used ?? '0') / parseFloat(limit)) * 100),
        100,
    );
    const color = pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#15803d';

    return (
        <div>
            <div style={{ fontSize: 11, fontWeight: 600, color }}>{pct}%</div>
            <div
                style={{
                    height: 4,
                    background: '#f1f5f9',
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginTop: 2,
                    width: 70,
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 2,
                    }}
                />
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>
                {fmtAmt(used ?? 0)} / {fmtAmt(limit)}
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    sub,
    color,
    bg,
    border,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    color: string;
    bg?: string;
    border?: string;
    icon?: any;
}) {
    return (
        <div
            style={{
                background: bg ?? '#fff',
                border: `1.5px solid ${border ?? '#e2e8f0'}`,
                borderRadius: 10,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}
        >
            {Icon && (
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${color}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Icon size={15} color={color} />
                </div>
            )}
            <div>
                <div
                    style={{
                        fontSize: 9.5,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color,
                        lineHeight: 1.1,
                    }}
                >
                    {value}
                </div>
                {sub && (
                    <div
                        style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}
                    >
                        {sub}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────
export default function ContractsReport({
    contracts,
    stats,
    avgUsagePct,
    byType,
    byStatus,
    brokers,
    tenants,
    filters,
    isSA,
}: Props) {
    const { t } = useTranslation('reports');
    const { t: tn } = useTranslation('navigation');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: tn('sections.dashboard'), href: route('admin.dashboard') },
        { title: t('breadcrumb.section') },
        { title: t('breadcrumb.contracts') },
    ];

    const TYPE_LABELS: Record<string, string> = {
        OPEN_POLICY: t('contracts.types.OPEN_POLICY'),
        VOYAGE: t('contracts.types.VOYAGE'),
        ANNUAL_VOYAGE: t('contracts.types.ANNUAL_VOYAGE'),
        TIERS_CHARGEUR: t('contracts.types.TIERS_CHARGEUR'),
    };

    const STATUS_LABELS: Record<string, string> = {
        ACTIVE: t('contracts.statuses.ACTIVE'),
        DRAFT: t('contracts.statuses.DRAFT'),
        SUSPENDED: t('contracts.statuses.SUSPENDED'),
        EXPIRED: t('contracts.statuses.EXPIRED'),
        CANCELLED: t('contracts.statuses.CANCELLED'),
    };

    const DATE_FIELD_LABELS: Record<string, string> = {
        effective_date: t('contracts.dateFields.effective_date'),
        expiry_date: t('contracts.dateFields.expiry_date'),
        created_at: t('contracts.dateFields.created_at'),
    };

    const [local, setLocal] = useState({ ...filters });
    const [showAdv, setShowAdv] = useState(
        !!(
            filters.broker_id ||
            filters.tenant_id ||
            filters.date_from ||
            filters.limit_min ||
            filters.limit_max
        ),
    );

    const apply = () => {
        const p: Record<string, string> = {
            status: local.status,
            date_field: local.date_field,
        };

        if (local.type) {
            p.type = local.type;
        }

        if (local.broker_id) {
            p.broker_id = local.broker_id;
        }

        if (local.tenant_id) {
            p.tenant_id = local.tenant_id;
        }

        if (local.search) {
            p.search = local.search;
        }

        if (local.date_from) {
            p.date_from = local.date_from;
        }

        if (local.date_to) {
            p.date_to = local.date_to;
        }

        if (local.limit_min) {
            p.limit_min = local.limit_min;
        }

        if (local.limit_max) {
            p.limit_max = local.limit_max;
        }

        router.get(route('admin.reports.contracts'), p, {
            preserveState: false,
        });
    };

    const reset = () =>
        router.get(
            route('admin.reports.contracts'),
            {},
            { preserveState: false },
        );

    const paginateTo = (url: string | null) =>
        url && router.visit(url, { preserveState: true });

    const hasActive = !!(
        filters.type ||
        filters.broker_id ||
        filters.tenant_id ||
        filters.search ||
        filters.date_from ||
        filters.limit_min ||
        filters.limit_max ||
        filters.status !== 'ALL'
    );

    const usageRemaining =
        stats.total_limit > 0
            ? Math.round(
                  ((stats.total_limit - stats.total_used) / stats.total_limit) *
                      100,
              )
            : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('contracts.title')} />
            <style>{`
                .rpt-page  { padding:4px; display:flex; flex-direction:column; gap:14px; }
                .rpt-panel { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; }
                .rpt-panel-hdr { padding:11px 16px; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:600; color:#1e293b; display:flex; align-items:center; justify-content:space-between; }
                .rpt-panel-hdr-title { display:flex; align-items:center; gap:6px; }
                .rpt-panel-body { padding:14px 16px; }
                .filter-bar  { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 16px; display:flex; flex-direction:column; gap:10px; }
                .filter-row  { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
                .fin { height:32px; border:1.5px solid #e2e8f0; border-radius:7px; padding:0 10px; font-size:12px; font-family:inherit; color:#1e293b; background:#fff; outline:none; }
                .fin:focus { border-color:#1d4ed8; }
                .fin-sel { min-width:140px; cursor:pointer; }
                .fin-date { width:132px; }
                .fin-search { flex:1; min-width:180px; }
                .btn { height:32px; padding:0 14px; border-radius:7px; border:none; cursor:pointer; font-size:12px; font-family:inherit; display:inline-flex; align-items:center; gap:5px; font-weight:500; transition:all .12s; }
                .btn-primary   { background:#1d4ed8; color:#fff; } .btn-primary:hover   { background:#1e3a8a; }
                .btn-secondary { background:#f8fafc; color:#475569; border:1.5px solid #e2e8f0; } .btn-secondary:hover { background:#f1f5f9; }
                .btn-danger    { background:#fef2f2; color:#dc2626; border:1.5px solid #fecaca; }
                .adv-section   { border-top:1px solid #f1f5f9; padding-top:10px; }
                .main-layout   { display:grid; grid-template-columns:1fr 220px; gap:14px; align-items:start; }
                .badge         { display:inline-block; padding:2px 8px; border-radius:8px; font-size:10px; font-weight:600; white-space:nowrap; }
                table  { width:100%; border-collapse:collapse; }
                thead  { background:#f8fafc; }
                th     { padding:8px 13px; font-size:9.5px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.07em; text-align:left; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
                td     { padding:9px 13px; font-size:12px; color:#334155; border-bottom:1px solid #f8fafc; vertical-align:middle; }
                tr:last-child td { border-bottom:none; }
                tr:hover td { background:#fafafa; }
                .cert-num  { font-family:monospace; font-size:12px; font-weight:700; color:#1e293b; }
                .pg-row    { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-top:1px solid #f8fafc; }
                .pg-info   { font-size:11px; color:#94a3b8; }
                .pg-links  { display:flex; gap:4px; }
                .pg-btn    { width:28px; height:28px; border-radius:6px; border:1.5px solid #e2e8f0; background:#fff; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; color:#475569; }
                .pg-btn:hover:not(:disabled) { border-color:#1e3a8a; color:#1e3a8a; }
                .pg-btn.act { background:#1e3a8a; border-color:#1e3a8a; color:#fff; }
                .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
                .side-row  { display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f8fafc; font-size:12px; }
                .side-row:last-child { border-bottom:none; }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="rpt-page">
                    {/* ── Header ──────────────────────────────── */}
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
                                    lineHeight: 1,
                                }}
                            >
                                {t('contracts.heading')}
                            </h1>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#94a3b8',
                                    marginTop: 3,
                                }}
                            >
                                {filters.date_from
                                    ? t('contracts.filterSummary', {
                                          field: DATE_FIELD_LABELS[
                                              filters.date_field
                                          ],
                                          from: fmt(filters.date_from),
                                          to: filters.date_to
                                              ? fmt(filters.date_to)
                                              : '…',
                                      })
                                    : t('contracts.allContracts')}
                            </p>
                        </div>
                        <Link
                            href={route('admin.contracts.index')}
                            style={{
                                fontSize: 12,
                                color: '#1d4ed8',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                background: '#eff6ff',
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: '1px solid #bfdbfe',
                            }}
                        >
                            <FileText size={13} /> {t('contracts.manageLink')}
                        </Link>
                    </div>

                    {/* ── Filtres ──────────────────────────────── */}
                    <div className="filter-bar">
                        <div className="filter-row">
                            <select
                                className="fin fin-sel"
                                value={local.status}
                                onChange={(e) =>
                                    setLocal((p) => ({
                                        ...p,
                                        status: e.target.value,
                                    }))
                                }
                            >
                                <option value="ALL">
                                    {t('contracts.statuses.ALL')}
                                </option>
                                <option value="ACTIVE">
                                    {t('contracts.statuses.ACTIVE')}
                                </option>
                                <option value="DRAFT">
                                    {t('contracts.statuses.DRAFT')}
                                </option>
                                <option value="SUSPENDED">
                                    {t('contracts.statuses.SUSPENDED')}
                                </option>
                                <option value="EXPIRED">
                                    {t('contracts.statuses.EXPIRED')}
                                </option>
                                <option value="CANCELLED">
                                    {t('contracts.statuses.CANCELLED')}
                                </option>
                            </select>
                            <select
                                className="fin fin-sel"
                                value={local.type ?? ''}
                                onChange={(e) =>
                                    setLocal((p) => ({
                                        ...p,
                                        type: e.target.value || null,
                                    }))
                                }
                            >
                                <option value="">
                                    {t('contracts.allTypes')}
                                </option>
                                <option value="OPEN_POLICY">
                                    {t('contracts.types.OPEN_POLICY')}
                                </option>
                                <option value="VOYAGE">
                                    {t('contracts.types.VOYAGE')}
                                </option>
                                <option value="ANNUAL_VOYAGE">
                                    {t('contracts.types.ANNUAL_VOYAGE')}
                                </option>
                                <option value="TIERS_CHARGEUR">
                                    {t('contracts.types.TIERS_CHARGEUR')}
                                </option>
                            </select>
                            <input
                                className="fin fin-search"
                                placeholder={t('contracts.searchPlaceholder')}
                                value={local.search ?? ''}
                                onChange={(e) =>
                                    setLocal((p) => ({
                                        ...p,
                                        search: e.target.value || null,
                                    }))
                                }
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowAdv((v) => !v)}
                            >
                                <Filter size={12} />{' '}
                                {t('contracts.filtersToggle')}{' '}
                                {showAdv ? '▲' : '▼'}
                            </button>
                            <button className="btn btn-primary" onClick={apply}>
                                <Search size={12} /> {t('contracts.apply')}
                            </button>
                            {hasActive && (
                                <button
                                    className="btn btn-danger"
                                    onClick={reset}
                                    title={t('contracts.resetTitle')}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        {showAdv && (
                            <div className="adv-section">
                                <div className="filter-row">
                                    <select
                                        className="fin fin-sel"
                                        value={local.date_field}
                                        onChange={(e) =>
                                            setLocal((p) => ({
                                                ...p,
                                                date_field: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="effective_date">
                                            {t(
                                                'contracts.dateFields.effective_date',
                                            )}
                                        </option>
                                        <option value="expiry_date">
                                            {t(
                                                'contracts.dateFields.expiry_date',
                                            )}
                                        </option>
                                        <option value="created_at">
                                            {t(
                                                'contracts.dateFields.created_at',
                                            )}
                                        </option>
                                    </select>
                                    <input
                                        type="date"
                                        className="fin fin-date"
                                        value={local.date_from ?? ''}
                                        onChange={(e) =>
                                            setLocal((p) => ({
                                                ...p,
                                                date_from:
                                                    e.target.value || null,
                                            }))
                                        }
                                    />
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: '#94a3b8',
                                        }}
                                    >
                                        →
                                    </span>
                                    <input
                                        type="date"
                                        className="fin fin-date"
                                        value={local.date_to ?? ''}
                                        onChange={(e) =>
                                            setLocal((p) => ({
                                                ...p,
                                                date_to: e.target.value || null,
                                            }))
                                        }
                                    />
                                    {brokers.length > 0 && (
                                        <select
                                            className="fin fin-sel"
                                            value={local.broker_id ?? ''}
                                            onChange={(e) =>
                                                setLocal((p) => ({
                                                    ...p,
                                                    broker_id:
                                                        e.target.value || null,
                                                }))
                                            }
                                        >
                                            <option value="">
                                                {t('contracts.allBrokers')}
                                            </option>
                                            {brokers.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    [{b.code}] {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {isSA && tenants.length > 0 && (
                                        <select
                                            className="fin fin-sel"
                                            value={local.tenant_id ?? ''}
                                            onChange={(e) =>
                                                setLocal((p) => ({
                                                    ...p,
                                                    tenant_id:
                                                        e.target.value || null,
                                                }))
                                            }
                                        >
                                            <option value="">
                                                {t('contracts.allTenants')}
                                            </option>
                                            {tenants.map((ten) => (
                                                <option
                                                    key={ten.id}
                                                    value={ten.id}
                                                >
                                                    [{ten.code}] {ten.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="filter-row">
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: '#94a3b8',
                                        }}
                                    >
                                        {t('contracts.limitLabel')}
                                    </span>
                                    <input
                                        type="number"
                                        min={0}
                                        className="fin fin-sel"
                                        placeholder={t(
                                            'contracts.limitMinPlaceholder',
                                        )}
                                        value={local.limit_min ?? ''}
                                        onChange={(e) =>
                                            setLocal((p) => ({
                                                ...p,
                                                limit_min:
                                                    e.target.value || null,
                                            }))
                                        }
                                    />
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: '#94a3b8',
                                        }}
                                    >
                                        →
                                    </span>
                                    <input
                                        type="number"
                                        min={0}
                                        className="fin fin-sel"
                                        placeholder={t(
                                            'contracts.limitMaxPlaceholder',
                                        )}
                                        value={local.limit_max ?? ''}
                                        onChange={(e) =>
                                            setLocal((p) => ({
                                                ...p,
                                                limit_max:
                                                    e.target.value || null,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Stats ────────────────────────────────── */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4,1fr) repeat(3,1fr)',
                            gap: 10,
                        }}
                    >
                        <StatCard
                            label={t('contracts.stats.total')}
                            value={stats.total}
                            color="#1e293b"
                            icon={FileText}
                        />
                        <StatCard
                            label={t('contracts.stats.active')}
                            value={stats.active}
                            color="#15803d"
                            bg="#f0fdf4"
                            border="#bbf7d0"
                            icon={CheckCircle}
                        />
                        <StatCard
                            label={t('contracts.stats.expiring30')}
                            value={stats.expiring_30}
                            color={
                                stats.expiring_30 > 0 ? '#d97706' : '#64748b'
                            }
                            bg={stats.expiring_30 > 0 ? '#fef3c7' : '#fff'}
                            icon={Clock}
                            sub={
                                stats.expiring_7 > 0
                                    ? t('contracts.stats.expiringWithin7', {
                                          count: stats.expiring_7,
                                      })
                                    : undefined
                            }
                        />
                        <StatCard
                            label={t('contracts.stats.suspendedCancelled')}
                            value={`${stats.suspended} / ${stats.cancelled}`}
                            color={stats.suspended > 0 ? '#d97706' : '#64748b'}
                            icon={AlertTriangle}
                        />
                        <StatCard
                            label={t('contracts.stats.totalLimit')}
                            value={fmtAmt(stats.total_limit)}
                            color="#1d4ed8"
                            icon={FileText}
                        />
                        <StatCard
                            label={t('contracts.stats.used')}
                            value={fmtAmt(stats.total_used)}
                            sub={
                                usageRemaining !== null
                                    ? t('contracts.stats.availablePct', {
                                          pct: usageRemaining,
                                      })
                                    : undefined
                            }
                            color="#7c3aed"
                            icon={FileText}
                        />
                        <StatCard
                            label={t('contracts.stats.avgUsage')}
                            value={
                                avgUsagePct !== null ? `${avgUsagePct}%` : '—'
                            }
                            color={
                                Number(avgUsagePct) > 80 ? '#dc2626' : '#059669'
                            }
                            icon={FileText}
                        />
                    </div>

                    {/* ── Tableau + ventilations ───────────────── */}
                    <div className="main-layout">
                        {/* Tableau */}
                        <div className="rpt-panel">
                            <div className="rpt-panel-hdr">
                                <div className="rpt-panel-hdr-title">
                                    <FileText size={14} color="#1d4ed8" />
                                    {t('contracts.panels.contractsTitle', {
                                        count: contracts.total,
                                    })}
                                </div>
                            </div>

                            {contracts.data.length === 0 ? (
                                <div
                                    style={{
                                        padding: '32px',
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                        fontSize: 13,
                                    }}
                                >
                                    <FileText
                                        size={28}
                                        style={{
                                            marginBottom: 8,
                                            opacity: 0.4,
                                        }}
                                    />
                                    <div>{t('contracts.panels.empty')}</div>
                                </div>
                            ) : (
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>
                                                    {t(
                                                        'contracts.table.number',
                                                    )}
                                                </th>
                                                <th>
                                                    {t(
                                                        'contracts.table.insured',
                                                    )}
                                                </th>
                                                <th>
                                                    {t(
                                                        'contracts.table.broker',
                                                    )}
                                                </th>
                                                <th>
                                                    {t('contracts.table.type')}
                                                </th>
                                                <th>
                                                    {t(
                                                        'contracts.table.limitUsage',
                                                    )}
                                                </th>
                                                <th>
                                                    {t(
                                                        'contracts.table.certificates',
                                                    )}
                                                </th>
                                                <th>
                                                    {t(
                                                        'contracts.table.effectiveExpiry',
                                                    )}
                                                </th>
                                                {isSA && (
                                                    <th>
                                                        {t(
                                                            'contracts.table.tenant',
                                                        )}
                                                    </th>
                                                )}
                                                <th>
                                                    {t(
                                                        'contracts.table.status',
                                                    )}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contracts.data.map((c) => {
                                                const s = STATUS_COLORS[
                                                    c.status
                                                ] ?? {
                                                    color: '#64748b',
                                                    bg: '#f8fafc',
                                                };
                                                const sLabel =
                                                    STATUS_LABELS[c.status] ??
                                                    c.status;
                                                const expDays = c.expiry_date
                                                    ? daysUntil(c.expiry_date)
                                                    : null;

                                                return (
                                                    <tr key={c.id}>
                                                        <td>
                                                            <Link
                                                                href={route(
                                                                    'admin.contracts.show',
                                                                    {
                                                                        contract:
                                                                            c.id,
                                                                    },
                                                                )}
                                                                style={{
                                                                    textDecoration:
                                                                        'none',
                                                                }}
                                                            >
                                                                <div className="cert-num">
                                                                    {
                                                                        c.contract_number
                                                                    }
                                                                </div>
                                                            </Link>
                                                        </td>
                                                        <td>
                                                            <div
                                                                style={{
                                                                    fontWeight: 500,
                                                                    color: '#1e293b',
                                                                    maxWidth: 150,
                                                                    overflow:
                                                                        'hidden',
                                                                    textOverflow:
                                                                        'ellipsis',
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                }}
                                                            >
                                                                {c.insured_name}
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
                                                        <td>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: '#475569',
                                                                    maxWidth: 130,
                                                                    overflow:
                                                                        'hidden',
                                                                    textOverflow:
                                                                        'ellipsis',
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                }}
                                                            >
                                                                {c.broker
                                                                    ?.name ??
                                                                    '—'}
                                                            </div>
                                                            {c.broker?.type ===
                                                                'FOREIGN_PARTNER' && (
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
                                                                        'contracts.foreign',
                                                                    )}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    color: '#1d4ed8',
                                                                    background:
                                                                        '#eff6ff',
                                                                    padding:
                                                                        '2px 6px',
                                                                    borderRadius: 6,
                                                                }}
                                                            >
                                                                {TYPE_LABELS[
                                                                    c.type
                                                                ] ?? c.type}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <UsageBar
                                                                used={
                                                                    c.used_limit
                                                                }
                                                                limit={
                                                                    c.subscription_limit
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <div
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    color: '#1e293b',
                                                                }}
                                                            >
                                                                {
                                                                    c.certificates_count
                                                                }
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 10,
                                                                    color: '#15803d',
                                                                }}
                                                            >
                                                                {t(
                                                                    'contracts.table.ofWhichIssued',
                                                                    {
                                                                        count: c.issued_certificates_count,
                                                                    },
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: '#475569',
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                }}
                                                            >
                                                                {c.effective_date
                                                                    ? fmt(
                                                                          c.effective_date,
                                                                      )
                                                                    : '—'}
                                                            </div>
                                                            {c.expiry_date && (
                                                                <div
                                                                    style={{
                                                                        fontSize: 10,
                                                                        whiteSpace:
                                                                            'nowrap',
                                                                        color:
                                                                            expDays !==
                                                                                null &&
                                                                            expDays <=
                                                                                7
                                                                                ? '#dc2626'
                                                                                : expDays !==
                                                                                        null &&
                                                                                    expDays <=
                                                                                        30
                                                                                  ? '#d97706'
                                                                                  : '#94a3b8',
                                                                    }}
                                                                >
                                                                    {fmt(
                                                                        c.expiry_date,
                                                                    )}
                                                                    {expDays !==
                                                                        null &&
                                                                        expDays <=
                                                                            30 &&
                                                                        ` (J-${expDays})`}
                                                                </div>
                                                            )}
                                                        </td>
                                                        {isSA && (
                                                            <td>
                                                                <span
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: '#64748b',
                                                                    }}
                                                                >
                                                                    {c.tenant
                                                                        ?.code ??
                                                                        '—'}
                                                                </span>
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
                                                                {sLabel}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {contracts.last_page > 1 && (
                                        <div className="pg-row">
                                            <span className="pg-info">
                                                {t('contracts.pagination', {
                                                    total: contracts.total,
                                                    current:
                                                        contracts.current_page,
                                                    last: contracts.last_page,
                                                })}
                                            </span>
                                            <div className="pg-links">
                                                <button
                                                    className="pg-btn"
                                                    disabled={
                                                        contracts.current_page ===
                                                        1
                                                    }
                                                    onClick={() =>
                                                        paginateTo(
                                                            contracts.links[0]
                                                                ?.url ?? null,
                                                        )
                                                    }
                                                >
                                                    <ChevronLeft size={13} />
                                                </button>
                                                {contracts.links
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
                                                        contracts.current_page ===
                                                        contracts.last_page
                                                    }
                                                    onClick={() =>
                                                        paginateTo(
                                                            contracts.links[
                                                                contracts.links
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

                        {/* Ventilations */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}
                        >
                            {/* Par statut */}
                            <div className="rpt-panel">
                                <div className="rpt-panel-hdr">
                                    <div className="rpt-panel-hdr-title">
                                        <CheckCircle
                                            size={13}
                                            color="#15803d"
                                        />{' '}
                                        {t('contracts.panels.byStatus')}
                                    </div>
                                </div>
                                <div className="rpt-panel-body">
                                    {byStatus.map((r) => {
                                        const s = STATUS_COLORS[r.status!] ?? {
                                            color: '#64748b',
                                            bg: '#f8fafc',
                                        };
                                        const sLabel =
                                            STATUS_LABELS[r.status!] ??
                                            r.status;
                                        const pct =
                                            stats.total > 0
                                                ? Math.round(
                                                      (r.count / stats.total) *
                                                          100,
                                                  )
                                                : 0;

                                        return (
                                            <div
                                                key={r.status}
                                                style={{ marginBottom: 9 }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'space-between',
                                                        marginBottom: 3,
                                                    }}
                                                >
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            color: s.color,
                                                            background: s.bg,
                                                        }}
                                                    >
                                                        {sLabel}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            color: '#1e293b',
                                                        }}
                                                    >
                                                        {r.count}{' '}
                                                        <span
                                                            style={{
                                                                color: '#94a3b8',
                                                                fontWeight: 400,
                                                            }}
                                                        >
                                                            ({pct}%)
                                                        </span>
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        height: 4,
                                                        background: '#f1f5f9',
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            height: '100%',
                                                            width: `${pct}%`,
                                                            background: s.color,
                                                            borderRadius: 2,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Par type */}
                            <div className="rpt-panel">
                                <div className="rpt-panel-hdr">
                                    <div className="rpt-panel-hdr-title">
                                        <FileText size={13} color="#1d4ed8" />{' '}
                                        {t('contracts.panels.byType')}
                                    </div>
                                </div>
                                <div className="rpt-panel-body">
                                    {byType.map((r) => {
                                        const pct =
                                            stats.total > 0
                                                ? Math.round(
                                                      (r.count / stats.total) *
                                                          100,
                                                  )
                                                : 0;

                                        return (
                                            <div
                                                key={r.type}
                                                className="side-row"
                                                style={{
                                                    flexDirection: 'column',
                                                    gap: 4,
                                                    border: 'none',
                                                    paddingBottom: 8,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'space-between',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#475569',
                                                        }}
                                                    >
                                                        {TYPE_LABELS[r.type!] ??
                                                            r.type}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {r.count} ({pct}%)
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        height: 4,
                                                        background: '#f1f5f9',
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            height: '100%',
                                                            width: `${pct}%`,
                                                            background:
                                                                '#1d4ed8',
                                                            borderRadius: 2,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Alertes */}
                            {(stats.expiring_30 > 0 ||
                                stats.requires_approval_count > 0) && (
                                <div
                                    className="rpt-panel"
                                    style={{ border: '1.5px solid #fde68a' }}
                                >
                                    <div
                                        className="rpt-panel-hdr"
                                        style={{
                                            background: '#fef3c7',
                                            borderColor: '#fde68a',
                                        }}
                                    >
                                        <div
                                            className="rpt-panel-hdr-title"
                                            style={{ color: '#92400e' }}
                                        >
                                            <AlertTriangle
                                                size={13}
                                                color="#d97706"
                                            />{' '}
                                            {t('contracts.panels.alerts')}
                                        </div>
                                    </div>
                                    <div className="rpt-panel-body">
                                        {stats.expiring_7 > 0 && (
                                            <div
                                                className="side-row"
                                                style={{ color: '#dc2626' }}
                                            >
                                                <span>
                                                    {t(
                                                        'contracts.panels.expiringIn7',
                                                    )}
                                                </span>
                                                <strong>
                                                    {stats.expiring_7}
                                                </strong>
                                            </div>
                                        )}
                                        {stats.expiring_30 > 0 && (
                                            <div
                                                className="side-row"
                                                style={{ color: '#d97706' }}
                                            >
                                                <span>
                                                    {t(
                                                        'contracts.panels.expiringIn30',
                                                    )}
                                                </span>
                                                <strong>
                                                    {stats.expiring_30}
                                                </strong>
                                            </div>
                                        )}
                                        {stats.requires_approval_count > 0 && (
                                            <div className="side-row">
                                                <span
                                                    style={{
                                                        color: '#64748b',
                                                        fontSize: 11,
                                                    }}
                                                >
                                                    {t(
                                                        'contracts.panels.requiresApproval',
                                                    )}
                                                </span>
                                                <strong>
                                                    {
                                                        stats.requires_approval_count
                                                    }
                                                </strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
