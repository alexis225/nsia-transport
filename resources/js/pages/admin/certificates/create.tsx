import { Head, useForm } from '@inertiajs/react';
import { Award, Plus, Trash2, Check, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AmountInput } from '@/components/amount-input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { amountInWords } from '@/lib/number-to-words-fr';
import type { BreadcrumbItem } from '@/types';

interface Contract {
    id: string; contract_number: string; insured_name: string;
    insured_address: string | null; insured_email: string | null; insured_phone: string | null;
    currency_code: string; type: string; coverage_type: string | null;
    rate_ro: string | null; rate_rg: string | null;
    accessories_amount: string | null; rate_tax: string | null;
    subscription_limit: string | null; used_limit: string;
    plein: string | null; certificates_limit: number | null; certificates_count: number;
    active_certificates_count: number;
    tenant: { name: string; code: string } | null;
    broker: { name: string; commission_rate: string | null } | null;
    subscriber: { first_name: string; last_name: string } | null;
    transport_mode: { code: string; name_fr: string } | null;
    conditioning_types: string[] | null;
}

export const CONDITIONING_LABELS: Record<string, string> = {
    CONTAINER:      'Container',
    GROUPAGE:       'Groupage',
    CONVENTIONNEL:  'Conventionnel',
    BOUT_EN_BOUT:   'Bout en bout',
    VRAC:           'Vrac',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
    OPEN_POLICY:    'Police ouverte',
    VOYAGE:         'Au voyage',
    ANNUAL_VOYAGE:  'Annuel voyages',
    TIERS_CHARGEUR: 'Police tiers chargeur',
};

export const COVERAGE_LABELS: Record<string, string> = {
    TOUS_RISQUES: 'Tous risques',
    FAP_SAUF:     'FAP sauf',
    FAP_ABSOLUE:  'FAP absolue',
};
interface Country { code: string; name_fr: string; }
interface Currency { code: string; name: string; symbol: string | null; }
interface Props {
    contracts:        Contract[];
    selectedContract: Contract | null;
    defaultTenantId:  string | null;
    countries:        Country[];
    currencies:       Currency[];
}

export type ExpeditionItem = {
    marks: string; package_count: string;
    weight: string; nature: string; packaging: string; insured_value: string;
};

