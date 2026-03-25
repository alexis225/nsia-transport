import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { Award, Plus, Trash2, Check } from 'lucide-react';

interface Contract {
    id: string; contract_number: string; insured_name: string;
    currency_code: string; rate_ro: string | null; rate_rg: string | null;
    rate_surprime: string | null; rate_accessories: string | null; rate_tax: string | null;
    subscription_limit: string | null; used_limit: string;
    tenant: { name: string; code: string } | null;
}
interface Props {
    contracts:        Contract[];
    selectedContract: Contract | null;
    defaultTenantId:  string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Certificats', href: '/admin/certificates' },
    { title: 'Nouveau certificat' },
];

type ExpeditionItem = {
    marks: string; package_numbers: string; package_count: string;
    weight: string; nature: string; packaging: string; insured_value: string;
};

const emptyItem = (): ExpeditionItem => ({
    marks: '', package_numbers: '', package_count: '',
    weight: '', nature: '', packaging: '', insured_value: '',
});

export default function CertificateCreate({ contracts, selectedContract, defaultTenantId }: Props) {

    const { data, setData, post, processing, errors } = useForm({
        contract_id:           selectedContract?.id ?? '',
        insured_name:          selectedContract?.insured_name ?? '',
        insured_ref:           '',
        voyage_date:           new Date().toISOString().slice(0, 10),
        voyage_from:           '',
        voyage_to:             '',
        voyage_via:            '',
        transport_type:        'SEA',
        vessel_name:           '',
        flight_number:         '',
        voyage_mode:           '',
        expedition_items:      [emptyItem()] as ExpeditionItem[],
        insured_value:         '',
        insured_value_letters: '',
        guarantee_mode:        '',
        exchange_currency:     '',
        exchange_rate:         '',
    });

    const selectedC = contracts.find(c => c.id === data.contract_id) ?? selectedContract;

    // Recalcule la valeur totale depuis les items
    const totalValue = data.expedition_items.reduce((sum, item) => {
        return sum + (parseFloat(item.insured_value) || 0);
    }, 0);

    const updateItem = (i: number, field: keyof ExpeditionItem, value: string) => {
        const items = [...data.expedition_items];
        items[i] = { ...items[i], [field]: value };
        setData('expedition_items', items);
        // Sync valeur totale
        const total = items.reduce((s, it) => s + (parseFloat(it.insured_value) || 0), 0);
        setData('insured_value', String(total));
    };

    const addItem    = () => setData('expedition_items', [...data.expedition_items, emptyItem()]);
    const removeItem = (i: number) => setData('expedition_items', data.expedition_items.filter((_, idx) => idx !== i));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.certificates.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau certificat — NSIA Transport"/>
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
                            <div className="cc-hero-title">Nouveau certificat d'assurance</div>
                            <div className="cc-hero-sub">Saisissez les détails de l'expédition</div>
                        </div>
                    </div>

                    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                        {/* ── Contrat ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">Contrat d'assurance</div>
                                <div className="cc-card-sub">Sélectionnez le contrat actif</div>
                            </div>
                            <div className="cc-card-body">
                                <div className="grid gap-2">
                                    <Label className="cc-label">Contrat *</Label>
                                    <select className="cc-select" value={data.contract_id}
                                            onChange={e => {
                                                const c = contracts.find(c => c.id === e.target.value);
                                                setData('contract_id', e.target.value);
                                                if (c) setData('insured_name', c.insured_name);
                                            }}>
                                        <option value="">Sélectionnez un contrat actif</option>
                                        {contracts.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.contract_number} — {c.insured_name} ({c.tenant?.code})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.contract_id}/>
                                </div>
                                {selectedC && (
                                    <div className="contract-info">
                                        <div style={{ fontWeight:600, marginBottom:4 }}>{selectedC.contract_number}</div>
                                        <div>Filiale : {selectedC.tenant?.name} · Devise : {selectedC.currency_code}</div>
                                        {selectedC.subscription_limit && (
                                            <div style={{ marginTop:3 }}>
                                                Plafond : {parseFloat(selectedC.subscription_limit).toLocaleString('fr-FR')} {selectedC.currency_code}
                                                {' · '}Utilisé : {parseFloat(selectedC.used_limit).toLocaleString('fr-FR')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Assuré ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">Assuré</div>
                            </div>
                            <div className="cc-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">Nom assuré *</Label>
                                        <Input className="h-11" value={data.insured_name}
                                               onChange={e => setData('insured_name', e.target.value)}/>
                                        <InputError message={errors.insured_name}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">Références assuré</Label>
                                        <Input className="h-11" value={data.insured_ref ?? ''}
                                               onChange={e => setData('insured_ref', e.target.value)}
                                               placeholder="Référence interne"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Voyage ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">Voyage</div>
                                <div className="cc-card-sub">Informations de l'expédition</div>
                            </div>
                            <div className="cc-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">Date d'expédition *</Label>
                                        <Input className="h-11" type="date" value={data.voyage_date}
                                               onChange={e => setData('voyage_date', e.target.value)}/>
                                        <InputError message={errors.voyage_date}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">Mode de transport</Label>
                                        <select className="cc-select" value={data.transport_type ?? ''}
                                                onChange={e => setData('transport_type', e.target.value)}>
                                            <option value="">—</option>
                                            <option value="SEA">Maritime</option>
                                            <option value="AIR">Aérien</option>
                                            <option value="ROAD">Routier</option>
                                            <option value="RAIL">Ferroviaire</option>
                                            <option value="MULTIMODAL">Multimodal</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">De *</Label>
                                        <Input className="h-11" value={data.voyage_from}
                                               onChange={e => setData('voyage_from', e.target.value)}
                                               placeholder="Lieu de départ"/>
                                        <InputError message={errors.voyage_from}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">À *</Label>
                                        <Input className="h-11" value={data.voyage_to}
                                               onChange={e => setData('voyage_to', e.target.value)}
                                               placeholder="Lieu de destination"/>
                                        <InputError message={errors.voyage_to}/>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="cc-label">Via</Label>
                                    <Input className="h-11" value={data.voyage_via ?? ''}
                                           onChange={e => setData('voyage_via', e.target.value)}
                                           placeholder="Lieu de transit / transbordement"/>
                                </div>
                                {(data.transport_type === 'SEA' || !data.transport_type) && (
                                    <div className="form-grid">
                                        <div className="grid gap-2">
                                            <Label className="cc-label">Navire S/S</Label>
                                            <Input className="h-11" value={data.vessel_name ?? ''}
                                                   onChange={e => setData('vessel_name', e.target.value)}
                                                   placeholder="Nom du navire"/>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="cc-label">Mode</Label>
                                            <select className="cc-select" value={data.voyage_mode ?? ''}
                                                    onChange={e => setData('voyage_mode', e.target.value)}>
                                                <option value="">—</option>
                                                <option value="CONTAINER">Container</option>
                                                <option value="GROUPAGE">Groupage</option>
                                                <option value="CONVENTIONNEL">Conventionnel</option>
                                                <option value="BOUT_EN_BOUT">Bout en bout</option>
                                                <option value="VRAC">Vrac</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {data.transport_type === 'AIR' && (
                                    <div className="grid gap-2">
                                        <Label className="cc-label">N° de vol</Label>
                                        <Input className="h-11" value={data.flight_number ?? ''}
                                               onChange={e => setData('flight_number', e.target.value)}
                                               placeholder="ex: AF 123"/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Détail expédition ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">Détail de l'expédition</div>
                                <div className="cc-card-sub">Marques, colis, nature des marchandises et valeur</div>
                            </div>
                            <div className="cc-card-body">
                                <div style={{ overflowX:'auto' }}>
                                    <table className="exp-table">
                                        <thead>
                                            <tr>
                                                <th>Marques</th>
                                                <th>N° Colis</th>
                                                <th>Nbre</th>
                                                <th>Poids</th>
                                                <th>Nature marchandises</th>
                                                <th>Emballage</th>
                                                <th>Valeur assurance</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.expedition_items.map((item, i) => (
                                                <tr key={i}>
                                                    <td><input className="exp-input" value={item.marks} onChange={e => updateItem(i, 'marks', e.target.value)} placeholder="NSIA-001"/></td>
                                                    <td><input className="exp-input" value={item.package_numbers} onChange={e => updateItem(i, 'package_numbers', e.target.value)} placeholder="1 à 10"/></td>
                                                    <td style={{ width:60 }}><input className="exp-input" type="number" min={0} value={item.package_count} onChange={e => updateItem(i, 'package_count', e.target.value)} placeholder="10"/></td>
                                                    <td style={{ width:80 }}><input className="exp-input" value={item.weight} onChange={e => updateItem(i, 'weight', e.target.value)} placeholder="500 kg"/></td>
                                                    <td><input className="exp-input" value={item.nature} onChange={e => updateItem(i, 'nature', e.target.value)} placeholder="Électronique"/></td>
                                                    <td><input className="exp-input" value={item.packaging} onChange={e => updateItem(i, 'packaging', e.target.value)} placeholder="Cartons"/></td>
                                                    <td style={{ width:120 }}><input className="exp-input" type="number" min={0} value={item.insured_value} onChange={e => updateItem(i, 'insured_value', e.target.value)} placeholder="0"/></td>
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
                                    <Plus size={12}/> Ajouter une ligne
                                </button>
                                {errors['expedition_items'] && <p style={{ fontSize:11, color:'#ef4444' }}>⚠ {errors['expedition_items']}</p>}

                                {/* Total */}
                                <div className="total-bar">
                                    <span className="total-label">Valeur totale d'assurance</span>
                                    <span className="total-value">
                                        {totalValue.toLocaleString('fr-FR')} {selectedC?.currency_code ?? ''}
                                    </span>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="cc-label">Valeur totale en lettres</Label>
                                    <Input className="h-11" value={data.insured_value_letters ?? ''}
                                           onChange={e => setData('insured_value_letters', e.target.value)}
                                           placeholder="ex: Cinq millions de francs CFA"/>
                                </div>
                            </div>
                        </div>

                        {/* ── Conditions financières ── */}
                        <div className="cc-card">
                            <div className="cc-card-hdr">
                                <div className="cc-card-ttl">Conditions financières</div>
                            </div>
                            <div className="cc-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="cc-label">Mode de garantie</Label>
                                        <Input className="h-11" value={data.guarantee_mode ?? ''}
                                               onChange={e => setData('guarantee_mode', e.target.value)}
                                               placeholder="ex: Tous risques, FAP sauf…"/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="cc-label">Devise cotation</Label>
                                        <Input className="h-11" value={data.exchange_currency ?? ''}
                                               onChange={e => setData('exchange_currency', e.target.value)}
                                               placeholder="ex: USD"/>
                                    </div>
                                </div>
                                {data.exchange_currency && (
                                    <div className="grid gap-2">
                                        <Label className="cc-label">Cours ({data.exchange_currency})</Label>
                                        <Input className="h-11" type="number" step="0.000001" min={0}
                                               value={data.exchange_rate ?? ''}
                                               onChange={e => setData('exchange_rate', e.target.value)}
                                               placeholder="ex: 600"/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8 }}>
                            <Button type="submit" disabled={processing}
                                    className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                {processing ? 'Enregistrement…' : <><Award size={14}/> Créer le certificat</>}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>Annuler</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}