import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Edit2, ToggleLeft, ToggleRight,
    X, ChevronLeft, ChevronRight,
    Globe, DollarSign, Ship, Package, Truck, Layers,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Données de référence', href: '/admin/reference' },
];

interface RefItem  { [key: string]: any; }
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number; total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    tab:     string;
    data:    Paginated<RefItem>;
    filters: { search?: string };
    counts:  Record<string, number>;
}

// ── Config des onglets ────────────────────────────────────────
const TABS = [
    { key:'countries',              label:'Pays',             icon: Globe,       color:'#3b82f6' },
    { key:'currencies',             label:'Devises',          icon: DollarSign,  color:'#16a34a' },
    { key:'incoterms',              label:'Incoterms',        icon: Ship,        color:'#7c3aed' },
    { key:'transport_modes',        label:'Transports',       icon: Truck,       color:'#0f766e' },
    { key:'merchandise_categories', label:'Marchandises',     icon: Package,     color:'#f97316' },
];

// ── Colonnes et champs par onglet ─────────────────────────────
const CONFIG: Record<string, {
    columns: string[];
    fields:  string[];
    pk:      string;
    canToggle: boolean;
}> = {
    countries: {
        columns:   ['Code', 'Nom FR', 'Nom EN', 'Région'],
        fields:    ['code', 'name_fr', 'name_en', 'region'],
        pk:        'code',
        canToggle: false,
    },
    currencies: {
        columns:   ['Code', 'Nom', 'Symbole'],
        fields:    ['code', 'name', 'symbol'],
        pk:        'code',
        canToggle: true,
    },
    incoterms: {
        columns:   ['Code', 'Nom', 'Description', 'Modes compatibles'],
        fields:    ['code', 'name', 'description', 'compatible_modes'],
        pk:        'code',
        canToggle: false,
    },
    transport_modes: {
        columns:   ['Code', 'Nom FR', 'Nom EN', 'Icône'],
        fields:    ['code', 'name_fr', 'name_en', 'icon'],
        pk:        'id',
        canToggle: false,
    },
    merchandise_categories: {
        columns:   ['Code', 'Nom', 'Niveau de risque', 'Parent'],
        fields:    ['code', 'name', 'risk_level', 'parent'],
        pk:        'id',
        canToggle: true,
    },
};

// ── Champs formulaire création/édition par onglet ─────────────
const FORM_FIELDS: Record<string, { key: string; label: string; type: 'text'|'boolean'|'number'|'textarea'|'array' }[]> = {
    countries: [
        { key:'code',    label:'Code ISO (2 lettres)', type:'text' },
        { key:'name_fr', label:'Nom en français',      type:'text' },
        { key:'name_en', label:'Nom en anglais',       type:'text' },
        { key:'region',  label:'Région',               type:'text' },
    ],
    currencies: [
        { key:'code',      label:'Code ISO (3 lettres)', type:'text' },
        { key:'name',      label:'Nom',                  type:'text' },
        { key:'symbol',    label:'Symbole',              type:'text' },
        { key:'is_active', label:'Active',               type:'boolean' },
    ],
    incoterms: [
        { key:'code',        label:'Code',          type:'text' },
        { key:'name',        label:'Nom',           type:'text' },
        { key:'description', label:'Description',   type:'textarea' },
    ],
    transport_modes: [
        { key:'code',    label:'Code',        type:'text' },
        { key:'name_fr', label:'Nom FR',      type:'text' },
        { key:'name_en', label:'Nom EN',      type:'text' },
        { key:'icon',    label:'Icône',       type:'text' },
    ],
    merchandise_categories: [
        { key:'code',       label:'Code',             type:'text' },
        { key:'name',       label:'Nom',              type:'text' },
        { key:'risk_level', label:'Niveau de risque (1-3)', type:'number' },
    ],
};

const RISK_LABELS: Record<number, { label: string; color: string }> = {
    1: { label:'Faible',  color:'#15803d' },
    2: { label:'Moyen',   color:'#c2410c' },
    3: { label:'Élevé',   color:'#dc2626' },
};

