import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Clock, CheckCircle, XCircle, Award,
    FileText, ChevronLeft, ChevronRight,
    AlertTriangle, TrendingUp, Calendar,
    User, Ship, Plane, Truck, X,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('admin.dashboard') },
    { title: 'En attente de validation' },
];

interface Certificate {
    id: string; certificate_number: string; status: string;
    insured_name: string; voyage_date: string;
    voyage_from: string; voyage_to: string;
    transport_type: string | null; insured_value: string; currency_code: string;
    submitted_at: string | null;
    contract: { contract_number: string; insured_name: string } | null;
    tenant:   { name: string; code: string } | null;
    template: { name: string; type: string } | null;
    submitted_by: { first_name: string; last_name: string } | null;
}
interface RecentCertificate {
    id: string; certificate_number: string;
    insured_name: string; insured_value: string; currency_code: string;
    issued_at: string | null;
    contract: { contract_number: string } | null;
    issued_by: { first_name: string; last_name: string } | null;
}
interface ExpiringContract {
    id: string; contract_number: string; insured_name: string; expiry_date: string;
    tenant: { name: string; code: string } | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    pending:             Paginated<Certificate>;
    stats:               { submitted: number; issued_today: number; issued_week: number; issued_month: number; draft: number; cancelled_month: number; };
    avgProcessingHours:  number | null;
    recentIssued:        RecentCertificate[];
    expiringContracts:   ExpiringContract[];
    filters:             { tenant_id?: string };
    isSA:                boolean;
    can:                 { validate: boolean };
}

const TRANSPORT_ICONS: Record<string, any> = {
    SEA: Ship, AIR: Plane, ROAD: Truck, RAIL: Truck,
};

const fmt    = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
const fmtDt  = (d: string) => new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

function waitingTime(submittedAt: string | null): { label: string; color: string } {
    if (!submittedAt) return { label: '—', color: '#94a3b8' };
    const hours = (Date.now() - new Date(submittedAt).getTime()) / 36e5;
    if (hours < 2)  return { label: `${Math.round(hours * 60)}min`, color: '#15803d' };
    if (hours < 24) return { label: `${Math.round(hours)}h`,        color: '#92400e' };
    return { label: `${Math.round(hours / 24)}j`,                   color: '#dc2626' };
}

