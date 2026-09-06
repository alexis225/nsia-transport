import { Head, router, useForm } from '@inertiajs/react';
import { Plus, X, ToggleLeft, ToggleRight, Trash2, Pencil, ShieldAlert, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type TriggerType = 'insured_value_pct_of_contract' | 'subscription_limit_exceeded' | 'certificates_limit_reached';

interface Step { step: number; role: string; label: string | null; timeout_hours: number; }
interface Config {
    id: string; name: string; trigger_type: TriggerType;
    threshold_pct: number | null; is_active: boolean;
    tenant: { id: string; name: string; code: string } | null;
    steps: Step[];
}
interface Tenant { id: string; name: string; code: string; }
interface Filters { tenant_id?: string; search?: string; trigger_type?: string; status?: string; }
interface Props {
    configs:         Config[];
    tenants:         Tenant[];
    filters:         Filters;
    isSA:            boolean;
    defaultTenantId: string | null;
}

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

export default function ApprovalConfigs({ configs, tenants, filters, isSA, defaultTenantId }: Props) {
    const { t } = useTranslation('approvals');
    const { t: tc } = useTranslation('common');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('index.breadcrumb'), href: '/admin/approvals' },
        { title: t('configs.breadcrumbCurrent') },
    ];
    const TRIGGER_LABELS: Record<TriggerType, string> = {
        insured_value_pct_of_contract: t('configs.triggers.insured_value_pct_of_contract'),
        subscription_limit_exceeded:   t('configs.triggers.subscription_limit_exceeded'),
        certificates_limit_reached:    t('configs.triggers.certificates_limit_reached'),
    };
    const ROLE_LABELS: Record<string, string> = {
        admin_filiale: t('configs.roles.admin_filiale'),
        super_admin:   t('configs.roles.super_admin'),
    };
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilters(next: Partial<Filters>) {
        router.get(route('admin.approvals.configs'), { ...filters, ...next }, { preserveState: true, replace: true });
    }

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
        if (confirm(t('configs.deleteConfirm'))) {
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
            <Head title={t('configs.title')}/>
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
                            <h1 className="ac-title">{t('configs.heading')}</h1>
                            <p className="ac-sub">{t('configs.subtitle')}</p>
                        </div>
                        {!showForm && (
                            <Button onClick={startCreate} className="bg-[#7c1f1f] hover:bg-[#991b1b] text-white h-10 px-4">
                                <Plus size={14}/> {t('configs.newRule')}
                            </Button>
                        )}
                    </div>

                    {!showForm && (
                        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                            <div style={{ position:'relative', flex:1, maxWidth:320 }}>
                                <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters({ search })}
                                    placeholder={t('configs.searchPlaceholder')}
                                    style={{ width:'100%', padding:'7px 8px 7px 32px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12.5, outline:'none', boxSizing:'border-box' }}
                                />
                                {search && (
                                    <button type="button" onClick={() => { setSearch(''); applyFilters({ search: '' }); }}
                                            style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                                        <X size={13}/>
                                    </button>
                                )}
                            </div>
                            <select value={filters.trigger_type ?? ''} onChange={e => applyFilters({ trigger_type: e.target.value })}
                                    style={{ padding:'7px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12.5, cursor:'pointer' }}>
                                <option value="">{t('configs.allTriggers')}</option>
                                {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map(trig => (
                                    <option key={trig} value={trig}>{TRIGGER_LABELS[trig]}</option>
                                ))}
                            </select>
                            <select value={filters.status ?? ''} onChange={e => applyFilters({ status: e.target.value })}
                                    style={{ padding:'7px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12.5, cursor:'pointer' }}>
                                <option value="">{t('configs.allStatuses')}</option>
                                <option value="active">{t('configs.active')}</option>
                                <option value="inactive">{t('configs.inactive')}</option>
                            </select>
                            {isSA && tenants.length > 0 && (
                                <select value={filters.tenant_id ?? ''} onChange={e => applyFilters({ tenant_id: e.target.value })}
                                        style={{ padding:'7px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12.5, cursor:'pointer' }}>
                                    <option value="">{t('configs.allTenants')}</option>
                                    {tenants.map(tn => <option key={tn.id} value={tn.id}>{tn.name} ({tn.code})</option>)}
                                </select>
                            )}
                        </div>
                    )}

                    {showForm && (
                        <div className="form-card">
                            <div className="form-card-hdr">
                                <span className="form-card-ttl">{editingId ? t('configs.form.editTitle') : t('configs.form.createTitle')}</span>
                                <button onClick={cancelForm} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)' }}>
                                    <X size={16}/>
                                </button>
                            </div>
                            <div className="form-card-body">
                                {isSA && tenants?.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            {t('configs.form.tenantLabel')}
                                        </Label>
                                        <select value={data.tenant_id} onChange={e => setData('tenant_id', e.target.value)} className="hs-select">
                                            <option value="">{t('configs.form.tenantPlaceholder')}</option>
                                            {tenants.map(tn => <option key={tn.id} value={tn.id}>{tn.name} ({tn.code})</option>)}
                                        </select>
                                        {errors.tenant_id && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.tenant_id}</p>}
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                        {t('configs.form.nameLabel')}
                                    </Label>
                                    <Input className="h-11" value={data.name} onChange={e => setData('name', e.target.value)}
                                           placeholder={t('configs.form.namePlaceholder')}/>
                                    {errors.name && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.name}</p>}
                                </div>

                                <div className="form-grid-2">
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            {t('configs.form.triggerLabel')}
                                        </Label>
                                        <select value={data.trigger_type} onChange={e => setData('trigger_type', e.target.value as TriggerType)} className="hs-select">
                                            {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map(trig => (
                                                <option key={trig} value={trig}>{TRIGGER_LABELS[trig]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {data.trigger_type === 'insured_value_pct_of_contract' && (
                                        <div className="grid gap-2">
                                            <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                                {t('configs.form.thresholdLabel')}
                                            </Label>
                                            <Input type="number" min="0" max="100" step="0.5" className="h-11"
                                                   value={data.threshold_pct} onChange={e => setData('threshold_pct', e.target.value)}
                                                   placeholder={t('configs.form.thresholdPlaceholder')}/>
                                            {errors.threshold_pct && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.threshold_pct}</p>}
                                        </div>
                                    )}
                                </div>

                                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e' }}>
                                    {data.trigger_type === 'insured_value_pct_of_contract' &&
                                        t('configs.form.triggerHelp.insured_value_pct_of_contract')}
                                    {data.trigger_type === 'subscription_limit_exceeded' &&
                                        t('configs.form.triggerHelp.subscription_limit_exceeded')}
                                    {data.trigger_type === 'certificates_limit_reached' &&
                                        t('configs.form.triggerHelp.certificates_limit_reached')}
                                </div>

                                <div className="grid gap-2">
                                    <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                        {t('configs.form.chainLabel')}
                                    </Label>
                                    {data.steps.map((s, i) => (
                                        <div key={i} className="step-row">
                                            <div className="grid gap-1">
                                                <span style={{ fontSize:10, color:'#94a3b8' }}>{t('configs.form.stepLabel', { n: i + 1 })}</span>
                                                <select value={s.role} onChange={e => setStep(i, 'role', e.target.value)} className="hs-select">
                                                    <option value="admin_filiale">{t('configs.roles.admin_filiale')}</option>
                                                    <option value="super_admin">{t('configs.roles.super_admin')}</option>
                                                </select>
                                            </div>
                                            <div className="grid gap-1">
                                                <span style={{ fontSize:10, color:'#94a3b8' }}>{t('configs.form.delayLabel')}</span>
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
                                            <Plus size={13}/> {t('configs.form.addStep')}
                                        </button>
                                    )}
                                    {errors['steps.0.role'] && <p style={{ fontSize:11, color:'#dc2626' }}>{errors['steps.0.role']}</p>}
                                </div>

                                <div style={{ display:'flex', gap:8 }}>
                                    <Button disabled={processing || !data.name || data.steps.length === 0}
                                            onClick={handleSubmit}
                                            className="bg-[#7c1f1f] hover:bg-[#991b1b] text-white h-10 px-5">
                                        {processing ? tc('states.saving') : <><ShieldAlert size={13}/> {editingId ? tc('actions.save') : t('configs.form.create')}</>}
                                    </Button>
                                    <Button variant="outline" onClick={cancelForm}>{tc('actions.cancel')}</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="ac-card">
                        {configs.length === 0 ? (
                            <div className="empty">
                                <ShieldAlert size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                                <div>
                                    {filters.search || filters.trigger_type || filters.status || filters.tenant_id
                                        ? t('configs.emptyFiltered')
                                        : t('configs.emptyNone')}
                                </div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('configs.table.rule')}</th>
                                        {isSA && <th>{t('configs.table.tenant')}</th>}
                                        <th>{t('configs.table.trigger')}</th>
                                        <th>{t('configs.table.validation')}</th>
                                        <th>{t('configs.table.status')}</th>
                                        <th>{t('configs.table.actions')}</th>
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
                                                    {c.is_active ? t('configs.active') : t('configs.inactive')}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display:'flex', gap:2 }}>
                                                    <button className="icon-btn" onClick={() => startEdit(c)}>
                                                        <Pencil size={13}/> {tc('actions.edit')}
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
