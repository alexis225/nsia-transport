import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Utilisateurs', href: '/admin/users' },
    { title: 'Nouvel utilisateur' },
];

interface Props {
    roles:   string[];
    tenants: { id: string; name: string; code: string }[];
}

export default function UserCreate({ roles, tenants }: Props) {
    const [showPw,      setShowPw]      = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        first_name:            '',
        last_name:             '',
        email:                 '',
        phone:                 '',
        role:                  '',
        tenant_id:             '',
        password:              '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvel utilisateur — NSIA Transport"/>
            <style>{`
                .uc-wrap{width:100%;max-width:760px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .uc-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .uc-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .uc-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;}
                .uc-hero-info{position:relative;z-index:1;}
                .uc-hero-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .uc-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);font-weight:300;}
                .uc-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .uc-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .uc-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .uc-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .uc-card-body{padding:22px;display:flex;flex-direction:column;gap:16px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
                .uc-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .uc-input{height:44px !important;}
                .pw-wrap{position:relative;}
                .pw-wrap input{padding-right:42px !important;}
                .pw-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94a3b8;padding:3px;display:flex;align-items:center;}
                .pw-eye:hover{color:#475569;}
                .uc-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .uc-select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.08);}
                @keyframes spin{to{transform:rotate(360deg);}}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="uc-wrap">

                    {/* Hero */}
                    <div className="uc-hero">
                        <div className="uc-hero-ico"><UserPlus size={22} color="rgba(255,255,255,0.8)"/></div>
                        <div className="uc-hero-info">
                            <div className="uc-hero-title">Créer un utilisateur</div>
                            <div className="uc-hero-sub">Un email de bienvenue sera envoyé automatiquement</div>
                        </div>
                    </div>

                    {/* Formulaire */}
                    <div className="uc-card">
                        <div className="uc-card-hdr">
                            <div className="uc-card-ttl">Informations personnelles</div>
                            <div className="uc-card-sub">Tous les champs marqués * sont obligatoires</div>
                        </div>
                        <div className="uc-card-body">
                            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                                {/* Prénom + Nom */}
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="uc-label">Prénom *</Label>
                                        <Input className="uc-input" value={data.first_name} onChange={e => setData('first_name', e.target.value)} placeholder="Prénom" autoComplete="given-name"/>
                                        <InputError message={errors.first_name}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="uc-label">Nom *</Label>
                                        <Input className="uc-input" value={data.last_name} onChange={e => setData('last_name', e.target.value)} placeholder="Nom de famille" autoComplete="family-name"/>
                                        <InputError message={errors.last_name}/>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="grid gap-2">
                                    <Label className="uc-label">Adresse email *</Label>
                                    <Input className="uc-input" type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="prenom.nom@nsia.com" autoComplete="email"/>
                                    <InputError message={errors.email}/>
                                </div>

                                {/* Téléphone */}
                                <div className="grid gap-2">
                                    <Label className="uc-label">Téléphone</Label>
                                    <Input className="uc-input" type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+225 07 00 00 00 00"/>
                                    <InputError message={errors.phone}/>
                                </div>

                                {/* Rôle */}
                                <div className="grid gap-2">
                                    <Label className="uc-label">Rôle *</Label>
                                    <select className="uc-select" value={data.role} onChange={e => setData('role', e.target.value)}>
                                        <option value="">Sélectionnez un rôle</option>
                                        {roles.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                                    </select>
                                    <InputError message={errors.role}/>
                                </div>

                                {/* Filiale (super admin seulement) */}
                                {tenants.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label className="uc-label">Filiale</Label>
                                        <select className="uc-select" value={data.tenant_id} onChange={e => setData('tenant_id', e.target.value)}>
                                            <option value="">Filiale de l'admin connecté</option>
                                            {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                                        </select>
                                        <InputError message={errors.tenant_id}/>
                                    </div>
                                )}

                                {/* Mot de passe */}
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="uc-label">Mot de passe *</Label>
                                        <div className="pw-wrap">
                                            <Input className="uc-input" type={showPw ? 'text' : 'password'} value={data.password} onChange={e => setData('password', e.target.value)} placeholder="••••••••" autoComplete="new-password"/>
                                            <button type="button" className="pw-eye" onClick={() => setShowPw(s => !s)}>
                                                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                                            </button>
                                        </div>
                                        <InputError message={errors.password}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="uc-label">Confirmer *</Label>
                                        <div className="pw-wrap">
                                            <Input className="uc-input" type={showConfirm ? 'text' : 'password'} value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} placeholder="••••••••" autoComplete="new-password"/>
                                            <button type="button" className="pw-eye" onClick={() => setShowConfirm(s => !s)}>
                                                {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                                            </button>
                                        </div>
                                        <InputError message={errors.password_confirmation}/>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display:'flex', gap:8, paddingTop:4, borderTop:'1px solid #f8fafc', marginTop:4 }}>
                                    <Button type="submit" disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                        {processing ? 'Création…' : <><UserPlus size={14}/> Créer l'utilisateur</>}
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