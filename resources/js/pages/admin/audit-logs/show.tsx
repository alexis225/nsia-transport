import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { ArrowLeft, Clock, User, Shield, Globe, Monitor, Server } from 'lucide-react';

interface Log {
    id: string; action: string; entity_type: string | null;
    entity_id: string | null; ip_address: string | null;
    user_agent: string | null; created_at: string;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    user:   { id: string; first_name: string; last_name: string; email: string } | null;
    tenant: { id: string; name: string; code: string } | null;
}
interface Props { log: Log; }

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
    login:            { bg:'#f0fdf4', color:'#15803d' },
    logout:           { bg:'#f8fafc', color:'#64748b' },
    login_failed:     { bg:'#fef2f2', color:'#dc2626' },
    user_created:     { bg:'#eff6ff', color:'#1d4ed8' },
    user_updated:     { bg:'#fff7ed', color:'#c2410c' },
    user_deleted:     { bg:'#fef2f2', color:'#dc2626' },
    user_blocked:     { bg:'#fef2f2', color:'#dc2626' },
    user_unblocked:   { bg:'#f0fdf4', color:'#15803d' },
    tenant_created:   { bg:'#eff6ff', color:'#1d4ed8' },
    tenant_updated:   { bg:'#fff7ed', color:'#c2410c' },
};

export default function AuditLogShow({ log }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Audit Logs', href: '/admin/audit-logs' },
        { title: log.action.replace(/_/g,' ') },
    ];

    const s = ACTION_COLORS[log.action] ?? { bg:'#f8fafc', color:'#475569' };

    const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', {
        day:'2-digit', month:'long', year:'numeric',
        hour:'2-digit', minute:'2-digit', second:'2-digit',
    });

    const renderJson = (obj: Record<string, any> | null) => {
        if (!obj || Object.keys(obj).length === 0) return null;
        return (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {Object.entries(obj).map(([key, value]) => (
                    <div key={key} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <span style={{ fontSize:11, fontWeight:600, color:'#64748b', minWidth:120, paddingTop:1, textTransform:'uppercase', letterSpacing:'.06em' }}>
                            {key.replace(/_/g,' ')}
                        </span>
                        <span style={{ fontSize:12, color:'#1e293b', fontFamily: typeof value === 'object' ? 'monospace' : 'inherit', background:'#f8fafc', padding:'2px 8px', borderRadius:6, border:'1px solid #e2e8f0', wordBreak:'break-all' }}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Log ${log.action} — NSIA Transport`}/>
            <style>{`
                .ls-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .ls-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .ls-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .ls-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;}
                .ls-hero-info{flex:1;position:relative;z-index:1;}
                .ls-hero-action{font-size:17px;font-weight:600;color:#fff;margin-bottom:4px;}
                .ls-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .ls-action-badge{display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;position:relative;z-index:1;}

                .ls-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .ls-card-hdr{padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .ls-card-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .ls-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .ls-card-body{padding:20px;}

                .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .info-item{display:flex;flex-direction:column;gap:3px;}
                .info-label{font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:4px;}
                .info-value{font-size:13px;color:#1e293b;}

                .diff-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .diff-box{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:14px;}
                .diff-title{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
                .diff-old{border-color:#fecaca;background:#fef2f2;}
                .diff-old .diff-title{color:#dc2626;}
                .diff-new{border-color:#bbf7d0;background:#f0fdf4;}
                .diff-new .diff-title{color:#15803d;}

                .ua-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:11px;color:#64748b;font-family:monospace;word-break:break-all;line-height:1.5;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ls-wrap">

                    {/* Hero */}
                    <div className="ls-hero">
                        <div className="ls-hero-ico">
                            <Shield size={22} color="rgba(255,255,255,0.8)"/>
                        </div>
                        <div className="ls-hero-info">
                            <div className="ls-hero-action">{log.action.replace(/_/g,' ')}</div>
                            <div className="ls-hero-sub">
                                <Clock size={11} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }}/>
                                {fmt(log.created_at)}
                            </div>
                        </div>
                        <span className="ls-action-badge" style={{ background: s.bg, color: s.color }}>
                            {log.action.replace(/_/g,' ')}
                        </span>
                    </div>

                    {/* Informations générales */}
                    <div className="ls-card">
                        <div className="ls-card-hdr">
                            <div className="ls-card-ico" style={{ background:'#eff6ff' }}><User size={15} color="#3b82f6"/></div>
                            <span className="ls-card-ttl">Informations générales</span>
                        </div>
                        <div className="ls-card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label"><User size={10}/>Utilisateur</span>
                                    {log.user ? (
                                        <span className="info-value">
                                            {log.user.first_name} {log.user.last_name}
                                            <span style={{ fontSize:11, color:'#94a3b8', display:'block' }}>{log.user.email}</span>
                                        </span>
                                    ) : <span style={{ color:'#cbd5e1', fontSize:12 }}>Système</span>}
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Shield size={10}/>Filiale</span>
                                    <span className="info-value">{log.tenant?.name ?? '—'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Server size={10}/>Entité</span>
                                    <span className="info-value">
                                        {log.entity_type ?? '—'}
                                        {log.entity_id && <span style={{ fontSize:11, color:'#94a3b8', display:'block', fontFamily:'monospace' }}>{log.entity_id}</span>}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Globe size={10}/>Adresse IP</span>
                                    <span style={{ fontSize:13, color:'#1e293b', fontFamily:'monospace' }}>{log.ip_address ?? '—'}</span>
                                </div>
                                <div className="info-item" style={{ gridColumn:'1/-1' }}>
                                    <span className="info-label"><Monitor size={10}/>User Agent</span>
                                    <div className="ua-box">{log.user_agent ?? '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Diff avant / après */}
                    {(log.old_values || log.new_values) && (
                        <div className="ls-card">
                            <div className="ls-card-hdr">
                                <div className="ls-card-ico" style={{ background:'#fff7ed' }}><Clock size={15} color="#f97316"/></div>
                                <span className="ls-card-ttl">Modifications</span>
                            </div>
                            <div className="ls-card-body">
                                <div className="diff-grid">
                                    <div className={`diff-box ${log.old_values ? 'diff-old' : ''}`}>
                                        <div className="diff-title">Avant</div>
                                        {log.old_values
                                            ? renderJson(log.old_values)
                                            : <span style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Aucune valeur précédente</span>
                                        }
                                    </div>
                                    <div className={`diff-box ${log.new_values ? 'diff-new' : ''}`}>
                                        <div className="diff-title">Après</div>
                                        {log.new_values
                                            ? renderJson(log.new_values)
                                            : <span style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Aucune nouvelle valeur</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Link href="/admin/audit-logs" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none' }}>
                        <ArrowLeft size={14}/> Retour aux logs
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}