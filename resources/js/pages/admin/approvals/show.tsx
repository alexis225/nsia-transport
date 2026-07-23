import { Head, Link, router } from '@inertiajs/react';
import {
    TrendingUp, CheckCircle, XCircle, Clock,
    AlertTriangle, ArrowRight, X, Shield,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Escalades NN300', href: '/admin/approvals' },
    { title: 'Décision' },
];

interface Decision {
    level: number; decision: string; notes: string | null;
    decided_at: string;
    approver: { name: string } | null;
}
interface Workflow {
    id: string; current_level: number; status: string;
    certificate_value: number; contract_value: number;
    threshold_pct: number; threshold_amount: number | null;
    triggered_at: string; expires_at: string;
    hours_left: number; is_overdue: boolean;
    certificate: { id: string; certificate_number: string; insured_name: string; insured_value: number; currency_code: string } | null;
    contract: { id: string; contract_number: string; insured_name: string; insured_value: number; threshold_pct: number } | null;
    tenant: { name: string; code: string } | null;
    triggered_by: { name: string } | null;
    decisions: Decision[];
}
interface Props {
    workflow: Workflow;
    can:      { approve: boolean; reject: boolean };
}

const LEVEL_LABELS: Record<number, string> = {
    1: 'Admin Filiale',
    2: 'Super Admin (DTAG)',
};

const DECISION_STYLES: Record<string, { color: string; bg: string; label: string }> = {
    APPROVED:  { color:'#15803d', bg:'#f0fdf4', label:'Approuvé' },
    REJECTED:  { color:'#dc2626', bg:'#fef2f2', label:'Rejeté' },
    ESCALATED: { color:'#f59e0b', bg:'#fffbeb', label:'Escaladé' },
    EXPIRED:   { color:'#94a3b8', bg:'#f8fafc', label:'Expiré' },
};

const fmt    = (n: number, c: string) => n.toLocaleString('fr-FR', { maximumFractionDigits:0 }) + ' ' + c;
const fmtDt  = (d: string) => new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

