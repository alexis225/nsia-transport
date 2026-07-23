import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X, ToggleLeft, ToggleRight, Trash2, Pencil, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Escalades NN300', href: '/admin/approvals' },
    { title: 'Seuils & validations' },
];

type TriggerType = 'insured_value_pct_of_contract' | 'subscription_limit_exceeded' | 'certificates_limit_reached';

interface Step { step: number; role: string; label: string | null; timeout_hours: number; }
interface Config {
    id: string; name: string; trigger_type: TriggerType;
    threshold_pct: number | null; is_active: boolean;
    tenant: { id: string; name: string; code: string } | null;
    steps: Step[];
}
interface Tenant { id: string; name: string; code: string; }
interface Props {
    configs:         Config[];
    tenants:         Tenant[];
    filters:         { tenant_id?: string };
    isSA:            boolean;
    defaultTenantId: string | null;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
    insured_value_pct_of_contract: 'Dépassement du plein (%)',
    subscription_limit_exceeded:   'Plafond NN300 cumulé dépassé',
    certificates_limit_reached:    'Nombre de certificats max. atteint',
};

const ROLE_LABELS: Record<string, string> = {
    admin_filiale: 'Admin Filiale',
    super_admin:   'Super Admin (DTAG)',
};

type StepForm = { role: string; timeout_hours: string };

const emptyForm = (defaultTenantId: string | null) => ({
    tenant_id:     defaultTenantId ?? '',
    name:          '',
    trigger_type:  'insured_value_pct_of_contract' as TriggerType,
    threshold_pct: '15',
    steps: [
        { role: 'admin_filiale', timeout_hours: '48' },
        { role: 'super_admin',   timeout_hours: '48' },
    ] as StepForm[],
});

