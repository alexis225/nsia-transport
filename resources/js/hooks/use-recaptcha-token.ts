import { useEffect, useState } from 'react';
import { getRecaptchaToken } from '@/lib/recaptcha';

// Un token reCAPTCHA v3 est valide ~120s — on le régénère avant expiration
// pour couvrir les formulaires restés ouverts un moment (login, register...).
const REFRESH_INTERVAL_MS = 100_000;

/** Maintient un token reCAPTCHA v3 à jour pour l'action donnée. `null` tant qu'il n'est pas prêt. */
export function useRecaptchaToken(action: string): string | null {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const refresh = () => {
            getRecaptchaToken(action).then((t) => {
                if (!cancelled) {
                    setToken(t);
                }
            });
        };

        refresh();
        const id = setInterval(refresh, REFRESH_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [action]);

    return token;
}
