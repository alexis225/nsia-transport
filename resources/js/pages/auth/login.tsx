import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword = true }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted]           = useState(false);

    useEffect(() => setMounted(true), []);

    const { data, setData, post, processing, errors, reset } = useForm({
        email:    '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const handleOAuth = (provider: 'google' | 'microsoft') => {
        window.location.href = route('auth.social.redirect', { provider });
    };

    return (
        <>
            <Head title="Connexion — NSIA Transport" />

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

                /* Courbe décorative droite */
                .left::after {
                    content: '';
                    position: absolute;
                    top: -10%;
                    right: -60px;
                    width: 140px;
                    height: 120%;
                    background: rgba(255,255,255,0.06);
                    border-radius: 50%;
                }

                /* Cercles décoratifs */
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
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .brand-icon {
                    width: 36px; height: 36px;
                }
                .brand-name {
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                    letter-spacing: 0.01em;
                }
                .brand-name span { font-weight: 300; opacity: 0.85; }

                /* Illustration SVG centrale */
                .illustration {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    padding: 20px 0;
                }

                .left-text {
                    position: relative;
                    z-index: 1;
                }
                .left-title {
                    font-size: 28px;
                    font-weight: 600;
                    color: #fff;
                    line-height: 1.3;
                    margin-bottom: 10px;
                    max-width: 320px;
                }
                .left-sub {
                    font-size: 14px;
                    font-weight: 300;
                    color: rgba(255,255,255,0.6);
                    line-height: 1.6;
                }

                /* ── Panneau droit ── */
                .right {
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 32px;
                }
                .form-box {
                    width: 100%;
                    max-width: 400px;
                    opacity: 0;
                    transform: translateY(12px);
                    transition: opacity 0.5s ease, transform 0.5s ease;
                }
                .form-box.visible { opacity: 1; transform: translateY(0); }

                .form-title {
                    font-size: 28px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 32px;
                }

                .status-ok {
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    border-radius: 8px; padding: 10px 14px;
                    font-size: 13px; color: #15803d; margin-bottom: 20px;
                }

                /* Champs */
                .field { margin-bottom: 16px; }
                .field-input {
                    width: 100%;
                    padding: 13px 16px;
                    font-size: 14px;
                    font-family: 'DM Sans', sans-serif;
                    color: #1e293b;
                    background: #fff;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .field-input::placeholder { color: #94a3b8; }
                .field-input:focus {
                    border-color: #3b4fd8;
                    box-shadow: 0 0 0 3px rgba(59,79,216,0.08);
                }
                .field-input.has-error { border-color: #ef4444; background: #fff8f8; }
                .field-input:disabled { opacity: 0.6; }
                .pw-wrap { position: relative; }
                .pw-wrap .field-input { padding-right: 44px; }
                .pw-toggle {
                    position: absolute; right: 13px; top: 50%;
                    transform: translateY(-50%);
                    background: none; border: none; cursor: pointer;
                    color: #94a3b8; padding: 4px;
                    transition: color 0.2s;
                }
                .pw-toggle:hover { color: #475569; }
                .field-error {
                    display: flex; align-items: center; gap: 4px;
                    font-size: 12px; color: #ef4444; margin-top: 5px;
                }

                /* Ligne remember + forgot */
                .remember-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                    margin-top: 4px;
                }
                .remember-label {
                    display: flex; align-items: center; gap: 8px;
                    cursor: pointer; font-size: 13px; color: #64748b;
                    user-select: none;
                }
                .checkbox {
                    width: 16px; height: 16px;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 4px; background: #fff;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; transition: all 0.15s;
                }
                .checkbox.checked {
                    background: #3b4fd8; border-color: #3b4fd8;
                }
                .forgot-link {
                    font-size: 13px; color: #64748b;
                    text-decoration: none; transition: color 0.2s;
                }
                .forgot-link:hover { color: #3b4fd8; }

                /* Bouton login */
                .btn-login {
                    width: 100%;
                    padding: 13px;
                    background: #1e3a8a;
                    color: #fff;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: background 0.2s, box-shadow 0.2s;
                    margin-bottom: 12px;
                    letter-spacing: 0.01em;
                }
                .btn-login:hover:not(:disabled) {
                    background: #1e40af;
                    box-shadow: 0 4px 16px rgba(30,58,138,0.3);
                }
                .btn-login:disabled { opacity: 0.65; cursor: not-allowed; }

                /* Séparateur OAuth */
                .divider {
                    display: flex; align-items: center; gap: 12px;
                    margin: 16px 0;
                }
                .divider-line { flex: 1; height: 1px; background: #e2e8f0; }
                .divider-text { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }

                /* Boutons OAuth */
                .btn-oauth {
                    width: 100%;
                    padding: 11px 16px;
                    background: #fff;
                    color: #475569;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    margin-bottom: 8px;
                }
                .btn-oauth:last-child { margin-bottom: 0; }
                .btn-oauth:hover:not(:disabled) {
                    border-color: #cbd5e1;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                }
                .btn-oauth:disabled { opacity: 0.5; cursor: not-allowed; }

                /* Footer */
                .form-footer {
                    margin-top: 28px;
                    text-align: center;
                    font-size: 12px;
                    color: #94a3b8;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .root { grid-template-columns: 1fr; }
                    .left { display: none; }
                }
            `}</style>

            <div className="root">

                {/* ── Panneau gauche ── */}
                <div className="left">
                    <div className="deco-circle-1" />
                    <div className="deco-circle-2" />

                    {/* Logo */}
                    <div className="left-brand">
                        <svg className="brand-icon" viewBox="0 0 36 36" fill="none">
                            <rect width="36" height="36" rx="8" fill="rgba(255,255,255,0.12)"/>
                            <path d="M18 8L10 13V20C10 24.4 13.4 28.5 18 30C22.6 28.5 26 24.4 26 20V13L18 8Z"
                                  stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                            <path d="M14 20L17 23L22 17" stroke="white" strokeWidth="1.5"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="brand-name">NSIA <span>TRANSPORT</span></span>
                    </div>

                    {/* Illustration */}
                    <div className="illustration">
                        <svg width="320" height="260" viewBox="0 0 320 260" fill="none">
                            {/* Bureau */}
                            <rect x="60" y="160" width="200" height="10" rx="5" fill="rgba(255,255,255,0.15)"/>
                            <rect x="80" y="170" width="8" height="40" rx="4" fill="rgba(255,255,255,0.1)"/>
                            <rect x="232" y="170" width="8" height="40" rx="4" fill="rgba(255,255,255,0.1)"/>

                            {/* Écran */}
                            <rect x="100" y="80" width="120" height="85" rx="8" fill="rgba(255,255,255,0.18)"/>
                            <rect x="108" y="88" width="104" height="65" rx="4" fill="rgba(255,255,255,0.1)"/>

                            {/* Contenu écran — lignes */}
                            <rect x="116" y="96" width="50" height="4" rx="2" fill="rgba(255,255,255,0.4)"/>
                            <rect x="116" y="106" width="70" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
                            <rect x="116" y="114" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
                            <rect x="116" y="122" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>

                            {/* Pied écran */}
                            <rect x="152" y="165" width="16" height="6" rx="3" fill="rgba(255,255,255,0.12)"/>
                            <rect x="140" y="171" width="40" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>

                            {/* Personnage — corps */}
                            <ellipse cx="220" cy="185" rx="18" ry="10" fill="rgba(255,255,255,0.08)"/>
                            <rect x="210" y="145" width="20" height="42" rx="10" fill="rgba(255,255,255,0.2)"/>
                            {/* Tête */}
                            <circle cx="220" cy="135" r="14" fill="rgba(255,255,255,0.25)"/>
                            {/* Bras vers l'écran */}
                            <path d="M210 160 Q180 150 165 140" stroke="rgba(255,255,255,0.2)" strokeWidth="8" strokeLinecap="round"/>

                            {/* Plante déco */}
                            <rect x="68" y="145" width="8" height="18" rx="4" fill="rgba(255,255,255,0.12)"/>
                            <ellipse cx="72" cy="140" rx="10" ry="8" fill="rgba(255,255,255,0.15)"/>
                            <ellipse cx="66" cy="144" rx="7" ry="5" fill="rgba(255,255,255,0.12)"/>
                            <ellipse cx="78" cy="144" rx="7" ry="5" fill="rgba(255,255,255,0.12)"/>

                            {/* Points déco */}
                            <circle cx="260" cy="60" r="3" fill="rgba(255,255,255,0.2)"/>
                            <circle cx="275" cy="75" r="2" fill="rgba(255,255,255,0.15)"/>
                            <circle cx="55"  cy="100" r="2" fill="rgba(255,255,255,0.15)"/>
                            <circle cx="45"  cy="120" r="3" fill="rgba(255,255,255,0.1)"/>
                        </svg>
                    </div>

                    {/* Texte bas */}
                    <div className="left-text">
                        <h2 className='text-white text-3xl font-bold mb-4'>
                            Quelques clics pour accéder<br/> à votre espace.
                        </h2>
                        <p className="left-sub">
                            Gérez l'émission et la validation des certificats de
                            transport pour les 12 filiales du Pôle Assurances.
                        </p>
                    </div>
                </div>

                {/* ── Panneau droit ── */}
                <div className="right">
                    <div className={`form-box ${mounted ? 'visible' : ''}`}>

                        <h1 className="form-title">Sign In</h1>

                        {status && <div className="status-ok">{status}</div>}

                        <form onSubmit={submit}>

                            {/* Email */}
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

                            {/* Mot de passe */}
                            <div className="field">
                                <div className="pw-wrap">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        placeholder="Mot de passe"
                                        disabled={processing}
                                        className={`field-input${errors.password ? ' has-error' : ''}`}
                                    />
                                    <button type="button" className="pw-toggle"
                                            onClick={() => setShowPassword(s => !s)}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="field-error">
                                        <AlertCircle size={12} /> {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember + Forgot */}
                            <div className="remember-row">
                                <label className="remember-label"
                                       onClick={() => setData('remember', !data.remember)}>
                                    <div className={`checkbox${data.remember ? ' checked' : ''}`}>
                                        {data.remember && (
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white"
                                                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        )}
                                    </div>
                                    Se souvenir de moi
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')} className="forgot-link">
                                        Mot de passe oublié?
                                    </Link>
                                )}
                            </div>

                            {/* Bouton login */}
                            <button type="submit" disabled={processing} className="btn-login">
                                {processing
                                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Connexion…</>
                                    : 'Login'
                                }
                            </button>
                        </form>

                        {/* OAuth */}
                        <div className="divider">
                            <div className="divider-line" />
                            <span className="divider-text">ou</span>
                            <div className="divider-line" />
                        </div>

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

                        <div className="form-footer">
                            © {new Date().getFullYear()} NSIA Holding Assurances — Confidentiel
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}