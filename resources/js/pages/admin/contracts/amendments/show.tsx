import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    ArrowLeft, FileText, CheckCircle,
    XCircle, Send, X, AlertCircle,
    Clock, Tag,
} from 'lucide-react';

interface Amendment {
    id: string; amendment_number: string; sequence: number;
    reason: string; description: string | null;
    changes: Record<string, { before: any; after: any }>;
    status: string; review_notes: string | null;
    submitted_at: string | null; reviewed_at: string | null; applied_at: string | null;
    submitted_by: { first_name: string; last_name: string } | null;
    reviewed_by:  { first_name: string; last_name: string } | null;
    created_by:   { first_name: string; last_name: string } | null;
    created_at: string;
}
interface Contract {
    id: string; contract_number: string; insured_name: string;
    tenant: { name: string; code: string } | null;
}
interface Props {
    contract:  Contract;
    amendment: Amendment;
    can:       { validate: boolean; edit: boolean };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
    DRAFT:    { bg:'#f8fafc', color:'#64748b', dot:'#94a3b8' },
    PENDING:  { bg:'#fffbeb', color:'#92400e', dot:'#f59e0b' },
    APPROVED: { bg:'#f0fdf4', color:'#15803d', dot:'#22c55e' },
    REJECTED: { bg:'#fef2f2', color:'#dc2626', dot:'#ef4444' },
};

