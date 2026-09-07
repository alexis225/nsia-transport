/**
 * Google reCAPTCHA v3 (invisible) — chargement du script + exécution.
 * Site key publique injectée au build par Vite (VITE_RECAPTCHA_SITE_KEY,
 * miroir de RECAPTCHA_SITE_KEY côté serveur — voir .env et config/services.php).
 *
 * Si la clé n'est pas configurée (dev sans clés reCAPTCHA créées), on
 * retourne simplement `null` : le serveur (App\Http\Middleware\VerifyRecaptcha)
 * ignore aussi la vérification tant que RECAPTCHA_SECRET_KEY est vide.
 */

declare global {
    interface Window {
        grecaptcha?: {
            ready: (callback: () => void) => void;
            execute: (
                siteKey: string,
                options: { action: string },
            ) => Promise<string>;
        };
    }
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

let scriptPromise: Promise<void> | null = null;

function loadScript(siteKey: string): Promise<void> {
    if (window.grecaptcha) {
        return Promise.resolve();
    }

    if (!scriptPromise) {
        scriptPromise = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () =>
                reject(new Error('reCAPTCHA script failed to load'));
            document.head.appendChild(script);
        });
    }

    return scriptPromise;
}

/** Génère un token reCAPTCHA v3 pour l'action donnée, ou `null` si non configuré/indisponible. */
export async function getRecaptchaToken(
    action: string,
): Promise<string | null> {
    if (!SITE_KEY) {
        return null;
    }

    try {
        await loadScript(SITE_KEY);

        return await new Promise<string>((resolve, reject) => {
            window.grecaptcha!.ready(() => {
                window
                    .grecaptcha!.execute(SITE_KEY, { action })
                    .then(resolve)
                    .catch(reject);
            });
        });
    } catch {
        return null;
    }
}

export const isRecaptchaConfigured = Boolean(SITE_KEY);