function ActionModal({ type, onConfirm, onClose }: { type: 'approve' | 'reject'; onConfirm: (v: string) => void; onClose: () => void }) {
    const [value, setValue] = useState('');
    const isApprove = type === 'approve';

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:460, border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:8, background: isApprove ? '#f0fdf4' : '#fef2f2', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {isApprove ? <CheckCircle size={16} color="#15803d"/> : <XCircle size={16} color="#dc2626"/>}
                        </div>
                        <span style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>
                            {isApprove ? 'Approuver l\'escalade' : 'Rejeter l\'escalade'}
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={17}/></button>
                </div>
                <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                    {isApprove && (
                        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#15803d' }}>
                            En approuvant, {workflow_level_label()} recevra la décision. Si c'est le niveau 2, le certificat sera émis automatiquement.
                        </div>
                    )}
                    <div>
                        <label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:6 }}>
                            {isApprove ? 'Notes (facultatif)' : 'Motif de rejet *'}
                        </label>
                        <textarea value={value} onChange={e => setValue(e.target.value)} rows={3}
                                  style={{ width:'100%', padding:'10px 13px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, outline:'none', resize:'vertical', boxSizing:'border-box' }}
                                  placeholder={isApprove ? 'Commentaires éventuels…' : 'Précisez le motif du rejet…'}/>
                    </div>
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button disabled={!isApprove && !value.trim()}
                                onClick={() => onConfirm(value)}
                                style={{ background: isApprove ? '#15803d' : '#dc2626', color:'#fff', border:'none' }}>
                            {isApprove ? <><CheckCircle size={13}/> Approuver</> : <><XCircle size={13}/> Rejeter</>}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function workflow_level_label() {
 return ''; 
}

export default function ApprovalShow({ workflow, can }: Props) {
    const [modal, setModal] = useState<'approve' | 'reject' | null>(null);

    const action = (routeName: string, payload: Record<string, any>) => {
        router.patch(route(routeName, { workflow: workflow.id }), payload);
        setModal(null);
    };

    const cert  = workflow.certificate;
    const contr = workflow.contract;

    const excessAmount = cert && workflow.threshold_amount != null ? cert.insured_value - workflow.threshold_amount : 0;
    const excessPct    = contr ? ((cert?.insured_value ?? 0) / (contr.insured_value) * 100).toFixed(1) : '0';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Escalade NN300 — Décision"/>
            <style>{`
                .ap-wrap{width:100%;max-width:800px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .ap-hero{background:linear-gradient(135deg,#7c1f1f 0%,#991b1b 100%);border-radius:16px;padding:22px 24px;position:relative;overflow:hidden;}
                .ap-hero::before{content:'';position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.06);}
                .ap-hero-title{font-size:20px;font-weight:700;color:#fff;margin-bottom:4px;}
                .ap-hero-sub{font-size:12px;color:rgba(255,255,255,0.6);}
                .ap-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
                .ap-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .ap-card-hdr{padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .ap-card-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .ap-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .ap-card-body{padding:20px;display:flex;flex-direction:column;gap:12px;}
                .ap-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f8fafc;}
                .ap-row:last-child{border-bottom:none;}
                .ap-label{font-size:12px;color:#64748b;}
                .ap-value{font-size:12px;font-weight:600;color:#1e293b;font-family:monospace;}
                .progress-bar{height:10px;background:#fee2e2;border-radius:5px;overflow:hidden;margin-top:6px;}
                .progress-fill{height:100%;border-radius:5px;background:#dc2626;}
                .timer-card{background:linear-gradient(135deg,#fff7ed,#fffbeb);border:1.5px solid #fde68a;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px;}
                .timer-overdue{background:linear-gradient(135deg,#fef2f2,#fff5f5);border-color:#fecaca;}
                .level-steps{display:flex;align-items:center;gap:8px;}
                .level-step{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:500;}
                .level-active{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;}
                .level-done{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}
                .level-wait{background:#f8fafc;color:#94a3b8;border:1px solid #e2e8f0;}
                .btn-approve{padding:10px 20px;border-radius:9px;background:#15803d;color:#fff;border:none;cursor:pointer;font-size:13px;font-family:inherit;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:all .13s;}
                .btn-approve:hover{background:#166534;}
                .btn-reject{padding:10px 20px;border-radius:9px;background:none;color:#dc2626;border:1.5px solid #fecaca;cursor:pointer;font-size:13px;font-family:inherit;font-weight:500;display:inline-flex;align-items:center;gap:6px;transition:all .13s;}
                .btn-reject:hover{background:#fef2f2;}
                .decision-row{display:flex;gap:12px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #f8fafc;}
                .decision-row:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ap-wrap">

                    {/* Hero */}
                    <div className="ap-hero">
                        <div style={{ position:'relative', zIndex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                                <TrendingUp size={18} color="rgba(255,255,255,0.7)"/>
                                <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em' }}>
                                    Escalade NN300
                                </span>
                            </div>
                            <div className="ap-hero-title">
                                {cert?.certificate_number ?? '—'} — Dépassement seuil {workflow.threshold_pct}%
                            </div>
                            <div className="ap-hero-sub">
                                {cert?.insured_name} · {workflow.tenant?.name}
                            </div>
                            <div style={{ display:'flex', gap:8, marginTop:10 }}>
                                <span className="ap-badge" style={{ background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}>
                                    Niveau {workflow.current_level} — {LEVEL_LABELS[workflow.current_level]}
                                </span>
                                {workflow.is_overdue && (
                                    <span className="ap-badge" style={{ background:'rgba(239,68,68,0.3)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.4)' }}>
                                        <AlertTriangle size={10}/> Délai dépassé
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Étapes du workflow */}
                    <div className="ap-card">
                        <div className="ap-card-hdr">
                            <div className="ap-card-ico" style={{ background:'#f8fafc' }}><Shield size={14} color="#64748b"/></div>
                            <span className="ap-card-ttl">Progression du workflow</span>
                        </div>
                        <div style={{ padding:'16px 20px' }}>
                            <div className="level-steps">
                                <div className={`level-step ${workflow.current_level === 1 && workflow.status === 'PENDING' ? 'level-active' : workflow.decisions.some(d => d.level === 1) ? 'level-done' : 'level-wait'}`}>
                                    {workflow.decisions.some(d => d.level === 1 && d.decision !== 'EXPIRED')
                                        ? <CheckCircle size={11}/>
                                        : <Clock size={11}/>}
                                    Admin Filiale
                                </div>
                                <ArrowRight size={14} color="#94a3b8"/>
                                <div className={`level-step ${workflow.current_level === 2 && workflow.status === 'PENDING' ? 'level-active' : workflow.status === 'APPROVED' ? 'level-done' : 'level-wait'}`}>
                                    {workflow.status === 'APPROVED' ? <CheckCircle size={11}/> : <Clock size={11}/>}
                                    Super Admin
                                </div>
                                <ArrowRight size={14} color="#94a3b8"/>
                                <div className={`level-step ${workflow.status === 'APPROVED' ? 'level-done' : 'level-wait'}`}>
                                    {workflow.status === 'APPROVED' ? <CheckCircle size={11}/> : <Shield size={11}/>}
                                    Émission auto
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className={`timer-card ${workflow.is_overdue ? 'timer-overdue' : ''}`}>
                        <Clock size={22} color={workflow.is_overdue ? '#dc2626' : '#f59e0b'}/>
                        <div>
                            <div style={{ fontSize:13, fontWeight:600, color: workflow.is_overdue ? '#dc2626' : '#92400e' }}>
                                {workflow.is_overdue
                                    ? 'Délai dépassé — escalade automatique en cours'
                                    : `Il reste ${workflow.hours_left.toFixed(1)}h ouvrables pour décider`}
                            </div>
                            <div style={{ fontSize:11, color:'#94a3b8' }}>
                                Expire le {fmtDt(workflow.expires_at)}
                            </div>
                        </div>
                    </div>

                    {/* Valeurs */}
                    <div className="ap-card">
                        <div className="ap-card-hdr">
                            <div className="ap-card-ico" style={{ background:'#fef2f2' }}><TrendingUp size={14} color="#dc2626"/></div>
                            <span className="ap-card-ttl">Analyse du dépassement</span>
                        </div>
                        <div className="ap-card-body">
                            <div className="ap-row">
                                <span className="ap-label">Valeur du certificat</span>
                                <span className="ap-value" style={{ color:'#dc2626' }}>
                                    {fmt(cert?.insured_value ?? 0, cert?.currency_code ?? 'XOF')}
                                </span>
                            </div>
                            <div className="ap-row">
                                <span className="ap-label">Seuil d'escalade ({workflow.threshold_pct}% du contrat)</span>
                                <span className="ap-value">
                                    {workflow.threshold_amount != null ? fmt(workflow.threshold_amount, cert?.currency_code ?? 'XOF') : '—'}
                                </span>
                            </div>
                            <div className="ap-row">
                                <span className="ap-label">Dépassement</span>
                                <span className="ap-value" style={{ color:'#dc2626' }}>
                                    + {fmt(excessAmount, cert?.currency_code ?? 'XOF')}
                                </span>
                            </div>
                            <div className="ap-row">
                                <span className="ap-label">Valeur du contrat</span>
                                <span className="ap-value">
                                    {fmt(contr?.insured_value ?? 0, cert?.currency_code ?? 'XOF')}
                                </span>
                            </div>
                            <div>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                                    <span style={{ fontSize:11, color:'#64748b' }}>Ratio certificat / contrat</span>
                                    <span style={{ fontSize:12, fontWeight:700, color:'#dc2626' }}>{excessPct}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width:`${Math.min(100, Number(excessPct))}%` }}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Certificat */}
                    {cert && (
                        <div className="ap-card">
                            <div className="ap-card-hdr">
                                <div className="ap-card-ico" style={{ background:'#eff6ff' }}><Shield size={14} color="#3b82f6"/></div>
                                <span className="ap-card-ttl">Certificat concerné</span>
                                <Link href={route('admin.certificates.show', { certificate: cert.id })}
                                      style={{ marginLeft:'auto', fontSize:11, color:'#1d4ed8', textDecoration:'none' }}>
                                    Voir le certificat →
                                </Link>
                            </div>
                            <div className="ap-card-body">
                                <div className="ap-row">
                                    <span className="ap-label">N° Certificat</span>
                                    <span className="ap-value">{cert.certificate_number}</span>
                                </div>
                                <div className="ap-row">
                                    <span className="ap-label">Assuré</span>
                                    <span style={{ fontSize:12, fontWeight:500, color:'#1e293b' }}>{cert.insured_name}</span>
                                </div>
                                <div className="ap-row">
                                    <span className="ap-label">Soumis par</span>
                                    <span style={{ fontSize:12, color:'#64748b' }}>
                                        {workflow.triggered_by?.name ?? '—'} · {fmtDt(workflow.triggered_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Historique décisions */}
                    {workflow.decisions.length > 0 && (
                        <div className="ap-card">
                            <div className="ap-card-hdr">
                                <div className="ap-card-ico" style={{ background:'#f8fafc' }}><Clock size={14} color="#64748b"/></div>
                                <span className="ap-card-ttl">Historique des décisions</span>
                            </div>
                            <div style={{ padding:'14px 20px' }}>
                                {workflow.decisions.map((d, i) => {
                                    const ds = DECISION_STYLES[d.decision] ?? DECISION_STYLES.EXPIRED;

                                    return (
                                        <div key={i} className="decision-row">
                                            <div style={{ width:8, height:8, borderRadius:'50%', background: ds.color, flexShrink:0, marginTop:4 }}/>
                                            <div style={{ flex:1 }}>
                                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                    <span style={{ fontSize:12, fontWeight:500, color:'#1e293b' }}>
                                                        Niveau {d.level} — {ds.label}
                                                    </span>
                                                    <span style={{ fontSize:10, color:'#94a3b8' }}>{fmtDt(d.decided_at)}</span>
                                                </div>
                                                {d.approver && (
                                                    <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>par {d.approver.name}</div>
                                                )}
                                                {d.notes && (
                                                    <div style={{ fontSize:11, color:'#475569', marginTop:4, fontStyle:'italic' }}>{d.notes}</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Boutons d'action */}
                    {can.approve && workflow.status === 'PENDING' && (
                        <div style={{ display:'flex', gap:10, padding:'4px 0' }}>
                            <button className="btn-approve" onClick={() => setModal('approve')}>
                                <CheckCircle size={15}/> Approuver
                            </button>
                            <button className="btn-reject" onClick={() => setModal('reject')}>
                                <XCircle size={15}/> Rejeter
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {modal && (
                <ActionModal
                    type={modal}
                    onConfirm={(value) => {
                        if (modal === 'approve') {
                            action('admin.approvals.approve', { notes: value });
                        } else {
                            action('admin.approvals.reject', { reason: value });
                        }
                    }}
                    onClose={() => setModal(null)}
                />
            )}
        </AppLayout>
    );
}