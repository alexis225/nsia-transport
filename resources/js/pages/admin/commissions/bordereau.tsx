import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { FileText, Download, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Commissions', href: '/admin/commissions/rules' },
    { title: 'Bordereau' },
];

interface Transaction {
    id: string; period_month: string; status: string;
    currency_code: string;
    prime_brute: number; rate_pct: number; commission: number; prime_nette: number;
    certificate: { id: string; certificate_number: string; insured_name: string; voyage_date: string } | null;
    contract:    { id: string; contract_number: string } | null;
    broker:      { id: string; name: string; code: string } | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number; from: number; to: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    transactions: Paginated<Transaction>;
    totals:  { prime_brute: number; commission: number; prime_nette: number; count: number };
    brokers: { id: string; name: string; code: string }[];
    filters: { period_from?: string; period_to?: string; broker_id?: string; status?: string };
    isSA:    boolean;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    PENDING:   { bg:'#fffbeb', color:'#92400e', dot:'#f59e0b', label:'En attente' },
    PAID:      { bg:'#f0fdf4', color:'#15803d', dot:'#22c55e', label:'Payée' },
    CANCELLED: { bg:'#f8fafc', color:'#94a3b8', dot:'#cbd5e1', label:'Annulée' },
};

const fmt    = (n: number, c: string) => n.toLocaleString('fr-FR', { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' ' + c;
const fmtDt  = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

export default function CommissionBordereau({ transactions, totals, brokers, filters, isSA }: Props) {

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/commissions/bordereau', { ...filters, ...params, page: '1' }, { preserveState: true, replace: true });

    const exportUrl = (format: string) => {
        const params = new URLSearchParams(filters as Record<string, string>).toString();
        return `/admin/commissions/export/${format}?${params}`;
    };

    const defaultFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const defaultTo   = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bordereau de commissions — NSIA Transport"/>
            <style>{`
                .bd-page{padding:4px;display:flex;flex-direction:column;gap:14px;}
                .bd-title{font-size:18px;font-weight:600;color:#1e293b;}
                .bd-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
                .kpi-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px 14px;text-align:center;}
                .kpi-val{font-size:18px;font-weight:700;color:#1e293b;line-height:1.2;}
                .kpi-lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:3px;}
                .toolbar{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
                .hs-date{padding:8px 10px;font-size:12px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;height:38px;}
                .hs-select{padding:8px 10px;font-size:12px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;height:38px;}
                .bd-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:9px 14px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.07em;text-align:left;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
                td{padding:10px 14px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .num{font-family:monospace;font-size:12px;}
                .tfoot-row{background:#f8fafc;}
                .tfoot-row td{font-weight:700;font-family:monospace;border-top:2px solid #e2e8f0;}
                .pg-wrap{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-top:1px solid #f8fafc;flex-wrap:wrap;gap:8px;}
                .pg-info{font-size:11px;color:#94a3b8;}
                .pg-links{display:flex;gap:4px;}
                .pg-btn{min-width:28px;height:28px;padding:0 6px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="bd-page">

                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                        <div>
                            <h1 className="bd-title">Bordereau de commissions</h1>
                            <p className="bd-sub">Primes brutes, commissions et primes nettes par courtier</p>
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                            <a href={exportUrl('csv')}>
                                <Button variant="outline" className="h-9 px-3 text-xs">
                                    <Download size={12}/> CSV
                                </Button>
                            </a>
                            <a href={exportUrl('xlsx')}>
                                <Button variant="outline" className="h-9 px-3 text-xs" style={{ borderColor:'#16a34a', color:'#15803d' }}>
                                    <Download size={12}/> Excel
                                </Button>
                            </a>
                            <a href={exportUrl('pdf')}>
                                <Button variant="outline" className="h-9 px-3 text-xs" style={{ borderColor:'#dc2626', color:'#dc2626' }}>
                                    <FileText size={12}/> PDF
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* KPIs totaux */}
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-val">{totals.count}</div>
                            <div className="kpi-lbl">Certificats</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val" style={{ fontSize:14 }}>
                                {totals.prime_brute.toLocaleString('fr-FR', { maximumFractionDigits:0 })}
                            </div>
                            <div className="kpi-lbl">Prime brute totale</div>
                        </div>
                        <div className="kpi-card" style={{ borderColor:'#bfdbfe' }}>
                            <div className="kpi-val" style={{ fontSize:14, color:'#1d4ed8' }}>
                                {totals.commission.toLocaleString('fr-FR', { maximumFractionDigits:0 })}
                            </div>
                            <div className="kpi-lbl">Commission totale</div>
                        </div>
                        <div className="kpi-card" style={{ borderColor:'#bbf7d0' }}>
                            <div className="kpi-val" style={{ fontSize:14, color:'#15803d' }}>
                                {totals.prime_nette.toLocaleString('fr-FR', { maximumFractionDigits:0 })}
                            </div>
                            <div className="kpi-lbl">Prime nette totale</div>
                        </div>
                    </div>

                    {/* Toolbar filtres */}
                    <div className="toolbar">
                        <Filter size={13} color="#94a3b8"/>
                        <input type="date" className="hs-date"
                               value={filters?.period_from ?? defaultFrom}
                               onChange={e => applyFilter({ period_from: e.target.value })}
                               title="Période du"/>
                        <span style={{ fontSize:11, color:'#94a3b8' }}>au</span>
                        <input type="date" className="hs-date"
                               value={filters?.period_to ?? defaultTo}
                               onChange={e => applyFilter({ period_to: e.target.value })}
                               title="Période au"/>

                        <select className="hs-select" value={filters?.broker_id ?? ''}
                                onChange={e => applyFilter({ broker_id: e.target.value })}>
                            <option value="">Tous les courtiers</option>
                            {brokers.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>

                        <select className="hs-select" value={filters?.status ?? ''}
                                onChange={e => applyFilter({ status: e.target.value })}>
                            <option value="">Tous les statuts</option>
                            <option value="PENDING">En attente</option>
                            <option value="PAID">Payées</option>
                            <option value="CANCELLED">Annulées</option>
                        </select>

                        {(filters?.broker_id || filters?.status) && (
                            <button onClick={() => router.get('/admin/commissions/bordereau')}
                                    style={{ fontSize:11, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                                <X size={11}/> Effacer
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bd-card">
                        {transactions.data.length === 0 ? (
                            <div className="empty">
                                <FileText size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                                <div>Aucune transaction trouvée pour la période.</div>
                            </div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Certificat</th>
                                            <th>Assuré</th>
                                            <th>Contrat</th>
                                            <th>Courtier</th>
                                            <th>Période</th>
                                            <th style={{ textAlign:'right' }}>Prime brute</th>
                                            <th style={{ textAlign:'center' }}>Taux</th>
                                            <th style={{ textAlign:'right' }}>Commission</th>
                                            <th style={{ textAlign:'right' }}>Prime nette</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.data.map(tx => {
                                            const ss = STATUS_STYLES[tx.status] ?? STATUS_STYLES.PENDING;
                                            return (
                                                <tr key={tx.id}>
                                                    <td>
                                                        <div style={{ fontFamily:'monospace', fontSize:12, fontWeight:600, color:'#1e293b' }}>
                                                            {tx.certificate?.certificate_number}
                                                        </div>
                                                        {tx.certificate?.voyage_date && (
                                                            <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                                {fmtDt(tx.certificate.voyage_date)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                        {tx.certificate?.insured_name}
                                                    </td>
                                                    <td style={{ fontSize:11, color:'#64748b' }}>
                                                        {tx.contract?.contract_number}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize:12, fontWeight:500 }}>{tx.broker?.name}</div>
                                                        <div style={{ fontSize:10, color:'#94a3b8' }}>{tx.broker?.code}</div>
                                                    </td>
                                                    <td style={{ fontFamily:'monospace', fontSize:11 }}>{tx.period_month}</td>
                                                    <td className="num" style={{ textAlign:'right' }}>
                                                        {fmt(tx.prime_brute, tx.currency_code)}
                                                    </td>
                                                    <td style={{ textAlign:'center' }}>
                                                        <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:600, color:'#1d4ed8' }}>
                                                            {parseFloat(String(tx.rate_pct)).toFixed(2)}%
                                                        </span>
                                                    </td>
                                                    <td className="num" style={{ textAlign:'right', color:'#1d4ed8', fontWeight:600 }}>
                                                        {fmt(tx.commission, tx.currency_code)}
                                                    </td>
                                                    <td className="num" style={{ textAlign:'right', color:'#15803d', fontWeight:600 }}>
                                                        {fmt(tx.prime_nette, tx.currency_code)}
                                                    </td>
                                                    <td>
                                                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px', borderRadius:8, fontSize:11, fontWeight:500, background: ss.bg, color: ss.color }}>
                                                            <span style={{ width:5, height:5, borderRadius:'50%', background: ss.dot }}/>
                                                            {ss.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {/* Pied de tableau — totaux */}
                                    <tfoot>
                                        <tr className="tfoot-row">
                                            <td colSpan={5} style={{ fontFamily:'inherit', fontWeight:600, color:'#1e293b' }}>
                                                TOTAL — {transactions.total} transaction{transactions.total > 1 ? 's' : ''}
                                            </td>
                                            <td className="num" style={{ textAlign:'right' }}>
                                                {totals.prime_brute.toLocaleString('fr-FR', { minimumFractionDigits:2 })}
                                            </td>
                                            <td/>
                                            <td className="num" style={{ textAlign:'right', color:'#1d4ed8' }}>
                                                {totals.commission.toLocaleString('fr-FR', { minimumFractionDigits:2 })}
                                            </td>
                                            <td className="num" style={{ textAlign:'right', color:'#15803d' }}>
                                                {totals.prime_nette.toLocaleString('fr-FR', { minimumFractionDigits:2 })}
                                            </td>
                                            <td/>
                                        </tr>
                                    </tfoot>
                                </table>

                                {/* Pagination */}
                                {transactions.last_page > 1 && (
                                    <div className="pg-wrap">
                                        <span className="pg-info">
                                            {transactions.from}–{transactions.to} sur {transactions.total}
                                        </span>
                                        <div className="pg-links">
                                            <button className="pg-btn" disabled={transactions.current_page === 1}
                                                    onClick={() => applyFilter({ page: String(transactions.current_page - 1) })}>
                                                <ChevronLeft size={13}/>
                                            </button>
                                            {transactions.links.map((link, i) => {
                                                if (i === 0 || i === transactions.links.length - 1) return null;
                                                return (
                                                    <button key={i} className={`pg-btn ${link.active ? 'act' : ''}`}
                                                            disabled={!link.url}
                                                            onClick={() => link.url && applyFilter({ page: link.label })}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                );
                                            })}
                                            <button className="pg-btn" disabled={transactions.current_page === transactions.last_page}
                                                    onClick={() => applyFilter({ page: String(transactions.current_page + 1) })}>
                                                <ChevronRight size={13}/>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}