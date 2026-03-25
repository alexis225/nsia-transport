import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    ArrowLeft, Edit2, Award, Send, CheckCircle,
    XCircle, StopCircle, X, FileText,
    Ship, Plane, Truck, MapPin, DollarSign,
    AlertCircle, Printer,
} from 'lucide-react';

interface ExpeditionItem {
    marks: string; package_numbers: string; package_count: number;
    weight: string; nature: string; packaging: string; insured_value: number;
}
interface PrimeLine {
    key: string; label: string; label_en: string | null;
    rate: number; amount: number;
}
interface Certificate {
    id: string; certificate_number: string; policy_number: string;
    status: string; insured_name: string; insured_ref: string | null;
    voyage_date: string; voyage_from: string; voyage_to: string;
    voyage_via: string | null; transport_type: string | null;
    vessel_name: string | null; flight_number: string | null; voyage_mode: string | null;
    expedition_items: ExpeditionItem[];
    currency_code: string; insured_value: string; insured_value_letters: string | null;
    guarantee_mode: string | null; prime_breakdown: PrimeLine[] | null; prime_total: string | null;
    exchange_currency: string | null; exchange_rate: string | null;
    validation_notes: string | null; cancellation_reason: string | null;
    submitted_at: string | null; issued_at: string | null; cancelled_at: string | null;
    pdf_path: string | null; created_at: string;
    tenant: { id: string; name: string; code: string } | null;
    contract: { id: string; contract_number: string; insured_name: string } | null;
    template: { name: string; is_bilingual: boolean } | null;
    submitted_by: { first_name: string; last_name: string } | null;
    issued_by:    { first_name: string; last_name: string } | null;
    created_by:   { first_name: string; last_name: string } | null;
}
interface Props {
    certificate: Certificate;
    can: { edit: boolean; validate: boolean; cancel: boolean };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    DRAFT:     { bg:'#f8fafc', color:'#64748b', label:'Brouillon',  dot:'#94a3b8' },
    SUBMITTED: { bg:'#fffbeb', color:'#92400e', label:'Soumis',     dot:'#f59e0b' },
    ISSUED:    { bg:'#f0fdf4', color:'#15803d', label:'Émis',       dot:'#22c55e' },
    CANCELLED: { bg:'#fef2f2', color:'#dc2626', label:'Annulé',     dot:'#ef4444' },
};

const TRANSPORT_LABELS: Record<string, string> = {
    SEA: 'Maritime', AIR: 'Aérien', ROAD: 'Routier', RAIL: 'Ferroviaire', MULTIMODAL: 'Multimodal',
};

