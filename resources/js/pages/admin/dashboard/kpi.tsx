import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Award, AlertTriangle, TrendingUp, CheckCircle,
    Clock, FileText, Percent, BarChart2,
    Ship, Plane, Truck, Users,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('admin.dashboard') },
    { title: 'KPIs Filiale' },
];

// ── Types ────────────────────────────────────────────────────
interface MonthData  { label: string; count: number }
interface TopBroker  { broker_name: string; count: number; total_value: string; total_prime: string }

interface Props {
    certStats: {
        issued_month: number; issued_prev_month: number; issued_ytd: number;
        submitted: number; draft: number; cancelled_month: number;
    };
    avgProcessingHours: number | null;
    monthlyData:        MonthData[];
    transportBreakdown: Record<string, number>;
    contractStats:      { active: number; expiring_30: number; expiring_7: number; draft: number; expired: number };
    limitUsagePct:      number | null;
    commStats:          { pending_amount: number; paid_month: number; pending_count: number };
    escaladeStats:      { pending: number; approved: number; rejected: number };
    approvalRate:       number | null;
    topBrokers:         TopBroker[];
    isSA:               boolean;
    currentMonth:       string;
    currentYear:        number;
}

// ── Helpers ──────────────────────────────────────────────────
const fmtNum = (n: number) => n.toLocaleString('fr-FR');
const fmtAmt = (n: number | string) =>
    parseFloat(String(n)).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function Trend({ curr, prev }: { curr: number; prev: number }) {
    if (prev === 0) return null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    const up  = pct >= 0;
    return (
        <span style={{ fontSize: 10, fontWeight: 600, color: up ? '#15803d' : '#dc2626',
                       background: up ? '#f0fdf4' : '#fef2f2',
                       borderRadius: 6, padding: '1px 5px', marginLeft: 4 }}>
            {up ? '▲' : '▼'} {Math.abs(pct)}%
        </span>
    );
}

