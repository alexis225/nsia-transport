import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Edit2, ArrowLeft, Mail, Phone, MapPin,
    Shield, Building2, ToggleLeft, ToggleRight,
    Briefcase, FileText,
} from 'lucide-react';

interface Broker {
    id: string; name: string; code: string;
    type: 'courtier_local' | 'partenaire_etranger';
    agreement_number: string | null;
    email: string | null; phone: string | null; phone_secondary: string | null;
    address: string | null; city: string | null; country_code: string;
    is_active: boolean; created_at: string;
    tenant: { name: string; code: string } | null;
}
interface Props { broker: Broker; }

const TYPE_STYLES = {
    courtier_local:      { bg:'#EFF6FF', color:'#1D4ED8', label:'Courtier local' },
    partenaire_etranger: { bg:'#FDF4FF', color:'#7E22CE', label:'Partenaire étranger' },
};

export default function BrokerShow({ broker }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Courtiers', href: '/admin/brokers' },
        { title: broker.name },
    ];

    const ts  = TYPE_STYLES[broker.type];
    const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

    const handleToggle = () => {
        const action = broker.is_active ? 'désactiver' : 'activer';
        if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${broker.name} ?`))
            router.patch(route('admin.brokers.toggle', { broker: broker.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${broker.name} — NSIA Transport`}/>
            <style>{`
                .bs-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .bs-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:24px;display:flex;align-items:center;gap:18px;position:relative;overflow:hidden;}
                .bs-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .bs-ico{width:64px;height:64px;border-radius:14px;background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0;position:relative;z-index:1;}
                .bs-hero-info{flex:1;position:relative;z-index:1;}
                .bs-hero-name{font-size:18px;font-weight:600;color:#fff;margin-bottom:2px;}
                .bs-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:8px;}
                .bs-hero-badges{display:flex;gap:6px;flex-wrap:wrap;}
                .bs-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
                .bs-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .bs-card-hdr{padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .bs-card-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .bs-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .bs-card-body{padding:20px;}
                .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .info-item{display:flex;flex-direction:column;gap:3px;}
                .info-label{font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:4px;}
                .info-value{font-size:13px;color:#1e293b;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="bs-wrap">

                    {/* Hero */}
                    <div className="bs-hero">
                        <div className="bs-ico">{broker.name.slice(0,2).toUpperCase()}</div>
                        <div className="bs-hero-info">
                            <div className="bs-hero-name">{broker.name}</div>
                            <div className="bs-hero-sub">{broker.code} · {broker.tenant?.name ?? '—'}</div>
                            <div className="bs-hero-badges">
                                <span className="bs-badge" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                                <span className="bs-badge" style={{ background: broker.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: broker.is_active ? '#86efac' : '#fca5a5', border:`1px solid ${broker.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                    {broker.is_active ? '● Actif' : '● Inactif'}
                                </span>
                            </div>
                        </div>
                        <div style={{ display:'flex', gap:8, position:'relative', zIndex:1 }}>
                            <Link href={route('admin.brokers.edit', { broker: broker.id })}>
                                <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 px-4 text-sm" variant="outline">
                                    <Edit2 size={13}/> Modifier
                                </Button>
                            </Link>
                            <Button onClick={handleToggle} className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 px-4 text-sm" variant="outline">
                                {broker.is_active ? <><ToggleLeft size={13}/> Désactiver</> : <><ToggleRight size={13}/> Activer</>}
                            </Button>
                        </div>
                    </div>

                    {/* Identification */}
                    <div className="bs-card">
                        <div className="bs-card-hdr">
                            <div className="bs-card-ico" style={{ background:'#eff6ff' }}><Briefcase size={15} color="#3b82f6"/></div>
                            <span className="bs-card-ttl">Identification</span>
                        </div>
                        <div className="bs-card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label"><FileText size={10}/>Code</span>
                                    <span className="info-value" style={{ fontFamily:'monospace' }}>{broker.code}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Shield size={10}/>N° Agrément</span>
                                    <span className="info-value">{broker.registration_number ?? '—'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Building2 size={10}/>Filiale</span>
                                    <span className="info-value">{broker.tenant?.name ?? '—'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><FileText size={10}/>Créé le</span>
                                    <span className="info-value">{fmt(broker.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bs-card">
                        <div className="bs-card-hdr">
                            <div className="bs-card-ico" style={{ background:'#f0fdf4' }}><Mail size={15} color="#16a34a"/></div>
                            <span className="bs-card-ttl">Contact & Localisation</span>
                        </div>
                        <div className="bs-card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label"><Mail size={10}/>Email</span>
                                    <span className="info-value">{broker.email ?? '—'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Phone size={10}/>Téléphone</span>
                                    <span className="info-value">{broker.phone ?? '—'}</span>
                                </div>
                                {broker.phone_secondary && (
                                    <div className="info-item">
                                        <span className="info-label"><Phone size={10}/>Téléphone 2</span>
                                        <span className="info-value">{broker.phone_secondary}</span>
                                    </div>
                                )}
                                <div className="info-item">
                                    <span className="info-label"><MapPin size={10}/>Ville / Pays</span>
                                    <span className="info-value">
                                        {[broker.city, broker.country_code].filter(Boolean).join(', ') || '—'}
                                    </span>
                                </div>
                                {broker.address && (
                                    <div className="info-item" style={{ gridColumn:'1/-1' }}>
                                        <span className="info-label"><MapPin size={10}/>Adresse</span>
                                        <span className="info-value">{broker.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Link href="/admin/brokers" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none' }}>
                        <ArrowLeft size={14}/> Retour aux courtiers
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}