import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Eye, Edit2, Trash2,
    ToggleLeft, ToggleRight, X,
    ChevronLeft, ChevronRight,
    Mail, Phone,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Experts', href: '/admin/experts' },
];

interface Tenant { id: string; name: string; code: string; }
interface Expert {
    id: string; name: string;
    email: string | null; phone: string | null;
    country_code: string | null;
    is_active: boolean; created_at: string;
    tenant: Tenant | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    experts: Paginated<Expert>;
    filters: { search?: string; status?: string };
    isSA:    boolean;
    can:     { create: boolean; edit: boolean; delete: boolean };
}

const COLORS = [
    { bg:'#EEF2FF', color:'#4338CA' },
    { bg:'#FFF7ED', color:'#C2410C' },
    { bg:'#FDF4FF', color:'#7E22CE' },
    { bg:'#F0FDF4', color:'#15803D' },
    { bg:'#ECFDF5', color:'#065F46' },
    { bg:'#EFF6FF', color:'#1D4ED8' },
];

export default function ExpertsIndex({ experts, filters, isSA, can }: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/experts', { ...filters, ...params }, { preserveState: true, replace: true });

    const handleDelete = (e: Expert) => {
        if (confirm(`Supprimer l'expert « ${e.name} » ?`))
            router.delete(route('admin.experts.destroy', { expert: e.id }));
    };

    const handleToggle = (e: Expert) => {
        const action = e.is_active ? 'désactiver' : 'activer';
        if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${e.name} ?`))
            router.patch(route('admin.experts.toggle', { expert: e.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Experts — NSIA Transport"/>
            <style>{`
                .ex-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .ex-hdr{display:flex;align-items:center;justify-content:space-between;}
                .ex-title{font-size:18px;font-weight:600;color:#1e293b;}
                .ex-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .ex-toolbar{display:flex;gap:8px;flex-wrap:wrap;}
                .ex-search{display:flex;gap:0;flex:1;min-width:220px;}
                .ex-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .ex-search input:focus{border-color:#1e3a8a;}
                .ex-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .ex-select{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;}
                .ex-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:12px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .ex-avatar{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
                .ex-name{font-weight:500;color:#1e293b;font-size:13px;}
                .contact-info{font-size:11px;color:#64748b;display:flex;flex-direction:column;gap:2px;}
                .contact-row{display:flex;align-items:center;gap:4px;}
                .s-active{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:500;}
                .s-inactive{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
                .actions{display:flex;gap:5px;flex-wrap:wrap;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;text-decoration:none;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-edit{color:#0f766e;border-color:#99f6e4;} .btn-edit:hover{background:#f0fdfa;}
                .btn-del{color:#dc2626;border-color:#fecaca;} .btn-del:hover{background:#fef2f2;}
                .btn-on{color:#dc2626;border-color:#fecaca;} .btn-on:hover{background:#fef2f2;}
                .btn-off{color:#059669;border-color:#a7f3d0;} .btn-off:hover{background:#ecfdf5;}
                .ex-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .ex-pg-info{font-size:12px;color:#94a3b8;}
                .ex-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .ex-empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ex-page">

                    <div className="ex-hdr">
                        <div>
                            <h1 className="ex-title">Experts d'assurance</h1>
                            <p className="ex-sub">{experts.total} expert{experts.total > 1 ? 's' : ''}</p>
                        </div>
                        {can.create && (
                            <Link href={route('admin.experts.create')}>
                                <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                    <Plus size={15}/> Nouvel expert
                                </Button>
                            </Link>
                        )}
                    </div>

                    <div className="ex-toolbar">
                        <form className="ex-search" onSubmit={e => { e.preventDefault(); applyFilter({ search, page: '1' }); }}>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email…"/>
                            <button type="submit"><Search size={14}/></button>
                        </form>
                        <select className="ex-select" value={filters?.status ?? ''} onChange={e => applyFilter({ status: e.target.value, page: '1' })}>
                            <option value="">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                        </select>
                        {(filters?.search || filters?.status) && (
                            <button onClick={() => router.get('/admin/experts')} style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                                <X size={12}/> Effacer
                            </button>
                        )}
                    </div>

                    <div className="ex-card">
                        {experts.data.length === 0 ? (
                            <div className="ex-empty">Aucun expert trouvé.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Expert</th>
                                            <th>Contact</th>
                                            <th>Pays</th>
                                            {isSA && <th>Filiale</th>}
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {experts.data.map((exp, i) => {
                                            const c = COLORS[i % COLORS.length];
                                            const initials = exp.name.slice(0, 2).toUpperCase();
                                            return (
                                                <tr key={exp.id}>
                                                    <td>
                                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                            <div className="ex-avatar" style={{ background: c.bg, color: c.color }}>{initials}</div>
                                                            <div className="ex-name">{exp.name}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="contact-info">
                                                            {exp.email && <div className="contact-row"><Mail size={10}/>{exp.email}</div>}
                                                            {exp.phone && <div className="contact-row"><Phone size={10}/>{exp.phone}</div>}
                                                            {!exp.email && !exp.phone && <span style={{ color:'#cbd5e1' }}>—</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ fontSize:12, color:'#64748b' }}>
                                                        {exp.country_code ?? <span style={{ color:'#cbd5e1' }}>—</span>}
                                                    </td>
                                                    {isSA && (
                                                        <td style={{ fontSize:12, color:'#64748b' }}>
                                                            {exp.tenant?.name ?? '—'}
                                                        </td>
                                                    )}
                                                    <td>
                                                        {exp.is_active
                                                            ? <span className="s-active"><span className="s-dot" style={{ background:'#22c55e' }}/>Actif</span>
                                                            : <span className="s-inactive"><span className="s-dot" style={{ background:'#94a3b8' }}/>Inactif</span>}
                                                    </td>
                                                    <td>
                                                        <div className="actions">
                                                            <Link href={route('admin.experts.show', { expert: exp.id })} className="btn-act btn-view">
                                                                <Eye size={12}/> Voir
                                                            </Link>
                                                            {can.edit && (
                                                                <Link href={route('admin.experts.edit', { expert: exp.id })} className="btn-act btn-edit">
                                                                    <Edit2 size={12}/> Éditer
                                                                </Link>
                                                            )}
                                                            {can.edit && (
                                                                <button className={`btn-act ${exp.is_active ? 'btn-on' : 'btn-off'}`} onClick={() => handleToggle(exp)}>
                                                                    {exp.is_active ? <><ToggleLeft size={12}/> Désactiver</> : <><ToggleRight size={12}/> Activer</>}
                                                                </button>
                                                            )}
                                                            {can.delete && (
                                                                <button className="btn-act btn-del" onClick={() => handleDelete(exp)}>
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

                                {experts.last_page > 1 && (
                                    <div className="ex-pagination">
                                        <span className="ex-pg-info">Page {experts.current_page} / {experts.last_page} · {experts.total} experts</span>
                                        <div className="ex-pg-links">
                                            <button className="pg-btn" disabled={experts.current_page === 1} onClick={() => applyFilter({ page: String(experts.current_page - 1) })}><ChevronLeft size={13}/></button>
                                            {experts.links.map((link, i) => {
                                                if (i === 0 || i === experts.links.length - 1) return null;
                                                return (
                                                    <button key={`p-${i}`} className={`pg-btn ${link.active ? 'act' : ''}`}
                                                            onClick={() => link.url && applyFilter({ page: link.label })}
                                                            disabled={!link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                );
                                            })}
                                            <button className="pg-btn" disabled={experts.current_page === experts.last_page} onClick={() => applyFilter({ page: String(experts.current_page + 1) })}><ChevronRight size={13}/></button>
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
