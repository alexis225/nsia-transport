import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { FileText, Check, Plus, X } from 'lucide-react';
import { useState } from 'react';

interface Tenant        { id: string; name: string; code: string; currency_code: string; }
interface Broker        { id: string; name: string; code: string; type: string; }
interface Incoterm      { code: string; name: string; }
interface TransportMode { id: number; code: string; name_fr: string; }

interface Props {
    tenants:         Tenant[];
    brokers:         Broker[];
    incoterms:       Incoterm[];
    transportModes:  TransportMode[];
    currencies:      string[];
    defaultTenantId: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contrats', href: '/admin/contracts' },
    { title: 'Nouveau contrat' },
];

export default function ContractCreate({ tenants, brokers, incoterms, transportModes, currencies, defaultTenantId }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        tenant_id:              defaultTenantId ?? '',
        broker_id:              '',
        type:                   'OPEN_POLICY',
        insured_name:           '',
        insured_address:        '',
        insured_email:          '',
        insured_phone:          '',
        currency_code:          'XOF',
        subscription_limit:     '',
        premium_rate:           '',
        deductible:             '0',
        rate_ro:                '',
        rate_rg:                '',
        rate_surprime:          '',
        rate_accessories:       '',
        rate_tax:               '',
        coverage_type:          'TOUS_RISQUES',
        clauses:                [] as string[],
        exclusions:             [] as string[],
        incoterm_code:          '',
        transport_mode_id:      '',
        transport_mode_detail:  '',
        covered_countries:      [] as string[],
        effective_date:         new Date().toISOString().slice(0,10),
        expiry_date:            '',
        notice_period_days:     30,
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
                tenants={tenants} brokers={brokers}
                incoterms={incoterms} transportModes={transportModes}
                currencies={currencies}
                heroTitle="Nouveau contrat d'assurance transport"
                heroSub="Créez une police d'assurance pour un assuré"
                submitLabel="Créer le contrat"
            />
        </AppLayout>
    );
}

// ── Formulaire partagé ────────────────────────────────────────
export function ContractForm({ data, setData, errors, processing, onSubmit,
    tenants, brokers, incoterms, transportModes, currencies,
    heroTitle, heroSub, submitLabel }: any) {

    const [clauseInput, setClauseInput]       = useState('');
    const [exclusionInput, setExclusionInput] = useState('');

    const addToList = (field: string, value: string, setter: (v: string) => void) => {
        if (!value.trim()) return;
        setData(field, [...(data[field] ?? []), value.trim()]);
        setter('');
    };

    const removeFromList = (field: string, index: number) => {
        setData(field, (data[field] ?? []).filter((_: any, i: number) => i !== index));
    };

    const Toggle = ({ field, label, hint }: any) => (
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

    const TagList = ({ field, input, setInput, placeholder }: any) => (
        <div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                {(data[field] ?? []).map((item: string, i: number) => (
                    <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, fontSize:11, color:'#1d4ed8' }}>
                        {item}
                        <button type="button" onClick={() => removeFromList(field, i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:0, display:'flex' }}><X size={10}/></button>
                    </span>
                ))}
            </div>
            <div style={{ display:'flex', gap:6 }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList(field, input, setInput); }}}
                       placeholder={placeholder}
                       style={{ flex:1, padding:'8px 12px', fontSize:12, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, outline:'none' }}/>
                <button type="button" onClick={() => addToList(field, input, setInput)}
                        style={{ padding:'8px 12px', background:'#1e3a8a', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:12, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                    <Plus size={12}/> Ajouter
                </button>
            </div>
        </div>
    );

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
                                            <select className="cf-select" value={data.tenant_id} onChange={e => setData('tenant_id', e.target.value)}>
                                                <option value="">Sélectionnez une filiale</option>
                                                {tenants.map((t: Tenant) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
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
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="cf-label">Courtier (optionnel)</Label>
                                    <select className="cf-select" value={data.broker_id ?? ''} onChange={e => setData('broker_id', e.target.value)}>
                                        <option value="">Sans courtier</option>
                                        {brokers?.map((b: Broker) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                                    </select>
                                </div>
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
                                    <TagList field="clauses" input={clauseInput} setInput={setClauseInput} placeholder="ex: Clause grève, Clause guerre…"/>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="cf-label">Exclusions</Label>
                                    <TagList field="exclusions" input={exclusionInput} setInput={setExclusionInput} placeholder="ex: Vice propre, Défaut d'emballage…"/>
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
                                        <Label className="cf-label">Devise *</Label>
                                        <select className="cf-select" value={data.currency_code} onChange={e => setData('currency_code', e.target.value)}>
                                            {currencies?.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Plafond NN300</Label>
                                        <Input className="h-11" type="number" min={0} value={data.subscription_limit ?? ''} onChange={e => setData('subscription_limit', e.target.value)} placeholder="Illimité si vide"/>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Taux prime global (%)</Label>
                                        <Input className="h-11" type="number" step="0.00001" min={0} value={data.premium_rate ?? ''} onChange={e => setData('premium_rate', e.target.value)}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cf-label">Franchise</Label>
                                        <Input className="h-11" type="number" min={0} value={data.deductible ?? '0'} onChange={e => setData('deductible', e.target.value)}/>
                                    </div>
                                </div>
                                <div>
                                    <Label className="cf-label" style={{ display:'block', marginBottom:8 }}>Taux détaillés (%)</Label>
                                    <div className="rate-group">
                                        {[
                                            { field:'rate_ro',          label:'R.O.' },
                                            { field:'rate_rg',          label:'R.G.' },
                                            { field:'rate_surprime',    label:'Surprime' },
                                            { field:'rate_accessories', label:'Access.' },
                                            { field:'rate_tax',         label:'Taxe' },
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
                                </div>
                                <div className="grid gap-2">
                                    <Label className="cf-label">Limite de certificats</Label>
                                    <Input className="h-11" type="number" min={1} value={data.certificates_limit ?? ''} onChange={e => setData('certificates_limit', e.target.value)} placeholder="Illimité si vide"/>
                                </div>
                            </div>
                        </div>

                        {/* ── Options & Notes ── */}
                        <div className="cf-card">
                            <div className="cf-card-hdr">
                                <div className="cf-card-ttl">Options & Notes</div>
                            </div>
                            <div className="cf-card-body">
                                <Toggle field="requires_approval" label="Approbation requise"
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