function ActionModal({ title, icon: Icon, color, actionLabel, onConfirm, onClose, requireReason = true }: any) {
    const { t } = useTranslation('contracts');
    const [reason, setReason] = useState('');
    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:440, border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:8, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Icon size={16} color={color}/>
                        </div>
                        <p style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>{title}</p>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={17}/></button>
                </div>
                <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                    {requireReason && (
                        <div>
                            <label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:6 }}>{t('amendments.show.modals.reasonLabel')}</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                                      style={{ width:'100%', padding:'10px 13px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
                        </div>
                    )}
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <Button variant="outline" onClick={onClose}>{t('amendments.show.modals.cancel')}</Button>
                        <Button onClick={() => onConfirm(reason)} disabled={requireReason && !reason.trim()}
                                style={{ background: color, color:'#fff', border:'none' }}>
                            {actionLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const formatValue = (field: string, value: any): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '—';
    if (field.includes('_date')) return new Date(value).toLocaleDateString('fr-FR');
    if (field === 'accessories_amount') return parseFloat(value).toLocaleString('fr-FR');
    if (field.includes('rate') || field === 'premium_rate') return `${value} %`;
    if (field === 'subscription_limit') return parseFloat(value).toLocaleString('fr-FR');
    return String(value);
};

export default function AmendmentShow({ contract, amendment, can }: Props) {
    const { t } = useTranslation('contracts');
    const [modal, setModal] = useState<string | null>(null);

    // premium_rate/rate_surprime/rate_accessories/subscription_limit :
    // conservés uniquement pour l'affichage lisible des avenants
    // historiques — ne sont plus amendables (cf. create.tsx).
    const FIELD_LABELS: Record<string, string> = {
        premium_rate:        t('amendmentFieldLabels.premium_rate'),
        rate_ro:             t('amendmentFieldLabels.rate_ro'),
        rate_rg:             t('amendmentFieldLabels.rate_rg'),
        rate_surprime:       t('amendmentFieldLabels.rate_surprime'),
        rate_accessories:    t('amendmentFieldLabels.rate_accessories'),
        accessories_amount:  t('amendmentFieldLabels.accessories_amount'),
        rate_tax:            t('amendmentFieldLabels.rate_tax'),
        subscription_limit:  t('amendmentFieldLabels.subscription_limit'),
        effective_date:      t('amendmentFieldLabels.effective_date'),
        expiry_date:         t('amendmentFieldLabels.expiry_date'),
        notice_period_days:  t('amendmentFieldLabels.notice_period_days'),
        clauses:             t('amendmentFieldLabels.clauses'),
        exclusions:          t('amendmentFieldLabels.exclusions'),
        broker_id:           t('amendmentFieldLabels.broker_id'),
        incoterm_code:       t('amendmentFieldLabels.incoterm_code'),
        coverage_type:       t('amendmentFieldLabels.coverage_type'),
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.contracts'),  href: '/admin/contracts' },
        { title: contract.contract_number, href: route('admin.contracts.show', { contract: contract.id }) },
        { title: t('breadcrumb.amendments'),  href: route('admin.contracts.amendments.index', { contract: contract.id }) },
        { title: amendment.amendment_number },
    ];

    const ss     = STATUS_STYLES[amendment.status] ?? STATUS_STYLES.DRAFT;
    const fmtDt  = (d: string) => new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const changesCount = Object.keys(amendment.changes).length;

    const action = (routeName: string, payload: Record<string, any> = {}) => {
        router.patch(route(routeName, { contract: contract.id, amendment: amendment.id }), payload);
        setModal(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('amendments.show.title', { number: amendment.amendment_number })}/>
            <style>{`
                .as-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .as-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:flex-start;gap:16px;position:relative;overflow:hidden;}
                .as-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .as-hero-num{font-size:20px;font-weight:700;color:#fff;font-family:monospace;margin-bottom:4px;}
                .as-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .as-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
                .as-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .as-card-hdr{padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .as-card-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .as-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .as-card-body{padding:20px;}
                .workflow-bar{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
                .btn-wf{padding:7px 14px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:5px;font-family:inherit;transition:all .13s;background:none;}
                .btn-submit{color:#1d4ed8;border-color:#bfdbfe;} .btn-submit:hover{background:#eff6ff;}
                .btn-approve{color:#15803d;border-color:#bbf7d0;} .btn-approve:hover{background:#f0fdf4;}
                .btn-reject{color:#dc2626;border-color:#fecaca;} .btn-reject:hover{background:#fef2f2;}

                /* Table des changements */
                .changes-table{width:100%;border-collapse:collapse;}
                .changes-table th{padding:8px 12px;background:#f8fafc;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em;text-align:left;border-bottom:1px solid #e2e8f0;}
                .changes-table td{padding:10px 12px;font-size:12px;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                .changes-table tr:last-child td{border-bottom:none;}
                .val-before{color:#dc2626;text-decoration:line-through;font-size:11px;}
                .val-after{color:#15803d;font-weight:600;}
                .arrow{color:#94a3b8;font-size:16px;padding:0 6px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="as-wrap">

                    {/* Hero */}
                    <div className="as-hero">
                        <div style={{ flex:1, position:'relative', zIndex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                                <Link href={route('admin.contracts.amendments.index', { contract: contract.id })}
                                      style={{ color:'rgba(255,255,255,0.6)', textDecoration:'none' }}>
                                    <ArrowLeft size={16}/>
                                </Link>
                                <FileText size={16} color="rgba(255,255,255,0.6)"/>
                            </div>
                            <div className="as-hero-num">{amendment.amendment_number}</div>
                            <div className="as-hero-sub">
                                {t('amendments.show.sequenceInfo', { sequence: amendment.sequence, contractNumber: contract.contract_number, tenant: contract.tenant?.name })}
                            </div>
                            <div style={{ display:'flex', gap:6, marginTop:8 }}>
                                <span className="as-badge" style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background: ss.dot }}/>{t(`amendmentStatusLabels.${amendment.status}`)}
                                </span>
                                <span className="as-badge" style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)' }}>
                                    {t('amendments.show.changesBadge', { count: changesCount })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Workflow */}
                    <div className="workflow-bar">
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:500 }}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background: ss.dot }}/>
                            {t(`amendmentStatusLabels.${amendment.status}`)}
                            {amendment.applied_at && (
                                <span style={{ fontSize:11, color:'#94a3b8' }}>
                                    {t('amendments.show.appliedOn', { date: fmtDt(amendment.applied_at) })}
                                </span>
                            )}
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                            {amendment.status === 'DRAFT' && can.edit && (
                                <button className="btn-wf btn-submit"
                                        onClick={() => action('admin.contracts.amendments.submit')}>
                                    <Send size={12}/> {t('amendments.show.submitForValidation')}
                                </button>
                            )}
                            {amendment.status === 'PENDING' && can.validate && (
                                <>
                                    <button className="btn-wf btn-approve" onClick={() => setModal('approve')}>
                                        <CheckCircle size={12}/> {t('amendments.show.approveApply')}
                                    </button>
                                    <button className="btn-wf btn-reject" onClick={() => setModal('reject')}>
                                        <XCircle size={12}/> {t('amendments.show.reject')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notes de révision */}
                    {amendment.review_notes && (
                        <div style={{
                            background: amendment.review_notes.startsWith('REJETÉ') ? '#fef2f2' : '#f0fdf4',
                            border: `1px solid ${amendment.review_notes.startsWith('REJETÉ') ? '#fecaca' : '#bbf7d0'}`,
                            borderRadius:9, padding:'10px 14px', fontSize:12,
                            color: amendment.review_notes.startsWith('REJETÉ') ? '#dc2626' : '#15803d',
                        }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, fontWeight:600, fontSize:11 }}>
                                <AlertCircle size={13}/>
                                {amendment.review_notes.startsWith('REJETÉ') ? t('amendments.show.rejectionReason') : t('amendments.show.approvalNotes')}
                            </div>
                            {amendment.review_notes}
                        </div>
                    )}

                    {/* Motif */}
                    <div className="as-card">
                        <div className="as-card-hdr">
                            <div className="as-card-ico" style={{ background:'#eff6ff' }}><FileText size={15} color="#3b82f6"/></div>
                            <span className="as-card-ttl">{t('amendments.show.reasonSection.title')}</span>
                        </div>
                        <div className="as-card-body">
                            <div style={{ fontSize:13, fontWeight:500, color:'#1e293b', marginBottom: amendment.description ? 8 : 0 }}>
                                {amendment.reason}
                            </div>
                            {amendment.description && (
                                <div style={{ fontSize:12, color:'#475569', lineHeight:1.6 }}>{amendment.description}</div>
                            )}
                        </div>
                    </div>

                    {/* Tableau des modifications */}
                    <div className="as-card">
                        <div className="as-card-hdr">
                            <div className="as-card-ico" style={{ background:'#fff7ed' }}><Tag size={15} color="#f97316"/></div>
                            <span className="as-card-ttl">{t('amendments.show.changesSection.title', { count: changesCount })}</span>
                        </div>
                        <div style={{ padding:0 }}>
                            <table className="changes-table">
                                <thead>
                                    <tr>
                                        <th>{t('amendments.show.changesSection.field')}</th>
                                        <th>{t('amendments.show.changesSection.before')}</th>
                                        <th></th>
                                        <th>{t('amendments.show.changesSection.after')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(amendment.changes).map(([field, change]) => (
                                        <tr key={field}>
                                            <td style={{ fontWeight:500, color:'#1e293b' }}>
                                                {FIELD_LABELS[field] ?? field}
                                            </td>
                                            <td className="val-before">
                                                {formatValue(field, change.before)}
                                            </td>
                                            <td className="arrow">→</td>
                                            <td className="val-after">
                                                {formatValue(field, change.after)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="as-card">
                        <div className="as-card-hdr">
                            <div className="as-card-ico" style={{ background:'#f8fafc' }}><Clock size={15} color="#64748b"/></div>
                            <span className="as-card-ttl">{t('amendments.show.history.title')}</span>
                        </div>
                        <div className="as-card-body">
                            {[
                                { date: amendment.created_at,   user: amendment.created_by,   label: t('amendments.show.history.created'),    color:'#94a3b8' },
                                { date: amendment.submitted_at,  user: amendment.submitted_by, label: t('amendments.show.history.submitted'),  color:'#f59e0b' },
                                { date: amendment.reviewed_at,   user: amendment.reviewed_by,  label: amendment.status === 'APPROVED' ? t('amendments.show.history.approved') : t('amendments.show.history.rejected'), color: amendment.status === 'APPROVED' ? '#16a34a' : '#dc2626' },
                            ].filter(e => e.date).map((event, i) => (
                                <div key={i} style={{ display:'flex', gap:12, marginBottom:12 }}>
                                    <div style={{ width:8, height:8, borderRadius:'50%', background: event.color, flexShrink:0, marginTop:4 }}/>
                                    <div>
                                        <span style={{ fontSize:12, fontWeight:500, color:'#1e293b' }}>{event.label}</span>
                                        {event.user && (
                                            <span style={{ fontSize:11, color:'#64748b', marginLeft:6 }}>
                                                {t('amendments.show.history.by', { name: `${event.user.first_name} ${event.user.last_name}` })}
                                            </span>
                                        )}
                                        <div style={{ fontSize:10, color:'#94a3b8' }}>
                                            {fmtDt(event.date!)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            {modal === 'approve' && (
                <ActionModal title={t('amendments.show.modals.approveTitle')} icon={CheckCircle} color="#15803d"
                    actionLabel={t('amendments.show.modals.approveAction')} requireReason={false}
                    onConfirm={(notes: string) => action('admin.contracts.amendments.approve', { notes })}
                    onClose={() => setModal(null)}/>
            )}
            {modal === 'reject' && (
                <ActionModal title={t('amendments.show.modals.rejectTitle')} icon={XCircle} color="#dc2626"
                    actionLabel={t('amendments.show.modals.rejectAction')}
                    onConfirm={(reason: string) => action('admin.contracts.amendments.reject', { reason })}
                    onClose={() => setModal(null)}/>
            )}
        </AppLayout>
    );
}