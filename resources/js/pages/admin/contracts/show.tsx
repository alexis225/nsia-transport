import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    ArrowLeft, Edit2, FileText, Calendar, Shield,
    Briefcase, DollarSign, TrendingUp,
    CheckCircle, XCircle, PauseCircle, StopCircle,
    PlayCircle, Send, X, AlertCircle, Tag,
} from 'lucide-react';
import ContractLimitWidget from '@/components/contract-limit-widget';

interface Contract {
    id: string; contract_number: string; type: string; status: string;
    insured_name: string; insured_address: string | null;
    insured_email: string | null; insured_phone: string | null;
    coverage_type: string | null; clauses: string[]; exclusions: string[];
    incoterm_code: string | null; transport_mode_detail: string | null;
    currency_code: string; subscription_limit: string | null;
    used_limit: string; premium_rate: string | null; deductible: string;
    rate_ro: string | null; rate_rg: string | null;
    rate_surprime: string | null; rate_accessories: string | null; rate_tax: string | null;
    effective_date: string; expiry_date: string; notice_period_days: number;
    requires_approval: boolean; validation_notes: string | null;
    certificates_count: number; certificates_limit: number | null;
    notes: string | null; created_at: string;
    approved_at: string | null; suspended_at: string | null;
    suspension_reason: string | null;
    tenant: { id: string; name: string; code: string; currency_code: string } | null;
    broker: { id: string; name: string; code: string; email: string | null; phone: string | null } | null;
    transport_mode: { code: string; name_fr: string } | null;
    created_by: { id: string; first_name: string; last_name: string } | null;
    approved_by: { id: string; first_name: string; last_name: string } | null;
}
interface Props {
    contract: Contract;
    can: { edit: boolean; validate: boolean; terminate: boolean };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    DRAFT:            { bg:'#f8fafc', color:'#64748b', label:'Brouillon',           dot:'#94a3b8' },
    PENDING_APPROVAL: { bg:'#fffbeb', color:'#92400e', label:'En attente appro.',   dot:'#f59e0b' },
    ACTIVE:           { bg:'#f0fdf4', color:'#15803d', label:'Actif',               dot:'#22c55e' },
    SUSPENDED:        { bg:'#fff7ed', color:'#c2410c', label:'Suspendu',            dot:'#f97316' },
    EXPIRED:          { bg:'#f8fafc', color:'#475569', label:'Expiré',              dot:'#64748b' },
    CANCELLED:        { bg:'#fef2f2', color:'#dc2626', label:'Annulé',              dot:'#ef4444' },
};

const TYPE_LABELS: Record<string, string> = {
    OPEN_POLICY:   'Police ouverte',
    VOYAGE:        'Au voyage',
    ANNUAL_VOYAGE: 'Annuel voyages',
};

const COVERAGE_LABELS: Record<string, string> = {
    TOUS_RISQUES: 'Tous risques',
    FAP_SAUF:     'FAP sauf',
    FAP_ABSOLUE:  'FAP absolue',
};

function ActionModal({ title, icon: Icon, color, actionLabel, onConfirm, onClose, requireReason = true }: any) {
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
                            <label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:6 }}>Motif *</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                                      style={{ width:'100%', padding:'10px 13px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, outline:'none', resize:'vertical', boxSizing:'border-box' }}
                                      placeholder="Précisez le motif…"/>
                        </div>
                    )}
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
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

