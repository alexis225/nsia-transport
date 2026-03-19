import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Download, Trash2, Eye,
    X, ChevronLeft, ChevronRight,
    AlertCircle, Loader2, Clock, Filter,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Audit Logs', href: '/admin/audit-logs' },
];

interface User   { id: string; first_name: string; last_name: string; email: string; }
interface Tenant { id: string; name: string; code: string; }
interface Log {
    id: string; action: string; entity_type: string | null;
    entity_id: string | null; ip_address: string | null;
    user_agent: string | null; created_at: string;
    user: User | null; tenant: Tenant | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    logs:        Paginated<Log>;
    filters:     Record<string, string>;
    actions:     string[];
    entityTypes: string[];
    isSA:        boolean;
}

// ── Couleurs par action ───────────────────────────────────────
const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
    login:              { bg:'#f0fdf4', color:'#15803d' },
    logout:             { bg:'#f8fafc', color:'#64748b' },
    login_failed:       { bg:'#fef2f2', color:'#dc2626' },
    user_created:       { bg:'#eff6ff', color:'#1d4ed8' },
    user_updated:       { bg:'#fff7ed', color:'#c2410c' },
    user_deleted:       { bg:'#fef2f2', color:'#dc2626' },
    user_blocked:       { bg:'#fef2f2', color:'#dc2626' },
    user_unblocked:     { bg:'#f0fdf4', color:'#15803d' },
    tenant_created:     { bg:'#eff6ff', color:'#1d4ed8' },
    tenant_updated:     { bg:'#fff7ed', color:'#c2410c' },
    role_assigned:      { bg:'#fdf4ff', color:'#7e22ce' },
    avatar_updated:     { bg:'#f0fdf4', color:'#0f766e' },
    password_changed:   { bg:'#fff7ed', color:'#c2410c' },
};

const getActionStyle = (action: string) =>
    ACTION_COLORS[action] ?? { bg:'#f8fafc', color:'#475569' };

