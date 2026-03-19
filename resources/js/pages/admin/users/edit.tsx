import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { Edit2, Check } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Utilisateurs', href: '/admin/users' },
    { title: 'Modifier' },
];

interface User {
    id: string; first_name: string; last_name: string;
    email: string; phone: string | null;
    roles: { name: string }[];
    tenant: { id: string; name: string } | null;
}
interface Props {
    user:    User;
    roles:   string[];
    tenants: { id: string; name: string; code: string }[];
}

export default function UserEdit({ user, roles, tenants }: Props) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        first_name: user.first_name,
        last_name:  user.last_name,
        email:      user.email,
        phone:      user.phone ?? '',
        role:       user.roles?.[0]?.name ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.users.update', { user: user.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${user.first_name} ${user.last_name} — NSIA Transport`}/>
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
                            <div className="ue-hero-name">Modifier {user.first_name} {user.last_name}</div>
                            <div className="ue-hero-sub">{user.email} · {user.tenant?.name ?? 'Sans filiale'}</div>
                        </div>
                    </div>

                    {/* Formulaire */}
                    <div className="ue-card">
                        <div className="ue-card-hdr">
                            <div className="ue-card-ttl">Informations personnelles</div>
                            <div className="ue-card-sub">Modifiez les informations de l'utilisateur</div>
                        </div>
                        <div className="ue-card-body">
                            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                                {recentlySuccessful && (
                                    <div className="status-ok"><Check size={13}/>Modifications enregistrées.</div>
                                )}

                                {/* Prénom + Nom */}
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="ue-label">Prénom *</Label>
                                        <Input className="h-11" value={data.first_name} onChange={e => setData('first_name', e.target.value)} placeholder="Prénom"/>
                                        <InputError message={errors.first_name}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="ue-label">Nom *</Label>
                                        <Input className="h-11" value={data.last_name} onChange={e => setData('last_name', e.target.value)} placeholder="Nom de famille"/>
                                        <InputError message={errors.last_name}/>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="grid gap-2">
                                    <Label className="ue-label">Adresse email *</Label>
                                    <Input className="h-11" type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="prenom.nom@nsia.com"/>
                                    <InputError message={errors.email}/>
                                </div>

                                {/* Téléphone */}
                                <div className="grid gap-2">
                                    <Label className="ue-label">Téléphone</Label>
                                    <Input className="h-11" type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+225 07 00 00 00 00"/>
                                    <InputError message={errors.phone}/>
                                </div>

                                {/* Rôle */}
                                <div className="grid gap-2">
                                    <Label className="ue-label">Rôle</Label>
                                    <select className="ue-select" value={data.role} onChange={e => setData('role', e.target.value)}>
                                        <option value="">Sans rôle</option>
                                        {roles.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                                    </select>
                                    <InputError message={errors.role}/>
                                </div>

                                {/* Actions */}
                                <div style={{ display:'flex', gap:8, paddingTop:4, borderTop:'1px solid #f8fafc', marginTop:4 }}>
                                    <Button type="submit" disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
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