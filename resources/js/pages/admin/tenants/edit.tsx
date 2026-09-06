import { Head, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { Building2, Check, Camera, Trash2, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TenantSettings {
    locale?: string;
    timezone?: string;
    siege_social?: string;
    phone?: string;
    website?: string;
    email?: string;
    capital?: string;
    rccm?: string;
    regulator?: string;
    payment_address?: string;
    surveyor_name?: string;
    surveyor_address?: string;
    city?: string;
}
interface Tenant {
    id: string; name: string; code: string; country_code: string;
    currency_code: string; is_active: boolean;
    logo_path: string | null;
    subscription_limit_config: { nn300_limit: number };
    settings: TenantSettings | null;
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
    const { t } = useTranslation('tenants');
    const { t: tc } = useTranslation('common');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('edit.breadcrumb.tenants'),   href: '/admin/tenants' },
        { title: tenant.name, href: route('admin.tenants.show', { tenant: tenant.id }) },
        { title: t('edit.breadcrumb.edit') },
    ];

    const fileRef                       = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        tenant.logo_path ? `/storage/${tenant.logo_path}` : null
    );
    const [logoFile, setLogoFile]       = useState<File | null>(null);
    const [uploading, setUploading]     = useState(false);

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name:         tenant.name,
        code:         tenant.code,
        country_code: tenant.country_code,
        currency_code: tenant.currency_code,
        locale:       tenant.settings?.locale   ?? 'fr',
        timezone:     tenant.settings?.timezone ?? 'Africa/Abidjan',
        is_active:    tenant.is_active,
        subscription_limit_config: tenant.subscription_limit_config ?? { nn300_limit: 0 },
        settings: {
            siege_social:     tenant.settings?.siege_social     ?? '',
            phone:            tenant.settings?.phone            ?? '',
            website:          tenant.settings?.website          ?? '',
            email:            tenant.settings?.email            ?? '',
            capital:          tenant.settings?.capital          ?? '',
            rccm:             tenant.settings?.rccm             ?? '',
            regulator:        tenant.settings?.regulator        ?? '',
            payment_address:  tenant.settings?.payment_address  ?? '',
            surveyor_name:    tenant.settings?.surveyor_name    ?? '',
            surveyor_address: tenant.settings?.surveyor_address ?? '',
            city:             tenant.settings?.city             ?? '',
        } as TenantSettings,
    });

    // Inertia ne démonte pas ce composant en passant de la fiche d'une
    // filiale à celle d'une autre (même route/composant `admin/tenants/edit`,
    // seules les props changent) — sans ce reset explicite, `useState`/
    // `useForm` gardent leurs valeurs initiales (logo, coordonnées…) de la
    // PRÉCÉDENTE filiale éditée au lieu de celles de `tenant`.
    useEffect(() => {
        setLogoPreview(tenant.logo_path ? `/storage/${tenant.logo_path}` : null);
        setLogoFile(null);
        setData({
            name:         tenant.name,
            code:         tenant.code,
            country_code: tenant.country_code,
            currency_code: tenant.currency_code,
            locale:       tenant.settings?.locale   ?? 'fr',
            timezone:     tenant.settings?.timezone ?? 'Africa/Abidjan',
            is_active:    tenant.is_active,
            subscription_limit_config: tenant.subscription_limit_config ?? { nn300_limit: 0 },
            settings: {
                siege_social:     tenant.settings?.siege_social     ?? '',
                phone:            tenant.settings?.phone            ?? '',
                website:          tenant.settings?.website          ?? '',
                email:            tenant.settings?.email            ?? '',
                capital:          tenant.settings?.capital          ?? '',
                rccm:             tenant.settings?.rccm             ?? '',
                regulator:        tenant.settings?.regulator        ?? '',
                payment_address:  tenant.settings?.payment_address  ?? '',
                surveyor_name:    tenant.settings?.surveyor_name    ?? '',
                surveyor_address: tenant.settings?.surveyor_address ?? '',
                city:             tenant.settings?.city             ?? '',
            } as TenantSettings,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenant.id]);

    function setSetting(key: keyof TenantSettings, value: string) {
        setData('settings', { ...data.settings, [key]: value });
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleLogoUpload = () => {
        if (!logoFile) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('logo', logoFile);
        router.post(route('admin.tenants.logo.update', { tenant: tenant.id }), formData, {
            forceFormData: true,
            onSuccess: () => { setUploading(false); setLogoFile(null); },
            onError:   () => setUploading(false),
        });
    };

    const handleLogoRemove = () => {
        if (!confirm(t('edit.logo.confirmRemove'))) return;
        router.delete(route('admin.tenants.logo.remove', { tenant: tenant.id }), {
            onSuccess: () => { setLogoPreview(null); setLogoFile(null); },
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.tenants.update', { tenant: tenant.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('edit.title', { name: tenant.name })}/>
            <style>{`
                .te-wrap{width:100%;max-width:760px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .te-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .te-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .te-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;overflow:hidden;}
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
                .te-toggle{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;cursor:pointer;}
                .te-toggle-box{width:40px;height:22px;border-radius:11px;position:relative;flex-shrink:0;transition:background .2s;}
                .te-toggle-thumb{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:3px;transition:left .2s;}
                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px 13px;font-size:12px;color:#15803d;display:flex;align-items:center;gap:6px;}

                /* Logo */
                .logo-zone{display:flex;align-items:center;gap:16px;}
                .logo-preview{width:80px;height:80px;border-radius:12px;border:1.5px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
                .logo-preview img{width:100%;height:100%;object-fit:contain;padding:4px;}
                .logo-actions{display:flex;flex-direction:column;gap:8px;}
                .logo-btn-row{display:flex;gap:8px;flex-wrap:wrap;}
                .logo-upload-btn{padding:8px 14px;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:9px;font-size:12px;color:#475569;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:all .15s;}
                .logo-upload-btn:hover{background:#f1f5f9;border-color:#94a3b8;color:#1e293b;}
                .logo-hint{font-size:11px;color:#94a3b8;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="te-wrap">

                    {/* Hero */}
                    <div className="te-hero">
                        <div className="te-hero-ico">
                            {logoPreview
                                ? <img src={logoPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }}/>
                                : <Building2 size={22} color="rgba(255,255,255,0.8)"/>
                            }
                        </div>
                        <div className="te-hero-info">
                            <div className="te-hero-title">{t('edit.hero.title', { name: tenant.name })}</div>
                            <div className="te-hero-sub">{t('edit.hero.sub', { code: tenant.code, currency: tenant.currency_code })}</div>
                        </div>
                    </div>

                    {/* ── Section Logo ── */}
                    <div className="te-card">
                        <div className="te-card-hdr">
                            <div className="te-card-ttl">{t('edit.logo.title')}</div>
                            <div className="te-card-sub">{t('edit.logo.subtitle')}</div>
                        </div>
                        <div className="te-card-body">
                            {recentlySuccessful && <div className="status-ok"><Check size={13}/>{t('edit.logo.updated')}</div>}
                            <div className="logo-zone">
                                <div className="logo-preview">
                                    {logoPreview
                                        ? <img src={logoPreview} alt="Logo"/>
                                        : <Building2 size={24} color="#cbd5e1"/>
                                    }
                                </div>
                                <div className="logo-actions">
                                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                           style={{ display:'none' }} onChange={handleLogoChange}/>
                                    <div className="logo-btn-row">
                                        <button type="button" className="logo-upload-btn" onClick={() => fileRef.current?.click()}>
                                            <Camera size={13}/> {t('edit.logo.choose')}
                                        </button>
                                        {logoPreview && (
                                            <button type="button" onClick={handleLogoRemove}
                                                    style={{ padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, fontSize:12, color:'#dc2626', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                                                <Trash2 size={12}/> {t('edit.logo.remove')}
                                            </button>
                                        )}
                                    </div>
                                    <span className="logo-hint">{t('edit.logo.hint')}</span>
                                </div>
                                {logoFile && (
                                    <Button onClick={handleLogoUpload} disabled={uploading}
                                            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5 flex-shrink-0">
                                        {uploading ? t('edit.logo.uploading') : <><Check size={14}/> {t('edit.logo.save')}</>}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Formulaire infos ── */}
                    <div className="te-card">
                        <div className="te-card-hdr">
                            <div className="te-card-ttl">{t('edit.form.title')}</div>
                            <div className="te-card-sub">{t('edit.form.subtitle')}</div>
                        </div>
                        <div className="te-card-body">
                            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                                {recentlySuccessful && (
                                    <div className="status-ok"><Check size={13}/>{t('edit.form.saved')}</div>
                                )}

                                <div className="grid gap-2">
                                    <Label className="te-label">{t('edit.fields.name')}</Label>
                                    <Input className="h-11" value={data.name} onChange={e => setData('name', e.target.value)} placeholder={t('edit.fields.namePlaceholder')}/>
                                    <InputError message={errors.name}/>
                                </div>

                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="te-label">{t('edit.fields.code')}</Label>
                                        <Input className="h-11" value={data.code} onChange={e => setData('code', e.target.value.toUpperCase())} placeholder={t('edit.fields.codePlaceholder')} maxLength={10} style={{ fontFamily:'monospace', letterSpacing:'.1em' }}/>
                                        <InputError message={errors.code}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="te-label">{t('edit.fields.countryCode')}</Label>
                                        <Input className="h-11" value={data.country_code} onChange={e => setData('country_code', e.target.value.toUpperCase())} placeholder={t('edit.fields.codePlaceholder')} maxLength={2} style={{ fontFamily:'monospace', letterSpacing:'.1em' }}/>
                                        <InputError message={errors.country_code}/>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="te-label">{t('edit.fields.currency')}</Label>
                                        <select className="te-select" value={data.currency_code} onChange={e => setData('currency_code', e.target.value)}>
                                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <InputError message={errors.currency_code}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="te-label">{t('edit.fields.locale')}</Label>
                                        <select className="te-select" value={data.locale} onChange={e => setData('locale', e.target.value)}>
                                            <option value="fr">{t('edit.fields.localeFr')}</option>
                                            <option value="en">{t('edit.fields.localeEn')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="te-label">{t('edit.fields.timezone')}</Label>
                                    <select className="te-select" value={data.timezone} onChange={e => setData('timezone', e.target.value)}>
                                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="te-label">{t('edit.fields.nn300Limit')}</Label>
                                    <Input className="h-11" type="number" min={0}
                                           value={data.subscription_limit_config?.nn300_limit ?? 0}
                                           onChange={e => setData('subscription_limit_config', { nn300_limit: Number(e.target.value) })}/>
                                </div>

                                <div>
                                    <Label className="te-label" style={{ marginBottom:8, display:'block' }}>{t('edit.fields.status')}</Label>
                                    <div className="te-toggle" onClick={() => setData('is_active', !data.is_active)}>
                                        <div className="te-toggle-box" style={{ background: data.is_active ? '#1e3a8a' : '#e2e8f0' }}>
                                            <div className="te-toggle-thumb" style={{ left: data.is_active ? '21px' : '3px' }}/>
                                        </div>
                                        <div>
                                            <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{data.is_active ? t('edit.status.active') : t('edit.status.inactive')}</div>
                                            <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{data.is_active ? t('edit.status.activeDesc') : t('edit.status.inactiveDesc')}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section : Informations certificat (impression) ── */}
                                <div style={{ borderTop: '1.5px solid #f1f5f9', paddingTop: 16, marginTop: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                        <div style={{ width: 28, height: 28, background: '#eff6ff', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <FileText size={14} color="#3b82f6" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t('edit.print.title')}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{t('edit.print.subtitle')}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                                        <div className="grid gap-2">
                                            <Label className="te-label">{t('edit.print.headOffice')}</Label>
                                            <textarea
                                                rows={3}
                                                value={data.settings.siege_social}
                                                onChange={e => setSetting('siege_social', e.target.value)}
                                                placeholder={t('edit.print.headOfficePlaceholder')}
                                                style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', color: '#1e293b', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        <div className="form-grid">
                                            <div className="grid gap-2">
                                                <Label className="te-label">{t('edit.print.phone')}</Label>
                                                <Input className="h-11" value={data.settings.phone} onChange={e => setSetting('phone', e.target.value)} placeholder={t('edit.print.phonePlaceholder')}/>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="te-label">{t('edit.print.city')}</Label>
                                                <Input className="h-11" value={data.settings.city} onChange={e => setSetting('city', e.target.value)} placeholder={t('edit.print.cityPlaceholder')}/>
                                            </div>
                                        </div>

                                        <div className="form-grid">
                                            <div className="grid gap-2">
                                                <Label className="te-label">{t('edit.print.website')}</Label>
                                                <Input className="h-11" value={data.settings.website} onChange={e => setSetting('website', e.target.value)} placeholder={t('edit.print.websitePlaceholder')}/>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="te-label">{t('edit.print.email')}</Label>
                                                <Input className="h-11" type="email" value={data.settings.email} onChange={e => setSetting('email', e.target.value)} placeholder={t('edit.print.emailPlaceholder')}/>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="te-label">{t('edit.print.capital')}</Label>
                                            <Input className="h-11" value={data.settings.capital} onChange={e => setSetting('capital', e.target.value)} placeholder={t('edit.print.capitalPlaceholder')}/>
                                        </div>

                                        <div className="form-grid">
                                            <div className="grid gap-2">
                                                <Label className="te-label">{t('edit.print.rccm')}</Label>
                                                <Input className="h-11" value={data.settings.rccm} onChange={e => setSetting('rccm', e.target.value)} placeholder={t('edit.print.rccmPlaceholder')}/>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="te-label">{t('edit.print.regulator')}</Label>
                                                <Input className="h-11" value={data.settings.regulator} onChange={e => setSetting('regulator', e.target.value)} placeholder={t('edit.print.regulatorPlaceholder')}/>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="te-label">{t('edit.print.paymentAddress')}</Label>
                                            <textarea
                                                rows={2}
                                                value={data.settings.payment_address}
                                                onChange={e => setSetting('payment_address', e.target.value)}
                                                placeholder={t('edit.print.paymentAddressPlaceholder')}
                                                style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', color: '#1e293b', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        <div className="form-grid">
                                            <div className="grid gap-2">
                                                <Label className="te-label">{t('edit.print.surveyorName')}</Label>
                                                <Input className="h-11" value={data.settings.surveyor_name} onChange={e => setSetting('surveyor_name', e.target.value)} placeholder={t('edit.print.surveyorNamePlaceholder')}/>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="te-label">{t('edit.print.surveyorAddress')}</Label>
                                                <Input className="h-11" value={data.settings.surveyor_address} onChange={e => setSetting('surveyor_address', e.target.value)} placeholder={t('edit.print.surveyorAddressPlaceholder')}/>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div style={{ display:'flex', gap:8, paddingTop:4, borderTop:'1px solid #f8fafc', marginTop:4 }}>
                                    <Button type="submit" disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                        {processing ? t('edit.actions.saving') : <><Check size={14}/> {t('edit.actions.save')}</>}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>{tc('actions.cancel')}</Button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}