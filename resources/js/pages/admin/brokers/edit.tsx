import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BrokerForm } from './create';
import type { BreadcrumbItem } from '@/types';

interface Broker {
    id: string; name: string; code: string;
    type: 'courtier_local' | 'partenaire_etranger';
    agreement_number: string | null; email: string | null;
    phone: string | null; phone_secondary: string | null;
    address: string | null; city: string | null; country_code: string;
    is_active: boolean; tenant_id: string;
}
interface Tenant { id: string; name: string; code: string; }
interface Props { broker: Broker; tenants: Tenant[]; }

export default function BrokerEdit({ broker, tenants }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Courtiers', href: '/admin/brokers' },
        { title: broker.name },
        { title: 'Modifier' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name:             broker.name,
        code:             broker.code,
        type:             broker.type,
        registration_number: broker.registration_number ?? '',
        email:            broker.email ?? '',
        phone:            broker.phone ?? '',
        phone_secondary:  broker.phone_secondary ?? '',
        address:          broker.address ?? '',
        city:             broker.city ?? '',
        country_code:     broker.country_code ?? 'CI',
        is_active:        broker.is_active,
        tenant_id:        broker.tenant_id,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.brokers.update', { broker: broker.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${broker.name} — NSIA Transport`}/>
            <BrokerForm
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                tenants={tenants}
                submitLabel="Enregistrer les modifications"
                heroTitle={`Modifier ${broker.name}`}
                heroSub={`Code : ${broker.code} · ${broker.type.replace(/_/g,' ')}`}
            />
        </AppLayout>
    );
}