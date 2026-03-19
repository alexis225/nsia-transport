import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { Settings, Check, Shield, Bell, Database, Globe } from 'lucide-react';

interface Tenant {
    id: string; name: string; code: string; currency: string;
    subscription_limit_config: {
        nn300_limit:          number;
        alert_threshold:      number;
        block_at_100_percent: boolean;
    };
    settings: {
        notifications_enabled: boolean;
        email_notifications:   boolean;
        sms_notifications:     boolean;
        max_users:             number;
        max_contracts:         number;
        max_certificates:      number;
        retention_days:        number;
    };
}
interface Props { tenant: Tenant; }

export default function TenantConfig({ tenant }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Filiales',     href: '/admin/tenants' },
        { title: tenant.name,    href: route('admin.tenants.show', { tenant: tenant.id }) },
        { title: 'Configuration' },
    ];

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        subscription_limit_config: {
            nn300_limit:          tenant.subscription_limit_config?.nn300_limit          ?? 0,
            alert_threshold:      tenant.subscription_limit_config?.alert_threshold      ?? 80,
            block_at_100_percent: tenant.subscription_limit_config?.block_at_100_percent ?? true,
        },
        settings: {
            notifications_enabled: tenant.settings?.notifications_enabled ?? true,
            email_notifications:   tenant.settings?.email_notifications   ?? true,
            sms_notifications:     tenant.settings?.sms_notifications     ?? false,
            max_users:             tenant.settings?.max_users             ?? 0,
            max_contracts:         tenant.settings?.max_contracts         ?? 0,
            max_certificates:      tenant.settings?.max_certificates      ?? 0,
            retention_days:        tenant.settings?.retention_days        ?? 730,
        },
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.tenants.update', { tenant: tenant.id }));
    };

    const Toggle = ({ value, onChange, label, desc }: { value: boolean; onChange: () => void; label: string; desc?: string }) => (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, cursor:'pointer' }} onClick={onChange}>
            <div>
                <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{label}</div>
                {desc && <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{desc}</div>}
            </div>
            <div style={{ width:40, height:22, borderRadius:11, background: value ? '#1e3a8a' : '#e2e8f0', position:'relative', flexShrink:0, transition:'background .2s' }}>
                <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: value ? 21 : 3, transition:'left .2s' }}/>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Configuration ${tenant.name} — NSIA Transport`}/>
            <style>{`
                .tc-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .tc-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:24px;display:flex;align-items:center;gap:18px;position:relative;overflow:hidden;}
                .tc-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .tc-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;}
                .tc-hero-info{flex:1;position:relative;z-index:1;}
                .tc-hero-name{font-size:17px;font-weight:600;color:#fff;margin-bottom:2px;}
                .tc-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .tc-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .tc-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;}
                .tc-card-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .tc-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .tc-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .tc-card-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .tc-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px 13px;font-size:12px;color:#15803d;display:flex;align-items:center;gap:6px;}
                .section-divider{height:1px;background:#f1f5f9;margin:4px 0;}
                .input-suffix{display:flex;align-items:center;gap:0;}
                .input-suffix input{border-radius:9px 0 0 9px !important;border-right:none !important;}
                .suffix-label{padding:0 12px;height:44px;display:flex;align-items:center;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:0 9px 9px 0;font-size:12px;color:#64748b;white-space:nowrap;font-family:inherit;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="tc-wrap">

                    {/* Hero */}
                    <div className="tc-hero">
                        <div className="tc-hero-ico"><Settings size={22} color="rgba(255,255,255,0.8)"/></div>
                        <div className="tc-hero-info">
                            <div className="tc-hero-name">Configuration — {tenant.name}</div>
                            <div className="tc-hero-sub">Paramètres avancés · Plafonds · Notifications · Limites</div>
                        </div>
                    </div>

                    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                        {/* ── Plafond NN300 ── */}
                        <div className="tc-card">
                            <div className="tc-card-hdr">
                                <div className="tc-card-ico" style={{ background:'#fff7ed' }}><Shield size={17} color="#f97316"/></div>
                                <div>
                                    <div className="tc-card-ttl">Plafond NN300</div>
                                    <div className="tc-card-sub">Limite de souscription et alertes automatiques</div>
                                </div>
                            </div>
                            <div className="tc-card-body">
                                {recentlySuccessful && <div className="status-ok"><Check size={13}/>Configuration enregistrée.</div>}

                                <div className="form-grid">
                                    {/* Plafond NN300 */}
                                    <div className="grid gap-2">
                                        <Label className="tc-label">Plafond NN300</Label>
                                        <div className="input-suffix">
                                            <Input
                                                className="h-11"
                                                type="number" min={0}
                                                value={data.subscription_limit_config.nn300_limit}
                                                onChange={e => setData('subscription_limit_config', {
                                                    ...data.subscription_limit_config,
                                                    nn300_limit: Number(e.target.value),
                                                })}
                                            />
                                            <span className="suffix-label">{tenant.currency}</span>
                                        </div>
                                        <InputError message={errors['subscription_limit_config.nn300_limit']}/>
                                    </div>

                                    {/* Seuil d'alerte */}
                                    <div className="grid gap-2">
                                        <Label className="tc-label">Seuil d'alerte</Label>
                                        <div className="input-suffix">
                                            <Input
                                                className="h-11"
                                                type="number" min={1} max={99}
                                                value={data.subscription_limit_config.alert_threshold}
                                                onChange={e => setData('subscription_limit_config', {
                                                    ...data.subscription_limit_config,
                                                    alert_threshold: Number(e.target.value),
                                                })}
                                            />
                                            <span className="suffix-label">%</span>
                                        </div>
                                        <span style={{ fontSize:11, color:'#94a3b8' }}>Alerte envoyée à ce pourcentage de consommation</span>
                                    </div>
                                </div>

                                <Toggle
                                    value={data.subscription_limit_config.block_at_100_percent}
                                    onChange={() => setData('subscription_limit_config', {
                                        ...data.subscription_limit_config,
                                        block_at_100_percent: !data.subscription_limit_config.block_at_100_percent,
                                    })}
                                    label="Bloquer à 100% du plafond"
                                    desc="Nouvelles soumissions refusées automatiquement quand le plafond est atteint"
                                />
                            </div>
                        </div>

                        {/* ── Notifications ── */}
                        <div className="tc-card">
                            <div className="tc-card-hdr">
                                <div className="tc-card-ico" style={{ background:'#eff6ff' }}><Bell size={17} color="#3b82f6"/></div>
                                <div>
                                    <div className="tc-card-ttl">Notifications</div>
                                    <div className="tc-card-sub">Canaux de notification actifs pour cette filiale</div>
                                </div>
                            </div>
                            <div className="tc-card-body">
                                <Toggle
                                    value={data.settings.notifications_enabled}
                                    onChange={() => setData('settings', { ...data.settings, notifications_enabled: !data.settings.notifications_enabled })}
                                    label="Notifications activées"
                                    desc="Activer ou désactiver toutes les notifications pour cette filiale"
                                />
                                <Toggle
                                    value={data.settings.email_notifications}
                                    onChange={() => setData('settings', { ...data.settings, email_notifications: !data.settings.email_notifications })}
                                    label="Notifications email"
                                    desc="Envoi d'emails pour les événements critiques"
                                />
                                <Toggle
                                    value={data.settings.sms_notifications}
                                    onChange={() => setData('settings', { ...data.settings, sms_notifications: !data.settings.sms_notifications })}
                                    label="Notifications SMS"
                                    desc="Envoi de SMS pour les alertes urgentes"
                                />
                            </div>
                        </div>

                        {/* ── Limites ── */}
                        <div className="tc-card">
                            <div className="tc-card-hdr">
                                <div className="tc-card-ico" style={{ background:'#f0fdf4' }}><Database size={17} color="#16a34a"/></div>
                                <div>
                                    <div className="tc-card-ttl">Limites de capacité</div>
                                    <div className="tc-card-sub">0 = illimité</div>
                                </div>
                            </div>
                            <div className="tc-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tc-label">Utilisateurs max</Label>
                                        <Input className="h-11" type="number" min={0}
                                               value={data.settings.max_users}
                                               onChange={e => setData('settings', { ...data.settings, max_users: Number(e.target.value) })}
                                               placeholder="0 = illimité"/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tc-label">Contrats max</Label>
                                        <Input className="h-11" type="number" min={0}
                                               value={data.settings.max_contracts}
                                               onChange={e => setData('settings', { ...data.settings, max_contracts: Number(e.target.value) })}
                                               placeholder="0 = illimité"/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tc-label">Certificats max</Label>
                                        <Input className="h-11" type="number" min={0}
                                               value={data.settings.max_certificates}
                                               onChange={e => setData('settings', { ...data.settings, max_certificates: Number(e.target.value) })}
                                               placeholder="0 = illimité"/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tc-label">Rétention données (jours)</Label>
                                        <div className="input-suffix">
                                            <Input className="h-11" type="number" min={30}
                                                   value={data.settings.retention_days}
                                                   onChange={e => setData('settings', { ...data.settings, retention_days: Number(e.target.value) })}/>
                                            <span className="suffix-label">jours</span>
                                        </div>
                                        <span style={{ fontSize:11, color:'#94a3b8' }}>Durée de conservation des audit logs</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8 }}>
                            <Button type="submit" disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                {processing ? 'Enregistrement…' : <><Check size={14}/> Enregistrer la configuration</>}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Annuler
                            </Button>
                        </div>
                    </form>

                </div>
            </div>
        </AppLayout>
    );
}