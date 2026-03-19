import { Head, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: Props) {
    const [showPw,      setShowPw]      = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password:              '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.store'));
    };

    // Indicateur force
    const strength = (() => {
        const pw = data.password;
        if (!pw) return 0;
        let s = 0;
        if (pw.length >= 8)           s++;
        if (pw.length >= 12)          s++;
        if (/[A-Z]/.test(pw))         s++;
        if (/[0-9]/.test(pw))         s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        return s;
    })();
    const strengthColor = ['','#ef4444','#f97316','#eab308','#22c55e','#16a34a'][strength];
    const strengthLabel = ['','Très faible','Faible','Moyen','Fort','Très fort'][strength];

    return (
        <>
            <Head title="Réinitialiser le mot de passe — NSIA Transport"/>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
                *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
                body{font-family:'DM Sans',sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;}

                .rp-root{width:100%;max-width:440px;margin:0 auto;padding:16px;}

                .rp-logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:28px;}
                .rp-logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#1e2fa0,#14176a);border-radius:12px;display:flex;align-items:center;justify-content:center;}
                .rp-logo-name{font-size:18px;font-weight:700;color:#1e293b;}
                .rp-logo-sub{font-size:11px;color:#94a3b8;font-weight:300;}

                .rp-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);}
                .rp-card-hdr{padding:24px 28px 20px;border-bottom:1px solid #f1f5f9;}
                .rp-ico{width:48px;height:48px;background:#f0fdf4;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
                .rp-title{font-size:18px;font-weight:600;color:#1e293b;margin-bottom:6px;}
                .rp-desc{font-size:13px;color:#64748b;line-height:1.6;font-weight:300;}
                .rp-email{font-weight:500;color:#1e293b;}
                .rp-card-body{padding:24px 28px;}

                .rp-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}

                .pw-wrap{position:relative;}
                .pw-wrap input{padding-right:42px !important;}
                .pw-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94a3b8;padding:3px;display:flex;align-items:center;transition:color .15s;}
                .pw-eye:hover{color:#475569;}

                .strength-bars{display:flex;gap:4px;margin-top:6px;}
                .strength-bar{flex:1;height:3px;border-radius:2px;transition:background .25s;}
                .strength-txt{font-size:11px;font-weight:500;margin-top:3px;}

                .pw-rules{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px 13px;display:flex;flex-direction:column;gap:5px;}
                .pw-rule{display:flex;align-items:center;gap:7px;font-size:12px;color:#94a3b8;transition:color .2s;}
                .pw-rule.ok{color:#16a34a;}
                .rule-dot{width:5px;height:5px;border-radius:50%;background:#d1d5db;flex-shrink:0;transition:background .2s;}
                .pw-rule.ok .rule-dot{background:#16a34a;}
            `}</style>

            <div className="rp-root">
                {/* Logo */}
                <div className="rp-logo">
                    <div className="rp-logo-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z"
                                  stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                            <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="1.5"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div>
                        <div className="rp-logo-name">NSIA Transport</div>
                        <div className="rp-logo-sub">Certificats d'assurance</div>
                    </div>
                </div>

                {/* Card */}
                <div className="rp-card">
                    <div className="rp-card-hdr">
                        <div className="rp-ico">
                            <Lock size={22} color="#16a34a"/>
                        </div>
                        <h1 className="rp-title">Nouveau mot de passe</h1>
                        <p className="rp-desc">
                            Créez un nouveau mot de passe pour{' '}
                            <span className="rp-email">{email}</span>
                        </p>
                    </div>

                    <div className="rp-card-body">
                        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                            {/* Email caché */}
                            <input type="hidden" value={data.email}/>
                            <input type="hidden" value={data.token}/>

                            {/* Nouveau mot de passe */}
                            <div className="grid gap-2">
                                <Label className="rp-label">Nouveau mot de passe</Label>
                                <div className="pw-wrap">
                                    <Input
                                        type={showPw ? 'text' : 'password'}
                                        className="h-11"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        autoFocus
                                    />
                                    <button type="button" className="pw-eye" onClick={() => setShowPw(s => !s)}>
                                        {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                                    </button>
                                </div>
                                <InputError message={errors.password}/>

                                {data.password && (
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
                                    { ok: data.password.length >= 8,           label: 'Au moins 8 caractères' },
                                    { ok: /[A-Z]/.test(data.password),         label: 'Une lettre majuscule' },
                                    { ok: /[0-9]/.test(data.password),         label: 'Un chiffre' },
                                    { ok: /[^A-Za-z0-9]/.test(data.password), label: 'Un caractère spécial' },
                                ].map(({ ok, label }) => (
                                    <div key={label} className={`pw-rule ${ok ? 'ok' : ''}`}>
                                        <span className="rule-dot"/>
                                        {ok && <Check size={10}/>}
                                        {label}
                                    </div>
                                ))}
                            </div>

                            {/* Confirmation */}
                            <div className="grid gap-2">
                                <Label className="rp-label">Confirmer le mot de passe</Label>
                                <div className="pw-wrap">
                                    <Input
                                        type={showConfirm ? 'text' : 'password'}
                                        className="h-11"
                                        value={data.password_confirmation}
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                    />
                                    <button type="button" className="pw-eye" onClick={() => setShowConfirm(s => !s)}>
                                        {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                                    </button>
                                </div>
                                {data.password_confirmation && data.password !== data.password_confirmation && (
                                    <p style={{ fontSize:11, color:'#ef4444', display:'flex', alignItems:'center', gap:4 }}>
                                        Les mots de passe ne correspondent pas
                                    </p>
                                )}
                                {data.password_confirmation && data.password === data.password_confirmation && data.password && (
                                    <p style={{ fontSize:11, color:'#16a34a', display:'flex', alignItems:'center', gap:4 }}>
                                        <Check size={11}/> Les mots de passe correspondent
                                    </p>
                                )}
                                <InputError message={errors.password_confirmation}/>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-11 w-full"
                            >
                                {processing
                                    ? <><Loader2 size={15} className="animate-spin"/> Réinitialisation…</>
                                    : <><Lock size={15}/> Réinitialiser le mot de passe</>
                                }
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}