import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Eye, Edit2, Trash2, X,
    ChevronLeft, ChevronRight, Shield, Lock,
    Users, AlertCircle, Loader2, Check,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Rôles & Permissions', href: '/admin/roles' },
];

interface Permission { id: number; name: string; }
interface Role {
    id: number; name: string; users_count: number;
    permissions: Permission[];
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    roles:       Paginated<Role>;
    permissions: Record<string, Permission[]>;
    filters:     { search?: string };
}

const ROLE_COLORS: Record<string, { bg: string; color: string; avatarBg: string; avatarColor: string }> = {
    super_admin:         { bg:'#EEF2FF', color:'#4338CA', avatarBg:'#4338CA', avatarColor:'#fff' },
    admin_filiale:       { bg:'#ECFDF5', color:'#065F46', avatarBg:'#065F46', avatarColor:'#fff' },
    souscripteur:        { bg:'#EFF6FF', color:'#1D4ED8', avatarBg:'#1D4ED8', avatarColor:'#fff' },
    courtier_local:      { bg:'#FFF7ED', color:'#C2410C', avatarBg:'#C2410C', avatarColor:'#fff' },
    partenaire_etranger: { bg:'#FDF4FF', color:'#7E22CE', avatarBg:'#7E22CE', avatarColor:'#fff' },
    client:              { bg:'#F9FAFB', color:'#374151', avatarBg:'#374151', avatarColor:'#fff' },
};

const PROTECTED = ['super_admin','admin_filiale','souscripteur','courtier_local','partenaire_etranger','client'];

