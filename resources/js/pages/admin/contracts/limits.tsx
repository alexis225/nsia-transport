import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye, Search, Unlock } from 'lucide-react';

interface ContractLimit {
    id: string; contract_number: string; insured_name: string;
    currency_code: string; subscription_limit: number;
    effective_limit: number | null; nn300_unlocked: boolean; treaty_limit: number | null;
    used_limit: number; remaining_limit: number; usage_percent: number;
    certificates_count: number; certificates_limit: number | null;
    alert_level: 'ok' | 'warning' | 'critical';
    expiry_date: string; can_issue: boolean;
    tenant: { name: string; code: string } | null;
}
interface Props {
    contracts: ContractLimit[];
    stats: { total_contracts: number; critical: number; warning: number; ok: number; total_used: number; total_limit: number; };
    isSA: boolean;
}

const ALERT_STYLES = {
    critical: { bg:'#fef2f2', border:'#fecaca', bar:'#ef4444', text:'#dc2626' },
    warning:  { bg:'#fffbeb', border:'#fde68a', bar:'#f59e0b', text:'#92400e' },
    ok:       { bg:'#f0fdf4', border:'#bbf7d0', bar:'#22c55e', text:'#15803d' },
};

const fmt = (n: number, currency: string) =>
    n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' ' + currency;

