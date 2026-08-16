import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { ContractForm } from './create';

interface Contract {
    id: string; contract_number: string; tenant_id: string;
    broker_id: string | null; subscriber_id: string | null; type: string;
    subscriber_name: string | null; subscriber_address: string | null;
    subscriber_email: string | null; subscriber_phone: string | null;
    insured_name: string; insured_address: string | null;
    insured_email: string | null; insured_phone: string | null;
    currency_code: string;
    plein: string | null; escalade_enabled: boolean; escalade_threshold_pct: string | null;
    deductible: string;
    rate_ro: string | null; rate_rg: string | null; accessories_amount: string | null;
    coverage_type: string | null; clauses: string[]; exclusions: string[];
    incoterm_code: string | null; transport_mode_id: number | null;
    conditioning_types: string[] | null; covered_countries: string[];
    effective_date: string; expiry_date: string; notice_period_days: number;
    requires_approval: boolean; certificates_limit: number | null; notes: string | null;
    coinsurers: { id: string; name: string; pivot: { share_rate: string } }[];
    experts: { id: string; name: string }[];
}
interface Props {
    contract:       Contract;
    tenants:        any[];
    brokers:        any[];
    coinsurers:     any[];
    experts:        any[];
    subscribers:    any[];
    incoterms:      any[];
    transportModes: any[];
    currencies:     string[];
    commissionRate: string | null;
}

export default function ContractEdit({ contract, tenants, brokers, coinsurers, experts, subscribers, incoterms, transportModes, currencies, commissionRate }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Contrats', href: '/admin/contracts' },
        { title: contract.contract_number },
        { title: 'Modifier' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        tenant_id:              contract.tenant_id,
        broker_id:              contract.broker_id ?? '',
        commission_rate:        commissionRate ?? '',
        coinsurers:             (contract.coinsurers ?? []).map(c => ({ coinsurer_id: c.id, share_rate: c.pivot.share_rate })),
        expert_ids:             (contract.experts ?? []).map(ex => ex.id),
        subscriber_id:          contract.subscriber_id ?? '',
        subscriber_name:        contract.subscriber_name ?? '',
        subscriber_address:     contract.subscriber_address ?? '',
        subscriber_email:       contract.subscriber_email ?? '',
        subscriber_phone:       contract.subscriber_phone ?? '',
        type:                   contract.type,
        insured_name:           contract.insured_name,
        insured_address:        contract.insured_address ?? '',
        insured_email:          contract.insured_email ?? '',
        insured_phone:          contract.insured_phone ?? '',
        currency_code:          contract.currency_code,
        plein:                  contract.plein ?? '',
        escalade_enabled:       contract.escalade_enabled ?? true,
        escalade_threshold_pct: contract.escalade_threshold_pct ?? '',
        deductible:             contract.deductible ?? '0',
        rate_ro:                contract.rate_ro ?? '',
        rate_rg:                contract.rate_rg ?? '',
        accessories_amount:     contract.accessories_amount ?? '',
        coverage_type:          contract.coverage_type ?? '',
        clauses:                contract.clauses ?? [],
        exclusions:             contract.exclusions ?? [],
        incoterm_code:          contract.incoterm_code ?? '',
        transport_mode_id:      contract.transport_mode_id ? String(contract.transport_mode_id) : '',
        conditioning_types:     contract.conditioning_types ?? [],
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
                tenants={tenants} brokers={brokers} coinsurers={coinsurers} experts={experts} subscribers={subscribers}
                incoterms={incoterms} transportModes={transportModes}
                currencies={currencies}
                heroTitle={`Modifier — ${contract.contract_number}`}
                heroSub="Modification du contrat d'assurance transport"
                submitLabel="Enregistrer les modifications"
            />
        </AppLayout>
    );
}