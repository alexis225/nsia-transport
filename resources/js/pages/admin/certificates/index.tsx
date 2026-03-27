import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Eye, Trash2, X,
    ChevronLeft, ChevronRight, Award,
    Calendar, Ship, Plane, Truck,
    FileText, SlidersHorizontal, Download,
    ChevronDown, ChevronUp,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Certificats', href: '/admin/certificates' },
];

interface Tenant   { id: string; name: string; code: string; }
interface Broker   { id: string; name: string; code: string; }
interface Contract { id: string; contract_number: string; insured_name: string; }
interface Certificate {
    id: string; certificate_number: string; status: string;
    insured_name: string; voyage_date: string;
    voyage_from: string; voyage_to: string;
    transport_type: string | null;
    insured_value: string; currency_code: string;
    prime_total: string | null;
    issued_at: string | null; created_at: string;
    pdf_path: string | null; qr_token: string | null;
    contract: { contract_number: string; insured_name: string } | null;
    tenant:   { name: string; code: string } | null;
    submitted_by: { first_name: string; last_name: string } | null;
    issued_by:    { first_name: string; last_name: string } | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number; from: number; to: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    certificates: Paginated<Certificate>;
    filters: {
        search?: string; status?: string; transport_type?: string;
        tenant_id?: string; broker_id?: string; contract_id?: string;
        date_from?: string; date_to?: string;
        issued_from?: string; issued_to?: string;
        value_min?: string; value_max?: string;
    };
    isSA:      boolean;
    tenants:   Tenant[];
    brokers:   Broker[];
    contracts: Contract[];
    stats:     { total: number; issued: number; submitted: number; draft: number; cancelled: number; };
    can:       { create: boolean; validate: boolean; cancel: boolean; export: boolean; };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    DRAFT:     { bg:'#f8fafc', color:'#64748b', label:'Brouillon',  dot:'#94a3b8' },
    SUBMITTED: { bg:'#fffbeb', color:'#92400e', label:'Soumis',     dot:'#f59e0b' },
    ISSUED:    { bg:'#f0fdf4', color:'#15803d', label:'Émis',       dot:'#22c55e' },
    CANCELLED: { bg:'#fef2f2', color:'#dc2626', label:'Annulé',     dot:'#ef4444' },
};

const TRANSPORT_LABELS: Record<string, string> = {
    SEA: 'Maritime', AIR: 'Aérien', ROAD: 'Routier', RAIL: 'Ferroviaire', MULTIMODAL: 'Multimodal',
};

const TRANSPORT_ICONS: Record<string, any> = {
    SEA: Ship, AIR: Plane, ROAD: Truck, RAIL: Truck, MULTIMODAL: FileText,
};

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

