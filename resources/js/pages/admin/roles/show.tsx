import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft, Shield, Users, Lock, Check,
    Search, AlertCircle, Loader2, X, UserCog, ChevronLeft, ChevronRight
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
interface Permission { id: number; name: string; }
interface Role { id: number; name: string; permissions: Permission[]; }
interface User {
    id: string; first_name: string; last_name: string;
    email: string; is_active: boolean;
    tenant: { name: string } | null;
}
interface Paginated<T> {
    data: T[];
    current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    role: Role;
    users: Paginated<User>;
    allPermissions: Record<string, Permission[]>;
}

// ── Modal assigner rôle ───────────────────────────────────────
function AssignRoleModal({ roleId, roleName, onClose }: { roleId: number; roleName: string; onClose: () => void }) {
    const { data, setData, post, processing, errors } = useForm({ user_id: '', role: roleName });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.roles.assign-user'), { onSuccess: onClose });
    };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:440, border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:38, height:38, background:'#eff6ff', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <UserCog size={18} color="#3b82f6"/>
                        </div>
                        <div>
                            <p style={{ fontSize:15, fontWeight:600, color:'#1e293b' }}>Assigner le rôle</p>
                            <p style={{ fontSize:12, color:'#94a3b8' }}>Rôle : {roleName.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}>
                        <X size={18}/>
                    </button>
                </div>

                <form onSubmit={submit} style={{ padding:'20px 24px' }}>
                    <div style={{ marginBottom:20 }}>
                        <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>
                            UUID de l'utilisateur *
                        </label>
                        <input
                            type="text"
                            value={data.user_id}
                            onChange={e => setData('user_id', e.target.value)}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            style={{ width:'100%', padding:'11px 14px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:`1.5px solid ${errors.user_id ? '#ef4444' : '#e2e8f0'}`, borderRadius:9, outline:'none', fontFamily:'monospace' }}
                        />
                        {errors.user_id && <p style={{ fontSize:12, color:'#ef4444', marginTop:4, display:'flex', alignItems:'center', gap:4 }}><AlertCircle size={12}/>{errors.user_id}</p>}
                        <p style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
                            L'assignation remplacera le rôle actuel de l'utilisateur.
                        </p>
                    </div>

                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding:'9px 18px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, cursor:'pointer', color:'#475569', fontFamily:'inherit' }}>
                            Annuler
                        </button>
                        <button type="submit" disabled={processing} style={{ padding:'9px 18px', background:'#1e3a8a', border:'none', borderRadius:8, fontSize:13, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit', opacity: processing ? .7 : 1 }}>
                            {processing ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <UserCog size={14}/>}
                            Assigner
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────
export default function RoleShow({ role, users, allPermissions }: Props) {
    const [showAssign, setShowAssign] = useState(false);
    const [search, setSearch]         = useState('');

    const rolePerms    = new Set(role.permissions.map(p => p.name));
    const moduleGroups = Object.entries(allPermissions);

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.roles.show', { role: role.id }), { search }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title={`Rôle ${role.name} — NSIA Transport`}/>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
                *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
                body{font-family:'DM Sans',sans-serif;background:#f1f5f9;}
                @keyframes spin{to{transform:rotate(360deg);}}

                .page{padding:32px;max-width:1100px;margin:0 auto;}
                .back-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#64748b;text-decoration:none;margin-bottom:20px;transition:color .2s;}
                .back-link:hover{color:#1e3a8a;}

                .header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;}
                .role-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;margin-bottom:8px;}
                .page-sub{font-size:13px;color:#64748b;font-weight:300;}

                .btn-primary{padding:9px 16px;background:#1e3a8a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:background .2s;}
                .btn-primary:hover{background:#1e40af;}

                .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}

                /* Card permissions */
                .card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                .card-title{font-size:14px;font-weight:600;color:#1e293b;padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .perm-module{padding:14px 20px;border-bottom:1px solid #f8fafc;}
                .perm-module:last-child{border-bottom:none;}
                .module-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
                .module-name{font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.08em;}
                .module-count{font-size:11px;color:#94a3b8;}
                .perm-list{display:flex;flex-wrap:wrap;gap:6px;}
                .perm-item{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:14px;font-size:11px;font-weight:500;}
                .perm-yes{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}
                .perm-no{background:#f8fafc;color:#94a3b8;border:1px solid #e2e8f0;text-decoration:line-through;opacity:.6;}

                /* Table utilisateurs */
                .table-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                .table-header{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:12px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .avatar{width:32px;height:32px;border-radius:50%;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .user-cell{display:flex;align-items:center;gap:10px;}
                .user-name{font-weight:500;color:#1e293b;}
                .user-email{font-size:11px;color:#94a3b8;margin-top:1px;}
                .status-dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:5px;}

                .search-form{display:flex;gap:0;}
                .search-input{padding:8px 12px;font-size:12px;font-family:inherit;color:#1e293b;background:#f8fafc;border:1.5px solid #e2e8f0;border-right:none;border-radius:7px 0 0 7px;outline:none;width:200px;}
                .search-btn{padding:8px 12px;background:#1e3a8a;border:none;border-radius:0 7px 7px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}

                .pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .pagination-info{font-size:12px;color:#94a3b8;}
                .pagination-links{display:flex;gap:4px;}
                .page-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .15s;}
                .page-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .page-btn.active{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .page-btn:disabled{opacity:.4;cursor:not-allowed;}
                .empty-row td{text-align:center;color:#94a3b8;padding:40px;}
            `}</style>

            <div className="page">
                <Link href={route('admin.roles.index')} className="back-link">
                    <ArrowLeft size={15}/> Retour aux rôles
                </Link>

                {/* Header */}
                <div className="header">
                    <div>
                        <div className="role-badge"><Shield size={13}/>{role.name.replace(/_/g, ' ')}</div>
                        <p className="page-sub">
                            {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''} · {users.total} utilisateur{users.total > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAssign(true)}>
                        <UserCog size={15}/> Assigner à un utilisateur
                    </button>
                </div>

                {/* Grille permissions */}
                <div className="grid">
                    {moduleGroups.map(([module, perms]) => {
                        const has    = perms.filter(p => rolePerms.has(p.name));
                        const hasNot = perms.filter(p => !rolePerms.has(p.name));
                        return (
                            <div key={module} className="card">
                                <div className="card-title">
                                    <Lock size={14} color="#94a3b8"/>
                                    <span style={{ textTransform:'capitalize' }}>{module}</span>
                                    <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8', fontWeight:400 }}>
                                        {has.length}/{perms.length}
                                    </span>
                                </div>
                                <div className="perm-module">
                                    <div className="perm-list">
                                        {perms.map(perm => {
                                            const active = rolePerms.has(perm.name);
                                            const action = perm.name.split('.')[1];
                                            return (
                                                <span key={perm.id} className={`perm-item ${active ? 'perm-yes' : 'perm-no'}`}>
                                                    {active && <Check size={11}/>}
                                                    {action}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Table utilisateurs */}
                <div className="table-card">
                    <div className="table-header">
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <Users size={16} color="#94a3b8"/>
                            <span style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>
                                Utilisateurs avec ce rôle
                            </span>
                            <span style={{ fontSize:12, color:'#94a3b8' }}>({users.total})</span>
                        </div>
                        <form onSubmit={applySearch} className="search-form">
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                   placeholder="Rechercher…" className="search-input"/>
                            <button type="submit" className="search-btn"><Search size={13}/></button>
                        </form>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Filiale</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.length === 0 ? (
                                <tr className="empty-row"><td colSpan={3}>Aucun utilisateur avec ce rôle.</td></tr>
                            ) : users.data.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar">
                                                {user.first_name[0]}{user.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="user-name">{user.first_name} {user.last_name}</div>
                                                <div className="user-email">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color:'#64748b', fontSize:12 }}>
                                        {user.tenant?.name ?? <span style={{ color:'#cbd5e1' }}>—</span>}
                                    </td>
                                    <td>
                                        <span style={{ display:'inline-flex', alignItems:'center', fontSize:12, fontWeight:500, padding:'3px 8px', borderRadius:12, background: user.is_active ? '#f0fdf4' : '#fef2f2', color: user.is_active ? '#15803d' : '#991b1b' }}>
                                            <span className="status-dot" style={{ background: user.is_active ? '#22c55e' : '#ef4444' }}/>
                                            {user.is_active ? 'Actif' : 'Bloqué'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.last_page > 1 && (
                        <div className="pagination">
                            <span className="pagination-info">
                                Page {users.current_page} / {users.last_page} · {users.total} utilisateurs
                            </span>
                            <div className="pagination-links">
                                <button className="page-btn" disabled={users.current_page === 1}
                                        onClick={() => router.get(route('admin.roles.show', { role: role.id }), { page: users.current_page - 1 }, { preserveState:true })}>
                                    <ChevronLeft size={13}/>
                                </button>
                                {users.links.slice(1,-1).map((link, i) => (
                                    <button key={i} className={`page-btn${link.active ? ' active' : ''}`}
                                            onClick={() => link.url && router.get(route('admin.roles.show', { role: role.id }), { page: link.label }, { preserveState:true })}
                                            disabled={!link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}/>
                                ))}
                                <button className="page-btn" disabled={users.current_page === users.last_page}
                                        onClick={() => router.get(route('admin.roles.show', { role: role.id }), { page: users.current_page + 1 }, { preserveState:true })}>
                                    <ChevronRight size={13}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showAssign && (
                <AssignRoleModal
                    roleId={role.id}
                    roleName={role.name}
                    onClose={() => setShowAssign(false)}
                />
            )}
        </>
    );
}