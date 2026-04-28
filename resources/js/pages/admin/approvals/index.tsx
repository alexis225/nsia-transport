import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Escalades NN300', href: '/admin/approvals' },
];

interface Workflow {
    id: string; current_level: number; status: string;
    threshold_pct: number; threshold_amount: number;
    hours_left: number; is_overdue: boolean;
    triggered_at: string; expires_at: string;
    certificate: { id: string; certificate_number: string; insured_name: string; insured_value: number; currency_code: string } | null;
    contract: { id: string; contract_number: string } | null;
    tenant: { name: string; code: string } | null;
    triggered_by: { name: string } | null;
}
interface Props {
    workflows: Workflow[];
    isSA:      boolean;
}

const fmt   = (n: number, c: string) => n.toLocaleString('fr-FR', { maximumFractionDigits:0 }) + ' ' + c;
const fmtDt = (d: string) => new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

export default function ApprovalsIndex({ workflows, isSA }: Props) {
    const overdue  = workflows.filter(w => w.is_overdue).length;
    const level1   = workflows.filter(w => w.current_level === 1).length;
    const level2   = workflows.filter(w => w.current_level === 2).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Escalades NN300 — NSIA Transport"/>
            <style>{`
                .al-page{padding:4px;display:flex;flex-direction:column;gap:14px;}
                .al-title{font-size:18px;font-weight:600;color:#1e293b;}
                .al-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
                .kpi-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px 14px;text-align:center;}
                .kpi-val{font-size:22px;font-weight:600;color:#1e293b;line-height:1;}
                .kpi-lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:4px;}
                .al-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:9px 14px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.07em;text-align:left;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
                td{padding:11px 14px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .cert-num{font-family:monospace;font-size:12px;font-weight:700;color:#1e293b;}
                .level-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:500;}
                .timer-urgent{color:#dc2626;font-weight:600;}
                .timer-ok{color:#92400e;}
                .btn-decide{padding:5px 12px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid #bfdbfe;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;color:#1d4ed8;text-decoration:none;transition:all .13s;}
                .btn-decide:hover{background:#eff6ff;}
                .empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="al-page">

                    <div>
                        <h1 className="al-title">Escalades NN300</h1>
                        <p className="al-sub">Certificats dépassant le seuil de souscription — en attente de décision</p>
                    </div>

                    <div className="kpi-grid">
                        <div className="kpi-card" style={{ borderColor: workflows.length > 0 ? '#fde68a' : undefined }}>
                            <div className="kpi-val" style={{ color: workflows.length > 0 ? '#92400e' : '#1e293b' }}>{workflows.length}</div>
                            <div className="kpi-lbl">En attente</div>
                        </div>
                        <div className="kpi-card" style={{ borderColor: overdue > 0 ? '#fecaca' : undefined }}>
                            <div className="kpi-val" style={{ color: overdue > 0 ? '#dc2626' : '#1e293b' }}>{overdue}</div>
                            <div className="kpi-lbl">Délai dépassé</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val" style={{ color:'#1d4ed8' }}>{level1}</div>
                            <div className="kpi-lbl">Niveau 1 (Admin)</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val" style={{ color:'#7c3aed' }}>{level2}</div>
                            <div className="kpi-lbl">Niveau 2 (Super Admin)</div>
                        </div>
                    </div>

                    <div className="al-card">
                        {workflows.length === 0 ? (
                            <div className="empty">
                                <CheckCircle size={32} color="#bbf7d0" style={{ marginBottom:8 }}/>
                                <div style={{ fontWeight:500, color:'#15803d' }}>Aucune escalade en attente</div>
                                <div style={{ fontSize:11, marginTop:4 }}>Toutes les escalades ont été traitées.</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Certificat</th>
                                        <th>Assuré</th>
                                        <th>Valeur</th>
                                        <th>Seuil dépassé</th>
                                        {isSA && <th>Filiale</th>}
                                        <th>Niveau</th>
                                        <th>Délai restant</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workflows.map(w => {
                                        const cert = w.certificate;
                                        return (
                                            <tr key={w.id}>
                                                <td>
                                                    <div className="cert-num">{cert?.certificate_number ?? '—'}</div>
                                                    <div style={{ fontSize:10, color:'#94a3b8' }}>{w.contract?.contract_number}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight:500, color:'#1e293b', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                        {cert?.insured_name}
                                                    </div>
                                                    <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                        Soumis par {w.triggered_by?.name ?? '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontFamily:'monospace', fontSize:12, fontWeight:600, color:'#dc2626' }}>
                                                        {fmt(cert?.insured_value ?? 0, cert?.currency_code ?? 'XOF')}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>
                                                        &gt; {w.threshold_pct}%
                                                    </div>
                                                    <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                        Seuil : {fmt(w.threshold_amount, cert?.currency_code ?? 'XOF')}
                                                    </div>
                                                </td>
                                                {isSA && (
                                                    <td style={{ fontSize:11, color:'#64748b' }}>
                                                        {w.tenant?.code}
                                                    </td>
                                                )}
                                                <td>
                                                    <span className="level-badge" style={{
                                                        background: w.current_level === 1 ? '#eff6ff' : '#f5f3ff',
                                                        color:      w.current_level === 1 ? '#1d4ed8' : '#7c3aed',
                                                        border: `1px solid ${w.current_level === 1 ? '#bfdbfe' : '#ddd6fe'}`,
                                                    }}>
                                                        Niveau {w.current_level}
                                                    </span>
                                                </td>
                                                <td>
                                                    {w.is_overdue ? (
                                                        <span className="timer-urgent" style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                                                            <AlertTriangle size={11}/> Expiré
                                                        </span>
                                                    ) : (
                                                        <span className={`${w.hours_left < 8 ? 'timer-urgent' : 'timer-ok'}`} style={{ fontSize:11 }}>
                                                            <Clock size={10}/> {w.hours_left.toFixed(1)}h
                                                        </span>
                                                    )}
                                                    <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                        {fmtDt(w.expires_at)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Link href={route('admin.approvals.show', { workflow: w.id })}
                                                          className="btn-decide">
                                                        Décider <ArrowRight size={11}/>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}