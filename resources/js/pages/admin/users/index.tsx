import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Eye, Edit2, Trash2,
    UserX, UserCheck, X, ChevronLeft,
    ChevronRight, AlertCircle, Loader2, Filter,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Utilisateurs', href: '/admin/users' },
];

interface Role { name: string; }
interface User {
    id: string; first_name: string; last_name: string;
    email: string; phone: string | null; is_active: boolean;
    blocked_at: string | null; blocked_reason: string | null;
    last_login_at: string | null; created_at: string;
    roles: Role[]; tenant: { name: string } | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number;
    total: number; per_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    users: Paginated<User>;
    filters: { search?: string; role?: string; status?: string };
    roles: string[];
    can: { create: boolean; edit: boolean; block: boolean; unblock: boolean; delete: boolean };
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    super_admin:         { bg: '#EEF2FF', color: '#4338CA' },
    admin_filiale:       { bg: '#ECFDF5', color: '#065F46' },
    souscripteur:        { bg: '#EFF6FF', color: '#1D4ED8' },
    courtier_local:      { bg: '#FFF7ED', color: '#C2410C' },
    partenaire_etranger: { bg: '#FDF4FF', color: '#7E22CE' },
    client:              { bg: '#F9FAFB', color: '#374151' },
};

// ── Modal blocage ─────────────────────────────────────────────
function BlockModal({ user, onClose }: { user: User; onClose: () => void }) {
    const { data, setData, patch, processing, errors, reset } = useForm({ reason: '' });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.users.block', { user: user.id }), {
            onSuccess: () => { reset(); onClose(); },
        });
    };
    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:440, border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'18px 22px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, background:'#fef2f2', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <UserX size={17} color="#dc2626"/>
                        </div>
                        <div>
                            <p style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>Bloquer l'utilisateur</p>
                            <p style={{ fontSize:12, color:'#94a3b8' }}>{user.first_name} {user.last_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={17}/></button>
                </div>
                <form onSubmit={submit} style={{ padding:'20px 22px' }}>
                    <div style={{ marginBottom:16 }}>
                        <label style={{ display:'block', fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>
                            Motif de blocage *
                        </label>
                        <textarea
                            value={data.reason} onChange={e => setData('reason', e.target.value)}
                            rows={3} placeholder="Décrivez la raison du blocage…"
                            style={{ width:'100%', padding:'10px 12px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:`1.5px solid ${errors.reason ? '#ef4444' : '#e2e8f0'}`, borderRadius:9, outline:'none', resize:'vertical', boxSizing:'border-box' }}
                        />
                        {errors.reason && <p style={{ fontSize:11, color:'#ef4444', marginTop:4, display:'flex', alignItems:'center', gap:4 }}><AlertCircle size={11}/>{errors.reason}</p>}
                    </div>
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={processing} className="bg-red-600 hover:bg-red-700 text-white">
                            {processing ? <Loader2 size={14} className="animate-spin"/> : <UserX size={14}/>}
                            Bloquer
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────
export default function UsersIndex({ users, filters, roles, can }: Props) {
    const [blockTarget, setBlockTarget] = useState<User | null>(null);
    const [search,      setSearch]      = useState(filters.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/users', { ...filters, ...params }, { preserveState:true, replace:true });

    const handleUnblock = (user: User) => {
        if (confirm(`Débloquer ${user.first_name} ${user.last_name} ?`))
            router.patch(route('admin.users.unblock', { user: user.id }));
    };

    const handleDelete = (user: User) => {
        if (confirm(`Supprimer définitivement ${user.first_name} ${user.last_name} ?`))
            router.delete(route('admin.users.destroy', { user: user.id }));
    };

    const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Utilisateurs — NSIA Transport"/>
            <style>{`
                .u-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .u-hdr{display:flex;align-items:center;justify-content:space-between;}
                .u-title{font-size:18px;font-weight:600;color:#1e293b;}
                .u-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .u-toolbar{display:flex;gap:8px;flex-wrap:wrap;}
                .u-search{display:flex;gap:0;flex:1;min-width:220px;}
                .u-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .u-search input:focus{border-color:#1e3a8a;}
                .u-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .u-select{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;}
                .u-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:12px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .u-avatar{width:34px;height:34px;border-radius:50%;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .u-name{font-weight:500;color:#1e293b;font-size:13px;}
                .u-email{font-size:11px;color:#94a3b8;margin-top:1px;}
                .s-active{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:500;}
                .s-blocked{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
                .actions{display:flex;gap:5px;flex-wrap:wrap;}
                .btn-act{padding:5px 9px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-edit{color:#0f766e;border-color:#99f6e4;} .btn-edit:hover{background:#f0fdfa;}
                .btn-block{color:#dc2626;border-color:#fecaca;} .btn-block:hover{background:#fef2f2;}
                .btn-unblock{color:#059669;border-color:#a7f3d0;} .btn-unblock:hover{background:#ecfdf5;}
                .btn-del{color:#dc2626;border-color:#fecaca;} .btn-del:hover{background:#fef2f2;}
                .u-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .u-pg-info{font-size:12px;color:#94a3b8;}
                .u-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .u-empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:9px;padding:10px 14px;font-size:12px;color:#15803d;display:flex;align-items:center;gap:6px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="u-page">

                    {/* Header */}
                    <div className="u-hdr">
                        <div>
                            <h1 className="u-title">Utilisateurs</h1>
                            <p className="u-sub">{users.total} utilisateur{users.total > 1 ? 's' : ''}</p>
                        </div>
                        {can.create && (
                            <Link href={route('admin.users.create')}>
                                <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                    <Plus size={15}/> Nouvel utilisateur
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div className="u-toolbar">
                        <form className="u-search" onSubmit={e => { e.preventDefault(); applyFilter({ search, page:'1' }); }}>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email…"/>
                            <button type="submit"><Search size={14}/></button>
                        </form>
                        <select className="u-select" value={filters.role ?? ''} onChange={e => applyFilter({ role: e.target.value, page:'1' })}>
                            <option value="">Tous les rôles</option>
                            {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                        </select>
                        <select className="u-select" value={filters.status ?? ''} onChange={e => applyFilter({ status: e.target.value, page:'1' })}>
                            <option value="">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="blocked">Bloqués</option>
                        </select>
                        {(filters.search || filters.role || filters.status) && (
                            <button onClick={() => router.get('/admin/users')} style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                                <X size={12}/> Effacer
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="u-card">
                        {users.data.length === 0 ? (
                            <div className="u-empty">Aucun utilisateur trouvé.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Utilisateur</th>
                                            <th>Rôle</th>
                                            <th>Filiale</th>
                                            <th>Statut</th>
                                            <th>Dernière connexion</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.data.map((user, i) => {
                                            const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
                                            const colors   = ['#EEF2FF','#ECFDF5','#FFF7ED','#EFF6FF','#FDF4FF'];
                                            const fgColors = ['#4338CA','#065F46','#C2410C','#1D4ED8','#7E22CE'];
                                            const ci       = i % colors.length;
                                            const role     = user.roles?.[0]?.name ?? '';
                                            const rc       = ROLE_COLORS[role] ?? { bg:'#f1f5f9', color:'#64748b' };

                                            return (
                                                <tr key={user.id}>
                                                    <td>
                                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                            <div className="u-avatar" style={{ background: colors[ci], color: fgColors[ci] }}>{initials}</div>
                                                            <div>
                                                                <div className="u-name">{user.first_name} {user.last_name}</div>
                                                                <div className="u-email">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {role
                                                            ? <span style={{ padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:500, background:rc.bg, color:rc.color }}>{role.replace(/_/g,' ')}</span>
                                                            : <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>
                                                        }
                                                    </td>
                                                    <td style={{ fontSize:12, color:'#64748b' }}>{user.tenant?.name ?? '—'}</td>
                                                    <td>
                                                        {user.is_active
                                                            ? <span className="s-active"><span className="s-dot" style={{ background:'#22c55e' }}/>Actif</span>
                                                            : <span className="s-blocked"><span className="s-dot" style={{ background:'#ef4444' }}/>Bloqué</span>
                                                        }
                                                    </td>
                                                    <td style={{ fontSize:12, color:'#94a3b8' }}>{fmt(user.last_login_at)}</td>
                                                    <td>
                                                        <div className="actions">
                                                            <Link href={route('admin.users.show', { user: user.id })} className="btn-act btn-view"><Eye size={12}/> Voir</Link>
                                                            {can.edit && <Link href={route('admin.users.edit', { user: user.id })} className="btn-act btn-edit"><Edit2 size={12}/> Éditer</Link>}
                                                            {can.block && user.is_active && <button className="btn-act btn-block" onClick={() => setBlockTarget(user)}><UserX size={12}/> Bloquer</button>}
                                                            {can.unblock && !user.is_active && <button className="btn-act btn-unblock" onClick={() => handleUnblock(user)}><UserCheck size={12}/> Débloquer</button>}
                                                            {can.delete && <button className="btn-act btn-del" onClick={() => handleDelete(user)}><Trash2 size={12}/> Supprimer</button>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {users.last_page > 1 && (
                                    <div className="u-pagination">
                                        <span className="u-pg-info">Page {users.current_page} / {users.last_page} · {users.total} résultats</span>
                                        <div className="u-pg-links">
                                            <button className="pg-btn" disabled={users.current_page === 1} onClick={() => applyFilter({ page: String(users.current_page - 1) })}><ChevronLeft size={13}/></button>
                                            {users.links.slice(1,-1).map((link, i) => (
                                                <button key={i} className={`pg-btn ${link.active ? 'act' : ''}`} onClick={() => link.url && applyFilter({ page: link.label })} disabled={!link.url} dangerouslySetInnerHTML={{ __html: link.label }}/>
                                            ))}
                                            <button className="pg-btn" disabled={users.current_page === users.last_page} onClick={() => applyFilter({ page: String(users.current_page + 1) })}><ChevronRight size={13}/></button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {blockTarget && <BlockModal user={blockTarget} onClose={() => setBlockTarget(null)}/>}
        </AppLayout>
    );
}