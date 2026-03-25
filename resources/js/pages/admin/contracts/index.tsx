import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Eye, Edit2, Trash2, X,
    ChevronLeft, ChevronRight, FileText, Calendar,
    TrendingUp,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contrats', href: '/admin/contracts' },
];

interface Tenant   { id: string; name: string; code: string; }
interface Broker   { id: string; name: string; code: string; }
interface User     { id: string; first_name: string; last_name: string; }
interface Contract {
    id: string; contract_number: string; type: string; status: string;
    insured_name: string; currency_code: string;
    subscription_limit: string | null; used_limit: string;
    effective_date: string; expiry_date: string;
    certificates_count: number; certificates_limit: number | null;
    coverage_type: string | null; requires_approval: boolean;
    created_at: string;
    tenant: Tenant | null; broker: Broker | null; created_by: User | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    contracts: Paginated<Contract>;
    filters:   { search?: string; status?: string; type?: string; tenant_id?: string };
    isSA:      boolean;
    tenants:   Tenant[];
    can:       { create: boolean; edit: boolean; delete: boolean; validate: boolean };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    DRAFT:            { bg:'#f8fafc', color:'#64748b', label:'Brouillon',          dot:'#94a3b8' },
    PENDING_APPROVAL: { bg:'#fffbeb', color:'#92400e', label:'En attente appro.',  dot:'#f59e0b' },
    ACTIVE:           { bg:'#f0fdf4', color:'#15803d', label:'Actif',              dot:'#22c55e' },
    SUSPENDED:        { bg:'#fff7ed', color:'#c2410c', label:'Suspendu',           dot:'#f97316' },
    EXPIRED:          { bg:'#f8fafc', color:'#475569', label:'Expiré',             dot:'#64748b' },
    CANCELLED:        { bg:'#fef2f2', color:'#dc2626', label:'Annulé',             dot:'#ef4444' },
};

const TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    OPEN_POLICY:   { bg:'#eff6ff', color:'#1d4ed8', label:'Police ouverte'  },
    VOYAGE:        { bg:'#fdf4ff', color:'#7c3aed', label:'Au voyage'       },
    ANNUAL_VOYAGE: { bg:'#f0fdf4', color:'#15803d', label:'Annuel voyages'  },
};

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

