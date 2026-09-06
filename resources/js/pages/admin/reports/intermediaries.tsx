import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Users, Briefcase, UserCheck, Award,
    CheckCircle, XCircle, Globe, Phone, Mail, Filter, X,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────
interface BrokerRow {
    id: string; name: string; code: string; type: string;
    country_code: string; email: string | null; commission_rate: string;
    is_active: boolean; contracts_count: number; active_contracts_count: number;
    certs_month: number; certs_ytd: number;
    comm_paid_ytd: number; comm_pending: number; comm_pending_count: number;
    tenant: { name: string; code: string } | null;
}
interface CoinsurerRow {
    id: string; name: string; country_code: string;
    email: string | null; phone: string | null; is_active: boolean;
    contracts_count: number; active_contracts_count: number;
    tenant: { name: string; code: string } | null;
}
interface ExpertRow {
    id: string; name: string; email: string | null;
    phone: string | null; country_code: string; is_active: boolean;
    tenant: { name: string; code: string } | null;
}
interface Stats { total: number; active: number; inactive: number; local?: number; foreign?: number; with_certs_month?: number }

interface Props {
    brokersData:     BrokerRow[];
    brokerStats:     Stats & { local: number; foreign: number; with_certs_month: number };
    coinsurers:      CoinsurerRow[];
    coinsurersStats: Stats;
    experts:         ExpertRow[];
    expertStats:     Stats;
    tab:             string;
    isSA:            boolean;
    tenants:         { id: string; name: string; code: string }[];
    filters:         { tenant_id: string | null; broker_type: string | null; contract_type: string | null };
    currentMonth:    string;
    currentYear:     number;
}

// ── Helpers ──────────────────────────────────────────────────
const fmtAmt = (v: number) => {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'K';
    return v.toFixed(0);
};

function SumCard({ label, value, color, bg, icon: Icon }: {
    label: string; value: string | number; color: string; bg?: string; icon?: any;
}) {
    return (
        <div style={{ background: bg ?? '#fff', border: `1.5px solid ${bg ? color + '44' : '#e2e8f0'}`,
                      borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {Icon && (
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={color}/>
                </div>
            )}
            <div>
                <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
            </div>
        </div>
    );
}

function ActiveBadge({ active }: { active: boolean }) {
    const { t } = useTranslation('reports');
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 8, fontSize: 10, fontWeight: 600,
            background: active ? '#f0fdf4' : '#f8fafc',
            color: active ? '#15803d' : '#94a3b8',
        }}>
            {active ? <CheckCircle size={9}/> : <XCircle size={9}/>}
            {active ? t('intermediaries.status.active') : t('intermediaries.status.inactive')}
        </span>
    );
}

// ── Tabs ─────────────────────────────────────────────────────
const TAB_ICONS = [
    { key: 'brokers',    icon: Briefcase },
    { key: 'coinsurers', icon: Users },
    { key: 'experts',    icon: UserCheck },
];

