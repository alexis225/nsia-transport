import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { FileText, Plus, X, Check } from 'lucide-react';
import { useState } from 'react';

interface Contract {
    id: string; contract_number: string; insured_name: string;
    currency_code: string; status: string;
    rate_ro: string | null; rate_rg: string | null;
    accessories_amount: string | null; rate_tax: string | null;
    effective_date: string; expiry_date: string;
    notice_period_days: number; clauses: string[]; exclusions: string[];
    broker_id: string | null; incoterm_code: string | null;
    transport_mode_id: number | null; coverage_type: string | null;
    tenant: { name: string; code: string } | null;
    broker: { id: string; name: string } | null;
    transport_mode: { id: number; name_fr: string } | null;
}
interface Props { contract: Contract; }

export default function AmendmentCreate({ contract }: Props) {
    const { t } = useTranslation('contracts');

    // Taux prime global (somme R.O.+R.G.), Surprime (désormais par
    // certificat) et Plafond NN300 (paramètre général de l'application) ne
    // sont plus amendables au niveau du contrat.
    const FIELD_LABELS: Record<string, string> = {
        rate_ro:             t('amendmentEditableFieldLabels.rate_ro'),
        rate_rg:             t('amendmentEditableFieldLabels.rate_rg'),
        accessories_amount:  t('amendmentEditableFieldLabels.accessories_amount'),
        rate_tax:            t('amendmentEditableFieldLabels.rate_tax'),
        effective_date:      t('amendmentEditableFieldLabels.effective_date'),
        expiry_date:         t('amendmentEditableFieldLabels.expiry_date'),
        notice_period_days:  t('amendmentEditableFieldLabels.notice_period_days'),
        clauses:             t('amendmentEditableFieldLabels.clauses'),
        exclusions:          t('amendmentEditableFieldLabels.exclusions'),
        broker_id:           t('amendmentEditableFieldLabels.broker_id'),
        incoterm_code:       t('amendmentEditableFieldLabels.incoterm_code'),
        coverage_type:       t('amendmentEditableFieldLabels.coverage_type'),
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.contracts'),  href: '/admin/contracts' },
        { title: contract.contract_number, href: route('admin.contracts.show', { contract: contract.id }) },
        { title: t('breadcrumb.amendments'),  href: route('admin.contracts.amendments.index', { contract: contract.id }) },
        { title: t('breadcrumb.newAmendment') },
    ];

    // Champs sélectionnés pour modification
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [clauseInput,    setClauseInput]    = useState('');
    const [exclusionInput, setExclusionInput] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        reason:             '',
        description:        '',
        rate_ro:            contract.rate_ro            ?? '',
        rate_rg:            contract.rate_rg            ?? '',
        accessories_amount: contract.accessories_amount ?? '',
        rate_tax:           contract.rate_tax           ?? '',
        effective_date:     contract.effective_date,
        expiry_date:        contract.expiry_date,
        notice_period_days: contract.notice_period_days,
        clauses:            contract.clauses   ?? [] as string[],
        exclusions:         contract.exclusions ?? [] as string[],
        incoterm_code:      contract.incoterm_code   ?? '',
        coverage_type:      contract.coverage_type  ?? '',
    });

    const toggleField = (field: string) => {
        setSelectedFields(prev =>
            prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
        );
    };

    const addToList = (field: 'clauses' | 'exclusions', value: string, setter: (v: string) => void) => {
        if (!value.trim()) return;
        setData(field, [...data[field], value.trim()]);
        setter('');
    };

    const removeFromList = (field: 'clauses' | 'exclusions', index: number) => {
        setData(field, data[field].filter((_, i) => i !== index));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.contracts.amendments.store', { contract: contract.id }));
    };

    const rateFields = ['rate_ro', 'rate_rg', 'accessories_amount', 'rate_tax'];
    const dateFields  = ['effective_date', 'expiry_date'];
    const otherFields = ['notice_period_days', 'incoterm_code', 'coverage_type'];
    const listFields  = ['clauses', 'exclusions'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('amendments.create.title', { number: contract.contract_number })}/>
            <style>{`
                .am-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .am-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;}
                .am-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .am-hero-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .am-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .am-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .am-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .am-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .am-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .am-card-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .am-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .am-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .am-textarea{width:100%;padding:10px 13px;font-size:13px;font-family:inherit;color:#1e293b;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;resize:vertical;box-sizing:border-box;}

                /* Sélection des champs */
                .field-selector{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;}
                .field-btn{padding:8px 12px;border-radius:9px;border:1.5px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:12px;color:#475569;font-family:inherit;text-align:left;transition:all .13s;display:flex;align-items:center;gap:6px;}
                .field-btn.selected{border-color:#1e3a8a;background:#eff6ff;color:#1e3a8a;font-weight:500;}
                .field-btn:hover:not(.selected){border-color:#94a3b8;}
                .check-ico{width:14px;height:14px;border-radius:3px;border:1.5px solid currentColor;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

                /* Valeur actuelle */
                .current-val{font-size:11px;color:#94a3b8;margin-top:3px;}

                /* Tags */
                .tag-list{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;}
                .tag-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:11px;color:#1d4ed8;}
                .tag-chip.excl{background:#fef2f2;border-color:#fecaca;color:#dc2626;}
                .tag-input-row{display:flex;gap:6px;}
                .tag-input{flex:1;padding:8px 12px;font-size:12px;font-family:inherit;border:1px solid #e2e8f0;border-radius:8px;outline:none;}
                .tag-add-btn{padding:8px 12px;background:#1e3a8a;border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:12px;font-family:inherit;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="am-wrap">
                    <div className="am-hero">
                        <div className="am-hero-ico"><FileText size={22} color="rgba(255,255,255,0.8)"/></div>
                        <div>
                            <div className="am-hero-title">{t('amendments.create.heroTitle', { number: contract.contract_number })}</div>
                            <div className="am-hero-sub">{contract.insured_name} · {contract.tenant?.name}</div>
                        </div>
                    </div>

                    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                        {/* Motif */}
                        <div className="am-card">
                            <div className="am-card-hdr">
                                <div className="am-card-ttl">{t('amendments.create.reasonSection.title')}</div>
                            </div>
                            <div className="am-card-body">
                                <div className="grid gap-2">
                                    <Label className="am-label">{t('amendments.create.reasonSection.reason')}</Label>
                                    <Input className="h-11" value={data.reason}
                                           onChange={e => setData('reason', e.target.value)}
                                           placeholder={t('amendments.create.reasonSection.reasonPlaceholder')}/>
                                    <InputError message={errors.reason}/>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="am-label">{t('amendments.create.reasonSection.description')}</Label>
                                    <textarea className="am-textarea" rows={3} value={data.description}
                                              onChange={e => setData('description', e.target.value)}
                                              placeholder={t('amendments.create.reasonSection.descriptionPlaceholder')}/>
                                </div>
                            </div>
                        </div>

                        {/* Sélection des champs à modifier */}
                        <div className="am-card">
                            <div className="am-card-hdr">
                                <div className="am-card-ttl">{t('amendments.create.fieldsSection.title')}</div>
                                <div className="am-card-sub">{t('amendments.create.fieldsSection.subtitle')}</div>
                            </div>
                            <div className="am-card-body">
                                <div className="field-selector">
                                    {Object.entries(FIELD_LABELS).map(([field, label]) => (
                                        <button key={field} type="button"
                                                className={`field-btn ${selectedFields.includes(field) ? 'selected' : ''}`}
                                                onClick={() => toggleField(field)}>
                                            <div className="check-ico">
                                                {selectedFields.includes(field) && <Check size={9}/>}
                                            </div>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Taux de prime */}
                        {selectedFields.some(f => rateFields.includes(f)) && (
                            <div className="am-card">
                                <div className="am-card-hdr">
                                    <div className="am-card-ttl">{t('amendments.create.ratesSection.title')}</div>
                                </div>
                                <div className="am-card-body">
                                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                                        {rateFields.filter(f => selectedFields.includes(f)).map(field => {
                                            const isAmount = field === 'accessories_amount';
                                            return (
                                                <div key={field} className="grid gap-1">
                                                    <Label className="am-label">{FIELD_LABELS[field]}</Label>
                                                    <Input className="h-11" type="number" step={isAmount ? '1' : '0.0001'} min={isAmount ? 500 : 0}
                                                           value={(data as any)[field]}
                                                           onChange={e => setData(field as any, e.target.value)}/>
                                                    <div className="current-val">
                                                        {t('amendments.create.ratesSection.current', { value: (contract as any)[field] ?? '—', unit: isAmount ? contract.currency_code : '%' })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dates et délais */}
                        {selectedFields.some(f => [...dateFields, 'notice_period_days'].includes(f)) && (
                            <div className="am-card">
                                <div className="am-card-hdr"><div className="am-card-ttl">{t('amendments.create.periodSection.title')}</div></div>
                                <div className="am-card-body">
                                    <div className="form-grid">
                                        {selectedFields.includes('effective_date') && (
                                            <div className="grid gap-2">
                                                <Label className="am-label">{t('amendments.create.periodSection.effectiveDate')}</Label>
                                                <Input className="h-11" type="date" value={data.effective_date}
                                                       onChange={e => setData('effective_date', e.target.value)}/>
                                                <div className="current-val">{t('amendments.create.periodSection.currentDate', { date: contract.effective_date })}</div>
                                            </div>
                                        )}
                                        {selectedFields.includes('expiry_date') && (
                                            <div className="grid gap-2">
                                                <Label className="am-label">{t('amendments.create.periodSection.expiryDate')}</Label>
                                                <Input className="h-11" type="date" value={data.expiry_date}
                                                       onChange={e => setData('expiry_date', e.target.value)}/>
                                                <div className="current-val">{t('amendments.create.periodSection.currentDate', { date: contract.expiry_date })}</div>
                                            </div>
                                        )}
                                        {selectedFields.includes('notice_period_days') && (
                                            <div className="grid gap-2">
                                                <Label className="am-label">{t('amendments.create.periodSection.noticePeriod')}</Label>
                                                <Input className="h-11" type="number" min={0}
                                                       value={data.notice_period_days}
                                                       onChange={e => setData('notice_period_days', Number(e.target.value))}/>
                                                <div className="current-val">{t('amendments.create.periodSection.currentDays', { days: contract.notice_period_days })}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Couverture & Incoterm */}
                        {selectedFields.some(f => ['incoterm_code', 'coverage_type'].includes(f)) && (
                            <div className="am-card">
                                <div className="am-card-hdr"><div className="am-card-ttl">{t('amendments.create.coverageSection.title')}</div></div>
                                <div className="am-card-body">
                                    <div className="form-grid">
                                        {selectedFields.includes('coverage_type') && (
                                            <div className="grid gap-2">
                                                <Label className="am-label">{t('amendments.create.coverageSection.coverageType')}</Label>
                                                <select className="am-select" value={data.coverage_type}
                                                        onChange={e => setData('coverage_type', e.target.value)}>
                                                    <option value="">—</option>
                                                    <option value="TOUS_RISQUES">{t('amendments.create.coverageSection.allRisks')}</option>
                                                    <option value="FAP_SAUF">{t('amendments.create.coverageSection.fapSauf')}</option>
                                                    <option value="FAP_ABSOLUE">{t('amendments.create.coverageSection.fapAbsolue')}</option>
                                                </select>
                                                <div className="current-val">{t('amendments.create.coverageSection.current', { value: contract.coverage_type ?? '—' })}</div>
                                            </div>
                                        )}
                                        {selectedFields.includes('incoterm_code') && (
                                            <div className="grid gap-2">
                                                <Label className="am-label">{t('amendments.create.coverageSection.incoterm')}</Label>
                                                <Input className="h-11" value={data.incoterm_code}
                                                       onChange={e => setData('incoterm_code', e.target.value)}
                                                       placeholder={t('amendments.create.coverageSection.incotermPlaceholder')}/>
                                                <div className="current-val">{t('amendments.create.coverageSection.current', { value: contract.incoterm_code ?? '—' })}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Clauses & Exclusions */}
                        {selectedFields.some(f => listFields.includes(f)) && (
                            <div className="am-card">
                                <div className="am-card-hdr"><div className="am-card-ttl">{t('amendments.create.listsSection.title')}</div></div>
                                <div className="am-card-body">
                                    {selectedFields.includes('clauses') && (
                                        <div className="grid gap-2">
                                            <Label className="am-label">{t('amendments.create.listsSection.clauses')}</Label>
                                            <div className="tag-list">
                                                {data.clauses.map((c, i) => (
                                                    <span key={i} className="tag-chip">
                                                        {c}
                                                        <button type="button" onClick={() => removeFromList('clauses', i)}
                                                                style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', color:'#1d4ed8' }}>
                                                            <X size={10}/>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="tag-input-row">
                                                <input className="tag-input" value={clauseInput}
                                                       onChange={e => setClauseInput(e.target.value)}
                                                       onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('clauses', clauseInput, setClauseInput); }}}
                                                       placeholder={t('amendments.create.listsSection.clausesPlaceholder')}/>
                                                <button type="button" className="tag-add-btn"
                                                        onClick={() => addToList('clauses', clauseInput, setClauseInput)}>
                                                    <Plus size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {selectedFields.includes('exclusions') && (
                                        <div className="grid gap-2">
                                            <Label className="am-label">{t('amendments.create.listsSection.exclusions')}</Label>
                                            <div className="tag-list">
                                                {data.exclusions.map((e, i) => (
                                                    <span key={i} className="tag-chip excl">
                                                        {e}
                                                        <button type="button" onClick={() => removeFromList('exclusions', i)}
                                                                style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', color:'#dc2626' }}>
                                                            <X size={10}/>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="tag-input-row">
                                                <input className="tag-input" value={exclusionInput}
                                                       onChange={e => setExclusionInput(e.target.value)}
                                                       onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('exclusions', exclusionInput, setExclusionInput); }}}
                                                       placeholder={t('amendments.create.listsSection.exclusionsPlaceholder')}/>
                                                <button type="button" className="tag-add-btn"
                                                        onClick={() => addToList('exclusions', exclusionInput, setExclusionInput)}>
                                                    <Plus size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedFields.length === 0 && (
                            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#92400e' }}>
                                {t('amendments.create.noFieldsWarning')}
                            </div>
                        )}

                        <div style={{ display:'flex', gap:8 }}>
                            <Button type="submit" disabled={processing || selectedFields.length === 0}
                                    className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                {processing ? t('amendments.create.saving') : <><FileText size={14}/> {t('amendments.create.submit')}</>}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>{t('amendments.create.cancel')}</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}