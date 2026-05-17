import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Shield, Plus, Trash2, AlertTriangle, User, X, CheckCircle } from 'lucide-react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('admin.dashboard') },
    { title: 'Sécurité' },
    { title: 'Blacklist IP' },
];

interface Entry     { id: string; ip_range: string; reason: string | null; is_active: boolean; expires_at: string | null; created_at: string; blocked_by: string }
interface SuspiciousUser { id: string; first_name: string; last_name: string; email: string; failed_login_attempts: number; last_login_ip: string | null; locked_until: string | null }

export default function IpBlacklist({
    entries: initial,
    suspiciousUsers: initialSuspicious,
}: {
    entries: Entry[];
    suspiciousUsers: SuspiciousUser[];
}) {
    const [entries, setEntries]          = useState(initial);
    const [suspicious, setSuspicious]    = useState(initialSuspicious);
    const [showForm, setShowForm]        = useState(false);
    const [form, setForm]                = useState({ ip_range: '', reason: '', expires_at: '' });
    const [error, setError]              = useState('');
    const [loading, setLoading]          = useState(false);

    const addEntry = async () => {
        setError(''); setLoading(true);
        try {
            const { data } = await axios.post(route('admin.security.ip-blacklist.store'), form);
            setEntries(prev => [{
                id: data.id, ip_range: form.ip_range, reason: form.reason || null,
                is_active: true,
                expires_at: form.expires_at || null,
                created_at: new Date().toLocaleDateString('fr-FR'),
                blocked_by: 'Moi',
            }, ...prev]);
            setForm({ ip_range: '', reason: '', expires_at: '' });
            setShowForm(false);
        } catch (e: any) {
            setError(e.response?.data?.message ?? 'Erreur lors de l\'ajout.');
        } finally { setLoading(false); }
    };

    const removeEntry = async (id: string) => {
        await axios.delete(route('admin.security.ip-blacklist.destroy', { id }));
        setEntries(prev => prev.filter(e => e.id !== id));
    };

    const unlockUser = async (userId: string) => {
        await axios.patch(route('admin.security.ip-blacklist.unlock', { userId }));
        setSuspicious(prev => prev.filter(u => u.id !== userId));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Blacklist IP — NSIA Transport"/>
            <style>{`
                .sec-page { padding:4px; display:flex; flex-direction:column; gap:14px; }
                .panel { background:#fff; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; }
                .panel-hdr { padding:11px 16px; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:600; color:#1e293b; display:flex; align-items:center; justify-content:space-between; }
                .panel-hdr-title { display:flex; align-items:center; gap:6px; }
                table { width:100%; border-collapse:collapse; }
                th { padding:7px 13px; font-size:9.5px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.07em; text-align:left; background:#f8fafc; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
                td { padding:9px 13px; font-size:12px; color:#334155; border-bottom:1px solid #f8fafc; vertical-align:middle; }
                tr:last-child td { border-bottom:none; }
                tr:hover td { background:#fafafa; }
                .fin { height:32px; border:1.5px solid #e2e8f0; border-radius:7px; padding:0 10px; font-size:12px; font-family:inherit; color:#1e293b; background:#fff; outline:none; }
                .fin:focus { border-color:#1d4ed8; }
                .btn { height:32px; padding:0 14px; border-radius:7px; border:none; cursor:pointer; font-size:12px; font-family:inherit; display:inline-flex; align-items:center; gap:5px; font-weight:500; }
                .btn-primary { background:#dc2626; color:#fff; } .btn-primary:hover { background:#b91c1c; }
                .btn-sec { background:#f8fafc; color:#475569; border:1.5px solid #e2e8f0; } .btn-sec:hover { background:#f1f5f9; }
                .btn-del { background:none; border:none; cursor:pointer; color:#dc2626; padding:4px; border-radius:5px; display:inline-flex; align-items:center; }
                .btn-del:hover { background:#fef2f2; }
                .btn-unlock { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; border-radius:6px; padding:4px 8px; font-size:11px; cursor:pointer; display:inline-flex; align-items:center; gap:3px; }
                .badge-active { display:inline-block; padding:2px 7px; border-radius:8px; font-size:10px; font-weight:600; background:#f0fdf4; color:#15803d; }
                .badge-exp    { display:inline-block; padding:2px 7px; border-radius:8px; font-size:10px; font-weight:600; background:#f8fafc; color:#94a3b8; }
                .form-row { display:flex; gap:8px; align-items:flex-start; flex-wrap:wrap; padding:14px 16px; background:#fef2f2; border-bottom:1px solid #fecaca; }
                .empty { padding:28px; text-align:center; color:#94a3b8; font-size:13px; }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="sec-page">

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                                Blacklist IP &amp; Détection d'intrusion
                            </h1>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                                Bloc plages IP/CIDR · Surveillance des tentatives de connexion
                            </p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
                            <Plus size={13}/> Bloquer une IP
                        </button>
                    </div>

                    {/* Formulaire ajout */}
                    <div className="panel">
                        <div className="panel-hdr">
                            <div className="panel-hdr-title">
                                <Shield size={14} color="#dc2626"/> Plages IP bloquées ({entries.length})
                            </div>
                        </div>
                        {showForm && (
                            <div className="form-row">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <label style={{ fontSize: 10, color: '#64748b' }}>IP ou plage CIDR *</label>
                                    <input className="fin" style={{ width: 170 }}
                                           placeholder="ex: 192.168.1.5 ou 10.0.0.0/24"
                                           value={form.ip_range}
                                           onChange={e => setForm(p => ({ ...p, ip_range: e.target.value }))}/>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                                    <label style={{ fontSize: 10, color: '#64748b' }}>Raison</label>
                                    <input className="fin" style={{ minWidth: 200 }}
                                           placeholder="Raison du blocage…"
                                           value={form.reason}
                                           onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}/>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <label style={{ fontSize: 10, color: '#64748b' }}>Expiration (optionnel)</label>
                                    <input type="datetime-local" className="fin" style={{ width: 180 }}
                                           value={form.expires_at}
                                           onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}/>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', paddingBottom: 1 }}>
                                    <button className="btn btn-primary" onClick={addEntry} disabled={loading || !form.ip_range}>
                                        {loading ? '…' : 'Bloquer'}
                                    </button>
                                    <button className="btn btn-sec" onClick={() => { setShowForm(false); setError(''); }}>
                                        <X size={12}/>
                                    </button>
                                </div>
                                {error && <div style={{ width: '100%', fontSize: 11, color: '#dc2626' }}>{error}</div>}
                            </div>
                        )}
                        {entries.length === 0 ? (
                            <div className="empty">
                                <CheckCircle size={24} style={{ marginBottom: 6, opacity: .4 }}/>
                                <div>Aucune IP bloquée</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>IP / Plage CIDR</th>
                                        <th>Raison</th>
                                        <th>Bloqué par</th>
                                        <th>Expiration</th>
                                        <th>Statut</th>
                                        <th>Ajouté le</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(e => (
                                        <tr key={e.id}>
                                            <td><code style={{ fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>{e.ip_range}</code></td>
                                            <td style={{ color: '#64748b' }}>{e.reason ?? '—'}</td>
                                            <td style={{ fontSize: 11, color: '#64748b' }}>{e.blocked_by}</td>
                                            <td style={{ fontSize: 11, color: e.expires_at ? '#d97706' : '#94a3b8' }}>
                                                {e.expires_at ?? 'Permanent'}
                                            </td>
                                            <td>
                                                <span className={e.is_active ? 'badge-active' : 'badge-exp'}>
                                                    {e.is_active ? 'Actif' : 'Expiré'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 11, color: '#94a3b8' }}>{e.created_at}</td>
                                            <td>
                                                <button className="btn-del" onClick={() => removeEntry(e.id)} title="Supprimer">
                                                    <Trash2 size={13}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Utilisateurs suspects */}
                    <div className="panel">
                        <div className="panel-hdr">
                            <div className="panel-hdr-title">
                                <AlertTriangle size={14} color="#d97706"/>
                                Comptes suspects (tentatives &gt; 3)
                            </div>
                        </div>
                        {suspicious.length === 0 ? (
                            <div className="empty">
                                <CheckCircle size={24} style={{ marginBottom: 6, opacity: .4 }}/>
                                <div>Aucun compte suspect</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Utilisateur</th>
                                        <th>Email</th>
                                        <th>Tentatives échouées</th>
                                        <th>Dernière IP</th>
                                        <th>Verrouillé jusqu'à</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suspicious.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 500 }}>{u.first_name} {u.last_name}</td>
                                            <td style={{ fontSize: 11, color: '#64748b' }}>{u.email}</td>
                                            <td>
                                                <span style={{ fontWeight: 700, color: u.failed_login_attempts >= 5 ? '#dc2626' : '#d97706',
                                                               fontSize: 14 }}>
                                                    {u.failed_login_attempts}
                                                </span>
                                            </td>
                                            <td><code style={{ fontSize: 11 }}>{u.last_login_ip ?? '—'}</code></td>
                                            <td style={{ fontSize: 11, color: u.locked_until ? '#dc2626' : '#94a3b8' }}>
                                                {u.locked_until ?? '—'}
                                            </td>
                                            <td>
                                                <button className="btn-unlock" onClick={() => unlockUser(u.id)}>
                                                    <User size={10}/> Déverrouiller
                                                </button>
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
