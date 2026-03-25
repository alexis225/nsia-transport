import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Plus, Eye, Edit2, Trash2, FileText,
    Building2, Check, X, Globe, Languages,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Modèles de certificats', href: '/admin/certificate-templates' },
];

interface Tenant   { id: string; name: string; code: string; }
interface Template {
    id: string; name: string; code: string; type: string;
    company_name: string; currency_code: string; city: string | null;
    is_bilingual: boolean; is_active: boolean;
    number_prefix: string; last_number: number; number_padding: number;
    logo_path: string | null;
    tenant: Tenant | null;
}
interface Props {
    templates:              Template[];
    tenantsWithoutTemplate: Tenant[];
}

const TYPE_STYLES = {
    ordre_assurance:      { label:'Ordre d\'assurance',    bg:'#eff6ff', color:'#1d4ed8' },
    certificat_assurance: { label:'Certificat d\'assurance', bg:'#f0fdf4', color:'#15803d' },
};

const FLAG: Record<string, string> = {
    GA:'🇬🇦', GN:'🇬🇳', TG:'🇹🇬', BJ:'🇧🇯', CM:'🇨🇲',
    CG:'🇨🇬', CI:'🇨🇮', SN:'🇸🇳', ML:'🇲🇱', MG:'🇲🇬',
};

export default function CertificateTemplatesIndex({ templates, tenantsWithoutTemplate }: Props) {
    const handleDelete = (t: Template) => {
        if (confirm(`Supprimer le modèle « ${t.name} » ?`))
            router.delete(route('admin.certificate-templates.destroy', { certificateTemplate: t.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modèles de certificats — NSIA Transport"/>
            <style>{`
                .ct-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .ct-hdr{display:flex;align-items:center;justify-content:space-between;}
                .ct-title{font-size:18px;font-weight:600;color:#1e293b;}
                .ct-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .ct-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;}
                .ct-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;transition:box-shadow .2s;}
                .ct-card:hover{box-shadow:0 4px 18px rgba(0,0,0,.07);}
                .ct-card-top{padding:18px 20px;border-bottom:1px solid #f8fafc;display:flex;align-items:center;gap:14px;}
                .ct-logo{width:56px;height:56px;border-radius:12px;background:#f8fafc;border:1.5px solid #e2e8f0;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;overflow:hidden;}
                .ct-logo img{width:100%;height:100%;object-fit:contain;padding:4px;}
                .ct-info{flex:1;}
                .ct-name{font-size:14px;font-weight:600;color:#1e293b;margin-bottom:3px;}
                .ct-company{font-size:11px;color:#64748b;}
                .ct-body{padding:14px 20px;display:flex;flex-direction:column;gap:8px;}
                .ct-row{display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b;}
                .ct-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:500;}
                .ct-footer{padding:12px 20px;border-top:1px solid #f8fafc;display:flex;gap:6px;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;text-decoration:none;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-edit{color:#0f766e;border-color:#99f6e4;} .btn-edit:hover{background:#f0fdfa;}
                .btn-del{color:#dc2626;border-color:#fecaca;} .btn-del:hover{background:#fef2f2;}
                .ct-empty{background:#fff;border:1.5px dashed #e2e8f0;border-radius:14px;padding:40px;text-align:center;color:#94a3b8;font-size:13px;}
                .ct-alert{background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:14px 18px;display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#92400e;}
                .ct-alert-tenants{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
                .ct-tenant-chip{padding:3px 9px;background:#fff;border:1px solid #fde68a;border-radius:8px;font-size:11px;color:#92400e;}
                .num-badge{font-family:monospace;font-size:11px;padding:2px 7px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;color:#475569;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ct-page">

                    {/* Header */}
                    <div className="ct-hdr">
                        <div>
                            <h1 className="ct-title">Modèles de certificats</h1>
                            <p className="ct-sub">{templates.length} modèle{templates.length > 1 ? 's' : ''} configuré{templates.length > 1 ? 's' : ''}</p>
                        </div>
                        <Link href={route('admin.certificate-templates.create')}>
                            <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                                <Plus size={15}/> Nouveau modèle
                            </Button>
                        </Link>
                    </div>

                    {/* Alerte filiales sans modèle */}
                    {tenantsWithoutTemplate.length > 0 && (
                        <div className="ct-alert">
                            <span style={{ fontSize:18 }}>⚠️</span>
                            <div>
                                <div style={{ fontWeight:600, marginBottom:4 }}>
                                    {tenantsWithoutTemplate.length} filiale{tenantsWithoutTemplate.length > 1 ? 's' : ''} sans modèle de certificat
                                </div>
                                <div className="ct-alert-tenants">
                                    {tenantsWithoutTemplate.map(t => (
                                        <span key={t.id} className="ct-tenant-chip">
                                            {FLAG[t.code] ?? '🏢'} {t.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grille de modèles */}
                    {templates.length === 0 ? (
                        <div className="ct-empty">
                            <FileText size={32} style={{ margin:'0 auto 12px', opacity:.3 }}/>
                            <p>Aucun modèle configuré. Créez le premier modèle.</p>
                        </div>
                    ) : (
                        <div className="ct-grid">
                            {templates.map(t => {
                                const ts = TYPE_STYLES[t.type as keyof typeof TYPE_STYLES];
                                const nextNum = (t.number_prefix ?? 'N°') + String(t.last_number + 1).padStart(t.number_padding, '0');

                                return (
                                    <div key={t.id} className="ct-card">
                                        <div className="ct-card-top">
                                            <div className="ct-logo">
                                                {t.logo_path
                                                    ? <img src={`/storage/${t.logo_path}`} alt={t.company_name}/>
                                                    : <span>{FLAG[t.code] ?? '🏢'}</span>
                                                }
                                            </div>
                                            <div className="ct-info">
                                                <div className="ct-name">{t.name}</div>
                                                <div className="ct-company">{t.company_name}</div>
                                            </div>
                                            {t.is_active
                                                ? <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', flexShrink:0 }}/>
                                                : <span style={{ width:8, height:8, borderRadius:'50%', background:'#94a3b8', flexShrink:0 }}/>
                                            }
                                        </div>

                                        <div className="ct-body">
                                            <div className="ct-row">
                                                <FileText size={12}/>
                                                <span className="ct-badge" style={{ background: ts.bg, color: ts.color }}>
                                                    {ts.label}
                                                </span>
                                            </div>
                                            <div className="ct-row">
                                                <Building2 size={12}/>
                                                {t.tenant?.name ?? '—'} · {t.currency_code}
                                                {t.city && <span style={{ color:'#94a3b8' }}>· {t.city}</span>}
                                            </div>
                                            <div className="ct-row">
                                                <span style={{ fontSize:10, color:'#94a3b8' }}>Prochain N° :</span>
                                                <span className="num-badge">{nextNum}</span>
                                            </div>
                                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                                {t.is_bilingual && (
                                                    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, padding:'2px 6px', borderRadius:6, background:'#fdf4ff', color:'#7c3aed', border:'1px solid #e9d5ff' }}>
                                                        <Languages size={9}/> Bilingue FR/EN
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="ct-footer">
                                            <Link href={route('admin.certificate-templates.show', { certificateTemplate: t.id })} className="btn-act btn-view">
                                                <Eye size={12}/> Voir
                                            </Link>
                                            <Link href={route('admin.certificate-templates.edit', { certificateTemplate: t.id })} className="btn-act btn-edit">
                                                <Edit2 size={12}/> Éditer
                                            </Link>
                                            <button className="btn-act btn-del" onClick={() => handleDelete(t)}>
                                                <Trash2 size={12}/> Supprimer
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}