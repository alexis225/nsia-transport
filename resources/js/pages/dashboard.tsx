import { Head } from '@inertiajs/react';
import { Award, BarChart2, FileText, TrendingDown, TrendingUp, Users, RefreshCw, ArrowRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
];

// ── Types ─────────────────────────────────────────────────────
interface KPI      { label: string; value: string; change: number; sub: string; }
interface RecentCert {
    id: string; number: string; client: string;
    amount: string; status: 'ISSUED'|'SUBMITTED'|'DRAFT'|'CANCELLED'; date: string;
}
interface Props {
    kpis?:        KPI[];
    recentCerts?: RecentCert[];
    topBrokers?:  { name: string; count: number; amount: string }[];
    monthlyData?: { month: string; issued: number; amount: number }[];
}

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
    ISSUED:    { bg: '#f0fdf4', color: '#15803d', label: 'Émis' },
    SUBMITTED: { bg: '#eff6ff', color: '#1d4ed8', label: 'Soumis' },
    DRAFT:     { bg: '#f8fafc', color: '#64748b', label: 'Brouillon' },
    CANCELLED: { bg: '#fef2f2', color: '#dc2626', label: 'Annulé' },
};

// ── Sparkline SVG ─────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data), min = Math.min(...data);
    const w = 80, h = 28;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * h;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default function Dashboard({
    kpis = [], recentCerts = [], topBrokers = [], monthlyData = [],
}: Props) {

    // ── Données démo ─────────────────────────────────────────
    const _kpis: KPI[] = kpis.length ? kpis : [
        { label: 'Certificats émis',  value: '1 247',       change: +12, sub: 'Ce mois' },
        { label: 'Primes assurées',   value: '724 091 XOF', change: +9,  sub: 'Ce mois' },
        { label: 'Contrats actifs',   value: '38',          change: -3,  sub: 'Total'   },
        { label: 'Courtiers actifs',  value: '24',          change: +5,  sub: 'Total'   },
    ];
    const _certs: RecentCert[] = recentCerts.length ? recentCerts : [
        { id:'1', number:'CI-2026-001247', client:'Société ABCD Import',  amount:'12 400 000', status:'ISSUED',    date:'18/03/2026' },
        { id:'2', number:'CI-2026-001246', client:'Transport EFGH SARL',  amount:'8 750 000',  status:'SUBMITTED', date:'17/03/2026' },
        { id:'3', number:'CI-2026-001245', client:'Logistics IJ Group',   amount:'22 100 000', status:'ISSUED',    date:'16/03/2026' },
        { id:'4', number:'CI-2026-001244', client:'KLMN Import Export',   amount:'5 300 000',  status:'DRAFT',     date:'15/03/2026' },
        { id:'5', number:'CI-2026-001243', client:'OPQ Marchandises',     amount:'18 900 000', status:'CANCELLED', date:'14/03/2026' },
    ];
    const _brokers = topBrokers.length ? topBrokers : [
        { name: 'Cabinet Koné & Associés',  count: 142, amount: '284M XOF' },
        { name: 'Courtage Pro CI',           count: 98,  amount: '196M XOF' },
        { name: 'Transport Assur SARL',      count: 76,  amount: '152M XOF' },
        { name: 'Groupe Diallo Courtage',    count: 54,  amount: '108M XOF' },
    ];
    const _monthly = monthlyData.length ? monthlyData : [
        { month:'Jan', issued:89,  amount:178 }, { month:'Fév', issued:102, amount:204 },
        { month:'Mar', issued:94,  amount:188 }, { month:'Avr', issued:118, amount:236 },
        { month:'Mai', issued:127, amount:254 }, { month:'Jun', issued:98,  amount:196 },
        { month:'Jul', issued:145, amount:290 }, { month:'Aoû', issued:132, amount:264 },
        { month:'Sep', issued:156, amount:312 }, { month:'Oct', issued:178, amount:356 },
        { month:'Nov', issued:165, amount:330 }, { month:'Déc', issued:143, amount:286 },
    ];

    const maxAmt    = Math.max(..._monthly.map(m => m.amount));
    const sparkData = _monthly.map(m => m.issued);
    const kpiIcons  = [Award, TrendingUp, FileText, Users];
    const kpiColors = [
        { bg:'#eff6ff', ico:'#3b82f6' },
        { bg:'#f0fdf4', ico:'#22c55e' },
        { bg:'#fff7ed', ico:'#f97316' },
        { bg:'#fdf4ff', ico:'#a855f7' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard — NSIA Transport" />

            <style>{`
                .dash { display:flex; flex-direction:column; gap:18px; font-family:'DM Sans',sans-serif; }

                /* Header */
                .dash-hdr { display:flex; align-items:flex-start; justify-content:space-between; }
                .dash-hdr h1 { font-size:17px; font-weight:600; color:#1e293b; }
                .dash-hdr p  { font-size:12px; color:#94a3b8; margin-top:1px; font-weight:300; }
                .refresh-btn { display:flex; align-items:center; gap:5px; padding:6px 12px; background:#fff; border:1.5px solid #e2e8f0; border-radius:8px; font-size:12px; color:#3b82f6; cursor:pointer; font-family:inherit; transition:all .15s; }
                .refresh-btn:hover { background:#eff6ff; border-color:#bfdbfe; }

                /* KPI grid */
                .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
                .kpi-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:10px; transition:box-shadow .2s; }
                .kpi-card:hover { box-shadow:0 4px 18px rgba(0,0,0,.07); }
                .kpi-top  { display:flex; align-items:center; justify-content:space-between; }
                .kpi-ico  { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; }
                .kpi-badge { display:flex; align-items:center; gap:3px; padding:2px 7px; border-radius:10px; font-size:11px; font-weight:600; }
                .kpi-up   { background:#f0fdf4; color:#15803d; }
                .kpi-down { background:#fef2f2; color:#dc2626; }
                .kpi-val  { font-size:20px; font-weight:700; color:#1e293b; letter-spacing:-.02em; }
                .kpi-lbl  { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; }

                /* Row layout */
                .row2 { display:grid; grid-template-columns:2fr 1fr; gap:12px; }

                /* Chart */
                .chart-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; padding:18px 20px; }
                .chart-hdr  { display:flex; align-items:center; justify-content:space-between; margin-bottom:3px; }
                .chart-ttl  { font-size:13px; font-weight:600; color:#1e293b; }
                .chart-sub  { font-size:11px; color:#94a3b8; margin-bottom:14px; }
                .see-more   { font-size:11px; color:#3b82f6; text-decoration:none; display:flex; align-items:center; gap:3px; }
                .see-more:hover { color:#1d4ed8; }

                /* Bars */
                .bars { display:flex; align-items:flex-end; gap:5px; height:90px; }
                .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; }
                .bar { width:100%; border-radius:3px 3px 0 0; background:linear-gradient(180deg,#60a5fa 0%,#1d4ed8 100%); min-height:3px; transition:opacity .15s; }
                .bar:hover { opacity:.75; }
                .bar-lbl { font-size:9px; color:#94a3b8; }

                .chart-stats { display:flex; gap:20px; margin-top:14px; padding-top:12px; border-top:1px solid #f8fafc; }
                .stat-val  { font-size:17px; font-weight:700; color:#1e293b; }
                .stat-lbl  { font-size:9px; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; }

                /* Brokers */
                .brokers { display:flex; flex-direction:column; gap:10px; padding:2px 0; }
                .broker-row { display:flex; align-items:center; gap:8px; }
                .b-rank { width:20px; height:20px; border-radius:50%; background:#eff6ff; color:#1d4ed8; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
                .b-name { flex:1; font-size:12px; color:#334155; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                .b-count { font-size:11px; color:#94a3b8; }
                .b-bar-bg { width:56px; height:4px; background:#f1f5f9; border-radius:2px; overflow:hidden; }
                .b-bar { height:100%; background:linear-gradient(90deg,#60a5fa,#1d4ed8); border-radius:2px; }
                .b-amount { font-size:11px; color:#1d4ed8; font-weight:600; flex-shrink:0; }

                /* Table */
                .tbl-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; }
                .tbl-hdr  { padding:14px 18px; border-bottom:1px solid #f8fafc; display:flex; align-items:center; justify-content:space-between; }
                .tbl-ttl  { font-size:13px; font-weight:600; color:#1e293b; }
                table  { width:100%; border-collapse:collapse; }
                th { padding:8px 14px; font-size:10px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; text-align:left; background:#f8fafc; border-bottom:1px solid #f1f5f9; }
                td { padding:10px 14px; font-size:12px; color:#334155; border-bottom:1px solid #f8fafc; vertical-align:middle; }
                tr:last-child td { border-bottom:none; }
                tr:hover td { background:#fafafa; }
                .cert-num { font-family:monospace; font-size:11px; color:#1d4ed8; font-weight:500; }
                .s-badge  { display:inline-flex; align-items:center; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:500; }

                @media(max-width:1024px) { .kpi-grid{grid-template-columns:repeat(2,1fr);} .row2{grid-template-columns:1fr;} }
                @media(max-width:640px)  { .kpi-grid{grid-template-columns:1fr 1fr;} }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="dash">

                    {/* Header */}
                    <div className="dash-hdr">
                        <div>
                            <h1>Rapport général</h1>
                            <p>Mars 2026 · Filiale Côte d'Ivoire</p>
                        </div>
                        <button className="refresh-btn">
                            <RefreshCw size={12}/> Actualiser
                        </button>
                    </div>

                    {/* KPIs */}
                    <div className="kpi-grid">
                        {_kpis.map((kpi, i) => {
                            const c   = kpiColors[i % 4];
                            const up  = kpi.change >= 0;
                            const Ico = kpiIcons[i % 4];
                            return (
                                <div key={i} className="kpi-card">
                                    <div className="kpi-top">
                                        <div className="kpi-ico" style={{ background: c.bg }}>
                                            <Ico size={17} color={c.ico}/>
                                        </div>
                                        <div className={`kpi-badge ${up ? 'kpi-up' : 'kpi-down'}`}>
                                            {up ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                                            {Math.abs(kpi.change)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="kpi-val">{kpi.value}</div>
                                        <div className="kpi-lbl">{kpi.label}</div>
                                    </div>
                                    <Sparkline data={sparkData} color={c.ico}/>
                                </div>
                            );
                        })}
                    </div>

                    {/* Graphique + Brokers */}
                    <div className="row2">
                        <div className="chart-card">
                            <div className="chart-hdr">
                                <span className="chart-ttl">Certificats émis — mensuel</span>
                                <a href="/admin/reports/certificates" className="see-more">
                                    Voir plus <ArrowRight size={10}/>
                                </a>
                            </div>
                            <p className="chart-sub">Évolution 12 mois · 2026</p>
                            <div className="bars">
                                {_monthly.map((m, i) => (
                                    <div key={i} className="bar-col">
                                        <div className="bar" style={{ height:`${(m.amount / maxAmt) * 82}px` }}
                                             title={`${m.month}: ${m.issued}`}/>
                                        <span className="bar-lbl">{m.month}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="chart-stats">
                                <div>
                                    <div className="stat-val">{_monthly.reduce((s,m) => s + m.issued, 0).toLocaleString()}</div>
                                    <div className="stat-lbl">Total annuel</div>
                                </div>
                                <div>
                                    <div className="stat-val">{(_monthly.reduce((s,m) => s + m.amount, 0)/1000).toFixed(0)}M XOF</div>
                                    <div className="stat-lbl">Primes totales</div>
                                </div>
                            </div>
                        </div>

                        <div className="chart-card">
                            <div className="chart-hdr">
                                <span className="chart-ttl">Top courtiers</span>
                                <a href="/admin/brokers" className="see-more">Voir plus <ArrowRight size={10}/></a>
                            </div>
                            <p className="chart-sub">Par volume · ce mois</p>
                            <div className="brokers">
                                {_brokers.map((b, i) => (
                                    <div key={i} className="broker-row">
                                        <div className="b-rank">{i+1}</div>
                                        <div style={{ flex:1, overflow:'hidden' }}>
                                            <div className="b-name">{b.name}</div>
                                            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                                                <div className="b-bar-bg">
                                                    <div className="b-bar" style={{ width:`${(b.count/_brokers[0].count)*100}%` }}/>
                                                </div>
                                                <span className="b-count">{b.count}</span>
                                            </div>
                                        </div>
                                        <span className="b-amount">{b.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table certificats récents */}
                    <div className="tbl-card">
                        <div className="tbl-hdr">
                            <span className="tbl-ttl">Certificats récents</span>
                            <a href="/admin/certificates" className="see-more">
                                Voir tous <ArrowRight size={10}/>
                            </a>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>N° Certificat</th>
                                    <th>Client</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {_certs.map(cert => {
                                    const s = STATUS[cert.status] ?? STATUS.DRAFT;
                                    return (
                                        <tr key={cert.id}>
                                            <td><span className="cert-num">{cert.number}</span></td>
                                            <td style={{ fontWeight:500, color:'#1e293b', fontSize:12 }}>{cert.client}</td>
                                            <td style={{ fontFamily:'monospace', fontSize:11 }}>{cert.amount} XOF</td>
                                            <td>
                                                <span className="s-badge" style={{ background:s.bg, color:s.color }}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td style={{ color:'#94a3b8', fontSize:11 }}>{cert.date}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}