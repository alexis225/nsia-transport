import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { Edit2, ArrowLeft, Shield, UserX, UserCheck, Mail, Phone, Calendar, Clock, MapPin } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Utilisateurs', href: '/admin/users' },
    { title: 'Détail' },
];

interface User {
    id: string; first_name: string; last_name: string;
    email: string; phone: string | null; is_active: boolean;
    email_verified_at: string | null; blocked_at: string | null;
    blocked_reason: string | null; last_login_at: string | null;
    last_login_ip: string | null; created_at: string;
    avatar_path: string | null;
    roles: { name: string }[];
    tenant: { name: string; code: string } | null;
}
interface AuditLog {
    id: string; action: string; ip_address: string;
    created_at: string; new_values: any; old_values: any;
}
interface Props { user: User; auditLogs: AuditLog[]; }

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    super_admin: { bg:'#EEF2FF', color:'#4338CA' },
    admin_filiale: { bg:'#ECFDF5', color:'#065F46' },
    souscripteur: { bg:'#EFF6FF', color:'#1D4ED8' },
    courtier_local: { bg:'#FFF7ED', color:'#C2410C' },
    partenaire_etranger: { bg:'#FDF4FF', color:'#7E22CE' },
    client: { bg:'#F9FAFB', color:'#374151' },
};

export default function UserShow({ user, auditLogs }: Props) {
    const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
    const role     = user.roles?.[0]?.name ?? '';
    const rc       = ROLE_COLORS[role] ?? { bg:'#f1f5f9', color:'#64748b' };
    const fmt      = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.first_name} ${user.last_name} — NSIA Transport`}/>
            <style>{`
                .us-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .us-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:24px;display:flex;align-items:center;gap:18px;position:relative;overflow:hidden;}
                .us-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .us-avatar{width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.15);border:3px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;position:relative;z-index:1;overflow:hidden;}
                .us-avatar img{width:100%;height:100%;object-fit:cover;}
                .us-hero-info{flex:1;position:relative;z-index:1;}
                .us-hero-name{font-size:17px;font-weight:600;color:#fff;margin-bottom:2px;}
                .us-hero-email{font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:8px;}
                .us-hero-badges{display:flex;gap:6px;flex-wrap:wrap;}
                .us-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
                .us-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .us-card-hdr{padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .us-card-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .us-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .us-card-body{padding:20px;}
                .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .info-item{display:flex;flex-direction:column;gap:3px;}
                .info-label{font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:4px;}
                .info-value{font-size:13px;color:#1e293b;font-weight:400;}
                .audit-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #f8fafc;}
                .audit-row:last-child{border-bottom:none;}
                .audit-dot{width:8px;height:8px;border-radius:50%;background:#e2e8f0;flex-shrink:0;margin-top:5px;}
                .audit-action{font-size:12px;font-weight:500;color:#1e293b;}
                .audit-meta{font-size:11px;color:#94a3b8;margin-top:1px;}
                .blocked-box{background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:14px 16px;}
                .blocked-title{font-size:13px;font-weight:600;color:#dc2626;margin-bottom:4px;}
                .blocked-reason{font-size:12px;color:#ef4444;line-height:1.5;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="us-wrap">

                    {/* Hero */}
                    <div className="us-hero">
                        <div className="us-avatar">
                            {user.avatar_path ? <img src={user.avatar_path} alt=""/> : initials}
                        </div>
                        <div className="us-hero-info">
                            <div className="us-hero-name">{user.first_name} {user.last_name}</div>
                            <div className="us-hero-email">{user.email}</div>
                            <div className="us-hero-badges">
                                {role && <span className="us-badge" style={{ background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)', border:'1px solid rgba(255,255,255,0.2)' }}><Shield size={10}/>{role.replace(/_/g,' ')}</span>}
                                <span className="us-badge" style={{ background: user.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: user.is_active ? '#86efac' : '#fca5a5', border:`1px solid ${user.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                    {user.is_active ? '● Actif' : '● Bloqué'}
                                </span>
                                {user.tenant && <span className="us-badge" style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)' }}><MapPin size={10}/>{user.tenant.name}</span>}
                            </div>
                        </div>
                        <div style={{ display:'flex', gap:8, position:'relative', zIndex:1 }}>
                            <Link href={route('admin.users.edit', { user: user.id })}>
                                <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 px-4 text-sm" variant="outline">
                                    <Edit2 size={13}/> Modifier
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Blocage info */}
                    {!user.is_active && user.blocked_reason && (
                        <div className="blocked-box">
                            <div className="blocked-title">⚠ Compte bloqué</div>
                            <div className="blocked-reason">Motif : {user.blocked_reason}</div>
                            {user.blocked_at && <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Bloqué le {fmt(user.blocked_at)}</div>}
                        </div>
                    )}

                    {/* Informations */}
                    <div className="us-card">
                        <div className="us-card-hdr">
                            <div className="us-card-ico" style={{ background:'#eff6ff' }}><Mail size={15} color="#3b82f6"/></div>
                            <span className="us-card-ttl">Informations du compte</span>
                        </div>
                        <div className="us-card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label"><Mail size={10}/>Email</span>
                                    <span className="info-value">{user.email}</span>
                                    {user.email_verified_at
                                        ? <span style={{ fontSize:10, color:'#15803d', background:'#f0fdf4', padding:'1px 6px', borderRadius:8, display:'inline-flex', alignItems:'center', gap:3, width:'fit-content', border:'1px solid #bbf7d0' }}>✓ Vérifiée</span>
                                        : <span style={{ fontSize:10, color:'#854d0e', background:'#fefce8', padding:'1px 6px', borderRadius:8, display:'inline-flex', alignItems:'center', gap:3, width:'fit-content', border:'1px solid #fde68a' }}>Non vérifiée</span>
                                    }
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Phone size={10}/>Téléphone</span>
                                    <span className="info-value">{user.phone ?? '—'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Clock size={10}/>Dernière connexion</span>
                                    <span className="info-value">{fmt(user.last_login_at)}</span>
                                    {user.last_login_ip && <span style={{ fontSize:11, color:'#94a3b8' }}>{user.last_login_ip}</span>}
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Calendar size={10}/>Créé le</span>
                                    <span className="info-value">{fmt(user.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Historique */}
                    {auditLogs.length > 0 && (
                        <div className="us-card">
                            <div className="us-card-hdr">
                                <div className="us-card-ico" style={{ background:'#f0fdf4' }}><Clock size={15} color="#16a34a"/></div>
                                <span className="us-card-ttl">Historique des actions ({auditLogs.length})</span>
                            </div>
                            <div className="us-card-body" style={{ padding:'14px 20px' }}>
                                {auditLogs.map(log => (
                                    <div key={log.id} className="audit-row">
                                        <div className="audit-dot"/>
                                        <div>
                                            <div className="audit-action">{log.action.replace(/_/g,' ')}</div>
                                            <div className="audit-meta">{fmt(log.created_at)} · {log.ip_address}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Retour */}
                    <Link href="/admin/users" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none' }}>
                        <ArrowLeft size={14}/> Retour à la liste
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}