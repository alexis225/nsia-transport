import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    ArrowLeft, Shield, Users, Lock, Check,
    Search, UserCog, ChevronLeft, ChevronRight,
    X, AlertCircle, Loader2,
} from 'lucide-react';

interface Permission { id: number; name: string; }
interface Role { id: number; name: string; permissions: Permission[]; }
interface User {
    id: string; first_name: string; last_name: string;
    email: string; is_active: boolean;
    tenant: { name: string } | null;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    role:           Role;
    users:          Paginated<User>;
    allPermissions: Record<string, Permission[]>;
}

const ROLE_COLORS: Record<string, { bg: string; color: string; avatarBg: string; avatarColor: string }> = {
    super_admin:         { bg:'#EEF2FF', color:'#4338CA', avatarBg:'#4338CA', avatarColor:'#fff' },
    admin_filiale:       { bg:'#ECFDF5', color:'#065F46', avatarBg:'#065F46', avatarColor:'#fff' },
    souscripteur:        { bg:'#EFF6FF', color:'#1D4ED8', avatarBg:'#1D4ED8', avatarColor:'#fff' },
    courtier_local:      { bg:'#FFF7ED', color:'#C2410C', avatarBg:'#C2410C', avatarColor:'#fff' },
    partenaire_etranger: { bg:'#FDF4FF', color:'#7E22CE', avatarBg:'#7E22CE', avatarColor:'#fff' },
    client:              { bg:'#F9FAFB', color:'#374151', avatarBg:'#374151', avatarColor:'#fff' },
};

