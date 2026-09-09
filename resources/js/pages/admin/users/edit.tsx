import { Head, useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    roles: { name: string }[];
    tenant: { id: string; name: string } | null;
    broker: { id: string; name: string; code: string } | null;
}
interface Props {
    user: User;
    roles: string[];
    tenants: { id: string; name: string; code: string }[];
    brokers: { id: string; name: string; code: string; type: string }[];
}

const PARTNER_ROLES = ['courtier_local', 'partenaire_etranger'];

export default function UserEdit({ user, roles, tenants, brokers }: Props) {
    const { t } = useTranslation('users');
    const { t: tc } = useTranslation('common');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('edit.breadcrumb'), href: '/admin/users' },
        { title: t('edit.breadcrumbEdit') },
    ];

    const { data, setData, put, processing, errors, recentlySuccessful } =
        useForm({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone ?? '',
            role: user.roles?.[0]?.name ?? '',
            tenant_id: user.tenant?.id ?? '',
            broker_id: user.broker?.id ?? '',
        });

    const isPartnerRole = PARTNER_ROLES.includes(data.role);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.users.update', { user: user.id }));
    };

    const {
        data: pwdData,
        setData: setPwdData,
        patch: patchPwd,
        processing: pwdProcessing,
        errors: pwdErrors,
        recentlySuccessful: pwdRecentlySuccessful,
        reset: resetPwd,
    } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        patchPwd(route('admin.users.reset-password', { user: user.id }), {
            preserveScroll: true,
            onSuccess: () => resetPwd(),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`${t('edit.title', { name: `${user.first_name} ${user.last_name}` })} — NSIA Transport`}
            />
            <style>{`
                .ue-wrap{width:100%;max-width:760px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .ue-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .ue-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .ue-avatar{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;position:relative;z-index:1;}
                .ue-hero-info{position:relative;z-index:1;}
                .ue-hero-name{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .ue-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .ue-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .ue-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .ue-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .ue-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .ue-card-body{padding:22px;display:flex;flex-direction:column;gap:16px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
                .ue-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .ue-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .ue-select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.08);}
                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px 13px;font-size:12px;color:#15803d;display:flex;align-items:center;gap:6px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ue-wrap">
                    {/* Hero */}
                    <div className="ue-hero">
                        <div className="ue-avatar">
                            {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()}
                        </div>
                        <div className="ue-hero-info">
                            <div className="ue-hero-name">
                                {t('edit.hero.name', {
                                    name: `${user.first_name} ${user.last_name}`,
                                })}
                            </div>
                            <div className="ue-hero-sub">
                                {user.email} ·{' '}
                                {user.tenant?.name ?? t('edit.hero.noTenant')}
                            </div>
                        </div>
                    </div>

                    {/* Formulaire */}
                    <div className="ue-card">
                        <div className="ue-card-hdr">
                            <div className="ue-card-ttl">
                                {t('edit.form.title')}
                            </div>
                            <div className="ue-card-sub">
                                {t('edit.form.subtitle')}
                            </div>
                        </div>
                        <div className="ue-card-body">
                            <form
                                onSubmit={submit}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16,
                                }}
                            >
                                {recentlySuccessful && (
                                    <div className="status-ok">
                                        <Check size={13} />
                                        {t('edit.form.saved')}
                                    </div>
                                )}

                                {/* Prénom + Nom */}
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="ue-label">
                                            {t('edit.fields.firstName')}
                                        </Label>
                                        <Input
                                            className="h-11"
                                            value={data.first_name}
                                            onChange={(e) =>
                                                setData(
                                                    'first_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'edit.fields.firstNamePlaceholder',
                                            )}
                                        />
                                        <InputError
                                            message={errors.first_name}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="ue-label">
                                            {t('edit.fields.lastName')}
                                        </Label>
                                        <Input
                                            className="h-11"
                                            value={data.last_name}
                                            onChange={(e) =>
                                                setData(
                                                    'last_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'edit.fields.lastNamePlaceholder',
                                            )}
                                        />
                                        <InputError
                                            message={errors.last_name}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="grid gap-2">
                                    <Label className="ue-label">
                                        {t('edit.fields.email')}
                                    </Label>
                                    <Input
                                        className="h-11"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        placeholder="prenom.nom@nsia.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* Téléphone */}
                                <div className="grid gap-2">
                                    <Label className="ue-label">
                                        {t('edit.fields.phone')}
                                    </Label>
                                    <Input
                                        className="h-11"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                        placeholder="+225 07 00 00 00 00"
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                {/* Rôle */}
                                <div className="grid gap-2">
                                    <Label className="ue-label">
                                        {t('edit.fields.role')}
                                    </Label>
                                    <select
                                        className="ue-select"
                                        value={data.role}
                                        onChange={(e) =>
                                            setData('role', e.target.value)
                                        }
                                    >
                                        <option value="">
                                            {t('edit.fields.roleNone')}
                                        </option>
                                        {roles.map((r) => (
                                            <option key={r} value={r}>
                                                {r.replace(/_/g, ' ')}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.role} />
                                </div>

                                {/* Courtier à rattacher (rôles partenaires) */}
                                {isPartnerRole && (
                                    <div className="grid gap-2">
                                        <Label className="ue-label">
                                            {t('edit.fields.broker')}
                                        </Label>
                                        <select
                                            className="ue-select"
                                            value={data.broker_id}
                                            onChange={(e) =>
                                                setData(
                                                    'broker_id',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                {t('edit.fields.brokerNone')}
                                            </option>
                                            {brokers.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name} ({b.code})
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.broker_id} />
                                    </div>
                                )}

                                {/* Filiale — réservé au super_admin */}
                                {tenants.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label className="ue-label">
                                            {t('edit.fields.tenant')}
                                        </Label>
                                        <select
                                            className="ue-select"
                                            value={data.tenant_id}
                                            onChange={(e) =>
                                                setData(
                                                    'tenant_id',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                {t('edit.fields.tenantNone')}
                                            </option>
                                            {tenants.map((tn) => (
                                                <option
                                                    key={tn.id}
                                                    value={tn.id}
                                                >
                                                    {tn.name} ({tn.code})
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.tenant_id}
                                        />
                                    </div>
                                )}

                                {/* Actions */}
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
                                            t('edit.actions.saving')
                                        ) : (
                                            <>
                                                <Check size={14} />{' '}
                                                {t('edit.actions.save')}
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
                            </form>
                        </div>
                    </div>

                    {/* Réinitialisation du mot de passe */}
                    <div className="ue-card">
                        <div className="ue-card-hdr">
                            <div className="ue-card-ttl">
                                {t('edit.resetPassword.title')}
                            </div>
                            <div className="ue-card-sub">
                                {t('edit.resetPassword.subtitle')}
                            </div>
                        </div>
                        <div className="ue-card-body">
                            <form
                                onSubmit={submitPassword}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16,
                                }}
                            >
                                {pwdRecentlySuccessful && (
                                    <div className="status-ok">
                                        <Check size={13} />
                                        {t('edit.resetPassword.saved')}
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="ue-label">
                                            {t(
                                                'edit.resetPassword.newPassword',
                                            )}
                                        </Label>
                                        <Input
                                            className="h-11"
                                            type="password"
                                            autoComplete="new-password"
                                            value={pwdData.password}
                                            onChange={(e) =>
                                                setPwdData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'edit.resetPassword.newPasswordPlaceholder',
                                            )}
                                        />
                                        <InputError
                                            message={pwdErrors.password}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="ue-label">
                                            {t(
                                                'edit.resetPassword.confirmPassword',
                                            )}
                                        </Label>
                                        <Input
                                            className="h-11"
                                            type="password"
                                            autoComplete="new-password"
                                            value={
                                                pwdData.password_confirmation
                                            }
                                            onChange={(e) =>
                                                setPwdData(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'edit.resetPassword.confirmPasswordPlaceholder',
                                            )}
                                        />
                                        <InputError
                                            message={
                                                pwdErrors.password_confirmation
                                            }
                                        />
                                    </div>
                                </div>

                                <p
                                    style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        margin: 0,
                                    }}
                                >
                                    {t('edit.resetPassword.warning')}
                                </p>

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
                                        disabled={pwdProcessing}
                                        className="h-10 bg-[#1e3a8a] px-5 text-white hover:bg-[#1e40af]"
                                    >
                                        {pwdProcessing ? (
                                            t('edit.resetPassword.saving')
                                        ) : (
                                            <>
                                                <Check size={14} />{' '}
                                                {t('edit.resetPassword.save')}
                                            </>
                                        )}
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
