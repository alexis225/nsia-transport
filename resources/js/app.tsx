import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { route as ziggyRoute } from 'ziggy-js';
import '../css/app.css';
import { initializeTheme } from '@/hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ── Rendre route() disponible globalement ────────────────────
// Ziggy injecte les routes via @routes dans le layout Blade.
// window.Ziggy est peuplé par cette directive.
declare global {
    function route(name: string, params?: object | undefined, absolute?: boolean): string;
    const Ziggy: object;
}

(window as any).route = (name: string, params?: object, absolute?: boolean) =>
    ziggyRoute(name, params, absolute, (window as any).Ziggy);

// ─────────────────────────────────────────────────────────────

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
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
