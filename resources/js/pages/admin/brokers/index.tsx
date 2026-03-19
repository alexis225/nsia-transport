import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Eye, Edit2, Trash2,
    ToggleLeft, ToggleRight, X,
    ChevronLeft, ChevronRight,
    Briefcase, Mail, Phone, MapPin,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Courtiers', href: '/admin/brokers' },
];

interface Tenant { id: string; name: string; code: string; }
interface Broker {
    id: string; name: string; code: string;
    type: 'courtier_local' | 'partenaire_etranger';
    agreement_number: string | null;
    email: string | null; phone: string | null;
    address: string | null; city: string | null; country_code: string;
    is_active: boolean; created_at: string;
    tenant: Tenant | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    brokers: Paginated<Broker>;
    filters: { search?: string; type?: string; status?: string };
    isSA:    boolean;
    can:     { create: boolean; edit: boolean; delete: boolean };
}

const TYPE_STYLES = {
    courtier_local:      { bg:'#EFF6FF', color:'#1D4ED8', label:'Courtier local' },
    partenaire_etranger: { bg:'#FDF4FF', color:'#7E22CE', label:'Partenaire étranger' },
};

const BROKER_COLORS = [
    { bg:'#EEF2FF', color:'#4338CA' },
    { bg:'#EFF6FF', color:'#1D4ED8' },
    { bg:'#FFF7ED', color:'#C2410C' },
    { bg:'#FDF4FF', color:'#7E22CE' },
    { bg:'#F0FDF4', color:'#15803D' },
    { bg:'#ECFDF5', color:'#065F46' },
];