// ── Modal créer / éditer ──────────────────────────────────────
function RefModal({ tab, item, onClose }: { tab: string; item?: RefItem; onClose: () => void }) {
    const isEdit    = !!item;
    const cfg       = CONFIG[tab];
    const formDefs  = FORM_FIELDS[tab] ?? [];
    const tabInfo   = TABS.find(t => t.key === tab);

    const initialData = Object.fromEntries(
        formDefs.map(f => [f.key, item?.[f.key] ?? (f.type === 'boolean' ? false : f.type === 'number' ? 1 : '')])
    );

    const { data, setData, post, put, processing, errors, reset } = useForm<Record<string, any>>(initialData);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const pk = item?.[cfg.pk];
        if (isEdit) {
            put(route('admin.reference.update', { tab, id: pk }), { onSuccess: onClose });
        } else {
            post(route('admin.reference.store', { tab }), { onSuccess: () => { reset(); onClose(); } });
        }
    };

    // Alias pour compatibilité avec le rendu
    const form = data;
    const setForm = (updater: any) => {
        if (typeof updater === 'function') {
            const next = updater(data);
            Object.entries(next).forEach(([k, v]) => setData(k as any, v));
        }
    };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:480, maxHeight:'85vh', display:'flex', flexDirection:'column', border:'1.5px solid #e2e8f0', boxShadow:'0 24px 64px rgba(0,0,0,.15)' }}>
                {/* Header */}
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:8, background:`${tabInfo?.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {tabInfo && <tabInfo.icon size={16} color={tabInfo.color}/>}
                        </div>
                        <p style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>
                            {isEdit ? 'Modifier' : 'Nouveau'} — {tabInfo?.label}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                        <X size={17}/>
                    </button>
                </div>

                {/* Body */}
                <div style={{ overflowY:'auto', flex:1, padding:'16px 20px' }}>
                    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        {formDefs.map(field => (
                            <div key={field.key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                                <label style={{ fontSize:10.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.08em' }}>
                                    {field.label}
                                </label>
                                {field.type === 'boolean' ? (
                                    <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}
                                         onClick={() => setForm(f => ({ ...f, [field.key]: !f[field.key] }))}>
                                        <div style={{ width:36, height:20, borderRadius:10, background: form[field.key] ? '#1e3a8a' : '#e2e8f0', position:'relative', transition:'background .2s', flexShrink:0 }}>
                                            <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: form[field.key] ? 19 : 3, transition:'left .2s' }}/>
                                        </div>
                                        <span style={{ fontSize:12, color:'#475569' }}>{form[field.key] ? 'Oui' : 'Non'}</span>
                                    </div>
                                ) : field.type === 'textarea' ? (
                                    <>
                                    <textarea value={form[field.key] ?? ''} rows={3}
                                              onChange={e => setForm((f: any) => ({ ...f, [field.key]: e.target.value }))}
                                              style={{ padding:'9px 12px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background: errors[field.key] ? '#fff8f8' : '#f8fafc', border:`1.5px solid ${errors[field.key] ? '#ef4444' : '#e2e8f0'}`, borderRadius:8, outline:'none', resize:'vertical', boxSizing:'border-box', width:'100%' }}/>
                                    {errors[field.key] && <p style={{ fontSize:11, color:'#ef4444', marginTop:2 }}>⚠ {errors[field.key]}</p>}
                                    </>
                                ) : (
                                    <input
                                        type={field.type === 'number' ? 'number' : 'text'}
                                        min={field.type === 'number' ? 1 : undefined}
                                        max={field.type === 'number' ? 3 : undefined}
                                        value={form[field.key] ?? ''}
                                        onChange={e => setForm((f: any) => ({ ...f, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                                        disabled={isEdit && field.key === 'code'}
                                        style={{ padding:'9px 12px', fontSize:13, fontFamily:'inherit', color:'#1e293b', background: errors[field.key] ? '#fff8f8' : '#f8fafc', border:`1.5px solid ${errors[field.key] ? '#ef4444' : '#e2e8f0'}`, borderRadius:8, outline:'none', opacity: isEdit && field.key === 'code' ? .6 : 1 }}
                                    />
                                )}
                                {errors[field.key] && (
                                    <p style={{ fontSize:11, color:'#ef4444', display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                                        ⚠ {errors[field.key]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </form>
                </div>

                {/* Footer */}
                <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={submit as any} className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white">
                        {isEdit ? 'Enregistrer' : 'Créer'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────
export default function ReferenceIndex({ tab, data, filters, counts }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editItem,  setEditItem]  = useState<RefItem | null>(null);
    const [search,    setSearch]    = useState(filters?.search ?? '');

    const cfg        = CONFIG[tab] ?? CONFIG.countries;
    const currentTab = TABS.find(t => t.key === tab) ?? TABS[0];

    const changeTab = (key: string) =>
        router.get('/admin/reference', { tab: key }, { preserveState:false });

    const applyFilter = (params: Record<string, string>) =>
        router.get('/admin/reference', { tab, ...filters, ...params }, { preserveState:true, replace:true });

    const handleToggle = (item: RefItem) =>
        router.patch(route('admin.reference.toggle', { tab, id: item[cfg.pk] }));

    const renderCell = (item: RefItem, field: string) => {
        const v = item[field];
        if (v === null || v === undefined || v === '') return <span style={{ color:'#cbd5e1' }}>—</span>;

        // Booléen
        if (typeof v === 'boolean') return v
            ? <span style={{ fontSize:11, padding:'2px 7px', borderRadius:8, background:'#f0fdf4', color:'#15803d', border:'1px solid #bbf7d0' }}>Oui</span>
            : <span style={{ fontSize:11, padding:'2px 7px', borderRadius:8, background:'#f8fafc', color:'#94a3b8', border:'1px solid #e2e8f0' }}>Non</span>;

        // Niveau de risque
        if (field === 'risk_level') {
            const r = RISK_LABELS[v];
            return r
                ? <span style={{ fontSize:11, padding:'2px 8px', borderRadius:8, background:`${r.color}15`, color:r.color, fontWeight:500 }}>{r.label}</span>
                : <span>{v}</span>;
        }

        // Parent catégorie
        if (field === 'parent') return <span style={{ fontSize:11, color:'#64748b' }}>{v?.code ?? '—'}</span>;

        // Modes compatibles (array)
        if (field === 'compatible_modes' && Array.isArray(v)) return (
            <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                {v.map(m => <span key={m} style={{ fontSize:10, padding:'1px 5px', borderRadius:5, background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe' }}>{m}</span>)}
            </div>
        );

        // Texte long
        if (typeof v === 'string' && v.length > 60) return <span title={v} style={{ fontSize:12 }}>{v.slice(0,60)}…</span>;

        return <span style={{ fontSize:12 }}>{String(v)}</span>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Données de référence — NSIA Transport"/>
            <style>{`
                .ref-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .ref-hdr{display:flex;align-items:center;justify-content:space-between;}
                .ref-title{font-size:18px;font-weight:600;color:#1e293b;}
                .ref-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .ref-tabs{display:flex;gap:6px;flex-wrap:wrap;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:8px;}
                .ref-tab{display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:9px;cursor:pointer;font-size:13px;color:#64748b;border:none;background:none;font-family:inherit;transition:all .15s;white-space:nowrap;}
                .ref-tab:hover{background:#f8fafc;color:#1e293b;}
                .ref-tab.active{background:#1e3a8a;color:#fff;font-weight:500;}
                .ref-tab-count{font-size:10px;padding:1px 6px;border-radius:8px;margin-left:2px;}
                .ref-tab.active .ref-tab-count{background:rgba(255,255,255,.2);color:#fff;}
                .ref-tab:not(.active) .ref-tab-count{background:#f1f5f9;color:#94a3b8;}
                .ref-toolbar{display:flex;gap:8px;}
                .ref-search{display:flex;gap:0;flex:1;min-width:200px;}
                .ref-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .ref-search input:focus{border-color:#1e3a8a;}
                .ref-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .ref-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 14px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:11px 14px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .code-badge{font-family:monospace;font-size:11px;font-weight:600;padding:2px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;color:#1e293b;}
                .s-active{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:8px;background:#f0fdf4;color:#15803d;font-size:10px;font-weight:500;}
                .s-inactive{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:8px;background:#f1f5f9;color:#64748b;font-size:10px;font-weight:500;}
                .s-dot{width:4px;height:4px;border-radius:50%;}
                .actions{display:flex;gap:5px;}
                .btn-act{padding:4px 9px;border-radius:6px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;}
                .btn-edit{color:#1d4ed8;border-color:#bfdbfe;} .btn-edit:hover{background:#eff6ff;}
                .btn-on{color:#dc2626;border-color:#fecaca;} .btn-on:hover{background:#fef2f2;}
                .btn-off{color:#059669;border-color:#a7f3d0;} .btn-off:hover{background:#ecfdf5;}
                .ref-pagination{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid #f8fafc;}
                .ref-pg-info{font-size:12px;color:#94a3b8;}
                .ref-pg-links{display:flex;gap:4px;}
                .pg-btn{width:28px;height:28px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .ref-empty{padding:40px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ref-page">

                    {/* Header */}
                    <div className="ref-hdr">
                        <div>
                            <h1 className="ref-title">Données de référence</h1>
                            <p className="ref-sub">Tables de référence utilisées dans les contrats et certificats</p>
                        </div>
                        <Button onClick={() => { setEditItem(null); setShowModal(true); }}
                                className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-4">
                            <Plus size={15}/> Nouvelle entrée
                        </Button>
                    </div>

                    {/* Onglets */}
                    <div className="ref-tabs">
                        {TABS.map(t => (
                            <button key={t.key} className={`ref-tab ${tab === t.key ? 'active' : ''}`}
                                    onClick={() => changeTab(t.key)}>
                                <t.icon size={14}/>
                                {t.label}
                                <span className="ref-tab-count">{counts[t.key] ?? 0}</span>
                            </button>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="ref-toolbar">
                        <form className="ref-search" onSubmit={e => { e.preventDefault(); applyFilter({ search, page:'1' }); }}>
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                   placeholder={`Rechercher dans ${currentTab.label.toLowerCase()}…`}/>
                            <button type="submit"><Search size={14}/></button>
                        </form>
                        {filters?.search && (
                            <button onClick={() => router.get('/admin/reference', { tab })}
                                    style={{ padding:'9px 12px', background:'none', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                                <X size={12}/> Effacer
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="ref-card">
                        {data.data.length === 0 ? (
                            <div className="ref-empty">Aucune entrée trouvée dans {currentTab.label}.</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            {cfg.columns.map(col => <th key={col}>{col}</th>)}
                                            {cfg.canToggle && <th>Statut</th>}
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.data.map((item, i) => (
                                            <tr key={item[cfg.pk] ?? i}>
                                                {cfg.fields.map((field, fi) => (
                                                    <td key={field}>
                                                        {fi === 0
                                                            ? <span className="code-badge">{item[field]}</span>
                                                            : renderCell(item, field)
                                                        }
                                                    </td>
                                                ))}
                                                {cfg.canToggle && (
                                                    <td>
                                                        {item.is_active
                                                            ? <span className="s-active"><span className="s-dot" style={{ background:'#22c55e' }}/>Actif</span>
                                                            : <span className="s-inactive"><span className="s-dot" style={{ background:'#94a3b8' }}/>Inactif</span>
                                                        }
                                                    </td>
                                                )}
                                                <td>
                                                    <div className="actions">
                                                        <button className="btn-act btn-edit"
                                                                onClick={() => { setEditItem(item); setShowModal(true); }}>
                                                            <Edit2 size={11}/> Modifier
                                                        </button>
                                                        {cfg.canToggle && (
                                                            <button className={`btn-act ${item.is_active ? 'btn-on' : 'btn-off'}`}
                                                                    onClick={() => handleToggle(item)}>
                                                                {item.is_active
                                                                    ? <><ToggleLeft size={11}/> Désactiver</>
                                                                    : <><ToggleRight size={11}/> Activer</>
                                                                }
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {data.last_page > 1 && (
                                    <div className="ref-pagination">
                                        <span className="ref-pg-info">
                                            Page {data.current_page}/{data.last_page} · {data.total} entrées
                                        </span>
                                        <div className="ref-pg-links">
                                            <button className="pg-btn" disabled={data.current_page === 1}
                                                    onClick={() => applyFilter({ page: String(data.current_page - 1) })}>
                                                <ChevronLeft size={12}/>
                                            </button>
                                            {data.links.map((link, i) => {
                                                if (i === 0 || i === data.links.length - 1) return null;
                                                return (
                                                    <button key={`p-${i}`} className={`pg-btn ${link.active ? 'act' : ''}`}
                                                            onClick={() => link.url && applyFilter({ page: link.label })}
                                                            disabled={!link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}/>
                                                );
                                            })}
                                            <button className="pg-btn" disabled={data.current_page === data.last_page}
                                                    onClick={() => applyFilter({ page: String(data.current_page + 1) })}>
                                                <ChevronRight size={12}/>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <RefModal
                    tab={tab}
                    item={editItem ?? undefined}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                />
            )}
        </AppLayout>
    );
}