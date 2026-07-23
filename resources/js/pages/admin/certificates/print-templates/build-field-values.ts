import { fmt, fmtDate, fmtRate } from './types';
import type { CertificateForPrint } from './types';

// Calcule, pour un certificat donné, la valeur texte de chaque champ
// imprimable — partagé par tous les modèles de souche (chaque pays ne
// définit que les COORDONNÉES, jamais la logique d'extraction des
// valeurs, pour éviter toute divergence entre pays sur le contenu).
export function buildFieldValues(cert: CertificateForPrint): Record<string, string> {
    const contract = cert.contract;
    const settings = cert.tenant?.settings ?? {};
    const primes = cert.prime_breakdown ?? [];
    const primeRow = (key: string) => primes.find(p => p.key === key) ?? null;
    const item = cert.expedition_items?.[0];
    const transportType = cert.transport_type ?? '';

    const row = (key: string) => {
        const line = primeRow(key);

        return {
            rate: line ? fmtRate(line.rate) : '',
            amount: line ? fmt(line.amount, cert.currency_code) : '',
        };
    };

    const ro = row('ro');
    const rg = row('rg');
    const surprime = row('surprime');
    const divers = row('divers');
    const primeNette = row('prime_nette');

    return {
        certificate_number: cert.certificate_number ?? '',
        policy_number: cert.policy_number ?? '',
        issue_place: settings?.city ?? '',
        issue_date: fmtDate(cert.issued_at ?? cert.created_at),
        insured_name: cert.insured_name ?? '',
        insured_address: contract?.insured_address ?? '',
        insured_ref: cert.insured_ref ?? '',
        voyage_date: fmtDate(cert.voyage_date),
        voyage_from: cert.voyage_from ?? '',
        voyage_to: cert.voyage_to ?? '',
        voyage_via: cert.voyage_via ?? '',
        transport_air: transportType === 'AIR' ? 'X' : '',
        flight_number: cert.flight_number ?? '',
        transport_sea: transportType === 'SEA' ? 'X' : '',
        vessel_name: cert.vessel_name ?? '',
        transport_road: transportType === 'ROAD' ? 'X' : '',
        voyage_mode: cert.voyage_mode ?? '',
        marks: item?.marks ?? '',
        package_numbers: item?.package_numbers ?? '',
        package_count: item?.package_count != null ? String(item.package_count) : '',
        weight: item?.weight ?? '',
        nature: item?.nature ?? '',
        packaging: item?.packaging ?? '',
        insured_value: fmt(cert.insured_value, cert.currency_code),
        insured_value_letters: cert.insured_value_letters ?? '',
        guarantee_mode: cert.guarantee_mode ?? contract?.coverage_type ?? '',
        rate_ro: ro.rate, amount_ro: ro.amount,
        rate_rg: rg.rate, amount_rg: rg.amount,
        rate_surprime: surprime.rate, amount_surprime: surprime.amount,
        rate_divers: divers.rate, amount_divers: divers.amount,
        rate_prime_nette: primeNette.rate, amount_prime_nette: primeNette.amount,
        prime_total: fmt(cert.prime_total, cert.currency_code),
        currency_code: cert.currency_code ?? '',
        issued_by: cert.issued_by ? `${cert.issued_by.first_name} ${cert.issued_by.last_name}` : '',
    };
}
