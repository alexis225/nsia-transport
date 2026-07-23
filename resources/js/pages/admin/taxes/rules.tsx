import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X, ToggleLeft, ToggleRight, Receipt } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Taxes', href: '/admin/taxes/rules' },
    { title: 'Référentiel de taxes' },
];

interface Rule {
    id: string; rate_pct: number; effective_date: string;
    end_date: string | null; is_active: boolean; notes: string | null;
    tenant: { id: string; name: string; code: string } | null;
    transport_mode: { id: number; code: string; name_fr: string } | null;
    country: { code: string; name_fr: string } | null;
    created_by_user: { name: string } | null;
}
interface Tenant        { id: string; name: string; code: string; }
interface TransportMode { id: number; code: string; name_fr: string; }
interface Country       { code: string; name_fr: string; }
interface Paginated<T> { data: T[]; current_page: number; last_page: number; total: number; from: number; to: number; }
interface Props {
    rules:           Paginated<Rule>;
    tenants:         Tenant[];
    transportModes:  TransportMode[];
    countries:       Country[];
    filters:         { tenant_id?: string };
    isSA:            boolean;
    defaultTenantId: string | null;
}

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

export default function TaxRules({ rules, tenants, transportModes, countries, isSA, defaultTenantId }: Props) {
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        tenant_id:          defaultTenantId ?? '',
        transport_mode_id:  '',
        country_code:       '',
        rate_pct:           '',
        effective_date:     new Date().toISOString().slice(0, 10),
        end_date:           '',
        notes:              '',
    });

    const handleSubmit = () => {
        post(route('admin.taxes.rules.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const toggle = (id: string) => {
        router.patch(route('admin.taxes.rules.toggle', { rule: id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Référentiel de taxes — NSIA Transport"/>
            <style>{`
                .tr-page{padding:4px;display:flex;flex-direction:column;gap:14px;}
                .tr-title{font-size:18px;font-weight:600;color:#1e293b;}
                .tr-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .tr-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
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
                <div className="tr-page">

                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                            <h1 className="tr-title">Référentiel de taxes</h1>
                            <p className="tr-sub">Taux par filiale, mode de transport et pays — appliqué automatiquement à l'émission des certificats</p>
                        </div>
                        {!showForm && (
                            <Button onClick={() => setShowForm(true)}
                                    className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                <Plus size={14}/> Nouveau taux
                            </Button>
                        )}
                    </div>

                    {/* Formulaire */}
                    {showForm && (
                        <div className="form-card">
                            <div className="form-card-hdr">
                                <span className="form-card-ttl">Nouveau taux de taxe</span>
                                <button onClick={() => {
                                            setShowForm(false);
                                            reset();
                                        }}
                                        style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)' }}>
                                    <X size={16}/>
                                </button>
                            </div>
                            <div className="form-card-body">
                                {isSA && tenants?.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Filiale *
                                        </Label>
                                        <select value={data.tenant_id} onChange={e => setData('tenant_id', e.target.value)}
                                                className="hs-select">
                                            <option value="">— Choisir —</option>
                                            {tenants.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                            ))}
                                        </select>
                                        {errors.tenant_id && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.tenant_id}</p>}
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Mode de transport *
                                        </Label>
                                        <select value={data.transport_mode_id} onChange={e => setData('transport_mode_id', e.target.value)}
                                                className="hs-select">
                                            <option value="">— Choisir —</option>
                                            {transportModes.map(m => (
                                                <option key={m.id} value={m.id}>{m.name_fr}</option>
                                            ))}
                                        </select>
                                        {errors.transport_mode_id && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.transport_mode_id}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Pays (réglementation) *
                                        </Label>
                                        <select value={data.country_code} onChange={e => setData('country_code', e.target.value)}
                                                className="hs-select">
                                            <option value="">— Choisir —</option>
                                            {countries.map(c => (
                                                <option key={c.code} value={c.code}>{c.name_fr}</option>
                                            ))}
                                        </select>
                                        {errors.country_code && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.country_code}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Taux (%) *
                                        </Label>
                                        <Input type="number" min="0" max="100" step="0.01" className="h-11"
                                               value={data.rate_pct} onChange={e => setData('rate_pct', e.target.value)}
                                               placeholder="ex: 18.00"/>
                                        {errors.rate_pct && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.rate_pct}</p>}
                                    </div>
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
                                           placeholder="ex: TVA + droits de douane 2026"/>
                                </div>

                                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e' }}>
                                    Ce taux remplace la saisie manuelle du taux de taxe sur le contrat — il est résolu automatiquement à l'émission selon le mode de transport et le pays de destination du certificat.
                                </div>

                                <div style={{ display:'flex', gap:8 }}>
                                    <Button disabled={processing || !data.transport_mode_id || !data.country_code || !data.rate_pct || !data.effective_date}
                                            onClick={handleSubmit}
                                            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                        {processing ? 'Enregistrement…' : <><Receipt size={13}/> Créer le taux</>}
                                    </Button>
                                    <Button variant="outline" onClick={() => {
                                        setShowForm(false);
                                        reset();
                                    }}>
                                        Annuler
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="tr-card">
                        {rules.data.length === 0 ? (
                            <div className="empty">
                                <Receipt size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                                <div>Aucun taux de taxe défini.</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        {isSA && <th>Filiale</th>}
                                        <th>Mode de transport</th>
                                        <th>Pays</th>
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
                                            {isSA && (
                                                <td>
                                                    <div style={{ fontWeight:500 }}>{rule.tenant?.name}</div>
                                                    <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace' }}>{rule.tenant?.code}</div>
                                                </td>
                                            )}
                                            <td>{rule.transport_mode?.name_fr}</td>
                                            <td>{rule.country?.name_fr}</td>
                                            <td>
                                                <span className="rate-badge">
                                                    {parseFloat(String(rule.rate_pct)).toFixed(2)}%
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
                                                    {rule.is_active ? 'Actif' : 'Inactif'}
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
