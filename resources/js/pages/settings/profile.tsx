import { Transition } from '@headlessui/react';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem } from '@/types';
import { User, Camera, Check, Shield, Phone, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres du profil', href: edit() },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props as any;
    const user     = auth?.user;

    const initials = `${user?.first_name?.[0] ?? user?.name?.[0] ?? 'U'}${user?.last_name?.[0] ?? ''}`.toUpperCase();
    const fullName  = user?.first_name ? `${user.first_name} ${user.last_name}` : (user?.name ?? '');

    const roleLabels: Record<string, string> = {
        super_admin: 'Super Administrateur', admin_filiale: 'Admin Filiale',
        souscripteur: 'Souscripteur', courtier_local: 'Courtier Local',
        partenaire_etranger: 'Partenaire Étranger', client: 'Client',
    };
    const userRole = user?.roles?.[0] ?? '';

    // ── Avatar upload ─────────────────────────────────────────
    const fileRef                     = useRef<HTMLInputElement>(null);
    const [preview, setPreview]       = useState<string | null>(user?.avatar_path ?? null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [uploading, setUploading]   = useState(false);
    const [uploadDone, setUploadDone] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setPreview(URL.createObjectURL(file));
        setUploadDone(false);
    };

    const handleAvatarUpload = () => {
        if (!avatarFile) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        router.post('/settings/avatar', formData, {
            forceFormData: true,
            onSuccess: () => { setUploading(false); setUploadDone(true); setAvatarFile(null); },
            onError:   () => { setUploading(false); },
        });
    };

    const handleAvatarRemove = () => {
        if (!confirm('Supprimer votre photo de profil ?')) return;
        router.delete('/settings/avatar', {
            onSuccess: () => { setPreview(null); setAvatarFile(null); },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paramètres du profil — NSIA Transport"/>
            <style>{`
                .pf-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}

                /* Hero */
                .pf-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:26px 24px;display:flex;align-items:center;gap:18px;position:relative;overflow:hidden;}
                .pf-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05);pointer-events:none;}
                .pf-avatar-wrap{position:relative;flex-shrink:0;z-index:1;}
                .pf-avatar{width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.15);border:3px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;overflow:hidden;cursor:pointer;transition:opacity .15s;}
                .pf-avatar:hover{opacity:.85;}
                .pf-avatar img{width:100%;height:100%;object-fit:cover;}
                .pf-avatar-overlay{position:absolute;bottom:0;right:0;width:24px;height:24px;background:#1e3a8a;border:2px solid rgba(255,255,255,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s;}
                .pf-avatar-overlay:hover{background:#1e40af;}
                .pf-hero-info{flex:1;position:relative;z-index:1;}
                .pf-hero-name{font-size:17px;font-weight:600;color:#fff;margin-bottom:2px;}
                .pf-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);font-weight:300;margin-bottom:8px;}
                .pf-role{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8);font-size:11px;font-weight:500;border:1px solid rgba(255,255,255,0.15);}

                /* Card */
                .pf-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .pf-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;}
                .pf-card-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .pf-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .pf-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .pf-card-body{padding:22px;display:flex;flex-direction:column;gap:16px;}

                /* Grid 2 colonnes */
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
                .form-grid-full{grid-column:1/-1;}

                /* Labels */
                .pf-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}

                /* Badges email */
                .pill-ok{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:10px;font-weight:500;border:1px solid #bbf7d0;margin-left:6px;vertical-align:middle;}
                .pill-warn{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:10px;background:#fefce8;color:#854d0e;font-size:10px;font-weight:500;border:1px solid #fde68a;margin-left:6px;vertical-align:middle;}

                /* Status */
                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px 13px;font-size:12px;color:#15803d;display:flex;align-items:center;gap:6px;}

                /* Avatar section */
                .avatar-section{display:flex;align-items:center;gap:16px;padding:4px 0;}
                .avatar-preview{width:72px;height:72px;border-radius:50%;border:2px solid #e2e8f0;overflow:hidden;background:linear-gradient(135deg,#1e3a8a,#3b82f6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;flex-shrink:0;}
                .avatar-preview img{width:100%;height:100%;object-fit:cover;}
                .avatar-actions{display:flex;flex-direction:column;gap:8px;flex:1;}
                .avatar-btn-row{display:flex;gap:8px;flex-wrap:wrap;}
                .avatar-upload-btn{padding:8px 14px;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:9px;font-size:12px;color:#475569;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:all .15s;}
                .avatar-upload-btn:hover{background:#f1f5f9;border-color:#94a3b8;color:#1e293b;}
                .avatar-hint{font-size:11px;color:#94a3b8;}

                /* Danger */
                .pf-card.danger .pf-card-hdr{background:#fff8f8;}

                @keyframes spin{to{transform:rotate(360deg);}}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="pf-wrap">

                    {/* ── Hero ── */}
                    <div className="pf-hero">
                        <div className="pf-avatar-wrap">
                            <div className="pf-avatar" onClick={() => fileRef.current?.click()}>
                                {preview
                                    ? <img src={preview} alt=""/>
                                    : initials
                                }
                            </div>
                            <div className="pf-avatar-overlay" onClick={() => fileRef.current?.click()} title="Changer la photo">
                                <Camera size={12} color="#fff"/>
                            </div>
                            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                                   style={{display:'none'}} onChange={handleFileChange}/>
                        </div>
                        <div className="pf-hero-info">
                            <div className="pf-hero-name">{fullName || 'Utilisateur'}</div>
                            <div className="pf-hero-sub">{user?.email}</div>
                            {userRole && (
                                <span className="pf-role">
                                    <Shield size={10}/>{roleLabels[userRole] ?? userRole}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── Photo de profil ── */}
                    <div className="pf-card">
                        <div className="pf-card-hdr">
                            <div className="pf-card-ico" style={{background:'#f0fdf4'}}>
                                <Camera size={17} color="#16a34a"/>
                            </div>
                            <div>
                                <div className="pf-card-ttl">Photo de profil</div>
                                <div className="pf-card-sub">JPG, PNG ou WebP · Max 2 Mo</div>
                            </div>
                        </div>
                        <div className="pf-card-body">
                            {uploadDone && (
                                <div className="status-ok"><Check size={13}/>Photo mise à jour.</div>
                            )}
                            <div className="avatar-section">
                                <div className="avatar-preview">
                                    {preview
                                        ? <img src={preview} alt=""/>
                                        : initials
                                    }
                                </div>
                                <div className="avatar-actions">
                                    <div className="avatar-btn-row">
                                        <button type="button" className="avatar-upload-btn" onClick={() => fileRef.current?.click()}>
                                            <Camera size={13}/> Choisir une photo
                                        </button>
                                        {(preview || user?.avatar_path) && (
                                            <button type="button" onClick={handleAvatarRemove}
                                                    style={{padding:'8px 12px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,fontSize:12,color:'#dc2626',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:5,fontFamily:'inherit'}}>
                                                <Trash2 size={12}/> Supprimer
                                            </button>
                                        )}
                                    </div>
                                    <span className="avatar-hint">Format JPG, PNG ou WebP · Taille max 2 Mo</span>
                                </div>
                                {avatarFile && (
                                    <Button onClick={handleAvatarUpload} disabled={uploading}
                                            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5 flex-shrink-0">
                                        {uploading ? 'Upload…' : <><Check size={14}/> Enregistrer</>}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Informations personnelles ── */}
                    <div className="pf-card">
                        <div className="pf-card-hdr">
                            <div className="pf-card-ico" style={{background:'#eff6ff'}}>
                                <User size={17} color="#3b82f6"/>
                            </div>
                            <div>
                                <div className="pf-card-ttl">Informations personnelles</div>
                                <div className="pf-card-sub">Prénom, nom, email et téléphone</div>
                            </div>
                        </div>
                        <div className="pf-card-body">
                            <Form {...ProfileController.update.form()} options={{preserveScroll:true}} className="space-y-0">
                                {({ processing, recentlySuccessful, errors }) => (
                                    <div style={{display:'flex',flexDirection:'column',gap:16}}>
                                        {recentlySuccessful && (
                                            <div className="status-ok"><Check size={13}/>Modifications enregistrées.</div>
                                        )}

                                        {/* Prénom + Nom */}
                                        <div className="form-grid">
                                            <div className="grid gap-2">
                                                <Label className="pf-label">Prénom</Label>
                                                <Input
                                                    id="first_name" name="first_name"
                                                    className="h-11"
                                                    defaultValue={user?.first_name ?? ''}
                                                    autoComplete="given-name"
                                                    placeholder="Prénom"
                                                />
                                                <InputError message={errors.first_name}/>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="pf-label">Nom</Label>
                                                <Input
                                                    id="last_name" name="last_name"
                                                    className="h-11"
                                                    defaultValue={user?.last_name ?? ''}
                                                    autoComplete="family-name"
                                                    placeholder="Nom de famille"
                                                />
                                                <InputError message={errors.last_name}/>
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="grid gap-2">
                                            <Label className="pf-label">
                                                Adresse email
                                                {user?.email_verified_at
                                                    ? <span className="pill-ok"><Check size={9}/>Vérifiée</span>
                                                    : <span className="pill-warn">Non vérifiée</span>
                                                }
                                            </Label>
                                            <Input
                                                id="email" name="email" type="email"
                                                className="h-11"
                                                defaultValue={user?.email}
                                                required autoComplete="username"
                                                placeholder="prenom.nom@nsia.com"
                                            />
                                            <InputError message={errors.email}/>
                                        </div>

                                        {/* Téléphone */}
                                        <div className="grid gap-2">
                                            <Label className="pf-label">
                                                <span style={{display:'flex',alignItems:'center',gap:5}}>
                                                    <Phone size={11}/> Téléphone
                                                </span>
                                            </Label>
                                            <Input
                                                id="phone" name="phone" type="tel"
                                                className="h-11"
                                                defaultValue={user?.phone ?? ''}
                                                autoComplete="tel"
                                                placeholder="+225 07 00 00 00 00"
                                            />
                                            <InputError message={errors.phone}/>
                                        </div>

                                        {/* Email non vérifié */}
                                        {mustVerifyEmail && user?.email_verified_at === null && (
                                            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                                                <p className="text-sm text-amber-800">
                                                    Votre adresse email n'est pas vérifiée.{' '}
                                                    <Link href={send()} as="button" className="font-medium underline text-amber-900 hover:text-amber-700 transition-colors">
                                                        Renvoyer l'email de vérification.
                                                    </Link>
                                                </p>
                                                {status === 'verification-link-sent' && (
                                                    <p className="mt-2 text-sm font-medium text-green-600 flex items-center gap-1">
                                                        <Check size={12}/>Lien envoyé.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Submit */}
                                        <div className="flex items-center gap-3 pt-1">
                                            <Button disabled={processing}
                                                    className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5"
                                                    data-test="update-profile-button">
                                                {processing ? 'Enregistrement…' : 'Enregistrer'}
                                            </Button>
                                            <Transition
                                                show={recentlySuccessful}
                                                enter="transition ease-in-out duration-200"
                                                enterFrom="opacity-0"
                                                leave="transition ease-in-out duration-200"
                                                leaveTo="opacity-0"
                                            >
                                                <p className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                                                    <Check size={13}/>Enregistré
                                                </p>
                                            </Transition>
                                        </div>
                                    </div>
                                )}
                            </Form>
                        </div>
                    </div>

                    {/* ── Zone danger ── */}
                    <div className="pf-card danger">
                        <div className="pf-card-hdr">
                            <div className="pf-card-ico" style={{background:'#fef2f2'}}>
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div>
                                <div className="pf-card-ttl" style={{color:'#dc2626'}}>Zone de danger</div>
                                <div className="pf-card-sub">Cette action est irréversible</div>
                            </div>
                        </div>
                        <div className="pf-card-body"><DeleteUser/></div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}