export default function CertificatesIndex({ certificates, filters, isSA, tenants, brokers, contracts, stats, can }: Props) {
    const [search,       setSearch]       = useState(filters?.search ?? '');
    const [showAdvanced, setShowAdvanced] = useState(
        !!(filters?.transport_type || filters?.tenant_id || filters?.broker_id ||
           filters?.issued_from || filters?.issued_to || filters?.value_min || filters?.value_max)
    );

    const activeFiltersCount = Object.values(filters ?? {}).filter(v => v && v !== '').length;

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/certificates', { ...filters, ...params, page: '1' }, { preserveState:true, replace:true });

    const clearFilters = () => router.get('/admin/certificates', {}, { preserveState:false });

    const handleDelete = (c: Certificate) => {
        if (confirm(`Supprimer le certificat « ${c.certificate_number} » ?`))
            router.delete(route('admin.certificates.destroy', { certificate: c.id }));
    };

    const handleExport = () => {
        const params = new URLSearchParams(filters as any);
        window.location.href = `/admin/certificates/export?${params.toString()}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Certificats — NSIA Transport"/>
            <style>{`
                .cv-page{padding:4px;display:flex;flex-direction:column;gap:14px;}
                .cv-hdr{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
                .cv-title{font-size:18px;font-weight:600;color:#1e293b;}
                .cv-sub{font-size:12px;color:#94a3b8;margin-top:2px;}

                /* Stats bar */
                .stats-bar{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
                .stat-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;text-align:center;}
                .stat-value{font-size:20px;font-weight:600;color:#1e293b;}
                .stat-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-top:2px;}
                .stat-card.clickable{cursor:pointer;transition:all .13s;}
                .stat-card.clickable:hover{border-color:#1e3a8a;}

                /* Toolbar */
                .cv-toolbar-wrap{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                .cv-toolbar-main{display:flex;gap:8px;flex-wrap:wrap;padding:12px 14px;align-items:center;}
                .cv-search{display:flex;gap:0;flex:1;min-width:220px;}
                .cv-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .cv-search input:focus{border-color:#1e3a8a;}
                .cv-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .cv-select{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;height:40px;}
                .cv-date{padding:9px 12px;font-size:12px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;height:40px;}

                /* Filtres avancés */
                .cv-advanced{border-top:1px solid #f1f5f9;padding:12px 14px;background:#f8fafc;display:flex;flex-direction:column;gap:10px;}
                .adv-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
                .adv-row-2{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
                .adv-label{font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;}
                .adv-date-range{display:flex;align-items:center;gap:6px;}
                .adv-date-range span{font-size:11px;color:#94a3b8;}

                /* Bouton filtres avancés */
                .btn-advanced{padding:9px 14px;background:none;border:1.5px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:12px;color:#475569;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:all .13s;height:40px;}
                .btn-advanced:hover{background:#f8fafc;border-color:#94a3b8;}
                .btn-advanced.active{border-color:#1e3a8a;color:#1e3a8a;background:#eff6ff;}
                .filter-badge{background:#1e3a8a;color:#fff;border-radius:10px;font-size:10px;padding:1px 6px;font-weight:600;}

                /* Table */
                .cv-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 14px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
                td{padding:11px 14px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .cert-num{font-family:monospace;font-size:12px;font-weight:700;color:#1e293b;}
                .status-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
                .actions{display:flex;gap:5px;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;text-decoration:none;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-del{color:#dc2626;border-color:#fecaca;} .btn-del:hover{background:#fef2f2;}
                .cv-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;flex-wrap:wrap;gap:8px;}
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

                    {/* Header */}
                    <div className="cv-hdr">
                        <div>
                            <h1 className="cv-title">Certificats d'assurance</h1>
                            <p className="cv-sub">{certificates.total} certificat{certificates.total > 1 ? 's' : ''}</p>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                            {can.export && (
                                <Button variant="outline" onClick={handleExport} className="h-10 px-4 gap-1.5">
                                    <Download size={14}/> Exporter CSV
                                </Button>
                            )}
                            {can.create && (
                                <Link href={route('admin.certificates.create')}>
                                    <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                        <Plus size={15}/> Nouveau certificat
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="stats-bar">
                        <div className="stat-card">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">Total</div>
                        </div>
                        <div className="stat-card clickable" onClick={() => applyFilter({ status:'ISSUED' })}>
                            <div className="stat-value" style={{ color:'#15803d' }}>{stats.issued}</div>
                            <div className="stat-label">Émis</div>
                        </div>
                        <div className="stat-card clickable" onClick={() => applyFilter({ status:'SUBMITTED' })}>
                            <div className="stat-value" style={{ color:'#92400e' }}>{stats.submitted}</div>
                            <div className="stat-label">En attente</div>
                        </div>
                        <div className="stat-card clickable" onClick={() => applyFilter({ status:'DRAFT' })}>
                            <div className="stat-value" style={{ color:'#64748b' }}>{stats.draft}</div>
                            <div className="stat-label">Brouillons</div>
                        </div>
                        <div className="stat-card clickable" onClick={() => applyFilter({ status:'CANCELLED' })}>
                            <div className="stat-value" style={{ color:'#dc2626' }}>{stats.cancelled}</div>
                            <div className="stat-label">Annulés</div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="cv-toolbar-wrap">
                        <div className="cv-toolbar-main">
                            {/* Recherche texte */}
                            <form className="cv-search" onSubmit={e => { e.preventDefault(); applyFilter({ search }); }}>
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                       placeholder="N° certificat, assuré, départ, destination…"/>
                                <button type="submit"><Search size={14}/></button>
                            </form>

                            {/* Statut */}
                            <select className="cv-select" value={filters?.status ?? ''}
                                    onChange={e => applyFilter({ status: e.target.value })}>
                                <option value="">Tous les statuts</option>
                                {Object.entries(STATUS_STYLES).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>

                            {/* Transport */}
                            <select className="cv-select" value={filters?.transport_type ?? ''}
                                    onChange={e => applyFilter({ transport_type: e.target.value })}>
                                <option value="">Tous les modes</option>
                                {Object.entries(TRANSPORT_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>

                            {/* Date voyage */}
                            <input type="date" className="cv-date" value={filters?.date_from ?? ''}
                                   onChange={e => applyFilter({ date_from: e.target.value })}
                                   title="Date début voyage"/>
                            <input type="date" className="cv-date" value={filters?.date_to ?? ''}
                                   onChange={e => applyFilter({ date_to: e.target.value })}
                                   title="Date fin voyage"/>

                            {/* Bouton filtres avancés */}
                            <button className={`btn-advanced ${showAdvanced ? 'active' : ''}`}
                                    onClick={() => setShowAdvanced(v => !v)}>
                                <SlidersHorizontal size={13}/>
                                Avancé
                                {activeFiltersCount > 2 && (
                                    <span className="filter-badge">{activeFiltersCount - 2}</span>
                                )}
                                {showAdvanced ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                            </button>

                            {/* Effacer */}
                            {activeFiltersCount > 0 && (
                                <button onClick={clearFilters}
                                        style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12, height:40 }}>
                                    <X size={12}/> Effacer tout
                                </button>
                            )}
                        </div>

                        {/* Filtres avancés */}
                        {showAdvanced && (
                            <div className="cv-advanced">
                                <div className="adv-row">
                                    {/* Filiale */}
                                    {isSA && (
                                        <div>
                                            <div className="adv-label">Filiale</div>
                                            <select className="cv-select" style={{ width:'100%' }}
                                                    value={filters?.tenant_id ?? ''}
                                                    onChange={e => applyFilter({ tenant_id: e.target.value })}>
                                                <option value="">Toutes les filiales</option>
                                                {tenants.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Courtier */}
                                    <div>
                                        <div className="adv-label">Courtier</div>
                                        <select className="cv-select" style={{ width:'100%' }}
                                                value={filters?.broker_id ?? ''}
                                                onChange={e => applyFilter({ broker_id: e.target.value })}>
                                            <option value="">Tous les courtiers</option>
                                            {brokers.map(b => (
                                                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Contrat */}
                                    <div>
                                        <div className="adv-label">Contrat</div>
                                        <select className="cv-select" style={{ width:'100%' }}
                                                value={filters?.contract_id ?? ''}
                                                onChange={e => applyFilter({ contract_id: e.target.value })}>
                                            <option value="">Tous les contrats</option>
                                            {contracts.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.contract_number} — {c.insured_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="adv-row-2">
                                    {/* Date émission */}
                                    <div>
                                        <div className="adv-label">Date d'émission</div>
                                        <div className="adv-date-range">
                                            <input type="date" className="cv-date" style={{ flex:1 }}
                                                   value={filters?.issued_from ?? ''}
                                                   onChange={e => applyFilter({ issued_from: e.target.value })}
                                                   placeholder="Du"/>
                                            <span>→</span>
                                            <input type="date" className="cv-date" style={{ flex:1 }}
                                                   value={filters?.issued_to ?? ''}
                                                   onChange={e => applyFilter({ issued_to: e.target.value })}
                                                   placeholder="Au"/>
                                        </div>
                                    </div>

                                    {/* Valeur assurée */}
                                    <div>
                                        <div className="adv-label">Valeur assurée</div>
                                        <div className="adv-date-range">
                                            <input type="number" min={0} className="cv-date" style={{ flex:1 }}
                                                   value={filters?.value_min ?? ''}
                                                   onChange={e => applyFilter({ value_min: e.target.value })}
                                                   placeholder="Min"/>
                                            <span>→</span>
                                            <input type="number" min={0} className="cv-date" style={{ flex:1 }}
                                                   value={filters?.value_max ?? ''}
                                                   onChange={e => applyFilter({ value_max: e.target.value })}
                                                   placeholder="Max"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="cv-card">
                        {certificates.data.length === 0 ? (
                            <div className="cv-empty">
                                <Award size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                                <div>Aucun certificat trouvé.</div>
                                {activeFiltersCount > 0 && (
                                    <button onClick={clearFilters} style={{ marginTop:10, padding:'6px 14px', background:'none', border:'1px solid #e2e8f0', borderRadius:7, cursor:'pointer', fontSize:12, color:'#64748b' }}>
                                        Effacer les filtres
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>N° Certificat</th>
                                            <th>Assuré</th>
                                            <th>Voyage</th>
                                            <th>Date</th>
                                            <th>Transport</th>
                                            <th>Valeur assurée</th>
                                            {isSA && <th>Filiale</th>}
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
                                                    <td>
                                                        <div style={{ fontWeight:500, color:'#1e293b', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                            {cert.insured_name}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize:12, color:'#475569', display:'flex', alignItems:'center', gap:4 }}>
                                                            <TransIcon size={11}/>
                                                            {cert.voyage_from}
                                                        </div>
                                                        <div style={{ fontSize:11, color:'#94a3b8' }}>→ {cert.voyage_to}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize:11, color:'#475569', display:'flex', alignItems:'center', gap:3 }}>
                                                            <Calendar size={10}/>{fmt(cert.voyage_date)}
                                                        </div>
                                                        {cert.issued_at && (
                                                            <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                                Émis {fmt(cert.issued_at)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {cert.transport_type && (
                                                            <span style={{ fontSize:11, color:'#64748b' }}>
                                                                {TRANSPORT_LABELS[cert.transport_type] ?? cert.transport_type}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontFamily:'monospace', fontSize:12, fontWeight:500 }}>
                                                            {parseFloat(cert.insured_value).toLocaleString('fr-FR')}
                                                        </div>
                                                        <div style={{ fontSize:10, color:'#94a3b8' }}>{cert.currency_code}</div>
                                                    </td>
                                                    {isSA && (
                                                        <td style={{ fontSize:11, color:'#64748b' }}>
                                                            {cert.tenant?.code}
                                                        </td>
                                                    )}
                                                    <td>
                                                        <span className="status-badge" style={{ background: ss.bg, color: ss.color }}>
                                                            <span className="s-dot" style={{ background: ss.dot }}/>{ss.label}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="actions">
                                                            <Link href={route('admin.certificates.show', { certificate: cert.id })}
                                                                  className="btn-act btn-view">
                                                                <Eye size={12}/> Voir
                                                            </Link>
                                                            {can.create && cert.status === 'DRAFT' && (
                                                                <button className="btn-act btn-del"
                                                                        onClick={() => handleDelete(cert)}>
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

                                {/* Pagination */}
                                {certificates.last_page > 1 && (
                                    <div className="cv-pagination">
                                        <span className="cv-pg-info">
                                            {certificates.from}–{certificates.to} sur {certificates.total} certificats
                                        </span>
                                        <div className="cv-pg-links">
                                            <button className="pg-btn" disabled={certificates.current_page === 1}
                                                    onClick={() => applyFilter({ page: String(certificates.current_page - 1) })}>
                                                <ChevronLeft size={13}/>
                                            </button>
                                            {certificates.links.map((link, i) => {
                                                if (i === 0 || i === certificates.links.length - 1) return null;
                                                return (
                                                    <button key={`p-${i}`}
                                                            className={`pg-btn ${link.active ? 'act' : ''}`}
                                                            onClick={() => link.url && applyFilter({ page: link.label })}
                                                            disabled={!link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                );
                                            })}
                                            <button className="pg-btn" disabled={certificates.current_page === certificates.last_page}
                                                    onClick={() => applyFilter({ page: String(certificates.current_page + 1) })}>
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