export interface ExpeditionItem {
    marks: string; package_numbers: string; package_count: number;
    weight: string; nature: string; packaging: string; insured_value: number;
}

export interface PrimeLine {
    key: string; label: string; label_en: string | null;
    rate: number; amount: number;
}

export interface TenantSettings {
    siege_social?: string;
    phone?: string;
    website?: string;
    email?: string;
    capital?: string;
    rccm?: string;
    regulator?: string;
    payment_address?: string;
    surveyor_name?: string;
    surveyor_address?: string;
    city?: string;
}

export interface CertificateTenant {
    id: string; name: string; code: string;
    country_code: string; currency_code: string;
    logo_path: string | null;
    settings: TenantSettings | null;
}

export interface CertificateForPrint {
    id: string;
    certificate_number: string;
    policy_number: string;
    status: string;
    insured_name: string;
    insured_ref: string | null;
    voyage_date: string;
    voyage_from: string;
    voyage_to: string;
    voyage_via: string | null;
    transport_type: string | null;
    vessel_name: string | null;
    flight_number: string | null;
    voyage_mode: string | null;
    expedition_items: ExpeditionItem[];
    currency_code: string;
    insured_value: string;
    insured_value_letters: string | null;
    guarantee_mode: string | null;
    prime_breakdown: PrimeLine[] | null;
    prime_total: string | null;
    exchange_rate: string | null;
    issued_at: string | null;
    created_at: string;
    document_type: string;
    qr_token: string | null;
    tenant: CertificateTenant | null;
    contract: {
        contract_number: string;
        insured_name: string;
        insured_address: string | null;
        coverage_type: string | null;
    } | null;
    template: { name: string; is_bilingual: boolean } | null;
    issued_by: { first_name: string; last_name: string } | null;
}

/* ── Helpers partagés ── */
export function fmt(n: string | number | null, currency = ''): string {
    if (n === null || n === undefined || n === '') return '';
    const val = Number(n);
    if (isNaN(val)) return String(n);
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
        + (currency ? ' ' + currency : '');
}

export function fmtRate(n: number | null): string {
    if (!n) return '';
    return n.toFixed(4).replace(/\.?0+$/, '') + ' %';
}

export function fmtDate(d: string | null): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