// ── Modal créer rôle ──────────────────────────────────────────
function CreateModal({ permissions, onClose }: { permissions: Record<string, Permission[]>; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm<{ name: string; permissions: string[] }>({ name:'', permissions:[] });

    const toggle = (name: string) =>
        setData('permissions', data.permissions.includes(name)
            ? data.permissions.filter(p => p !== name)
            : [...data.permissions, name]);

    const toggleModule = (perms: Permission[]) => {
        const names = perms.map(p => p.name);
        const all   = names.every(n => data.permissions.includes(n));
        setData('permissions', all
            ? data.permissions.filter(p => !names.includes(p))
            : [...new Set([...data.permissions, ...names])]);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.roles.store'), { onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:580, maxHeight:'90vh', display:'flex', flexDirection:'column', border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'18px 22px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, background:'#eff6ff', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Shield size={17} color="#3b82f6"/>
                        </div>
                        <div>
                            <p style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>Nouveau rôle</p>
                            <p style={{ fontSize:11, color:'#94a3b8' }}>Définissez le nom et les permissions</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={17}/></button>
                </div>
                <div style={{ overflowY:'auto', flex:1, padding:'18px 22px' }}>
                    <form onSubmit={submit}>
                        <div style={{ marginBottom:16 }}>
                            <label style={{ display:'block', fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>Nom du rôle *</label>
                            <input
                                value={data.name} onChange={e => setData('name', e.target.value)}
                                placeholder="ex: responsable_regional"
                                style={{ width:'100%', padding:'10px 13px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:`1.5px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`, borderRadius:9, outline:'none', boxSizing:'border-box' }}
                            />
                            {errors.name && <p style={{ fontSize:11, color:'#ef4444', marginTop:4, display:'flex', alignItems:'center', gap:3 }}><AlertCircle size={11}/>{errors.name}</p>}
                        </div>
                        <label style={{ display:'block', fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
                            Permissions ({data.permissions.length} sélectionnée{data.permissions.length > 1 ? 's' : ''})
                        </label>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {Object.entries(permissions).map(([module, perms]) => {
                                const allChecked  = perms.every(p => data.permissions.includes(p.name));
                                const someChecked = perms.some(p => data.permissions.includes(p.name));
                                return (
                                    <div key={module} style={{ border:'1.5px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                                        <div onClick={() => toggleModule(perms)} style={{ padding:'9px 13px', background: allChecked ? '#eff6ff' : '#f8fafc', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', borderBottom:'1px solid #f1f5f9' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                <div style={{ width:15, height:15, borderRadius:4, border:`1.5px solid ${allChecked ? '#3b4fd8' : '#cbd5e1'}`, background: allChecked ? '#3b4fd8' : someChecked ? '#e0e7ff' : '#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    {allChecked && <Check size={9} color="#fff"/>}
                                                    {someChecked && !allChecked && <div style={{ width:6, height:2, background:'#3b4fd8', borderRadius:1 }}/>}
                                                </div>
                                                <span style={{ fontSize:12, fontWeight:600, color:'#1e293b', textTransform:'capitalize' }}>{module}</span>
                                            </div>
                                            <span style={{ fontSize:10, color:'#94a3b8' }}>{perms.length}</span>
                                        </div>
                                        <div style={{ padding:'8px 12px', display:'flex', flexWrap:'wrap', gap:6 }}>
                                            {perms.map(perm => {
                                                const active = data.permissions.includes(perm.name);
                                                return (
                                                    <span key={perm.id} onClick={() => toggle(perm.name)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:14, border:`1px solid ${active ? '#c7d2fe' : '#e2e8f0'}`, background: active ? '#eff6ff' : '#fff', cursor:'pointer', fontSize:11, color: active ? '#3730a3' : '#64748b', fontWeight: active ? 500 : 400, transition:'all .12s' }}>
                                                        {active && <Check size={9} color="#4338CA"/>}
                                                        {perm.name.split('.')[1]}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </form>
                </div>
                <div style={{ padding:'14px 22px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={submit as any} disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white">
                        {processing ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
                        Créer le rôle
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Modal éditer rôle ─────────────────────────────────────────
function EditModal({ role, permissions, onClose }: { role: Role; permissions: Record<string, Permission[]>; onClose: () => void }) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        permissions: role.permissions.map(p => p.name),
    });

    const toggle = (name: string) =>
        setData('permissions', data.permissions.includes(name)
            ? data.permissions.filter(p => p !== name)
            : [...data.permissions, name]);

    const toggleModule = (perms: Permission[]) => {
        const names = perms.map(p => p.name);
        const all   = names.every(n => data.permissions.includes(n));
        setData('permissions', all
            ? data.permissions.filter(p => !names.includes(p))
            : [...new Set([...data.permissions, ...names])]);
    };

    const isProtected = PROTECTED.includes(role.name);

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:580, maxHeight:'90vh', display:'flex', flexDirection:'column', border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'18px 22px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, background: ROLE_COLORS[role.name]?.bg ?? '#f1f5f9', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Shield size={17} color={ROLE_COLORS[role.name]?.color ?? '#64748b'}/>
                        </div>
                        <div>
                            <p style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>Modifier — {role.name.replace(/_/g,' ')}</p>
                            <p style={{ fontSize:11, color:'#94a3b8' }}>{role.users_count} utilisateur{role.users_count > 1 ? 's' : ''} · {role.permissions.length} permissions</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={17}/></button>
                </div>
                <div style={{ overflowY:'auto', flex:1, padding:'18px 22px' }}>
                    <div style={{ marginBottom:16 }}>
                        <label style={{ display:'block', fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>Nom du rôle</label>
                        <input
                            value={data.name} onChange={e => setData('name', e.target.value)}
                            disabled={isProtected}
                            style={{ width:'100%', padding:'10px 13px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background: isProtected ? '#f8fafc' : '#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, outline:'none', boxSizing:'border-box', opacity: isProtected ? .7 : 1 }}
                        />
                        {isProtected && <p style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>Rôle système — renommage non autorisé.</p>}
                    </div>
                    <label style={{ display:'block', fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
                        Permissions ({data.permissions.length} sélectionnée{data.permissions.length > 1 ? 's' : ''})
                    </label>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {Object.entries(permissions).map(([module, perms]) => {
                            const allChecked  = perms.every(p => data.permissions.includes(p.name));
                            const someChecked = perms.some(p => data.permissions.includes(p.name));
                            return (
                                <div key={module} style={{ border:'1.5px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                                    <div onClick={() => toggleModule(perms)} style={{ padding:'9px 13px', background: allChecked ? '#eff6ff' : '#f8fafc', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', borderBottom:'1px solid #f1f5f9' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                            <div style={{ width:15, height:15, borderRadius:4, border:`1.5px solid ${allChecked ? '#3b4fd8' : '#cbd5e1'}`, background: allChecked ? '#3b4fd8' : someChecked ? '#e0e7ff' : '#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                {allChecked && <Check size={9} color="#fff"/>}
                                                {someChecked && !allChecked && <div style={{ width:6, height:2, background:'#3b4fd8', borderRadius:1 }}/>}
                                            </div>
                                            <span style={{ fontSize:12, fontWeight:600, color:'#1e293b', textTransform:'capitalize' }}>{module}</span>
                                        </div>
                                        <span style={{ fontSize:10, color:'#94a3b8' }}>{perms.length}</span>
                                    </div>
                                    <div style={{ padding:'8px 12px', display:'flex', flexWrap:'wrap', gap:6 }}>
                                        {perms.map(perm => {
                                            const active = data.permissions.includes(perm.name);
                                            return (
                                                <span key={perm.id} onClick={() => toggle(perm.name)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:14, border:`1px solid ${active ? '#c7d2fe' : '#e2e8f0'}`, background: active ? '#eff6ff' : '#fff', cursor:'pointer', fontSize:11, color: active ? '#3730a3' : '#64748b', fontWeight: active ? 500 : 400, transition:'all .12s' }}>
                                                    {active && <Check size={9} color="#4338CA"/>}
                                                    {perm.name.split('.')[1]}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div style={{ padding:'14px 22px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={(e: any) => { e.preventDefault(); put(route('admin.roles.update', { role: role.id }), { onSuccess: onClose }); }} disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white">
                        {processing ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
                        Enregistrer
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────
export default function RolesIndex({ roles, permissions, filters }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editRole,   setEditRole]   = useState<Role | null>(null);
    const [search,     setSearch]     = useState(filters.search ?? '');

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/roles', { ...filters, ...params }, { preserveState:true, replace:true });

    const handleDelete = (role: Role) => {
        if (confirm(`Supprimer le rôle « ${role.name} » ?`))
            router.delete(route('admin.roles.destroy', { role: role.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rôles & Permissions — NSIA Transport"/>
            <style>{`
                .rp-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .rp-hdr{display:flex;align-items:center;justify-content:space-between;}
                .rp-title{font-size:18px;font-weight:600;color:#1e293b;}
                .rp-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .rp-toolbar{display:flex;gap:8px;flex-wrap:wrap;}
                .rp-search{display:flex;gap:0;flex:1;min-width:220px;}
                .rp-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .rp-search input:focus{border-color:#1e3a8a;}
                .rp-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .rp-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:13px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .r-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
                .r-name{font-weight:500;color:#1e293b;font-size:13px;}
                .r-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:10px;font-size:11px;font-weight:500;}
                .perm-preview{display:flex;flex-wrap:wrap;gap:4px;}
                .perm-chip{padding:2px 7px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:10px;color:#475569;}
                .perm-more{padding:2px 7px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;font-size:10px;color:#1d4ed8;font-weight:500;}
                .actions{display:flex;gap:5px;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-edit{color:#0f766e;border-color:#99f6e4;} .btn-edit:hover{background:#f0fdfa;}
                .btn-del{color:#dc2626;border-color:#fecaca;} .btn-del:hover{background:#fef2f2;}
                .sys-badge{font-size:9px;color:#94a3b8;display:inline-flex;align-items:center;gap:3px;margin-left:4px;}
                .rp-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .rp-pg-info{font-size:12px;color:#94a3b8;}
                .rp-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .rp-empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="rp-page">

                    {/* Header */}
                    <div className="rp-hdr">
                        <div>
                            <h1 className="rp-title">Rôles & Permissions</h1>
                            <p className="rp-sub">{roles.total} rôle{roles.total > 1 ? 's' : ''} configuré{roles.total > 1 ? 's' : ''}</p>
                        </div>
                        <Button onClick={() => setShowCreate(true)} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                            <Plus size={15}/> Nouveau rôle
                        </Button>
                    </div>

                    {/* Toolbar */}
                    <div className="rp-toolbar">
                        <form className="rp-search" onSubmit={e => { e.preventDefault(); applyFilter({ search, page:'1' }); }}>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un rôle…"/>
                            <button type="submit"><Search size={14}/></button>
                        </form>
                        {filters.search && (
                            <button onClick={() => router.get('/admin/roles')} style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                                <X size={12}/> Effacer
                            </button>
                        )}
                    </div>

                    {/* Tableau */}
                    <div className="rp-card">
                        {roles.data.length === 0 ? (
                            <div className="rp-empty">Aucun rôle trouvé.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Rôle</th>
                                            <th>Utilisateurs</th>
                                            <th>Permissions</th>
                                            <th>Aperçu</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roles.data.map(role => {
                                            const rc          = ROLE_COLORS[role.name] ?? { bg:'#f1f5f9', color:'#64748b', avatarBg:'#475569', avatarColor:'#fff' };
                                            const initials    = role.name.slice(0,2).toUpperCase();
                                            const isProtected = PROTECTED.includes(role.name);
                                            const visible     = role.permissions.slice(0, 4);
                                            const remaining   = role.permissions.length - visible.length;

                                            return (
                                                <tr key={role.id}>
                                                    <td>
                                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                            <div className="r-avatar" style={{ background: rc.avatarBg, color: rc.avatarColor }}>{initials}</div>
                                                            <div>
                                                                <div className="r-name">{role.name.replace(/_/g,' ')}</div>
                                                                {isProtected && <span className="sys-badge"><Lock size={9}/>système</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' }}>
                                                            <Users size={12}/>{role.users_count}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="r-badge" style={{ background: rc.bg, color: rc.color }}>
                                                            {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="perm-preview">
                                                            {visible.map(p => (
                                                                <span key={p.id} className="perm-chip">{p.name.replace('.', ' ')}</span>
                                                            ))}
                                                            {remaining > 0 && <span className="perm-more">+{remaining}</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="actions">
                                                            <Link href={route('admin.roles.show', { role: role.id })} className="btn-act btn-view">
                                                                <Eye size={12}/> Voir
                                                            </Link>
                                                            <button className="btn-act btn-edit" onClick={() => setEditRole(role)}>
                                                                <Edit2 size={12}/> Éditer
                                                            </button>
                                                            {!isProtected && (
                                                                <button className="btn-act btn-del" onClick={() => handleDelete(role)}>
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

                                {roles.last_page > 1 && (
                                    <div className="rp-pagination">
                                        <span className="rp-pg-info">Page {roles.current_page} / {roles.last_page} · {roles.total} rôles</span>
                                        <div className="rp-pg-links">
                                            <button className="pg-btn" disabled={roles.current_page === 1} onClick={() => applyFilter({ page: String(roles.current_page - 1) })}><ChevronLeft size={13}/></button>
                                            {roles.links.map((link, i) => {
                                                if (i === 0 || i === roles.links.length - 1) return null;
                                                return (
                                                    <button key={`page-${i}`} className={`pg-btn ${link.active ? 'act' : ''}`}
                                                        onClick={() => link.url && applyFilter({ page: link.label })}
                                                        disabled={!link.url}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                );
                                            })}
                                            <button className="pg-btn" disabled={roles.current_page === roles.last_page} onClick={() => applyFilter({ page: String(roles.current_page + 1) })}><ChevronRight size={13}/></button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showCreate && <CreateModal permissions={permissions} onClose={() => setShowCreate(false)}/>}
            {editRole   && <EditModal   role={editRole} permissions={permissions} onClose={() => setEditRole(null)}/>}
        </AppLayout>
    );
}