export default function BrokersIndex({ brokers, filters, isSA, can }: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/brokers', { ...filters, ...params }, { preserveState:true, replace:true });

    const handleDelete = (broker: Broker) => {
        if (confirm(`Supprimer le courtier « ${broker.name} » ?`))
            router.delete(route('admin.brokers.destroy', { broker: broker.id }));
    };

    const handleToggle = (broker: Broker) => {
        const action = broker.is_active ? 'désactiver' : 'activer';
        if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${broker.name} ?`))
            router.patch(route('admin.brokers.toggle', { broker: broker.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Courtiers — NSIA Transport"/>
            <style>{`
                .br-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .br-hdr{display:flex;align-items:center;justify-content:space-between;}
                .br-title{font-size:18px;font-weight:600;color:#1e293b;}
                .br-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .br-toolbar{display:flex;gap:8px;flex-wrap:wrap;}
                .br-search{display:flex;gap:0;flex:1;min-width:220px;}
                .br-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .br-search input:focus{border-color:#1e3a8a;}
                .br-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .br-select{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;}
                .br-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:12px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .b-avatar{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
                .b-name{font-weight:500;color:#1e293b;font-size:13px;}
                .b-code{font-size:10px;color:#94a3b8;font-family:monospace;letter-spacing:.06em;margin-top:1px;}
                .type-badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:500;}
                .s-active{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:500;}
                .s-inactive{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
                .contact-info{font-size:11px;color:#64748b;display:flex;flex-direction:column;gap:2px;}
                .contact-row{display:flex;align-items:center;gap:4px;}
                .actions{display:flex;gap:5px;flex-wrap:wrap;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;text-decoration:none;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-edit{color:#0f766e;border-color:#99f6e4;} .btn-edit:hover{background:#f0fdfa;}
                .btn-del{color:#dc2626;border-color:#fecaca;} .btn-del:hover{background:#fef2f2;}
                .btn-on{color:#dc2626;border-color:#fecaca;} .btn-on:hover{background:#fef2f2;}
                .btn-off{color:#059669;border-color:#a7f3d0;} .btn-off:hover{background:#ecfdf5;}
                .br-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .br-pg-info{font-size:12px;color:#94a3b8;}
                .br-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .br-empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="br-page">

                    {/* Header */}
                    <div className="br-hdr">
                        <div>
                            <h1 className="br-title">Courtiers</h1>
                            <p className="br-sub">{brokers.total} courtier{brokers.total > 1 ? 's' : ''}</p>
                        </div>
                        {can.create && (
                            <Link href={route('admin.brokers.create')}>
                                <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                    <Plus size={15}/> Nouveau courtier
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div className="br-toolbar">
                        <form className="br-search" onSubmit={e => { e.preventDefault(); applyFilter({ search, page:'1' }); }}>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, code ou email…"/>
                            <button type="submit"><Search size={14}/></button>
                        </form>
                        <select className="br-select" value={filters?.type ?? ''} onChange={e => applyFilter({ type: e.target.value, page:'1' })}>
                            <option value="">Tous les types</option>
                            <option value="courtier_local">Courtier local</option>
                            <option value="partenaire_etranger">Partenaire étranger</option>
                        </select>
                        <select className="br-select" value={filters?.status ?? ''} onChange={e => applyFilter({ status: e.target.value, page:'1' })}>
                            <option value="">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                        </select>
                        {(filters?.search || filters?.type || filters?.status) && (
                            <button onClick={() => router.get('/admin/brokers')} style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                                <X size={12}/> Effacer
                            </button>
                        )}
                    </div>

                    {/* Tableau */}
                    <div className="br-card">
                        {brokers.data.length === 0 ? (
                            <div className="br-empty">Aucun courtier trouvé.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Courtier</th>
                                            <th>Type</th>
                                            <th>Contact</th>
                                            <th>Localisation</th>
                                            {isSA && <th>Filiale</th>}
                                            <th>Agrément</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {brokers.data.map((broker, i) => {
                                            const c  = BROKER_COLORS[i % BROKER_COLORS.length];
                                            const ts = TYPE_STYLES[broker.type];
                                            const initials = broker.name.slice(0, 2).toUpperCase();

                                            return (
                                                <tr key={broker.id}>
                                                    <td>
                                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                            <div className="b-avatar" style={{ background: c.bg, color: c.color }}>
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <div className="b-name">{broker.name}</div>
                                                                <div className="b-code">{broker.code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="type-badge" style={{ background: ts.bg, color: ts.color }}>
                                                            {ts.label}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="contact-info">
                                                            {broker.email && <div className="contact-row"><Mail size={10}/>{broker.email}</div>}
                                                            {broker.phone && <div className="contact-row"><Phone size={10}/>{broker.phone}</div>}
                                                            {!broker.email && !broker.phone && <span style={{ color:'#cbd5e1' }}>—</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="contact-info">
                                                            {(broker.city || broker.country_code) && (
                                                                <div className="contact-row">
                                                                    <MapPin size={10}/>
                                                                    {[broker.city, broker.country_code].filter(Boolean).join(', ')}
                                                                </div>
                                                            )}
                                                            {!broker.city && !broker.address && <span style={{ color:'#cbd5e1' }}>—</span>}
                                                        </div>
                                                    </td>
                                                    {isSA && (
                                                        <td style={{ fontSize:12, color:'#64748b' }}>
                                                            {broker.tenant?.name ?? '—'}
                                                        </td>
                                                    )}
                                                    <td style={{ fontSize:11, fontFamily:'monospace', color:'#64748b' }}>
                                                        {broker.registration_number ?? <span style={{ color:'#cbd5e1' }}>—</span>}
                                                    </td>
                                                    <td>
                                                        {broker.is_active
                                                            ? <span className="s-active"><span className="s-dot" style={{ background:'#22c55e' }}/>Actif</span>
                                                            : <span className="s-inactive"><span className="s-dot" style={{ background:'#94a3b8' }}/>Inactif</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        <div className="actions">
                                                            <Link href={route('admin.brokers.show', { broker: broker.id })} className="btn-act btn-view">
                                                                <Eye size={12}/> Voir
                                                            </Link>
                                                            {can.edit && (
                                                                <Link href={route('admin.brokers.edit', { broker: broker.id })} className="btn-act btn-edit">
                                                                    <Edit2 size={12}/> Éditer
                                                                </Link>
                                                            )}
                                                            {can.edit && (
                                                                <button className={`btn-act ${broker.is_active ? 'btn-on' : 'btn-off'}`} onClick={() => handleToggle(broker)}>
                                                                    {broker.is_active ? <><ToggleLeft size={12}/> Désactiver</> : <><ToggleRight size={12}/> Activer</>}
                                                                </button>
                                                            )}
                                                            {can.delete && (
                                                                <button className="btn-act btn-del" onClick={() => handleDelete(broker)}>
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

                                {brokers.last_page > 1 && (
                                    <div className="br-pagination">
                                        <span className="br-pg-info">Page {brokers.current_page} / {brokers.last_page} · {brokers.total} courtiers</span>
                                        <div className="br-pg-links">
                                            <button className="pg-btn" disabled={brokers.current_page === 1} onClick={() => applyFilter({ page: String(brokers.current_page - 1) })}><ChevronLeft size={13}/></button>
                                            {brokers.links.map((link, i) => {
                                                if (i === 0 || i === brokers.links.length - 1) return null;
                                                return (
                                                    <button key={`page-${i}`} className={`pg-btn ${link.active ? 'act' : ''}`}
                                                            onClick={() => link.url && applyFilter({ page: link.label })}
                                                            disabled={!link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                );
                                            })}
                                            <button className="pg-btn" disabled={brokers.current_page === brokers.last_page} onClick={() => applyFilter({ page: String(brokers.current_page + 1) })}><ChevronRight size={13}/></button>
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