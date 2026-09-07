import { Head, Link, router } from '@inertiajs/react';
import { Edit2, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Tenant {
    id: string;
    name: string;
    code: string;
}
interface Coinsurer {
    id: string;
    name: string;
    country_code: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    tenant: Tenant | null;
}
interface Props {
    coinsurer: Coinsurer;
}

export default function CoinsurersShow({ coinsurer }: Props) {
    const { t } = useTranslation('coinsurers');
    const { t: tc } = useTranslation('common');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('index.breadcrumb'), href: '/admin/coinsurers' },
        { title: coinsurer.name },
    ];

    const handleToggle = () => {
        const msg = coinsurer.is_active
            ? t('show.confirmDeactivate', { name: coinsurer.name })
            : t('show.confirmActivate', { name: coinsurer.name });

        if (confirm(msg)) {
            router.patch(
                route('admin.coinsurers.toggle', { coinsurer: coinsurer.id }),
            );
        }
    };

    const initials = coinsurer.name.slice(0, 2).toUpperCase();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${coinsurer.name} — NSIA Transport`} />
            <style>{`
                .cs-wrap{width:100%;max-width:720px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .cs-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .cs-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .cs-avatar{width:52px;height:52px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;position:relative;z-index:1;}
                .cs-hero-info{position:relative;z-index:1;flex:1;}
                .cs-hero-name{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .cs-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .cs-hero-actions{display:flex;gap:8px;position:relative;z-index:1;}
                .cs-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .cs-card-hdr{padding:14px 22px;border-bottom:1px solid #f1f5f9;}
                .cs-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .cs-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
                .cs-field{padding:14px 22px;border-bottom:1px solid #f8fafc;}
                .cs-field:nth-child(odd){border-right:1px solid #f8fafc;}
                .cs-field-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:4px;}
                .cs-field-value{font-size:13px;color:#1e293b;font-weight:500;}
                .s-active{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:12px;font-weight:500;}
                .s-inactive{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="cs-wrap">
                    <div className="cs-hero">
                        <div className="cs-avatar">{initials}</div>
                        <div className="cs-hero-info">
                            <div className="cs-hero-name">{coinsurer.name}</div>
                            <div className="cs-hero-sub">
                                {coinsurer.is_active ? (
                                    <span style={{ color: '#86efac' }}>
                                        {'● '}
                                        {tc('states.active')}
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            color: 'rgba(255,255,255,0.4)',
                                        }}
                                    >
                                        {'● '}
                                        {tc('states.inactive')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="cs-hero-actions">
                            <Link
                                href={route('admin.coinsurers.edit', {
                                    coinsurer: coinsurer.id,
                                })}
                            >
                                <Button
                                    size="sm"
                                    className="h-8 border border-white/20 bg-white/10 px-3 text-white hover:bg-white/20"
                                >
                                    <Edit2 size={13} /> {t('show.edit')}
                                </Button>
                            </Link>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-white/20 bg-white/10 px-3 text-white hover:bg-white/20"
                                onClick={handleToggle}
                            >
                                {coinsurer.is_active ? (
                                    <>
                                        <ToggleLeft size={13} />{' '}
                                        {t('show.deactivate')}
                                    </>
                                ) : (
                                    <>
                                        <ToggleRight size={13} />{' '}
                                        {t('show.activate')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="cs-card">
                        <div className="cs-card-hdr">
                            <div className="cs-card-ttl">{t('show.title')}</div>
                        </div>
                        <div className="cs-grid">
                            <div className="cs-field">
                                <div className="cs-field-label">
                                    {t('show.fields.name')}
                                </div>
                                <div className="cs-field-value">
                                    {coinsurer.name}
                                </div>
                            </div>
                            <div className="cs-field">
                                <div className="cs-field-label">
                                    {t('show.fields.country')}
                                </div>
                                <div className="cs-field-value">
                                    {coinsurer.country_code ?? '—'}
                                </div>
                            </div>
                            <div className="cs-field">
                                <div className="cs-field-label">
                                    {t('show.fields.email')}
                                </div>
                                <div className="cs-field-value">
                                    {coinsurer.email ?? '—'}
                                </div>
                            </div>
                            <div className="cs-field">
                                <div className="cs-field-label">
                                    {t('show.fields.phone')}
                                </div>
                                <div className="cs-field-value">
                                    {coinsurer.phone ?? '—'}
                                </div>
                            </div>
                            <div className="cs-field">
                                <div className="cs-field-label">
                                    {t('show.fields.address')}
                                </div>
                                <div className="cs-field-value">
                                    {coinsurer.address ?? '—'}
                                </div>
                            </div>
                            <div className="cs-field">
                                <div className="cs-field-label">
                                    {t('show.fields.tenant')}
                                </div>
                                <div className="cs-field-value">
                                    {coinsurer.tenant?.name ?? '—'}
                                </div>
                            </div>
                            <div className="cs-field">
                                <div className="cs-field-label">
                                    {t('show.fields.status')}
                                </div>
                                <div className="cs-field-value">
                                    {coinsurer.is_active ? (
                                        <span className="s-active">
                                            <span
                                                className="s-dot"
                                                style={{
                                                    background: '#22c55e',
                                                }}
                                            />
                                            {tc('states.active')}
                                        </span>
                                    ) : (
                                        <span className="s-inactive">
                                            <span
                                                className="s-dot"
                                                style={{
                                                    background: '#94a3b8',
                                                }}
                                            />
                                            {tc('states.inactive')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="cs-field">
                                <div className="cs-field-label">
                                    {t('show.fields.createdAt')}
                                </div>
                                <div
                                    className="cs-field-value"
                                    style={{ fontSize: 12, color: '#64748b' }}
                                >
                                    {new Date(
                                        coinsurer.created_at,
                                    ).toLocaleDateString('fr-FR')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Link href={route('admin.coinsurers.index')}>
                            <Button variant="outline" size="sm" className="h-9">
                                <ArrowLeft size={13} /> {t('show.backToList')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
