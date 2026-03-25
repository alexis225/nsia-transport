import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Eye, Trash2, X,
    ChevronLeft, ChevronRight, Award,
    Calendar, Ship, Plane, Truck,
    FileText,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Certificats', href: '/admin/certificates' },
];

interface Certificate {
    id: string; certificate_number: string; status: string;
    insured_name: string; voyage_date: string;
    voyage_from: string; voyage_to: string;
    transport_type: string | null; insured_value: string;
    currency_code: string; prime_total: string | null;
    issued_at: string | null; created_at: string;
    pdf_path: string | null;
    contract: { contract_number: string } | null;
    tenant: { name: string; code: string } | null;
    submitted_by: { first_name: string; last_name: string } | null;
    issued_by:    { first_name: string; last_name: string } | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    certificates: Paginated<Certificate>;
    filters: { search?: string; status?: string; contract_id?: string; date_from?: string; date_to?: string };
    isSA: boolean;
    can:  { create: boolean; validate: boolean; cancel: boolean };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    DRAFT:     { bg:'#f8fafc', color:'#64748b', label:'Brouillon',  dot:'#94a3b8' },
    SUBMITTED: { bg:'#fffbeb', color:'#92400e', label:'Soumis',     dot:'#f59e0b' },
    ISSUED:    { bg:'#f0fdf4', color:'#15803d', label:'Émis',       dot:'#22c55e' },
    CANCELLED: { bg:'#fef2f2', color:'#dc2626', label:'Annulé',     dot:'#ef4444' },
};

const TRANSPORT_ICONS: Record<string, any> = {
    SEA: Ship, AIR: Plane, ROAD: Truck, RAIL: Truck, MULTIMODAL: FileText,
};

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

