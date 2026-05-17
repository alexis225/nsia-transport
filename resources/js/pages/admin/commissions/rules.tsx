import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import { Plus, X, ToggleLeft, ToggleRight, Percent } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Commissions', href: '/admin/commissions/rules' },
    { title: 'Règles de commission' },
];

interface Rule {
    id: string; rate_pct: number; effective_date: string;
    end_date: string | null; is_active: boolean; notes: string | null;
    broker: { id: string; name: string; code: string } | null;
    contract: { id: string; contract_number: string } | null;
    created_by: { name: string } | null;
}
interface Broker   { id: string; name: string; code: string; }
interface Contract { id: string; contract_number: string; insured_name: string; broker_id: string | null; }
interface Paginated<T> { data: T[]; current_page: number; last_page: number; total: number; from: number; to: number; }
interface Props {
    rules:     Paginated<Rule>;
    brokers:   Broker[];
    contracts: Contract[];
    baseTypes: Record<string, string>;
    filters:   { broker_id?: string };
    isSA:      boolean;
}

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

export default function CommissionRules({ rules, brokers, contracts, baseTypes, filters, isSA }: Props) {
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        broker_id:           '',
        contract_id:         '',
        rate_pct:            '',
        base_type:           'prime_total',
        custom_base_amount:  '',
        effective_date:      new Date().toISOString().slice(0, 10),
        end_date:            '',
        notes:               '',
    });

    const handleSubmit = () => {
        post(route('admin.commissions.rules.store'), {
            onSuccess: () => { reset(); setShowForm(false); },
        });
    };

    const toggle = (id: string) => {
        router.patch(route('admin.commissions.rules.toggle', { rule: id }));
    };

    // Filtrer les contrats selon le courtier sélectionné
    const filteredContracts = data.broker_id
        ? contracts.filter(c => c.broker_id === data.broker_id)
        : contracts;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Règles de commission — NSIA Transport"/>
            <style>{`
                .cr-page{padding:4px;display:flex;flex-direction:column;gap:14px;}
                .cr-title{font-size:18px;font-weight:600;color:#1e293b;}
                .cr-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .cr-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:9px 14px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.07em;text-align:left;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
                td{padding:10px 14px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .rate-badge{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;background:#eff6ff;color:#1d4ed8;border-radius:8px;font-size:13px;font-weight:700;font-family:monospace;}
                .status-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:8px;font-size:11px;font-weight:500;}
                .form-card{background:#fff;border:1.5px solid #1e3a8a;border-radius:12px;overflow:hidden;}
                .form-card-hdr{padding:13px 18px;background:#1e3a8a;display:flex;align-items:center;justify-content:space-between;}
                .form-card-ttl{font-size:13px;font-weight:600;color:#fff;}
                .form-card-body{padding:18px;display:flex;flex-direction:column;gap:14px;}
                .form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
                .form-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
                .hs-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="cr-page">

                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                            <h1 className="cr-title">Règles de commission</h1>
                            <p className="cr-sub">Paramétrez les taux par courtier et par contrat</p>
                        </div>
                        {!showForm && (
                            <Button onClick={() => setShowForm(true)}
                                    className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                <Plus size={14}/> Nouvelle règle
                            </Button>
                        )}
                    </div>

                    {/* Formulaire */}
                    {showForm && (
                        <div className="form-card">
                            <div className="form-card-hdr">
                                <span className="form-card-ttl">Nouvelle règle de commission</span>
                                <button onClick={() => { setShowForm(false); reset(); }}
                                        style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)' }}>
                                    <X size={16}/>
                                </button>
                            </div>
                            <div className="form-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Courtier *
                                        </Label>
                                        <select value={data.broker_id} onChange={e => { setData('broker_id', e.target.value); setData('contract_id', ''); }}
                                                className="hs-select">
                                            <option value="">— Choisir —</option>
                                            {brokers.map(b => (
                                                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                            ))}
                                        </select>
                                        {errors.broker_id && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.broker_id}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Contrat (optionnel)
                                        </Label>
                                        <select value={data.contract_id} onChange={e => setData('contract_id', e.target.value)}
                                                className="hs-select">
                                            <option value="">— Taux général —</option>
                                            {filteredContracts.map(c => (
                                                <option key={c.id} value={c.id}>{c.contract_number} — {c.insured_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Taux (%) *
                                        </Label>
                                        <Input type="number" min="0" max="100" step="0.01" className="h-11"
                                               value={data.rate_pct} onChange={e => setData('rate_pct', e.target.value)}
                                               placeholder="ex: 10.00"/>
                                        {errors.rate_pct && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.rate_pct}</p>}
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Base de calcul *
                                        </Label>
                                        <select value={data.base_type} onChange={e => setData('base_type', e.target.value)}
                                                className="hs-select">
                                            {Object.entries(baseTypes).map(([val, label]) => (
                                                <option key={val} value={val}>{label as string}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {data.base_type === 'custom_amount' && (
                                        <div className="grid gap-2">
                                            <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                                Montant fixe *
                                            </Label>
                                            <Input type="number" min="0" step="0.01" className="h-11"
                                                   value={data.custom_base_amount}
                                                   onChange={e => setData('custom_base_amount', e.target.value)}
                                                   placeholder="ex: 500000"/>
                                            {errors.custom_base_amount && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.custom_base_amount}</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="form-grid-2">
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Date d'effet *
                                        </Label>
                                        <Input type="date" className="h-11" value={data.effective_date}
                                               onChange={e => setData('effective_date', e.target.value)}/>
                                        {errors.effective_date && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.effective_date}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Date de fin (optionnel)
                                        </Label>
                                        <Input type="date" className="h-11" value={data.end_date}
                                               onChange={e => setData('end_date', e.target.value)}/>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                        Notes (optionnel)
                                    </Label>
                                    <Input className="h-11" value={data.notes} onChange={e => setData('notes', e.target.value)}
                                           placeholder="ex: Taux négocié pour 2026"/>
                                </div>

                                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e' }}>
                                    Si un taux contrat existe, il prime sur le taux courtier général.
                                </div>

                                <div style={{ display:'flex', gap:8 }}>
                                    <Button disabled={processing || !data.broker_id || !data.rate_pct || !data.effective_date}
                                            onClick={handleSubmit}
                                            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                        {processing ? 'Enregistrement…' : <><Percent size={13}/> Créer la règle</>}
                                    </Button>
                                    <Button variant="outline" onClick={() => { setShowForm(false); reset(); }}>
                                        Annuler
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="cr-card">
                        {rules.data.length === 0 ? (
                            <div className="empty">
                                <Percent size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                                <div>Aucune règle de commission définie.</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Courtier</th>
                                        <th>Contrat</th>
                                        <th>Taux</th>
                                        <th>Date d'effet</th>
                                        <th>Date de fin</th>
                                        <th>Statut</th>
                                        <th>Notes</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.data.map(rule => (
                                        <tr key={rule.id}>
                                            <td>
                                                <div style={{ fontWeight:500 }}>{rule.broker?.name}</div>
                                                <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace' }}>{rule.broker?.code}</div>
                                            </td>
                                            <td>
                                                {rule.contract ? (
                                                    <span style={{ fontSize:11, background:'#f0f9ff', color:'#0284c7', padding:'2px 7px', borderRadius:7, border:'1px solid #bae6fd' }}>
                                                        {rule.contract.contract_number}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize:11, color:'#94a3b8' }}>Général</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="rate-badge">
                                                    {parseFloat(String(rule.rate_pct)).toFixed(2)}<Percent size={11}/>
                                                </span>
                                            </td>
                                            <td style={{ fontSize:12 }}>{fmt(rule.effective_date)}</td>
                                            <td style={{ fontSize:12, color:'#94a3b8' }}>
                                                {rule.end_date ? fmt(rule.end_date) : '—'}
                                            </td>
                                            <td>
                                                <span className="status-badge" style={{
                                                    background: rule.is_active ? '#f0fdf4' : '#f8fafc',
                                                    color:      rule.is_active ? '#15803d' : '#94a3b8',
                                                }}>
                                                    <span style={{ width:5, height:5, borderRadius:'50%', background: rule.is_active ? '#22c55e' : '#cbd5e1' }}/>
                                                    {rule.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize:11, color:'#94a3b8', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                {rule.notes ?? '—'}
                                            </td>
                                            <td>
                                                <button onClick={() => toggle(rule.id)}
                                                        style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                                                    {rule.is_active
                                                        ? <><ToggleRight size={16} color="#15803d"/> Désactiver</>
                                                        : <><ToggleLeft size={16} color="#94a3b8"/> Activer</>
                                                    }
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}