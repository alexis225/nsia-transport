import { Head, useForm } from '@inertiajs/react';
import { Briefcase, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Tenant { id: string; name: string; code: string; }
interface Props {
    tenants:         Tenant[];
    allTenants:      Tenant[];
    defaultTenantId: string | null;
}

const COUNTRIES = [
    { code:'CI', name:'Côte d\'Ivoire' }, { code:'SN', name:'Sénégal' },
    { code:'ML', name:'Mali' }, { code:'BF', name:'Burkina Faso' },
    { code:'GN', name:'Guinée' }, { code:'TG', name:'Togo' },
    { code:'BJ', name:'Bénin' }, { code:'CM', name:'Cameroun' },
    { code:'CG', name:'Congo' }, { code:'GA', name:'Gabon' },
    { code:'MG', name:'Madagascar' }, { code:'NG', name:'Nigeria' },
    { code:'FR', name:'France' }, { code:'BE', name:'Belgique' },
    { code:'CH', name:'Suisse' }, { code:'MA', name:'Maroc' },
    { code:'DZ', name:'Algérie' }, { code:'TN', name:'Tunisie' },
];

export default function BrokerCreate({ tenants, allTenants, defaultTenantId }: Props) {
    const { t } = useTranslation('brokers');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('index.breadcrumb'), href: '/admin/brokers' },
        { title: t('create.breadcrumb'), href: '/admin/brokers/create' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name:             '',
        code:             '',
        type:             'courtier_local' as 'courtier_local' | 'partenaire_etranger',
        registration_number: '',
        email:            '',
        phone:            '',
        phone_secondary:  '',
        address:          '',
        city:             '',
        country_code:     'CI',
        commission_rate:  '',
        is_active:        true,
        tenant_id:        defaultTenantId ?? '',
        additional_tenant_ids: [] as string[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.brokers.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create.title')}/>
            <BrokerForm
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                tenants={tenants} allTenants={allTenants}
                submitLabel={t('create.submitLabel')}
                heroTitle={t('create.heroTitle')}
                heroSub={t('create.heroSub')}
            />
        </AppLayout>
    );
}

// ── Formulaire partagé ────────────────────────────────────────
export function BrokerForm({ data, setData, errors, processing, onSubmit, tenants, allTenants, submitLabel, heroTitle, heroSub }: any) {
    const { t } = useTranslation('brokers');
    const { t: tc } = useTranslation('common');
    const toggleAdditionalTenant = (id: string) => {
        const current: string[] = data.additional_tenant_ids ?? [];
        setData('additional_tenant_ids', current.includes(id)
            ? current.filter((t: string) => t !== id)
            : [...current, id]);
    };

    return (
        <>
            <style>{`
                .bf-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .bf-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .bf-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .bf-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;}
                .bf-hero-info{position:relative;z-index:1;}
                .bf-hero-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .bf-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .bf-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .bf-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .bf-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .bf-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .bf-card-body{padding:22px;display:flex;flex-direction:column;gap:16px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
                .form-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}
                .bf-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .bf-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .bf-select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.08);}
                .bf-toggle{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;cursor:pointer;}
                .bf-toggle-box{width:40px;height:22px;border-radius:11px;position:relative;flex-shrink:0;transition:background .2s;}
                .bf-toggle-thumb{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:3px;transition:left .2s;}
                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px 13px;font-size:12px;color:#15803d;display:flex;align-items:center;gap:6px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="bf-wrap">

                    {/* Hero */}
                    <div className="bf-hero">
                        <div className="bf-hero-ico"><Briefcase size={22} color="rgba(255,255,255,0.8)"/></div>
                        <div className="bf-hero-info">
                            <div className="bf-hero-title">{heroTitle}</div>
                            <div className="bf-hero-sub">{heroSub}</div>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                        {/* ── Identification ── */}
                        <div className="bf-card">
                            <div className="bf-card-hdr">
                                <div className="bf-card-ttl">{t('form.identification.title')}</div>
                                <div className="bf-card-sub">{t('form.identification.subtitle')}</div>
                            </div>
                            <div className="bf-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.identification.name')}</Label>
                                        <Input className="h-11" value={data.name} onChange={e => setData('name', e.target.value)} placeholder={t('form.identification.namePlaceholder')}/>
                                        <InputError message={errors.name}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.identification.code')}</Label>
                                        <Input className="h-11" value={data.code}
                                               onChange={e => setData('code', e.target.value.toUpperCase())}
                                               placeholder={t('form.identification.codePlaceholder')} maxLength={20}
                                               style={{ fontFamily:'monospace', letterSpacing:'.06em' }}/>
                                        <InputError message={errors.code}/>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.identification.type')}</Label>
                                        <select className="bf-select" value={data.type} onChange={e => setData('type', e.target.value)}>
                                            <option value="courtier_local">{t('form.identification.typeLocal')}</option>
                                            <option value="partenaire_etranger">{t('form.identification.typeForeign')}</option>
                                        </select>
                                        <InputError message={errors.type}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.identification.registrationNumber')}</Label>
                                        <Input className="h-11" value={data.registration_number}
                                               onChange={e => setData('registration_number', e.target.value)}
                                               placeholder={t('form.identification.registrationNumberPlaceholder')}/>
                                        <InputError message={errors.registration_number}/>
                                    </div>
                                </div>

                                {tenants?.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.identification.mainTenant')}</Label>
                                        <select className="bf-select" value={data.tenant_id} onChange={e => setData('tenant_id', e.target.value)}>
                                            <option value="">{t('form.identification.selectTenant')}</option>
                                            {tenants.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                                        </select>
                                        <InputError message={errors.tenant_id}/>
                                    </div>
                                )}

                                {allTenants?.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.identification.additionalTenants')}</Label>
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: -6, marginBottom: 2 }}>
                                            {t('form.identification.additionalTenantsHint')}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: 10 }}>
                                            {allTenants
                                                .filter((t: any) => t.id !== data.tenant_id)
                                                .map((t: any) => (
                                                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1e293b', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={(data.additional_tenant_ids ?? []).includes(t.id)}
                                                            onChange={() => toggleAdditionalTenant(t.id)}
                                                        />
                                                        {t.name} ({t.code})
                                                    </label>
                                                ))}
                                        </div>
                                        <InputError message={errors.additional_tenant_ids}/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Commission ── */}
                        <div className="bf-card">
                            <div className="bf-card-hdr">
                                <div className="bf-card-ttl">{t('form.commission.title')}</div>
                                <div className="bf-card-sub">{t('form.commission.subtitle')}</div>
                            </div>
                            <div className="bf-card-body">
                                <div className="grid gap-2">
                                    <Label className="bf-label">{t('form.commission.rate')}</Label>
                                    <Input className="h-11" type="number" step="0.01" min={0} max={100}
                                           value={data.commission_rate} onChange={e => setData('commission_rate', e.target.value)}
                                           placeholder={t('form.commission.ratePlaceholder')}/>
                                    <InputError message={errors.commission_rate}/>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                        {t('form.commission.hint')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Contact ── */}
                        <div className="bf-card">
                            <div className="bf-card-hdr">
                                <div className="bf-card-ttl">{t('form.contact.title')}</div>
                                <div className="bf-card-sub">{t('form.contact.subtitle')}</div>
                            </div>
                            <div className="bf-card-body">
                                <div className="grid gap-2">
                                    <Label className="bf-label">{t('form.contact.email')}</Label>
                                    <Input className="h-11" type="email" value={data.email}
                                           onChange={e => setData('email', e.target.value)}
                                           placeholder={t('form.contact.emailPlaceholder')}/>
                                    <InputError message={errors.email}/>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.contact.phone')}</Label>
                                        <Input className="h-11" type="tel" value={data.phone}
                                               onChange={e => setData('phone', e.target.value)}
                                               placeholder={t('form.contact.phonePlaceholder')}/>
                                        <InputError message={errors.phone}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.contact.phoneSecondary')}</Label>
                                        <Input className="h-11" type="tel" value={data.phone_secondary}
                                               onChange={e => setData('phone_secondary', e.target.value)}
                                               placeholder={t('form.contact.phonePlaceholder')}/>
                                        <InputError message={errors.phone_secondary}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Adresse ── */}
                        <div className="bf-card">
                            <div className="bf-card-hdr">
                                <div className="bf-card-ttl">{t('form.address.title')}</div>
                                <div className="bf-card-sub">{t('form.address.subtitle')}</div>
                            </div>
                            <div className="bf-card-body">
                                <div className="grid gap-2">
                                    <Label className="bf-label">{t('form.address.address')}</Label>
                                    <Input className="h-11" value={data.address}
                                           onChange={e => setData('address', e.target.value)}
                                           placeholder={t('form.address.addressPlaceholder')}/>
                                    <InputError message={errors.address}/>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.address.city')}</Label>
                                        <Input className="h-11" value={data.city}
                                               onChange={e => setData('city', e.target.value)}
                                               placeholder={t('form.address.cityPlaceholder')}/>
                                        <InputError message={errors.city}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="bf-label">{t('form.address.country')}</Label>
                                        <select className="bf-select" value={data.country_code}
                                                onChange={e => setData('country_code', e.target.value)}>
                                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                        </select>
                                        <InputError message={errors.country_code}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Statut ── */}
                        <div className="bf-card">
                            <div className="bf-card-hdr">
                                <div className="bf-card-ttl">{t('form.status.title')}</div>
                            </div>
                            <div className="bf-card-body">
                                <div className="bf-toggle" onClick={() => setData('is_active', !data.is_active)}>
                                    <div className="bf-toggle-box" style={{ background: data.is_active ? '#1e3a8a' : '#e2e8f0' }}>
                                        <div className="bf-toggle-thumb" style={{ left: data.is_active ? '21px' : '3px' }}/>
                                    </div>
                                    <div>
                                        <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>
                                            {data.is_active ? t('form.status.active') : t('form.status.inactive')}
                                        </div>
                                        <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>
                                            {data.is_active ? t('form.status.activeHint') : t('form.status.inactiveHint')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8 }}>
                            <Button type="submit" disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                {processing ? tc('states.saving') : <><Check size={14}/> {submitLabel}</>}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                {tc('actions.cancel')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}