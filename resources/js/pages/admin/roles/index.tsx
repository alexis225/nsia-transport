import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Search, Plus, Edit2, Trash2, Eye, X,
    Shield, ShieldCheck, Users, Lock, AlertCircle, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
interface Permission { id: number; name: string; }
interface Role {
    id: number;
    name: string;
    users_count: number;
    permissions: Permission[];
}
interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    roles: Paginated<Role>;
    permissions: Record<string, Permission[]>;
    filters: { search?: string };
}

// ── Couleurs rôles ────────────────────────────────────────────
const roleColors: Record<string, { bg: string; color: string; border: string }> = {
    super_admin:         { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
    admin_filiale:       { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
    souscripteur:        { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    courtier_local:      { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    partenaire_etranger: { bg: '#FDF4FF', color: '#7E22CE', border: '#E9D5FF' },
    client:              { bg: '#F9FAFB', color: '#374151', border: '#E5E7EB' },
};

// ── Modal créer rôle ──────────────────────────────────────────
function CreateRoleModal({
    permissions, onClose,
}: { permissions: Record<string, Permission[]>; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string; permissions: string[];
    }>({ name: '', permissions: [] });

    const toggle = (name: string) => {
        setData('permissions', data.permissions.includes(name)
            ? data.permissions.filter(p => p !== name)
            : [...data.permissions, name]
        );
    };

    const toggleModule = (perms: Permission[]) => {
        const names    = perms.map(p => p.name);
        const allHave  = names.every(n => data.permissions.includes(n));
        setData('permissions', allHave
            ? data.permissions.filter(p => !names.includes(p))
            : [...new Set([...data.permissions, ...names])]
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.roles.store'), { onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:600, maxHeight:'90vh', display:'flex', flexDirection:'column', border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,0.15)' }}>
                {/* Header */}
                <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:38, height:38, background:'#eff6ff', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Shield size={18} color="#3b82f6"/>
                        </div>
                        <div>
                            <p style={{ fontSize:15, fontWeight:600, color:'#1e293b' }}>Nouveau rôle</p>
                            <p style={{ fontSize:12, color:'#94a3b8' }}>Définissez le nom et les permissions</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}>
                        <X size={18}/>
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
                    <form onSubmit={submit}>
                        {/* Nom */}
                        <div style={{ marginBottom:20 }}>
                            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>
                                Nom du rôle *
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="ex: responsable_regional"
                                style={{ width:'100%', padding:'11px 14px', fontSize:14, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:`1.5px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`, borderRadius:9, outline:'none' }}
                            />
                            {errors.name && <p style={{ fontSize:12, color:'#ef4444', marginTop:4, display:'flex', alignItems:'center', gap:4 }}><AlertCircle size={12}/>{errors.name}</p>}
                        </div>

                        {/* Permissions par module */}
                        <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>
                            Permissions ({data.permissions.length} sélectionnée{data.permissions.length > 1 ? 's' : ''})
                        </label>

                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                            {Object.entries(permissions).map(([module, perms]) => {
                                const allChecked = perms.every(p => data.permissions.includes(p.name));
                                const someChecked = perms.some(p => data.permissions.includes(p.name));
                                return (
                                    <div key={module} style={{ border:'1.5px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                                        {/* Header module */}
                                        <div
                                            onClick={() => toggleModule(perms)}
                                            style={{ padding:'10px 14px', background: allChecked ? '#eff6ff' : someChecked ? '#f8fafc' : '#f8fafc', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', borderBottom:'1px solid #f1f5f9' }}
                                        >
                                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                <div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${allChecked ? '#3b4fd8' : '#cbd5e1'}`, background: allChecked ? '#3b4fd8' : someChecked ? '#e0e7ff' : '#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    {allChecked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                    {someChecked && !allChecked && <div style={{ width:6, height:2, background:'#3b4fd8', borderRadius:1 }}/>}
                                                </div>
                                                <span style={{ fontSize:13, fontWeight:600, color:'#1e293b', textTransform:'capitalize' }}>{module}</span>
                                            </div>
                                            <span style={{ fontSize:11, color:'#94a3b8' }}>{perms.length} permission{perms.length > 1 ? 's' : ''}</span>
                                        </div>
                                        {/* Permissions */}
                                        <div style={{ padding:'10px 14px', display:'flex', flexWrap:'wrap', gap:8 }}>
                                            {perms.map(perm => {
                                                const active = data.permissions.includes(perm.name);
                                                const action = perm.name.split('.')[1];
                                                return (
                                                    <label key={perm.id} onClick={() => toggle(perm.name)} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', padding:'5px 10px', borderRadius:20, border:`1px solid ${active ? '#c7d2fe' : '#e2e8f0'}`, background: active ? '#eff6ff' : '#fff', transition:'all .15s' }}>
                                                        <div style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${active ? '#3b4fd8' : '#cbd5e1'}`, background: active ? '#3b4fd8' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                            {active && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                        </div>
                                                        <span style={{ fontSize:12, color: active ? '#3730a3' : '#64748b', fontWeight: active ? 500 : 400 }}>{action}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button onClick={onClose} style={{ padding:'9px 18px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, cursor:'pointer', color:'#475569', fontFamily:'inherit' }}>
                        Annuler
                    </button>
                    <button onClick={submit as any} disabled={processing} style={{ padding:'9px 18px', background:'#1e3a8a', border:'none', borderRadius:8, fontSize:13, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit', opacity: processing ? .7 : 1 }}>
                        {processing ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Plus size={14}/>}
                        Créer le rôle
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal éditer rôle ─────────────────────────────────────────
function EditRoleModal({
    role, permissions, onClose,
}: { role: Role; permissions: Record<string, Permission[]>; onClose: () => void }) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        permissions: role.permissions.map(p => p.name),
    });

    const toggle = (name: string) => {
        setData('permissions', data.permissions.includes(name)
            ? data.permissions.filter(p => p !== name)
            : [...data.permissions, name]
        );
    };

    const toggleModule = (perms: Permission[]) => {
        const names   = perms.map(p => p.name);
        const allHave = names.every(n => data.permissions.includes(n));
        setData('permissions', allHave
            ? data.permissions.filter(p => !names.includes(p))
            : [...new Set([...data.permissions, ...names])]
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.roles.update', { role: role.id }), { onSuccess: onClose });
    };

    const isProtected = ['super_admin'].includes(role.name);

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:600, maxHeight:'90vh', display:'flex', flexDirection:'column', border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,0.15)' }}>
                <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:38, height:38, background:'#f0fdf4', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <ShieldCheck size={18} color="#16a34a"/>
                        </div>
                        <div>
                            <p style={{ fontSize:15, fontWeight:600, color:'#1e293b' }}>Modifier le rôle</p>
                            <p style={{ fontSize:12, color:'#94a3b8' }}>{role.name} · {role.users_count} utilisateur{role.users_count > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}>
                        <X size={18}/>
                    </button>
                </div>

                <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
                    <form onSubmit={submit}>
                        <div style={{ marginBottom:20 }}>
                            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Nom du rôle</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                disabled={isProtected}
                                style={{ width:'100%', padding:'11px 14px', fontSize:14, fontFamily:'inherit', color:'#1e293b', background: isProtected ? '#f8fafc' : '#f8fafc', border:`1.5px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`, borderRadius:9, outline:'none', opacity: isProtected ? .7 : 1 }}
                            />
                            {isProtected && <p style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Ce rôle système ne peut pas être renommé.</p>}
                            {errors.name && <p style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{errors.name}</p>}
                        </div>

                        <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>
                            Permissions ({data.permissions.length} sélectionnée{data.permissions.length > 1 ? 's' : ''})
                        </label>

                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                            {Object.entries(permissions).map(([module, perms]) => {
                                const allChecked  = perms.every(p => data.permissions.includes(p.name));
                                const someChecked = perms.some(p => data.permissions.includes(p.name));
                                return (
                                    <div key={module} style={{ border:'1.5px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                                        <div onClick={() => toggleModule(perms)} style={{ padding:'10px 14px', background: allChecked ? '#eff6ff' : '#f8fafc', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', borderBottom:'1px solid #f1f5f9' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                <div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${allChecked ? '#3b4fd8' : '#cbd5e1'}`, background: allChecked ? '#3b4fd8' : someChecked ? '#e0e7ff' : '#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    {allChecked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                    {someChecked && !allChecked && <div style={{ width:6, height:2, background:'#3b4fd8', borderRadius:1 }}/>}
                                                </div>
                                                <span style={{ fontSize:13, fontWeight:600, color:'#1e293b', textTransform:'capitalize' }}>{module}</span>
                                            </div>
                                            <span style={{ fontSize:11, color:'#94a3b8' }}>{perms.length} permission{perms.length > 1 ? 's' : ''}</span>
                                        </div>
                                        <div style={{ padding:'10px 14px', display:'flex', flexWrap:'wrap', gap:8 }}>
                                            {perms.map(perm => {
                                                const active = data.permissions.includes(perm.name);
                                                const action = perm.name.split('.')[1];
                                                return (
                                                    <label key={perm.id} onClick={() => toggle(perm.name)} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', padding:'5px 10px', borderRadius:20, border:`1px solid ${active ? '#c7d2fe' : '#e2e8f0'}`, background: active ? '#eff6ff' : '#fff', transition:'all .15s' }}>
                                                        <div style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${active ? '#3b4fd8' : '#cbd5e1'}`, background: active ? '#3b4fd8' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                            {active && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                        </div>
                                                        <span style={{ fontSize:12, color: active ? '#3730a3' : '#64748b', fontWeight: active ? 500 : 400 }}>{action}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </form>
                </div>

                <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button onClick={onClose} style={{ padding:'9px 18px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, cursor:'pointer', color:'#475569', fontFamily:'inherit' }}>Annuler</button>
                    <button onClick={submit as any} disabled={processing} style={{ padding:'9px 18px', background:'#1e3a8a', border:'none', borderRadius:8, fontSize:13, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit', opacity: processing ? .7 : 1 }}>
                        {processing ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <ShieldCheck size={14}/>}
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────
export default function RolesIndex({ roles, permissions, filters }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editRole, setEditRole]     = useState<Role | null>(null);
    const [search, setSearch]         = useState(filters.search ?? '');

    const applyFilter = (params: Record<string, string>) => {
        router.get(route('admin.roles.index'), { ...filters, ...params }, { preserveState:true, replace:true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter({ search, page: '1' });
    };

    const handleDelete = (role: Role) => {
        if (confirm(`Supprimer le rôle « ${role.name} » ?`)) {
            router.delete(route('admin.roles.destroy', { role: role.id }));
        }
    };

    const moduleCount = (role: Role) => {
        const modules = new Set(role.permissions.map(p => p.name.split('.')[0]));
        return modules.size;
    };

    return (
        <>
            <Head title="Rôles & Permissions — NSIA Transport"/>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
                *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
                body{font-family:'DM Sans',sans-serif;background:#f1f5f9;}
                @keyframes spin{to{transform:rotate(360deg);}}

                .page{padding:32px;max-width:1100px;margin:0 auto;}
                .page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;}
                .page-title{font-size:22px;font-weight:600;color:#1e293b;}
                .page-sub{font-size:13px;color:#64748b;font-weight:300;margin-top:2px;}

                .btn-primary{padding:9px 16px;background:#1e3a8a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:background .2s;}
                .btn-primary:hover{background:#1e40af;}

                .toolbar{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
                .search-form{display:flex;gap:0;flex:1;min-width:240px;}
                .search-input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .search-input:focus{border-color:#1e3a8a;}
                .search-btn{padding:9px 14px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}

                .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}

                .role-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;transition:box-shadow .2s;}
                .role-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.08);}
                .role-card-header{padding:18px 20px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #f1f5f9;}
                .role-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid;}
                .role-card-body{padding:14px 20px;}
                .role-stat{display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b;margin-bottom:8px;}
                .perm-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;}
                .perm-tag{padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:11px;color:#475569;}
                .perm-more{padding:3px 8px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;font-size:11px;color:#1d4ed8;font-weight:500;}
                .role-card-footer{padding:12px 20px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;}
                .btn-sm{padding:6px 12px;border-radius:7px;font-size:12px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:5px;font-family:inherit;transition:all .15s;background:none;}
                .btn-edit{color:#1d4ed8;border-color:#bfdbfe;}
                .btn-edit:hover{background:#eff6ff;}
                .btn-view{color:#0f766e;border-color:#99f6e4;}
                .btn-view:hover{background:#f0fdfa;}
                .btn-del{color:#dc2626;border-color:#fecaca;}
                .btn-del:hover{background:#fef2f2;}

                .pagination{display:flex;align-items:center;justify-content:space-between;margin-top:20px;}
                .pagination-info{font-size:12px;color:#94a3b8;}
                .pagination-links{display:flex;gap:4px;}
                .page-btn{width:32px;height:32px;border-radius:7px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .15s;}
                .page-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .page-btn.active{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .page-btn:disabled{opacity:.4;cursor:not-allowed;}

                .empty{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:60px;text-align:center;color:#94a3b8;}
                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;font-size:13px;color:#15803d;margin-bottom:20px;display:flex;align-items:center;gap:8px;}
            `}</style>

            <div className="page">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Rôles & Permissions</h1>
                        <p className="page-sub">{roles.total} rôle{roles.total > 1 ? 's' : ''} configuré{roles.total > 1 ? 's' : ''}</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={15}/> Nouveau rôle
                    </button>
                </div>

                {/* Toolbar */}
                <div className="toolbar">
                    <form onSubmit={handleSearch} className="search-form">
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                               placeholder="Rechercher un rôle…" className="search-input"/>
                        <button type="submit" className="search-btn"><Search size={15}/></button>
                    </form>
                    {filters.search && (
                        <button onClick={() => router.get(route('admin.roles.index'))}
                                style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                            <X size={13}/> Effacer
                        </button>
                    )}
                </div>

                {/* Grille rôles */}
                {roles.data.length === 0 ? (
                    <div className="empty">Aucun rôle trouvé.</div>
                ) : (
                    <div className="grid">
                        {roles.data.map(role => {
                            const colors = roleColors[role.name] ?? roleColors.client;
                            const visiblePerms = role.permissions.slice(0, 5);
                            const remaining    = role.permissions.length - visiblePerms.length;
                            const protected_   = ['super_admin', 'admin_filiale', 'souscripteur', 'courtier_local', 'partenaire_etranger', 'client'].includes(role.name);

                            return (
                                <div key={role.id} className="role-card">
                                    <div className="role-card-header">
                                        <div>
                                            <span className="role-badge" style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}>
                                                <Shield size={12}/> {role.name.replace(/_/g, ' ')}
                                            </span>
                                            {protected_ && (
                                                <span style={{ marginLeft:6, fontSize:10, color:'#94a3b8', display:'inline-flex', alignItems:'center', gap:3 }}>
                                                    <Lock size={10}/> système
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="role-card-body">
                                        <div className="role-stat">
                                            <Users size={13} color="#94a3b8"/>
                                            <span>{role.users_count} utilisateur{role.users_count > 1 ? 's' : ''}</span>
                                            <span style={{ margin:'0 4px', color:'#e2e8f0' }}>·</span>
                                            <Lock size={12} color="#94a3b8"/>
                                            <span>{role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}</span>
                                            <span style={{ margin:'0 4px', color:'#e2e8f0' }}>·</span>
                                            <span>{moduleCount(role)} module{moduleCount(role) > 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="perm-tags">
                                            {visiblePerms.map(p => (
                                                <span key={p.id} className="perm-tag">
                                                    {p.name.replace('.', ' ')}
                                                </span>
                                            ))}
                                            {remaining > 0 && (
                                                <span className="perm-more">+{remaining} autres</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="role-card-footer">
                                        <div style={{ display:'flex', gap:6 }}>
                                            <button className="btn-sm btn-edit" onClick={() => setEditRole(role)}>
                                                <Edit2 size={12}/> Modifier
                                            </button>
                                            <Link href={route('admin.roles.show', { role: role.id })}
                                                  className="btn-sm btn-view" style={{ textDecoration:'none' }}>
                                                <Eye size={12}/> Détail
                                            </Link>
                                        </div>
                                        {!protected_ && (
                                            <button className="btn-sm btn-del" onClick={() => handleDelete(role)}>
                                                <Trash2 size={12}/> Supprimer
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {roles.last_page > 1 && (
                    <div className="pagination">
                        <span className="pagination-info">
                            Page {roles.current_page} / {roles.last_page} · {roles.total} rôles
                        </span>
                        <div className="pagination-links">
                            <button className="page-btn" disabled={roles.current_page === 1}
                                    onClick={() => applyFilter({ page: String(roles.current_page - 1) })}>
                                <ChevronLeft size={14}/>
                            </button>
                            {roles.links.slice(1, -1).map((link, i) => (
                                <button key={i} className={`page-btn${link.active ? ' active' : ''}`}
                                        onClick={() => link.url && applyFilter({ page: link.label })}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}/>
                            ))}
                            <button className="page-btn" disabled={roles.current_page === roles.last_page}
                                    onClick={() => applyFilter({ page: String(roles.current_page + 1) })}>
                                <ChevronRight size={14}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showCreate && <CreateRoleModal permissions={permissions} onClose={() => setShowCreate(false)}/>}
            {editRole   && <EditRoleModal   role={editRole} permissions={permissions} onClose={() => setEditRole(null)}/>}
        </>
    );
}