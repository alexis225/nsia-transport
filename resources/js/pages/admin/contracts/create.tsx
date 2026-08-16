import { Head, useForm } from '@inertiajs/react';
import { FileText, Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { AmountInput } from '@/components/amount-input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Tenant        { id: string; name: string; code: string; currency_code: string; }
interface Broker        { id: string; name: string; code: string; type: string; commission_rate: string | null; }
interface CoinsurerOption { id: string; name: string; }
interface Incoterm      { code: string; name: string; }
interface TransportMode { id: number; code: string; name_fr: string; }
interface Subscriber    { id: string; first_name: string; last_name: string; }

interface Props {
    tenants:         Tenant[];
    brokers:         Broker[];
    coinsurers:      CoinsurerOption[];
    subscribers:     Subscriber[];
    incoterms:       Incoterm[];
    transportModes:  TransportMode[];
    currencies:      string[];
    defaultTenantId: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contrats', href: '/admin/contracts' },
    { title: 'Nouveau contrat' },
];

export default function ContractCreate({ tenants, brokers, coinsurers, subscribers, incoterms, transportModes, currencies, defaultTenantId }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        tenant_id:              defaultTenantId ?? '',
        broker_id:              '',
        commission_rate:        '',
        coinsurers:             [] as { coinsurer_id: string; share_rate: string }[],
        subscriber_id:          '',
        type:                   'OPEN_POLICY',
        insured_name:           '',
        insured_address:        '',
        insured_email:          '',
        insured_phone:          '',
        currency_code:          'XOF',
        subscription_limit:     '',
        treaty_limit:           '',
        plein:                  '',
        escalade_enabled:       true,
        escalade_threshold_pct: '',
        premium_rate:           '',
        deductible:             '0',
        rate_ro:                '',
        rate_rg:                '',
        rate_divers:            '',
        rate_surprime:          '',
        rate_accessories:       '',
        coverage_type:          'TOUS_RISQUES',
        clauses:                [] as string[],
        exclusions:             [] as string[],
        incoterm_code:          '',
        transport_mode_id:      '',
        transport_mode_detail:  '',
        covered_countries:      [] as string[],
        effective_date:         new Date().toISOString().slice(0,10),
        expiry_date:            '',
        notice_period_days:     60,
        requires_approval:      false,
        certificates_limit:     '',
        notes:                  '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.contracts.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau contrat — NSIA Transport"/>
            <ContractForm
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                tenants={tenants} brokers={brokers} coinsurers={coinsurers} subscribers={subscribers}
                incoterms={incoterms} transportModes={transportModes}
                currencies={currencies}
                heroTitle="Nouveau contrat d'assurance transport"
                heroSub="Créez une police d'assurance pour un assuré"
                submitLabel="Créer le contrat"
            />
        </AppLayout>
    );
}

function Toggle({ data, setData, field, label, hint }: any) {
    return (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, cursor:'pointer' }}
             onClick={() => setData(field, !data[field])}>
            <div style={{ width:36, height:20, borderRadius:10, background: data[field] ? '#1e3a8a' : '#e2e8f0', position:'relative', transition:'background .2s', flexShrink:0 }}>
                <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: data[field] ? 19 : 3, transition:'left .2s' }}/>
            </div>
            <div>
                <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{label}</div>
                {hint && <div style={{ fontSize:11, color:'#94a3b8' }}>{hint}</div>}
            </div>
        </div>
    );
}

