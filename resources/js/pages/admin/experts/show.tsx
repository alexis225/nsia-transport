import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { Edit2, ArrowLeft, ToggleLeft, ToggleRight, Mail, Phone } from 'lucide-react';

interface Tenant { id: string; name: string; code: string; }
interface Expert {
    id: string; name: string;
    email: string | null; phone: string | null;
    country_code: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    tenant: Tenant | null;
}
interface Props { expert: Expert; }

export default function ExpertsShow({ expert }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Experts', href: '/admin/experts' },
        { title: expert.name },
    ];

    const handleToggle = () => {
        const action = expert.is_active ? 'désactiver' : 'activer';
        if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${expert.name} ?`))
            router.patch(route('admin.experts.toggle', { expert: expert.id }));
    };

    const initials = expert.name.slice(0, 2).toUpperCase();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${expert.name} — NSIA Transport`}/>
            <style>{`
                .es-wrap{width:100%;max-width:720px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .es-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .es-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .es-avatar{width:52px;height:52px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;position:relative;z-index:1;}
                .es-hero-info{position:relative;z-index:1;flex:1;}
                .es-hero-name{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .es-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .es-hero-actions{display:flex;gap:8px;position:relative;z-index:1;}
                .es-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .es-card-hdr{padding:14px 22px;border-bottom:1px solid #f1f5f9;}
                .es-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .es-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
                .es-field{padding:14px 22px;border-bottom:1px solid #f8fafc;}
                .es-field:nth-child(odd){border-right:1px solid #f8fafc;}
                .es-field-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:4px;}
                .es-field-value{font-size:13px;color:#1e293b;font-weight:500;}
                .contact-row{display:flex;align-items:center;gap:5px;font-size:13px;}
                .s-active{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:12px;font-weight:500;}
                .s-inactive{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="es-wrap">

                    <div className="es-hero">
                        <div className="es-avatar">{initials}</div>
                        <div className="es-hero-info">
                            <div className="es-hero-name">{expert.name}</div>
                            <div className="es-hero-sub">
                                {expert.is_active
                                    ? <span style={{ color:'#86efac' }}>● Actif</span>
                                    : <span style={{ color:'rgba(255,255,255,0.4)' }}>● Inactif</span>}
                            </div>
                        </div>
                        <div className="es-hero-actions">
                            <Link href={route('admin.experts.edit', { expert: expert.id })}>
                                <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 border h-8 px-3">
                                    <Edit2 size={13}/> Modifier
                                </Button>
                            </Link>
                            <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-8 px-3" onClick={handleToggle}>
                                {expert.is_active ? <><ToggleLeft size={13}/> Désactiver</> : <><ToggleRight size={13}/> Activer</>}
                            </Button>
                        </div>
                    </div>

                    <div className="es-card">
                        <div className="es-card-hdr"><div className="es-card-ttl">Informations</div></div>
                        <div className="es-grid">
                            <div className="es-field">
                                <div className="es-field-label">Nom</div>
                                <div className="es-field-value">{expert.name}</div>
                            </div>
                            <div className="es-field">
                                <div className="es-field-label">Pays</div>
                                <div className="es-field-value">{expert.country_code ?? '—'}</div>
                            </div>
                            <div className="es-field">
                                <div className="es-field-label">Email</div>
                                <div className="es-field-value">
                                    {expert.email
                                        ? <div className="contact-row"><Mail size={13} color="#64748b"/>{expert.email}</div>
                                        : '—'}
                                </div>
                            </div>
                            <div className="es-field">
                                <div className="es-field-label">Téléphone</div>
                                <div className="es-field-value">
                                    {expert.phone
                                        ? <div className="contact-row"><Phone size={13} color="#64748b"/>{expert.phone}</div>
                                        : '—'}
                                </div>
                            </div>
                            <div className="es-field">
                                <div className="es-field-label">Filiale</div>
                                <div className="es-field-value">{expert.tenant?.name ?? '—'}</div>
                            </div>
                            <div className="es-field">
                                <div className="es-field-label">Statut</div>
                                <div className="es-field-value">
                                    {expert.is_active
                                        ? <span className="s-active"><span className="s-dot" style={{ background:'#22c55e' }}/>Actif</span>
                                        : <span className="s-inactive"><span className="s-dot" style={{ background:'#94a3b8' }}/>Inactif</span>}
                                </div>
                            </div>
                            <div className="es-field">
                                <div className="es-field-label">Créé le</div>
                                <div className="es-field-value" style={{ fontSize:12, color:'#64748b' }}>
                                    {new Date(expert.created_at).toLocaleDateString('fr-FR')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Link href={route('admin.experts.index')}>
                            <Button variant="outline" size="sm" className="h-9">
                                <ArrowLeft size={13}/> Retour à la liste
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
