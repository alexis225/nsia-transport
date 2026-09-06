import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { CoinsurersForm } from './create';
import type { BreadcrumbItem } from '@/types';

interface Tenant { id: string; name: string; code: string; }
interface Coinsurer {
    id: string; name: string;
    country_code: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    tenant_id: string;
    tenant: Tenant | null;
}
interface Props {
    coinsurer: Coinsurer;
    tenants:   Tenant[];
}

export default function CoinsurersEdit({ coinsurer, tenants }: Props) {
    const { t } = useTranslation('coinsurers');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('index.breadcrumb'), href: '/admin/coinsurers' },
        { title: coinsurer.name, href: route('admin.coinsurers.show', { coinsurer: coinsurer.id }) },
        { title: t('edit.breadcrumb') },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name:         coinsurer.name,
        country_code: coinsurer.country_code ?? '',
        address:      coinsurer.address ?? '',
        email:        coinsurer.email ?? '',
        phone:        coinsurer.phone ?? '',
        is_active:    coinsurer.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.coinsurers.update', { coinsurer: coinsurer.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('edit.title', { name: coinsurer.name })}/>
            <CoinsurersForm
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                tenants={tenants}
                submitLabel={t('edit.submitLabel')}
                heroTitle={t('edit.heroTitle', { name: coinsurer.name })}
                heroSub={t('edit.heroSub')}
            />
        </AppLayout>
    );
}
