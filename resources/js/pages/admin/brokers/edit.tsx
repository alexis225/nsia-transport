import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { BrokerForm } from './create';

interface Broker {
    id: string;
    name: string;
    code: string;
    type: 'courtier_local' | 'partenaire_etranger';
    registration_number: string | null;
    email: string | null;
    phone: string | null;
    phone_secondary: string | null;
    address: string | null;
    city: string | null;
    country_code: string;
    commission_rate: string | null;
    is_active: boolean;
    tenant_id: string;
    additional_tenant_ids: string[];
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    } | null;
}
interface Tenant {
    id: string;
    name: string;
    code: string;
}
interface EligibleUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}
interface Props {
    broker: Broker;
    tenants: Tenant[];
    allTenants: Tenant[];
    users: EligibleUser[];
}

export default function BrokerEdit({
    broker,
    tenants,
    allTenants,
    users,
}: Props) {
    const { t } = useTranslation('brokers');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('index.breadcrumb'), href: '/admin/brokers' },
        {
            title: broker.name,
            href: route('admin.brokers.show', { broker: broker.id }),
        },
        {
            title: t('edit.breadcrumb'),
            href: route('admin.brokers.edit', { broker: broker.id }),
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: broker.name,
        code: broker.code,
        type: broker.type,
        registration_number: broker.registration_number ?? '',
        email: broker.email ?? '',
        phone: broker.phone ?? '',
        phone_secondary: broker.phone_secondary ?? '',
        address: broker.address ?? '',
        city: broker.city ?? '',
        country_code: broker.country_code ?? 'CI',
        commission_rate: broker.commission_rate ?? '',
        is_active: broker.is_active,
        tenant_id: broker.tenant_id,
        additional_tenant_ids: broker.additional_tenant_ids ?? [],
        user_id: broker.user?.id ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.brokers.update', { broker: broker.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('edit.title', { name: broker.name })} />
            <BrokerForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={submit}
                tenants={tenants}
                allTenants={allTenants}
                users={users}
                submitLabel={t('edit.submitLabel')}
                heroTitle={t('edit.heroTitle', { name: broker.name })}
                heroSub={t('edit.heroSub', {
                    code: broker.code,
                    type: broker.type.replace(/_/g, ' '),
                })}
            />
        </AppLayout>
    );
}