// ── Modal assigner rôle ───────────────────────────────────────
function AssignModal({ roleId, roleName, onClose }: { roleId: number; roleName: string; onClose: () => void }) {
    const { data, setData, post, processing, errors } = useForm({ user_id:'', role: roleName });

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:420, border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'18px 22px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, background:'#eff6ff', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <UserCog size={17} color="#3b82f6"/>
                        </div>
                        <div>
                            <p style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>Assigner le rôle</p>
                            <p style={{ fontSize:11, color:'#94a3b8' }}>{roleName.replace(/_/g,' ')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={17}/></button>
                </div>
                <div style={{ padding:'20px 22px' }}>
                    <div style={{ marginBottom:16 }}>
                        <label style={{ display:'block', fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>UUID Utilisateur *</label>
                        <input
                            type="text" value={data.user_id} onChange={e => setData('user_id', e.target.value)}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            style={{ width:'100%', padding:'10px 13px', fontSize:12, fontFamily:'monospace', color:'#1e293b', background:'#f8fafc', border:`1.5px solid ${errors.user_id ? '#ef4444' : '#e2e8f0'}`, borderRadius:9, outline:'none', boxSizing:'border-box' }}
                        />
                        {errors.user_id && <p style={{ fontSize:11, color:'#ef4444', marginTop:4, display:'flex', alignItems:'center', gap:3 }}><AlertCircle size={11}/>{errors.user_id}</p>}
                        <p style={{ fontSize:11, color:'#94a3b8', marginTop:5 }}>Remplacera le rôle actuel de l'utilisateur.</p>
                    </div>
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button onClick={e => { e.preventDefault(); post(route('admin.roles.assign-user'), { onSuccess: onClose }); }} disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white">
                            {processing ? <Loader2 size={13} className="animate-spin"/> : <UserCog size={13}/>}
                            Assigner
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────
export default function RoleShow({ role, users, allPermissions }: Props) {
    const [showAssign, setShowAssign] = useState(false);
    const [search,     setSearch]     = useState('');

    const rc       = ROLE_COLORS[role.name] ?? { bg:'#f1f5f9', color:'#64748b', avatarBg:'#475569', avatarColor:'#fff' };
    const rolePerms = new Set(role.permissions.map(p => p.name));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Rôles & Permissions', href: '/admin/roles' },
        { title: role.name.replace(/_/g,' ') },
    ];

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.roles.show', { role: role.id }), { search }, { preserveState:true, replace:true });
    };

    const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Rôle ${role.name} — NSIA Transport`}/>
            <style>{`
                .rs-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .rs-hdr{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
                .rs-hdr-left{display:flex;align-items:center;gap:12px;}
                .rs-avatar{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;}
                .rs-name{font-size:18px;font-weight:600;color:#1e293b;}
                .rs-sub{font-size:12px;color:#94a3b8;margin-top:2px;}

                /* Permissions grid */
                .perm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;}
                .perm-module-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                .perm-module-hdr{padding:10px 14px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;}
                .perm-module-name{font-size:12px;font-weight:600;color:#1e293b;text-transform:capitalize;}
                .perm-module-count{font-size:10px;color:#94a3b8;}
                .perm-module-body{padding:10px 14px;display:flex;flex-wrap:wrap;gap:5px;}
                .perm-yes{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:500;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}
                .perm-no{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:400;background:#f8fafc;color:#94a3b8;border:1px solid #e2e8f0;text-decoration:line-through;opacity:.5;}

                /* Table users */
                .rs-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .rs-card-hdr{padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
                .rs-card-ttl{font-size:13px;font-weight:600;color:#1e293b;display:flex;align-items:center;gap:7px;}
                .rs-search{display:flex;gap:0;}
                .rs-search input{padding:7px 12px;font-size:12px;font-family:inherit;color:#1e293b;background:#f8fafc;border:1.5px solid #e2e8f0;border-right:none;border-radius:7px 0 0 7px;outline:none;width:180px;}
                .rs-search button{padding:7px 11px;background:#1e3a8a;border:none;border-radius:0 7px 7px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:9px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:12px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .u-avatar{width:32px;height:32px;border-radius:50%;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .u-name{font-weight:500;color:#1e293b;font-size:13px;}
                .u-email{font-size:11px;color:#94a3b8;margin-top:1px;}
                .s-active{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:500;}
                .s-blocked{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
                .rs-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .rs-pg-info{font-size:12px;color:#94a3b8;}
                .rs-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .rs-empty{padding:32px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="rs-page">

                    {/* Header */}
                    <div className="rs-hdr">
                        <div className="rs-hdr-left">
                            <Link href="/admin/roles" style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'#64748b', textDecoration:'none' }}>
                                <ArrowLeft size={15}/>
                            </Link>
                            <div className="rs-avatar" style={{ background: rc.avatarBg, color: rc.avatarColor }}>
                                {role.name.slice(0,2).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="rs-name">{role.name.replace(/_/g,' ')}</h1>
                                <p className="rs-sub">
                                    {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''} · {users.total} utilisateur{users.total > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => setShowAssign(true)} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                            <UserCog size={15}/> Assigner à un utilisateur
                        </Button>
                    </div>

                    {/* Permissions par module */}
                    <div className="perm-grid">
                        {Object.entries(allPermissions).map(([module, perms]) => {
                            const has    = perms.filter(p => rolePerms.has(p.name));
                            const hasNot = perms.filter(p => !rolePerms.has(p.name));
                            return (
                                <div key={module} className="perm-module-card">
                                    <div className="perm-module-hdr">
                                        <span className="perm-module-name">{module}</span>
                                        <span className="perm-module-count">{has.length}/{perms.length}</span>
                                    </div>
                                    <div className="perm-module-body">
                                        {perms.map(perm => {
                                            const active = rolePerms.has(perm.name);
                                            const action = perm.name.split('.')[1];
                                            return (
                                                <span key={perm.id} className={active ? 'perm-yes' : 'perm-no'}>
                                                    {active && <Check size={9}/>}
                                                    {action}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Table utilisateurs */}
                    <div className="rs-card">
                        <div className="rs-card-hdr">
                            <span className="rs-card-ttl">
                                <Users size={15} color="#94a3b8"/>
                                Utilisateurs avec ce rôle
                                <span style={{ fontSize:11, color:'#94a3b8', fontWeight:400 }}>({users.total})</span>
                            </span>
                            <form onSubmit={applySearch} className="rs-search">
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"/>
                                <button type="submit"><Search size={13}/></button>
                            </form>
                        </div>

                        {users.data.length === 0 ? (
                            <div className="rs-empty">Aucun utilisateur avec ce rôle.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Utilisateur</th>
                                            <th>Filiale</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.data.map(user => {
                                            const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
                                            return (
                                                <tr key={user.id}>
                                                    <td>
                                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                            <div className="u-avatar">{initials}</div>
                                                            <div>
                                                                <div className="u-name">{user.first_name} {user.last_name}</div>
                                                                <div className="u-email">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontSize:12, color:'#64748b' }}>{user.tenant?.name ?? '—'}</td>
                                                    <td>
                                                        {user.is_active
                                                            ? <span className="s-active"><span className="s-dot" style={{ background:'#22c55e' }}/>Actif</span>
                                                            : <span className="s-blocked"><span className="s-dot" style={{ background:'#ef4444' }}/>Bloqué</span>
                                                        }
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {users.last_page > 1 && (
                                    <div className="rs-pagination">
                                        <span className="rs-pg-info">Page {users.current_page} / {users.last_page} · {users.total} utilisateurs</span>
                                        <div className="rs-pg-links">
                                            <button className="pg-btn" disabled={users.current_page === 1}
                                                onClick={() => router.get(route('admin.roles.show', { role: role.id }), { page: users.current_page - 1 }, { preserveState:true })}>
                                                <ChevronLeft size={13}/>
                                            </button>
                                            {users.links.slice(1,-1).map((link, i) => (
                                                <button key={i} className={`pg-btn ${link.active ? 'act' : ''}`}
                                                    onClick={() => link.url && router.get(route('admin.roles.show', { role: role.id }), { page: link.label }, { preserveState:true })}
                                                    disabled={!link.url}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}/>
                                            ))}
                                            <button className="pg-btn" disabled={users.current_page === users.last_page}
                                                onClick={() => router.get(route('admin.roles.show', { role: role.id }), { page: users.current_page + 1 }, { preserveState:true })}>
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

            {showAssign && <AssignModal roleId={role.id} roleName={role.name} onClose={() => setShowAssign(false)}/>}
        </AppLayout>
    );
}