import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import I18nProvider from '@/components/i18n-provider';
import { createI18n, FALLBACK_LOCALE } from '@/lib/i18n';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer(async (page) => {
    // Une instance i18next par requete : deux requetes de langues differentes
    // ne doivent pas se marcher dessus dans le processus SSR.
    const i18n = await createI18n(
        typeof page.props.locale === 'string'
            ? page.props.locale
            : FALLBACK_LOCALE,
    );

    return createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            ),
        setup: ({ App, props }) => (
            <I18nProvider i18n={i18n}>
                <App {...props} />
            </I18nProvider>
        ),
    });
});
