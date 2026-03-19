import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { Building2, Check } from 'lucide-react';

interface Tenant {
    id: string; name: string; code: string; country_code: string;
    currency: string; locale: string; timezone: string; is_active: boolean;
    subscription_limit_config: { nn300_limit: number };
}
interface Props { tenant: Tenant; }

const TIMEZONES = [
    'Africa/Abidjan','Africa/Dakar','Africa/Bamako','Africa/Conakry',
    'Africa/Ouagadougou','Africa/Lome','Africa/Cotonou','Africa/Douala',
    'Africa/Lagos','Africa/Libreville','Africa/Brazzaville',
    'Africa/Antananarivo','UTC',
];
const CURRENCIES = ['XOF','XAF','GNF','MGA','NGN','EUR','USD'];

export default function TenantEdit({ tenant }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Filiales',   href: '/admin/tenants' },
        { title: tenant.name, href: route('admin.tenants.show', { tenant: tenant.id }) },
        { title: 'Modifier' },
    ];

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name:         tenant.name,
        code:         tenant.code,
        country_code: tenant.country_code,
        currency:     tenant.currency,
        locale:       tenant.locale,
        timezone:     tenant.timezone,
        is_active:    tenant.is_active,
        subscription_limit_config: tenant.subscription_limit_config ?? { nn300_limit: 0 },
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.tenants.update', { tenant: tenant.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${tenant.name} — NSIA Transport`}/>
            <style>{`
                .te-wrap{width:100%;max-width:760px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .te-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .te-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .te-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;}
                .te-hero-info{position:relative;z-index:1;}
                .te-hero-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .te-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .te-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .te-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .te-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .te-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .te-card-body{padding:22px;display:flex;flex-direction:column;gap:16px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
                .te-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .te-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .te-select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.08);}
                .te-toggle{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;cursor:pointer;transition:border-color .15s;}
                .te-toggle:hover{border-color:#cbd5e1;}
                .te-toggle-box{width:40px;height:22px;border-radius:11px;transition:background .2s;position:relative;flex-shrink:0;}
                .te-toggle-thumb{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:3px;transition:left .2s;}
                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px 13px;font-size:12px;color:#15803d;display:flex;align-items:center;gap:6px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="te-wrap">

                    {/* Hero */}
                    <div className="te-hero">
                        <div className="te-hero-ico">
                            <Building2 size={22} color="rgba(255,255,255,0.8)"/>
                        </div>
                        <div className="te-hero-info">
                            <div className="te-hero-title">Modifier {tenant.name}</div>
                            <div className="te-hero-sub">Code : {tenant.code} · {tenant.currency}</div>
                        </div>
                    </div>

                    {/* Formulaire */}
                    <div className="te-card">
                        <div className="te-card-hdr">
                            <div className="te-card-ttl">Informations de la filiale</div>
                            <div className="te-card-sub">Modifiez les paramètres de configuration</div>
                        </div>
                        <div className="te-card-body">
                            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                                {recentlySuccessful && (
                                    <div className="status-ok"><Check size={13}/>Modifications enregistrées.</div>
                                )}

                                {/* Nom */}
                                <div className="grid gap-2">
                                    <Label className="te-label">Nom de la filiale *</Label>
                                    <Input className="h-11" value={data.name}
                                           onChange={e => setData('name', e.target.value)}
                                           placeholder="ex: NSIA Côte d'Ivoire"/>
                                    <InputError message={errors.name}/>
                                </div>

                                {/* Code + Pays */}
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="te-label">Code *</Label>
                                        <Input className="h-11"
                                               value={data.code}
                                               onChange={e => setData('code', e.target.value.toUpperCase())}
                                               placeholder="ex: CI" maxLength={10}
                                               style={{ fontFamily:'monospace', letterSpacing:'.1em' }}/>
                                        <InputError message={errors.code}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="te-label">Code pays (ISO 2) *</Label>
                                        <Input className="h-11"
                                               value={data.country_code}
                                               onChange={e => setData('country_code', e.target.value.toUpperCase())}
                                               placeholder="ex: CI" maxLength={2}
                                               style={{ fontFamily:'monospace', letterSpacing:'.1em' }}/>
                                        <InputError message={errors.country_code}/>
                                    </div>
                                </div>

                                {/* Devise + Locale */}
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="te-label">Devise *</Label>
                                        <select className="te-select" value={data.currency}
                                                onChange={e => setData('currency', e.target.value)}>
                                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <InputError message={errors.currency}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="te-label">Langue *</Label>
                                        <select className="te-select" value={data.locale}
                                                onChange={e => setData('locale', e.target.value)}>
                                            <option value="fr">Français</option>
                                            <option value="en">English</option>
                                        </select>
                                        <InputError message={errors.locale}/>
                                    </div>
                                </div>

                                {/* Fuseau horaire */}
                                <div className="grid gap-2">
                                    <Label className="te-label">Fuseau horaire *</Label>
                                    <select className="te-select" value={data.timezone}
                                            onChange={e => setData('timezone', e.target.value)}>
                                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                    </select>
                                    <InputError message={errors.timezone}/>
                                </div>

                                {/* Plafond NN300 */}
                                <div className="grid gap-2">
                                    <Label className="te-label">Plafond NN300 (XOF)</Label>
                                    <Input className="h-11" type="number" min={0}
                                           value={data.subscription_limit_config?.nn300_limit ?? 0}
                                           onChange={e => setData('subscription_limit_config', { nn300_limit: Number(e.target.value) })}
                                           placeholder="0"/>
                                    <InputError message={errors['subscription_limit_config.nn300_limit']}/>
                                </div>

                                {/* Statut */}
                                <div>
                                    <Label className="te-label" style={{ marginBottom:8, display:'block' }}>Statut</Label>
                                    <div className="te-toggle" onClick={() => setData('is_active', !data.is_active)}>
                                        <div className="te-toggle-box" style={{ background: data.is_active ? '#1e3a8a' : '#e2e8f0' }}>
                                            <div className="te-toggle-thumb" style={{ left: data.is_active ? '21px' : '3px' }}/>
                                        </div>
                                        <div>
                                            <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>
                                                {data.is_active ? 'Filiale active' : 'Filiale inactive'}
                                            </div>
                                            <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>
                                                {data.is_active ? 'Les utilisateurs peuvent se connecter' : 'Accès bloqué pour tous les utilisateurs'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display:'flex', gap:8, paddingTop:4, borderTop:'1px solid #f8fafc', marginTop:4 }}>
                                    <Button type="submit" disabled={processing}
                                            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                        {processing ? 'Enregistrement…' : <><Check size={14}/> Enregistrer</>}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                        Annuler
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}