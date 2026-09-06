import { router } from '@inertiajs/react';
import { type i18n as I18nInstance } from 'i18next';
import { type ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { changeLocale, isSupportedLocale } from '@/lib/i18n';

interface Props {
    i18n: I18nInstance;
    children: ReactNode;
}

/**
 * Branche l'instance i18next sur l'arbre React et la garde alignee sur la
 * langue decidee par le serveur.
 *
 * Le provider enveloppe <App /> : il est donc HORS du contexte Inertia et ne
 * peut pas lire la prop `locale` via usePage(). On s'abonne a la place a
 * l'evenement `navigate` du routeur, qui expose la page fraichement rendue.
 *
 * Le selecteur de langue envoie un PATCH /locale puis revient sur la page :
 * la prop Inertia `locale` change, et cet abonnement recharge les catalogues
 * avant de basculer i18next. Le serveur reste ainsi la seule source de verite
 * sur la langue active, y compris apres un retour arriere navigateur.
 */
export default function I18nProvider({ i18n, children }: Props) {
    useEffect(
        () =>
            router.on('navigate', (event) => {
                const locale = event.detail.page.props.locale;

                if (isSupportedLocale(locale) && locale !== i18n.language) {
                    void changeLocale(i18n, locale);
                }
            }),
        [i18n],
    );

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
