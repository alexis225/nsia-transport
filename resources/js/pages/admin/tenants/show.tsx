import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { Edit2, ArrowLeft, Users, Building2, Globe, DollarSign, Clock, ToggleLeft, ToggleRight, Shield, FileBadge, Plus } from 'lucide-react';

interface Tenant {
    id: string; name: string; code: string; country_code: string;
    currency_code: string;
    settings: { locale?: string; timezone?: string } | null;
    is_active: boolean; users_count: number; created_at: string;
    logo_path: string | null;
    subscription_limit_config: { nn300_limit: number };
}
interface User {
    id: string; first_name: string; last_name: string;
    email: string; is_active: boolean;
    roles: { name: string }[];
}
interface CertificateTemplate { id: string; name: string; type: string; is_active: boolean; }
interface Props { tenant: Tenant; users: User[]; certificateTemplate: CertificateTemplate | null; }

const FLAG: Record<string, string> = {
    CI:'🇨🇮', SN:'🇸🇳', ML:'🇲🇱', BF:'🇧🇫', GN:'🇬🇳',
    TG:'🇹🇬', BJ:'🇧🇯', CM:'🇨🇲', CG:'🇨🇬', GA:'🇬🇦',
    MG:'🇲🇬', GW:'🇬🇼', NG:'🇳🇬', GH:'🇬🇭',
};

