import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { route as ziggyRoute } from 'ziggy-js';
import '../css/app.css';
import I18nProvider from '@/components/i18n-provider';
import { initializeTheme } from '@/hooks/use-appearance';
import { createI18n, FALLBACK_LOCALE } from '@/lib/i18n';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ── Rendre route() disponible globalement ────────────────────
// Ziggy injecte les routes via @routes dans le layout Blade.
// window.Ziggy est peuplé par cette directive.
declare global {
    function route(
        name: string,
        params?: object | undefined,
        absolute?: boolean,
    ): string;
    const Ziggy: object;
}

(window as any).route = (name: string, params?: object, absolute?: boolean) =>
    (ziggyRoute as any)(name, params, absolute, (window as any).Ziggy);

// ─────────────────────────────────────────────────────────────

// La langue est celle rendue par Blade dans <html lang> (issue de
// SetLocale) : on charge son catalogue avant le premier rendu pour eviter
// un flash de libelles non traduits.
const initialLocale =
    document.documentElement.lang?.slice(0, 2) || FALLBACK_LOCALE;

void createI18n(initialLocale).then((i18n) =>
    createInertiaApp({
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            ),
        setup({ el, App, props }) {
            const root = createRoot(el);
            root.render(
                <StrictMode>
                    <I18nProvider i18n={i18n}>
                        <App {...props} />
                    </I18nProvider>
                </StrictMode>,
            );
        },
        progress: {
            color: '#4B5563',
        },
    }),
);

initializeTheme();