export const emptyItem = (): ExpeditionItem => ({
    marks: '', package_count: '',
    weight: '', nature: '', packaging: '', insured_value: '',
});

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function CertificateCreate({ contracts, selectedContract, defaultTenantId, countries, currencies }: Props) {
    const { t } = useTranslation('certificates');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('shared.breadcrumb'), href: '/admin/certificates' },
        { title: t('create.breadcrumb') },
    ];

    const { data, setData, post, processing, errors } = useForm({
        contract_id:           selectedContract?.id ?? '',
        insured_name:          selectedContract?.insured_name ?? '',
        insured_ref:           '',
        voyage_date:           new Date().toISOString().slice(0, 10),
        voyage_from:           '',
        voyage_to:             '',
        voyage_via:            '',
        origin_country_code:      '',
        destination_country_code: '',
        transport_type:        selectedContract?.transport_mode?.code ?? 'SEA',
        vessel_name:           '',
        flight_number:         '',
        voyage_mode:           selectedContract?.conditioning_types?.[0] ?? '',
        expedition_items:      [emptyItem()] as ExpeditionItem[],
        insured_value:         '',
        insured_value_letters: '',
        guarantee_mode:        COVERAGE_LABELS[selectedContract?.coverage_type ?? ''] ?? '',
        exchange_currency:     '',
        exchange_rate:         '',
        rate_divers:           '',
        rate_surprime:         '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.certificates.store'));
    };

    const saveDraft = (e: React.MouseEvent) => {
        e.preventDefault();
        post(route('admin.certificates.store-draft'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create.title')}/>
            <CertificateForm
                data={data} setData={setData} errors={errors} processing={processing}
                onSubmit={submit} onSaveDraft={saveDraft}
                contracts={contracts} countries={countries} currencies={currencies}
                heroTitle={t('create.heroTitle')} heroSub={t('create.heroSub')}
                submitLabel={t('create.submitLabel')}
            />
        </AppLayout>
    );
}

// ── Formulaire partagé (création + édition) ───────────────────
export function CertificateForm({ data, setData, errors, processing, onSubmit, onSaveDraft,
    contracts, countries, currencies, heroTitle, heroSub, submitLabel, isEditing, banner }: any) {
    const { t } = useTranslation('certificates');
    const { t: tc } = useTranslation('common');

    const [rateStatus, setRateStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [rateMessage, setRateMessage] = useState<string | null>(null);

    const selectedC: Contract | undefined = contracts.find((c: Contract) => c.id === data.contract_id);

    // Un contrat "Au voyage" ne couvre qu'un seul déplacement — la création
    // d'un 2e certificat est aussi bloquée côté serveur (store()). Non
    // pertinent en édition (on modifie le certificat existant, pas un
    // nouveau).
    const isVoyageLocked = !isEditing && selectedC?.type === 'VOYAGE' && selectedC.active_certificates_count > 0;

    // Recalcule la valeur totale depuis les items
    const totalValue = data.expedition_items.reduce((sum: number, item: ExpeditionItem) => {
        return sum + (parseFloat(item.insured_value) || 0);
    }, 0);

    // Nombre total de colis — aucune limite, autant de lignes que nécessaire
    const totalPackages = data.expedition_items.reduce((sum: number, item: ExpeditionItem) => {
        return sum + (parseInt(item.package_count, 10) || 0);
    }, 0);

    // Conversion automatique du montant assuré en toutes lettres
    useEffect(() => {
        setData('insured_value_letters', totalValue > 0 ? amountInWords(totalValue, selectedC?.currency_code) : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalValue, selectedC?.currency_code]);

    const updateItem = (i: number, field: keyof ExpeditionItem, value: string) => {
        const items = [...data.expedition_items];
        items[i] = { ...items[i], [field]: value };
        setData('expedition_items', items);
        // Sync valeur totale
        const total = items.reduce((s: number, it: ExpeditionItem) => s + (parseFloat(it.insured_value) || 0), 0);
        setData('insured_value', String(total));
    };

    const addItem    = () => setData('expedition_items', [...data.expedition_items, emptyItem()]);
    const removeItem = (i: number) => setData('expedition_items', data.expedition_items.filter((_: ExpeditionItem, idx: number) => idx !== i));

    // Taux du jour (devise cotation → devise locale du contrat) —
    // purement indicatif, l'utilisateur peut toujours corriger le champ.
    async function fetchExchangeRate(fromCurrency: string) {
        if (!fromCurrency || !selectedC?.currency_code) return;

        setRateStatus('loading');
        setRateMessage(null);

        try {
            const res = await fetch(`${route('admin.certificates.exchange-rate')}?from=${fromCurrency}&to=${selectedC.currency_code}`, {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                setRateStatus('error');
                setRateMessage(json.message ?? t('create.financial.rateUnavailable'));

                return;
            }

            setData('exchange_rate', String(json.rate));
            setRateStatus('idle');
        } catch {
            setRateStatus('error');
            setRateMessage(t('create.financial.rateUnavailableGeneric'));
        }
    }

    // Aperçu en direct de la prime nette — mêmes taux et même formule que le
    // calcul serveur (CertificateController::buildPrimeBreakdown) : R.O./R.G.
    // viennent du contrat, Divers/Surprime sont saisis sur ce certificat,
    // Accessoires est un montant fixe porté par le contrat (pas un taux). La
    // taxe dépend du référentiel filiale × mode de transport × pays et n'est
    // calculée qu'à l'enregistrement.
    const primeRatePreview = selectedC ? [
        { label: 'R.O.',      rate: parseFloat(selectedC.rate_ro ?? '0') },
        { label: 'R.G.',      rate: parseFloat(selectedC.rate_rg ?? '0') },
        { label: 'Divers',    rate: parseFloat(data.rate_divers || '0') },
        { label: 'Surprime',  rate: parseFloat(data.rate_surprime || '0') },
    ].map(l => ({ ...l, amount: l.rate > 0 ? round2(totalValue * l.rate / 100) : 0 })) : [];

    const accessoiresPreview = round2(parseFloat(selectedC?.accessories_amount ?? '0'));
    const primeNettePreview  = round2(primeRatePreview.reduce((s, l) => s + l.amount, 0));

    return (
        <>
            <style>{`
                .cc-wrap{width:100%;max-width:100%;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .cc-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .cc-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .cc-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;}
                .cc-hero-info{position:relative;z-index:1;}
                .cc-hero-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .cc-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .cc-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .cc-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .cc-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .cc-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .cc-card-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .form-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
                .cc-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .cc-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .cc-select:focus{border-color:#3b82f6;}

                /* Tableau expédition */
                .exp-table{width:100%;border-collapse:collapse;font-size:12px;}
                .exp-table th{padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em;}
                .exp-table td{padding:6px 6px;border:1px solid #e2e8f0;vertical-align:middle;}
                .exp-input{width:100%;padding:6px 8px;font-size:12px;font-family:inherit;color:#1e293b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;outline:none;box-sizing:border-box;}
                .exp-input:focus{border-color:#3b82f6;background:#fff;}

                /* Contract info badge */
                .contract-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:10px 14px;font-size:12px;color:#1d4ed8;}

                /* Total bar */
                .total-bar{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;}
                .total-label{font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.06em;}
                .total-value{font-size:18px;font-weight:700;color:#1e293b;font-family:monospace;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="cc-wrap">

                    <div className="cc-hero">
                        <div className="cc-hero-ico"><Award size={22} color="rgba(255,255,255,0.8)"/></div>
                        <div className="cc-hero-info">
                            <div className="cc-hero-title">{heroTitle}</div>
                            <div className="cc-hero-sub">{heroSub}</div>
                        </div>
                    </div>

                    {banner}

                    <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                        {/* ── Contrat ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">{t('create.contract.title')}</div>
                                <div className="cc-card-sub">{t('create.contract.subtitle')}</div>
                            </div>
                            <div className="cc-card-body">
                                <div className="grid gap-2">
                                    <Label className="cc-label">{t('create.contract.label')}</Label>
                                    <select className="cc-select" value={data.contract_id}
                                            onChange={e => {
                                                const c = contracts.find((c: Contract) => c.id === e.target.value);

                                                setData('contract_id', e.target.value);

                                                if (c) {
                                                    setData('insured_name', c.insured_name);
                                                    setData('guarantee_mode', COVERAGE_LABELS[c.coverage_type ?? ''] ?? '');
                                                    setData('transport_type', c.transport_mode?.code ?? 'SEA');
                                                    setData('voyage_mode', c.conditioning_types?.[0] ?? '');
                                                }
                                            }}>
                                        <option value="">{t('create.contract.placeholder')}</option>
                                        {contracts.map((c: Contract) => (
                                            <option key={c.id} value={c.id}>
                                                {c.contract_number} — {c.insured_name} ({c.tenant?.code})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.contract_id}/>
                                </div>
                                {selectedC && (
                                    <div className="contract-info">
                                        <div style={{ fontWeight:600, marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                                            {selectedC.contract_number}
                                            <span style={{ fontWeight:500, fontSize:11, padding:'2px 8px', borderRadius:20, background:'#dbeafe', color:'#1e3a8a' }}>
                                                {CONTRACT_TYPE_LABELS[selectedC.type] ?? selectedC.type}
                                            </span>
                                        </div>
                                        <div>{t('create.contract.subsidiary', { name: selectedC.tenant?.name, currency: selectedC.currency_code })}</div>
                                        <div style={{ marginTop:3 }}>{t('create.contract.insured', { name: selectedC.insured_name })}</div>
                                        <div style={{ marginTop:3 }}>
                                            {t('create.contract.manager', { name: selectedC.subscriber ? `${selectedC.subscriber.first_name} ${selectedC.subscriber.last_name}` : '—' })}
                                        </div>
                                        {selectedC.insured_address && <div style={{ marginTop:3 }}>{t('create.contract.address', { address: selectedC.insured_address })}</div>}
                                        <div style={{ marginTop:3 }}>
                                            {t('create.contract.contact', { phone: selectedC.insured_phone ?? '—', email: selectedC.insured_email ?? '—' })}
                                        </div>
                                        <div style={{ marginTop:3 }}>
                                            {t('create.contract.commission', { value: selectedC.broker ? `${selectedC.broker.name} (${selectedC.broker.commission_rate ?? 0} %)` : '—' })}
                                        </div>
                                        {selectedC.subscription_limit && (
                                            <div style={{ marginTop:3 }}>
                                                {t('create.contract.limit', { limit: parseFloat(selectedC.subscription_limit).toLocaleString('fr-FR'), currency: selectedC.currency_code, used: parseFloat(selectedC.used_limit).toLocaleString('fr-FR') })}
                                            </div>
                                        )}
                                        <div style={{ marginTop:3 }}>
                                            {t('create.contract.certificatesCount', { count: selectedC.certificates_count })}{selectedC.certificates_limit ? ` / ${selectedC.certificates_limit}` : ''}
                                        </div>
                                        <div style={{ marginTop:3 }}>
                                            {t('create.contract.plein', { value: selectedC.plein ? `${parseFloat(selectedC.plein).toLocaleString('fr-FR')} ${selectedC.currency_code}` : t('create.contract.pleinUndefined') })}
                                        </div>
                                    </div>
                                )}
                                {isVoyageLocked && (
                                    <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'10px 14px', fontSize:12, color:'#dc2626', display:'flex', alignItems:'center', gap:6 }}>
                                        ⚠ {t('create.contract.voyageLocked')}
                                    </div>
                                )}
                                {selectedC?.plein && totalValue > parseFloat(selectedC.plein) && (
                                    <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:9, padding:'10px 14px', fontSize:12, color:'#c2410c', display:'flex', alignItems:'center', gap:6 }}>
                                        ⚠ {t('create.contract.overPlein', {
                                            value: `${totalValue.toLocaleString('fr-FR')} ${selectedC.currency_code}`,
                                            plein: `${parseFloat(selectedC.plein).toLocaleString('fr-FR')} ${selectedC.currency_code}`,
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Assuré ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">{t('create.insuredSection.title')}</div>
                            </div>
                            <div className="cc-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.insuredSection.name')}</Label>
                                        <Input className="h-11" value={data.insured_name}
                                               onChange={e => setData('insured_name', e.target.value)}/>
                                        <InputError message={errors.insured_name}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.insuredSection.ref')}</Label>
                                        <Input className="h-11" value={data.insured_ref ?? ''}
                                               onChange={e => setData('insured_ref', e.target.value)}
                                               placeholder={t('create.insuredSection.refPlaceholder')}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Voyage ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">{t('create.voyage.title')}</div>
                                <div className="cc-card-sub">{t('create.voyage.subtitle')}</div>
                            </div>
                            <div className="cc-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.voyage.startDate')}</Label>
                                        <Input className="h-11" type="date" value={data.voyage_date}
                                               onChange={e => setData('voyage_date', e.target.value)}/>
                                        <InputError message={errors.voyage_date}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.voyage.transportMode')}</Label>
                                        <select className="cc-select" value={data.transport_type ?? ''}
                                                onChange={e => setData('transport_type', e.target.value)}>
                                            <option value="">—</option>
                                            <option value="SEA">{t('shared.transport.SEA')}</option>
                                            <option value="AIR">{t('shared.transport.AIR')}</option>
                                            <option value="ROAD">{t('shared.transport.ROAD')}</option>
                                            <option value="RAIL">{t('shared.transport.RAIL')}</option>
                                            <option value="MULTIMODAL">{t('shared.transport.MULTIMODAL')}</option>
                                            <option value="RIVER">{t('shared.transport.RIVER')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.voyage.from')}</Label>
                                        <Input className="h-11" value={data.voyage_from}
                                               onChange={e => setData('voyage_from', e.target.value)}
                                               placeholder={t('create.voyage.fromPlaceholder')}/>
                                        <InputError message={errors.voyage_from}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.voyage.to')}</Label>
                                        <Input className="h-11" value={data.voyage_to}
                                               onChange={e => setData('voyage_to', e.target.value)}
                                               placeholder={t('create.voyage.toPlaceholder')}/>
                                        <InputError message={errors.voyage_to}/>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.voyage.via')}</Label>
                                        <Input className="h-11" value={data.voyage_via ?? ''}
                                               onChange={e => setData('voyage_via', e.target.value)}
                                               placeholder={t('create.voyage.viaPlaceholder')}/>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.voyage.originCountry')}</Label>
                                        <select className="cc-select" value={data.origin_country_code ?? ''}
                                                onChange={e => setData('origin_country_code', e.target.value)}>
                                            <option value="">—</option>
                                            {countries?.map((c: Country) => <option key={c.code} value={c.code}>{c.name_fr}</option>)}
                                        </select>
                                        <InputError message={errors.origin_country_code}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.voyage.destinationCountry')}</Label>
                                        <select className="cc-select" value={data.destination_country_code ?? ''}
                                                onChange={e => setData('destination_country_code', e.target.value)}>
                                            <option value="">—</option>
                                            {countries?.map((c: Country) => <option key={c.code} value={c.code}>{c.name_fr}</option>)}
                                        </select>
                                        <InputError message={errors.destination_country_code}/>
                                        <p style={{ fontSize:11, color:'#94a3b8' }}>{t('create.voyage.destinationCountryHint')}</p>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    {(data.transport_type === 'SEA' || data.transport_type === 'RIVER' || !data.transport_type) && (
                                        <div className="grid gap-2">
                                            <Label className="cc-label">{t('create.voyage.vessel')}</Label>
                                            <Input className="h-11" value={data.vessel_name ?? ''}
                                                   onChange={e => setData('vessel_name', e.target.value)}
                                                   placeholder={t('create.voyage.vesselPlaceholder')}/>
                                        </div>
                                    )}
                                    {data.transport_type === 'AIR' && (
                                        <div className="grid gap-2">
                                            <Label className="cc-label">{t('create.voyage.flightNumber')}</Label>
                                            <Input className="h-11" value={data.flight_number ?? ''}
                                                   onChange={e => setData('flight_number', e.target.value)}
                                                   placeholder={t('create.voyage.flightNumberPlaceholder')}/>
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.voyage.mode')}</Label>
                                        <select className="cc-select" value={data.voyage_mode ?? ''}
                                                onChange={e => setData('voyage_mode', e.target.value)}>
                                            <option value="">—</option>
                                            {(selectedC?.conditioning_types?.length ? selectedC.conditioning_types : Object.keys(CONDITIONING_LABELS)).map((code: string) => (
                                                <option key={code} value={code}>{CONDITIONING_LABELS[code] ?? code}</option>
                                            ))}
                                        </select>
                                        {!!selectedC?.conditioning_types?.length && (
                                            <p style={{ fontSize:11, color:'#94a3b8' }}>
                                                {t('create.voyage.modeHint')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Détail expédition ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">{t('create.expedition.title')}</div>
                                <div className="cc-card-sub">{t('create.expedition.subtitle')}</div>
                            </div>
                            <div className="cc-card-body">
                                <div style={{ overflowX:'auto' }}>
                                    <table className="exp-table">
                                        <thead>
                                            <tr>
                                                <th>{t('create.expedition.marks')}</th>
                                                <th>{t('create.expedition.count')}</th>
                                                <th>{t('create.expedition.weight')}</th>
                                                <th style={{ minWidth:220 }}>{t('create.expedition.nature')}</th>
                                                <th>{t('create.expedition.packaging')}</th>
                                                <th>{t('create.expedition.value')}</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.expedition_items.map((item: ExpeditionItem, i: number) => (
                                                <tr key={i}>
                                                    <td><input className="exp-input" value={item.marks} onChange={e => updateItem(i, 'marks', e.target.value)} placeholder={t('create.expedition.marksPlaceholder')}/></td>
                                                    <td style={{ width:60 }}><input className="exp-input" type="number" min={0} value={item.package_count} onChange={e => updateItem(i, 'package_count', e.target.value)} placeholder={t('create.expedition.countPlaceholder')}/></td>
                                                    <td style={{ width:80 }}><input className="exp-input" value={item.weight} onChange={e => updateItem(i, 'weight', e.target.value)} placeholder={t('create.expedition.weightPlaceholder')}/></td>
                                                    <td><textarea className="exp-input" rows={3} style={{ resize:'vertical', minHeight:64 }} value={item.nature} onChange={e => updateItem(i, 'nature', e.target.value)} placeholder={t('create.expedition.naturePlaceholder')}/></td>
                                                    <td><input className="exp-input" value={item.packaging} onChange={e => updateItem(i, 'packaging', e.target.value)} placeholder={t('create.expedition.packagingPlaceholder')}/></td>
                                                    <td style={{ width:120 }}><AmountInput variant="plain" className="exp-input" value={item.insured_value} onChange={v => updateItem(i, 'insured_value', v)} placeholder="0"/></td>
                                                    <td style={{ width:36 }}>
                                                        {data.expedition_items.length > 1 && (
                                                            <button type="button" onClick={() => removeItem(i)}
                                                                    style={{ width:28, height:28, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }}>
                                                                <Trash2 size={11}/>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button type="button" onClick={addItem}
                                        style={{ padding:'7px 14px', background:'#f8fafc', border:'1.5px dashed #cbd5e1', borderRadius:8, cursor:'pointer', fontSize:12, color:'#475569', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                                    <Plus size={12}/> {t('create.expedition.addLine')}
                                </button>
                                {errors['expedition_items'] && <p style={{ fontSize:11, color:'#ef4444' }}>⚠ {errors['expedition_items']}</p>}

                                {/* Total */}
                                <div className="total-bar">
                                    <span className="total-label">{t('create.expedition.totalPackages')}</span>
                                    <span className="total-value">{totalPackages.toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="total-bar">
                                    <span className="total-label">{t('create.expedition.totalValue')}</span>
                                    <span className="total-value">
                                        {totalValue.toLocaleString('fr-FR')} {selectedC?.currency_code ?? ''}
                                    </span>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="cc-label">{t('create.expedition.valueLetters')}</Label>
                                    <Input className="h-11" readOnly value={data.insured_value_letters ?? ''}
                                           style={{ background:'#f8fafc', color:'#475569', cursor:'default' }}
                                           placeholder={t('create.expedition.valueLettersPlaceholder')}/>
                                </div>
                            </div>
                        </div>

                        {/* ── Conditions financières ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">{t('create.financial.title')}</div>
                            </div>
                            <div className="cc-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.financial.guaranteeMode')}</Label>
                                        <Input className="h-11" readOnly disabled value={data.guarantee_mode || t('create.financial.guaranteeModeUndefined')}
                                               style={{ background:'#f8fafc', color:'#475569', cursor:'default' }}/>
                                        <p style={{ fontSize:11, color:'#94a3b8' }}>
                                            {t('create.financial.guaranteeModeHint')}
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.financial.quoteCurrency')}</Label>
                                        <select className="cc-select" value={data.exchange_currency ?? ''}
                                                onChange={e => {
                                                    const currency = e.target.value;
                                                    setData('exchange_currency', currency);
                                                    setData('exchange_rate', '');
                                                    if (currency) void fetchExchangeRate(currency);
                                                }}>
                                            <option value="">{t('create.financial.quoteCurrencyNone')}</option>
                                            {currencies?.map((c: Currency) => (
                                                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {data.exchange_currency && (
                                    <div className="grid gap-2">
                                        <Label className="cc-label">
                                            {t('create.financial.rateToday', { from: data.exchange_currency, to: selectedC?.currency_code ?? '—' })}
                                        </Label>
                                        <Input className="h-11" type="number" step="0.000001" min={0}
                                               value={data.exchange_rate ?? ''}
                                               onChange={e => setData('exchange_rate', e.target.value)}
                                               placeholder="ex: 600"/>
                                        {rateStatus === 'loading' && (
                                            <p style={{ fontSize:11, color:'#1d4ed8' }}>{t('create.financial.rateFetching')}</p>
                                        )}
                                        {rateStatus === 'error' && (
                                            <p style={{ fontSize:11, color:'#c2410c' }}>{rateMessage}</p>
                                        )}
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.financial.rateDivers')}</Label>
                                        <Input className="h-11" type="number" step="0.0001" min={0} max={100}
                                               value={data.rate_divers}
                                               onChange={e => setData('rate_divers', e.target.value)}
                                               placeholder="0"/>
                                        <InputError message={errors.rate_divers}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">{t('create.financial.rateSurprime')}</Label>
                                        <Input className="h-11" type="number" step="0.0001" min={0} max={100}
                                               value={data.rate_surprime}
                                               onChange={e => setData('rate_surprime', e.target.value)}
                                               placeholder="0"/>
                                        <InputError message={errors.rate_surprime}/>
                                        <p style={{ fontSize:11, color:'#94a3b8' }}>{t('create.financial.rateSurprimeHint')}</p>
                                    </div>
                                </div>

                                {selectedC && (
                                    <div className="grid gap-2" style={{ marginTop:4 }}>
                                        <Label className="cc-label">{t('create.financial.primePreview.label')}</Label>
                                        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 14px', display:'flex', flexDirection:'column', gap:4 }}>
                                            {primeRatePreview.map(l => (
                                                <div key={l.label} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#475569' }}>
                                                    <span>{l.label} ({l.rate}%)</span>
                                                    <span style={{ fontFamily:'monospace' }}>{l.amount.toLocaleString('fr-FR')} {selectedC.currency_code}</span>
                                                </div>
                                            ))}
                                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:'#1e293b', paddingTop:6, marginTop:2, borderTop:'1px solid #e2e8f0' }}>
                                                <span>{t('create.financial.primePreview.primeNette')}</span>
                                                <span style={{ fontFamily:'monospace' }}>{primeNettePreview.toLocaleString('fr-FR')} {selectedC.currency_code}</span>
                                            </div>
                                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#475569' }}>
                                                <span>{t('create.financial.primePreview.accessories')}</span>
                                                <span style={{ fontFamily:'monospace' }}>{accessoiresPreview.toLocaleString('fr-FR')} {selectedC.currency_code}</span>
                                            </div>
                                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:'#1e293b', paddingTop:6, marginTop:2, borderTop:'1px solid #e2e8f0' }}>
                                                <span>{t('create.financial.primePreview.subtotal')}</span>
                                                <span style={{ fontFamily:'monospace' }}>{(primeNettePreview + accessoiresPreview).toLocaleString('fr-FR')} {selectedC.currency_code}</span>
                                            </div>
                                            <p style={{ fontSize:10.5, color:'#94a3b8', margin:0 }}>
                                                {t('create.financial.primePreview.note')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8 }}>
                            <Button type="submit" disabled={processing || isVoyageLocked}
                                    className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                {processing ? t('create.actions.saving') : <><Check size={14}/> {submitLabel}</>}
                            </Button>
                            {onSaveDraft && (
                                <Button type="button" variant="outline" disabled={processing || isVoyageLocked} onClick={onSaveDraft}
                                        className="h-10 px-5">
                                    <Save size={14}/> {t('create.actions.saveDraft')}
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>{tc('actions.cancel')}</Button>
                        </div>
                        {onSaveDraft && (
                            <p style={{ fontSize:11, color:'#94a3b8', marginTop:-8 }}>
                                {t('create.actions.saveDraftHint')}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