export default function ApprovalConfigs({ configs, tenants, isSA, defaultTenantId }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm(emptyForm(defaultTenantId));

    const startCreate = () => {
        setEditingId(null);
        reset();
        setData(emptyForm(defaultTenantId));
        setShowForm(true);
    };

    const startEdit = (c: Config) => {
        setEditingId(c.id);
        setData({
            tenant_id:     c.tenant?.id ?? '',
            name:          c.name,
            trigger_type:  c.trigger_type,
            threshold_pct: c.threshold_pct != null ? String(c.threshold_pct) : '15',
            steps: c.steps.length > 0
                ? c.steps.map(s => ({ role: s.role, timeout_hours: String(s.timeout_hours) }))
                : [{ role: 'admin_filiale', timeout_hours: '48' }],
        });
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        reset();
    };

    const handleSubmit = () => {
        const onSuccess = () => {
 cancelForm(); 
};

        if (editingId) {
            patch(route('admin.approvals.configs.update', { config: editingId }), { onSuccess });
        } else {
            post(route('admin.approvals.configs.store'), { onSuccess });
        }
    };

    const toggle  = (id: string) => router.patch(route('admin.approvals.configs.toggle', { config: id }));
    const destroy = (id: string) => {
        if (confirm('Supprimer cette règle d\'escalade ?')) {
            router.delete(route('admin.approvals.configs.destroy', { config: id }));
        }
    };

    const addStep    = () => setData('steps', [...data.steps, { role: 'super_admin', timeout_hours: '48' }]);
    const removeStep = (i: number) => setData('steps', data.steps.filter((_, idx) => idx !== i));
    const setStep    = (i: number, field: keyof StepForm, value: string) => {
        setData('steps', data.steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Seuils & validations NN300 — NSIA Transport"/>
            <style>{`
                .ac-page{padding:4px;display:flex;flex-direction:column;gap:14px;}
                .ac-title{font-size:18px;font-weight:600;color:#1e293b;}
                .ac-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .ac-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:9px 14px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.07em;text-align:left;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
                td{padding:10px 14px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .status-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:8px;font-size:11px;font-weight:500;}
                .trigger-badge{display:inline-flex;align-items:center;padding:3px 9px;background:#fef2f2;color:#b91c1c;border-radius:8px;font-size:11px;font-weight:600;}
                .step-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#eff6ff;color:#1d4ed8;border-radius:7px;font-size:10.5px;font-weight:500;margin-right:4px;}
                .form-card{background:#fff;border:1.5px solid #7c1f1f;border-radius:12px;overflow:hidden;}
                .form-card-hdr{padding:13px 18px;background:#7c1f1f;display:flex;align-items:center;justify-content:space-between;}
                .form-card-ttl{font-size:13px;font-weight:600;color:#fff;}
                .form-card-body{padding:18px;display:flex;flex-direction:column;gap:14px;}
                .form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
                .form-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
                .hs-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .step-row{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;padding:10px;background:#f8fafc;border-radius:8px;}
                .empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
                .icon-btn{background:none;border:none;cursor:pointer;color:#64748b;display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:4px 6px;border-radius:6px;}
                .icon-btn:hover{background:#f1f5f9;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ac-page">

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                            <h1 className="ac-title">Seuils & validations NN300</h1>
                            <p className="ac-sub">Renforcement — déclencheurs d'escalade et chaîne de validation hiérarchique, par filiale</p>
                        </div>
                        {!showForm && (
                            <Button onClick={startCreate} className="bg-[#7c1f1f] hover:bg-[#991b1b] text-white h-10 px-4">
                                <Plus size={14}/> Nouvelle règle
                            </Button>
                        )}
                    </div>

                    {showForm && (
                        <div className="form-card">
                            <div className="form-card-hdr">
                                <span className="form-card-ttl">{editingId ? 'Modifier la règle' : 'Nouvelle règle d\'escalade'}</span>
                                <button onClick={cancelForm} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)' }}>
                                    <X size={16}/>
                                </button>
                            </div>
                            <div className="form-card-body">
                                {isSA && tenants?.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Filiale *
                                        </Label>
                                        <select value={data.tenant_id} onChange={e => setData('tenant_id', e.target.value)} className="hs-select">
                                            <option value="">— Choisir —</option>
                                            {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                                        </select>
                                        {errors.tenant_id && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.tenant_id}</p>}
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                        Nom de la règle *
                                    </Label>
                                    <Input className="h-11" value={data.name} onChange={e => setData('name', e.target.value)}
                                           placeholder="ex: Escalade Plafond NN300 — Sénégal"/>
                                    {errors.name && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.name}</p>}
                                </div>

                                <div className="form-grid-2">
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Déclencheur *
                                        </Label>
                                        <select value={data.trigger_type} onChange={e => setData('trigger_type', e.target.value as TriggerType)} className="hs-select">
                                            {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map(t => (
                                                <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {data.trigger_type === 'insured_value_pct_of_contract' && (
                                        <div className="grid gap-2">
                                            <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                                Seuil (% du plein) *
                                            </Label>
                                            <Input type="number" min="0" max="100" step="0.5" className="h-11"
                                                   value={data.threshold_pct} onChange={e => setData('threshold_pct', e.target.value)}
                                                   placeholder="ex: 15"/>
                                            {errors.threshold_pct && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.threshold_pct}</p>}
                                        </div>
                                    )}
                                </div>

                                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e' }}>
                                    {data.trigger_type === 'insured_value_pct_of_contract' &&
                                        'Se déclenche quand la valeur assurée d\'un certificat dépasse ce pourcentage du "plein" du contrat (peut être surchargé par contrat).'}
                                    {data.trigger_type === 'subscription_limit_exceeded' &&
                                        'Se déclenche quand la soumission du certificat ferait dépasser le plafond NN300 cumulé du contrat — remplace l\'ancien blocage strict.'}
                                    {data.trigger_type === 'certificates_limit_reached' &&
                                        'Se déclenche quand le contrat a déjà atteint son nombre maximal de certificats émis — remplace l\'ancien blocage strict.'}
                                </div>

                                <div className="grid gap-2">
                                    <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                        Chaîne de validation hiérarchique *
                                    </Label>
                                    {data.steps.map((s, i) => (
                                        <div key={i} className="step-row">
                                            <div className="grid gap-1">
                                                <span style={{ fontSize:10, color:'#94a3b8' }}>Étape {i + 1} — Approbateur</span>
                                                <select value={s.role} onChange={e => setStep(i, 'role', e.target.value)} className="hs-select">
                                                    <option value="admin_filiale">Admin Filiale</option>
                                                    <option value="super_admin">Super Admin (DTAG)</option>
                                                </select>
                                            </div>
                                            <div className="grid gap-1">
                                                <span style={{ fontSize:10, color:'#94a3b8' }}>Délai (heures ouvrables)</span>
                                                <Input type="number" min="1" max="240" className="h-11"
                                                       value={s.timeout_hours} onChange={e => setStep(i, 'timeout_hours', e.target.value)}/>
                                            </div>
                                            {data.steps.length > 1 && (
                                                <button type="button" className="icon-btn" onClick={() => removeStep(i)} style={{ height:44 }}>
                                                    <Trash2 size={14} color="#dc2626"/>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {data.steps.length < 2 && (
                                        <button type="button" className="icon-btn" onClick={addStep} style={{ alignSelf:'flex-start' }}>
                                            <Plus size={13}/> Ajouter une étape
                                        </button>
                                    )}
                                    {errors['steps.0.role'] && <p style={{ fontSize:11, color:'#dc2626' }}>{errors['steps.0.role']}</p>}
                                </div>

                                <div style={{ display:'flex', gap:8 }}>
                                    <Button disabled={processing || !data.name || data.steps.length === 0}
                                            onClick={handleSubmit}
                                            className="bg-[#7c1f1f] hover:bg-[#991b1b] text-white h-10 px-5">
                                        {processing ? 'Enregistrement…' : <><ShieldAlert size={13}/> {editingId ? 'Enregistrer' : 'Créer la règle'}</>}
                                    </Button>
                                    <Button variant="outline" onClick={cancelForm}>Annuler</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="ac-card">
                        {configs.length === 0 ? (
                            <div className="empty">
                                <ShieldAlert size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                                <div>Aucune règle d'escalade configurée.</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Règle</th>
                                        {isSA && <th>Filiale</th>}
                                        <th>Déclencheur</th>
                                        <th>Validation</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {configs.map(c => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight:500, color:'#1e293b' }}>{c.name}</td>
                                            {isSA && (
                                                <td>
                                                    <div style={{ fontSize:11 }}>{c.tenant?.name ?? '—'}</div>
                                                    <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace' }}>{c.tenant?.code}</div>
                                                </td>
                                            )}
                                            <td>
                                                <span className="trigger-badge">
                                                    {TRIGGER_LABELS[c.trigger_type]}{c.threshold_pct != null ? ` > ${c.threshold_pct}%` : ''}
                                                </span>
                                            </td>
                                            <td>
                                                {c.steps.map(s => (
                                                    <span key={s.step} className="step-chip">
                                                        {s.step}. {ROLE_LABELS[s.role] ?? s.role} ({s.timeout_hours}h)
                                                    </span>
                                                ))}
                                            </td>
                                            <td>
                                                <span className="status-badge" style={{
                                                    background: c.is_active ? '#f0fdf4' : '#f8fafc',
                                                    color:      c.is_active ? '#15803d' : '#94a3b8',
                                                }}>
                                                    <span style={{ width:5, height:5, borderRadius:'50%', background: c.is_active ? '#22c55e' : '#cbd5e1' }}/>
                                                    {c.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display:'flex', gap:2 }}>
                                                    <button className="icon-btn" onClick={() => startEdit(c)}>
                                                        <Pencil size={13}/> Modifier
                                                    </button>
                                                    <button className="icon-btn" onClick={() => toggle(c.id)}>
                                                        {c.is_active ? <ToggleRight size={15} color="#15803d"/> : <ToggleLeft size={15} color="#94a3b8"/>}
                                                    </button>
                                                    <button className="icon-btn" onClick={() => destroy(c.id)}>
                                                        <Trash2 size={13} color="#dc2626"/>
                                                    </button>
                                                </div>
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
