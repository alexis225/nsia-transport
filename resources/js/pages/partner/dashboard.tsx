import { Head, Link, router } from '@inertiajs/react';
import { Briefcase, FilePlus2, Inbox, Clock, CheckCircle2, XCircle, AlertTriangle, Bell, X, Award } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/partner' },
];

interface NotificationItem { id: string; title: string; body: string; url: string | null; }

interface Props {
    broker: { id: string; name: string; code: string; type: string } | null;
    tenant: { id: string; name: string; code: string } | null;
    counts: { pending: number; in_review: number; approved: number; rejected: number } | null;
    certificateCounts: { issued: number; guce: number } | null;
    notifications: NotificationItem[];
}

interface BarDatum { key: string; label: string; value: number; color: string; icon?: any; }

function MiniBarChart({ title, data }: { title: string; data: BarDatum[] }) {
    const [hovered, setHovered] = useState<string | null>(null);
    const maxValue = Math.max(1, ...data.map(d => d.value));

    return (
        <div className="pd-chart">
            <div className="pd-chart-title">{title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data.map(d => {
                    const pct = d.value === 0 ? 0 : Math.max(4, Math.round((d.value / maxValue) * 100));
                    const isHovered = hovered === d.key;
                    const Icon = d.icon;

                    return (
                        <div
                            key={d.key}
                            title={`${d.label} : ${d.value}`}
                            onMouseEnter={() => setHovered(d.key)}
                            onMouseLeave={() => setHovered(null)}
                            onFocus={() => setHovered(d.key)}
                            onBlur={() => setHovered(null)}
                            tabIndex={0}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', outline: 'none' }}>
                            <div style={{ width: 150, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {Icon && <Icon size={13} color="#64748b" />}
                                <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                            </div>
                            <div style={{ flex: 1, height: 18, background: '#f1f5f9', borderRadius: 4, position: 'relative' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: d.color,
                                    borderRadius: '0 4px 4px 0',
                                    opacity: hovered && !isHovered ? 0.55 : 1,
                                    boxShadow: isHovered ? '0 0 0 2px rgba(30,41,59,0.12)' : 'none',
                                    transition: 'opacity .12s, box-shadow .12s',
                                }} />
                            </div>
                            <div style={{ width: 28, textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: '#1e293b', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                {d.value}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function PartnerDashboard({ broker, tenant, counts, certificateCounts, notifications: initialNotifications }: Props) {
    const [notifications, setNotifications] = useState(initialNotifications);

    function dismiss(id: string) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        router.patch(route('partner.notifications.read', { id }), {}, { preserveState: true, preserveScroll: true });
    }

    function open(notif: NotificationItem) {
        dismiss(notif.id);

        if (notif.url) {
            router.visit(notif.url);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Espace partenaire — NSIA Transport" />
            <style>{`
                .pd-wrap{width:100%;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .pd-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;position:relative;overflow:hidden;}
                .pd-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .pd-hero-left{display:flex;align-items:center;gap:16px;position:relative;z-index:1;}
                .pd-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .pd-hero-title{font-size:17px;font-weight:600;color:#fff;margin-bottom:2px;}
                .pd-hero-sub{font-size:12px;color:rgba(255,255,255,0.55);}
                .pd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
                .pd-stat{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:8px;}
                .pd-stat-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;}
                .pd-stat-val{font-size:22px;font-weight:700;color:#1e293b;}
                .pd-stat-lbl{font-size:11.5px;color:#94a3b8;}
                .pd-warn{background:#fffbeb;border:1.5px solid #fde68a;border-radius:14px;padding:20px;display:flex;gap:12px;align-items:flex-start;}
                .pd-notif{background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start;cursor:pointer;}
                .pd-notif:hover{background:#dbeafe;}
                .pd-charts{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .pd-chart{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px;}
                .pd-chart-title{font-size:13px;font-weight:600;color:#1e293b;margin-bottom:14px;}
                @media (max-width: 720px){ .pd-charts{grid-template-columns:1fr;} }
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="pd-wrap">
                    <div className="pd-hero">
                        <div className="pd-hero-left">
                            <div className="pd-hero-ico"><Briefcase size={22} color="rgba(255,255,255,0.85)" /></div>
                            <div>
                                <div className="pd-hero-title">{broker ? broker.name : 'Espace partenaire'}</div>
                                <div className="pd-hero-sub">
                                    {broker ? `${broker.code} · ${tenant?.name ?? '—'}` : 'Bienvenue sur votre espace'}
                                </div>
                            </div>
                        </div>
                        {broker && (
                            <Link href={route('partner.certificate-requests.create')}>
                                <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-10 px-4" variant="outline">
                                    <FilePlus2 size={15} /> Nouvelle demande
                                </Button>
                            </Link>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {notifications.map(notif => (
                                <div key={notif.id} className="pd-notif" onClick={() => open(notif)}>
                                    <Bell size={16} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>{notif.title}</div>
                                        {notif.body && <div style={{ fontSize: 12, color: '#1e40af', marginTop: 2 }}>{notif.body}</div>}
                                    </div>
                                    <button onClick={e => {
                                                e.stopPropagation();
                                                dismiss(notif.id);
                                            }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', flexShrink: 0 }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {!broker ? (
                        <div className="pd-warn">
                            <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e' }}>Compte non rattaché</div>
                                <div style={{ fontSize: 12.5, color: '#92400e', marginTop: 3 }}>
                                    Votre compte n'est pas encore rattaché à une fiche courtier. Contactez votre administrateur filiale NSIA pour finaliser la configuration de votre accès.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="pd-stats">
                                <div className="pd-stat">
                                    <div className="pd-stat-ico" style={{ background: '#fffbeb' }}><Clock size={17} color="#d97706" /></div>
                                    <div className="pd-stat-val">{counts?.pending ?? 0}</div>
                                    <div className="pd-stat-lbl">En attente</div>
                                </div>
                                <div className="pd-stat">
                                    <div className="pd-stat-ico" style={{ background: '#eff6ff' }}><Inbox size={17} color="#2563eb" /></div>
                                    <div className="pd-stat-val">{counts?.in_review ?? 0}</div>
                                    <div className="pd-stat-lbl">En cours d'examen</div>
                                </div>
                                <div className="pd-stat">
                                    <div className="pd-stat-ico" style={{ background: '#f0fdf4' }}><CheckCircle2 size={17} color="#16a34a" /></div>
                                    <div className="pd-stat-val">{counts?.approved ?? 0}</div>
                                    <div className="pd-stat-lbl">Approuvées</div>
                                </div>
                                <div className="pd-stat">
                                    <div className="pd-stat-ico" style={{ background: '#fef2f2' }}><XCircle size={17} color="#dc2626" /></div>
                                    <div className="pd-stat-val">{counts?.rejected ?? 0}</div>
                                    <div className="pd-stat-lbl">Rejetées</div>
                                </div>
                            </div>

                            <div className="pd-charts">
                                <MiniBarChart
                                    title="Répartition des demandes"
                                    data={[
                                        { key: 'pending',   label: 'En attente',           value: counts?.pending   ?? 0, color: '#fab219', icon: Clock },
                                        { key: 'in_review', label: "En cours d'examen",    value: counts?.in_review ?? 0, color: '#2a78d6', icon: Inbox },
                                        { key: 'approved',  label: 'Approuvées',           value: counts?.approved  ?? 0, color: '#0ca30c', icon: CheckCircle2 },
                                        { key: 'rejected',  label: 'Rejetées',             value: counts?.rejected  ?? 0, color: '#d03b3b', icon: XCircle },
                                    ]}
                                />
                                <MiniBarChart
                                    title="Origine des certificats"
                                    data={[
                                        { key: 'issued', label: 'Émis',              value: certificateCounts?.issued ?? 0, color: '#2a78d6', icon: Award },
                                        { key: 'guce',   label: 'Importés (GUCE)',    value: certificateCounts?.guce   ?? 0, color: '#008300', icon: Award },
                                    ]}
                                />
                            </div>

                            <Link href={route('partner.certificate-requests.index')}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1e3a8a', fontWeight: 500, textDecoration: 'none' }}>
                                <Inbox size={14} /> Voir toutes mes demandes
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
