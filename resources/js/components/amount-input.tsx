import { useRef  } from 'react';
import type {ChangeEvent} from 'react';
import { Input } from '@/components/ui/input';

// Formate un montant brut ("10000000.5", séparateur décimal '.') en
// affichage FR avec espaces comme séparateurs de milliers ("10 000 000,5").
function formatAmount(raw: string): string {
    if (!raw) {
        return '';
    }

    const [intPart, decPart] = raw.split('.');
    const grouped = (intPart ?? '').replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return decPart !== undefined ? `${grouped},${decPart.replace(/\D/g, '')}` : grouped;
}

// Retire les séparateurs de saisie pour ne garder que la valeur numérique
// brute (point comme séparateur décimal — format attendu par le backend).
function unformatAmount(formatted: string): string {
    const cleaned  = formatted.replace(/[^\d,]/g, '');
    const [intPart, ...decParts] = cleaned.split(',');

    return decParts.length > 0 ? `${intPart}.${decParts.join('')}` : intPart;
}

interface AmountInputProps {
    value: string;
    onChange: (raw: string) => void;
    className?: string;
    placeholder?: string;
    id?: string;
    // 'default' rend le composant Input (shadcn) — pour les formulaires
    // standards. 'plain' rend un <input> nu — pour les cellules de tableau
    // au style déjà défini par une classe CSS custom (ex: "exp-input").
    variant?: 'default' | 'plain';
}

// Champ montant avec séparateurs de milliers en cours de saisie. La valeur
// transmise à `onChange` reste une chaîne numérique brute (ex: "10000000").
export function AmountInput({ value, onChange, className, placeholder, id, variant = 'default' }: AmountInputProps) {
    const ref = useRef<HTMLInputElement>(null);
    const displayValue = formatAmount(value);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const input      = e.target;
        const cursor     = input.selectionStart ?? input.value.length;
        const prevLength = input.value.length;
        const raw        = unformatAmount(input.value);

        onChange(raw);

        requestAnimationFrame(() => {
            if (!ref.current) {
                return;
            }

            const newLength = formatAmount(raw).length;
            const newPos    = Math.max(0, cursor + (newLength - prevLength));

            ref.current.setSelectionRange(newPos, newPos);
        });
    };

    if (variant === 'plain') {
        return (
            <input
                ref={ref}
                id={id}
                type="text"
                inputMode="decimal"
                className={className}
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
            />
        );
    }

    return (
        <Input
            ref={ref}
            id={id}
            type="text"
            inputMode="decimal"
            className={className}
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
        />
    );
}
