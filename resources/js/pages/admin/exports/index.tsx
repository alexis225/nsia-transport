import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Download, Clock, CheckCircle, XCircle, Loader, Trash2, FileText } from 'lucide-react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('admin.dashboard') },
    { title: 'Mes exports' },
];

interface Execution {
    id: string; format: string; status: string;
    parameters: Record<string, any> | null;
    row_count: number | null; file_size: number | null;
    error_message: string | null;
    created_at: string; completed_at: string | null; expires_at: string | null;
    is_expired: boolean; can_download: boolean;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    QUEUED:     { label: 'En attente', color: '#d97706', bg: '#fef3c7', icon: Clock },
    PROCESSING: { label: 'En cours',   color: '#1d4ed8', bg: '#eff6ff', icon: Loader },
    COMPLETED:  { label: 'Terminé',    color: '#15803d', bg: '#f0fdf4', icon: CheckCircle },
    FAILED:     { label: 'Échoué',     color: '#dc2626', bg: '#fef2f2', icon: XCircle },
};

const fmtSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' Mo';
    return (bytes / 1024).toFixed(0) + ' Ko';
};

export default function ExportsIndex({ executions: initial }: { executions: Execution[] }) {
    const [items, setItems] = useState(initial);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const hasPending = items.some(e => e.status === 'QUEUED' || e.status === 'PROCESSING');

    // Polling toutes les 5s s'il y a des exports en cours
    useEffect(() => {
        if (!hasPending) return;
        intervalRef.current = setInterval(async () => {
            for (const item of items.filter(e => e.status === 'QUEUED' || e.status === 'PROCESSING')) {
                try {
                    const { data } = await axios.get(route('admin.exports.status', { execution: item.id }));
                    if (data.status !== item.status) {
                        setItems(prev => prev.map(e => e.id === item.id
                            ? { ...e, ...data, can_download: data.can_download } : e));
                    }
                } catch {}
            }
        }, 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [hasPending, items]);

    const deleteExport = async (id: string) => {
        await axios.delete(route('admin.exports.destroy', { execution: id }));
        setItems(prev => prev.filter(e => e.id !== id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes exports — NSIA Transport"/>
            <style>{`
                .exp-page { padding:4px; display:flex; flex-direction:column; gap:14px; }
                .exp-panel { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; }
                .exp-panel-hdr { padding:12px 16px; border-bottom:1px solid #f1f5f9; font-size:13px; font-weight:600; color:#1e293b; display:flex; align-items:center; justify-content:space-between; }
                table { width:100%; border-collapse:collapse; }
                th { padding:8px 13px; font-size:9.5px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.07em; text-align:left; background:#f8fafc; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
                td { padding:10px 13px; font-size:12px; color:#334155; border-bottom:1px solid #f8fafc; vertical-align:middle; }
                tr:last-child td { border-bottom:none; }
                tr:hover td { background:#fafafa; }
                .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:8px; font-size:10px; font-weight:600; }
                .btn-dl { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; border-radius:7px; background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-size:11px; font-weight:500; cursor:pointer; text-decoration:none; }
                .btn-dl:hover { background:#dcfce7; }
                .btn-del { display:inline-flex; align-items:center; gap:4px; padding:5px 8px; border-radius:7px; background:#fef2f2; color:#dc2626; border:1px solid #fecaca; font-size:11px; cursor:pointer; }
                .btn-del:hover { background:#fee2e2; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .empty { padding:40px; text-align:center; color:#94a3b8; font-size:13px; }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="exp-page">

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Mes exports</h1>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                                Exports asynchrones — disponibles 24h après génération
                            </p>
                        </div>
                        <Link href={route('admin.certificates.index')}
                              style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'none',
                                       display: 'flex', alignItems: 'center', gap: 5,
                                       background: '#eff6ff', padding: '6px 12px', borderRadius: 8,
                                       border: '1px solid #bfdbfe' }}>
                            <FileText size={13}/> Lancer un export →
                        </Link>
                    </div>

                    {hasPending && (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
                                      padding: '10px 14px', fontSize: 12, color: '#1d4ed8',
                                      display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Loader size={13} className="spin"/>
                            Export(s) en cours — la page se met à jour automatiquement…
                        </div>
                    )}

                    <div className="exp-panel">
                        <div className="exp-panel-hdr">
                            <span>Historique des exports ({items.length})</span>
                        </div>
                        {items.length === 0 ? (
                            <div className="empty">
                                <FileText size={28} style={{ marginBottom: 8, opacity: .4 }}/>
                                <div>Aucun export. Lancez un export depuis la liste des certificats.</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Type / Format</th>
                                        <th>Filtres</th>
                                        <th>Lignes</th>
                                        <th>Taille</th>
                                        <th>Demandé le</th>
                                        <th>Terminé le</th>
                                        <th>Expiration</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(e => {
                                        const m = STATUS_META[e.status] ?? STATUS_META.QUEUED;
                                        const Icon = m.icon;
                                        return (
                                            <tr key={e.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>Certificats</div>
                                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{e.format}</div>
                                                </td>
                                                <td>
                                                    {e.parameters ? (
                                                        <div style={{ fontSize: 10, color: '#64748b' }}>
                                                            {Object.entries(e.parameters)
                                                                .filter(([k, v]) => v && !['is_super_admin', 'tenant_id'].includes(k))
                                                                .map(([k, v]) => `${k}:${v}`)
                                                                .join(', ') || 'Tous'}
                                                        </div>
                                                    ) : '—'}
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{e.row_count?.toLocaleString('fr-FR') ?? '—'}</td>
                                                <td>{fmtSize(e.file_size)}</td>
                                                <td style={{ color: '#64748b', fontSize: 11 }}>{e.created_at}</td>
                                                <td style={{ color: '#64748b', fontSize: 11 }}>{e.completed_at ?? '—'}</td>
                                                <td style={{ color: e.is_expired ? '#dc2626' : '#64748b', fontSize: 11 }}>
                                                    {e.expires_at ?? '—'}
                                                    {e.is_expired && ' (expiré)'}
                                                </td>
                                                <td>
                                                    <span className="badge" style={{ color: m.color, background: m.bg }}>
                                                        <Icon size={10} className={e.status === 'PROCESSING' ? 'spin' : ''}/>
                                                        {m.label}
                                                    </span>
                                                    {e.status === 'FAILED' && e.error_message && (
                                                        <div style={{ fontSize: 9, color: '#dc2626', marginTop: 2, maxWidth: 150 }}>
                                                            {e.error_message.substring(0, 60)}…
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 5 }}>
                                                        {e.can_download && (
                                                            <a href={route('admin.exports.download', { execution: e.id })}
                                                               className="btn-dl">
                                                                <Download size={11}/> CSV
                                                            </a>
                                                        )}
                                                        <button className="btn-del"
                                                                onClick={() => deleteExport(e.id)}>
                                                            <Trash2 size={11}/>
                                                        </button>
                                                    </div>
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
