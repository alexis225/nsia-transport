import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Award,
    TrendingUp,
    AlertTriangle,
    FileText,
    CheckCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface TenantKpi {
    id: string;
    name: string;
    code: string;
    issued_month: number;
    issued_prev_month: number;
    issued_ytd: number;
    prime_month: number;
    submitted: number;
    contracts_active: number;
    expiring_contracts: number;
}
interface MonthData {
    label: string;
    issued: number;
    amount: number;
}
interface TopTenant {
    name: string;
    code: string;
    count: number;
    total_prime: number;
}
interface Global {
    issued_month: number;
    issued_ytd: number;
    submitted: number;
    contracts_active: number;
    prime_month: number;
}

interface Props {
    global: Global;
    byTenant: TenantKpi[];
    monthlyData: MonthData[];
    topTenants: TopTenant[];
    tenantCount: number;
    currentMonth: string;
    currentYear: number;
}

const fmtAmt = (v: number) => {
    if (v >= 1_000_000_000) {
        return (v / 1_000_000_000).toFixed(1) + 'G';
    }

    if (v >= 1_000_000) {
        return (v / 1_000_000).toFixed(1) + 'M';
    }

    if (v >= 1_000) {
        return Math.round(v / 1_000) + 'K';
    }

    return v.toFixed(0);
};

function Trend({ curr, prev }: { curr: number; prev: number }) {
    if (prev === 0) {
        return null;
    }

    const pct = Math.round(((curr - prev) / prev) * 100);
    const up = pct > 0;

    return (
        <span
            style={{
                fontSize: 10,
                fontWeight: 600,
                marginLeft: 4,
                color: up ? '#15803d' : '#dc2626',
                background: up ? '#f0fdf4' : '#fef2f2',
                borderRadius: 6,
                padding: '1px 5px',
            }}
        >
            {up ? '▲' : '▼'} {Math.abs(pct)}%
        </span>
    );
}