export default function CertificatesIndex({ certificates, filters, isSA, can }: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/certificates', { ...filters, ...params }, { preserveState:true, replace:true });

    const handleDelete = (c: Certificate) => {
        if (confirm(`Supprimer le certificat « ${c.certificate_number} » ?`))
            router.delete(route('admin.certificates.destroy', { certificate: c.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Certificats — NSIA Transport"/>
            <style>{`
                .cv-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .cv-hdr{display:flex;align-items:center;justify-content:space-between;}
                .cv-title{font-size:18px;font-weight:600;color:#1e293b;}
                .cv-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .cv-toolbar{display:flex;gap:8px;flex-wrap:wrap;}
                .cv-search{display:flex;gap:0;flex:1;min-width:220px;}
                .cv-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .cv-search input:focus{border-color:#1e3a8a;}
                .cv-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .cv-select{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;}
                .cv-date{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;}
                .cv-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:12px 16px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .cert-num{font-family:monospace;font-size:12px;font-weight:700;color:#1e293b;}
                .status-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
                .route-cell{font-size:12px;color:#475569;}
                .value-cell{font-size:12px;font-family:monospace;font-weight:500;color:#1e293b;}
                .actions{display:flex;gap:5px;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;text-decoration:none;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-del{color:#dc2626;border-color:#fecaca;} .btn-del:hover{background:#fef2f2;}
                .cv-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .cv-pg-info{font-size:12px;color:#94a3b8;}
                .cv-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .cv-empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="cv-page">
                    <div className="cv-hdr">
                        <div>
                            <h1 className="cv-title">Certificats d'assurance</h1>
                            <p className="cv-sub">{certificates.total} certificat{certificates.total > 1 ? 's' : ''}</p>
                        </div>
                        {can.create && (
                            <Link href={route('admin.certificates.create')}>
                                <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                    <Plus size={15}/> Nouveau certificat
                                </Button>
                            </Link>
                        )}
                    </div>

                    <div className="cv-toolbar">
                        <form className="cv-search" onSubmit={e => { e.preventDefault(); applyFilter({ search, page:'1' }); }}>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="N° certificat, assuré, départ, destination…"/>
                            <button type="submit"><Search size={14}/></button>
                        </form>
                        <select className="cv-select" value={filters?.status ?? ''} onChange={e => applyFilter({ status: e.target.value, page:'1' })}>
                            <option value="">Tous les statuts</option>
                            {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <input type="date" className="cv-date" value={filters?.date_from ?? ''} onChange={e => applyFilter({ date_from: e.target.value, page:'1' })} title="Date début voyage"/>
                        <input type="date" className="cv-date" value={filters?.date_to ?? ''} onChange={e => applyFilter({ date_to: e.target.value, page:'1' })} title="Date fin voyage"/>
                        {Object.values(filters ?? {}).some(v => v) && (
                            <button onClick={() => router.get('/admin/certificates')} style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                                <X size={12}/> Effacer
                            </button>
                        )}
                    </div>

                    <div className="cv-card">
                        {certificates.data.length === 0 ? (
                            <div className="cv-empty">Aucun certificat trouvé.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>N° Certificat</th>
                                            <th>Assuré</th>
                                            <th>Voyage</th>
                                            <th>Date</th>
                                            <th>Valeur assurée</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {certificates.data.map(cert => {
                                            const ss = STATUS_STYLES[cert.status] ?? STATUS_STYLES.DRAFT;
                                            const TransIcon = TRANSPORT_ICONS[cert.transport_type ?? ''] ?? Award;
                                            return (
                                                <tr key={cert.id}>
                                                    <td>
                                                        <div className="cert-num">{cert.certificate_number}</div>
                                                        <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>
                                                            {cert.contract?.contract_number}
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight:500, color:'#1e293b' }}>{cert.insured_name}</td>
                                                    <td>
                                                        <div className="route-cell" style={{ display:'flex', alignItems:'center', gap:4 }}>
                                                            <TransIcon size={11}/>
                                                            {cert.voyage_from} → {cert.voyage_to}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize:11, color:'#475569', display:'flex', alignItems:'center', gap:3 }}>
                                                            <Calendar size={10}/>{fmt(cert.voyage_date)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="value-cell">
                                                            {parseFloat(cert.insured_value).toLocaleString('fr-FR')}
                                                        </div>
                                                        <div style={{ fontSize:10, color:'#94a3b8' }}>{cert.currency_code}</div>
                                                    </td>
                                                    <td>
                                                        <span className="status-badge" style={{ background: ss.bg, color: ss.color }}>
                                                            <span className="s-dot" style={{ background: ss.dot }}/>{ss.label}
                                                        </span>
                                                        {cert.issued_at && (
                                                            <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>
                                                                {fmt(cert.issued_at)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="actions">
                                                            <Link href={route('admin.certificates.show', { certificate: cert.id })} className="btn-act btn-view">
                                                                <Eye size={12}/> Voir
                                                            </Link>
                                                            {can.create && cert.status === 'DRAFT' && (
                                                                <button className="btn-act btn-del" onClick={() => handleDelete(cert)}>
                                                                    <Trash2 size={12}/> Suppr.
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {certificates.last_page > 1 && (
                                    <div className="cv-pagination">
                                        <span className="cv-pg-info">Page {certificates.current_page}/{certificates.last_page} · {certificates.total} certificats</span>
                                        <div className="cv-pg-links">
                                            <button className="pg-btn" disabled={certificates.current_page === 1} onClick={() => applyFilter({ page: String(certificates.current_page - 1) })}><ChevronLeft size={13}/></button>
                                            {certificates.links.map((link, i) => {
                                                if (i === 0 || i === certificates.links.length - 1) return null;
                                                return <button key={`p-${i}`} className={`pg-btn ${link.active ? 'act' : ''}`} onClick={() => link.url && applyFilter({ page: link.label })} disabled={!link.url} dangerouslySetInnerHTML={{ __html: link.label }}/>;
                                            })}
                                            <button className="pg-btn" disabled={certificates.current_page === certificates.last_page} onClick={() => applyFilter({ page: String(certificates.current_page + 1) })}><ChevronRight size={13}/></button>
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