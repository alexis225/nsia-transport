import { useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Award, AlertTriangle, CheckCircle, Clock,
    FileText, Download, Search, Filter,
    Ship, Plane, Truck, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

// ── Breadcrumbs ──────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('admin.dashboard') },
    { title: 'Rapports' },
    { title: 'État des certificats par période' },
];

// ── Types ────────────────────────────────────────────────────
interface CertRow {
    id: string; certificate_number: string; status: string;
    insured_name: string; insured_value: string; currency_code: string;
    prime_total: string | null; transport_type: string | null;
    voyage_from: string; voyage_to: string; voyage_date: string;
    issued_at: string | null; created_at: string;
    tenant:   { name: string; code: string } | null;
    contract: { contract_number: string; broker: { name: string } | null } | null;
    issued_by: { first_name: string; last_name: string } | null;
}
interface BreakdownRow  { transport_type: string; count: number; total_value: string; total_prime: string }
interface StatusRow     { status: string; count: number; total_value: string }
interface Paginated<T>  {
    data: T[]; total: number; current_page: number; last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    certificates: Paginated<CertRow>;
    stats: {
        total: number; issued: number; submitted: number; draft: number; cancelled: number;
        total_insured: number; total_prime: number; issued_insured: number; issued_prime: number;
    };
    byTransport: BreakdownRow[];
    byStatus:    StatusRow[];
    brokers:     { id: string; name: string }[];
    tenants:     { id: string; name: string; code: string }[];
    filters: {
        date_from: string; date_to: string; date_field: string;
        status: string; transport: string | null; broker_id: string | null;
        tenant_id: string | null; search: string | null;
    };
    isSA: boolean;
}

// ── Constants ────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    ISSUED:    { label: 'Émis',       color: '#15803d', bg: '#f0fdf4' },
    SUBMITTED: { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
    DRAFT:     { label: 'Brouillon',  color: '#64748b', bg: '#f8fafc' },
    CANCELLED: { label: 'Annulé',     color: '#dc2626', bg: '#fef2f2' },
};

const TRANSPORT_META: Record<string, { label: string; icon: any; color: string }> = {
    SEA:        { label: 'Maritime',    icon: Ship,  color: '#0284c7' },
    AIR:        { label: 'Aérien',      icon: Plane, color: '#7c3aed' },
    ROAD:       { label: 'Routier',     icon: Truck, color: '#059669' },
    RAIL:       { label: 'Ferroviaire', icon: Truck, color: '#d97706' },
    MULTIMODAL: { label: 'Multimodal',  icon: Truck, color: '#0891b2' },
    AUTRE:      { label: 'Autre',       icon: Award, color: '#94a3b8' },
};

const DATE_FIELD_LABELS: Record<string, string> = {
    created_at:   'Date de création',
    issued_at:    "Date d'émission",
    voyage_date:  'Date de voyage',
};

// ── Helpers ──────────────────────────────────────────────────
const fmt    = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtAmt = (v: string | number) =>
    parseFloat(String(v)).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ── Sub-components ───────────────────────────────────────────
