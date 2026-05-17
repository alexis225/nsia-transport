import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ExpertForm } from './create';
import type { BreadcrumbItem } from '@/types';

interface Tenant { id: string; name: string; code: string; }
interface Expert {
    id: string; name: string;
    email: string | null; phone: string | null;
    country_code: string | null;
    is_active: boolean;
    tenant_id: string;
    tenant: Tenant | null;
}
interface Props {
    expert:  Expert;
    tenants: Tenant[];
}

export default function ExpertsEdit({ expert, tenants }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Experts', href: '/admin/experts' },
        { title: expert.name, href: route('admin.experts.show', { expert: expert.id }) },
        { title: 'Modifier' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name:         expert.name,
        email:        expert.email ?? '',
        phone:        expert.phone ?? '',
        country_code: expert.country_code ?? '',
        is_active:    expert.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.experts.update', { expert: expert.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${expert.name} — NSIA Transport`}/>
            <ExpertForm
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                tenants={tenants}
                submitLabel="Enregistrer les modifications"
                heroTitle={`Modifier : ${expert.name}`}
                heroSub="Mettez à jour les informations de l'expert"
            />
        </AppLayout>
    );
}
