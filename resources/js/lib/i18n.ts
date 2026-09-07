import i18next from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

// ── i18n de la plateforme ────────────────────────────────────
// Les catalogues vivent dans resources/js/locales/<locale>/<ns>.json et sont
// charges a la demande : seule la langue active (plus le repli francais)
// entre dans le bundle telecharge par le navigateur.
//
// La langue n'est jamais devinee cote client : elle est resolue par le
// middleware App\Http\Middleware\SetLocale (preference utilisateur, puis
// session, puis Accept-Language) et transmise en prop Inertia `locale`.
// Cote Laravel, les memes langues sont declarees dans config('app.supported_locales').

export const FALLBACK_LOCALE = 'fr';

export const SUPPORTED_LOCALES = ['fr', 'en', 'pt'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Ajouter ici tout nouveau fichier de catalogue. */
export const NAMESPACES = [
    'common',
    'navigation',
    'auth',
    'settings',
    'dashboard',
    'certificates',
    'contracts',
    'brokers',
    'coinsurers',
    'experts',
    'users',
    'roles',
    'tenants',
    'delegations',
    'commissions',
    'taxes',
    'reports',
    'auditLogs',
    'security',
    'notifications',
    'exports',
    'reference',
    'adminSettings',
    'approvals',
    'certificateTemplates',
    'public',
] as const;

export const DEFAULT_NAMESPACE = 'common';

type Catalog = Record<string, unknown>;

const catalogs = import.meta.glob<{ default: Catalog }>('../locales/*/*.json');

export function isSupportedLocale(value: unknown): value is Locale {
    return (
        typeof value === 'string' &&
        (SUPPORTED_LOCALES as readonly string[]).includes(value)
    );
}

/**
 * Charge les catalogues d'une langue et les injecte dans l'instance.
 * Un namespace absent est ignore : le repli i18next prend le relais, ce qui
 * permet de livrer une traduction incomplete sans casser la page.
 */
async function loadCatalogs(
    instance: I18nInstance,
    locale: Locale,
): Promise<void> {
    await Promise.all(
        NAMESPACES.map(async (namespace) => {
            const path = `../locales/${locale}/${namespace}.json`;
            const loader = catalogs[path];

            if (!loader) {
                return;
            }

            const module = await loader();
            instance.addResourceBundle(
                locale,
                namespace,
                module.default,
                true,
                true,
            );
        }),
    );
}

/** Bascule l'instance sur une autre langue, en chargeant ses catalogues au besoin. */
export async function changeLocale(
    instance: I18nInstance,
    locale: Locale,
): Promise<void> {
    if (instance.language === locale) {
        return;
    }

    await loadCatalogs(instance, locale);
    await instance.changeLanguage(locale);
}

/**
 * Cree une instance i18next isolee. On n'utilise pas le singleton i18next afin
 * que le serveur SSR puisse traiter des requetes de langues differentes sans
 * que l'une n'ecrase la langue de l'autre.
 */
export async function createI18n(locale: string): Promise<I18nInstance> {
    const resolved: Locale = isSupportedLocale(locale)
        ? locale
        : FALLBACK_LOCALE;
    const instance = i18next.createInstance();

    await instance.use(initReactI18next).init({
        lng: resolved,
        fallbackLng: FALLBACK_LOCALE,
        ns: [...NAMESPACES],
        defaultNS: DEFAULT_NAMESPACE,
        resources: {},
        interpolation: {
            // React echappe deja les valeurs interpolees.
            escapeValue: false,
        },
        returnNull: false,
    });

    await loadCatalogs(instance, resolved);

    if (resolved !== FALLBACK_LOCALE) {
        await loadCatalogs(instance, FALLBACK_LOCALE);
    }

    return instance;
}