export default function ContractLimits({ contracts, stats, isSA }: Props) {
    const { t } = useTranslation('contracts');
    const [search, setSearch] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.contracts'), href: '/admin/contracts' },
        { title: t('breadcrumb.limits') },
    ];

    const filteredContracts = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (! q) return contracts;

        return contracts.filter(c =>
            c.contract_number.toLowerCase().includes(q)
            || c.insured_name.toLowerCase().includes(q)
            || (c.tenant?.name.toLowerCase().includes(q) ?? false)
            || (c.tenant?.code.toLowerCase().includes(q) ?? false)
        );
    }, [contracts, search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('limits.title')}/>
            <style>{`
                .lm-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .lm-title{font-size:18px;font-weight:600;color:#1e293b;}
                .lm-sub{font-size:12px;color:#94a3b8;margin-top:2px;}

                /* KPIs */
                .kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
                .kpi-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;text-align:center;}
                .kpi-val{font-size:22px;font-weight:600;color:#1e293b;line-height:1;}
                .kpi-lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:4px;}

                /* Cards grille */
                .cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;}
                .lm-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;transition:border-color .15s;}
                .lm-card.critical{border-color:#fecaca;}
                .lm-card.warning{border-color:#fde68a;}
                .lm-card-hdr{padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;}
                .lm-card-num{font-family:monospace;font-size:13px;font-weight:700;color:#1e293b;}
                .lm-card-name{font-size:11px;color:#64748b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;}
                .alert-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;}
                .lm-card-body{padding:14px 16px;}

                /* Barre progression */
                .progress-wrap{margin-bottom:10px;}
                .progress-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
                .progress-pct{font-size:16px;font-weight:700;}
                .progress-bar{height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;}
                .progress-fill{height:100%;border-radius:4px;transition:width .5s ease;}

                /* Montants */
                .amounts-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
                .amount-item{background:#f8fafc;border-radius:8px;padding:8px 10px;}
                .amount-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px;}
                .amount-value{font-size:12px;font-weight:600;color:#1e293b;font-family:monospace;}

                /* Footer card */
                .lm-card-footer{display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid #f1f5f9;}
                .cert-info{font-size:11px;color:#64748b;}
                .btn-view{padding:5px 12px;border-radius:7px;font-size:11px;color:#1d4ed8;border:1px solid #bfdbfe;background:none;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px;}
                .btn-view:hover{background:#eff6ff;}

                /* Alert bloqué */
                .blocked-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;color:#dc2626;background:#fef2f2;padding:2px 6px;border-radius:6px;}

                .empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="lm-page">

                    {/* Header */}
                    <div>
                        <h1 className="lm-title">{t('limits.heading')}</h1>
                        <p className="lm-sub">{t('limits.subheading')}</p>
                    </div>

                    {/* KPIs */}
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-val">{stats.total_contracts}</div>
                            <div className="kpi-lbl">{t('limits.kpi.tracked')}</div>
                        </div>
                        <div className="kpi-card" style={{ borderColor: stats.critical > 0 ? '#fecaca' : undefined }}>
                            <div className="kpi-val" style={{ color: stats.critical > 0 ? '#dc2626' : '#1e293b' }}>
                                {stats.critical}
                            </div>
                            <div className="kpi-lbl">{t('limits.kpi.critical')}</div>
                        </div>
                        <div className="kpi-card" style={{ borderColor: stats.warning > 0 ? '#fde68a' : undefined }}>
                            <div className="kpi-val" style={{ color: stats.warning > 0 ? '#92400e' : '#1e293b' }}>
                                {stats.warning}
                            </div>
                            <div className="kpi-lbl">{t('limits.kpi.warning')}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val" style={{ color:'#15803d' }}>{stats.ok}</div>
                            <div className="kpi-lbl">{t('limits.kpi.normal')}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val" style={{ fontSize:16 }}>
                                {stats.total_limit > 0
                                    ? Math.round((stats.total_used / stats.total_limit) * 100) + '%'
                                    : '—'}
                            </div>
                            <div className="kpi-lbl">{t('limits.kpi.globalUsage')}</div>
                        </div>
                    </div>

                    {/* Recherche rapide */}
                    <div style={{ position:'relative', maxWidth:340 }}>
                        <Search size={14} color="#94a3b8" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('limits.searchPlaceholder')}
                            style={{ width:'100%', padding:'8px 12px 8px 34px', fontSize:13, border:'1.5px solid #e2e8f0', borderRadius:9, outline:'none', boxSizing:'border-box' }}
                        />
                    </div>

                    {/* Grille de cards */}
                    {contracts.length === 0 ? (
                        <div className="empty">
                            <TrendingUp size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                            <div>{t('limits.emptyAll')}</div>
                        </div>
                    ) : filteredContracts.length === 0 ? (
                        <div className="empty">
                            <Search size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                            <div>{t('limits.emptySearch', { search })}</div>
                        </div>
                    ) : (
                        <div className="cards-grid">
                            {filteredContracts.map(contract => {
                                const as = ALERT_STYLES[contract.alert_level];
                                return (
                                    <div key={contract.id} className={`lm-card ${contract.alert_level}`}>
                                        <div className="lm-card-hdr">
                                            <div>
                                                <div className="lm-card-num">{contract.contract_number}</div>
                                                <div className="lm-card-name">{contract.insured_name}</div>
                                                {isSA && contract.tenant && (
                                                    <div style={{ fontSize:10, color:'#94a3b8' }}>{contract.tenant.name}</div>
                                                )}
                                            </div>
                                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                                                <span className="alert-badge" style={{ background: as.bg, border:`1px solid ${as.border}`, color: as.text }}>
                                                    {contract.alert_level === 'critical' && <AlertTriangle size={10}/>}
                                                    {contract.alert_level === 'warning'  && <AlertTriangle size={10}/>}
                                                    {contract.alert_level === 'ok'       && <CheckCircle  size={10}/>}
                                                    {t(`limits.alertLabels.${contract.alert_level}`)}
                                                </span>
                                                {contract.nn300_unlocked && (
                                                    <span className="alert-badge" style={{ background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1d4ed8' }}>
                                                        <Unlock size={9}/> {t('limits.unlockedTreaty')}
                                                    </span>
                                                )}
                                                {!contract.can_issue && (
                                                    <span className="blocked-badge">
                                                        <XCircle size={9}/> {t('limits.blocked')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="lm-card-body">
                                            {/* Barre progression */}
                                            <div className="progress-wrap">
                                                <div className="progress-header">
                                                    <span style={{ fontSize:11, color:'#64748b' }}>{t('limits.usageLabel')}</span>
                                                    <span className="progress-pct" style={{ color: as.text }}>
                                                        {contract.usage_percent}%
                                                    </span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div className="progress-fill"
                                                         style={{ width:`${contract.usage_percent}%`, background: as.bar }}/>
                                                </div>
                                            </div>

                                            {/* Montants */}
                                            <div className="amounts-grid">
                                                <div className="amount-item">
                                                    <div className="amount-label">{t('limits.used')}</div>
                                                    <div className="amount-value">
                                                        {fmt(contract.used_limit, contract.currency_code)}
                                                    </div>
                                                </div>
                                                <div className="amount-item">
                                                    <div className="amount-label">{t('limits.remaining')}</div>
                                                    <div className="amount-value" style={{ color: as.text }}>
                                                        {fmt(contract.remaining_limit, contract.currency_code)}
                                                    </div>
                                                </div>
                                                <div className="amount-item" style={{ gridColumn:'1/-1' }}>
                                                    <div className="amount-label">
                                                        {contract.nn300_unlocked ? t('limits.effectiveTreatyLimit') : t('limits.totalNN300Limit')}
                                                    </div>
                                                    <div className="amount-value">
                                                        {fmt(contract.effective_limit ?? contract.subscription_limit, contract.currency_code)}
                                                    </div>
                                                    {contract.nn300_unlocked && contract.treaty_limit !== null && (
                                                        <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>
                                                            {t('limits.standardNN300Limit', { amount: fmt(contract.subscription_limit, contract.currency_code) })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="lm-card-footer">
                                                <div className="cert-info">
                                                    <span style={{ color:'#1e293b', fontWeight:500 }}>{contract.certificates_count}</span>
                                                    {contract.certificates_limit && ` / ${contract.certificates_limit}`} {t('limits.certificates', { count: contract.certificates_count })}
                                                    {' · '} {t('limits.expiry', { date: contract.expiry_date })}
                                                </div>
                                                <Link href={route('admin.contracts.show', { contract: contract.id })}
                                                      className="btn-view">
                                                    <Eye size={11}/> {t('limits.view')}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}