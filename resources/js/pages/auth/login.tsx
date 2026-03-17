import { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword = true }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login') as string, { onFinish: () => reset('password') });
    };

    const handleOAuth = (provider: 'google' | 'microsoft') => {
        window.location.href = route(`/auth/${provider}/redirect`, { provider }) as string;
    };

    return (
        <>
            <Head title="Connexion — NSIA Transport" />

            {/* Google Fonts */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; }

                .login-root {
                    min-height: 100vh;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    background: #F7F5F0;
                }

                /* ── Panneau gauche ── */
                .panel-left {
                    position: relative;
                    background: #1A2744;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 56px 52px;
                }
                .panel-left-bg {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse 80% 60% at 20% 110%, rgba(194,157,90,0.18) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 40% at 90% -10%, rgba(255,255,255,0.04) 0%, transparent 50%);
                }
                .panel-left-lines {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 48px 48px;
                }
                .panel-left-deco {
                    position: absolute;
                    bottom: -80px;
                    right: -80px;
                    width: 360px;
                    height: 360px;
                    border-radius: 50%;
                    border: 1px solid rgba(194,157,90,0.15);
                }
                .panel-left-deco2 {
                    position: absolute;
                    bottom: -40px;
                    right: -40px;
                    width: 240px;
                    height: 240px;
                    border-radius: 50%;
                    border: 1px solid rgba(194,157,90,0.1);
                }
                .panel-brand {
                    position: relative;
                    z-index: 1;
                }
                .panel-brand-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 48px;
                }
                .panel-brand-icon {
                    width: 44px;
                    height: 44px;
                    background: rgba(194,157,90,0.15);
                    border: 1px solid rgba(194,157,90,0.3);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .panel-brand-name {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px;
                    font-weight: 600;
                    color: #fff;
                    letter-spacing: 0.04em;
                }
                .panel-brand-name span {
                    color: #C29D5A;
                }
                .panel-headline {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 48px;
                    font-weight: 500;
                    color: #fff;
                    line-height: 1.15;
                    letter-spacing: -0.01em;
                    margin-bottom: 20px;
                }
                .panel-headline em {
                    font-style: italic;
                    color: #C29D5A;
                }
                .panel-sub {
                    font-size: 14px;
                    font-weight: 300;
                    color: rgba(255,255,255,0.5);
                    line-height: 1.7;
                    max-width: 320px;
                }
                .panel-stats {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    gap: 40px;
                }
                .stat-item {}
                .stat-number {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 32px;
                    font-weight: 600;
                    color: #C29D5A;
                    letter-spacing: -0.02em;
                }
                .stat-label {
                    font-size: 11px;
                    font-weight: 400;
                    color: rgba(255,255,255,0.35);
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    margin-top: 2px;
                }

                /* ── Panneau droit ── */
                .panel-right {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px;
                    background: #F7F5F0;
                }
                .form-card {
                    width: 100%;
                    max-width: 400px;
                    opacity: 0;
                    transform: translateY(16px);
                    transition: opacity 0.6s ease, transform 0.6s ease;
                }
                .form-card.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .form-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 32px;
                    font-weight: 500;
                    color: #1A2744;
                    margin-bottom: 6px;
                    letter-spacing: -0.01em;
                }
                .form-subtitle {
                    font-size: 13px;
                    color: #8A8A8A;
                    margin-bottom: 36px;
                    font-weight: 300;
                }

                /* Status */
                .status-msg {
                    background: #EFF7F0;
                    border: 1px solid #B8DFB9;
                    border-radius: 8px;
                    padding: 12px 14px;
                    font-size: 13px;
                    color: #2D7A31;
                    margin-bottom: 20px;
                }

                /* Field */
                .field { margin-bottom: 20px; }
                .field-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 7px;
                }
                .field-label {
                    font-size: 11px;
                    font-weight: 500;
                    color: #555;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .field-link {
                    font-size: 12px;
                    color: #C29D5A;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .field-link:hover { color: #A6833D; }
                .input-wrap { position: relative; }
                .field-input {
                    width: 100%;
                    padding: 12px 14px;
                    font-size: 14px;
                    font-family: 'DM Sans', sans-serif;
                    color: #1A2744;
                    background: #fff;
                    border: 1.5px solid #E2DDD6;
                    border-radius: 8px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .field-input:focus {
                    border-color: #1A2744;
                    box-shadow: 0 0 0 3px rgba(26,39,68,0.06);
                }
                .field-input.error {
                    border-color: #D94040;
                    background: #FFF8F8;
                }
                .field-input:disabled { opacity: 0.6; cursor: not-allowed; }
                .field-input-pr { padding-right: 44px; }
                .pw-toggle {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #AAA;
                    padding: 4px;
                    display: flex;
                    transition: color 0.2s;
                }
                .pw-toggle:hover { color: #555; }
                .field-error {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    margin-top: 6px;
                    font-size: 12px;
                    color: #D94040;
                }

                /* Remember */
                .remember-row {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    margin-bottom: 24px;
                    cursor: pointer;
                }
                .remember-box {
                    width: 16px;
                    height: 16px;
                    border: 1.5px solid #D0C9BE;
                    border-radius: 4px;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }
                .remember-box.checked {
                    background: #1A2744;
                    border-color: #1A2744;
                }
                .remember-text {
                    font-size: 13px;
                    color: #777;
                    font-weight: 300;
                    user-select: none;
                }

                /* Bouton principal */
                .btn-primary {
                    width: 100%;
                    padding: 13px 20px;
                    background: #1A2744;
                    color: #fff;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
                    margin-bottom: 24px;
                    letter-spacing: 0.01em;
                }
                .btn-primary:hover:not(:disabled) {
                    background: #253660;
                    box-shadow: 0 4px 16px rgba(26,39,68,0.2);
                }
                .btn-primary:active:not(:disabled) { transform: scale(0.99); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

                /* Séparateur */
                .divider {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 20px;
                }
                .divider-line { flex: 1; height: 1px; background: #E2DDD6; }
                .divider-text { font-size: 11px; color: #BBB; text-transform: uppercase; letter-spacing: 0.1em; }

                /* Boutons OAuth */
                .btn-oauth {
                    width: 100%;
                    padding: 11px 16px;
                    background: #fff;
                    color: #333;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 400;
                    border: 1.5px solid #E2DDD6;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    margin-bottom: 10px;
                }
                .btn-oauth:last-child { margin-bottom: 0; }
                .btn-oauth:hover:not(:disabled) {
                    border-color: #C8C0B4;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                }
                .btn-oauth:disabled { opacity: 0.5; cursor: not-allowed; }

                /* Footer */
                .form-footer {
                    margin-top: 28px;
                    padding-top: 20px;
                    border-top: 1px solid #EDE8E1;
                    text-align: center;
                    font-size: 11px;
                    color: #C0BAB0;
                    letter-spacing: 0.04em;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .login-root { grid-template-columns: 1fr; }
                    .panel-left { display: none; }
                    .panel-right { padding: 32px 24px; }
                }
            `}</style>

            <div className="login-root">

                {/* ── Panneau gauche décoratif ── */}
                <div className="panel-left">
                    <div className="panel-left-bg" />
                    <div className="panel-left-lines" />
                    <div className="panel-left-deco" />
                    <div className="panel-left-deco2" />

                    <div className="panel-brand">
                        <div className="panel-brand-logo">
                            <div className="panel-brand-icon">
                                {/* Icône bouclier SVG */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z"
                                          stroke="#C29D5A" strokeWidth="1.5" strokeLinejoin="round"/>
                                    <path d="M9 12L11 14L15 10" stroke="#C29D5A" strokeWidth="1.5"
                                          strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className="panel-brand-name">
                                NSIA <span>Transport</span>
                            </div>
                        </div>

                        <h1 className="panel-headline">
                            Émission de certificats&nbsp;
                            <em>d'assurance</em>
                        </h1>
                        <p className="text-white">
                            Plateforme unifiée de gestion, validation et archivage des certificats transport
                            pour les 12 filiales NSIA.
                        </p>
                    </div>

                    <div className="panel-stats">
                        <div className="stat-item">
                            <div className="stat-number">12</div>
                            <div className="stat-label">Filiales</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">6</div>
                            <div className="stat-label">Rôles</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">ISO</div>
                            <div className="stat-label">Certifié</div>
                        </div>
                    </div>
                </div>

                {/* ── Panneau droit — formulaire ── */}
                <div className="panel-right">
                    <div className={`form-card ${mounted ? 'visible' : ''}`}>

                        <h2 className="form-title">Connexion</h2>
                        <p className="form-subtitle">Accédez à votre espace de travail</p>

                        {status && <div className="status-msg">{status}</div>}

                        <form onSubmit={submit}>

                            {/* Email */}
                            <div className="field">
                                <div className="field-header">
                                    <label className="field-label">Adresse email</label>
                                </div>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="prenom.nom@nsia.com"
                                    disabled={processing}
                                    className={`field-input ${errors.email ? 'error' : ''}`}
                                />
                                {errors.email && (
                                    <div className="field-error">
                                        <AlertCircle size={12} />
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            {/* Mot de passe */}
                            <div className="field">
                                <div className="field-header">
                                    <label className="field-label">Mot de passe</label>
                                    {canResetPassword && (
                                        <Link href={route('password.request')} className="field-link">
                                            Mot de passe oublié ?
                                        </Link>
                                    )}
                                </div>
                                <div className="input-wrap">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        disabled={processing}
                                        className={`field-input field-input-pr ${errors.password ? 'error' : ''}`}
                                    />
                                    <button type="button" className="pw-toggle"
                                            onClick={() => setShowPassword(s => !s)}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="field-error">
                                        <AlertCircle size={12} />
                                        {errors.password}
                                    </div>
                                )}
                            </div>

                            {/* Se souvenir */}
                            <label className="remember-row"
                                   onClick={() => setData('remember', !data.remember)}>
                                <div className={`remember-box ${data.remember ? 'checked' : ''}`}>
                                    {data.remember && (
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white"
                                                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>
                                <span className="remember-text">Se souvenir de moi</span>
                            </label>

                            {/* Bouton */}
                            <button type="submit" disabled={processing} className="btn-primary">
                                {processing ? (
                                    <>
                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                        Connexion en cours…
                                    </>
                                ) : (
                                    <>
                                        Se connecter
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Séparateur */}
                        <div className="divider">
                            <div className="divider-line" />
                            <span className="divider-text">ou</span>
                            <div className="divider-line" />
                        </div>

                        {/* OAuth Google */}
                        <button type="button" className="btn-oauth" disabled={processing}
                                onClick={() => handleOAuth('google')}>
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M5.26 9.77A7.09 7.09 0 0 1 12 4.91c1.69 0 3.21.6 4.41 1.57l3.3-3.3A11.97 11.97 0 0 0 12 0C7.39 0 3.38 2.67 1.3 6.58l3.96 3.19Z"/>
                                <path fill="#34A853" d="M16.04 18.01A7.1 7.1 0 0 1 12 19.09c-2.93 0-5.44-1.77-6.65-4.33L1.3 17.95A12 12 0 0 0 12 24c3.25 0 6.28-1.18 8.57-3.1l-4.53-2.89Z"/>
                                <path fill="#4A90D9" d="M23.76 12.27c0-.82-.07-1.62-.2-2.39H12v4.63h6.6a5.67 5.67 0 0 1-2.42 3.69l4.53 2.89c2.64-2.44 4.05-6.04 4.05-10.82Z"/>
                                <path fill="#FBBC05" d="M5.35 14.76A7.1 7.1 0 0 1 4.91 12c0-.96.17-1.89.44-2.77L1.3 6.04A12.03 12.03 0 0 0 0 12c0 1.94.46 3.77 1.3 5.39l4.05-2.63Z"/>
                            </svg>
                            Continuer avec Google
                        </button>

                        {/* OAuth Microsoft */}
                        <button type="button" className="btn-oauth" disabled={processing}
                                onClick={() => handleOAuth('microsoft')}>
                            <svg width="16" height="16" viewBox="0 0 23 23">
                                <rect x="0"    y="0"    width="10.5" height="10.5" fill="#F25022"/>
                                <rect x="12.5" y="0"    width="10.5" height="10.5" fill="#7FBA00"/>
                                <rect x="0"    y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
                                <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
                            </svg>
                            Continuer avec Microsoft
                        </button>

                        {/* Footer */}
                        <div className="form-footer">
                            © {new Date().getFullYear()} NSIA Holding Assurances — Confidentiel
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}