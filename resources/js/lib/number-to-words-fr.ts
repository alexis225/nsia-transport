// ============================================================
// Conversion nombre → lettres (français) — montant assuré
// ============================================================
// Règles classiques : "cent"/"vingt" ne prennent un 's' que
// lorsqu'ils terminent le nombre (rien ne suit) ; "mille" est
// invariable ; "et" apparaît devant "un"/"onze" pour les
// dizaines 20 à 70.
// ============================================================

const UNITS = [
    'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
    'dix-sept', 'dix-huit', 'dix-neuf',
];

const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

// allowFinalS : ce groupe de deux chiffres termine-t-il le nombre
// entier (rien après) ? Seul ce cas autorise "quatre-vingts" au
// pluriel — sinon "quatre-vingt" (ex. "quatre-vingt mille").
function twoDigits(n: number, allowFinalS: boolean): string {
    if (n < 20) {
        return UNITS[n];
    }

    const tens = Math.floor(n / 10);
    const unit = n % 10;

    if (tens === 7 || tens === 9) {
        const base = tens === 7 ? 'soixante' : 'quatre-vingt';

        if (tens === 7 && unit === 1) {
            return `${base} et ${UNITS[10 + unit]}`;
        }

        return `${base}-${UNITS[10 + unit]}`;
    }

    if (tens === 8) {
        return unit === 0 ? `quatre-vingt${allowFinalS ? 's' : ''}` : `quatre-vingt-${UNITS[unit]}`;
    }

    if (unit === 0) {
        return TENS[tens];
    }

    if (unit === 1) {
        return `${TENS[tens]} et un`;
    }

    return `${TENS[tens]}-${UNITS[unit]}`;
}

// allowFinalS : le groupe est-il le tout dernier mot du nombre
// (rien après) ? Seul ce cas autorise "cents"/"vingts" au pluriel.
function threeDigits(n: number, allowFinalS: boolean): string {
    if (n === 0) {
        return '';
    }

    const words: string[] = [];
    const h = Math.floor(n / 100);
    const r = n % 100;

    if (h > 0) {
        const takesS = allowFinalS && r === 0 && h > 1;

        words.push(h === 1 ? 'cent' : `${UNITS[h]} cent${takesS ? 's' : ''}`);
    }

    if (r > 0) {
        words.push(twoDigits(r, allowFinalS));
    }

    // "quatre-vingts" perd son 's' s'il est suivi d'un reste (déjà
    // géré par twoDigits qui ne l'ajoute que si unit===0), rien à faire ici.
    return words.join(' ');
}

export function numberToFrenchWords(value: number): string {
    const n = Math.round(Math.abs(value));

    if (n === 0) {
        return 'zéro';
    }

    const scales: Array<[number, string, string]> = [
        [1_000_000_000, 'milliard', 'milliards'],
        [1_000_000, 'million', 'millions'],
        [1_000, 'mille', 'mille'],
    ];

    const parts: string[] = [];
    let remaining = n;

    for (const [scale, singular, plural] of scales) {
        const count = Math.floor(remaining / scale);

        remaining %= scale;

        if (count === 0) {
            continue;
        }

        if (scale === 1_000) {
            parts.push(count === 1 ? 'mille' : `${threeDigits(count, false)} mille`);
        } else {
            parts.push(count === 1 ? `un ${singular}` : `${threeDigits(count, false)} ${plural}`);
        }
    }

    if (remaining > 0) {
        parts.push(threeDigits(remaining, true));
    }

    const words = parts.join(' ');

    return value < 0 ? `moins ${words}` : words;
}

// Libellé (pluriel, minuscule) des devises gérées par l'application —
// cf. database/seeders/ReferentialSeeder.php pour la liste des codes.
const CURRENCY_WORDS_FR: Record<string, string> = {
    XOF: 'francs CFA',
    XAF: 'francs CFA',
    GNF: 'francs guinéens',
    MGA: 'ariary',
    EUR: 'euros',
    USD: 'dollars américains',
    GBP: 'livres sterling',
    CHF: 'francs suisses',
    JPY: 'yens japonais',
    CNY: 'yuans',
    AED: 'dirhams des Émirats',
    MAD: 'dirhams marocains',
    NGN: 'nairas',
    GHS: 'cedis',
    ZAR: 'rands',
    SGD: 'dollars de Singapour',
};

export function amountInWords(value: number, currencyCode: string | null | undefined): string {
    const words    = numberToFrenchWords(value);
    const currency = (currencyCode && CURRENCY_WORDS_FR[currencyCode]) || currencyCode || '';
    const rounded  = Math.round(Math.abs(value));

    // "de" est requis devant la devise seulement quand le nombre
    // se termine exactement sur "million(s)"/"milliard(s)" (rien
    // après) — ex. "deux millions de francs" mais "deux millions
    // cinq cent mille francs" (sans "de").
    const liaison = rounded >= 1_000_000 && rounded % 1_000_000 === 0 ? 'de ' : '';

    const sentence = currency ? `${words} ${liaison}${currency}` : words;

    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
