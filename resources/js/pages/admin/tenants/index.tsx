import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Eye, Edit2, Settings,
    ToggleLeft, ToggleRight, X,
    ChevronLeft, ChevronRight, Users, Building2,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Filiales', href: '/admin/tenants' },
];

interface Tenant {
    id: string; name: string; code: string; country_code: string;
    currency: string; locale: string; timezone: string;
    is_active: boolean; users_count: number; created_at: string;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    tenants: Paginated<Tenant>;
    filters: { search?: string; status?: string };
}

const FLAG: Record<string, string> = {
    CI:'🇨🇮', SN:'🇸🇳', ML:'🇲🇱', BF:'🇧🇫', GN:'🇬🇳',
    TG:'🇹🇬', BJ:'🇧🇯', CM:'🇨🇲', CG:'🇨🇬', GA:'🇬🇦',
    MG:'🇲🇬', GW:'🇬🇼', NG:'🇳🇬',
};

const TENANT_COLORS = [
    { bg:'#EEF2FF', color:'#4338CA' },
    { bg:'#ECFDF5', color:'#065F46' },
    { bg:'#EFF6FF', color:'#1D4ED8' },
    { bg:'#FFF7ED', color:'#C2410C' },
    { bg:'#FDF4FF', color:'#7E22CE' },
    { bg:'#F0FDF4', color:'#15803D' },
];

