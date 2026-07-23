import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    Bell, CheckCircle, XCircle, Clock,
    AlertTriangle, TrendingUp, Slash, Inbox,
    Check, ExternalLink, X,
} from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    icon: string;
    color: 'success' | 'danger' | 'warning' | 'info';
    title: string;
    body: string;
    url: string | null;
    read: boolean;
    created_at: string;
    created_ts: string;
}

const COLOR_STYLES = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', text: '#15803d' },
    danger:  { bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', text: '#92400e' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6', text: '#1d4ed8' },
};

const ICON_MAP: Record<string, any> = {
    'check-circle':   CheckCircle,
    'x-circle':       XCircle,
    'clock':          Clock,
    'alert-triangle': AlertTriangle,
    'trending-up':    TrendingUp,
    'slash':          Slash,
    'bell':           Bell,
    'inbox':          Inbox,
};

function getCsrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount,   setUnreadCount]   = useState(0);
    const [open,          setOpen]          = useState(false);
    const [loading,       setLoading]       = useState(false);
    const panelRef     = useRef<HTMLDivElement>(null);
    const lastActionAt = useRef<number>(0);
    const GRACE_MS     = 10_000; // 10s de grâce après toute action

    // ── Fetch notifications ───────────────────────────────────
    const fetchNotifications = async (force = false) => {
        if (!force && Date.now() - lastActionAt.current < GRACE_MS) return;
        try {
            const res = await fetch('/admin/notifications', {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch {}
    };

    // Polling toutes les 30s
    useEffect(() => {
        fetchNotifications(true);
        const interval = setInterval(() => fetchNotifications(), 30_000);
        return () => clearInterval(interval);
    }, []);

    // Fermer au clic extérieur
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── markRead ──────────────────────────────────────────────
    const markRead = async (id: string) => {
        lastActionAt.current = Date.now();

        // 1. Optimistic update immédiat
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        // 2. PATCH serveur — await pour s'assurer que c'est persisté
        try {
            await axios.patch(`/admin/notifications/${id}/read`);
        } catch {}
    };

    // ── markAllRead ───────────────────────────────────────────
    const markAllRead = async () => {
        setLoading(true);
        lastActionAt.current = Date.now();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        try {
            await axios.patch('/admin/notifications/read-all');
        } catch {}
        setLoading(false);
    };

    // ── deleteNotif ───────────────────────────────────────────
    const deleteNotif = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        lastActionAt.current = Date.now();
        const was = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (was && !was.read) setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await axios.delete(`/admin/notifications/${id}`);
        } catch {}
    };

    // ── handleClick ───────────────────────────────────────────
    const handleClick = async (notif: Notification) => {
        // 1. Marquer comme lu et attendre la confirmation serveur
        if (!notif.read) {
            await markRead(notif.id);
        }

        // 2. Fermer le panel
        setOpen(false);

        // 3. Naviguer — après que le PATCH soit confirmé
        if (notif.url) {
            // router.visit = navigation Inertia sans full reload
            // preserveState = garde le composant NotificationBell monté
            router.visit(notif.url, {
                preserveScroll: true,
                preserveState: false, // recharger les props Inertia de la page cible
            });
        }
    };

    return (
        <div ref={panelRef} style={{ position: 'relative' }}>
            {/* Cloche */}
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    position: 'relative',
                    width: 36, height: 36,
                    border: '1.5px solid var(--color-border-tertiary)',
                    borderRadius: 8,
                    background: 'var(--color-background-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-secondary)',
                    transition: 'all .13s',
                }}
            >
                <Bell size={16}/>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: -5, right: -5,
                        width: unreadCount > 9 ? 20 : 16,
                        height: 16,
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid var(--color-background-primary)',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 44, right: 0,
                    width: 360,
                    background: '#1e3a8a',
                    border: '1.5px solid #1e40af',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(30,58,138,.35)',
                    zIndex: 100,
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                                Notifications
                            </span>
                            {unreadCount > 0 && (
                                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 6px', fontWeight: 600 }}>
                                    {unreadCount} non lues
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} disabled={loading}
                                        style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Check size={11}/> Tout lire
                                </button>
                            )}
                            <button onClick={() => setOpen(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
                                <X size={14}/>
                            </button>
                        </div>
                    </div>

                    {/* Liste */}
                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                                <Bell size={28} style={{ opacity: .3, marginBottom: 8 }}/>
                                <div>Aucune notification</div>
                            </div>
                        ) : notifications.map(notif => {
                            const cs = COLOR_STYLES[notif.color] ?? COLOR_STYLES.info;
                            const IconComp = ICON_MAP[notif.icon] ?? Bell;
                            return (
                                <div key={notif.id}
                                     onClick={() => handleClick(notif)}
                                     style={{
                                         padding: '10px 14px',
                                         borderBottom: '1px solid rgba(255,255,255,0.1)',
                                         display: 'flex',
                                         gap: 10,
                                         cursor: notif.url ? 'pointer' : 'default',
                                         background: notif.read ? 'transparent' : 'rgba(255,255,255,0.08)',
                                         transition: 'background .13s',
                                     }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                        background: cs.bg, border: `1px solid ${cs.border}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <IconComp size={14} color={cs.dot}/>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                                            <div style={{ fontSize: 12, fontWeight: notif.read ? 400 : 600, color: '#fff', lineHeight: 1.4 }}>
                                                {notif.title}
                                                {!notif.read && (
                                                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: cs.dot, marginLeft: 5, verticalAlign: 'middle' }}/>
                                                )}
                                            </div>
                                            <button onClick={(e) => deleteNotif(notif.id, e)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', opacity: .6, padding: 0, flexShrink: 0 }}>
                                                <X size={12}/>
                                            </button>
                                        </div>
                                        {notif.body && (
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {notif.body}
                                            </div>
                                        )}
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {notif.created_at}
                                            {notif.url && <ExternalLink size={9}/>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
                            <a href="/admin/notifications"
                               style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                                Voir toutes les notifications
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}