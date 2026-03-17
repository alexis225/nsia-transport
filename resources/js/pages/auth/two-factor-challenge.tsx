import { useState, useRef, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Loader2, Shield, AlertCircle, KeyRound } from 'lucide-react';

interface TwoFactorChallengeProps {
    status?: string;
}

export default function TwoFactorChallenge({ status }: TwoFactorChallengeProps) {
    const [useRecovery, setUseRecovery] = useState(false);
    const [mounted, setMounted]         = useState(false);
    const inputRef                      = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const { data, setData, post, processing, errors, reset } = useForm({
        code:          '',
        recovery_code: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('two-factor.login'), {
            onFinish: () => reset('code', 'recovery_code'),
        });
    };

    return (
        <>
            <Head title="Vérification — NSIA Transport" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #F7F5F0; }

                .mfa-root {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: #F7F5F0;
                }
                .mfa-card {
                    width: 100%;
                    max-width: 420px;
                    background: #fff;
                    border: 1.5px solid #E2DDD6;
                    border-radius: 16px;
                    padding: 40px 36px;
                    opacity: 0;
                    transform: translateY(12px);
                    transition: opacity 0.5s ease, transform 0.5s ease;
                }
                .mfa-card.visible { opacity: 1; transform: translateY(0); }

                .mfa-icon {
                    width: 52px; height: 52px;
                    background: #EEF2FF;
                    border: 1.5px solid #C7D2FE;
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 20px;
                }
                .mfa-title {
                    font-size: 22px; font-weight: 500;
                    color: #1A2744; margin-bottom: 6px;
                }
                .mfa-sub {
                    font-size: 13px; color: #888; font-weight: 300;
                    line-height: 1.6; margin-bottom: 28px;
                }
                .mfa-sub strong { color: #555; font-weight: 500; }

                .field { margin-bottom: 20px; }
                .field-label {
                    display: block;
                    font-size: 10px; font-weight: 500;
                    color: #777; text-transform: uppercase;
                    letter-spacing: 0.1em; margin-bottom: 7px;
                }
                .field-input {
                    width: 100%;
                    padding: 12px 14px;
                    font-size: 18px;
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 500;
                    letter-spacing: 0.25em;
                    color: #1A2744;
                    background: #FAFAF8;
                    border: 1.5px solid #E2DDD6;
                    border-radius: 8px;
                    outline: none;
                    text-align: center;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .field-input:focus {
                    border-color: #1A2744;
                    box-shadow: 0 0 0 3px rgba(26,39,68,0.06);
                    background: #fff;
                }
                .field-input.recovery {
                    font-size: 14px;
                    letter-spacing: 0.08em;
                }
                .field-input.error { border-color: #D94040; background: #FFF8F8; }
                .field-error {
                    display: flex; align-items: center; gap: 5px;
                    margin-top: 6px; font-size: 12px; color: #D94040;
                }

                .btn-primary {
                    width: 100%; padding: 13px;
                    background: #1A2744; color: #fff;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px; font-weight: 500;
                    border: none; border-radius: 8px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: background 0.2s, box-shadow 0.2s;
                    margin-bottom: 16px;
                }
                .btn-primary:hover:not(:disabled) {
                    background: #253660;
                    box-shadow: 0 4px 16px rgba(26,39,68,0.2);
                }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

                .btn-link {
                    width: 100%; padding: 10px;
                    background: none; border: none;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px; color: #C29D5A;
                    cursor: pointer; text-align: center;
                    transition: color 0.2s;
                }
                .btn-link:hover { color: #A6833D; }

                .divider {
                    display: flex; align-items: center; gap: 12px;
                    margin: 4px 0 16px;
                }
                .divider-line { flex: 1; height: 1px; background: #EDE8E1; }
                .divider-text { font-size: 10px; color: #CCC; text-transform: uppercase; letter-spacing: 0.1em; }

                .status-msg {
                    background: #EFF7F0; border: 1px solid #B8DFB9;
                    border-radius: 8px; padding: 10px 12px;
                    font-size: 13px; color: #2D7A31; margin-bottom: 20px;
                }

                .hint {
                    margin-top: 20px; padding-top: 16px;
                    border-top: 1px solid #EDE8E1;
                    font-size: 11px; color: #C0BAB0;
                    text-align: center; line-height: 1.6;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="mfa-root">
                <div className={`mfa-card ${mounted ? 'visible' : ''}`}>

                    <div className="mfa-icon">
                        <Shield size={24} color="#4F46E5" />
                    </div>

                    <h2 className="mfa-title">
                        {useRecovery ? 'Code de récupération' : 'Vérification en deux étapes'}
                    </h2>

                    <p className="mfa-sub">
                        {useRecovery ? (
                            <>Entrez l'un de vos <strong>codes de récupération</strong> pour accéder à votre compte.</>
                        ) : (
                            <>Entrez le code à <strong>6 chiffres</strong> affiché dans votre application <strong>Google Authenticator</strong>.</>
                        )}
                    </p>

                    {status && <div className="status-msg">{status}</div>}

                    <form onSubmit={submit}>
                        {!useRecovery ? (
                            <div className="field">
                                <label className="field-label">Code TOTP</label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={data.code}
                                    onChange={e => setData('code', e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    disabled={processing}
                                    autoComplete="one-time-code"
                                    className={`field-input ${errors.code ? 'error' : ''}`}
                                />
                                {errors.code && (
                                    <div className="field-error">
                                        <AlertCircle size={12} /> {errors.code}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="field">
                                <label className="field-label">Code de récupération</label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={data.recovery_code}
                                    onChange={e => setData('recovery_code', e.target.value)}
                                    placeholder="xxxx-xxxx-xxxx"
                                    disabled={processing}
                                    autoComplete="off"
                                    className={`field-input recovery ${errors.recovery_code ? 'error' : ''}`}
                                />
                                {errors.recovery_code && (
                                    <div className="field-error">
                                        <AlertCircle size={12} /> {errors.recovery_code}
                                    </div>
                                )}
                            </div>
                        )}

                        <button type="submit" disabled={processing} className="btn-primary">
                            {processing ? (
                                <>
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    Vérification…
                                </>
                            ) : (
                                <>
                                    <KeyRound size={16} />
                                    Vérifier
                                </>
                            )}
                        </button>
                    </form>

                    <div className="divider">
                        <div className="divider-line" />
                        <span className="divider-text">ou</span>
                        <div className="divider-line" />
                    </div>

                    <button
                        type="button"
                        className="btn-link"
                        onClick={() => {
                            setUseRecovery(r => !r);
                            reset('code', 'recovery_code');
                            setTimeout(() => inputRef.current?.focus(), 100);
                        }}
                    >
                        {useRecovery
                            ? "Utiliser l'application Authenticator"
                            : "Utiliser un code de récupération"}
                    </button>

                    <div className="hint">
                        Le code expire toutes les 30 secondes · TOTP RFC 6238
                    </div>
                </div>
            </div>
        </>
    );
}