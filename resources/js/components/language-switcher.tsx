import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { changeLocale, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { update as updateLocale } from '@/routes/locale';

interface Props {
    /** `icon` pour la barre de navigation, `full` pour la page de profil. */
    variant?: 'icon' | 'full';
    className?: string;
}

/**
 * Selecteur de langue.
 *
 * Le changement passe par le serveur (PATCH /locale) plutot que par un simple
 * i18n.changeLanguage() cote client : la langue doit aussi s'appliquer aux
 * e-mails, aux PDF et aux messages de validation, qui sont rendus par Laravel.
 * On bascule i18next immediatement des la reponse du serveur (sans attendre
 * un evenement de navigation Inertia, qui peut ne pas se declencher quand
 * l'URL de retour est identique a la page courante).
 */
export default function LanguageSwitcher({ variant = 'icon', className }: Props) {
    const { t, i18n } = useTranslation();
    const { locale, locales } = usePage<{ locale: Locale; locales: Record<Locale, string> }>().props;

    const select = (next: string) => {
        if (next === locale) {
            return;
        }

        router.patch(updateLocale().url, { locale: next }, {
            preserveScroll: true,
            onSuccess: () => {
                document.documentElement.lang = next;
                void changeLocale(i18n, next as Locale);
            },
        });
    };

    return (
        <Select value={locale} onValueChange={select}>
            <SelectTrigger
                size={variant === 'icon' ? 'sm' : 'default'}
                className={cn('h-auto px-5 py-2.5 font-semibold', className)}
                aria-label={t('language.change')}
            >
                <SelectValue>{locales[locale] ?? locale}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
                {(Object.entries(locales) as [Locale, string][]).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                        {label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
