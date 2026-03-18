import { Transition } from '@headlessui/react';
import { Head, usePage } from '@inertiajs/react';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Form } from '@inertiajs/react';
import { edit } from '@/routes/profile';
import type { BreadcrumbItem } from '@/types';
import { Lock, Check, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres du profil', href: edit() },
    { title: 'Mot de passe' },
];

export default function Password() {
    const { auth } = usePage().props as any;
    const user     = auth?.user;

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew,     setShowNew]     = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [newPw,       setNewPw]       = useState('');

    const initials = `${user?.first_name?.[0] ?? user?.name?.[0] ?? 'U'}${user?.last_name?.[0] ?? ''}`.toUpperCase();
    const fullName  = user?.first_name ? `${user.first_name} ${user.last_name}` : (user?.name ?? '');

    // Indicateur force
    const strength = (() => {
        if (!newPw) return 0;
        let s = 0;
        if (newPw.length >= 8)           s++;
        if (newPw.length >= 12)          s++;
        if (/[A-Z]/.test(newPw))         s++;
        if (/[0-9]/.test(newPw))         s++;
        if (/[^A-Za-z0-9]/.test(newPw)) s++;
        return s;
    })();

    const strengthLabel = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength];
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'][strength];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mot de passe — NSIA Transport"/>

            <style>{`
                .pw-wrap {
                    width: 100%;
                    max-width: 860px;
                    margin: 0 auto;
                    padding: 4px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                /* ── Hero (identique profil) ── */
                .pw-hero {
                    background: linear-gradient(135deg, #1e2fa0 0%, #1a1f7a 55%, #14176a 100%);
                    border-radius: 16px;
                    padding: 26px 24px;
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    position: relative;
                    overflow: hidden;
                }
                .pw-hero::before {
                    content:'';
                    position:absolute; top:-50px; right:-50px;
                    width:180px; height:180px;
                    border-radius:50%;
                    background:rgba(255,255,255,0.05);
                    pointer-events:none;
                }
                .pw-avatar {
                    width:68px; height:68px; border-radius:50%;
                    background:rgba(255,255,255,0.15);
                    border:3px solid rgba(255,255,255,0.2);
                    display:flex; align-items:center; justify-content:center;
                    font-size:22px; font-weight:700; color:#fff;
                    flex-shrink:0; position:relative; z-index:1;
                }
                .pw-hero-info { flex:1; position:relative; z-index:1; }
                .pw-hero-name { font-size:17px; font-weight:600; color:#fff; margin-bottom:2px; }
                .pw-hero-sub  { font-size:12px; color:rgba(255,255,255,0.5); font-weight:300; }
                .pw-hero-ico  {
                    position:relative; z-index:1;
                    width:52px; height:52px;
                    background:rgba(255,255,255,0.1);
                    border:1px solid rgba(255,255,255,0.18);
                    border-radius:14px;
                    display:flex; align-items:center; justify-content:center;
                    flex-shrink:0;
                }

                /* ── Card ── */
                .pw-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; overflow:hidden; }
                .pw-card-hdr {
                    padding:15px 22px; border-bottom:1px solid #f1f5f9;
                    display:flex; align-items:center; gap:10px;
                }
                .pw-card-ico {
                    width:36px; height:36px; border-radius:9px;
                    display:flex; align-items:center; justify-content:center; flex-shrink:0;
                }
                .pw-card-ttl { font-size:14px; font-weight:600; color:#1e293b; }
                .pw-card-sub { font-size:12px; color:#94a3b8; margin-top:1px; }
                .pw-card-body { padding:22px; display:flex; flex-direction:column; gap:16px; }

                /* Labels */
                .pw-label {
                    font-size:10.5px !important;
                    font-weight:600 !important;
                    text-transform:uppercase !important;
                    letter-spacing:.08em !important;
                    color:#64748b !important;
                }

                /* Input wrapper */
                .pw-field { display:flex; flex-direction:column; gap:6px; }
                .pw-input-wrap { position:relative; }
                .pw-input-wrap input { padding-right:42px !important; }
                .pw-eye {
                    position:absolute; right:12px; top:50%; transform:translateY(-50%);
                    background:none; border:none; cursor:pointer;
                    color:#94a3b8; padding:3px; transition:color .15s;
                    display:flex; align-items:center;
                }
                .pw-eye:hover { color:#475569; }

                /* Strength */
                .strength-bars { display:flex; gap:4px; margin-top:6px; }
                .strength-bar  { flex:1; height:3px; border-radius:2px; background:#f1f5f9; transition:background .25s; }
                .strength-txt  { font-size:11px; font-weight:500; margin-top:3px; }

                /* Rules */
                .pw-rules { background:#f8fafc; border:1px solid #e2e8f0; border-radius:9px; padding:12px 14px; display:flex; flex-direction:column; gap:6px; }
                .pw-rule  { display:flex; align-items:center; gap:7px; font-size:12px; color:#94a3b8; transition:color .2s; }
                .pw-rule.ok { color:#16a34a; }
                .rule-dot { width:5px; height:5px; border-radius:50%; background:#d1d5db; flex-shrink:0; transition:background .2s; }
                .pw-rule.ok .rule-dot { background:#16a34a; }

                /* Status */
                .status-ok { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:9px 13px; font-size:12px; color:#15803d; display:flex; align-items:center; gap:6px; }

                /* Tips */
                .tips-card { background:#eff6ff; border:1.5px solid #bfdbfe; border-radius:14px; padding:18px 20px; }
                .tips-ttl  { font-size:13px; font-weight:600; color:#1d4ed8; margin-bottom:10px; display:flex; align-items:center; gap:7px; }
                .tips-list { display:flex; flex-direction:column; gap:6px; }
                .tip       { font-size:12px; color:#1e40af; display:flex; align-items:flex-start; gap:7px; line-height:1.5; }
                .tip-dot   { width:4px; height:4px; border-radius:50%; background:#3b82f6; flex-shrink:0; margin-top:5px; }

                @keyframes spin { to { transform:rotate(360deg); } }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="pw-wrap">

                    {/* ── Hero ── */}
                    <div className="pw-hero">
                        <div className="pw-avatar">{initials}</div>
                        <div className="pw-hero-info">
                            <div className="pw-hero-name">{fullName || 'Utilisateur'}</div>
                            <div className="pw-hero-sub">Sécurité du compte · Modification du mot de passe</div>
                        </div>
                        <div className="pw-hero-ico">
                            <Lock size={22} color="rgba(255,255,255,0.7)"/>
                        </div>
                    </div>

                    {/* ── Formulaire mot de passe ── */}
                    <div className="pw-card">
                        <div className="pw-card-hdr">
                            <div className="pw-card-ico" style={{ background:'#fff7ed' }}>
                                <Lock size={17} color="#f97316"/>
                            </div>
                            <div>
                                <div className="pw-card-ttl">Changer le mot de passe</div>
                                <div className="pw-card-sub">Utilisez un mot de passe fort et unique</div>
                            </div>
                        </div>

                        <div className="pw-card-body">
                            <Form
                                {...PasswordController.update.form()}
                                options={{ preserveScroll: true }}
                                className="space-y-0"
                            >
                                {({ processing, recentlySuccessful, errors }) => (
                                    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                                        {recentlySuccessful && (
                                            <div className="status-ok">
                                                <Check size={13}/> Mot de passe mis à jour avec succès.
                                            </div>
                                        )}

                                        {/* Mot de passe actuel */}
                                        <div className="pw-field">
                                            <Label className="pw-label">Mot de passe actuel</Label>
                                            <div className="pw-input-wrap">
                                                <Input
                                                    name="current_password"
                                                    type={showCurrent ? 'text' : 'password'}
                                                    className="h-11"
                                                    autoComplete="current-password"
                                                    placeholder="••••••••"
                                                />
                                                <button type="button" className="pw-eye" onClick={() => setShowCurrent(s => !s)}>
                                                    {showCurrent ? <EyeOff size={15}/> : <Eye size={15}/>}
                                                </button>
                                            </div>
                                            <InputError message={errors.current_password}/>
                                        </div>

                                        {/* Nouveau mot de passe */}
                                        <div className="pw-field">
                                            <Label className="pw-label">Nouveau mot de passe</Label>
                                            <div className="pw-input-wrap">
                                                <Input
                                                    name="password"
                                                    type={showNew ? 'text' : 'password'}
                                                    className="h-11"
                                                    autoComplete="new-password"
                                                    placeholder="••••••••"
                                                    onChange={e => setNewPw(e.target.value)}
                                                />
                                                <button type="button" className="pw-eye" onClick={() => setShowNew(s => !s)}>
                                                    {showNew ? <EyeOff size={15}/> : <Eye size={15}/>}
                                                </button>
                                            </div>
                                            <InputError message={errors.password}/>

                                            {/* Indicateur de force */}
                                            {newPw && (
                                                <>
                                                    <div className="strength-bars">
                                                        {[1,2,3,4,5].map(i => (
                                                            <div key={i} className="strength-bar"
                                                                 style={{ background: i <= strength ? strengthColor : '#f1f5f9' }}/>
                                                        ))}
                                                    </div>
                                                    <span className="strength-txt" style={{ color: strengthColor }}>
                                                        {strengthLabel}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Règles */}
                                        <div className="pw-rules">
                                            {[
                                                { ok: newPw.length >= 8,           label: 'Au moins 8 caractères' },
                                                { ok: /[A-Z]/.test(newPw),         label: 'Une lettre majuscule' },
                                                { ok: /[0-9]/.test(newPw),         label: 'Un chiffre' },
                                                { ok: /[^A-Za-z0-9]/.test(newPw), label: 'Un caractère spécial (!@#$...)' },
                                            ].map(({ ok, label }) => (
                                                <div key={label} className={`pw-rule ${ok ? 'ok' : ''}`}>
                                                    <span className="rule-dot"/>
                                                    {ok && <Check size={10}/>}
                                                    {label}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Confirmation */}
                                        <div className="pw-field">
                                            <Label className="pw-label">Confirmer le nouveau mot de passe</Label>
                                            <div className="pw-input-wrap">
                                                <Input
                                                    name="password_confirmation"
                                                    type={showConfirm ? 'text' : 'password'}
                                                    className="h-11"
                                                    autoComplete="new-password"
                                                    placeholder="••••••••"
                                                />
                                                <button type="button" className="pw-eye" onClick={() => setShowConfirm(s => !s)}>
                                                    {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                                                </button>
                                            </div>
                                            <InputError message={errors.password_confirmation}/>
                                        </div>

                                        {/* Submit */}
                                        <div className="flex items-center gap-3 pt-1">
                                            <Button
                                                disabled={processing}
                                                className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5"
                                            >
                                                {processing ? 'Mise à jour…' : 'Mettre à jour'}
                                            </Button>
                                            <Transition
                                                show={recentlySuccessful}
                                                enter="transition ease-in-out duration-200"
                                                enterFrom="opacity-0"
                                                leave="transition ease-in-out duration-200"
                                                leaveTo="opacity-0"
                                            >
                                                <p className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                                                    <Check size={13}/> Enregistré
                                                </p>
                                            </Transition>
                                        </div>
                                    </div>
                                )}
                            </Form>
                        </div>
                    </div>

                    {/* ── Conseils sécurité ── */}
                    <div className="tips-card">
                        <div className="tips-ttl">
                            <ShieldCheck size={15}/> Conseils de sécurité
                        </div>
                        <div className="tips-list">
                            {[
                                'Utilisez un mot de passe différent pour chaque service.',
                                'Activez la double authentification (MFA) pour plus de sécurité.',
                                'Ne partagez jamais votre mot de passe avec quelqu\'un.',
                                'Changez votre mot de passe régulièrement, au moins tous les 6 mois.',
                            ].map((tip, i) => (
                                <div key={i} className="tip">
                                    <span className="tip-dot"/>
                                    {tip}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}