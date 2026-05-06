import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import { UserCheck, UserX, Clock, Plus, X, Shield } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Délégations de rôle', href: '/admin/delegations' },
];

interface Grant {
    id: string; status: string; is_active: boolean;
    role_name: string; role_label: string;
    reason: string | null;
    granted_at: string | null; expires_at: string | null; revoked_at: string | null;
    grantee:    { id: string; name: string; email: string } | null;
    grantor:    { id: string; name: string } | null;
    revoked_by: { name: string } | null;
}
interface Colleague { id: string; first_name: string; last_name: string; email: string; }
interface Props {
    granted:          Grant[];
    received:         Grant[];
    colleagues:       Colleague[];
    delegatableRoles: Record<string, string>;
    can:              { create: boolean };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    ACTIVE:  { bg:'#f0fdf4', color:'#15803d', dot:'#22c55e', label:'Active' },
    EXPIRED: { bg:'#f8fafc', color:'#94a3b8', dot:'#cbd5e1', label:'Expirée' },
    REVOKED: { bg:'#fef2f2', color:'#dc2626', dot:'#ef4444', label:'Révoquée' },
};

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

function GrantCard({ grant, onRevoke, showGrantee = true }: { grant: Grant; onRevoke?: () => void; showGrantee?: boolean }) {
    const ss = STATUS_STYLES[grant.status] ?? STATUS_STYLES.EXPIRED;
    return (
        <div style={{
            background:'#fff',
            border:`1.5px solid ${grant.is_active ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius:11, padding:'13px 15px', marginBottom:8,
        }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6 }}>
                <div>
                    {showGrantee && grant.grantee && (
                        <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>
                            {grant.grantee.name}
                            <span style={{ fontSize:11, color:'#94a3b8', fontWeight:400, marginLeft:6 }}>{grant.grantee.email}</span>
                        </div>
                    )}
                    {!showGrantee && grant.grantor && (
                        <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>
                            De : {grant.grantor.name}
                        </div>
                    )}
                    <div style={{ marginTop:5 }}>
                        <span style={{ fontSize:12, padding:'3px 9px', background:'#eff6ff', color:'#1d4ed8', borderRadius:8, border:'1px solid #bfdbfe', fontWeight:500 }}>
                            <Shield size={10} style={{ display:'inline', marginRight:4 }}/>
                            {grant.role_label}
                        </span>
                    </div>
                </div>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:500, background: ss.bg, color: ss.color, flexShrink:0 }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background: ss.dot }}/>
                    {ss.label}
                </span>
            </div>

            <div style={{ display:'flex', gap:16, fontSize:11, color:'#64748b', flexWrap:'wrap', marginTop:6 }}>
                {grant.granted_at && <span>Accordée le {fmt(grant.granted_at)}</span>}
                {grant.expires_at && (
                    <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                        <Clock size={10}/> Expire le {fmt(grant.expires_at)}
                    </span>
                )}
                {grant.reason && <span style={{ fontStyle:'italic' }}>"{grant.reason}"</span>}
            </div>

            {grant.status === 'REVOKED' && grant.revoked_by && (
                <div style={{ marginTop:6, fontSize:11, color:'#dc2626', display:'flex', alignItems:'center', gap:4 }}>
                    <UserX size={11}/> Révoquée par {grant.revoked_by.name}
                    {grant.revoked_at && ` le ${fmt(grant.revoked_at)}`}
                </div>
            )}

            {grant.is_active && onRevoke && (
                <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                    <button onClick={onRevoke}
                            style={{ fontSize:11, color:'#dc2626', background:'none', border:'1px solid #fecaca', borderRadius:7, padding:'4px 10px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}>
                        <UserX size={11}/> Révoquer
                    </button>
                </div>
            )}
        </div>
    );
}

function RevokeModal({ grant, onConfirm, onClose }: { grant: Grant; onConfirm: (reason: string) => void; onClose: () => void }) {
    const [reason, setReason] = useState('');
    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:420, border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>Révoquer la délégation</span>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={16}/></button>
                </div>
                <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>
                    <div style={{ fontSize:12, color:'#475569' }}>
                        Délégation du rôle <strong>{grant.role_label}</strong> à <strong>{grant.grantee?.name}</strong>
                        {grant.expires_at && ` — expire le ${fmt(grant.expires_at)}`}.
                    </div>
                    <div>
                        <label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:5 }}>
                            Motif de révocation (facultatif)
                        </label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                                  style={{ width:'100%', padding:'9px 12px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:8, outline:'none', resize:'vertical', boxSizing:'border-box' }}
                                  placeholder="ex : Retour de congé anticipé…"/>
                    </div>
                    <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button onClick={() => onConfirm(reason)}
                                style={{ background:'#dc2626', color:'#fff', border:'none' }}>
                            <UserX size={13}/> Révoquer
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DelegationsIndex({ granted, received, colleagues, delegatableRoles, can }: Props) {
    const [showForm,    setShowForm]    = useState(false);
    const [revokeGrant, setRevokeGrant] = useState<Grant | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        grantee_id: '',
        role_name:  '',
        expires_at: '',
        reason:     '',
    });

    // ── FIX 1 : vider le formulaire + fermer après succès ─────
    const handleSubmit = () => {
        post(route('admin.delegations.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    // ── FIX 2 : fermer le modal après réponse du serveur ──────
    const handleRevoke = (reason: string) => {
        if (!revokeGrant) return;
        router.patch(
            route('admin.delegations.revoke', { grant: revokeGrant.id }),
            { reason },
            {
                onSuccess: () => setRevokeGrant(null),
                onError:   () => setRevokeGrant(null),
            }
        );
    };

    const activeGranted  = granted.filter(g => g.status === 'ACTIVE');
    const historyGranted = granted.filter(g => g.status !== 'ACTIVE');
    const hasRoles       = Object.keys(delegatableRoles).length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Délégations de rôle — NSIA Transport"/>
            <style>{`
                .dl-page{padding:4px;display:flex;flex-direction:column;gap:16px;max-width:900px;margin:0 auto;}
                .dl-hdr{display:flex;align-items:center;justify-content:space-between;}
                .dl-title{font-size:18px;font-weight:600;color:#1e293b;}
                .dl-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .dl-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
                .dl-section{background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                .dl-section-hdr{padding:13px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
                .dl-section-ico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
                .dl-section-ttl{font-size:13px;font-weight:600;color:#1e293b;}
                .dl-section-body{padding:16px;}
                .dl-empty{font-size:12px;color:#94a3b8;text-align:center;padding:20px 0;}
                .form-card{background:#fff;border:1.5px solid #1e3a8a;border-radius:12px;overflow:hidden;}
                .form-card-hdr{padding:13px 18px;background:#1e3a8a;display:flex;align-items:center;justify-content:space-between;}
                .form-card-ttl{font-size:13px;font-weight:600;color:#fff;}
                .form-card-body{padding:18px;display:flex;flex-direction:column;gap:14px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
                .hs-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="al-page">

                    {/* Header */}
                    <div className="dl-hdr mb-4">
                        <div>
                            <h1 className="dl-title">Délégations de rôle</h1>
                            <p className="dl-sub">Délégation temporaire de rôles de validation (congés, absences)</p>
                        </div>
                        {can.create && !showForm && hasRoles && (
                            <Button onClick={() => setShowForm(true)}
                                    className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                <Plus size={14}/> Nouvelle délégation
                            </Button>
                        )}
                    </div>

                    {/* Délégations reçues actives */}
                    {received.length > 0 && (
                        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'12px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                                <Shield size={14} color="#1d4ed8"/>
                                <span style={{ fontSize:13, fontWeight:600, color:'#1d4ed8' }}>
                                    Vous avez {received.length} délégation(s) de rôle active(s)
                                </span>
                            </div>
                            {received.map(g => (
                                <div key={g.id} style={{ fontSize:12, color:'#1d4ed8', marginBottom:4, display:'flex', gap:8, alignItems:'center' }}>
                                    <Shield size={10}/>
                                    <span>Rôle <strong>{g.role_label}</strong></span>
                                    <span>· De {g.grantor?.name}</span>
                                    {g.expires_at && <span>· jusqu'au {fmt(g.expires_at)}</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Formulaire */}
                    {showForm && can.create && (
                        <div className="form-card">
                            <div className="form-card-hdr">
                                <span className="form-card-ttl">Nouvelle délégation de rôle</span>
                                <button onClick={() => { setShowForm(false); reset(); }}
                                        style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)' }}>
                                    <X size={16}/>
                                </button>
                            </div>
                            <div className="form-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Délégataire *
                                        </Label>
                                        <select value={data.grantee_id} onChange={e => setData('grantee_id', e.target.value)}
                                                className="hs-select">
                                            <option value="">— Choisir un collègue —</option>
                                            {colleagues.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.first_name} {c.last_name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.grantee_id && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.grantee_id}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Rôle à déléguer *
                                        </Label>
                                        <select value={data.role_name} onChange={e => setData('role_name', e.target.value)}
                                                className="hs-select">
                                            <option value="">— Choisir un rôle —</option>
                                            {Object.entries(delegatableRoles).map(([role, label]) => (
                                                <option key={role} value={role}>{label as string}</option>
                                            ))}
                                        </select>
                                        {errors.role_name && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.role_name}</p>}
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Date d'expiration *
                                        </Label>
                                        <Input type="date" className="h-11" value={data.expires_at}
                                               onChange={e => setData('expires_at', e.target.value)}/>
                                        {errors.expires_at && <p style={{ fontSize:11, color:'#dc2626' }}>{errors.expires_at}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                            Motif (facultatif)
                                        </Label>
                                        <Input className="h-11" value={data.reason}
                                               onChange={e => setData('reason', e.target.value)}
                                               placeholder="ex : Congés, déplacement…"/>
                                    </div>
                                </div>

                                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400e' }}>
                                    Le délégataire héritera de toutes les permissions du rôle délégué jusqu'à la date d'expiration.
                                </div>

                                <div style={{ display:'flex', gap:8 }}>
                                    <Button disabled={processing || !data.grantee_id || !data.role_name || !data.expires_at}
                                            onClick={handleSubmit}
                                            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                        {processing ? 'Enregistrement…' : <><UserCheck size={13}/> Créer la délégation</>}
                                    </Button>
                                    <Button variant="outline" onClick={() => { setShowForm(false); reset(); }}>
                                        Annuler
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grille */}
                    <div className="dl-grid mt-4">
                        <div className="dl-section">
                            <div className="dl-section-hdr">
                                <div className="dl-section-ico" style={{ background:'#f0fdf4' }}>
                                    <UserCheck size={14} color="#15803d"/>
                                </div>
                                <span className="dl-section-ttl">Délégations actives ({activeGranted.length})</span>
                            </div>
                            <div className="dl-section-body">
                                {activeGranted.length === 0 ? (
                                    <div className="dl-empty">Aucune délégation active.</div>
                                ) : activeGranted.map(g => (
                                    <GrantCard key={g.id} grant={g} onRevoke={() => setRevokeGrant(g)}/>
                                ))}
                            </div>
                        </div>

                        <div className="dl-section">
                            <div className="dl-section-hdr">
                                <div className="dl-section-ico" style={{ background:'#f8fafc' }}>
                                    <Clock size={14} color="#64748b"/>
                                </div>
                                <span className="dl-section-ttl">Historique ({historyGranted.length})</span>
                            </div>
                            <div className="dl-section-body">
                                {historyGranted.length === 0 ? (
                                    <div className="dl-empty">Aucun historique.</div>
                                ) : historyGranted.map(g => (
                                    <GrantCard key={g.id} grant={g}/>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {revokeGrant && (
                <RevokeModal
                    grant={revokeGrant}
                    onConfirm={handleRevoke}
                    onClose={() => setRevokeGrant(null)}
                />
            )}
        </AppLayout>
    );
}