export default function TenantsIndex({ tenants, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/tenants', { ...filters, ...params }, { preserveState:true, replace:true });

    const handleToggle = (tenant: Tenant) => {
        const action = tenant.is_active ? 'désactiver' : 'activer';
        if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} la filiale ${tenant.name} ?`))
            router.patch(route('admin.tenants.toggle', { tenant: tenant.id }));
    };

    const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Filiales — NSIA Transport"/>
            <style>{`
                .tn-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .tn-hdr{display:flex;align-items:center;justify-content:space-between;}
                .tn-title{font-size:18px;font-weight:600;color:#1e293b;}
                .tn-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .tn-toolbar{display:flex;gap:8px;flex-wrap:wrap;}
                .tn-search{display:flex;gap:0;flex:1;min-width:220px;}
                .tn-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .tn-search input:focus{border-color:#1e3a8a;}
                .tn-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .tn-select{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;}

                .tn-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:13px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}

                .tn-avatar{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
                .tn-name{font-weight:600;color:#1e293b;font-size:13px;}
                .tn-code{font-size:11px;color:#94a3b8;font-family:monospace;letter-spacing:.08em;margin-top:1px;}

                .badge-active{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:500;}
                .badge-inactive{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}

                .curr-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;color:#475569;font-family:monospace;font-weight:500;}

                .actions{display:flex;gap:5px;flex-wrap:wrap;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-edit{color:#0f766e;border-color:#99f6e4;} .btn-edit:hover{background:#f0fdfa;}
                .btn-config{color:#7c3aed;border-color:#ddd6fe;} .btn-config:hover{background:#f5f3ff;}
                .btn-on{color:#dc2626;border-color:#fecaca;} .btn-on:hover{background:#fef2f2;}
                .btn-off{color:#059669;border-color:#a7f3d0;} .btn-off:hover{background:#ecfdf5;}

                .tn-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .tn-pg-info{font-size:12px;color:#94a3b8;}
                .tn-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .tn-empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="tn-page">

                    {/* Header */}
                    <div className="tn-hdr">
                        <div>
                            <h1 className="tn-title">Filiales NSIA</h1>
                            <p className="tn-sub">{tenants.total} filiale{tenants.total > 1 ? 's' : ''} configurée{tenants.total > 1 ? 's' : ''}</p>
                        </div>
                        <Link href={route('admin.tenants.create')}>
                            <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                <Plus size={15}/> Nouvelle filiale
                            </Button>
                        </Link>
                    </div>

                    {/* Toolbar */}
                    <div className="tn-toolbar">
                        <form className="tn-search" onSubmit={e => { e.preventDefault(); applyFilter({ search, page:'1' }); }}>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou code…"/>
                            <button type="submit"><Search size={14}/></button>
                        </form>
                        <select className="tn-select" value={filters.status ?? ''} onChange={e => applyFilter({ status: e.target.value, page:'1' })}>
                            <option value="">Tous les statuts</option>
                            <option value="active">Actives</option>
                            <option value="inactive">Inactives</option>
                        </select>
                        {(filters.search || filters.status) && (
                            <button onClick={() => router.get('/admin/tenants')} style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                                <X size={12}/> Effacer
                            </button>
                        )}
                    </div>

                    {/* Tableau */}
                    <div className="tn-card">
                        {tenants.data.length === 0 ? (
                            <div className="tn-empty">Aucune filiale trouvée.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Filiale</th>
                                            <th>Pays</th>
                                            <th>Devise</th>
                                            <th>Utilisateurs</th>
                                            <th>Statut</th>
                                            <th>Créée le</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenants.data.map((tenant, i) => {
                                            const c = TENANT_COLORS[i % TENANT_COLORS.length];
                                            return (
                                                <tr key={tenant.id}>
                                                    {/* Filiale */}
                                                    <td>
                                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                            <div className="tn-avatar" style={{ background: c.bg, border:`1.5px solid ${c.color}22` }}>
                                                                {FLAG[tenant.code] ?? '🏢'}
                                                            </div>
                                                            <div>
                                                                <div className="tn-name">{tenant.name}</div>
                                                                <div className="tn-code">{tenant.code}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Pays */}
                                                    <td>
                                                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' }}>
                                                            <Building2 size={12}/>{tenant.country_code}
                                                        </span>
                                                    </td>

                                                    {/* Devise */}
                                                    <td><span className="curr-badge">{tenant.currency}</span></td>

                                                    {/* Utilisateurs */}
                                                    <td>
                                                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' }}>
                                                            <Users size={12}/>{tenant.users_count}
                                                        </span>
                                                    </td>

                                                    {/* Statut */}
                                                    <td>
                                                        {tenant.is_active
                                                            ? <span className="badge-active"><span className="s-dot" style={{ background:'#22c55e' }}/>Active</span>
                                                            : <span className="badge-inactive"><span className="s-dot" style={{ background:'#94a3b8' }}/>Inactive</span>
                                                        }
                                                    </td>

                                                    {/* Date */}
                                                    <td style={{ fontSize:12, color:'#94a3b8' }}>{fmt(tenant.created_at)}</td>

                                                    {/* Actions */}
                                                    <td>
                                                        <div className="actions">
                                                            <Link href={route('admin.tenants.show', { tenant: tenant.id })} className="btn-act btn-view">
                                                                <Eye size={12}/> Voir
                                                            </Link>
                                                            <Link href={route('admin.tenants.edit', { tenant: tenant.id })} className="btn-act btn-edit">
                                                                <Edit2 size={12}/> Éditer
                                                            </Link>
                                                            <Link href={route('admin.tenants.config', { tenant: tenant.id })} className="btn-act btn-config">
                                                                <Settings size={12}/> Config
                                                            </Link>
                                                            <button
                                                                className={`btn-act ${tenant.is_active ? 'btn-on' : 'btn-off'}`}
                                                                onClick={() => handleToggle(tenant)}
                                                            >
                                                                {tenant.is_active
                                                                    ? <><ToggleLeft size={12}/> Désactiver</>
                                                                    : <><ToggleRight size={12}/> Activer</>
                                                                }
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {tenants.last_page > 1 && (
                                    <div className="tn-pagination">
                                        <span className="tn-pg-info">Page {tenants.current_page} / {tenants.last_page} · {tenants.total} filiales</span>
                                        <div className="tn-pg-links">
                                            <button className="pg-btn" disabled={tenants.current_page === 1}
                                                onClick={() => applyFilter({ page: String(tenants.current_page - 1) })}>
                                                <ChevronLeft size={13}/>
                                            </button>
                                            {tenants.links.map((link, i) => {
                                                if (i === 0 || i === tenants.links.length - 1) return null;
                                                return (
                                                    <button key={`page-${i}`}
                                                        className={`pg-btn ${link.active ? 'act' : ''}`}
                                                        onClick={() => link.url && applyFilter({ page: link.label })}
                                                        disabled={!link.url}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                );
                                            })}
                                            <button className="pg-btn" disabled={tenants.current_page === tenants.last_page}
                                                onClick={() => applyFilter({ page: String(tenants.current_page + 1) })}>
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