export default function PendingDashboard({
    pending, stats, avgProcessingHours, recentIssued, expiringContracts, filters, isSA, can,
}: Props) {

    const applyFilter = (params: Record<string, string>) =>
        router.get(route('admin.dashboard.pending'), { ...filters, ...params }, { preserveState:true, replace:true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="En attente de validation — NSIA Transport"/>
            <style>{`
                .pd-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .pd-title{font-size:18px;font-weight:600;color:#1e293b;}
                .pd-sub{font-size:12px;color:#94a3b8;margin-top:2px;}

                /* KPIs */
                .kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;}
                .kpi-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;text-align:center;}
                .kpi-card.urgent{border-color:#fecaca;background:#fef2f2;}
                .kpi-val{font-size:22px;font-weight:600;color:#1e293b;line-height:1;}
                .kpi-lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:4px;}

                /* Layout 2 colonnes */
                .pd-layout{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start;}

                /* Table en attente */
                .pd-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                .pd-card-hdr{padding:13px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;}
                .pd-card-ttl{font-size:13px;font-weight:600;color:#1e293b;display:flex;align-items:center;gap:7px;}
                .pd-card-body{padding:0;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:9px 14px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.07em;text-align:left;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
                td{padding:11px 14px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .cert-num{font-family:monospace;font-size:12px;font-weight:700;color:#1e293b;}
                .wait-badge{display:inline-block;padding:2px 7px;border-radius:8px;font-size:11px;font-weight:600;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;text-decoration:none;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-issue{color:#15803d;border-color:#bbf7d0;} .btn-issue:hover{background:#f0fdf4;}
                .pd-empty{padding:40px;text-align:center;color:#94a3b8;font-size:13px;}
                .pd-pagination{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-top:1px solid #f8fafc;}
                .pd-pg-info{font-size:11px;color:#94a3b8;}
                .pd-pg-links{display:flex;gap:4px;}
                .pg-btn{width:28px;height:28px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}

                /* Colonne droite */
                .side-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:12px;}
                .side-hdr{padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#1e293b;display:flex;align-items:center;gap:6px;}
                .side-body{padding:12px 16px;}
                .recent-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f8fafc;}
                .recent-row:last-child{border-bottom:none;}
                .recent-num{font-family:monospace;font-size:11px;font-weight:700;color:#1e293b;}
                .recent-name{font-size:11px;color:#64748b;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
                .recent-val{font-size:11px;font-family:monospace;color:#15803d;text-align:right;}
                .expiry-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f8fafc;}
                .expiry-row:last-child{border-bottom:none;}
                .expiry-num{font-size:11px;font-weight:500;color:#1e293b;}
                .expiry-date{font-size:11px;color:#dc2626;font-weight:600;}
                .days-left{font-size:10px;color:#dc2626;background:#fef2f2;padding:1px 5px;border-radius:6px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="pd-page">

                    {/* Header */}
                    <div>
                        <h1 className="pd-title">Dashboard validation</h1>
                        <p className="pd-sub">Certificats en attente d'émission</p>
                    </div>

                    {/* KPIs */}
                    <div className="kpi-grid">
                        <div className={`kpi-card ${stats.submitted > 0 ? 'urgent' : ''}`}>
                            <div className="kpi-val" style={{ color: stats.submitted > 0 ? '#dc2626' : '#1e293b' }}>
                                {stats.submitted}
                            </div>
                            <div className="kpi-lbl">En attente</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val" style={{ color:'#15803d' }}>{stats.issued_today}</div>
                            <div className="kpi-lbl">Émis aujourd'hui</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val" style={{ color:'#1d4ed8' }}>{stats.issued_week}</div>
                            <div className="kpi-lbl">Émis cette semaine</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val">{stats.issued_month}</div>
                            <div className="kpi-lbl">Émis ce mois</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val" style={{ color:'#64748b' }}>{stats.draft}</div>
                            <div className="kpi-lbl">Brouillons</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val">
                                {avgProcessingHours !== null ? `${avgProcessingHours}h` : '—'}
                            </div>
                            <div className="kpi-lbl">Délai moyen</div>
                        </div>
                    </div>

                    {/* Layout 2 colonnes */}
                    <div className="pd-layout">

                        {/* Colonne gauche — Table en attente */}
                        <div className="pd-card">
                            <div className="pd-card-hdr">
                                <div className="pd-card-ttl">
                                    <Clock size={15} color="#f59e0b"/>
                                    Certificats en attente
                                    {stats.submitted > 0 && (
                                        <span style={{ background:'#fef2f2', color:'#dc2626', borderRadius:10, fontSize:11, padding:'1px 7px', fontWeight:600 }}>
                                            {stats.submitted}
                                        </span>
                                    )}
                                </div>
                                <Link href={route('admin.certificates.index') + '?status=SUBMITTED'}
                                      style={{ fontSize:11, color:'#1d4ed8', textDecoration:'none' }}>
                                    Voir tous →
                                </Link>
                            </div>

                            {pending.data.length === 0 ? (
                                <div className="pd-empty">
                                    <CheckCircle size={32} color="#bbf7d0" style={{ marginBottom:8 }}/>
                                    <div style={{ fontWeight:500, color:'#15803d' }}>Aucun certificat en attente</div>
                                    <div style={{ fontSize:11, marginTop:4 }}>Tous les certificats ont été traités.</div>
                                </div>
                            ) : (
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>N° Certificat</th>
                                                <th>Assuré</th>
                                                <th>Voyage</th>
                                                <th>Valeur</th>
                                                <th>Soumis par</th>
                                                <th>Attente</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pending.data.map(cert => {
                                                const wait = waitingTime(cert.submitted_at);
                                                const TransIcon = TRANSPORT_ICONS[cert.transport_type ?? ''] ?? Award;
                                                return (
                                                    <tr key={cert.id}>
                                                        <td>
                                                            <div className="cert-num">{cert.certificate_number}</div>
                                                            <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                                {cert.contract?.contract_number}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight:500, color:'#1e293b', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                                {cert.insured_name}
                                                            </div>
                                                            {isSA && cert.tenant && (
                                                                <div style={{ fontSize:10, color:'#94a3b8' }}>{cert.tenant.code}</div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize:11, color:'#475569', display:'flex', alignItems:'center', gap:4 }}>
                                                                <TransIcon size={10}/>
                                                                {cert.voyage_from}
                                                            </div>
                                                            <div style={{ fontSize:10, color:'#94a3b8' }}>→ {cert.voyage_to}</div>
                                                            <div style={{ fontSize:10, color:'#94a3b8', display:'flex', alignItems:'center', gap:3 }}>
                                                                <Calendar size={9}/>{fmt(cert.voyage_date)}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontFamily:'monospace', fontSize:11, fontWeight:500 }}>
                                                                {parseFloat(cert.insured_value).toLocaleString('fr-FR')}
                                                            </div>
                                                            <div style={{ fontSize:10, color:'#94a3b8' }}>{cert.currency_code}</div>
                                                        </td>
                                                        <td>
                                                            {cert.submitted_by && (
                                                                <div style={{ fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:4 }}>
                                                                    <User size={10}/>
                                                                    {cert.submitted_by.first_name} {cert.submitted_by.last_name.charAt(0)}.
                                                                </div>
                                                            )}
                                                            {cert.submitted_at && (
                                                                <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                                    {fmtDt(cert.submitted_at)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="wait-badge"
                                                                  style={{ background: `${wait.color}18`, color: wait.color }}>
                                                                {wait.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display:'flex', gap:5 }}>
                                                                <Link href={route('admin.certificates.show', { certificate: cert.id })}
                                                                      className="btn-act btn-view">
                                                                    Traiter →
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {pending.last_page > 1 && (
                                        <div className="pd-pagination">
                                            <span className="pd-pg-info">
                                                Page {pending.current_page}/{pending.last_page} · {pending.total} en attente
                                            </span>
                                            <div className="pd-pg-links">
                                                <button className="pg-btn" disabled={pending.current_page === 1}
                                                        onClick={() => applyFilter({ page: String(pending.current_page - 1) })}>
                                                    <ChevronLeft size={13}/>
                                                </button>
                                                {pending.links.map((link, i) => {
                                                    if (i === 0 || i === pending.links.length - 1) return null;
                                                    return (
                                                        <button key={`p-${i}`}
                                                                className={`pg-btn ${link.active ? 'act' : ''}`}
                                                                onClick={() => link.url && applyFilter({ page: link.label })}
                                                                disabled={!link.url}
                                                                dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                    );
                                                })}
                                                <button className="pg-btn" disabled={pending.current_page === pending.last_page}
                                                        onClick={() => applyFilter({ page: String(pending.current_page + 1) })}>
                                                    <ChevronRight size={13}/>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Colonne droite */}
                        <div>
                            {/* Émissions récentes */}
                            <div className="side-card">
                                <div className="side-hdr">
                                    <CheckCircle size={14} color="#15803d"/>
                                    Émissions récentes
                                </div>
                                <div className="side-body">
                                    {recentIssued.length === 0 ? (
                                        <div style={{ fontSize:12, color:'#94a3b8', textAlign:'center', padding:'12px 0' }}>
                                            Aucune émission récente
                                        </div>
                                    ) : recentIssued.map(c => (
                                        <div key={c.id} className="recent-row">
                                            <div>
                                                <Link href={route('admin.certificates.show', { certificate: c.id })}
                                                      style={{ textDecoration:'none' }}>
                                                    <div className="recent-num">{c.certificate_number}</div>
                                                </Link>
                                                <div className="recent-name">{c.insured_name}</div>
                                                {c.issued_by && (
                                                    <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                        par {c.issued_by.first_name} {c.issued_by.last_name.charAt(0)}.
                                                    </div>
                                                )}
                                            </div>
                                            <div className="recent-val">
                                                {parseFloat(c.insured_value).toLocaleString('fr-FR')}
                                                <div style={{ fontSize:10, color:'#94a3b8' }}>{c.currency_code}</div>
                                                {c.issued_at && (
                                                    <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                        {fmtDt(c.issued_at)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contrats proches expiration */}
                            {expiringContracts.length > 0 && (
                                <div className="side-card">
                                    <div className="side-hdr">
                                        <AlertTriangle size={14} color="#f59e0b"/>
                                        Contrats expirant bientôt
                                    </div>
                                    <div className="side-body">
                                        {expiringContracts.map(c => {
                                            const daysLeft = Math.ceil(
                                                (new Date(c.expiry_date).getTime() - Date.now()) / 864e5
                                            );
                                            return (
                                                <div key={c.id} className="expiry-row">
                                                    <div>
                                                        <div className="expiry-num">{c.contract_number}</div>
                                                        <div style={{ fontSize:10, color:'#64748b', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                            {c.insured_name}
                                                        </div>
                                                        {isSA && c.tenant && (
                                                            <div style={{ fontSize:10, color:'#94a3b8' }}>{c.tenant.code}</div>
                                                        )}
                                                    </div>
                                                    <div style={{ textAlign:'right' }}>
                                                        <div className="expiry-date">{fmt(c.expiry_date)}</div>
                                                        <span className="days-left">J-{daysLeft}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Lien accès rapide */}
                            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'12px 14px' }}>
                                <div style={{ fontSize:12, fontWeight:600, color:'#1d4ed8', marginBottom:8 }}>
                                    Accès rapide
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                    <Link href={route('admin.certificates.create')}
                                          style={{ fontSize:12, color:'#1d4ed8', textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                                        <Award size={12}/> Nouveau certificat
                                    </Link>
                                    <Link href={route('admin.certificates.index')}
                                          style={{ fontSize:12, color:'#1d4ed8', textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                                        <FileText size={12}/> Tous les certificats
                                    </Link>
                                    <Link href={route('admin.contracts.index')}
                                          style={{ fontSize:12, color:'#1d4ed8', textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                                        <TrendingUp size={12}/> Contrats actifs
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}