function ActionModal({ title, icon: Icon, color, actionLabel, onConfirm, onClose, requireReason = true }: any) {
    const [reason, setReason] = useState('');
    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:440, border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:8, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={16} color={color}/></div>
                        <p style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>{title}</p>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={17}/></button>
                </div>
                <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                    {requireReason && (
                        <div>
                            <label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:6 }}>Motif *</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                                      style={{ width:'100%', padding:'10px 13px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
                        </div>
                    )}
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button onClick={() => onConfirm(reason)} disabled={requireReason && !reason.trim()} style={{ background: color, color:'#fff', border:'none' }}>{actionLabel}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CertificateShow({ certificate, can }: Props) {
    const [modal, setModal] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Certificats', href: '/admin/certificates' },
        { title: certificate.certificate_number },
    ];

    const ss    = STATUS_STYLES[certificate.status] ?? STATUS_STYLES.DRAFT;
    const fmt   = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
    const fmtDt = (d: string) => new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

    const action = (routeName: string, payload: Record<string, any> = {}) => {
        router.patch(route(routeName, { certificate: certificate.id }), payload);
        setModal(null);
    };

    const totalItems = certificate.expedition_items?.reduce((s, i) => s + (i.insured_value || 0), 0) ?? 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${certificate.certificate_number} — NSIA Transport`}/>
            <style>{`
                .cs-wrap{width:100%;max-width:960px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .cs-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:flex-start;gap:16px;position:relative;overflow:hidden;}
                .cs-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .cs-hero-num{font-size:22px;font-weight:700;color:#fff;font-family:monospace;letter-spacing:.08em;margin-bottom:4px;}
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

                /* Tableau expédition */
                .exp-table{width:100%;border-collapse:collapse;font-size:12px;}
                .exp-table th{padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em;text-align:left;}
                .exp-table td{padding:8px 10px;border:1px solid #e2e8f0;color:#334155;}
                .exp-table tr:last-child td{font-weight:600;background:#f8fafc;}

                /* Décompte prime */
                .prime-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f8fafc;}
                .prime-row:last-child{border-bottom:none;font-weight:700;}

                /* Workflow */
                .workflow-bar{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
                .btn-wf{padding:7px 14px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:5px;font-family:inherit;transition:all .13s;background:none;}
                .btn-submit{color:#1d4ed8;border-color:#bfdbfe;} .btn-submit:hover{background:#eff6ff;}
                .btn-issue{color:#15803d;border-color:#bbf7d0;} .btn-issue:hover{background:#f0fdf4;}
                .btn-reject{color:#dc2626;border-color:#fecaca;} .btn-reject:hover{background:#fef2f2;}
                .btn-cancel{color:#dc2626;border-color:#fecaca;} .btn-cancel:hover{background:#fef2f2;}
                .notes-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:9px;padding:10px 14px;font-size:12px;color:#15803d;}
                .notes-ko{background:#fef2f2;border:1px solid #fecaca;border-radius:9px;padding:10px 14px;font-size:12px;color:#dc2626;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="cs-wrap">

                    {/* Hero */}
                    <div className="cs-hero">
                        <div style={{ flex:1, position:'relative', zIndex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                                <Link href="/admin/certificates" style={{ color:'rgba(255,255,255,0.6)', textDecoration:'none' }}><ArrowLeft size={16}/></Link>
                                <Award size={16} color="rgba(255,255,255,0.6)"/>
                            </div>
                            <div className="cs-hero-num">{certificate.certificate_number}</div>
                            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>
                                Police : {certificate.policy_number} · {certificate.tenant?.name}
                            </div>
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                <span className="cs-badge" style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background: ss.dot }}/>{ss.label}
                                </span>
                                {certificate.transport_type && (
                                    <span className="cs-badge" style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)' }}>
                                        {TRANSPORT_LABELS[certificate.transport_type] ?? certificate.transport_type}
                                    </span>
                                )}
                                <span className="cs-badge" style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)' }}>
                                    <DollarSign size={10}/>
                                    {parseFloat(certificate.insured_value).toLocaleString('fr-FR')} {certificate.currency_code}
                                </span>
                            </div>
                        </div>
                        <div style={{ position:'relative', zIndex:1, display:'flex', gap:8 }}>
                            <Button variant="outline" onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 px-4 text-sm">
                                <Printer size={13}/> Imprimer
                            </Button>
                            {can.edit && certificate.status === 'DRAFT' && (
                                <Link href={route('admin.certificates.edit', { certificate: certificate.id })}>
                                    <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 px-4 text-sm" variant="outline">
                                        <Edit2 size={13}/> Modifier
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Workflow */}
                    <div className="workflow-bar">
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:500 }}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background: ss.dot }}/>
                            {ss.label}
                            {certificate.issued_at && <span style={{ fontSize:11, color:'#94a3b8' }}>émis le {fmtDt(certificate.issued_at)}</span>}
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                            {certificate.status === 'DRAFT' && can.edit && (
                                <button className="btn-wf btn-submit" onClick={() => action('admin.certificates.submit')}>
                                    <Send size={12}/> Soumettre pour émission
                                </button>
                            )}
                            {certificate.status === 'SUBMITTED' && can.validate && (
                                <>
                                    <button className="btn-wf btn-issue" onClick={() => setModal('issue')}>
                                        <CheckCircle size={12}/> Émettre le certificat
                                    </button>
                                    <button className="btn-wf btn-reject" onClick={() => setModal('reject')}>
                                        <XCircle size={12}/> Rejeter
                                    </button>
                                </>
                            )}
                            {['SUBMITTED', 'ISSUED'].includes(certificate.status) && can.cancel && (
                                <button className="btn-wf btn-cancel" onClick={() => setModal('cancel')}>
                                    <StopCircle size={12}/> Annuler
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {certificate.validation_notes && (
                        <div className={certificate.validation_notes.startsWith('REJETÉ') ? 'notes-ko' : 'notes-ok'}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                                <AlertCircle size={13}/>
                                <span style={{ fontWeight:600, fontSize:11 }}>
                                    {certificate.validation_notes.startsWith('REJETÉ') ? 'Motif de rejet' : 'Notes'}
                                </span>
                            </div>
                            {certificate.validation_notes}
                        </div>
                    )}
                    {certificate.cancellation_reason && (
                        <div className="notes-ko">
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                                <AlertCircle size={13}/>
                                <span style={{ fontWeight:600, fontSize:11 }}>Motif d'annulation</span>
                            </div>
                            {certificate.cancellation_reason}
                        </div>
                    )}

                    {/* Voyage */}
                    <div className="cs-card">
                        <div className="cs-card-hdr">
                            <div className="cs-card-ico" style={{ background:'#eff6ff' }}>
                                {certificate.transport_type === 'AIR' ? <Plane size={15} color="#3b82f6"/> :
                                 certificate.transport_type === 'ROAD' ? <Truck size={15} color="#3b82f6"/> :
                                 <Ship size={15} color="#3b82f6"/>}
                            </div>
                            <span className="cs-card-ttl">Voyage</span>
                        </div>
                        <div className="cs-card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Assuré</span>
                                    <span className="info-value" style={{ fontWeight:500 }}>{certificate.insured_name}</span>
                                    {certificate.insured_ref && <span style={{ fontSize:11, color:'#64748b' }}>{certificate.insured_ref}</span>}
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Date d'expédition</span>
                                    <span className="info-value">{fmt(certificate.voyage_date)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">De</span>
                                    <span className="info-value">{certificate.voyage_from}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">À</span>
                                    <span className="info-value">{certificate.voyage_to}</span>
                                </div>
                                {certificate.voyage_via && (
                                    <div className="info-item">
                                        <span className="info-label">Via</span>
                                        <span className="info-value">{certificate.voyage_via}</span>
                                    </div>
                                )}
                                {certificate.vessel_name && (
                                    <div className="info-item">
                                        <span className="info-label">Navire S/S</span>
                                        <span className="info-value">{certificate.vessel_name}</span>
                                    </div>
                                )}
                                {certificate.flight_number && (
                                    <div className="info-item">
                                        <span className="info-label">N° Vol</span>
                                        <span className="info-value">{certificate.flight_number}</span>
                                    </div>
                                )}
                                {certificate.voyage_mode && (
                                    <div className="info-item">
                                        <span className="info-label">Mode</span>
                                        <span className="info-value">{certificate.voyage_mode}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Détail expédition */}
                    <div className="cs-card">
                        <div className="cs-card-hdr">
                            <div className="cs-card-ico" style={{ background:'#fff7ed' }}><FileText size={15} color="#f97316"/></div>
                            <span className="cs-card-ttl">Détail de l'expédition</span>
                        </div>
                        <div className="cs-card-body">
                            <div style={{ overflowX:'auto' }}>
                                <table className="exp-table">
                                    <thead>
                                        <tr>
                                            <th>Marques</th>
                                            <th>N° Colis</th>
                                            <th>Nbre</th>
                                            <th>Poids</th>
                                            <th>Nature & Emballage</th>
                                            <th>Valeur assurance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(certificate.expedition_items ?? []).map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.marks || '—'}</td>
                                                <td>{item.package_numbers || '—'}</td>
                                                <td style={{ textAlign:'center' }}>{item.package_count || '—'}</td>
                                                <td>{item.weight || '—'}</td>
                                                <td>
                                                    <div>{item.nature}</div>
                                                    {item.packaging && <div style={{ fontSize:10, color:'#94a3b8' }}>{item.packaging}</div>}
                                                </td>
                                                <td style={{ textAlign:'right', fontFamily:'monospace' }}>
                                                    {Number(item.insured_value).toLocaleString('fr-FR')}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan={5} style={{ textAlign:'right', fontSize:12, fontWeight:700 }}>
                                                VALEUR TOTALE D'ASSURANCE
                                            </td>
                                            <td style={{ textAlign:'right', fontFamily:'monospace', fontSize:14 }}>
                                                {parseFloat(certificate.insured_value).toLocaleString('fr-FR')} {certificate.currency_code}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            {certificate.insured_value_letters && (
                                <div style={{ marginTop:10, padding:'10px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, color:'#475569', fontStyle:'italic' }}>
                                    {certificate.insured_value_letters}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Décompte de prime */}
                    {certificate.prime_breakdown && certificate.prime_breakdown.length > 0 && (
                        <div className="cs-card">
                            <div className="cs-card-hdr">
                                <div className="cs-card-ico" style={{ background:'#fffbeb' }}><DollarSign size={15} color="#f59e0b"/></div>
                                <span className="cs-card-ttl">Décompte de prime</span>
                            </div>
                            <div className="cs-card-body">
                                {certificate.prime_breakdown.map(line => (
                                    <div key={line.key} className="prime-row">
                                        <span style={{ fontSize:12, color:'#64748b' }}>
                                            {line.label}{line.label_en ? ` / ${line.label_en}` : ''}
                                            {line.rate > 0 && <span style={{ marginLeft:8, fontSize:10, color:'#94a3b8' }}>{line.rate}%</span>}
                                        </span>
                                        <span style={{ fontSize:13, fontFamily:'monospace', color: line.amount > 0 ? '#1e293b' : '#94a3b8' }}>
                                            {line.amount > 0 ? line.amount.toLocaleString('fr-FR') : '—'}
                                        </span>
                                    </div>
                                ))}
                                <div className="prime-row" style={{ borderTop:'2px solid #e2e8f0', paddingTop:10, marginTop:4 }}>
                                    <span style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>TOTAL PRIME</span>
                                    <span style={{ fontSize:15, fontWeight:700, fontFamily:'monospace', color:'#1e3a8a' }}>
                                        {parseFloat(certificate.prime_total ?? '0').toLocaleString('fr-FR')} {certificate.currency_code}
                                    </span>
                                </div>
                                {certificate.guarantee_mode && (
                                    <div style={{ marginTop:10, fontSize:12, color:'#64748b' }}>
                                        Mode de garantie : <strong>{certificate.guarantee_mode}</strong>
                                    </div>
                                )}
                                {certificate.exchange_currency && certificate.exchange_rate && (
                                    <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>
                                        Cours : 1 {certificate.exchange_currency} = {certificate.exchange_rate} {certificate.currency_code}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Méta */}
                    <div style={{ fontSize:11, color:'#94a3b8', display:'flex', gap:16, flexWrap:'wrap', padding:'4px 0' }}>
                        {certificate.created_by && <span>Créé par {certificate.created_by.first_name} {certificate.created_by.last_name}</span>}
                        {certificate.submitted_by && <span>· Soumis par {certificate.submitted_by.first_name} {certificate.submitted_by.last_name}{certificate.submitted_at ? ` le ${fmtDt(certificate.submitted_at)}` : ''}</span>}
                        {certificate.issued_by && <span>· Émis par {certificate.issued_by.first_name} {certificate.issued_by.last_name}{certificate.issued_at ? ` le ${fmtDt(certificate.issued_at)}` : ''}</span>}
                    </div>

                </div>
            </div>

            {/* Modals workflow */}
            {modal === 'issue'  && <ActionModal title="Émettre le certificat" icon={CheckCircle} color="#15803d" actionLabel="Émettre"   requireReason={false} onConfirm={(n: string) => action('admin.certificates.issue', { notes: n })} onClose={() => setModal(null)}/>}
            {modal === 'reject' && <ActionModal title="Rejeter le certificat"  icon={XCircle}    color="#dc2626" actionLabel="Rejeter"   onConfirm={(r: string) => action('admin.certificates.reject',  { reason: r })} onClose={() => setModal(null)}/>}
            {modal === 'cancel' && <ActionModal title="Annuler le certificat"  icon={StopCircle}  color="#dc2626" actionLabel="Annuler"   onConfirm={(r: string) => action('admin.certificates.cancel',  { reason: r })} onClose={() => setModal(null)}/>}
        </AppLayout>
    );
}