export default function ContractShow({ contract, can }: Props) {
    const [modal, setModal] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Contrats', href: '/admin/contracts' },
        { title: contract.contract_number },
    ];

    const ss  = STATUS_STYLES[contract.status] ?? STATUS_STYLES.DRAFT;
    const fmt    = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
    const fmtDt  = (d: string) => new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

    const pct = contract.subscription_limit
        ? Math.min(100, Math.round((parseFloat(contract.used_limit) / parseFloat(contract.subscription_limit)) * 100))
        : 0;
    const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : '#22c55e';

    const action = (routeName: string, payload: Record<string, any> = {}) => {
        router.patch(route(routeName, { contract: contract.id }), payload);
        setModal(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${contract.contract_number} — NSIA Transport`}/>
            <style>{`
                .cs-wrap{width:100%;max-width:900px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .cs-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .cs-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .cs-hero-num{font-size:20px;font-weight:700;color:#fff;font-family:monospace;letter-spacing:.05em;margin-bottom:4px;}
                .cs-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .cs-hero-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
                .cs-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
                .cs-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .cs-card-hdr{padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .cs-card-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .cs-card-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .cs-card-body{padding:20px;}
                .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .info-item{display:flex;flex-direction:column;gap:3px;}
                .info-label{font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;}
                .info-value{font-size:13px;color:#1e293b;}
                .rate-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f8fafc;}
                .rate-row:last-child{border-bottom:none;}
                .tag-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:11px;color:#475569;margin:2px;}
                .workflow-bar{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
                .workflow-actions{display:flex;gap:8px;flex-wrap:wrap;}
                .btn-wf{padding:7px 14px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:5px;font-family:inherit;transition:all .13s;background:none;}
                .btn-submit{color:#1d4ed8;border-color:#bfdbfe;} .btn-submit:hover{background:#eff6ff;}
                .btn-approve{color:#15803d;border-color:#bbf7d0;} .btn-approve:hover{background:#f0fdf4;}
                .btn-reject{color:#dc2626;border-color:#fecaca;} .btn-reject:hover{background:#fef2f2;}
                .btn-suspend{color:#c2410c;border-color:#fed7aa;} .btn-suspend:hover{background:#fff7ed;}
                .btn-cancel{color:#dc2626;border-color:#fecaca;} .btn-cancel:hover{background:#fef2f2;}
                .btn-reactivate{color:#15803d;border-color:#bbf7d0;} .btn-reactivate:hover{background:#f0fdf4;}
                .usage-bar-wrap{height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;margin-top:4px;}
                .usage-bar-fill{height:100%;border-radius:3px;transition:width .3s;}
                .notes-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:9px;padding:10px 14px;font-size:12px;color:#15803d;}
                .notes-ko{background:#fef2f2;border:1px solid #fecaca;border-radius:9px;padding:10px 14px;font-size:12px;color:#dc2626;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="cs-wrap">

                    {/* Hero */}
                    <div className="cs-hero">
                        <div style={{ flex:1, position:'relative', zIndex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                                <Link href="/admin/contracts" style={{ color:'rgba(255,255,255,0.6)', textDecoration:'none' }}><ArrowLeft size={16}/></Link>
                                <FileText size={16} color="rgba(255,255,255,0.6)"/>
                            </div>
                            <div className="cs-hero-num">{contract.contract_number}</div>
                            <div className="cs-hero-sub">
                                {TYPE_LABELS[contract.type] ?? contract.type} · {contract.tenant?.name}
                            </div>
                            <div className="cs-hero-badges">
                                <span className="cs-badge" style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background: ss.dot }}/>{ss.label}
                                </span>
                                <span className="cs-badge" style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)' }}>
                                    <FileText size={10}/> {contract.certificates_count} cert.{contract.certificates_limit ? ` / ${contract.certificates_limit}` : ''}
                                </span>
                                {contract.coverage_type && (
                                    <span className="cs-badge" style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)' }}>
                                        <Shield size={10}/> {COVERAGE_LABELS[contract.coverage_type] ?? contract.coverage_type}
                                    </span>
                                )}
                            </div>
                        </div>
                        {can.edit && contract.status === 'DRAFT' && (
                            <div style={{ position:'relative', zIndex:1 }}>
                                <Link href={route('admin.contracts.edit', { contract: contract.id })}>
                                    <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 px-4 text-sm" variant="outline">
                                        <Edit2 size={13}/> Modifier
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Workflow */}
                    <div className="workflow-bar">
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:500, color:'#1e293b' }}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background: ss.dot }}/>
                            {ss.label}
                        </div>
                        <div className="workflow-actions">
                            {contract.status === 'DRAFT' && (
                                <button className="btn-wf btn-submit" onClick={() => action('admin.contracts.submit')}>
                                    <Send size={12}/> Soumettre
                                </button>
                            )}
                            {contract.status === 'PENDING_APPROVAL' && can.validate && (
                                <>
                                    <button className="btn-wf btn-approve" onClick={() => setModal('approve')}>
                                        <CheckCircle size={12}/> Approuver & Activer
                                    </button>
                                    <button className="btn-wf btn-reject" onClick={() => setModal('reject')}>
                                        <XCircle size={12}/> Rejeter
                                    </button>
                                </>
                            )}
                            {contract.status === 'ACTIVE' && can.edit && (
                                <button className="btn-wf btn-suspend" onClick={() => setModal('suspend')}>
                                    <PauseCircle size={12}/> Suspendre
                                </button>
                            )}
                            {contract.status === 'SUSPENDED' && can.validate && (
                                <button className="btn-wf btn-reactivate" onClick={() => action('admin.contracts.reactivate')}>
                                    <PlayCircle size={12}/> Réactiver
                                </button>
                            )}
                            {['ACTIVE','SUSPENDED'].includes(contract.status) && can.terminate && (
                                <button className="btn-wf btn-cancel" onClick={() => setModal('cancel')}>
                                    <StopCircle size={12}/> Annuler le contrat
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notes validation */}
                    {contract.validation_notes && (
                        <div className={contract.validation_notes.startsWith('REJETÉ') ? 'notes-ko' : 'notes-ok'}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                                <AlertCircle size={13}/>
                                <span style={{ fontWeight:600, fontSize:11 }}>
                                    {contract.validation_notes.startsWith('REJETÉ') ? 'Motif de rejet' : 'Notes d\'approbation'}
                                </span>
                            </div>
                            {contract.validation_notes}
                        </div>
                    )}

                    {/* Utilisation plafond */}
                    {contract.subscription_limit && (
                        <div className="cs-card">
                            <div className="cs-card-hdr">
                                <div className="cs-card-ico" style={{ background:'#fffbeb' }}><TrendingUp size={15} color="#f59e0b"/></div>
                                <span className="cs-card-ttl">Utilisation du plafond NN300</span>
                            </div>
                            <div className="cs-card-body">
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                                    <span style={{ fontSize:13, color:'#64748b' }}>
                                        {parseFloat(contract.used_limit).toLocaleString('fr-FR')} / {parseFloat(contract.subscription_limit).toLocaleString('fr-FR')} {contract.currency_code}
                                    </span>
                                    <span style={{ fontSize:14, fontWeight:700, color: barColor }}>{pct}%</span>
                                </div>
                                <div className="usage-bar-wrap">
                                    <div className="usage-bar-fill" style={{ width:`${pct}%`, background: barColor }}/>
                                </div>
                                {pct >= 90 && (
                                    <p style={{ fontSize:11, color:'#dc2626', marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
                                        <AlertCircle size={11}/> Plafond presque atteint
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Assuré + Courtier */}
                    <div className="cs-card">
                        <div className="cs-card-hdr">
                            <div className="cs-card-ico" style={{ background:'#eff6ff' }}><Briefcase size={15} color="#3b82f6"/></div>
                            <span className="cs-card-ttl">Assuré & Courtier</span>
                        </div>
                        <div className="cs-card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Assuré</span>
                                    <span className="info-value" style={{ fontWeight:500 }}>{contract.insured_name}</span>
                                    {contract.insured_email && <span style={{ fontSize:11, color:'#64748b' }}>{contract.insured_email}</span>}
                                    {contract.insured_phone && <span style={{ fontSize:11, color:'#64748b' }}>{contract.insured_phone}</span>}
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Courtier</span>
                                    <span className="info-value">{contract.broker?.name ?? '—'}</span>
                                    {contract.broker?.email && <span style={{ fontSize:11, color:'#64748b' }}>{contract.broker.email}</span>}
                                </div>
                                {contract.insured_address && (
                                    <div className="info-item" style={{ gridColumn:'1/-1' }}>
                                        <span className="info-label">Adresse</span>
                                        <span className="info-value">{contract.insured_address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Période + Garanties */}
                    <div className="info-grid">
                        <div className="cs-card">
                            <div className="cs-card-hdr">
                                <div className="cs-card-ico" style={{ background:'#f0fdf4' }}><Calendar size={15} color="#16a34a"/></div>
                                <span className="cs-card-ttl">Période de validité</span>
                            </div>
                            <div className="cs-card-body">
                                <div className="info-item" style={{ marginBottom:10 }}>
                                    <span className="info-label">Date d'effet</span>
                                    <span className="info-value">{fmt(contract.effective_date)}</span>
                                </div>
                                <div className="info-item" style={{ marginBottom:10 }}>
                                    <span className="info-label">Date d'expiration</span>
                                    <span className="info-value">{fmt(contract.expiry_date)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Préavis résiliation</span>
                                    <span className="info-value">{contract.notice_period_days} jours</span>
                                </div>
                            </div>
                        </div>
                        <div className="cs-card">
                            <div className="cs-card-hdr">
                                <div className="cs-card-ico" style={{ background:'#fdf4ff' }}><Shield size={15} color="#7c3aed"/></div>
                                <span className="cs-card-ttl">Transport & Couverture</span>
                            </div>
                            <div className="cs-card-body">
                                <div className="info-item" style={{ marginBottom:10 }}>
                                    <span className="info-label">Couverture</span>
                                    <span className="info-value">{COVERAGE_LABELS[contract.coverage_type ?? ''] ?? '—'}</span>
                                </div>
                                <div className="info-item" style={{ marginBottom:10 }}>
                                    <span className="info-label">Incoterm</span>
                                    <span className="info-value">{contract.incoterm_code ?? '—'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Mode transport</span>
                                    <span className="info-value">{contract.transport_mode?.name_fr ?? '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clauses & Exclusions */}
                    {((contract.clauses?.length ?? 0) > 0 || (contract.exclusions?.length ?? 0) > 0) && (
                        <div className="info-grid">
                            {(contract.clauses?.length ?? 0) > 0 && (
                                <div className="cs-card">
                                    <div className="cs-card-hdr">
                                        <div className="cs-card-ico" style={{ background:'#f0fdf4' }}><Tag size={15} color="#16a34a"/></div>
                                        <span className="cs-card-ttl">Clauses</span>
                                    </div>
                                    <div className="cs-card-body">
                                        {contract.clauses.map((c, i) => <span key={i} className="tag-chip">{c}</span>)}
                                    </div>
                                </div>
                            )}
                            {(contract.exclusions?.length ?? 0) > 0 && (
                                <div className="cs-card">
                                    <div className="cs-card-hdr">
                                        <div className="cs-card-ico" style={{ background:'#fef2f2' }}><Tag size={15} color="#dc2626"/></div>
                                        <span className="cs-card-ttl">Exclusions</span>
                                    </div>
                                    <div className="cs-card-body">
                                        {contract.exclusions.map((e, i) => <span key={i} className="tag-chip" style={{ background:'#fef2f2', borderColor:'#fecaca', color:'#dc2626' }}>{e}</span>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Conditions financières */}
                    <div className="cs-card">
                        <div className="cs-card-hdr">
                            <div className="cs-card-ico" style={{ background:'#fffbeb' }}><DollarSign size={15} color="#f59e0b"/></div>
                            <span className="cs-card-ttl">Conditions financières</span>
                        </div>
                        <div className="cs-card-body">
                            <div className="info-grid" style={{ marginBottom:14 }}>
                                <div className="info-item">
                                    <span className="info-label">Devise</span>
                                    <span className="info-value" style={{ fontFamily:'monospace', fontWeight:600 }}>{contract.currency_code}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Plafond NN300</span>
                                    <span className="info-value">
                                        {contract.subscription_limit
                                            ? parseFloat(contract.subscription_limit).toLocaleString('fr-FR') + ' ' + contract.currency_code
                                            : 'Illimité'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Taux prime global</span>
                                    <span className="info-value">{contract.premium_rate ? `${contract.premium_rate} %` : '—'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Franchise</span>
                                    <span className="info-value">{parseFloat(contract.deductible ?? '0').toLocaleString('fr-FR')} {contract.currency_code}</span>
                                </div>
                            </div>
                            <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:12 }}>
                                <div style={{ fontSize:10.5, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Taux détaillés</div>
                                {[
                                    { label:'R.O.',        value: contract.rate_ro },
                                    { label:'R.G.',        value: contract.rate_rg },
                                    { label:'Surprime',    value: contract.rate_surprime },
                                    { label:'Accessoires', value: contract.rate_accessories },
                                    { label:'Taxe',        value: contract.rate_tax },
                                ].map(({ label, value }) => value ? (
                                    <div key={label} className="rate-row">
                                        <span style={{ fontSize:12, color:'#64748b' }}>{label}</span>
                                        <span style={{ fontSize:13, fontWeight:600, color:'#1e293b', fontFamily:'monospace' }}>{value} %</span>
                                    </div>
                                ) : null)}
                            </div>
                        </div>
                    </div>

                    {/* Plafond NN300 — US-027 */}
                    {contract.subscription_limit && (
                        <ContractLimitWidget
                            contractId={contract.id}
                            initialStatus={{
                                subscription_limit:  parseFloat(contract.subscription_limit),
                                used_limit:          parseFloat(contract.used_limit),
                                remaining_limit:     Math.max(0, parseFloat(contract.subscription_limit) - parseFloat(contract.used_limit)),
                                usage_percent:       pct,
                                certificates_count:  contract.certificates_count,
                                certificates_limit:  contract.certificates_limit,
                                alert_level:         pct >= 95 ? 'critical' : pct >= 80 ? 'warning' : 'ok',
                                can_issue:           contract.status === 'ACTIVE',
                                currency_code:       contract.currency_code,
                                recent_certs:        [],
                                updated_at:          new Date().toISOString(),
                            }}
                        />
                    )}

                    {/* Notes */}
                    {contract.notes && (
                        <div className="cs-card">
                            <div className="cs-card-hdr">
                                <div className="cs-card-ico" style={{ background:'#f8fafc' }}><FileText size={15} color="#64748b"/></div>
                                <span className="cs-card-ttl">Notes internes</span>
                            </div>
                            <div className="cs-card-body">
                                <p style={{ fontSize:13, color:'#475569', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{contract.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Méta */}
                    <div style={{ fontSize:11, color:'#94a3b8', display:'flex', gap:16, flexWrap:'wrap', padding:'4px 0' }}>
                        {contract.created_by && <span>Créé par {contract.created_by.first_name} {contract.created_by.last_name}</span>}
                        {contract.approved_by && <span>· Approuvé par {contract.approved_by.first_name} {contract.approved_by.last_name}{contract.approved_at && ` le ${fmtDt(contract.approved_at)}`}</span>}
                        {contract.suspended_at && <span>· Suspendu le {fmtDt(contract.suspended_at)}</span>}
                    </div>

                </div>
            </div>

            {/* Modals */}
            {modal === 'approve' && <ActionModal title="Approuver et activer" icon={CheckCircle} color="#15803d" actionLabel="Approuver & Activer" requireReason={false} onConfirm={(notes: string) => action('admin.contracts.approve', { notes })} onClose={() => setModal(null)}/>}
            {modal === 'reject'  && <ActionModal title="Rejeter le contrat"   icon={XCircle}      color="#dc2626" actionLabel="Rejeter"            onConfirm={(reason: string) => action('admin.contracts.reject',  { reason })} onClose={() => setModal(null)}/>}
            {modal === 'suspend' && <ActionModal title="Suspendre le contrat" icon={PauseCircle}  color="#c2410c" actionLabel="Suspendre"          onConfirm={(reason: string) => action('admin.contracts.suspend', { reason })} onClose={() => setModal(null)}/>}
            {modal === 'cancel'  && <ActionModal title="Annuler le contrat"   icon={StopCircle}   color="#dc2626" actionLabel="Annuler définitivement" onConfirm={(reason: string) => action('admin.contracts.cancel', { reason })} onClose={() => setModal(null)}/>}
        </AppLayout>
    );
}