// ── Bar Chart SVG ────────────────────────────────────────────
function BarChart({ data }: { data: MonthData[] }) {
    const max    = Math.max(...data.map(d => d.count), 1);
    const W      = 560;
    const H      = 90;
    const barW   = 32;
    const gap    = (W - data.length * barW) / (data.length + 1);
    const blue   = '#1d4ed8';
    const blueLt = '#dbeafe';

    return (
        <svg viewBox={`0 0 ${W} ${H + 28}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {data.map((d, i) => {
                const x    = gap + i * (barW + gap);
                const bH   = max === 0 ? 2 : Math.max(3, Math.round((d.count / max) * H));
                const y    = H - bH;
                const isLast = i === data.length - 1;
                return (
                    <g key={d.label}>
                        <rect x={x} y={0} width={barW} height={H}
                              fill={blueLt} rx={3} opacity={0.3}/>
                        <rect x={x} y={y} width={barW} height={bH}
                              fill={isLast ? '#1e3a8a' : blue} rx={3}/>
                        {d.count > 0 && (
                            <text x={x + barW / 2} y={y - 4}
                                  textAnchor="middle" fontSize={9} fill="#475569" fontWeight="600">
                                {d.count}
                            </text>
                        )}
                        <text x={x + barW / 2} y={H + 14}
                              textAnchor="middle" fontSize={8.5} fill="#94a3b8">
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ── Donut Chart SVG ──────────────────────────────────────────
const TRANSPORT_COLORS: Record<string, string> = {
    SEA: '#0284c7', AIR: '#7c3aed', ROAD: '#059669', RAIL: '#d97706', AUTRE: '#94a3b8',
};
const TRANSPORT_LABELS: Record<string, string> = {
    SEA: 'Maritime', AIR: 'Aérien', ROAD: 'Routier', RAIL: 'Ferroviaire', AUTRE: 'Autre',
};
const TRANSPORT_ICONS: Record<string, any> = {
    SEA: Ship, AIR: Plane, ROAD: Truck, RAIL: Truck, AUTRE: Award,
};

function TransportBreakdown({ data }: { data: Record<string, number> }) {
    const total = Object.values(data).reduce((s, v) => s + v, 0);
    if (total === 0) {
        return (
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                Aucune donnée ce mois
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(data).map(([type, count]) => {
                const pct  = Math.round((count / total) * 100);
                const Icon = TRANSPORT_ICONS[type] ?? Award;
                const col  = TRANSPORT_COLORS[type] ?? '#64748b';
                return (
                    <div key={type}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
                                <Icon size={11} color={col}/>
                                {TRANSPORT_LABELS[type] ?? type}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>
                                {count} <span style={{ fontSize: 10, color: '#94a3b8' }}>({pct}%)</span>
                            </div>
                        </div>
                        <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3,
                                          transition: 'width .5s ease' }}/>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
    const capped = Math.min(pct, 100);
    return (
        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ height: '100%', width: `${capped}%`, background: color, borderRadius: 4,
                          transition: 'width .5s ease' }}/>
        </div>
    );
}

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({
    label, value, sub, color = '#1e293b', bg = '#fff',
    border = '#e2e8f0', icon: Icon, trend,
}: {
    label: string; value: string | number; sub?: string;
    color?: string; bg?: string; border?: string;
    icon?: any; trend?: React.ReactNode;
}) {
    return (
        <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12,
                      padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {Icon && (
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} color={color}/>
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase',
                              letterSpacing: '.05em', marginBottom: 2 }}>
                    {label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
                    {value}{trend}
                </div>
                {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────
export default function KpiDashboard({
    certStats, avgProcessingHours, monthlyData, transportBreakdown,
    contractStats, limitUsagePct, commStats, escaladeStats, approvalRate,
    topBrokers, isSA, currentMonth, currentYear,
}: Props) {

    const issuedEvolution = (
        <Trend curr={certStats.issued_month} prev={certStats.issued_prev_month}/>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard KPIs — NSIA Transport"/>
            <style>{`
                .kpi-page { padding: 4px; display: flex; flex-direction: column; gap: 16px; }
                .kpi-section-title {
                    font-size: 11px; font-weight: 600; color: #64748b;
                    text-transform: uppercase; letter-spacing: .07em;
                    padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; margin-bottom: 8px;
                }
                .kpi-row  { display: grid; gap: 12px; }
                .kpi-row-4 { grid-template-columns: repeat(4, 1fr); }
                .kpi-row-3 { grid-template-columns: repeat(3, 1fr); }
                .kpi-row-2 { grid-template-columns: repeat(2, 1fr); }
                .kpi-panel {
                    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden;
                }
                .kpi-panel-hdr {
                    padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
                    font-size: 12px; font-weight: 600; color: #1e293b;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .kpi-panel-hdr-title { display: flex; align-items: center; gap: 7px; }
                .kpi-panel-body { padding: 14px 16px; }
                .broker-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 7px 0; border-bottom: 1px solid #f8fafc;
                }
                .broker-row:last-child { border-bottom: none; }
                .broker-name { font-size: 12px; font-weight: 500; color: #1e293b; }
                .broker-sub  { font-size: 10px; color: #94a3b8; }
                .broker-cnt  { font-size: 16px; font-weight: 700; color: #1d4ed8; text-align: right; }
                .stat-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 6px 0; border-bottom: 1px solid #f8fafc; font-size: 12px;
                }
                .stat-row:last-child { border-bottom: none; }
                .stat-lbl { color: #64748b; }
                .stat-val { font-weight: 600; color: #1e293b; }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="kpi-page">

                    {/* ── Header ──────────────────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                                Dashboard KPIs
                            </h1>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                                Indicateurs de performance — {currentMonth} · Exercice {currentYear}
                            </p>
                        </div>
                        <Link href={route('admin.dashboard.pending')}
                              style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'none',
                                       display: 'flex', alignItems: 'center', gap: 5,
                                       background: '#eff6ff', padding: '6px 12px', borderRadius: 8,
                                       border: '1px solid #bfdbfe' }}>
                            <Clock size={13}/> File de validation
                            {certStats.submitted > 0 && (
                                <span style={{ background: '#dc2626', color: '#fff', borderRadius: 10,
                                               fontSize: 10, padding: '0 5px', fontWeight: 700 }}>
                                    {certStats.submitted}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* ── KPIs Certificats (top row) ──────────── */}
                    <div>
                        <div className="kpi-section-title">Certificats</div>
                        <div className="kpi-row kpi-row-4" style={{ gridTemplateColumns: 'repeat(4,1fr) repeat(2,1fr)', gap: 10 }}>
                            <KpiCard label="Émis ce mois"
                                     value={fmtNum(certStats.issued_month)}
                                     sub={`vs ${fmtNum(certStats.issued_prev_month)} mois préc.`}
                                     color="#1d4ed8" icon={Award}
                                     trend={issuedEvolution}/>
                            <KpiCard label={`Émis ${currentYear} (YTD)`}
                                     value={fmtNum(certStats.issued_ytd)}
                                     color="#0284c7" icon={TrendingUp}/>
                            <KpiCard label="En attente"
                                     value={fmtNum(certStats.submitted)}
                                     bg={certStats.submitted > 5 ? '#fef2f2' : '#fff'}
                                     border={certStats.submitted > 5 ? '#fecaca' : '#e2e8f0'}
                                     color={certStats.submitted > 5 ? '#dc2626' : '#f59e0b'}
                                     icon={Clock}/>
                            <KpiCard label="Brouillons"
                                     value={fmtNum(certStats.draft)}
                                     color="#64748b" icon={FileText}/>
                            <KpiCard label="Annulés ce mois"
                                     value={fmtNum(certStats.cancelled_month)}
                                     color={certStats.cancelled_month > 0 ? '#dc2626' : '#94a3b8'}
                                     icon={AlertTriangle}/>
                            <KpiCard label="Délai moyen traitement"
                                     value={avgProcessingHours !== null ? `${avgProcessingHours}h` : '—'}
                                     sub="soumission → émission"
                                     color="#7c3aed" icon={Clock}/>
                        </div>
                    </div>

                    {/* ── Tendance + Transport + Contrats ─────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px 240px', gap: 14 }}>

                        {/* Bar chart mensuel */}
                        <div className="kpi-panel">
                            <div className="kpi-panel-hdr">
                                <div className="kpi-panel-hdr-title">
                                    <BarChart2 size={14} color="#1d4ed8"/>
                                    Émissions par mois (12 mois)
                                </div>
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>Certificats ISSUED</span>
                            </div>
                            <div className="kpi-panel-body">
                                <BarChart data={monthlyData}/>
                            </div>
                        </div>

                        {/* Transport breakdown */}
                        <div className="kpi-panel">
                            <div className="kpi-panel-hdr">
                                <div className="kpi-panel-hdr-title">
                                    <Ship size={14} color="#0284c7"/>
                                    Par mode (ce mois)
                                </div>
                            </div>
                            <div className="kpi-panel-body">
                                <TransportBreakdown data={transportBreakdown}/>
                            </div>
                        </div>

                        {/* Contrats */}
                        <div className="kpi-panel">
                            <div className="kpi-panel-hdr">
                                <div className="kpi-panel-hdr-title">
                                    <FileText size={14} color="#059669"/>
                                    Contrats
                                </div>
                                <Link href={route('admin.contracts.index')}
                                      style={{ fontSize: 10, color: '#1d4ed8', textDecoration: 'none' }}>
                                    Voir →
                                </Link>
                            </div>
                            <div className="kpi-panel-body">
                                <div className="stat-row">
                                    <span className="stat-lbl">Actifs</span>
                                    <span className="stat-val" style={{ color: '#059669' }}>
                                        {contractStats.active}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-lbl">Expirant dans 30j</span>
                                    <span className="stat-val"
                                          style={{ color: contractStats.expiring_30 > 0 ? '#f59e0b' : '#64748b' }}>
                                        {contractStats.expiring_30}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-lbl">Expirant dans 7j</span>
                                    <span className="stat-val"
                                          style={{ color: contractStats.expiring_7 > 0 ? '#dc2626' : '#64748b' }}>
                                        {contractStats.expiring_7}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-lbl">Brouillons</span>
                                    <span className="stat-val" style={{ color: '#64748b' }}>
                                        {contractStats.draft}
                                    </span>
                                </div>
                                {limitUsagePct !== null && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>
                                            Utilisation plafonds NN300 (moy.)
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700,
                                                      color: Number(limitUsagePct) > 80 ? '#dc2626' : '#059669' }}>
                                            {limitUsagePct}%
                                        </div>
                                        <ProgressBar
                                            pct={Number(limitUsagePct)}
                                            color={Number(limitUsagePct) > 80 ? '#dc2626' : '#059669'}/>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom row : Commissions + Escalades + Top courtiers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 220px 1fr', gap: 14 }}>

                        {/* Commissions */}
                        <div className="kpi-panel">
                            <div className="kpi-panel-hdr">
                                <div className="kpi-panel-hdr-title">
                                    <Percent size={14} color="#7c3aed"/>
                                    Commissions
                                </div>
                                <Link href={route('admin.commissions.bordereau')}
                                      style={{ fontSize: 10, color: '#1d4ed8', textDecoration: 'none' }}>
                                    Bordereau →
                                </Link>
                            </div>
                            <div className="kpi-panel-body">
                                <div className="stat-row">
                                    <span className="stat-lbl">Payées ce mois</span>
                                    <span className="stat-val" style={{ color: '#15803d', fontFamily: 'monospace' }}>
                                        {fmtAmt(commStats.paid_month)}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-lbl">En attente (mois)</span>
                                    <span className="stat-val"
                                          style={{ color: commStats.pending_amount > 0 ? '#f59e0b' : '#64748b',
                                                   fontFamily: 'monospace' }}>
                                        {fmtAmt(commStats.pending_amount)}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-lbl">Dossiers en attente</span>
                                    <span className="stat-val">
                                        {commStats.pending_count}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Escalades NN300 */}
                        <div className="kpi-panel">
                            <div className="kpi-panel-hdr">
                                <div className="kpi-panel-hdr-title">
                                    <TrendingUp size={14} color="#f59e0b"/>
                                    Escalades NN300
                                </div>
                                <Link href={route('admin.approvals.index')}
                                      style={{ fontSize: 10, color: '#1d4ed8', textDecoration: 'none' }}>
                                    Voir →
                                </Link>
                            </div>
                            <div className="kpi-panel-body">
                                <div className="stat-row">
                                    <span className="stat-lbl">En cours</span>
                                    <span className="stat-val"
                                          style={{ color: escaladeStats.pending > 0 ? '#dc2626' : '#64748b' }}>
                                        {escaladeStats.pending}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-lbl">Approuvées (mois)</span>
                                    <span className="stat-val" style={{ color: '#15803d' }}>
                                        {escaladeStats.approved}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-lbl">Rejetées (mois)</span>
                                    <span className="stat-val" style={{ color: '#dc2626' }}>
                                        {escaladeStats.rejected}
                                    </span>
                                </div>
                                {approvalRate !== null && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>
                                            Taux d'approbation
                                        </div>
                                        <div style={{ fontSize: 18, fontWeight: 700,
                                                      color: approvalRate >= 80 ? '#15803d' : '#f59e0b' }}>
                                            {approvalRate}%
                                        </div>
                                        <ProgressBar
                                            pct={approvalRate}
                                            color={approvalRate >= 80 ? '#15803d' : '#f59e0b'}/>
                                    </div>
                                )}
                                {approvalRate === null && (
                                    <div style={{ marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
                                        Aucune décision ce mois
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Courtiers */}
                        <div className="kpi-panel">
                            <div className="kpi-panel-hdr">
                                <div className="kpi-panel-hdr-title">
                                    <Users size={14} color="#1d4ed8"/>
                                    Top courtiers ce mois
                                </div>
                                <Link href={route('admin.brokers.index')}
                                      style={{ fontSize: 10, color: '#1d4ed8', textDecoration: 'none' }}>
                                    Tous →
                                </Link>
                            </div>
                            <div className="kpi-panel-body" style={{ padding: '8px 16px' }}>
                                {topBrokers.length === 0 ? (
                                    <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '14px 0' }}>
                                        Aucune émission ce mois
                                    </div>
                                ) : topBrokers.map((b, i) => (
                                    <div key={b.broker_name} className="broker-row">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 24, height: 24, borderRadius: 6,
                                                          background: i === 0 ? '#fef3c7' : '#f8fafc',
                                                          border: `1px solid ${i === 0 ? '#fde68a' : '#e2e8f0'}`,
                                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                          fontSize: 11, fontWeight: 700,
                                                          color: i === 0 ? '#d97706' : '#94a3b8', flexShrink: 0 }}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="broker-name"
                                                     style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {b.broker_name}
                                                </div>
                                                <div className="broker-sub">
                                                    Valeur : {fmtAmt(b.total_value)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="broker-cnt">
                                            {b.count}
                                            <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 400 }}>cert.</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* ── Accès rapide ─────────────────────────── */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                                  padding: '10px 16px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', alignSelf: 'center' }}>
                            Accès rapide :
                        </span>
                        {[
                            { href: route('admin.certificates.index'), icon: Award, label: 'Certificats' },
                            { href: route('admin.contracts.index'),    icon: FileText, label: 'Contrats' },
                            { href: route('admin.commissions.bordereau'), icon: Percent, label: 'Bordereau' },
                            { href: route('admin.approvals.index'),    icon: TrendingUp, label: 'Escalades' },
                            { href: route('admin.dashboard.pending'),  icon: Clock, label: 'File de validation' },
                        ].map(item => (
                            <Link key={item.label} href={item.href}
                                  style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none',
                                           display: 'flex', alignItems: 'center', gap: 4 }}>
                                <item.icon size={11}/> {item.label}
                            </Link>
                        ))}
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
