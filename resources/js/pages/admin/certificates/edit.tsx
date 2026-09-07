import { Head, useForm } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { CertificateForm, COVERAGE_LABELS, emptyItem } from './create';
import type { ExpeditionItem } from './create';

interface ExpeditionItemRaw {
    marks: string | null;
    package_count: number | null;
    weight: string | null;
    nature: string;
    packaging: string | null;
    insured_value: number | string;
}
interface Certificate {
    id: string;
    certificate_number: string;
    status: string;
    contract_id: string;
    insured_name: string;
    insured_ref: string | null;
    voyage_date: string;
    voyage_from: string;
    voyage_to: string;
    voyage_via: string | null;
    origin_country_code: string | null;
    destination_country_code: string | null;
    transport_type: string | null;
    vessel_name: string | null;
    flight_number: string | null;
    voyage_mode: string | null;
    expedition_items: ExpeditionItemRaw[];
    insured_value: string;
    insured_value_letters: string | null;
    guarantee_mode: string | null;
    exchange_currency: string | null;
    exchange_rate: string | null;
    rate_divers: string | null;
    rate_surprime: string | null;
    rejection_reason: string | null;
    contract: { coverage_type: string | null } | null;
}
interface Props {
    certificate: Certificate;
    contracts: any[];
    countries: any[];
    currencies: any[];
}

export default function CertificateEdit({
    certificate,
    contracts,
    countries,
    currencies,
}: Props) {
    const { t } = useTranslation('certificates');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('shared.breadcrumb'), href: '/admin/certificates' },
        {
            title: certificate.certificate_number,
            href: `/admin/certificates/${certificate.id}`,
        },
        { title: t('create.editBreadcrumb') },
    ];

    const { data, setData, put, processing, errors } = useForm({
        contract_id: certificate.contract_id,
        insured_name: certificate.insured_name,
        insured_ref: certificate.insured_ref ?? '',
        voyage_date: certificate.voyage_date?.slice(0, 10) ?? '',
        voyage_from: certificate.voyage_from ?? '',
        voyage_to: certificate.voyage_to ?? '',
        voyage_via: certificate.voyage_via ?? '',
        origin_country_code: certificate.origin_country_code ?? '',
        destination_country_code: certificate.destination_country_code ?? '',
        transport_type: certificate.transport_type ?? 'SEA',
        vessel_name: certificate.vessel_name ?? '',
        flight_number: certificate.flight_number ?? '',
        voyage_mode: certificate.voyage_mode ?? '',
        expedition_items: (certificate.expedition_items?.length
            ? certificate.expedition_items
            : [null]
        ).map(
            (item): ExpeditionItem =>
                item
                    ? {
                          marks: item.marks ?? '',
                          package_count:
                              item.package_count != null
                                  ? String(item.package_count)
                                  : '',
                          weight: item.weight ?? '',
                          nature: item.nature ?? '',
                          packaging: item.packaging ?? '',
                          insured_value:
                              item.insured_value != null
                                  ? String(item.insured_value)
                                  : '',
                      }
                    : emptyItem(),
        ),
        insured_value: certificate.insured_value ?? '',
        insured_value_letters: certificate.insured_value_letters ?? '',
        guarantee_mode:
            certificate.guarantee_mode ??
            COVERAGE_LABELS[certificate.contract?.coverage_type ?? ''] ??
            '',
        exchange_currency: certificate.exchange_currency ?? '',
        exchange_rate: certificate.exchange_rate ?? '',
        rate_divers: certificate.rate_divers ?? '',
        rate_surprime: certificate.rate_surprime ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(
            route('admin.certificates.update', { certificate: certificate.id }),
        );
    };

    const rejectionBanner = certificate.status === 'REJECTED' &&
        certificate.rejection_reason && (
            <div
                style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 9,
                    padding: '12px 16px',
                    fontSize: 12,
                    color: '#dc2626',
                    display: 'flex',
                    gap: 8,
                }}
            >
                <AlertCircle
                    size={15}
                    style={{ flexShrink: 0, marginTop: 1 }}
                />
                <div>
                    <strong>{t('create.rejectedBanner.title')}</strong>{' '}
                    {certificate.rejection_reason}
                    <div style={{ marginTop: 2, color: '#991b1b' }}>
                        {t('create.rejectedBanner.hint')}
                    </div>
                </div>
            </div>
        );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={t('create.editTitle', {
                    number: certificate.certificate_number,
                })}
            />
            <CertificateForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={submit}
                isEditing
                contracts={contracts}
                countries={countries}
                currencies={currencies}
                heroTitle={t('create.editHeroTitle', {
                    number: certificate.certificate_number,
                })}
                heroSub={t('create.editHeroSub')}
                submitLabel={t('create.editSubmitLabel')}
                banner={rejectionBanner}
            />
        </AppLayout>
    );
}
