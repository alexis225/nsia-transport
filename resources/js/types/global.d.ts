import type { Auth } from '@/types/auth';
import type { Locale } from '@/lib/i18n';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            /** Langue resolue par le middleware SetLocale. */
            locale: Locale;
            /** Catalogue code => libelle pour le selecteur de langue. */
            locales: Record<Locale, string>;
            [key: string]: unknown;
        };
    }
}
