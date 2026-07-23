import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Bell, CheckCircle, XCircle, Clock,
    AlertTriangle, TrendingUp, Shield, Inbox,
    Check, Trash2, Settings, X,
    Mail, Smartphone, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Centre de notifications', href: '/admin/notifications' },
];

interface Notif {
    id: string; type: string; icon: string;
    color: 'success' | 'danger' | 'warning' | 'info';
    title: string; body: string; url: string | null;
    read: boolean; created_at: string; created_hr: string;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number;
    total: number; from: number; to: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface PrefItem { label: string; in_app: boolean; email: boolean; }
interface Props {
    notifications: Paginated<Notif>;
    stats:         { total: number; unread: number; today: number };
    preferences:   Record<string, PrefItem>;
    eventTypes:    Record<string, string>;
    filters:       { type?: string; status?: string };
}

const COLOR_STYLES = {
    success: { bg:'#f0fdf4', border:'#bbf7d0', dot:'#16a34a' },
    danger:  { bg:'#fef2f2', border:'#fecaca', dot:'#dc2626' },
    warning: { bg:'#fffbeb', border:'#fde68a', dot:'#f59e0b' },
    info:    { bg:'#eff6ff', border:'#bfdbfe', dot:'#3b82f6' },
};
const ICON_MAP: Record<string, any> = {
    'check-circle':   CheckCircle,
    'x-circle':       XCircle,
    'clock':          Clock,
    'alert-triangle': AlertTriangle,
    'trending-up':    TrendingUp,
    'bell':           Bell,
    'shield':         Shield,
    'user-check':     CheckCircle,
    'inbox':          Inbox,
};

const fmtDt = (d: string) => new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

export default function NotificationCenter({ notifications, stats, preferences, eventTypes, filters }: Props) {
    const [tab,   setTab]   = useState<'notifications' | 'preferences'>('notifications');
    const [prefs, setPrefs] = useState(preferences);
    const [saving, setSaving] = useState(false);
    const [saved,  setSaved]  = useState(false);

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/notifications', { ...filters, ...params, page: '1' }, { preserveState: true, replace: true });

    const markAllRead = () => router.patch(route('admin.notifications.markAllRead'));
    const clearRead   = () => router.delete(route('admin.notifications.clearRead'));

    const markOne = async (id: string) => {
        await axios.patch(`/admin/notifications/${id}/read`);
        router.reload({ only: ['notifications', 'stats'] });
    };

    const togglePref = (type: string, channel: 'in_app' | 'email') => {
        setPrefs(prev => ({
            ...prev,
            [type]: { ...prev[type], [channel]: !prev[type][channel] },
        }));
        setSaved(false);
    };

    const savePrefs = async () => {
        setSaving(true);
        const payload = Object.entries(prefs).map(([event_type, p]) => ({
            event_type,
            in_app: p.in_app,
            email:  p.email,
        }));
        await axios.post(route('admin.notifications.preferences'), { preferences: payload });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Centre de notifications — NSIA Transport"/>
            <style>{`
                .nc-page{padding:4px;display:flex;flex-direction:column;gap:14px;}
                .nc-title{font-size:18px;font-weight:600;color:#1e293b;}
                .nc-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
                .kpi-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px 14px;text-align:center;}
                .kpi-val{font-size:22px;font-weight:600;color:#1e293b;}
                .kpi-lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:3px;}
                .tabs{display:flex;gap:2px;background:#f1f5f9;border-radius:9px;padding:3px;}
                .tab{padding:7px 16px;border-radius:7px;border:none;cursor:pointer;font-size:12px;font-family:inherit;font-weight:500;transition:all .13s;background:none;color:#64748b;display:flex;align-items:center;gap:6px;}
                .tab.active{background:#fff;color:#1e293b;box-shadow:0 1px 3px rgba(0,0,0,.1);}
                .nc-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                .nc-toolbar{padding:10px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
                .hs-select{padding:7px 10px;font-size:12px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;height:36px;}
                .notif-row{padding:12px 16px;border-bottom:1px solid #f8fafc;display:flex;gap:12px;align-items:flex-start;transition:background .1s;}
                .notif-row:hover{background:#fafafa;}
                .notif-row:last-child{border-bottom:none;}
                .notif-unread{background:#f8fbff;}
                .notif-dot{width:6px;height:6px;border-radius:50%;margin-top:5px;flex-shrink:0;}
                .empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
                .pg-wrap{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-top:1px solid #f8fafc;flex-wrap:wrap;gap:8px;}
                .pg-info{font-size:11px;color:#94a3b8;}
                .pg-links{display:flex;gap:4px;}
                .pg-btn{min-width:28px;height:28px;padding:0 6px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                /* Préférences */
                .pref-section{padding:16px;}
                .pref-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
                .pref-table{width:100%;border-collapse:collapse;}
                .pref-table th{padding:8px 12px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.07em;text-align:left;border-bottom:1px solid #f1f5f9;}
                .pref-table td{padding:10px 12px;border-bottom:1px solid #f8fafc;font-size:12px;color:#334155;}
                .pref-table tr:last-child td{border-bottom:none;}
                .toggle{width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
                .toggle.on{background:#1e3a8a;}
                .toggle.off{background:#e2e8f0;}
                .toggle::after{content:'';position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 2px rgba(0,0,0,.15);}
                .toggle.on::after{left:18px;}
                .toggle.off::after{left:2px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="nc-page">

                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                        <div>
                            <h1 className="nc-title">Centre de notifications</h1>
                            <p className="nc-sub">Historique des 90 derniers jours</p>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                            {stats.unread > 0 && (
                                <Button variant="outline" onClick={markAllRead} className="h-9 px-3 text-xs">
                                    <Check size={12}/> Tout marquer comme lu
                                </Button>
                            )}
                            <Button variant="outline" onClick={clearRead}
                                    style={{ color:'#dc2626', borderColor:'#fecaca' }}
                                    className="h-9 px-3 text-xs">
                                <Trash2 size={12}/> Supprimer les lues
                            </Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-val">{stats.total}</div>
                            <div className="kpi-lbl">Total 90 jours</div>
                        </div>
                        <div className="kpi-card" style={{ borderColor: stats.unread > 0 ? '#bfdbfe' : undefined }}>
                            <div className="kpi-val" style={{ color: stats.unread > 0 ? '#1d4ed8' : '#1e293b' }}>
                                {stats.unread}
                            </div>
                            <div className="kpi-lbl">Non lues</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-val">{stats.today}</div>
                            <div className="kpi-lbl">Aujourd'hui</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tabs">
                        <button className={`tab ${tab === 'notifications' ? 'active' : ''}`}
                                onClick={() => setTab('notifications')}>
                            <Bell size={13}/> Notifications
                            {stats.unread > 0 && (
                                <span style={{ background:'#dc2626', color:'#fff', borderRadius:8, fontSize:10, padding:'1px 5px', fontWeight:700 }}>
                                    {stats.unread}
                                </span>
                            )}
                        </button>
                        <button className={`tab ${tab === 'preferences' ? 'active' : ''}`}
                                onClick={() => setTab('preferences')}>
                            <Settings size={13}/> Préférences
                        </button>
                    </div>

                    {/* Tab Notifications */}
                    {tab === 'notifications' && (
                        <div className="nc-card">
                            <div className="nc-toolbar">
                                <Filter size={13} color="#94a3b8"/>
                                <select className="hs-select" value={filters?.type ?? ''}
                                        onChange={e => applyFilter({ type: e.target.value })}>
                                    <option value="">Tous les types</option>
                                    {Object.entries(eventTypes).map(([type, label]) => (
                                        <option key={type} value={type}>{label as string}</option>
                                    ))}
                                </select>
                                <select className="hs-select" value={filters?.status ?? ''}
                                        onChange={e => applyFilter({ status: e.target.value })}>
                                    <option value="">Tous les statuts</option>
                                    <option value="unread">Non lues</option>
                                    <option value="read">Lues</option>
                                </select>
                                {(filters?.type || filters?.status) && (
                                    <button onClick={() => router.get('/admin/notifications')}
                                            style={{ fontSize:11, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                                        <X size={11}/> Effacer
                                    </button>
                                )}
                                <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8' }}>
                                    {notifications.total} notification{notifications.total > 1 ? 's' : ''}
                                </span>
                            </div>

                            {notifications.data.length === 0 ? (
                                <div className="empty">
                                    <Bell size={32} color="#e2e8f0" style={{ marginBottom:8 }}/>
                                    <div>Aucune notification trouvée.</div>
                                </div>
                            ) : (
                                <>
                                    {notifications.data.map(notif => {
                                        const cs = COLOR_STYLES[notif.color] ?? COLOR_STYLES.info;
                                        const IconComp = ICON_MAP[notif.icon] ?? Bell;
                                        return (
                                            <div key={notif.id}
                                                 className={`notif-row ${notif.read ? '' : 'notif-unread'}`}>
                                                <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, background: cs.bg, border:`1px solid ${cs.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    <IconComp size={14} color={cs.dot}/>
                                                </div>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                                                        {!notif.read && (
                                                            <span className="notif-dot" style={{ background: cs.dot }}/>
                                                        )}
                                                        <span style={{ fontSize:13, fontWeight: notif.read ? 400 : 600, color:'#1e293b' }}>
                                                            {notif.title}
                                                        </span>
                                                        <span style={{ fontSize:10, color:'#94a3b8', marginLeft:'auto', whiteSpace:'nowrap' }}>
                                                            {notif.created_hr}
                                                        </span>
                                                    </div>
                                                    {notif.body && (
                                                        <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>{notif.body}</div>
                                                    )}
                                                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                                                        <span style={{ fontSize:10, color:'#94a3b8' }}>
                                                            {fmtDt(notif.created_at)}
                                                        </span>
                                                        {notif.url && (
                                                            <a href={notif.url}
                                                               onClick={() => !notif.read && markOne(notif.id)}
                                                               style={{ fontSize:11, color:'#1d4ed8', textDecoration:'none' }}>
                                                                Voir →
                                                            </a>
                                                        )}
                                                        {!notif.read && (
                                                            <button onClick={() => markOne(notif.id)}
                                                                    style={{ fontSize:11, color:'#64748b', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                                                                <Check size={10}/> Marquer lu
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Pagination */}
                                    {notifications.last_page > 1 && (
                                        <div className="pg-wrap">
                                            <span className="pg-info">
                                                {notifications.from}–{notifications.to} sur {notifications.total}
                                            </span>
                                            <div className="pg-links">
                                                <button className="pg-btn"
                                                        disabled={notifications.current_page === 1}
                                                        onClick={() => applyFilter({ page: String(notifications.current_page - 1) })}>
                                                    ‹
                                                </button>
                                                {notifications.links.map((link, i) => {
                                                    if (i === 0 || i === notifications.links.length - 1) return null;
                                                    return (
                                                        <button key={i}
                                                                className={`pg-btn ${link.active ? 'act' : ''}`}
                                                                disabled={!link.url}
                                                                onClick={() => link.url && applyFilter({ page: link.label })}
                                                                dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                    );
                                                })}
                                                <button className="pg-btn"
                                                        disabled={notifications.current_page === notifications.last_page}
                                                        onClick={() => applyFilter({ page: String(notifications.current_page + 1) })}>
                                                    ›
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Tab Préférences */}
                    {tab === 'preferences' && (
                        <div className="nc-card">
                            <div className="pref-section">
                                <div className="pref-header">
                                    <div>
                                        <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>Préférences de notifications</div>
                                        <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                                            Configurez les canaux de notification par type d'événement
                                        </div>
                                    </div>
                                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                        {saved && (
                                            <span style={{ fontSize:12, color:'#15803d', display:'flex', alignItems:'center', gap:4 }}>
                                                <CheckCircle size={13}/> Sauvegardé
                                            </span>
                                        )}
                                        <Button onClick={savePrefs} disabled={saving}
                                                className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-9 px-4 text-xs">
                                            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                                        </Button>
                                    </div>
                                </div>

                                <table className="pref-table">
                                    <thead>
                                        <tr>
                                            <th>Type d'événement</th>
                                            <th style={{ textAlign:'center', width:100 }}>
                                                <span style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                                                    <Smartphone size={11}/> In-App
                                                </span>
                                            </th>
                                            <th style={{ textAlign:'center', width:100 }}>
                                                <span style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                                                    <Mail size={11}/> Email
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(prefs).map(([type, pref]) => (
                                            <tr key={type}>
                                                <td>
                                                    <div style={{ fontWeight:500, color:'#1e293b' }}>{pref.label}</div>
                                                    <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace' }}>{type}</div>
                                                </td>
                                                <td style={{ textAlign:'center' }}>
                                                    <button
                                                        className={`toggle ${pref.in_app ? 'on' : 'off'}`}
                                                        onClick={() => togglePref(type, 'in_app')}
                                                    />
                                                </td>
                                                <td style={{ textAlign:'center' }}>
                                                    <button
                                                        className={`toggle ${pref.email ? 'on' : 'off'}`}
                                                        onClick={() => togglePref(type, 'email')}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}