function StatCard({ label, value, sub, color, bg, border, icon: Icon }: {
    label: string; value: string | number; sub?: string;
    color: string; bg?: string; border?: string; icon?: any;
}) {
    return (
        <div style={{ background: bg ?? '#fff', border: `1.5px solid ${border ?? '#e2e8f0'}`,
                      borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {Icon && (
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={color}/>
                </div>
            )}
            <div>
                <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
                {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
            </div>
        </div>
    );
}

function TransportBar({ rows, total }: { rows: BreakdownRow[]; total: number }) {
    if (rows.length === 0) return (
        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '14px 0' }}>
            Aucune donnée
        </div>
    );
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {rows.map(r => {
                const meta = TRANSPORT_META[r.transport_type] ?? TRANSPORT_META.AUTRE;
                const Icon = meta.icon;
                const pct  = total > 0 ? Math.round((r.count / total) * 100) : 0;
                return (
                    <div key={r.transport_type}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
                                <Icon size={11} color={meta.color}/> {meta.label}
                            </div>
                            <div style={{ fontSize: 11, color: '#1e293b' }}>
                                <strong>{r.count}</strong>
                                <span style={{ color: '#94a3b8', marginLeft: 4 }}>({pct}%)</span>
                            </div>
                        </div>
                        <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 3 }}/>
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                            Valeur : {fmtAmt(r.total_value)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────
export default function CertificatesReport({
    certificates, stats, byTransport, byStatus, brokers, tenants, filters, isSA,
}: Props) {
    const [local, setLocal] = useState({ ...filters });
    const [showAdv, setShowAdv] = useState(
        !!(filters.broker_id || filters.tenant_id || filters.transport || filters.search)
    );

    const apply = () => {
        const params: Record<string, string> = {
            date_from:  local.date_from,
            date_to:    local.date_to,
            date_field: local.date_field,
            status:     local.status,
        };
        if (local.transport)  params.transport  = local.transport;
        if (local.broker_id)  params.broker_id  = local.broker_id;
        if (local.tenant_id)  params.tenant_id  = local.tenant_id;
        if (local.search)     params.search      = local.search;
        router.get(route('admin.reports.certificates'), params, { preserveState: false });
    };

    const reset = () => {
        router.get(route('admin.reports.certificates'), {}, { preserveState: false });
    };

    const paginateTo = (url: string | null) => url && router.visit(url, { preserveState: true });

    const exportUrl = () => {
        const p = new URLSearchParams();
        if (local.date_from)  p.set('date_from',  local.date_from);
        if (local.date_to)    p.set('date_to',    local.date_to);
        if (local.status !== 'ALL') p.set('status', local.status);
        if (local.transport)  p.set('transport_type', local.transport);
        if (local.broker_id)  p.set('broker_id',  local.broker_id);
        if (local.tenant_id)  p.set('tenant_id',  local.tenant_id);
        if (local.search)     p.set('search',      local.search);
        return route('admin.certificates.export') + '?' + p.toString();
    };

    const hasActiveFilters = filters.transport || filters.broker_id || filters.tenant_id || filters.search
        || filters.status !== 'ALL';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="État des certificats par période — NSIA Transport"/>
            <style>{`
                .rpt-page  { padding: 4px; display: flex; flex-direction: column; gap: 14px; }
                .rpt-panel { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
                .rpt-panel-hdr {
                    padding: 11px 16px; border-bottom: 1px solid #f1f5f9;
                    font-size: 12px; font-weight: 600; color: #1e293b;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .rpt-panel-hdr-title { display: flex; align-items: center; gap: 6px; }
                .rpt-panel-body  { padding: 14px 16px; }
                .filter-bar  { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
                .filter-row  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .fin { height: 32px; border: 1.5px solid #e2e8f0; border-radius: 7px; padding: 0 10px; font-size: 12px; font-family: inherit; color: #1e293b; background: #fff; outline: none; }
                .fin:focus { border-color: #1d4ed8; }
                .fin-date { width: 132px; }
                .fin-sel  { min-width: 140px; cursor: pointer; }
                .fin-search { flex: 1; min-width: 180px; }
                .btn { height: 32px; padding: 0 14px; border-radius: 7px; border: none; cursor: pointer; font-size: 12px; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; transition: all .12s; }
                .btn-primary   { background: #1d4ed8; color: #fff; } .btn-primary:hover   { background: #1e3a8a; }
                .btn-secondary { background: #f8fafc; color: #475569; border: 1.5px solid #e2e8f0; } .btn-secondary:hover { background: #f1f5f9; }
                .btn-export    { background: #f0fdf4; color: #15803d; border: 1.5px solid #bbf7d0; } .btn-export:hover { background: #dcfce7; }
                .btn-danger    { background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; } .btn-danger:hover { background: #fee2e2; }
                .stats-grid    { display: grid; grid-template-columns: repeat(5, 1fr) repeat(2, 1fr); gap: 10px; }
                .main-layout   { display: grid; grid-template-columns: 1fr 230px; gap: 14px; align-items: start; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 8px; font-size: 10px; font-weight: 600; white-space: nowrap; }
                table  { width: 100%; border-collapse: collapse; }
                thead  { background: #f8fafc; }
                th     { padding: 8px 13px; font-size: 9.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .07em; text-align: left; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
                td     { padding: 10px 13px; font-size: 12px; color: #334155; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: #fafafa; }
                .cert-num  { font-family: monospace; font-size: 12px; font-weight: 700; color: #1e293b; }
                .pg-row    { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-top: 1px solid #f8fafc; }
                .pg-info   { font-size: 11px; color: '#94a3b8'; }
                .pg-links  { display: flex; gap: 4px; }
                .pg-btn    { width: 28px; height: 28px; border-radius: 6px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; color: #475569; }
                .pg-btn:hover:not(:disabled) { border-color: #1e3a8a; color: #1e3a8a; }
                .pg-btn.act { background: #1e3a8a; border-color: #1e3a8a; color: #fff; }
                .pg-btn:disabled { opacity: .4; cursor: not-allowed; }
                .adv-section { border-top: 1px solid #f1f5f9; padding-top: 10px; }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="rpt-page">

                    {/* ── Header ──────────────────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                                État des certificats par période
                            </h1>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                                Filtre : {DATE_FIELD_LABELS[filters.date_field]} · {fmt(filters.date_from)} → {fmt(filters.date_to)}
                            </p>
                        </div>
                        <a href={exportUrl()}
                           style={{ fontSize: 12, color: '#15803d', textDecoration: 'none',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: '#f0fdf4', padding: '6px 12px', borderRadius: 8,
                                    border: '1px solid #bbf7d0' }}>
                            <Download size={13}/> Exporter CSV
                        </a>
                    </div>

                    {/* ── Filtres ──────────────────────────────── */}
                    <div className="filter-bar">
                        <div className="filter-row">
                            <select className="fin fin-sel"
                                    value={local.date_field}
                                    onChange={e => setLocal(p => ({ ...p, date_field: e.target.value }))}>
                                <option value="created_at">Date de création</option>
                                <option value="issued_at">Date d'émission</option>
                                <option value="voyage_date">Date de voyage</option>
                            </select>
                            <input type="date" className="fin fin-date"
                                   value={local.date_from}
                                   onChange={e => setLocal(p => ({ ...p, date_from: e.target.value }))}/>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>→</span>
                            <input type="date" className="fin fin-date"
                                   value={local.date_to}
                                   onChange={e => setLocal(p => ({ ...p, date_to: e.target.value }))}/>
                            <select className="fin fin-sel"
                                    value={local.status}
                                    onChange={e => setLocal(p => ({ ...p, status: e.target.value }))}>
                                <option value="ALL">Tous les statuts</option>
                                <option value="ISSUED">Émis</option>
                                <option value="SUBMITTED">En attente</option>
                                <option value="DRAFT">Brouillon</option>
                                <option value="CANCELLED">Annulé</option>
                            </select>
                            <button className="btn btn-secondary" onClick={() => setShowAdv(v => !v)}>
                                <Filter size={12}/> Filtres {showAdv ? '▲' : '▼'}
                            </button>
                            <button className="btn btn-primary" onClick={apply}>
                                <Search size={12}/> Appliquer
                            </button>
                            {hasActiveFilters && (
                                <button className="btn btn-danger" onClick={reset} title="Réinitialiser">
                                    <X size={12}/>
                                </button>
                            )}
                        </div>

                        {showAdv && (
                            <div className="adv-section">
                                <div className="filter-row">
                                    <input className="fin fin-search" placeholder="Rechercher N°, assuré…"
                                           value={local.search ?? ''}
                                           onChange={e => setLocal(p => ({ ...p, search: e.target.value }))}/>
                                    <select className="fin fin-sel"
                                            value={local.transport ?? ''}
                                            onChange={e => setLocal(p => ({ ...p, transport: e.target.value || null }))}>
                                        <option value="">Tous modes transport</option>
                                        <option value="SEA">Maritime</option>
                                        <option value="AIR">Aérien</option>
                                        <option value="ROAD">Routier</option>
                                        <option value="RAIL">Ferroviaire</option>
                                        <option value="MULTIMODAL">Multimodal</option>
                                    </select>
                                    {brokers.length > 0 && (
                                        <select className="fin fin-sel"
                                                value={local.broker_id ?? ''}
                                                onChange={e => setLocal(p => ({ ...p, broker_id: e.target.value || null }))}>
                                            <option value="">Tous les courtiers</option>
                                            {brokers.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    {isSA && tenants.length > 0 && (
                                        <select className="fin fin-sel"
                                                value={local.tenant_id ?? ''}
                                                onChange={e => setLocal(p => ({ ...p, tenant_id: e.target.value || null }))}>
                                            <option value="">Toutes les filiales</option>
                                            {tenants.map(t => (
                                                <option key={t.id} value={t.id}>[{t.code}] {t.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Statistiques ─────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr) repeat(2,1fr)', gap: 10 }}>
                        <StatCard label="Total période" value={stats.total}
                                  color="#1e293b" icon={FileText}/>
                        <StatCard label="Émis"    value={stats.issued}
                                  color="#15803d" bg="#f0fdf4" border="#bbf7d0" icon={CheckCircle}/>
                        <StatCard label="En attente" value={stats.submitted}
                                  color={stats.submitted > 0 ? '#d97706' : '#64748b'}
                                  bg={stats.submitted > 0 ? '#fef3c7' : '#fff'}
                                  border={stats.submitted > 0 ? '#fde68a' : '#e2e8f0'} icon={Clock}/>
                        <StatCard label="Brouillons"  value={stats.draft}   color="#64748b" icon={FileText}/>
                        <StatCard label="Annulés"     value={stats.cancelled}
                                  color={stats.cancelled > 0 ? '#dc2626' : '#64748b'}
                                  icon={AlertTriangle}/>
                        <StatCard label="Valeur totale assurée"
                                  value={fmtAmt(stats.total_insured)}
                                  sub={`Émis : ${fmtAmt(stats.issued_insured)}`}
                                  color="#1d4ed8" icon={Award}/>
                        <StatCard label="Prime totale"
                                  value={fmtAmt(stats.total_prime)}
                                  sub={`Émis : ${fmtAmt(stats.issued_prime)}`}
                                  color="#7c3aed" icon={Award}/>
                    </div>

                    {/* ── Tableau + Ventilation ────────────────── */}
                    <div className="main-layout">

                        {/* Tableau détaillé */}
                        <div className="rpt-panel">
                            <div className="rpt-panel-hdr">
                                <div className="rpt-panel-hdr-title">
                                    <Award size={14} color="#1d4ed8"/>
                                    Certificats ({certificates.total})
                                </div>
                                <Link href={route('admin.certificates.index')}
                                      style={{ fontSize: 10, color: '#1d4ed8', textDecoration: 'none' }}>
                                    Gestion →
                                </Link>
                            </div>

                            {certificates.data.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                                    <FileText size={28} style={{ marginBottom: 8, opacity: .4 }}/>
                                    <div>Aucun certificat pour cette période</div>
                                </div>
                            ) : (
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>N° Certificat</th>
                                                <th>Assuré</th>
                                                <th>Courtier / Contrat</th>
                                                <th>Voyage</th>
                                                <th>Mode</th>
                                                <th>Valeur assurée</th>
                                                <th>Prime</th>
                                                {isSA && <th>Filiale</th>}
                                                <th>Statut</th>
                                                <th>Date émission</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {certificates.data.map(cert => {
                                                const s    = STATUS_META[cert.status] ?? { label: cert.status, color: '#64748b', bg: '#f8fafc' };
                                                const trMeta = TRANSPORT_META[cert.transport_type ?? 'AUTRE'] ?? TRANSPORT_META.AUTRE;
                                                const TIcon  = trMeta.icon;
                                                return (
                                                    <tr key={cert.id}>
                                                        <td>
                                                            <Link href={route('admin.certificates.show', { certificate: cert.id })}
                                                                  style={{ textDecoration: 'none' }}>
                                                                <div className="cert-num">{cert.certificate_number}</div>
                                                            </Link>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 500, color: '#1e293b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {cert.insured_name}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: 11, color: '#475569', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {cert.contract?.broker?.name ?? '—'}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                                                                {cert.contract?.contract_number}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                                <TIcon size={10} color={trMeta.color}/>
                                                                {cert.voyage_from}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#94a3b8' }}>→ {cert.voyage_to}</div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontSize: 10, color: trMeta.color, background: `${trMeta.color}14`, padding: '1px 6px', borderRadius: 6, fontWeight: 600 }}>
                                                                {trMeta.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 500 }}>
                                                                {parseFloat(cert.insured_value).toLocaleString('fr-FR')}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{cert.currency_code}</div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                                                {cert.prime_total ? parseFloat(cert.prime_total).toLocaleString('fr-FR') : '—'}
                                                            </div>
                                                        </td>
                                                        {isSA && (
                                                            <td>
                                                                <span style={{ fontSize: 10, color: '#64748b' }}>
                                                                    {cert.tenant?.code ?? '—'}
                                                                </span>
                                                            </td>
                                                        )}
                                                        <td>
                                                            <span className="badge" style={{ color: s.color, background: s.bg }}>
                                                                {s.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                                                                {cert.issued_at ? fmt(cert.issued_at) : '—'}
                                                            </div>
                                                            {cert.issued_by && (
                                                                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                                                                    {cert.issued_by.first_name} {cert.issued_by.last_name.charAt(0)}.
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Pagination */}
                                    {certificates.last_page > 1 && (
                                        <div className="pg-row">
                                            <span className="pg-info">
                                                {certificates.total} résultat(s) · Page {certificates.current_page}/{certificates.last_page}
                                            </span>
                                            <div className="pg-links">
                                                <button className="pg-btn" disabled={certificates.current_page === 1}
                                                        onClick={() => paginateTo(certificates.links[0]?.url ?? null)}>
                                                    <ChevronLeft size={13}/>
                                                </button>
                                                {certificates.links.slice(1, -1).map((link, i) => (
                                                    <button key={i}
                                                            className={`pg-btn ${link.active ? 'act' : ''}`}
                                                            onClick={() => paginateTo(link.url)}
                                                            disabled={!link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                ))}
                                                <button className="pg-btn" disabled={certificates.current_page === certificates.last_page}
                                                        onClick={() => paginateTo(certificates.links[certificates.links.length - 1]?.url ?? null)}>
                                                    <ChevronRight size={13}/>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Colonne droite — Ventilations */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                            {/* Par mode de transport */}
                            <div className="rpt-panel">
                                <div className="rpt-panel-hdr">
                                    <div className="rpt-panel-hdr-title">
                                        <Ship size={13} color="#0284c7"/> Par mode de transport
                                    </div>
                                </div>
                                <div className="rpt-panel-body">
                                    <TransportBar rows={byTransport} total={stats.total}/>
                                </div>
                            </div>

                            {/* Par statut */}
                            <div className="rpt-panel">
                                <div className="rpt-panel-hdr">
                                    <div className="rpt-panel-hdr-title">
                                        <CheckCircle size={13} color="#15803d"/> Par statut
                                    </div>
                                </div>
                                <div className="rpt-panel-body">
                                    {byStatus.length === 0 ? (
                                        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>
                                            Aucune donnée
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                            {byStatus.map(r => {
                                                const s   = STATUS_META[r.status] ?? { label: r.status, color: '#64748b', bg: '#f8fafc' };
                                                const pct = stats.total > 0 ? Math.round((r.count / stats.total) * 100) : 0;
                                                return (
                                                    <div key={r.status}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                            <span className="badge" style={{ color: s.color, background: s.bg }}>
                                                                {s.label}
                                                            </span>
                                                            <span style={{ fontSize: 11, color: '#1e293b', fontWeight: 600 }}>
                                                                {r.count} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({pct}%)</span>
                                                            </span>
                                                        </div>
                                                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 2 }}/>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Récapitulatif valeurs */}
                            <div className="rpt-panel">
                                <div className="rpt-panel-hdr">
                                    <div className="rpt-panel-hdr-title">
                                        <Award size={13} color="#7c3aed"/> Récapitulatif
                                    </div>
                                </div>
                                <div className="rpt-panel-body" style={{ fontSize: 12 }}>
                                    {[
                                        { label: 'Valeur totale assurée', val: fmtAmt(stats.total_insured) },
                                        { label: 'dont ISSUED',           val: fmtAmt(stats.issued_insured), sub: true },
                                        { label: 'Prime totale',          val: fmtAmt(stats.total_prime) },
                                        { label: 'dont ISSUED',           val: fmtAmt(stats.issued_prime), sub: true },
                                    ].map((row, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                                                              padding: '5px 0', borderBottom: '1px solid #f8fafc',
                                                              paddingLeft: row.sub ? 12 : 0 }}>
                                            <span style={{ color: row.sub ? '#94a3b8' : '#64748b', fontSize: row.sub ? 11 : 12 }}>
                                                {row.sub ? '└ ' : ''}{row.label}
                                            </span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e293b', fontSize: 12 }}>
                                                {row.val}
                                            </span>
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