export default function TenantShow({ tenant, users, certificateTemplate }: Props) {
    const { t } = useTranslation('tenants');

    const TEMPLATE_TYPE_LABELS: Record<string, string> = {
        certificat_assurance: t('show.template.types.certificat_assurance'),
        certificat_etatique:  t('show.template.types.certificat_etatique'),
        carnet_ordre:         t('show.template.types.carnet_ordre'),
        ordre_assurance:      t('show.template.types.ordre_assurance'),
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('show.breadcrumb'), href: '/admin/tenants' },
        { title: tenant.name },
    ];

    const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

    const handleToggle = () => {
        const actionVerb = tenant.is_active ? t('show.deactivateVerb') : t('show.activateVerb');
        const action = actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1);
        if (confirm(t('show.confirmToggle', { action, name: tenant.name })))
            router.patch(route('admin.tenants.toggle', { tenant: tenant.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('show.title', { name: tenant.name })}/>
            <style>{`
                .ts-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .ts-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:24px;display:flex;align-items:center;gap:18px;position:relative;overflow:hidden;}
                .ts-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .ts-flag{width:64px;height:64px;border-radius:14px;background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;position:relative;z-index:1;}
                .ts-hero-info{flex:1;position:relative;z-index:1;}
                .ts-hero-name{font-size:18px;font-weight:600;color:#fff;margin-bottom:2px;}
                .ts-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:8px;}
                .ts-hero-badges{display:flex;gap:6px;flex-wrap:wrap;}
                .ts-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
                .ts-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .ts-card-hdr{padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .ts-card-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .ts-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .ts-card-body{padding:20px;}
                .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .info-item{display:flex;flex-direction:column;gap:3px;}
                .info-label{font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:4px;}
                .info-value{font-size:13px;color:#1e293b;font-weight:400;}
                .u-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f8fafc;}
                .u-row:last-child{border-bottom:none;}
                .u-avatar{width:32px;height:32px;border-radius:50%;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .u-name{font-size:13px;font-weight:500;color:#1e293b;}
                .u-email{font-size:11px;color:#94a3b8;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ts-wrap">

                    {/* Hero */}
                    <div className="ts-hero">
                        <div className="ts-flag">{tenant.logo_path ? <img src={`/storage/${tenant.logo_path}`} alt={tenant.name} style={{ width:"100%", height:"100%", objectFit:"contain", padding:4 }}/> : (FLAG[tenant.code] ?? "🏢")}</div>
                        <div className="ts-hero-info">
                            <div className="ts-hero-name">{tenant.name}</div>
                            <div className="ts-hero-sub">{tenant.code} · {tenant.currency_code} · {tenant.settings?.timezone ?? '—'}</div>
                            <div className="ts-hero-badges">
                                <span className="ts-badge" style={{ background: tenant.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: tenant.is_active ? '#86efac' : '#fca5a5', border:`1px solid ${tenant.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                    {tenant.is_active ? `● ${t('show.status.active')}` : `● ${t('show.status.inactive')}`}
                                </span>
                                <span className="ts-badge" style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)' }}>
                                    <Users size={10}/>{t('show.usersCount', { count: tenant.users_count })}
                                </span>
                            </div>
                        </div>
                        <div style={{ display:'flex', gap:8, position:'relative', zIndex:1 }}>
                            <Link href={route('admin.tenants.edit', { tenant: tenant.id })}>
                                <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 px-4 text-sm" variant="outline">
                                    <Edit2 size={13}/> {t('show.edit')}
                                </Button>
                            </Link>
                            <Button onClick={handleToggle} className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 px-4 text-sm" variant="outline">
                                {tenant.is_active ? <><ToggleLeft size={13}/> {t('show.deactivate')}</> : <><ToggleRight size={13}/> {t('show.activate')}</>}
                            </Button>
                        </div>
                    </div>

                    {/* Informations */}
                    <div className="ts-card">
                        <div className="ts-card-hdr">
                            <div className="ts-card-ico" style={{ background:'#eff6ff' }}><Building2 size={15} color="#3b82f6"/></div>
                            <span className="ts-card-ttl">{t('show.config.title')}</span>
                        </div>
                        <div className="ts-card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label"><Globe size={10}/>{t('show.config.countryCode')}</span>
                                    <span className="info-value">{tenant.country_code}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><DollarSign size={10}/>{t('show.config.currency')}</span>
                                    <span className="info-value">{tenant.currency_code}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Globe size={10}/>{t('show.config.locale')}</span>
                                    <span className="info-value">{tenant.settings?.locale === 'fr' ? t('show.config.localeFr') : t('show.config.localeEn')}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Clock size={10}/>{t('show.config.timezone')}</span>
                                    <span className="info-value">{tenant.settings?.timezone ?? '—'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Shield size={10}/>{t('show.config.nn300Limit')}</span>
                                    <span className="info-value">
                                        {(tenant.subscription_limit_config?.nn300_limit ?? 0).toLocaleString('fr-FR')} {tenant.currency_code}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Clock size={10}/>{t('show.config.createdAt')}</span>
                                    <span className="info-value">{fmt(tenant.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modèle de certificat */}
                    <div className="ts-card">
                        <div className="ts-card-hdr">
                            <div className="ts-card-ico" style={{ background:'#fdf4ff' }}><FileBadge size={15} color="#7c3aed"/></div>
                            <span className="ts-card-ttl">{t('show.template.title')}</span>
                        </div>
                        <div className="ts-card-body">
                            {certificateTemplate ? (
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                                    <div>
                                        <div style={{ fontSize:13, fontWeight:500, color:'#1e293b', marginBottom:3 }}>{certificateTemplate.name}</div>
                                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                            <span style={{ fontSize:11, color:'#64748b' }}>
                                                {TEMPLATE_TYPE_LABELS[certificateTemplate.type] ?? certificateTemplate.type}
                                            </span>
                                            <span style={{ fontSize:11, fontWeight:500, padding:'2px 7px', borderRadius:8, background: certificateTemplate.is_active ? '#f0fdf4' : '#f8fafc', color: certificateTemplate.is_active ? '#15803d' : '#94a3b8' }}>
                                                {certificateTemplate.is_active ? t('show.template.activated') : t('show.template.deactivated')}
                                            </span>
                                        </div>
                                    </div>
                                    <Link href={route('admin.certificate-templates.edit', { certificateTemplate: certificateTemplate.id })}>
                                        <Button variant="outline" className="h-9 px-4 text-sm"><Edit2 size={13}/> {t('show.template.configure')}</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                                    <div style={{ fontSize:12, color:'#94a3b8' }}>
                                        {t('show.template.none')}
                                    </div>
                                    <Link href={route('admin.certificate-templates.create', { tenant_id: tenant.id })} style={{ flexShrink:0 }}>
                                        <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-9 px-4 text-sm"><Plus size={13}/> {t('show.template.activate')}</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Utilisateurs récents */}
                    {users.length > 0 && (
                        <div className="ts-card">
                            <div className="ts-card-hdr">
                                <div className="ts-card-ico" style={{ background:'#f0fdf4' }}><Users size={15} color="#16a34a"/></div>
                                <span className="ts-card-ttl">{t('show.usersSection.title', { count: tenant.users_count })}</span>
                                <Link href={`/admin/users?tenant=${tenant.id}`} style={{ marginLeft:'auto', fontSize:12, color:'#3b82f6', textDecoration:'none' }}>
                                    {t('show.usersSection.seeAll')}
                                </Link>
                            </div>
                            <div className="ts-card-body" style={{ padding:'12px 20px' }}>
                                {users.map(user => (
                                    <div key={user.id} className="u-row">
                                        <div className="u-avatar">
                                            {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()}
                                        </div>
                                        <div style={{ flex:1 }}>
                                            <div className="u-name">{user.first_name} {user.last_name}</div>
                                            <div className="u-email">{user.email}</div>
                                        </div>
                                        {user.roles?.[0] && (
                                            <span style={{ fontSize:11, padding:'2px 7px', borderRadius:8, background:'#eff6ff', color:'#1d4ed8', fontWeight:500 }}>
                                                {user.roles[0].name.replace(/_/g,' ')}
                                            </span>
                                        )}
                                        <span style={{ width:7, height:7, borderRadius:'50%', background: user.is_active ? '#22c55e' : '#ef4444', flexShrink:0 }}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Link href="/admin/tenants" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none' }}>
                        <ArrowLeft size={14}/> {t('show.backToList')}
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}