export default function ContractsIndex({ contracts, filters, isSA, tenants, can }: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/contracts', { ...filters, ...params }, { preserveState:true, replace:true });

    const handleDelete = (c: Contract) => {
        if (confirm(`Supprimer le contrat « ${c.contract_number} » ?`))
            router.delete(route('admin.contracts.destroy', { contract: c.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contrats — NSIA Transport"/>
            <style>{`
                .cn-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .cn-hdr{display:flex;align-items:center;justify-content:space-between;}
                .cn-title{font-size:18px;font-weight:600;color:#1e293b;}
                .cn-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .cn-toolbar{display:flex;gap:8px;flex-wrap:wrap;}
                .cn-search{display:flex;gap:0;flex:1;min-width:220px;}
                .cn-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .cn-search input:focus{border-color:#1e3a8a;}
                .cn-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .cn-select{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;}
                .cn-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:12px 16px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .policy-num{font-family:monospace;font-size:12px;font-weight:600;color:#1e293b;}
                .status-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
                .type-badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:8px;font-size:11px;font-weight:500;}
                .usage-bar{height:4px;background:#f1f5f9;border-radius:2px;overflow:hidden;width:80px;margin-top:3px;}
                .usage-fill{height:100%;border-radius:2px;transition:width .3s;}
                .actions{display:flex;gap:5px;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;text-decoration:none;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-edit{color:#0f766e;border-color:#99f6e4;} .btn-edit:hover{background:#f0fdfa;}
                .btn-del{color:#dc2626;border-color:#fecaca;} .btn-del:hover{background:#fef2f2;}
                .cn-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .cn-pg-info{font-size:12px;color:#94a3b8;}
                .cn-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .cn-empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="cn-page">

                    <div className="cn-hdr">
                        <div>
                            <h1 className="cn-title">Contrats d'assurance</h1>
                            <p className="cn-sub">{contracts.total} contrat{contracts.total > 1 ? 's' : ''}</p>
                        </div>
                        {can.create && (
                            <Link href={route('admin.contracts.create')}>
                                <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                    <Plus size={15}/> Nouveau contrat
                                </Button>
                            </Link>
                        )}
                    </div>

                    <div className="cn-toolbar">
                        <form className="cn-search" onSubmit={e => { e.preventDefault(); applyFilter({ search, page:'1' }); }}>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="N° contrat, assuré, courtier…"/>
                            <button type="submit"><Search size={14}/></button>
                        </form>
                        <select className="cn-select" value={filters?.status ?? ''} onChange={e => applyFilter({ status: e.target.value, page:'1' })}>
                            <option value="">Tous les statuts</option>
                            {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <select className="cn-select" value={filters?.type ?? ''} onChange={e => applyFilter({ type: e.target.value, page:'1' })}>
                            <option value="">Tous les types</option>
                            {Object.entries(TYPE_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        {isSA && (
                            <select className="cn-select" value={filters?.tenant_id ?? ''} onChange={e => applyFilter({ tenant_id: e.target.value, page:'1' })}>
                                <option value="">Toutes les filiales</option>
                                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        )}
                        {Object.values(filters ?? {}).some(v => v) && (
                            <button onClick={() => router.get('/admin/contracts')} style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                                <X size={12}/> Effacer
                            </button>
                        )}
                    </div>

                    <div className="cn-card">
                        {contracts.data.length === 0 ? (
                            <div className="cn-empty">Aucun contrat trouvé.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>N° Contrat</th>
                                            <th>Assuré / Courtier</th>
                                            {isSA && <th>Filiale</th>}
                                            <th>Type</th>
                                            <th>Période</th>
                                            <th>Utilisation</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contracts.data.map(contract => {
                                            const ss  = STATUS_STYLES[contract.status] ?? STATUS_STYLES.DRAFT;
                                            const ts  = TYPE_STYLES[contract.type]     ?? TYPE_STYLES.OPEN_POLICY;
                                            const pct = contract.subscription_limit
                                                ? Math.min(100, Math.round((parseFloat(contract.used_limit) / parseFloat(contract.subscription_limit)) * 100))
                                                : 0;
                                            const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : '#22c55e';

                                            return (
                                                <tr key={contract.id}>
                                                    <td>
                                                        <div className="policy-num">{contract.contract_number}</div>
                                                        <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{fmt(contract.created_at)}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight:500, color:'#1e293b' }}>{contract.insured_name}</div>
                                                        {contract.broker && <div style={{ fontSize:10, color:'#94a3b8' }}>{contract.broker.name}</div>}
                                                    </td>
                                                    {isSA && <td style={{ fontSize:11, color:'#64748b' }}>{contract.tenant?.name ?? '—'}</td>}
                                                    <td>
                                                        <span className="type-badge" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize:11, color:'#475569', display:'flex', alignItems:'center', gap:3 }}>
                                                            <Calendar size={10}/>{fmt(contract.effective_date)}
                                                        </div>
                                                        <div style={{ fontSize:10, color:'#94a3b8' }}>→ {fmt(contract.expiry_date)}</div>
                                                    </td>
                                                    <td>
                                                        {contract.subscription_limit ? (
                                                            <div>
                                                                <div style={{ fontSize:11, color:'#475569', display:'flex', alignItems:'center', gap:3 }}>
                                                                    <TrendingUp size={10}/>
                                                                    {pct}%
                                                                </div>
                                                                <div className="usage-bar">
                                                                    <div className="usage-fill" style={{ width:`${pct}%`, background: barColor }}/>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize:11, color:'#94a3b8' }}>Illimité</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="status-badge" style={{ background: ss.bg, color: ss.color }}>
                                                            <span className="s-dot" style={{ background: ss.dot }}/>{ss.label}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="actions">
                                                            <Link href={route('admin.contracts.show', { contract: contract.id })} className="btn-act btn-view">
                                                                <Eye size={12}/> Voir
                                                            </Link>
                                                            {can.edit && contract.status === 'DRAFT' && (
                                                                <Link href={route('admin.contracts.edit', { contract: contract.id })} className="btn-act btn-edit">
                                                                    <Edit2 size={12}/> Éditer
                                                                </Link>
                                                            )}
                                                            {can.delete && contract.status === 'DRAFT' && (
                                                                <button className="btn-act btn-del" onClick={() => handleDelete(contract)}>
                                                                    <Trash2 size={12}/> Supprimer
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {contracts.last_page > 1 && (
                                    <div className="cn-pagination">
                                        <span className="cn-pg-info">Page {contracts.current_page}/{contracts.last_page} · {contracts.total} contrats</span>
                                        <div className="cn-pg-links">
                                            <button className="pg-btn" disabled={contracts.current_page === 1} onClick={() => applyFilter({ page: String(contracts.current_page - 1) })}><ChevronLeft size={13}/></button>
                                            {contracts.links.map((link, i) => {
                                                if (i === 0 || i === contracts.links.length - 1) return null;
                                                return <button key={`p-${i}`} className={`pg-btn ${link.active ? 'act' : ''}`} onClick={() => link.url && applyFilter({ page: link.label })} disabled={!link.url} dangerouslySetInnerHTML={{ __html: link.label }}/>;
                                            })}
                                            <button className="pg-btn" disabled={contracts.current_page === contracts.last_page} onClick={() => applyFilter({ page: String(contracts.current_page + 1) })}><ChevronRight size={13}/></button>
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