function BarChart({ data }: { data: MonthData[] }) {
    const max = Math.max(...data.map((d) => d.issued), 1);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 4,
                height: 80,
                paddingTop: 8,
            }}
        >
            {data.map((d, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            borderRadius: '3px 3px 0 0',
                            height: `${Math.max(3, Math.round((d.issued / max) * 76))}px`,
                            background:
                                i === data.length - 1 ? '#1e3a8a' : '#3b82f6',
                            minHeight: 3,
                        }}
                        title={`${d.label}: ${d.issued}`}
                    />
                    <span style={{ fontSize: 8.5, color: '#94a3b8' }}>
                        {d.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function DtagDashboard({
    global,
    byTenant,
    monthlyData,
    topTenants,
    tenantCount,
    currentMonth,
    currentYear,
}: Props) {
    const { t } = useTranslation('dashboard');
    const maxCount = Math.max(...byTenant.map((t) => t.issued_month), 1);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dtag.breadcrumbHome'), href: route('admin.dashboard') },
        { title: t('dtag.breadcrumb') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dtag.headTitle')} />
            <style>{`
                .dtag-page  { padding:4px; display:flex; flex-direction:column; gap:16px; }
                .panel      { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; }
                .panel-hdr  { padding:11px 16px; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:600; color:#1e293b; display:flex; align-items:center; justify-content:space-between; }
                .panel-hdr-title { display:flex; align-items:center; gap:6px; }
                .panel-body { padding:14px 16px; }
                .kpi-grid   { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; }
                .kpi-card   { background:#fff; border:1.5px solid #e2e8f0; border-radius:10px; padding:12px 14px; }
                .kpi-val    { font-size:22px; font-weight:700; color:#1e293b; }
                .kpi-lbl    { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; margin-top:2px; }
                .main-grid  { display:grid; grid-template-columns:2fr 1fr; gap:14px; }
                table { width:100%; border-collapse:collapse; }
                thead { background:#f8fafc; }
                th { padding:7px 12px; font-size:9px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.07em; text-align:left; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
                td { padding:9px 12px; font-size:12px; color:#334155; border-bottom:1px solid #f8fafc; vertical-align:middle; }
                tr:last-child td { border-bottom:none; }
                tr:hover td { background:#fafafa; }
                .badge-code { display:inline-block; padding:2px 7px; border-radius:6px; background:#eff6ff; color:#1d4ed8; font-size:10px; font-weight:700; font-family:monospace; }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="dtag-page">
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
                                {t('dtag.heading')}
                            </h1>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: '#94a3b8',
                                    marginTop: 3,
                                }}
                            >
                                {t('dtag.subtitle', {
                                    count: tenantCount,
                                    month: currentMonth,
                                    year: currentYear,
                                })}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Link
                                href={route('admin.dashboard.kpi')}
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
                                {t('dtag.subsidiaryDashboard')}
                            </Link>
                        </div>
                    </div>

                    {/* KPIs globaux */}
                    <div className="kpi-grid">
                        {[
                            {
                                label: t('dtag.kpis.issuedMonth'),
                                value: global.issued_month,
                                color: '#1d4ed8',
                                icon: Award,
                            },
                            {
                                label: t('dtag.kpis.issuedYear', {
                                    year: currentYear,
                                }),
                                value: global.issued_ytd,
                                color: '#0284c7',
                                icon: TrendingUp,
                            },
                            {
                                label: t('dtag.kpis.pendingGroup'),
                                value: global.submitted,
                                color:
                                    global.submitted > 10
                                        ? '#dc2626'
                                        : '#d97706',
                                icon: AlertTriangle,
                            },
                            {
                                label: t('dtag.kpis.activeContracts'),
                                value: global.contracts_active,
                                color: '#15803d',
                                icon: FileText,
                            },
                            {
                                label: t('dtag.kpis.primeMonth'),
                                value: fmtAmt(global.prime_month),
                                color: '#7c3aed',
                                icon: CheckCircle,
                            },
                        ].map((k, i) => (
                            <div key={i} className="kpi-card">
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 6,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 7,
                                            background: `${k.color}18`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <k.icon size={14} color={k.color} />
                                    </div>
                                    <span className="kpi-lbl">{k.label}</span>
                                </div>
                                <div
                                    className="kpi-val"
                                    style={{ color: k.color }}
                                >
                                    {k.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tableau filiales + graphique */}
                    <div className="main-grid">
                        {/* Tableau par filiale */}
                        <div className="panel">
                            <div className="panel-hdr">
                                <div className="panel-hdr-title">
                                    <Building2 size={14} color="#1d4ed8" />
                                    {t('dtag.table.title', {
                                        month: currentMonth,
                                    })}
                                </div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('dtag.table.subsidiary')}</th>
                                        <th>{t('dtag.table.certMonth')}</th>
                                        <th>{t('dtag.table.trend')}</th>
                                        <th>{t('dtag.table.volume')}</th>
                                        <th>{t('dtag.table.ytd')}</th>
                                        <th>{t('dtag.table.pending')}</th>
                                        <th>{t('dtag.table.contracts')}</th>
                                        <th>{t('dtag.table.expiration')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {byTenant.map((t) => (
                                        <tr key={t.id}>
                                            <td>
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        color: '#1e293b',
                                                    }}
                                                >
                                                    {t.name}
                                                </div>
                                                <span className="badge-code">
                                                    {t.code}
                                                </span>
                                            </td>
                                            <td>
                                                <div
                                                    style={{
                                                        fontSize: 16,
                                                        fontWeight: 700,
                                                        color: '#1d4ed8',
                                                    }}
                                                >
                                                    {t.issued_month}
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            height: 6,
                                                            width: 60,
                                                            background:
                                                                '#f1f5f9',
                                                            borderRadius: 3,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                height: '100%',
                                                                borderRadius: 3,
                                                                width: `${Math.round((t.issued_month / maxCount) * 100)}%`,
                                                                background:
                                                                    '#3b82f6',
                                                            }}
                                                        />
                                                    </div>
                                                    <Trend
                                                        curr={t.issued_month}
                                                        prev={
                                                            t.issued_prev_month
                                                        }
                                                    />
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: 11,
                                                }}
                                            >
                                                {fmtAmt(t.prime_month)}
                                            </td>
                                            <td style={{ color: '#64748b' }}>
                                                {t.issued_ytd}
                                            </td>
                                            <td>
                                                {t.submitted > 0 ? (
                                                    <span
                                                        style={{
                                                            color: '#d97706',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {t.submitted}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: '#94a3b8',
                                                        }}
                                                    >
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ color: '#15803d' }}>
                                                {t.contracts_active}
                                            </td>
                                            <td>
                                                {t.expiring_contracts > 0 ? (
                                                    <span
                                                        style={{
                                                            color: '#dc2626',
                                                            fontWeight: 600,
                                                            fontSize: 11,
                                                        }}
                                                    >
                                                        ⚠ {t.expiring_contracts}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: '#94a3b8',
                                                            fontSize: 11,
                                                        }}
                                                    >
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Colonne droite */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14,
                            }}
                        >
                            {/* Tendance 12 mois globale */}
                            <div className="panel">
                                <div className="panel-hdr">
                                    <div className="panel-hdr-title">
                                        <TrendingUp size={13} color="#1d4ed8" />{' '}
                                        {t('dtag.monthlyChart.title')}
                                    </div>
                                </div>
                                <div className="panel-body">
                                    <BarChart data={monthlyData} />
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginTop: 10,
                                            paddingTop: 10,
                                            borderTop: '1px solid #f1f5f9',
                                            fontSize: 11,
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 16,
                                                    color: '#1e293b',
                                                }}
                                            >
                                                {monthlyData
                                                    .reduce(
                                                        (s, m) => s + m.issued,
                                                        0,
                                                    )
                                                    .toLocaleString('fr-FR')}
                                            </div>
                                            <div
                                                style={{
                                                    color: '#94a3b8',
                                                    fontSize: 10,
                                                }}
                                            >
                                                {t(
                                                    'dtag.monthlyChart.certificates',
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 16,
                                                    color: '#7c3aed',
                                                }}
                                            >
                                                {fmtAmt(
                                                    monthlyData.reduce(
                                                        (s, m) => s + m.amount,
                                                        0,
                                                    ),
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    color: '#94a3b8',
                                                    fontSize: 10,
                                                }}
                                            >
                                                {t(
                                                    'dtag.monthlyChart.totalPrime',
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top filiales ce mois */}
                            <div className="panel">
                                <div className="panel-hdr">
                                    <div className="panel-hdr-title">
                                        <Award size={13} color="#d97706" />{' '}
                                        {t('dtag.topSubsidiaries.title')}
                                    </div>
                                </div>
                                <div
                                    className="panel-body"
                                    style={{ padding: '8px 14px' }}
                                >
                                    {topTenants.map((tenant, i) => (
                                        <div
                                            key={tenant.code}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '6px 0',
                                                borderBottom:
                                                    i < topTenants.length - 1
                                                        ? '1px solid #f8fafc'
                                                        : 'none',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: 6,
                                                        background:
                                                            i === 0
                                                                ? '#fef3c7'
                                                                : '#f8fafc',
                                                        border: `1px solid ${i === 0 ? '#fde68a' : '#e2e8f0'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color:
                                                            i === 0
                                                                ? '#d97706'
                                                                : '#94a3b8',
                                                    }}
                                                >
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            color: '#1e293b',
                                                        }}
                                                    >
                                                        {tenant.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 10,
                                                            color: '#94a3b8',
                                                        }}
                                                    >
                                                        {t(
                                                            'dtag.topSubsidiaries.primeSuffix',
                                                            {
                                                                amount: fmtAmt(
                                                                    tenant.total_prime,
                                                                ),
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                    color: '#1d4ed8',
                                                }}
                                            >
                                                {tenant.count}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
