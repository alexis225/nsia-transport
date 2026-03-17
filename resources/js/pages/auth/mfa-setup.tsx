import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Shield, ShieldCheck, ShieldOff, RefreshCw, Copy, Check, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';

interface MfaSetupProps {
    mfaEnabled:    boolean;
    mfaPending:    boolean;
    qrCodeSvg:     string | null;
    secretKey:     string | null;
    recoveryCodes: string[];
    status?:       string;
}

export default function MfaSetup({
    mfaEnabled,
    mfaPending,
    qrCodeSvg,
    secretKey,
    recoveryCodes,
    status,
}: MfaSetupProps) {
    const [copied, setCopied]             = useState(false);
    const [showCodes, setShowCodes]       = useState(false);

    // Formulaire confirmation code TOTP (Fortify)
    const confirmForm = useForm({ code: '' });

    // Formulaire désactivation (Fortify — nécessite confirmation mot de passe)
    const disableForm = useForm({});

    const copySecret = () => {
        if (secretKey) {
            navigator.clipboard.writeText(secretKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleEnable = () => {
        router.post(route('mfa.enable'));
    };

    const handleDisable = () => {
        if (confirm('Désactiver l\'authentification à deux facteurs ?')) {
            router.delete(route('mfa.disable'));
        }
    };

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        // Fortify expose POST /user/confirmed-two-factor-authentication
        confirmForm.post(route('two-factor.confirm'), {
            onSuccess: () => confirmForm.reset(),
        });
    };

    const handleRegenerate = () => {
        if (confirm('Regénérer les codes de récupération ? Les anciens seront invalidés.')) {
            router.post(route('mfa.recovery-codes.regenerate'));
        }
    };

    return (
        <>
            <Head title="Configuration MFA — NSIA Transport" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #F7F5F0; }

                .setup-root { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
                .setup-title {
                    font-size: 22px; font-weight: 500; color: #1A2744;
                    margin-bottom: 4px;
                }
                .setup-sub { font-size: 13px; color: #888; font-weight: 300; margin-bottom: 32px; }

                .status-msg {
                    background: #EFF7F0; border: 1px solid #B8DFB9;
                    border-radius: 8px; padding: 10px 14px;
                    font-size: 13px; color: #2D7A31; margin-bottom: 20px;
                }

                .card {
                    background: #fff; border: 1.5px solid #E2DDD6;
                    border-radius: 12px; padding: 24px; margin-bottom: 16px;
                }
                .card-header {
                    display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
                }
                .card-icon {
                    width: 40px; height: 40px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .card-icon.blue { background: #EEF2FF; }
                .card-icon.green { background: #ECFDF5; }
                .card-icon.red { background: #FEF2F2; }
                .card-title { font-size: 15px; font-weight: 500; color: #1A2744; }
                .card-desc { font-size: 12px; color: #888; font-weight: 300; margin-top: 2px; }

                .badge {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 4px 10px; border-radius: 20px;
                    font-size: 11px; font-weight: 500;
                }
                .badge.active { background: #ECFDF5; color: #065F46; }
                .badge.inactive { background: #F9FAFB; color: #6B7280; border: 1px solid #E5E7EB; }

                .qr-wrap {
                    display: flex; flex-direction: column; align-items: center;
                    gap: 16px; padding: 16px 0;
                }
                .qr-box {
                    background: #fff; border: 1.5px solid #E2DDD6;
                    border-radius: 10px; padding: 16px;
                }
                .secret-row {
                    display: flex; align-items: center; gap: 8px;
                    background: #F7F5F0; border: 1px solid #E2DDD6;
                    border-radius: 8px; padding: 10px 14px;
                    font-family: monospace; font-size: 14px;
                    color: #1A2744; letter-spacing: 0.1em;
                    width: 100%;
                }
                .secret-key { flex: 1; word-break: break-all; }
                .copy-btn {
                    background: none; border: none; cursor: pointer;
                    color: #C29D5A; padding: 2px; flex-shrink: 0;
                    transition: color 0.2s;
                }
                .copy-btn:hover { color: #A6833D; }

                .confirm-form { display: flex; gap: 8px; margin-top: 16px; }
                .confirm-input {
                    flex: 1; padding: 10px 12px;
                    font-size: 16px; font-weight: 500;
                    font-family: 'DM Sans', sans-serif;
                    letter-spacing: 0.2em; text-align: center;
                    color: #1A2744; background: #FAFAF8;
                    border: 1.5px solid #E2DDD6; border-radius: 8px;
                    outline: none; transition: border-color 0.2s;
                }
                .confirm-input:focus { border-color: #1A2744; }
                .confirm-input.error { border-color: #D94040; }

                .field-error {
                    display: flex; align-items: center; gap: 5px;
                    margin-top: 6px; font-size: 12px; color: #D94040;
                }

                .btn { padding: 10px 18px; border-radius: 8px; font-size: 13px;
                       font-weight: 500; font-family: 'DM Sans', sans-serif;
                       cursor: pointer; border: none; transition: all 0.2s;
                       display: inline-flex; align-items: center; gap: 6px;
                }
                .btn-primary { background: #1A2744; color: #fff; }
                .btn-primary:hover { background: #253660; }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-danger { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
                .btn-danger:hover { background: #FEE2E2; }
                .btn-secondary { background: #F7F5F0; color: #444; border: 1px solid #E2DDD6; }
                .btn-secondary:hover { background: #EDE8E1; }

                .codes-grid {
                    display: grid; grid-template-columns: 1fr 1fr;
                    gap: 8px; margin-top: 12px;
                }
                .code-item {
                    font-family: monospace; font-size: 13px;
                    background: #F7F5F0; border: 1px solid #E2DDD6;
                    border-radius: 6px; padding: 8px 12px;
                    color: #1A2744; letter-spacing: 0.08em;
                    text-align: center;
                }

                .steps { margin: 12px 0; padding: 0; list-style: none; }
                .step {
                    display: flex; gap: 10px; align-items: flex-start;
                    font-size: 13px; color: #555; line-height: 1.5;
                    padding: 6px 0;
                }
                .step-num {
                    width: 20px; height: 20px; border-radius: 50%;
                    background: #1A2744; color: #fff;
                    font-size: 11px; font-weight: 500;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; margin-top: 1px;
                }
            `}</style>

            <div className="setup-root">
                <h1 className="setup-title">Authentification à deux facteurs</h1>
                <p className="setup-sub">Renforcez la sécurité de votre compte avec Google Authenticator.</p>

                {status && <div className="status-msg">{status}</div>}

                {/* ── État actuel ── */}
                <div className="card">
                    <div className="card-header">
                        <div className={`card-icon ${mfaEnabled ? 'green' : 'blue'}`}>
                            {mfaEnabled
                                ? <ShieldCheck size={20} color="#059669" />
                                : <Shield size={20} color="#4F46E5" />
                            }
                        </div>
                        <div>
                            <div className="card-title">
                                Statut MFA &nbsp;
                                <span className={`badge ${mfaEnabled ? 'active' : 'inactive'}`}>
                                    {mfaEnabled ? '✓ Activé' : 'Désactivé'}
                                </span>
                            </div>
                            <div className="card-desc">
                                {mfaEnabled
                                    ? 'Votre compte est protégé par une vérification en deux étapes.'
                                    : 'Activez le MFA pour sécuriser votre connexion.'}
                            </div>
                        </div>
                    </div>

                    {/* ── Non activé → bouton activer ── */}
                    {!mfaEnabled && !mfaPending && (
                        <button className="btn btn-primary" onClick={handleEnable}>
                            <Shield size={15} />
                            Activer le MFA
                        </button>
                    )}

                    {/* ── En attente de confirmation ── */}
                    {mfaPending && qrCodeSvg && (
                        <>
                            <ol className="steps">
                                <li className="step">
                                    <div className="step-num">1</div>
                                    Installez <strong>Google Authenticator</strong> sur votre téléphone.
                                </li>
                                <li className="step">
                                    <div className="step-num">2</div>
                                    Scannez le QR code ou entrez la clé manuellement.
                                </li>
                                <li className="step">
                                    <div className="step-num">3</div>
                                    Entrez le code à 6 chiffres pour confirmer l'activation.
                                </li>
                            </ol>

                            <div className="qr-wrap">
                                <div
                                    className="qr-box"
                                    dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                                />
                                {secretKey && (
                                    <div className="secret-row">
                                        <span className="secret-key">{secretKey}</span>
                                        <button className="copy-btn" onClick={copySecret} title="Copier">
                                            {copied ? <Check size={15} color="#059669" /> : <Copy size={15} />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleConfirm} className="confirm-form">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={confirmForm.data.code}
                                    onChange={e => confirmForm.setData('code', e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className={`confirm-input ${confirmForm.errors.code ? 'error' : ''}`}
                                />
                                <button
                                    type="submit"
                                    disabled={confirmForm.processing || confirmForm.data.code.length !== 6}
                                    className="btn btn-primary"
                                >
                                    Confirmer
                                </button>
                            </form>
                            {confirmForm.errors.code && (
                                <div className="field-error">
                                    <AlertCircle size={12} /> {confirmForm.errors.code}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Activé → bouton désactiver ── */}
                    {mfaEnabled && (
                        <button className="btn btn-danger" onClick={handleDisable}>
                            <ShieldOff size={15} />
                            Désactiver le MFA
                        </button>
                    )}
                </div>

                {/* ── Codes de récupération ── */}
                {mfaEnabled && (
                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon blue">
                                <KeyRound size={20} color="#4F46E5" />
                            </div>
                            <div>
                                <div className="card-title">Codes de récupération</div>
                                <div className="card-desc">
                                    Conservez ces codes en lieu sûr — à usage unique si vous perdez votre téléphone.
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn btn-secondary"
                            style={{ marginBottom: 12 }}
                            onClick={() => setShowCodes(s => !s)}
                        >
                            {showCodes ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showCodes ? 'Masquer' : 'Afficher les codes'}
                        </button>

                        {showCodes && (
                            <div className="codes-grid">
                                {recoveryCodes.map((code, i) => (
                                    <div key={i} className="code-item">{code}</div>
                                ))}
                            </div>
                        )}

                        <button
                            className="btn btn-secondary"
                            style={{ marginTop: 12 }}
                            onClick={handleRegenerate}
                        >
                            <RefreshCw size={14} />
                            Regénérer les codes
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}