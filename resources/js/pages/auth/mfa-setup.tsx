import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Shield, ShieldCheck, ShieldOff, RefreshCw,
    Copy, Check, AlertCircle, Eye, EyeOff,
    KeyRound, Loader2, ChevronRight
} from 'lucide-react';

interface Props {
    mfaEnabled:    boolean;
    mfaPending:    boolean;
    qrCodeSvg:     string | null;
    secretKey:     string | null;
    recoveryCodes: string[];
    status?:       string;
}

export default function MfaSetup({ mfaEnabled, mfaPending, qrCodeSvg, secretKey, recoveryCodes, status }: Props) {
    const [copied, setCopied]       = useState(false);
    const [showCodes, setShowCodes] = useState(false);
    const [step, setStep]           = useState<'idle'|'pending'|'done'>(
        mfaEnabled ? 'done' : mfaPending ? 'pending' : 'idle'
    );

    const confirmForm = useForm({ code: '' });

    const copySecret = () => {
        if (secretKey) {
            navigator.clipboard.writeText(secretKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleEnable = () => router.post(route('mfa.enable'));
    const handleDisable = () => {
        if (confirm('Désactiver l\'authentification à deux facteurs ?')) router.delete(route('mfa.disable'));
    };
    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        confirmForm.post(route('two-factor.confirm'), { onSuccess: () => confirmForm.reset() });
    };
    const handleRegenerate = () => {
        if (confirm('Regénérer les codes ? Les anciens seront invalidés.')) router.post(route('mfa.recovery-codes.regenerate'));
    };

    return (
        <>
            <Head title="Configuration MFA — NSIA Transport" />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
                *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
                body{font-family:'DM Sans',sans-serif;background:#f1f5f9;min-height:100vh;}

                .page{max-width:680px;margin:0 auto;padding:40px 24px;}
                .page-header{margin-bottom:32px;}
                .page-title{font-size:26px;font-weight:600;color:#1e293b;margin-bottom:4px;}
                .page-sub{font-size:13px;color:#64748b;font-weight:300;}

                .status-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;font-size:13px;color:#15803d;margin-bottom:20px;display:flex;align-items:center;gap:8px;}

                /* Cards */
                .card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:16px;}
                .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
                .card-title-row{display:flex;align-items:center;gap:12px;}
                .card-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .icon-blue{background:#eff6ff;}
                .icon-green{background:#f0fdf4;}
                .icon-red{background:#fef2f2;}
                .card-title{font-size:15px;font-weight:500;color:#1e293b;}
                .card-desc{font-size:12px;color:#94a3b8;margin-top:2px;}

                /* Badge statut */
                .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;}
                .badge-active{background:#dcfce7;color:#15803d;}
                .badge-inactive{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;}

                /* Étapes */
                .steps{margin:16px 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;}
                .step{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#475569;line-height:1.5;}
                .step-num{width:22px;height:22px;border-radius:50%;background:#1e3a8a;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}

                /* QR */
                .qr-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px 0;}
                .qr-box{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;}
                .secret-row{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;width:100%;}
                .secret-key{flex:1;font-family:monospace;font-size:13px;color:#1e3a8a;letter-spacing:.1em;word-break:break-all;}
                .copy-btn{background:none;border:none;cursor:pointer;color:#3b4fd8;padding:2px;flex-shrink:0;transition:color .2s;}
                .copy-btn:hover{color:#1e3a8a;}

                /* Confirm form */
                .confirm-wrap{margin-top:20px;}
                .confirm-label{font-size:11px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;display:block;}
                .confirm-form{display:flex;gap:8px;}
                .confirm-input{flex:1;padding:12px;font-size:22px;font-weight:600;font-family:'DM Sans',sans-serif;letter-spacing:.25em;text-align:center;color:#1e3a8a;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;outline:none;transition:border-color .2s,box-shadow .2s;}
                .confirm-input:focus{border-color:#3b4fd8;box-shadow:0 0 0 3px rgba(59,79,216,.08);}
                .confirm-input.has-error{border-color:#ef4444;}
                .field-error{display:flex;align-items:center;gap:4px;font-size:12px;color:#ef4444;margin-top:5px;}

                /* Boutons */
                .btn{padding:10px 18px;border-radius:8px;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;border:none;transition:all .2s;display:inline-flex;align-items:center;gap:6px;}
                .btn-primary{background:#1e3a8a;color:#fff;}
                .btn-primary:hover{background:#1e40af;}
                .btn-primary:disabled{opacity:.6;cursor:not-allowed;}
                .btn-danger{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
                .btn-danger:hover{background:#fee2e2;}
                .btn-secondary{background:#f8fafc;color:#475569;border:1px solid #e2e8f0;}
                .btn-secondary:hover{background:#f1f5f9;}

                /* Codes grille */
                .codes-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;}
                .code-item{font-family:monospace;font-size:13px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;color:#1e3a8a;letter-spacing:.08em;text-align:center;}

                @keyframes spin{to{transform:rotate(360deg);}}
            `}</style>

            <div className="page">
                <div className="page-header">
                    <h1 className="page-title">Authentification à deux facteurs</h1>
                    <p className="page-sub">Renforcez la sécurité de votre compte avec Google Authenticator.</p>
                </div>

                {status && (
                    <div className="status-ok">
                        <ShieldCheck size={16}/> {status}
                    </div>
                )}

                {/* ── Card statut ── */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title-row">
                            <div className={`card-icon ${mfaEnabled ? 'icon-green' : 'icon-blue'}`}>
                                {mfaEnabled
                                    ? <ShieldCheck size={20} color="#16a34a"/>
                                    : <Shield size={20} color="#3b82f6"/>
                                }
                            </div>
                            <div>
                                <div className="card-title">
                                    Statut &nbsp;
                                    <span className={`badge ${mfaEnabled ? 'badge-active' : 'badge-inactive'}`}>
                                        {mfaEnabled ? '✓ Activé' : 'Désactivé'}
                                    </span>
                                </div>
                                <div className="card-desc">
                                    {mfaEnabled
                                        ? 'Votre compte est protégé par la double authentification.'
                                        : 'Activez le MFA pour sécuriser vos connexions.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Idle → bouton activer */}
                    {!mfaEnabled && !mfaPending && (
                        <button className="btn btn-primary" onClick={handleEnable}>
                            <Shield size={15}/> Activer le MFA
                        </button>
                    )}

                    {/* Pending → QR + confirmation */}
                    {mfaPending && qrCodeSvg && (
                        <>
                            <ol className="steps">
                                <li className="step"><div className="step-num">1</div> Installez <strong>Google Authenticator</strong> sur votre téléphone.</li>
                                <li className="step"><div className="step-num">2</div> Scannez le QR code ci-dessous ou entrez la clé manuellement.</li>
                                <li className="step"><div className="step-num">3</div> Entrez le code à <strong>6 chiffres</strong> pour confirmer l'activation.</li>
                            </ol>

                            <div className="qr-wrap">
                                <div className="qr-box" dangerouslySetInnerHTML={{ __html: qrCodeSvg }}/>
                                {secretKey && (
                                    <div className="secret-row">
                                        <span className="secret-key">{secretKey}</span>
                                        <button className="copy-btn" onClick={copySecret} title="Copier">
                                            {copied ? <Check size={15} color="#16a34a"/> : <Copy size={15}/>}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="confirm-wrap">
                                <span className="confirm-label">Code de confirmation</span>
                                <form onSubmit={handleConfirm} className="confirm-form">
                                    <input
                                        type="text" inputMode="numeric" maxLength={6}
                                        value={confirmForm.data.code}
                                        onChange={e => confirmForm.setData('code', e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className={`confirm-input${confirmForm.errors.code ? ' has-error' : ''}`}
                                    />
                                    <button type="submit"
                                            disabled={confirmForm.processing || confirmForm.data.code.length !== 6}
                                            className="btn btn-primary">
                                        {confirmForm.processing
                                            ? <Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/>
                                            : <ChevronRight size={15}/>
                                        }
                                        Confirmer
                                    </button>
                                </form>
                                {confirmForm.errors.code && (
                                    <p className="field-error"><AlertCircle size={12}/> {confirmForm.errors.code}</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Activé → désactiver */}
                    {mfaEnabled && (
                        <button className="btn btn-danger" onClick={handleDisable}>
                            <ShieldOff size={15}/> Désactiver le MFA
                        </button>
                    )}
                </div>

                {/* ── Card codes de récupération ── */}
                {mfaEnabled && (
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title-row">
                                <div className="card-icon icon-blue">
                                    <KeyRound size={20} color="#3b82f6"/>
                                </div>
                                <div>
                                    <div className="card-title">Codes de récupération</div>
                                    <div className="card-desc">8 codes à usage unique — conservez-les en lieu sûr.</div>
                                </div>
                            </div>
                        </div>

                        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                            <button className="btn btn-secondary" onClick={() => setShowCodes(s => !s)}>
                                {showCodes ? <EyeOff size={14}/> : <Eye size={14}/>}
                                {showCodes ? 'Masquer' : 'Afficher les codes'}
                            </button>
                            <button className="btn btn-secondary" onClick={handleRegenerate}>
                                <RefreshCw size={14}/> Regénérer
                            </button>
                        </div>

                        {showCodes && (
                            <div className="codes-grid">
                                {recoveryCodes.map((code, i) => (
                                    <div key={i} className="code-item">{code}</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}