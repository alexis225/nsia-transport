import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface LimitStatus {
    subscription_limit: number | null;
    used_limit: number;
    remaining_limit: number | null;
    usage_percent: number;
    certificates_count: number;
    certificates_limit: number | null;
    alert_level: 'ok' | 'warning' | 'critical';
    can_issue: boolean;
    currency_code: string;
    recent_certs: {
        id: string; certificate_number: string;
        insured_value: number; status: string; date: string | null;
    }[];
    updated_at: string;
}

interface Props {
    contractId:    string;
    initialStatus: LimitStatus;
}

const ALERT = {
    critical: { bar:'#ef4444', text:'#dc2626', bg:'#fef2f2', border:'#fecaca', label:'Critique' },
    warning:  { bar:'#f59e0b', text:'#92400e', bg:'#fffbeb', border:'#fde68a', label:'Alerte'   },
    ok:       { bar:'#22c55e', text:'#15803d', bg:'#f0fdf4', border:'#bbf7d0', label:'Normal'   },
};

const fmt = (n: number, c: string) =>
    n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' ' + c;

export default function ContractLimitWidget({ contractId, initialStatus }: Props) {
    const [status,    setStatus]    = useState<LimitStatus>(initialStatus);
    const [loading,   setLoading]   = useState(false);
    const [lastUpdate,setLastUpdate]= useState<Date>(new Date());

    const refresh = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/admin/contracts/${contractId}/limit-status`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                setLastUpdate(new Date());
            }
        } catch {}
        setLoading(false);
    };

    // Polling toutes les 60 secondes
    useEffect(() => {
        const interval = setInterval(refresh, 60_000);
        return () => clearInterval(interval);
    }, [contractId]);

    if (!status.subscription_limit) return null;

    const al = ALERT[status.alert_level];

    return (
        <div style={{ background:'#fff', border:`1.5px solid ${status.alert_level === 'ok' ? '#e2e8f0' : al.border}`, borderRadius:14, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background: al.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <TrendingUp size={15} color={al.text}/>
                    </div>
                    <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>Plafond NN300</div>
                        <div style={{ fontSize:10, color:'#94a3b8' }}>
                            Mis à jour {lastUpdate.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
                        </div>
                    </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:500, background: al.bg, border:`1px solid ${al.border}`, color: al.text }}>
                        {status.alert_level === 'ok' ? <CheckCircle size={10}/> : <AlertTriangle size={10}/>}
                        {al.label}
                    </span>
                    <button onClick={refresh} disabled={loading}
                            style={{ background:'none', border:'1px solid #e2e8f0', borderRadius:7, padding:'4px 8px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#64748b' }}>
                        <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
                        Actualiser
                    </button>
                </div>
            </div>

            <div style={{ padding:20 }}>
                {/* Barre de progression principale */}
                <div style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                        <span style={{ fontSize:12, color:'#64748b' }}>Utilisation du plafond</span>
                        <span style={{ fontSize:24, fontWeight:700, color: al.text }}>{status.usage_percent}%</span>
                    </div>
                    <div style={{ height:10, background:'#f1f5f9', borderRadius:5, overflow:'hidden' }}>
                        <div style={{
                            height:'100%', borderRadius:5,
                            width:`${status.usage_percent}%`,
                            background: al.bar,
                            transition:'width .5s ease',
                        }}/>
                    </div>
                    {!status.can_issue && (
                        <div style={{ marginTop:6, fontSize:11, color:'#dc2626', display:'flex', alignItems:'center', gap:4 }}>
                            <AlertTriangle size={11}/>
                            Plafond atteint — émission de nouveaux certificats bloquée
                        </div>
                    )}
                </div>

                {/* Montants */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                    {[
                        { label:'Utilisé',   value: fmt(status.used_limit, status.currency_code),                       color:'#1e293b' },
                        { label:'Restant',   value: fmt(status.remaining_limit ?? 0, status.currency_code),              color: al.text   },
                        { label:'Plafond',   value: fmt(status.subscription_limit, status.currency_code),                color:'#64748b' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
                            <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{label}</div>
                            <div style={{ fontSize:12, fontWeight:600, fontFamily:'monospace', color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Certificats */}
                {(status.certificates_limit !== null || status.certificates_count > 0) && (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'#f8fafc', borderRadius:8, marginBottom:16 }}>
                        <span style={{ fontSize:12, color:'#64748b' }}>Certificats émis</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#1e293b', fontFamily:'monospace' }}>
                            {status.certificates_count}
                            {status.certificates_limit && ` / ${status.certificates_limit}`}
                        </span>
                    </div>
                )}

                {/* Derniers mouvements */}
                {status.recent_certs.length > 0 && (
                    <div>
                        <div style={{ fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
                            Derniers mouvements
                        </div>
                        {status.recent_certs.map(cert => (
                            <div key={cert.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #f8fafc' }}>
                                <div>
                                    <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:'#1e293b' }}>
                                        {cert.certificate_number}
                                    </span>
                                    <span style={{ fontSize:10, color:'#94a3b8', marginLeft:6 }}>{cert.date}</span>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                    <span style={{
                                        fontSize:11, fontFamily:'monospace', fontWeight:500,
                                        color: cert.status === 'CANCELLED' ? '#94a3b8' : '#1e293b',
                                        textDecoration: cert.status === 'CANCELLED' ? 'line-through' : 'none',
                                    }}>
                                        {cert.status === 'CANCELLED' ? '−' : '+'}{cert.insured_value.toLocaleString('fr-FR')}
                                    </span>
                                    <span style={{
                                        fontSize:10, padding:'1px 5px', borderRadius:6,
                                        background: cert.status === 'ISSUED' ? '#f0fdf4' : '#f8fafc',
                                        color: cert.status === 'ISSUED' ? '#15803d' : '#94a3b8',
                                    }}>
                                        {cert.status === 'ISSUED' ? 'Émis' : 'Annulé'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}