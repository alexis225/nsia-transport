import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { edit } from '@/routes/profile';
import type { BreadcrumbItem } from '@/types';
import {
    Shield, ShieldCheck, ShieldOff, KeyRound,
    Copy, Check, Eye, EyeOff, RefreshCw, AlertCircle, Loader2
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres du profil', href: edit() },
    { title: 'Double authentification' },
];

interface Props {
    mfaEnabled:    boolean;
    mfaPending:    boolean;
    qrCodeSvg:     string | null;
    secretKey:     string | null;
    recoveryCodes: string[];
    status?:       string;
}

export default function MfaSetup({ mfaEnabled, mfaPending, qrCodeSvg, secretKey, recoveryCodes, status }: Props) {
    const { auth }  = usePage().props as any;
    const user      = auth?.user;
    const initials  = `${user?.first_name?.[0] ?? user?.name?.[0] ?? 'U'}${user?.last_name?.[0] ?? ''}`.toUpperCase();
    const fullName  = user?.first_name ? `${user.first_name} ${user.last_name}` : (user?.name ?? '');

    const [copied,    setCopied]    = useState(false);
    const [showCodes, setShowCodes] = useState(false);
    const [code,      setCode]      = useState('');
    const [submitting, setSubmitting] = useState(false);

    const copySecret = () => {
        if (secretKey) { navigator.clipboard.writeText(secretKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    };

    const handleEnable    = () => router.post(route('mfa.enable'));
    const handleDisable   = () => { if (confirm('Désactiver le MFA ?')) router.delete(route('mfa.disable')); };
    const handleRegenerate= () => { if (confirm('Regénérer les codes ? Les anciens seront invalidés.')) router.post(route('mfa.recovery-codes.regenerate')); };

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(route('two-factor.confirm'), { code }, {
            onFinish: () => { setSubmitting(false); setCode(''); },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Double authentification — NSIA Transport"/>
            <style>{`
                .mfa-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .mfa-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:26px 24px;display:flex;align-items:center;gap:18px;position:relative;overflow:hidden;}
                .mfa-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05);pointer-events:none;}
                .mfa-avatar{width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.15);border:3px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;position:relative;z-index:1;}
                .mfa-hero-info{flex:1;position:relative;z-index:1;}
                .mfa-hero-name{font-size:17px;font-weight:600;color:#fff;margin-bottom:2px;}
                .mfa-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);font-weight:300;}
                .mfa-hero-ico{position:relative;z-index:1;width:52px;height:52px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

                .mfa-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .mfa-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;}
                .mfa-card-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .mfa-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .mfa-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .mfa-card-body{padding:22px;display:flex;flex-direction:column;gap:16px;}

                .mfa-status-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;}
                .mfa-status-left{display:flex;align-items:center;gap:10px;}
                .mfa-status-label{font-size:13px;font-weight:500;}
                .mfa-status-desc{font-size:11px;color:#94a3b8;}
                .pill-active{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#dcfce7;color:#15803d;}
                .pill-inactive{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#f1f5f9;color:#64748b;}

                .steps{display:flex;flex-direction:column;gap:8px;}
                .step{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#475569;line-height:1.5;}
                .step-num{width:22px;height:22px;border-radius:50%;background:#1e3a8a;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}

                .qr-zone{display:flex;flex-direction:column;align-items:center;gap:14px;padding:8px 0;}
                .qr-box{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;}
                .secret-row{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;width:100%;}
                .secret-key{flex:1;font-family:monospace;font-size:13px;color:#1e3a8a;letter-spacing:.1em;word-break:break-all;}
                .copy-btn{background:none;border:none;cursor:pointer;color:#3b82f6;padding:2px;flex-shrink:0;transition:color .2s;}
                .copy-btn:hover{color:#1e3a8a;}

                .confirm-row{display:flex;gap:8px;margin-top:4px;}
                .confirm-input{flex:1;padding:11px;font-size:22px;font-weight:600;font-family:inherit;letter-spacing:.25em;text-align:center;color:#1e3a8a;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;transition:border-color .2s;}
                .confirm-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.08);}

                .codes-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
                .code-item{font-family:monospace;font-size:13px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 14px;color:#1e3a8a;letter-spacing:.08em;text-align:center;}

                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px 13px;font-size:12px;color:#15803d;display:flex;align-items:center;gap:6px;}
                @keyframes spin{to{transform:rotate(360deg);}}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="mfa-wrap">

                    {/* Hero */}
                    <div className="mfa-hero">
                        <div className="mfa-avatar">{initials}</div>
                        <div className="mfa-hero-info">
                            <div className="mfa-hero-name">{fullName || 'Utilisateur'}</div>
                            <div className="mfa-hero-sub">Sécurité · Double authentification (TOTP)</div>
                        </div>
                        <div className="mfa-hero-ico">
                            <Shield size={22} color="rgba(255,255,255,0.7)"/>
                        </div>
                    </div>

                    {status && <div className="status-ok"><ShieldCheck size={14}/>{status}</div>}

                    {/* Statut MFA */}
                    <div className="mfa-card">
                        <div className="mfa-card-hdr">
                            <div className="mfa-card-ico" style={{background: mfaEnabled ? '#f0fdf4' : '#eff6ff'}}>
                                {mfaEnabled ? <ShieldCheck size={17} color="#16a34a"/> : <Shield size={17} color="#3b82f6"/>}
                            </div>
                            <div>
                                <div className="mfa-card-ttl">Authentification à deux facteurs</div>
                                <div className="mfa-card-sub">Protégez votre compte avec Google Authenticator</div>
                            </div>
                        </div>
                        <div className="mfa-card-body">

                            {/* Statut */}
                            <div className="mfa-status-row">
                                <div className="mfa-status-left">
                                    {mfaEnabled
                                        ? <><ShieldCheck size={20} color="#16a34a"/><div><div className="mfa-status-label" style={{color:'#15803d'}}>Activé</div><div className="mfa-status-desc">Votre compte est protégé</div></div></>
                                        : <><ShieldOff size={20} color="#94a3b8"/><div><div className="mfa-status-label" style={{color:'#64748b'}}>Désactivé</div><div className="mfa-status-desc">Activez pour sécuriser votre connexion</div></div></>
                                    }
                                </div>
                                <span className={mfaEnabled ? 'pill-active' : 'pill-inactive'}>
                                    {mfaEnabled ? '✓ Actif' : 'Inactif'}
                                </span>
                            </div>

                            {/* Idle → activer */}
                            {!mfaEnabled && !mfaPending && (
                                <Button onClick={handleEnable} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                    <Shield size={14}/> Activer le MFA
                                </Button>
                            )}

                            {/* Pending → QR + confirmation */}
                            {mfaPending && qrCodeSvg && (
                                <>
                                    <div className="steps">
                                        {['Installez Google Authenticator sur votre téléphone.','Scannez le QR code ou entrez la clé manuellement.','Entrez le code à 6 chiffres pour confirmer.'].map((s,i) => (
                                            <div key={i} className="step"><div className="step-num">{i+1}</div>{s}</div>
                                        ))}
                                    </div>
                                    <div className="qr-zone">
                                        <div className="qr-box" dangerouslySetInnerHTML={{__html: qrCodeSvg}}/>
                                        {secretKey && (
                                            <div className="secret-row">
                                                <span className="secret-key">{secretKey}</span>
                                                <button className="copy-btn" onClick={copySecret}>
                                                    {copied ? <Check size={15} color="#16a34a"/> : <Copy size={15}/>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <form onSubmit={handleConfirm}>
                                        <label style={{fontSize:'10.5px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'#64748b',display:'block',marginBottom:6}}>
                                            Code de confirmation
                                        </label>
                                        <div className="confirm-row">
                                            <input
                                                type="text" inputMode="numeric" maxLength={6}
                                                value={code} onChange={e => setCode(e.target.value.replace(/\D/g,''))}
                                                placeholder="000000" className="confirm-input"
                                            />
                                            <Button type="submit" disabled={submitting || code.length !== 6} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-auto px-5">
                                                {submitting ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> : <Check size={14}/>}
                                                Confirmer
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {/* Activé → désactiver */}
                            {mfaEnabled && (
                                <Button onClick={handleDisable} variant="destructive" className="h-10 px-5">
                                    <ShieldOff size={14}/> Désactiver le MFA
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Codes de récupération */}
                    {mfaEnabled && (
                        <div className="mfa-card">
                            <div className="mfa-card-hdr">
                                <div className="mfa-card-ico" style={{background:'#eff6ff'}}>
                                    <KeyRound size={17} color="#3b82f6"/>
                                </div>
                                <div>
                                    <div className="mfa-card-ttl">Codes de récupération</div>
                                    <div className="mfa-card-sub">8 codes à usage unique — conservez-les en lieu sûr</div>
                                </div>
                            </div>
                            <div className="mfa-card-body">
                                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                    <Button variant="outline" className="h-9 px-4 text-sm" onClick={() => setShowCodes(s => !s)}>
                                        {showCodes ? <EyeOff size={14}/> : <Eye size={14}/>}
                                        {showCodes ? 'Masquer' : 'Afficher les codes'}
                                    </Button>
                                    <Button variant="outline" className="h-9 px-4 text-sm" onClick={handleRegenerate}>
                                        <RefreshCw size={14}/> Regénérer
                                    </Button>
                                </div>
                                {showCodes && (
                                    <div className="codes-grid">
                                        {recoveryCodes.map((c, i) => <div key={i} className="code-item">{c}</div>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AppLayout>
    );
}