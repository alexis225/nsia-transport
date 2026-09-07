import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { ExpertForm } from './create';

interface Tenant {
    id: string;
    name: string;
    code: string;
}
interface Expert {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    country_code: string | null;
    is_active: boolean;
    tenant_id: string;
    tenant: Tenant | null;
}
interface Props {
    expert: Expert;
    tenants: Tenant[];
}

export default function ExpertsEdit({ expert, tenants }: Props) {
    const { t } = useTranslation('experts');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('index.breadcrumb'), href: '/admin/experts' },
        {
            title: expert.name,
            href: route('admin.experts.show', { expert: expert.id }),
        },
        { title: t('edit.breadcrumb') },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: expert.name,
        email: expert.email ?? '',
        phone: expert.phone ?? '',
        country_code: expert.country_code ?? '',
        is_active: expert.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.experts.update', { expert: expert.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('edit.title', { name: expert.name })} />
            <ExpertForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={submit}
                tenants={tenants}
                submitLabel={t('edit.submitLabel')}
                heroTitle={t('edit.heroTitle', { name: expert.name })}
                heroSub={t('edit.heroSub')}
            />
        </AppLayout>
    );
}
