import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { Plus, Eye, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

interface Amendment {
    id: string; amendment_number: string; sequence: number;
    reason: string; status: string;
    changes: Record<string, any>;
    submitted_at: string | null; reviewed_at: string | null; applied_at: string | null;
    created_by: { first_name: string; last_name: string } | null;
    created_at: string;
}
interface Contract {
    id: string; contract_number: string; insured_name: string; status: string;
    tenant: { name: string; code: string } | null;
}
interface Props {
    contract:   Contract;
    amendments: Amendment[];
    can:        { create: boolean; validate: boolean };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; dot: string; icon: any }> = {
    DRAFT:    { bg:'#f8fafc', color:'#64748b', label:'Brouillon',  dot:'#94a3b8', icon: FileText },
    PENDING:  { bg:'#fffbeb', color:'#92400e', label:'En attente', dot:'#f59e0b', icon: Clock },
    APPROVED: { bg:'#f0fdf4', color:'#15803d', label:'Approuvé',  dot:'#22c55e', icon: CheckCircle },
    REJECTED: { bg:'#fef2f2', color:'#dc2626', label:'Rejeté',    dot:'#ef4444', icon: XCircle },
};

const fmt   = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
const fmtDt = (d: string) => new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

export default function AmendmentsIndex({ contract, amendments, can }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Contrats',  href: '/admin/contracts' },
        { title: contract.contract_number, href: route('admin.contracts.show', { contract: contract.id }) },
        { title: 'Avenants' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Avenants — ${contract.contract_number}`}/>
            <style>{`
                .ai-page{padding:4px;display:flex;flex-direction:column;gap:16px;max-width:860px;margin:0 auto;}
                .ai-hdr{display:flex;align-items:center;justify-content:space-between;}
                .ai-title{font-size:18px;font-weight:600;color:#1e293b;}
                .ai-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .ai-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
                td{padding:12px 16px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .amend-num{font-family:monospace;font-size:12px;font-weight:700;color:#1e293b;}
                .status-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
                .btn-view{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid #bfdbfe;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;color:#1d4ed8;text-decoration:none;}
                .btn-view:hover{background:#eff6ff;}
                .empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
                .pending-banner{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 16px;font-size:12px;color:#92400e;display:flex;align-items:center;gap:8px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ai-page">
                    <div className="ai-hdr">
                        <div>
                            <h1 className="ai-title">Avenants — {contract.contract_number}</h1>
                            <p className="ai-sub">{contract.insured_name} · {contract.tenant?.name} · {amendments.length} avenant{amendments.length > 1 ? 's' : ''}</p>
                        </div>
                        {can.create && contract.status === 'ACTIVE' && (
                            <Link href={route('admin.contracts.amendments.create', { contract: contract.id })}>
                                <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                    <Plus size={14}/> Nouvel avenant
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Alerte avenants en attente */}
                    {amendments.some(a => a.status === 'PENDING') && can.validate && (
                        <div className="pending-banner">
                            <Clock size={14}/>
                            {amendments.filter(a => a.status === 'PENDING').length} avenant(s) en attente de votre validation.
                        </div>
                    )}

                    <div className="ai-card">
                        {amendments.length === 0 ? (
                            <div className="empty">
                                <FileText size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                                <div>Aucun avenant pour ce contrat.</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>N° Avenant</th>
                                        <th>Motif</th>
                                        <th>Modifications</th>
                                        <th>Créé le</th>
                                        <th>Appliqué le</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {amendments.map(a => {
                                        const ss = STATUS_STYLES[a.status] ?? STATUS_STYLES.DRAFT;
                                        const StatusIcon = ss.icon;
                                        const changesCount = Object.keys(a.changes).length;
                                        return (
                                            <tr key={a.id}>
                                                <td>
                                                    <div className="amend-num">{a.amendment_number}</div>
                                                    <div style={{ fontSize:10, color:'#94a3b8' }}>Avenant n°{a.sequence}</div>
                                                </td>
                                                <td>
                                                    <div style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#1e293b', fontWeight:500 }}>
                                                        {a.reason}
                                                    </div>
                                                    {a.created_by && (
                                                        <div style={{ fontSize:10, color:'#94a3b8' }}>
                                                            par {a.created_by.first_name} {a.created_by.last_name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span style={{ background:'#f1f5f9', color:'#475569', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:500 }}>
                                                        {changesCount} champ{changesCount > 1 ? 's' : ''}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize:11, color:'#64748b' }}>{fmt(a.created_at)}</td>
                                                <td style={{ fontSize:11, color: a.applied_at ? '#15803d' : '#94a3b8' }}>
                                                    {a.applied_at ? fmtDt(a.applied_at) : '—'}
                                                </td>
                                                <td>
                                                    <span className="status-badge" style={{ background: ss.bg, color: ss.color }}>
                                                        <span className="s-dot" style={{ background: ss.dot }}/>{ss.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link href={route('admin.contracts.amendments.show', { contract: contract.id, amendment: a.id })}
                                                          className="btn-view">
                                                        <Eye size={11}/> Voir
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