// ── Main Component ───────────────────────────────────────────
export default function IntermediariesReport({
    brokersData, brokerStats, coinsurers, coinsurersStats, experts, expertStats,
    tab, isSA, tenants, filters, currentMonth, currentYear,
}: Props) {
    const { t } = useTranslation('reports');
    const { t: tn } = useTranslation('navigation');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: tn('sections.dashboard'), href: route('admin.dashboard') },
        { title: t('breadcrumb.section') },
        { title: t('breadcrumb.intermediaries') },
    ];

    const CONTRACT_TYPE_LABELS: Record<string, string> = {
        OPEN_POLICY:    t('intermediaries.contractTypes.OPEN_POLICY'),
        VOYAGE:         t('intermediaries.contractTypes.VOYAGE'),
        ANNUAL_VOYAGE:  t('intermediaries.contractTypes.ANNUAL_VOYAGE'),
        TIERS_CHARGEUR: t('intermediaries.contractTypes.TIERS_CHARGEUR'),
    };

    const [local, setLocal] = useState({ ...filters });

    const switchTab = (tabKey: string) =>
        router.get(route('admin.reports.intermediaries'), { ...cleanParams(local), tab: tabKey }, { preserveState: false });

    const cleanParams = (f: typeof local) => {
        const p: Record<string, string> = {};
        if (f.tenant_id)     p.tenant_id     = f.tenant_id;
        if (f.broker_type)   p.broker_type   = f.broker_type;
        if (f.contract_type) p.contract_type = f.contract_type;
        return p;
    };

    const applyFilters = () =>
        router.get(route('admin.reports.intermediaries'), { ...cleanParams(local), tab }, { preserveState: false });

    const resetFilters = () => {
        setLocal({ tenant_id: null, broker_type: null, contract_type: null });
        router.get(route('admin.reports.intermediaries'), { tab }, { preserveState: false });
    };

    const hasActiveFilters = !!(filters.tenant_id || filters.broker_type || filters.contract_type);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('intermediaries.title')}/>
            <style>{`
                .int-page { padding:4px; display:flex; flex-direction:column; gap:14px; }
                .int-tabs { display:flex; gap:4px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:4px; width:fit-content; }
                .tab-btn  { padding:6px 16px; border-radius:7px; border:none; cursor:pointer; font-size:12px; font-family:inherit; font-weight:500; display:flex; align-items:center; gap:6px; transition:all .15s; background:transparent; color:#64748b; }
                .tab-btn.active { background:#fff; color:#1d4ed8; box-shadow:0 1px 4px rgba(0,0,0,.08); }
                .tab-btn:hover:not(.active) { background:#fff8; color:#1e293b; }
                .stats-row { display:grid; gap:10px; }
                .panel  { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; }
                .panel-hdr { padding:11px 16px; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:600; color:#1e293b; display:flex; align-items:center; gap:6px; }
                table  { width:100%; border-collapse:collapse; }
                thead  { background:#f8fafc; }
                th     { padding:8px 13px; font-size:9.5px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.07em; text-align:left; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
                td     { padding:9px 13px; font-size:12px; color:#334155; border-bottom:1px solid #f8fafc; vertical-align:middle; }
                tr:last-child td { border-bottom:none; }
                tr:hover td { background:#fafafa; }
                .empty { padding:32px; text-align:center; color:#94a3b8; font-size:13px; }
                .type-badge { display:inline-block; padding:2px 7px; border-radius:6px; font-size:10px; font-weight:600; }
                .int-filter-sel { height:32px; padding:0 10px; font-size:12px; font-family:inherit; color:#1e293b; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:7px; outline:none; cursor:pointer; }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="int-page">

                    {/* ── Header ──────────────────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                                {t('intermediaries.heading')}
                            </h1>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                                {t('intermediaries.activitySummary', { month: currentMonth, year: currentYear })}
                            </p>
                        </div>
                    </div>

                    {/* ── Tabs ─────────────────────────────────── */}
                    <div className="int-tabs">
                        {TAB_ICONS.map(tabItem => {
                            const Icon = tabItem.icon;
                            const cnt  = tabItem.key === 'brokers' ? brokerStats.total
                                       : tabItem.key === 'coinsurers' ? coinsurersStats.total
                                       : expertStats.total;
                            return (
                                <button key={tabItem.key}
                                        className={`tab-btn ${tab === tabItem.key ? 'active' : ''}`}
                                        onClick={() => switchTab(tabItem.key)}>
                                    <Icon size={13}/> {t(`intermediaries.tabs.${tabItem.key}`)}
                                    <span style={{ fontSize: 10, background: tab === tabItem.key ? '#eff6ff' : '#f1f5f9',
                                                   color: tab === tabItem.key ? '#1d4ed8' : '#94a3b8',
                                                   borderRadius: 8, padding: '0 5px' }}>
                                        {cnt}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Filtres ──────────────────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                                  background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
                        <Filter size={13} color="#94a3b8"/>
                        {isSA && tenants.length > 0 && (
                            <select className="int-filter-sel" value={local.tenant_id ?? ''}
                                    onChange={e => setLocal(p => ({ ...p, tenant_id: e.target.value || null }))}>
                                <option value="">{t('intermediaries.allTenants')}</option>
                                {tenants.map(ten => <option key={ten.id} value={ten.id}>[{ten.code}] {ten.name}</option>)}
                            </select>
                        )}
                        {tab === 'brokers' && (
                            <select className="int-filter-sel" value={local.broker_type ?? ''}
                                    onChange={e => setLocal(p => ({ ...p, broker_type: e.target.value || null }))}>
                                <option value="">{t('intermediaries.brokerTypes.all')}</option>
                                <option value="LOCAL">{t('intermediaries.brokerTypes.local')}</option>
                                <option value="FOREIGN">{t('intermediaries.brokerTypes.foreign')}</option>
                            </select>
                        )}
                        {(tab === 'brokers' || tab === 'coinsurers') && (
                            <select className="int-filter-sel" value={local.contract_type ?? ''}
                                    onChange={e => setLocal(p => ({ ...p, contract_type: e.target.value || null }))}>
                                <option value="">{t('intermediaries.contractTypes.all')}</option>
                                {Object.entries(CONTRACT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        )}
                        <button className="tab-btn" style={{ background: '#1d4ed8', color: '#fff' }} onClick={applyFilters}>
                            {t('intermediaries.apply')}
                        </button>
                        {hasActiveFilters && (
                            <button className="tab-btn" onClick={resetFilters} title={t('intermediaries.resetTitle')}>
                                <X size={12}/>
                            </button>
                        )}
                    </div>

                    {/* ── Onglet Courtiers ─────────────────────── */}
                    {tab === 'brokers' && (
                        <>
                            <div className="stats-row" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
                                <SumCard label={t('intermediaries.brokers.stats.total')} value={brokerStats.total} color="#1e293b" icon={Briefcase}/>
                                <SumCard label={t('intermediaries.brokers.stats.active')} value={brokerStats.active} color="#15803d" bg="#f0fdf4" icon={CheckCircle}/>
                                <SumCard label={t('intermediaries.brokers.stats.inactive')} value={brokerStats.inactive} color="#64748b" icon={XCircle}/>
                                <SumCard label={t('intermediaries.brokers.stats.local')} value={brokerStats.local} color="#1d4ed8" bg="#eff6ff" icon={Award}/>
                                <SumCard label={t('intermediaries.brokers.stats.foreign')} value={brokerStats.foreign} color="#7c3aed" bg="#fdf4ff" icon={Globe}/>
                                <SumCard label={t('intermediaries.brokers.stats.activeThisMonth')} value={brokerStats.with_certs_month}
                                         color="#059669" bg="#f0fdf4" icon={Award}/>
                            </div>

                            <div className="panel">
                                <div className="panel-hdr">
                                    <Briefcase size={14} color="#1d4ed8"/>
                                    {t('intermediaries.brokers.panelTitle', { month: currentMonth })}
                                </div>
                                {brokersData.length === 0 ? (
                                    <div className="empty">{t('intermediaries.brokers.empty')}</div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>{t('intermediaries.brokers.table.nameCode')}</th>
                                                <th>{t('intermediaries.brokers.table.type')}</th>
                                                <th>{t('intermediaries.brokers.table.country')}</th>
                                                <th>{t('intermediaries.brokers.table.activeContracts')}</th>
                                                <th>{t('intermediaries.brokers.table.certsMonth')}</th>
                                                <th>{t('intermediaries.brokers.table.certsYear', { year: currentYear })}</th>
                                                <th>{t('intermediaries.brokers.table.commPaidYear', { year: currentYear })}</th>
                                                <th>{t('intermediaries.brokers.table.commPending')}</th>
                                                {isSA && <th>{t('intermediaries.brokers.table.tenant')}</th>}
                                                <th>{t('intermediaries.brokers.table.status')}</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {brokersData.map(b => (
                                                <tr key={b.id}>
                                                    <td>
                                                        <Link href={route('admin.brokers.show', { broker: b.id })}
                                                              style={{ textDecoration: 'none' }}>
                                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.name}</div>
                                                        </Link>
                                                        <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{b.code}</div>
                                                    </td>
                                                    <td>
                                                        <span className="type-badge"
                                                              style={{ background: b.type === 'LOCAL' ? '#eff6ff' : '#fdf4ff',
                                                                       color: b.type === 'LOCAL' ? '#1d4ed8' : '#7c3aed' }}>
                                                            {b.type === 'LOCAL' ? t('intermediaries.brokers.typeLocal') : t('intermediaries.brokers.typeForeign')}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: 11, color: '#64748b' }}>{b.country_code}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: b.active_contracts_count > 0 ? '#15803d' : '#94a3b8' }}>
                                                            {b.active_contracts_count}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{t('intermediaries.brokers.totalOf', { count: b.contracts_count })}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: b.certs_month > 0 ? '#1d4ed8' : '#94a3b8',
                                                                      fontSize: 14 }}>
                                                            {b.certs_month}
                                                        </div>
                                                    </td>
                                                    <td style={{ color: '#475569', fontWeight: 500 }}>{b.certs_ytd}</td>
                                                    <td>
                                                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#15803d' }}>
                                                            {fmtAmt(b.comm_paid_ytd)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {b.comm_pending > 0 ? (
                                                            <div>
                                                                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#d97706' }}>
                                                                    {fmtAmt(b.comm_pending)}
                                                                </div>
                                                                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                                                                    {t('intermediaries.brokers.pendingFiles', { count: b.comm_pending_count })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
                                                        )}
                                                    </td>
                                                    {isSA && (
                                                        <td><span style={{ fontSize: 10, color: '#64748b' }}>{b.tenant?.code ?? '—'}</span></td>
                                                    )}
                                                    <td><ActiveBadge active={b.is_active}/></td>
                                                    <td>
                                                        <Link href={route('admin.brokers.show', { broker: b.id })}
                                                              style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                                                            {t('intermediaries.brokers.viewLink')}
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── Onglet Coassureurs ───────────────────── */}
                    {tab === 'coinsurers' && (
                        <>
                            <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                                <SumCard label={t('intermediaries.coinsurers.stats.total')} value={coinsurersStats.total} color="#1e293b" icon={Users}/>
                                <SumCard label={t('intermediaries.coinsurers.stats.active')} value={coinsurersStats.active} color="#15803d" bg="#f0fdf4" icon={CheckCircle}/>
                                <SumCard label={t('intermediaries.coinsurers.stats.inactive')} value={coinsurersStats.inactive} color="#64748b" icon={XCircle}/>
                            </div>

                            <div className="panel">
                                <div className="panel-hdr">
                                    <Users size={14} color="#0284c7"/>
                                    {t('intermediaries.coinsurers.panelTitle')}
                                </div>
                                {coinsurers.length === 0 ? (
                                    <div className="empty">{t('intermediaries.coinsurers.empty')}</div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>{t('intermediaries.coinsurers.table.name')}</th>
                                                <th>{t('intermediaries.coinsurers.table.country')}</th>
                                                <th>{t('intermediaries.coinsurers.table.contact')}</th>
                                                <th>{t('intermediaries.coinsurers.table.activeContracts')}</th>
                                                <th>{t('intermediaries.coinsurers.table.totalContracts')}</th>
                                                {isSA && <th>{t('intermediaries.coinsurers.table.tenant')}</th>}
                                                <th>{t('intermediaries.coinsurers.table.status')}</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {coinsurers.map(c => (
                                                <tr key={c.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.name}</div>
                                                    </td>
                                                    <td style={{ fontSize: 11, color: '#64748b' }}>{c.country_code}</td>
                                                    <td style={{ fontSize: 11, color: '#64748b' }}>
                                                        {c.email && <div>{c.email}</div>}
                                                        {c.phone && <div>{c.phone}</div>}
                                                        {!c.email && !c.phone && '—'}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: c.active_contracts_count > 0 ? '#15803d' : '#94a3b8' }}>
                                                            {c.active_contracts_count}
                                                        </div>
                                                    </td>
                                                    <td style={{ color: '#64748b' }}>{c.contracts_count}</td>
                                                    {isSA && (
                                                        <td><span style={{ fontSize: 10, color: '#64748b' }}>{c.tenant?.code ?? '—'}</span></td>
                                                    )}
                                                    <td><ActiveBadge active={c.is_active}/></td>
                                                    <td>
                                                        <Link href={route('admin.coinsurers.show', { coinsurer: c.id })}
                                                              style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                                                            {t('intermediaries.coinsurers.viewLink')}
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── Onglet Experts ──────────────────────── */}
                    {tab === 'experts' && (
                        <>
                            <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                                <SumCard label={t('intermediaries.experts.stats.total')} value={expertStats.total} color="#1e293b" icon={UserCheck}/>
                                <SumCard label={t('intermediaries.experts.stats.active')} value={expertStats.active} color="#15803d" bg="#f0fdf4" icon={CheckCircle}/>
                                <SumCard label={t('intermediaries.experts.stats.inactive')} value={expertStats.inactive} color="#64748b" icon={XCircle}/>
                            </div>

                            <div className="panel">
                                <div className="panel-hdr">
                                    <UserCheck size={14} color="#059669"/>
                                    {t('intermediaries.experts.panelTitle')}
                                </div>
                                {experts.length === 0 ? (
                                    <div className="empty">{t('intermediaries.experts.empty')}</div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>{t('intermediaries.experts.table.name')}</th>
                                                <th>{t('intermediaries.experts.table.email')}</th>
                                                <th>{t('intermediaries.experts.table.phone')}</th>
                                                <th>{t('intermediaries.experts.table.country')}</th>
                                                {isSA && <th>{t('intermediaries.experts.table.tenant')}</th>}
                                                <th>{t('intermediaries.experts.table.status')}</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {experts.map(e => (
                                                <tr key={e.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{e.name}</div>
                                                    </td>
                                                    <td>
                                                        {e.email ? (
                                                            <a href={`mailto:${e.email}`}
                                                               style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none',
                                                                        display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <Mail size={10}/> {e.email}
                                                            </a>
                                                        ) : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}
                                                    </td>
                                                    <td>
                                                        {e.phone ? (
                                                            <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <Phone size={10}/> {e.phone}
                                                            </span>
                                                        ) : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}
                                                    </td>
                                                    <td style={{ fontSize: 11, color: '#64748b' }}>{e.country_code}</td>
                                                    {isSA && (
                                                        <td><span style={{ fontSize: 10, color: '#64748b' }}>{e.tenant?.code ?? '—'}</span></td>
                                                    )}
                                                    <td><ActiveBadge active={e.is_active}/></td>
                                                    <td>
                                                        <Link href={route('admin.experts.show', { expert: e.id })}
                                                              style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                                                            {t('intermediaries.experts.viewLink')}
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                </div>
            </div>
        </AppLayout>
    );
}
