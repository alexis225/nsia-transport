import { Head, useForm } from '@inertiajs/react';
import { Building2, Check, Camera } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const TIMEZONES = [
    'Africa/Abidjan',
    'Africa/Dakar',
    'Africa/Bamako',
    'Africa/Conakry',
    'Africa/Ouagadougou',
    'Africa/Lome',
    'Africa/Cotonou',
    'Africa/Douala',
    'Africa/Lagos',
    'Africa/Libreville',
    'Africa/Brazzaville',
    'Africa/Antananarivo',
    'UTC',
];
const CURRENCIES = ['XOF', 'XAF', 'GNF', 'MGA', 'NGN', 'EUR', 'USD'];

export default function TenantCreate() {
    const { t } = useTranslation('tenants');
    const { t: tc } = useTranslation('common');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('create.breadcrumb.tenants'), href: '/admin/tenants' },
        { title: t('create.breadcrumb.new') },
    ];

    const fileRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // useForm avec forceFormData pour supporter le fichier
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        code: string;
        country_code: string;
        currency_code: string;
        locale: string;
        timezone: string;
        is_active: boolean;
        logo: File | null;
        subscription_limit_config: { nn300_limit: number };
    }>({
        name: '',
        code: '',
        country_code: '',
        currency_code: 'XOF',
        locale: 'fr',
        timezone: 'Africa/Abidjan',
        is_active: true,
        logo: null,
        subscription_limit_config: { nn300_limit: 0 },
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        setData('logo', file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.tenants.store'), {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create.title')} />
            <style>{`
                .tc-wrap{width:100%;max-width:760px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .tc-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .tc-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .tc-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;overflow:hidden;}
                .tc-hero-info{position:relative;z-index:1;}
                .tc-hero-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .tc-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .tc-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .tc-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .tc-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .tc-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .tc-card-body{padding:22px;display:flex;flex-direction:column;gap:16px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
                .tc-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .tc-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .tc-select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.08);}
                .tc-toggle{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;cursor:pointer;}
                .tc-toggle-box{width:40px;height:22px;border-radius:11px;position:relative;flex-shrink:0;transition:background .2s;}
                .tc-toggle-thumb{width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:3px;transition:left .2s;}

                /* Logo */
                .logo-zone{display:flex;align-items:center;gap:16px;}
                .logo-preview{width:80px;height:80px;border-radius:12px;border:1.5px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;cursor:pointer;transition:border-color .15s;}
                .logo-preview:hover{border-color:#94a3b8;}
                .logo-preview img{width:100%;height:100%;object-fit:contain;padding:4px;}
                .logo-upload-btn{padding:8px 14px;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:9px;font-size:12px;color:#475569;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:all .15s;}
                .logo-upload-btn:hover{background:#f1f5f9;border-color:#94a3b8;color:#1e293b;}
                .logo-hint{font-size:11px;color:#94a3b8;margin-top:4px;}
                .logo-selected{font-size:11px;color:#16a34a;margin-top:4px;display:flex;align-items:center;gap:4px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="tc-wrap">
                    {/* Hero */}
                    <div className="tc-hero">
                        <div
                            className="tc-hero-ico"
                            onClick={() => fileRef.current?.click()}
                            title={t('create.hero.logoTooltip')}
                        >
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt=""
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        padding: 4,
                                    }}
                                />
                            ) : (
                                <Building2
                                    size={22}
                                    color="rgba(255,255,255,0.8)"
                                />
                            )}
                        </div>
                        <div className="tc-hero-info">
                            <div className="tc-hero-title">
                                {t('create.hero.title')}
                            </div>
                            <div className="tc-hero-sub">
                                {t('create.hero.subtitle')}
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={submit}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                    >
                        {/* ── Logo ── */}
                        <div className="tc-card">
                            <div className="tc-card-hdr">
                                <div className="tc-card-ttl">
                                    {t('create.logo.title')}
                                </div>
                                <div className="tc-card-sub">
                                    {t('create.logo.subtitle')}
                                </div>
                            </div>
                            <div className="tc-card-body">
                                <div className="logo-zone">
                                    <div
                                        className="logo-preview"
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" />
                                        ) : (
                                            <Building2
                                                size={24}
                                                color="#cbd5e1"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                            style={{ display: 'none' }}
                                            onChange={handleLogoChange}
                                        />
                                        <button
                                            type="button"
                                            className="logo-upload-btn"
                                            onClick={() =>
                                                fileRef.current?.click()
                                            }
                                        >
                                            <Camera size={13} />{' '}
                                            {t('create.logo.choose')}
                                        </button>
                                        {data.logo ? (
                                            <div className="logo-selected">
                                                <Check size={11} />
                                                {(data.logo as File).name}
                                            </div>
                                        ) : (
                                            <div className="logo-hint">
                                                {t('create.logo.hint')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <InputError message={errors.logo} />
                            </div>
                        </div>

                        {/* ── Informations ── */}
                        <div className="tc-card">
                            <div className="tc-card-hdr">
                                <div className="tc-card-ttl">
                                    {t('create.info.title')}
                                </div>
                                <div className="tc-card-sub">
                                    {t('create.info.subtitle')}
                                </div>
                            </div>
                            <div className="tc-card-body">
                                <div className="grid gap-2">
                                    <Label className="tc-label">
                                        {t('create.fields.name')}
                                    </Label>
                                    <Input
                                        className="h-11"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder={t(
                                            'create.fields.namePlaceholder',
                                        )}
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tc-label">
                                            {t('create.fields.code')}
                                        </Label>
                                        <Input
                                            className="h-11"
                                            value={data.code}
                                            onChange={(e) =>
                                                setData(
                                                    'code',
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            placeholder={t(
                                                'create.fields.codePlaceholder',
                                            )}
                                            maxLength={10}
                                            style={{
                                                fontFamily: 'monospace',
                                                letterSpacing: '.1em',
                                            }}
                                        />
                                        <InputError message={errors.code} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tc-label">
                                            {t('create.fields.countryCode')}
                                        </Label>
                                        <Input
                                            className="h-11"
                                            value={data.country_code}
                                            onChange={(e) =>
                                                setData(
                                                    'country_code',
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            placeholder={t(
                                                'create.fields.codePlaceholder',
                                            )}
                                            maxLength={2}
                                            style={{
                                                fontFamily: 'monospace',
                                                letterSpacing: '.1em',
                                            }}
                                        />
                                        <InputError
                                            message={errors.country_code}
                                        />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tc-label">
                                            {t('create.fields.currency')}
                                        </Label>
                                        <select
                                            className="tc-select"
                                            value={data.currency_code}
                                            onChange={(e) =>
                                                setData(
                                                    'currency_code',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {CURRENCIES.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tc-label">
                                            {t('create.fields.locale')}
                                        </Label>
                                        <select
                                            className="tc-select"
                                            value={data.locale}
                                            onChange={(e) =>
                                                setData(
                                                    'locale',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="fr">
                                                {t('create.fields.localeFr')}
                                            </option>
                                            <option value="en">
                                                {t('create.fields.localeEn')}
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="tc-label">
                                        {t('create.fields.timezone')}
                                    </Label>
                                    <select
                                        className="tc-select"
                                        value={data.timezone}
                                        onChange={(e) =>
                                            setData('timezone', e.target.value)
                                        }
                                    >
                                        {TIMEZONES.map((tz) => (
                                            <option key={tz} value={tz}>
                                                {tz}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="tc-label">
                                        {t('create.fields.nn300Limit')}
                                    </Label>
                                    <Input
                                        className="h-11"
                                        type="number"
                                        min={0}
                                        value={
                                            data.subscription_limit_config
                                                .nn300_limit
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'subscription_limit_config',
                                                {
                                                    nn300_limit: Number(
                                                        e.target.value,
                                                    ),
                                                },
                                            )
                                        }
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <Label
                                        className="tc-label"
                                        style={{
                                            marginBottom: 8,
                                            display: 'block',
                                        }}
                                    >
                                        {t('create.fields.status')}
                                    </Label>
                                    <div
                                        className="tc-toggle"
                                        onClick={() =>
                                            setData(
                                                'is_active',
                                                !data.is_active,
                                            )
                                        }
                                    >
                                        <div
                                            className="tc-toggle-box"
                                            style={{
                                                background: data.is_active
                                                    ? '#1e3a8a'
                                                    : '#e2e8f0',
                                            }}
                                        >
                                            <div
                                                className="tc-toggle-thumb"
                                                style={{
                                                    left: data.is_active
                                                        ? '21px'
                                                        : '3px',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    color: '#1e293b',
                                                }}
                                            >
                                                {data.is_active
                                                    ? t('create.status.active')
                                                    : t(
                                                          'create.status.inactive',
                                                      )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: '#94a3b8',
                                                    marginTop: 1,
                                                }}
                                            >
                                                {data.is_active
                                                    ? t(
                                                          'create.status.activeDesc',
                                                      )
                                                    : t(
                                                          'create.status.inactiveDesc',
                                                      )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        paddingTop: 4,
                                        borderTop: '1px solid #f8fafc',
                                        marginTop: 4,
                                    }}
                                >
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-10 bg-[#1e3a8a] px-5 text-white hover:bg-[#1e40af]"
                                    >
                                        {processing ? (
                                            t('create.actions.creating')
                                        ) : (
                                            <>
                                                <Building2 size={14} />{' '}
                                                {t('create.actions.create')}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                    >
                                        {tc('actions.cancel')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
