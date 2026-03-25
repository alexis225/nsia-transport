import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ContractForm } from './create';
import type { BreadcrumbItem } from '@/types';

interface Contract {
    id: string; contract_number: string; tenant_id: string;
    broker_id: string | null; type: string;
    insured_name: string; insured_address: string | null;
    insured_email: string | null; insured_phone: string | null;
    currency_code: string; subscription_limit: string | null;
    premium_rate: string | null; deductible: string;
    rate_ro: string | null; rate_rg: string | null;
    rate_surprime: string | null; rate_accessories: string | null; rate_tax: string | null;
    coverage_type: string | null; clauses: string[]; exclusions: string[];
    incoterm_code: string | null; transport_mode_id: number | null;
    transport_mode_detail: string | null; covered_countries: string[];
    effective_date: string; expiry_date: string; notice_period_days: number;
    requires_approval: boolean; certificates_limit: number | null; notes: string | null;
}
interface Props {
    contract:       Contract;
    tenants:        any[];
    brokers:        any[];
    incoterms:      any[];
    transportModes: any[];
    currencies:     string[];
}

export default function ContractEdit({ contract, tenants, brokers, incoterms, transportModes, currencies }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Contrats', href: '/admin/contracts' },
        { title: contract.contract_number },
        { title: 'Modifier' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        tenant_id:              contract.tenant_id,
        broker_id:              contract.broker_id ?? '',
        type:                   contract.type,
        insured_name:           contract.insured_name,
        insured_address:        contract.insured_address ?? '',
        insured_email:          contract.insured_email ?? '',
        insured_phone:          contract.insured_phone ?? '',
        currency_code:          contract.currency_code,
        subscription_limit:     contract.subscription_limit ?? '',
        premium_rate:           contract.premium_rate ?? '',
        deductible:             contract.deductible ?? '0',
        rate_ro:                contract.rate_ro ?? '',
        rate_rg:                contract.rate_rg ?? '',
        rate_surprime:          contract.rate_surprime ?? '',
        rate_accessories:       contract.rate_accessories ?? '',
        rate_tax:               contract.rate_tax ?? '',
        coverage_type:          contract.coverage_type ?? '',
        clauses:                contract.clauses ?? [],
        exclusions:             contract.exclusions ?? [],
        incoterm_code:          contract.incoterm_code ?? '',
        transport_mode_id:      contract.transport_mode_id ? String(contract.transport_mode_id) : '',
        transport_mode_detail:  contract.transport_mode_detail ?? '',
        covered_countries:      contract.covered_countries ?? [],
        effective_date:         contract.effective_date,
        expiry_date:            contract.expiry_date,
        notice_period_days:     contract.notice_period_days,
        requires_approval:      contract.requires_approval,
        certificates_limit:     contract.certificates_limit ? String(contract.certificates_limit) : '',
        notes:                  contract.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.contracts.update', { contract: contract.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${contract.contract_number} — NSIA Transport`}/>
            <ContractForm
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                tenants={tenants} brokers={brokers}
                incoterms={incoterms} transportModes={transportModes}
                currencies={currencies}
                heroTitle={`Modifier — ${contract.contract_number}`}
                heroSub="Modification du contrat d'assurance transport"
                submitLabel="Enregistrer les modifications"
            />
        </AppLayout>
    );
}