function TagList({ data, setData, field, input, setInput, placeholder }: any) {
    const addToList = () => {
        if (!input.trim()) {
            return;
        }

        setData(field, [...(data[field] ?? []), input.trim()]);
        setInput('');
    };

    const removeFromList = (index: number) => {
        setData(field, (data[field] ?? []).filter((_: any, i: number) => i !== index));
    };

    return (
        <div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                {(data[field] ?? []).map((item: string, i: number) => (
                    <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, fontSize:11, color:'#1d4ed8' }}>
                        {item}
                        <button type="button" onClick={() => removeFromList(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:0, display:'flex' }}><X size={10}/></button>
                    </span>
                ))}
            </div>
            <div style={{ display:'flex', gap:6 }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                       onKeyDown={e => {
                           if (e.key === 'Enter') {
                               e.preventDefault();
                               addToList();
                           }
                       }}
                       placeholder={placeholder}
                       style={{ flex:1, padding:'8px 12px', fontSize:12, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, outline:'none' }}/>
                <button type="button" onClick={addToList}
                        style={{ padding:'8px 12px', background:'#1e3a8a', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:12, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                    <Plus size={12}/> Ajouter
                </button>
            </div>
        </div>
    );
}

// ── Formulaire partagé ────────────────────────────────────────
export function ContractForm({ data, setData, errors, processing, onSubmit,
    tenants, brokers, coinsurers, subscribers, incoterms, transportModes, currencies,
    heroTitle, heroSub, submitLabel }: any) {

    const [clauseInput, setClauseInput]       = useState('');
    const [exclusionInput, setExclusionInput] = useState('');

    const selectedBroker = brokers?.find((b: Broker) => b.id === data.broker_id);

    const contractCoinsurers: { coinsurer_id: string; share_rate: string }[] = data.coinsurers ?? [];
    const selectedCoinsurerIds = new Set(contractCoinsurers.map(c => c.coinsurer_id));
    const availableCoinsurers = (coinsurers ?? []).filter((c: CoinsurerOption) => !selectedCoinsurerIds.has(c.id));
    const totalShareRate = contractCoinsurers.reduce((sum, c) => sum + (parseFloat(c.share_rate) || 0), 0);

    const addCoinsurerRow = () => {
        if (!availableCoinsurers.length) return;
        setData('coinsurers', [...contractCoinsurers, { coinsurer_id: availableCoinsurers[0].id, share_rate: '' }]);
    };
    const updateCoinsurerRow = (i: number, field: 'coinsurer_id' | 'share_rate', value: string) => {
        const rows = [...contractCoinsurers];
        rows[i] = { ...rows[i], [field]: value };
        setData('coinsurers', rows);
    };
    const removeCoinsurerRow = (i: number) => {
        setData('coinsurers', contractCoinsurers.filter((_, idx) => idx !== i));
    };

    return (
        <>
            <style>{`
                .cf-wrap{width:100%;max-width:900px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .cf-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .cf-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .cf-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;}
                .cf-hero-info{position:relative;z-index:1;}
                .cf-hero-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .cf-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .cf-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .cf-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .cf-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .cf-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .cf-card-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .form-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
                .cf-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .cf-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .cf-textarea{width:100%;padding:10px 13px;font-size:13px;font-family:inherit;color:#1e293b;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;resize:vertical;box-sizing:border-box;}
                .rate-group{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="cf-wrap">

                    <div className="cf-hero">
                        <div className="cf-hero-ico"><FileText size={22} color="rgba(255,255,255,0.8)"/></div>
                        <div className="cf-hero-info">
                            <div className="cf-hero-title">{heroTitle}</div>
                            <div className="cf-hero-sub">{heroSub}</div>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                        {/* ── Identification ── */}
                        <div className="cf-card">
                            <div className="cf-card-hdr">
                                <div className="cf-card-ttl">Identification</div>
                            </div>
                            <div className="cf-card-body">
                                <div className="form-grid">
                                    {tenants?.length > 0 && (
                                        <div className="grid gap-2">
                                            <Label className="cf-label">Filiale *</Label>
                                            <select className="cf-select" value={data.tenant_id} onChange={e => {
                                                const tenantId = e.target.value;
                                                setData('tenant_id', tenantId);
                                                const tenant = tenants.find((t: Tenant) => t.id === tenantId);
                                                if (tenant) setData('currency_code', tenant.currency_code);
                                            }}>
                                                <option value="">Sélectionnez une filiale</option>
                                                {tenants.map((t: Tenant) => <option key={t.id} value={t.id}>{t.name} ({t.code}) — {t.currency_code}</option>)}
                                            </select>
                                            <InputError message={errors.tenant_id}/>
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Type de contrat *</Label>
                                        <select className="cf-select" value={data.type} onChange={e => setData('type', e.target.value)}>
                                            <option value="OPEN_POLICY">Police ouverte (plusieurs voyages)</option>
                                            <option value="VOYAGE">Au voyage (unique)</option>
                                            <option value="ANNUAL_VOYAGE">Annuel voyages</option>
                                            <option value="TIERS_CHARGEUR">Police tiers chargeur (plusieurs voyages)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Courtier (optionnel)</Label>
                                        <select className="cf-select" value={data.broker_id ?? ''} onChange={e => setData('broker_id', e.target.value)}>
                                            <option value="">Sans courtier</option>
                                            {brokers?.map((b: Broker) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Souscripteur (optionnel)</Label>
                                        <select className="cf-select" value={data.subscriber_id ?? ''} onChange={e => setData('subscriber_id', e.target.value)}>
                                            <option value="">Non assigné</option>
                                            {subscribers?.map((s: Subscriber) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {data.broker_id && (
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Commission courtier pour ce contrat — % (optionnel)</Label>
                                        <Input className="h-11" type="number" step="0.01" min={0} max={100}
                                               value={data.commission_rate ?? ''} onChange={e => setData('commission_rate', e.target.value)}
                                               placeholder="Laisser vide = taux général du courtier"/>
                                        <InputError message={errors.commission_rate}/>
                                        <p style={{ fontSize:11, color:'#94a3b8' }}>
                                            Commission standard de {selectedBroker?.name ?? 'ce courtier'} : {selectedBroker?.commission_rate ?? '—'}%.
                                            Si renseigné ci-dessus, ce taux remplace le taux standard pour ce contrat uniquement.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Coassureurs ── */}
                        <div className="cf-card">
                            <div className="cf-card-hdr">
                                <div className="cf-card-ttl">Coassureurs (optionnel)</div>
                                <div className="cf-card-sub">Part de coassurance propre à ce contrat — un même coassureur peut avoir un taux différent sur un autre contrat</div>
                            </div>
                            <div className="cf-card-body">
                                {contractCoinsurers.length > 0 && (
                                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                        {contractCoinsurers.map((row, i) => {
                                            const rowOptions = (coinsurers ?? []).filter((c: CoinsurerOption) =>
                                                c.id === row.coinsurer_id || !selectedCoinsurerIds.has(c.id));

                                            return (
                                                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                                                    <select className="cf-select" style={{ flex:2 }} value={row.coinsurer_id}
                                                            onChange={e => updateCoinsurerRow(i, 'coinsurer_id', e.target.value)}>
                                                        {rowOptions.map((c: CoinsurerOption) => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <div style={{ flex:1 }}>
                                                        <Input className="h-11" type="number" step="0.01" min={0.01} max={100}
                                                               value={row.share_rate}
                                                               onChange={e => updateCoinsurerRow(i, 'share_rate', e.target.value)}
                                                               placeholder="Part %"/>
                                                        <InputError message={errors[`coinsurers.${i}.share_rate`]}/>
                                                    </div>
                                                    <button type="button" onClick={() => removeCoinsurerRow(i)}
                                                            style={{ width:44, height:44, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', flexShrink:0 }}>
                                                        <X size={14}/>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <p style={{ fontSize:11, color: totalShareRate > 100 ? '#dc2626' : '#94a3b8' }}>
                                            Total des parts : {totalShareRate.toFixed(2)}%
                                            {totalShareRate > 100 && ' — dépasse 100%'}
                                        </p>
                                    </div>
                                )}
                                <button type="button" onClick={addCoinsurerRow} disabled={!availableCoinsurers.length}
                                        style={{ padding:'8px 14px', background:'#f8fafc', border:'1.5px dashed #cbd5e1', borderRadius:8, cursor: availableCoinsurers.length ? 'pointer' : 'not-allowed', opacity: availableCoinsurers.length ? 1 : 0.5, fontSize:12, color:'#475569', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit', marginTop: contractCoinsurers.length ? 10 : 0 }}>
                                    <Plus size={12}/> Ajouter un coassureur
                                </button>
                                {!coinsurers?.length && (
                                    <p style={{ fontSize:11, color:'#94a3b8', marginTop:8 }}>
                                        Aucun coassureur créé pour cette filiale — créez-en un depuis le module Coassureurs.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Assuré ── */}
                        <div className="cf-card">
                            <div className="cf-card-hdr">
                                <div className="cf-card-ttl">Assuré</div>
                            </div>
                            <div className="cf-card-body">
                                <div className="grid gap-2">
                                    <Label className="cf-label">Nom / Raison sociale *</Label>
                                    <Input className="h-11" value={data.insured_name} onChange={e => setData('insured_name', e.target.value)} placeholder="Nom de l'assuré"/>
                                    <InputError message={errors.insured_name}/>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Email</Label>
                                        <Input className="h-11" type="email" value={data.insured_email ?? ''} onChange={e => setData('insured_email', e.target.value)}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Téléphone</Label>
                                        <Input className="h-11" value={data.insured_phone ?? ''} onChange={e => setData('insured_phone', e.target.value)}/>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="cf-label">Adresse</Label>
                                    <textarea className="cf-textarea" rows={2} value={data.insured_address ?? ''} onChange={e => setData('insured_address', e.target.value)}/>
                                </div>
                            </div>
                        </div>

                        {/* ── Période ── */}
                        <div className="cf-card">
                            <div className="cf-card-hdr">
                                <div className="cf-card-ttl">Période de validité</div>
                            </div>
                            <div className="cf-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Date d'effet *</Label>
                                        <Input className="h-11" type="date" value={data.effective_date} onChange={e => setData('effective_date', e.target.value)}/>
                                        <InputError message={errors.effective_date}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Date d'expiration *</Label>
                                        <Input className="h-11" type="date" value={data.expiry_date ?? ''} onChange={e => setData('expiry_date', e.target.value)}/>
                                        <InputError message={errors.expiry_date}/>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="cf-label">Délai de préavis (jours)</Label>
                                    <Input className="h-11" type="number" min={0} max={365} value={data.notice_period_days} onChange={e => setData('notice_period_days', Number(e.target.value))}/>
                                </div>
                            </div>
                        </div>

                        {/* ── Garanties ── */}
                        <div className="cf-card">
                            <div className="cf-card-hdr">
                                <div className="cf-card-ttl">Garanties & Couverture</div>
                            </div>
                            <div className="cf-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Type de couverture</Label>
                                        <select className="cf-select" value={data.coverage_type ?? ''} onChange={e => setData('coverage_type', e.target.value)}>
                                            <option value="">Non spécifié</option>
                                            <option value="TOUS_RISQUES">Tous risques</option>
                                            <option value="FAP_SAUF">FAP sauf</option>
                                            <option value="FAP_ABSOLUE">FAP absolue</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Incoterm</Label>
                                        <select className="cf-select" value={data.incoterm_code ?? ''} onChange={e => setData('incoterm_code', e.target.value)}>
                                            <option value="">Tous</option>
                                            {incoterms?.map((i: Incoterm) => <option key={i.code} value={i.code}>{i.code} — {i.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Mode de transport</Label>
                                        <select className="cf-select" value={data.transport_mode_id ?? ''} onChange={e => setData('transport_mode_id', e.target.value)}>
                                            <option value="">Tous modes</option>
                                            {transportModes?.map((m: TransportMode) => <option key={m.id} value={m.id}>{m.name_fr}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Précision transport</Label>
                                        <Input className="h-11" value={data.transport_mode_detail ?? ''} onChange={e => setData('transport_mode_detail', e.target.value)} placeholder="ex: Conteneur frigorifique"/>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="cf-label">Clauses</Label>
                                    <TagList data={data} setData={setData} field="clauses" input={clauseInput} setInput={setClauseInput} placeholder="ex: Clause grève, Clause guerre…"/>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="cf-label">Exclusions</Label>
                                    <TagList data={data} setData={setData} field="exclusions" input={exclusionInput} setInput={setExclusionInput} placeholder="ex: Vice propre, Défaut d'emballage…"/>
                                </div>
                            </div>
                        </div>

                        {/* ── Conditions financières ── */}
                        <div className="cf-card">
                            <div className="cf-card-hdr">
                                <div className="cf-card-ttl">Conditions financières</div>
                            </div>
                            <div className="cf-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Devise</Label>
                                        <Input className="h-11" value={data.currency_code} readOnly disabled
                                               style={{ background:'#f8fafc', fontFamily:'monospace', fontWeight:600 }}/>
                                        <p style={{ fontSize:11, color:'#94a3b8' }}>
                                            Devise du pays de la filiale — tous les montants du contrat et de ses certificats y sont exprimés.
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Plafond NN300</Label>
                                        <AmountInput className="h-11" value={data.subscription_limit ?? ''} onChange={v => setData('subscription_limit', v)} placeholder="2 000 000 000 par défaut"/>
                                        <p style={{ fontSize:11, color:'#94a3b8' }}>
                                            Au-delà de 2 Mds FCFA (seuil standard groupe), le contrat requiert une validation DTAG avant activation.
                                        </p>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Plafond ou limite Traité</Label>
                                        <AmountInput className="h-11" value={data.treaty_limit ?? ''} onChange={v => setData('treaty_limit', v)} placeholder="6 000 000 000 par défaut"/>
                                        <p style={{ fontSize:11, color:'#94a3b8' }}>
                                            Au-delà, alerte pour placement en réassurance facultative.
                                        </p>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Taux prime global (%)</Label>
                                        <Input className="h-11" type="number" step="0.00001" min={0} value={data.premium_rate ?? ''} onChange={e => setData('premium_rate', e.target.value)}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Franchise</Label>
                                        <AmountInput className="h-11" value={data.deductible ?? '0'} onChange={v => setData('deductible', v)}/>
                                    </div>
                                </div>
                                <div>
                                    <Label className="cf-label" style={{ display:'block', marginBottom:8 }}>Taux détaillés (%)</Label>
                                    <div className="rate-group">
                                        {[
                                            { field:'rate_ro',          label:'R.O.' },
                                            { field:'rate_rg',          label:'R.G.' },
                                            { field:'rate_divers',      label:'Divers' },
                                            { field:'rate_surprime',    label:'Surprime' },
                                            { field:'rate_accessories', label:'Access.' },
                                        ].map(({ field, label }) => (
                                            <div key={field} className="grid gap-1">
                                                <label style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>{label}</label>
                                                <Input className="h-9" type="number" step="0.0001" min={0}
                                                       value={(data as any)[field] ?? ''}
                                                       onChange={e => setData(field as any, e.target.value)}
                                                       placeholder="0"/>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
                                        La taxe n'est plus saisie ici — elle est calculée automatiquement à l'émission depuis le référentiel de taxes (Taxes &gt; Référentiel), selon le mode de transport et le pays de destination du certificat.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="cf-label">Limite de certificats</Label>
                                    <Input className="h-11" type="number" min={1} value={data.certificates_limit ?? ''} onChange={e => setData('certificates_limit', e.target.value)} placeholder="Illimité si vide"/>
                                </div>
                            </div>
                        </div>

                        {/* ── Paramètres métiers & Escalade ── */}
                        <div className="cf-card">
                            <div className="cf-card-hdr">
                                <div className="cf-card-ttl">Paramètres métiers & Escalade</div>
                                <div className="cf-card-sub">Plafond par certificat et déclenchement automatique de la validation NN300</div>
                            </div>
                            <div className="cf-card-body">
                                <div className="grid gap-2">
                                    <Label className="cf-label">Plein du contrat</Label>
                                    <AmountInput className="h-11" value={data.plein ?? ''} onChange={v => setData('plein', v)} placeholder="Plafond max assurable par certificat"/>
                                    <InputError message={errors.plein}/>
                                </div>
                                <Toggle data={data} setData={setData} field="escalade_enabled" label="Escalade automatique activée"
                                        hint="Déclenche une validation NN300 si la valeur assurée dépasse le seuil ci-dessous"/>
                                {data.escalade_enabled && (
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Seuil d'escalade (%)</Label>
                                        <Input className="h-11" type="number" step="0.01" min={0} max={100} value={data.escalade_threshold_pct ?? ''} onChange={e => setData('escalade_threshold_pct', e.target.value)} placeholder="15% par défaut"/>
                                        <InputError message={errors.escalade_threshold_pct}/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Options & Notes ── */}
                        <div className="cf-card">
                            <div className="cf-card-hdr">
                                <div className="cf-card-ttl">Options & Notes</div>
                            </div>
                            <div className="cf-card-body">
                                <Toggle data={data} setData={setData} field="requires_approval" label="Approbation requise"
                                        hint="Le contrat devra être approuvé par un superviseur avant activation"/>
                                <div className="grid gap-2">
                                    <Label className="cf-label">Notes internes</Label>
                                    <textarea className="cf-textarea" rows={3} value={data.notes ?? ''} onChange={e => setData('notes', e.target.value)} placeholder="Observations, conditions particulières…"/>
                                </div>
                            </div>
                        </div>

                        <div style={{ display:'flex', gap:8 }}>
                            <Button type="submit" disabled={processing} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                {processing ? 'Enregistrement…' : <><Check size={14}/> {submitLabel}</>}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>Annuler</Button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}