// ── Modal purge ───────────────────────────────────────────────
function PurgeModal({ onClose }: { onClose: () => void }) {
    const { data, setData, delete: destroy, processing } = useForm({ days: '365' });

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:400, border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'18px 22px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, background:'#fef2f2', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Trash2 size={16} color="#dc2626"/>
                        </div>
                        <div>
                            <p style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>Purge des logs</p>
                            <p style={{ fontSize:11, color:'#94a3b8' }}>Action irréversible</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={17}/></button>
                </div>
                <div style={{ padding:'20px 22px' }}>
                    <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'10px 13px', marginBottom:16, fontSize:12, color:'#dc2626', lineHeight:1.5 }}>
                        ⚠ Cette action supprimera définitivement tous les logs plus anciens que le nombre de jours spécifié.
                    </div>
                    <div style={{ marginBottom:16 }}>
                        <label style={{ display:'block', fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>
                            Supprimer les logs antérieurs à (jours)
                        </label>
                        <input
                            type="number" min={30} max={3650}
                            value={data.days} onChange={e => setData('days', e.target.value)}
                            style={{ width:'100%', padding:'10px 13px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, outline:'none', boxSizing:'border-box' }}
                        />
                        <p style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Minimum 30 jours · Recommandé : 365 jours</p>
                    </div>
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button
                            onClick={() => destroy(route('admin.audit-logs.purge'), { data: { days: data.days }, onSuccess: onClose })}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {processing ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>}
                            Purger
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────
export default function AuditLogsIndex({ logs, filters, actions, entityTypes, isSA }: Props) {
    const [showPurge,   setShowPurge]   = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [search,      setSearch]      = useState(filters.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/audit-logs', { ...filters, ...params }, { preserveState:true, replace:true });

    const clearFilters = () => router.get('/admin/audit-logs');

    const hasActiveFilters = Object.values(filters).some(v => v && v !== '');

    const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', {
        day:'2-digit', month:'short', year:'numeric',
        hour:'2-digit', minute:'2-digit', second:'2-digit',
    });

    const exportUrl = () => {
        const params = new URLSearchParams(filters).toString();
        return `/admin/audit-logs/export${params ? '?' + params : ''}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs — NSIA Transport"/>
            <style>{`
                .al-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .al-hdr{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
                .al-title{font-size:18px;font-weight:600;color:#1e293b;}
                .al-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .al-hdr-actions{display:flex;gap:8px;}

                .al-toolbar{display:flex;gap:8px;flex-wrap:wrap;}
                .al-search{display:flex;gap:0;flex:1;min-width:220px;}
                .al-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .al-search input:focus{border-color:#1e3a8a;}
                .al-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .al-select{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;}
                .al-date{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;}

                /* Filtres avancés */
                .al-filters{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px 18px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;}

                .al-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 14px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:11px 14px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}

                .u-cell{display:flex;align-items:center;gap:8px;}
                .u-avatar{width:28px;height:28px;border-radius:50%;background:#eff6ff;color:#1d4ed8;font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .u-name{font-weight:500;color:#1e293b;font-size:12px;}
                .u-email{font-size:10px;color:#94a3b8;}

                .action-badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:500;white-space:nowrap;}
                .entity-badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:8px;font-size:10px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-family:monospace;}
                .ip-text{font-size:11px;color:#94a3b8;font-family:monospace;}

                .btn-act{padding:4px 9px;border-radius:6px;font-size:11px;cursor:pointer;border:1px solid #bfdbfe;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;color:#1d4ed8;transition:all .13s;}
                .btn-act:hover{background:#eff6ff;}

                .al-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-top:1px solid #f8fafc;}
                .al-pg-info{font-size:12px;color:#94a3b8;}
                .al-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .al-empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}

                .filter-label{font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:4px;}
                .active-filter-dot{width:7px;height:7px;border-radius:50%;background:#ef4444;display:inline-block;margin-left:4px;vertical-align:middle;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="al-page">

                    {/* Header */}
                    <div className="al-hdr">
                        <div>
                            <h1 className="al-title">Audit Logs</h1>
                            <p className="al-sub">{logs.total.toLocaleString()} événement{logs.total > 1 ? 's' : ''} enregistré{logs.total > 1 ? 's' : ''}</p>
                        </div>
                        <div className="al-hdr-actions">
                            <a href={exportUrl()} download>
                                <Button variant="outline" className="h-10 px-4 text-sm gap-1.5">
                                    <Download size={14}/> Exporter CSV
                                </Button>
                            </a>
                            {isSA && (
                                <Button onClick={() => setShowPurge(true)} variant="outline"
                                        className="h-10 px-4 text-sm gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                                    <Trash2 size={14}/> Purger
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Toolbar recherche + filtres rapides */}
                    <div className="al-toolbar">
                        <form className="al-search" onSubmit={e => { e.preventDefault(); applyFilter({ search, page:'1' }); }}>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par utilisateur, action, IP…"/>
                            <button type="submit"><Search size={14}/></button>
                        </form>
                        <select className="al-select" value={filters.action ?? ''} onChange={e => applyFilter({ action: e.target.value, page:'1' })}>
                            <option value="">Toutes les actions</option>
                            {actions.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
                        </select>
                        <select className="al-select" value={filters.entity_type ?? ''} onChange={e => applyFilter({ entity_type: e.target.value, page:'1' })}>
                            <option value="">Toutes les entités</option>
                            {entityTypes.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <button onClick={() => setShowFilters(s => !s)} style={{ padding:'9px 12px', background: showFilters ? '#eff6ff' : 'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color: showFilters ? '#1d4ed8' : '#64748b', display:'flex', alignItems:'center', gap:5, fontSize:12, fontFamily:'inherit' }}>
                            <Filter size={13}/> Filtres avancés
                            {hasActiveFilters && <span className="active-filter-dot"/>}
                        </button>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                                <X size={12}/> Effacer
                            </button>
                        )}
                    </div>

                    {/* Filtres avancés */}
                    {showFilters && (
                        <div className="al-filters">
                            <div>
                                <label className="filter-label">Date début</label>
                                <input type="date" className="al-date" style={{ width:'100%' }}
                                       value={filters.date_from ?? ''}
                                       onChange={e => applyFilter({ date_from: e.target.value, page:'1' })}/>
                            </div>
                            <div>
                                <label className="filter-label">Date fin</label>
                                <input type="date" className="al-date" style={{ width:'100%' }}
                                       value={filters.date_to ?? ''}
                                       onChange={e => applyFilter({ date_to: e.target.value, page:'1' })}/>
                            </div>
                            {isSA && (
                                <div>
                                    <label className="filter-label">Filiale</label>
                                    <input type="text" placeholder="ID filiale…"
                                           className="al-date" style={{ width:'100%' }}
                                           value={filters.tenant_id ?? ''}
                                           onChange={e => applyFilter({ tenant_id: e.target.value, page:'1' })}/>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tableau */}
                    <div className="al-card">
                        {logs.data.length === 0 ? (
                            <div className="al-empty">Aucun log trouvé.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Utilisateur</th>
                                            <th>Action</th>
                                            <th>Entité</th>
                                            {isSA && <th>Filiale</th>}
                                            <th>IP</th>
                                            <th>Détail</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.data.map(log => {
                                            const s       = getActionStyle(log.action);
                                            const initials = log.user
                                                ? `${log.user.first_name?.[0] ?? ''}${log.user.last_name?.[0] ?? ''}`.toUpperCase()
                                                : '?';
                                            return (
                                                <tr key={log.id}>
                                                    <td>
                                                        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b', whiteSpace:'nowrap' }}>
                                                            <Clock size={11}/>
                                                            {fmt(log.created_at)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {log.user ? (
                                                            <div className="u-cell">
                                                                <div className="u-avatar">{initials}</div>
                                                                <div>
                                                                    <div className="u-name">{log.user.first_name} {log.user.last_name}</div>
                                                                    <div className="u-email">{log.user.email}</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color:'#cbd5e1', fontSize:11 }}>Système</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="action-badge" style={{ background: s.bg, color: s.color }}>
                                                            {log.action.replace(/_/g,' ')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {log.entity_type ? (
                                                            <span className="entity-badge">{log.entity_type}</span>
                                                        ) : <span style={{ color:'#cbd5e1' }}>—</span>}
                                                    </td>
                                                    {isSA && (
                                                        <td style={{ fontSize:11, color:'#64748b' }}>
                                                            {log.tenant?.name ?? <span style={{ color:'#cbd5e1' }}>—</span>}
                                                        </td>
                                                    )}
                                                    <td>
                                                        <span className="ip-text">{log.ip_address ?? '—'}</span>
                                                    </td>
                                                    <td>
                                                        <Link href={route('admin.audit-logs.show', { auditLog: log.id })}
                                                              className="btn-act">
                                                            <Eye size={11}/> Voir
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {logs.last_page > 1 && (
                                    <div className="al-pagination">
                                        <span className="al-pg-info">Page {logs.current_page} / {logs.last_page} · {logs.total.toLocaleString()} logs</span>
                                        <div className="al-pg-links">
                                            <button className="pg-btn" disabled={logs.current_page === 1}
                                                    onClick={() => applyFilter({ page: String(logs.current_page - 1) })}>
                                                <ChevronLeft size={13}/>
                                            </button>
                                            {logs.links.map((link, i) => {
                                                if (i === 0 || i === logs.links.length - 1) return null;
                                                return (
                                                    <button key={`page-${i}`} className={`pg-btn ${link.active ? 'act' : ''}`}
                                                            onClick={() => link.url && applyFilter({ page: link.label })}
                                                            disabled={!link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                );
                                            })}
                                            <button className="pg-btn" disabled={logs.current_page === logs.last_page}
                                                    onClick={() => applyFilter({ page: String(logs.current_page + 1) })}>
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

            {showPurge && <PurgeModal onClose={() => setShowPurge(false)}/>}
        </AppLayout>
    );
}