import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2, AlertCircle, ArrowLeft, Mail } from 'lucide-react';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Mot de passe oublié — NSIA Transport" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html, body { height: 100%; font-family: 'DM Sans', sans-serif; }

                .root {
                    display: grid;
                    grid-template-columns: 45% 55%;
                    min-height: 100vh;
                }

                /* ── Panneau gauche ── */
                .left {
                    position: relative;
                    background: linear-gradient(160deg, #1a3a8f 0%, #1e2fa0 30%, #2d1b8e 65%, #3b1fa8 100%);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 36px 44px 48px;
                    overflow: hidden;
                }
                .left::after {
                    content: '';
                    position: absolute;
                    top: -10%; right: -60px;
                    width: 140px; height: 120%;
                    background: rgba(255,255,255,0.06);
                    border-radius: 50%;
                }
                .deco-circle-1 {
                    position: absolute;
                    top: -80px; right: -80px;
                    width: 300px; height: 300px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.04);
                }
                .deco-circle-2 {
                    position: absolute;
                    bottom: -60px; left: -60px;
                    width: 240px; height: 240px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.04);
                }
                .left-brand {
                    position: relative; z-index: 1;
                    display: flex; align-items: center; gap: 10px;
                }
                .brand-name {
                    font-size: 18px; font-weight: 600;
                    color: #fff; letter-spacing: 0.01em;
                }
                .brand-name span { font-weight: 300; opacity: 0.85; }

                .illustration {
                    position: relative; z-index: 1;
                    display: flex; align-items: center;
                    justify-content: center; flex: 1; padding: 20px 0;
                }

                .left-text { position: relative; z-index: 1; }
                .left-title {
                    font-size: 28px; font-weight: 600;
                    color: #fff; line-height: 1.3;
                    margin-bottom: 10px; max-width: 320px;
                }
                .left-sub {
                    font-size: 14px; font-weight: 300;
                    color: rgba(255,255,255,0.6); line-height: 1.6;
                }

                /* ── Panneau droit ── */
                .right {
                    background: #f1f5f9;
                    display: flex; align-items: center;
                    justify-content: center; padding: 48px 32px;
                }
                .form-box {
                    width: 100%; max-width: 400px;
                    opacity: 0; transform: translateY(12px);
                    transition: opacity 0.5s ease, transform 0.5s ease;
                }
                .form-box.visible { opacity: 1; transform: translateY(0); }

                .form-title {
                    font-size: 28px; font-weight: 600;
                    color: #1e293b; margin-bottom: 10px;
                }
                .form-desc {
                    font-size: 13px; color: #64748b; font-weight: 300;
                    line-height: 1.6; margin-bottom: 28px;
                }

                /* Status succès */
                .status-ok {
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    border-radius: 10px; padding: 14px 16px;
                    font-size: 13px; color: #15803d;
                    margin-bottom: 20px;
                    display: flex; align-items: flex-start; gap: 10px;
                }
                .status-icon {
                    width: 32px; height: 32px; background: #dcfce7;
                    border-radius: 50%; display: flex; align-items: center;
                    justify-content: center; flex-shrink: 0;
                }

                /* Champ */
                .field { margin-bottom: 20px; }
                .field-input {
                    width: 100%; padding: 13px 16px;
                    font-size: 14px; font-family: 'DM Sans', sans-serif;
                    color: #1e293b; background: #fff;
                    border: 1.5px solid #e2e8f0; border-radius: 10px;
                    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
                }
                .field-input::placeholder { color: #94a3b8; }
                .field-input:focus {
                    border-color: #3b4fd8;
                    box-shadow: 0 0 0 3px rgba(59,79,216,0.08);
                }
                .field-input.has-error { border-color: #ef4444; background: #fff8f8; }
                .field-input:disabled { opacity: 0.6; }
                .field-error {
                    display: flex; align-items: center; gap: 4px;
                    font-size: 12px; color: #ef4444; margin-top: 5px;
                }

                /* Bouton envoi */
                .btn-send {
                    width: 100%; padding: 13px;
                    background: #1e3a8a; color: #fff;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px; font-weight: 500;
                    border: none; border-radius: 10px;
                    cursor: pointer;
                    display: flex; align-items: center;
                    justify-content: center; gap: 8px;
                    transition: background 0.2s, box-shadow 0.2s;
                    margin-bottom: 14px;
                }
                .btn-send:hover:not(:disabled) {
                    background: #1e40af;
                    box-shadow: 0 4px 16px rgba(30,58,138,0.3);
                }
                .btn-send:disabled { opacity: 0.65; cursor: not-allowed; }

                /* Lien retour */
                .back-link {
                    display: flex; align-items: center; justify-content: center;
                    gap: 6px; font-size: 13px; color: #64748b;
                    text-decoration: none; transition: color 0.2s;
                    padding: 10px;
                }
                .back-link:hover { color: #3b4fd8; }

                .form-footer {
                    margin-top: 28px; text-align: center;
                    font-size: 12px; color: #94a3b8;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .root { grid-template-columns: 1fr; }
                    .left { display: none; }
                }
            `}</style>

            <div className="root">

                {/* ── Panneau gauche (identique au login) ── */}
                <div className="left">
                    <div className="deco-circle-1" />
                    <div className="deco-circle-2" />

                    <div className="left-brand">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <rect width="36" height="36" rx="8" fill="rgba(255,255,255,0.12)"/>
                            <path d="M18 8L10 13V20C10 24.4 13.4 28.5 18 30C22.6 28.5 26 24.4 26 20V13L18 8Z"
                                  stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                            <path d="M14 20L17 23L22 17" stroke="white" strokeWidth="1.5"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="brand-name">NSIA <span>Transport</span></span>
                    </div>

                    {/* Illustration — clé / cadenas */}
                    <div className="illustration">
                        <svg width="300" height="260" viewBox="0 0 300 260" fill="none">
                            {/* Cadenas corps */}
                            <rect x="85" y="120" width="130" height="100" rx="16"
                                  fill="rgba(255,255,255,0.18)"/>
                            <rect x="95" y="130" width="110" height="80" rx="10"
                                  fill="rgba(255,255,255,0.1)"/>

                            {/* Cadenas anse */}
                            <path d="M110 120 V90 Q110 60 150 60 Q190 60 190 90 V120"
                                  stroke="rgba(255,255,255,0.3)" strokeWidth="16"
                                  strokeLinecap="round" fill="none"/>

                            {/* Trou clé */}
                            <circle cx="150" cy="168" r="14"
                                    fill="rgba(255,255,255,0.25)"/>
                            <rect x="146" y="168" width="8" height="22" rx="4"
                                  fill="rgba(255,255,255,0.25)"/>

                            {/* Étoiles / points déco */}
                            <circle cx="60"  cy="80"  r="4" fill="rgba(255,255,255,0.2)"/>
                            <circle cx="250" cy="100" r="3" fill="rgba(255,255,255,0.15)"/>
                            <circle cx="240" cy="180" r="5" fill="rgba(255,255,255,0.1)"/>
                            <circle cx="55"  cy="160" r="3" fill="rgba(255,255,255,0.12)"/>

                            {/* Lignes décoratives */}
                            <line x1="40"  y1="110" x2="70"  y2="110"
                                  stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="230" y1="140" x2="260" y2="140"
                                  stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="40"  y1="120" x2="60"  y2="120"
                                  stroke="rgba(255,255,255,0.07)" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </div>

                    <div className="left-text">
                        <h2 className="left-title">
                            Mot de passe oublié ?<br />Pas de panique.
                        </h2>
                        <p className="left-sub">
                            Entrez votre email et nous vous enverrons
                            un lien pour réinitialiser votre mot de passe.
                        </p>
                    </div>
                </div>

                {/* ── Panneau droit ── */}
                <div className="right">
                    <div className={`form-box ${mounted ? 'visible' : ''}`}>

                        <h1 className="form-title">Réinitialisation</h1>
                        <p className="form-desc">
                            Saisissez l'adresse email associée à votre compte.<br />
                            Vous recevrez un lien valable <strong>60 minutes</strong>.
                        </p>

                        {/* Succès */}
                        {status && (
                            <div className="status-ok">
                                <div className="status-icon">
                                    <Mail size={16} color="#15803d" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 500, marginBottom: 2 }}>Email envoyé !</p>
                                    <p style={{ opacity: 0.85 }}>{status}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div className="field">
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="Adresse email"
                                    disabled={processing}
                                    className={`field-input${errors.email ? ' has-error' : ''}`}
                                />
                                {errors.email && (
                                    <p className="field-error">
                                        <AlertCircle size={12} /> {errors.email}
                                    </p>
                                )}
                            </div>

                            <button type="submit" disabled={processing} className="btn-send">
                                {processing ? (
                                    <>
                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                        Envoi en cours…
                                    </>
                                ) : (
                                    'Envoyer le lien'
                                )}
                            </button>
                        </form>

                        <Link href={route('login')} className="back-link">
                            <ArrowLeft size={15} />
                            Retour à la connexion
                        </Link>

                        <div className="form-footer">
                            © {new Date().getFullYear()} NSIA Holding Assurances — Confidentiel
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}