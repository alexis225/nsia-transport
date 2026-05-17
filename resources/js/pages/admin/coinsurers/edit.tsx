import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { CoinsurersForm } from './create';
import type { BreadcrumbItem } from '@/types';

interface Tenant { id: string; name: string; code: string; }
interface Coinsurer {
    id: string; name: string;
    country_code: string | null;
    share_rate: string | null;
    is_active: boolean;
    tenant_id: string;
    tenant: Tenant | null;
}
interface Props {
    coinsurer: Coinsurer;
    tenants:   Tenant[];
}

export default function CoinsurersEdit({ coinsurer, tenants }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Coassureurs', href: '/admin/coinsurers' },
        { title: coinsurer.name, href: route('admin.coinsurers.show', { coinsurer: coinsurer.id }) },
        { title: 'Modifier' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name:         coinsurer.name,
        country_code: coinsurer.country_code ?? '',
        share_rate:   coinsurer.share_rate ?? '',
        is_active:    coinsurer.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.coinsurers.update', { coinsurer: coinsurer.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${coinsurer.name} — NSIA Transport`}/>
            <CoinsurersForm
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                tenants={tenants}
                submitLabel="Enregistrer les modifications"
                heroTitle={`Modifier : ${coinsurer.name}`}
                heroSub="Mettez à jour les informations du coassureur"
            />
        </AppLayout>
    );
}
