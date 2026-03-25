import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { FileText, Plus, Trash2, Check, Camera } from 'lucide-react';
import { useRef, useState } from 'react';

interface Tenant { id: string; name: string; code: string; }
interface Props   { tenants: Tenant[]; }

const CURRENCIES = ['XOF','XAF','GNF','MGA','NGN','EUR','USD'];

export default function CertificateTemplateCreate({ tenants }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Modèles de certificats', href: '/admin/certificate-templates' },
        { title: 'Nouveau modèle' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        tenant_id:             '',
        name:                  '',
        code:                  '',
        type:                  'ordre_assurance',
        company_name:          '',
        company_address:       '',
        company_phone:         '',
        company_email:         '',
        company_website:       '',
        company_rccm:          '',
        company_capital:       '',
        legal_framework:       '',
        currency_code:         'XOF',
        city:                  '',
        number_prefix:         'N°',
        number_padding:        6,
        is_bilingual:          false,
        has_container_options: true,
        has_flight_number:     true,
        has_vessel_name:       true,
        has_currency_rate:     false,
        footer_text:           '',
        prime_breakdown_lines: [
            { key:'ro',          label:'R.O./C.F.A',   label_en:'' },
            { key:'rg',          label:'R.G./C.F.A',   label_en:'' },
            { key:'surprime',    label:'SURPRIME',      label_en:'' },
            { key:'prime_nette', label:'PRIME NETTE',   label_en:'' },
        ] as { key: string; label: string; label_en: string }[],
        is_active: true,
        logo: null as File | null,
    });

    const [pendingLogo, setPendingLogo] = useState<File | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Soumettre sans le logo (JSON pur, pas de FormData)
        // Le logo sera uploadé séparément après création via updateLogo
        post(route('admin.certificate-templates.store'), {
            onSuccess: (page: any) => {
                // Si un logo a été sélectionné, l'uploader après création
                if (pendingLogo) {
                    const newId = (page.props as any)?.flash?.templateId;
                    if (newId) {
                        const fd = new FormData();
                        fd.append('logo', pendingLogo);
                        router.post(
                            route('admin.certificate-templates.logo', { certificateTemplate: newId }),
                            fd, { forceFormData: true }
                        );
                    }
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau modèle — NSIA Transport"/>
            <TemplateForm
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                tenants={tenants}
                heroTitle="Nouveau modèle de certificat"
                heroSub="Configurez le template selon la filiale"
                submitLabel="Créer le modèle"
            />
        </AppLayout>
    );
}

// ── Formulaire partagé ────────────────────────────────────────
export function TemplateForm({ data, setData, errors, processing, onSubmit, tenants, heroTitle, heroSub, submitLabel, logoCard }: any) {

    const fileRef                       = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        data.logo_path ? `/storage/${data.logo_path}` : null
    );

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setData('logo', file);
        setPendingLogo(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const addPrimeLine = () =>
        setData('prime_breakdown_lines', [
            ...data.prime_breakdown_lines,
            { key: `line_${Date.now()}`, label: '', label_en: '' },
        ]);

    const removePrimeLine = (i: number) =>
        setData('prime_breakdown_lines', data.prime_breakdown_lines.filter((_: any, idx: number) => idx !== i));

    const updatePrimeLine = (i: number, field: string, value: string) => {
        const lines = [...data.prime_breakdown_lines];
        lines[i] = { ...lines[i], [field]: value };
        setData('prime_breakdown_lines', lines);
    };

    const Toggle = ({ field, label, hint }: { field: string; label: string; hint?: string }) => (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, cursor:'pointer' }}
             onClick={() => setData(field, !data[field])}>
            <div style={{ width:36, height:20, borderRadius:10, background: data[field] ? '#1e3a8a' : '#e2e8f0', position:'relative', transition:'background .2s', flexShrink:0 }}>
                <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: data[field] ? 19 : 3, transition:'left .2s' }}/>
            </div>
            <div>
                <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{label}</div>
                {hint && <div style={{ fontSize:11, color:'#94a3b8' }}>{hint}</div>}
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                .tf-wrap{width:100%;max-width:860px;margin:0 auto;padding:4px 16px;display:flex;flex-direction:column;gap:16px;}
                .tf-hero{background:linear-gradient(135deg,#1e2fa0 0%,#1a1f7a 55%,#14176a 100%);border-radius:16px;padding:22px 24px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
                .tf-hero::before{content:'';position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.05);}
                .tf-hero-ico{width:52px;height:52px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;}
                .tf-hero-info{position:relative;z-index:1;}
                .tf-hero-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:2px;}
                .tf-hero-sub{font-size:12px;color:rgba(255,255,255,0.5);}
                .tf-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                .tf-card-hdr{padding:15px 22px;border-bottom:1px solid #f1f5f9;}
                .tf-card-ttl{font-size:14px;font-weight:600;color:#1e293b;}
                .tf-card-sub{font-size:12px;color:#94a3b8;margin-top:1px;}
                .tf-card-body{padding:22px;display:flex;flex-direction:column;gap:14px;}
                .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .tf-label{font-size:10.5px !important;font-weight:600 !important;text-transform:uppercase !important;letter-spacing:.08em !important;color:#64748b !important;}
                .tf-select{width:100%;height:44px;padding:0 12px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;cursor:pointer;}
                .tf-select:focus{border-color:#3b82f6;}
                .tf-textarea{width:100%;padding:10px 13px;font-size:13px;font-family:inherit;color:#1e293b;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;outline:none;resize:vertical;box-sizing:border-box;}
                .prime-row{display:grid;grid-template-columns:120px 1fr 1fr 32px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #f8fafc;}
                .prime-row:last-child{border-bottom:none;}
                .prime-input{padding:7px 10px;font-size:12px;font-family:inherit;color:#1e293b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;outline:none;width:100%;}
                .logo-zone{display:flex;align-items:center;gap:16px;}
                .logo-preview{width:80px;height:80px;border-radius:12px;border:1.5px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;cursor:pointer;}
                .logo-preview img{width:100%;height:100%;object-fit:contain;padding:4px;}
                .logo-upload-btn{padding:8px 14px;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:9px;font-size:12px;color:#475569;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:all .15s;}
                .logo-upload-btn:hover{background:#f1f5f9;border-color:#94a3b8;}
                .logo-hint{font-size:11px;color:#94a3b8;margin-top:4px;}
                .logo-selected{font-size:11px;color:#16a34a;margin-top:4px;display:flex;align-items:center;gap:4px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="tf-wrap">

                    {/* Hero */}
                    <div className="tf-hero">
                        <div className="tf-hero-ico"><FileText size={22} color="rgba(255,255,255,0.8)"/></div>
                        <div className="tf-hero-info">
                            <div className="tf-hero-title">{heroTitle}</div>
                            <div className="tf-hero-sub">{heroSub}</div>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                        {/* ── Logo — card edit ou create ── */}
                        {logoCard ? logoCard : (
                            <div className="tf-card">
                                <div className="tf-card-hdr">
                                    <div className="tf-card-ttl">Logo de la filiale</div>
                                    <div className="tf-card-sub">Optionnel · JPG, PNG, WebP ou SVG · Max 2 Mo</div>
                                </div>
                                <div className="tf-card-body">
                                    <div className="logo-zone">
                                        <div className="logo-preview" onClick={() => fileRef.current?.click()}>
                                            {logoPreview
                                                ? <img src={logoPreview} alt="Logo"/>
                                                : <FileText size={24} color="#cbd5e1"/>
                                            }
                                        </div>
                                        <div>
                                            <input ref={fileRef} type="file"
                                                   accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                                   style={{ display:'none' }} onChange={handleLogoChange}/>
                                            <button type="button" className="logo-upload-btn" onClick={() => fileRef.current?.click()}>
                                                <Camera size={13}/> Choisir un logo
                                            </button>
                                            {data.logo
                                                ? <div className="logo-selected"><Check size={11}/>{(data.logo as File).name}</div>
                                                : <div className="logo-hint">Format JPG, PNG, WebP ou SVG · Max 2 Mo</div>
                                            }
                                        </div>
                                    </div>
                                    {errors.logo && <p style={{ fontSize:11, color:'#ef4444' }}>⚠ {errors.logo}</p>}
                                </div>
                            </div>
                        )}

                        {/* ── Identification ── */}
                        <div className="tf-card">
                            <div className="tf-card-hdr">
                                <div className="tf-card-ttl">Identification</div>
                            </div>
                            <div className="tf-card-body">
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Filiale *</Label>
                                        <select className="tf-select" value={data.tenant_id}
                                                onChange={e => setData('tenant_id', e.target.value)}>
                                            <option value="">Sélectionnez une filiale</option>
                                            {tenants?.map((t: Tenant) => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                            ))}
                                        </select>
                                        <InputError message={errors.tenant_id}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Type *</Label>
                                        <select className="tf-select" value={data.type}
                                                onChange={e => setData('type', e.target.value)}>
                                            <option value="ordre_assurance">Ordre d'assurance</option>
                                            <option value="certificat_assurance">Certificat d'assurance</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Nom du modèle *</Label>
                                        <Input className="h-11" value={data.name ?? ''}
                                               onChange={e => setData('name', e.target.value)}
                                               placeholder="ex: Ordre d'assurance NSIA Gabon"/>
                                        <InputError message={errors.name}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Code *</Label>
                                        <Input className="h-11" value={data.code ?? ''}
                                               onChange={e => setData('code', e.target.value.toUpperCase())}
                                               placeholder="ex: GA" maxLength={20}
                                               style={{ fontFamily:'monospace' }}/>
                                        <InputError message={errors.code}/>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Devise *</Label>
                                        <select className="tf-select" value={data.currency_code}
                                                onChange={e => setData('currency_code', e.target.value)}>
                                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Ville (ex: LIBREVILLE)</Label>
                                        <Input className="h-11" value={data.city ?? ''}
                                               onChange={e => setData('city', e.target.value.toUpperCase())}
                                               placeholder="ABIDJAN"/>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Préfixe numéro</Label>
                                        <Input className="h-11" value={data.number_prefix ?? ''}
                                               onChange={e => setData('number_prefix', e.target.value)}
                                               placeholder="N° ou Nr"/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Longueur numéro (chiffres)</Label>
                                        <Input className="h-11" type="number" min={4} max={10}
                                               value={data.number_padding}
                                               onChange={e => setData('number_padding', Number(e.target.value))}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Informations société ── */}
                        <div className="tf-card">
                            <div className="tf-card-hdr">
                                <div className="tf-card-ttl">Informations société</div>
                                <div className="tf-card-sub">Apparaissent dans l'en-tête du certificat</div>
                            </div>
                            <div className="tf-card-body">
                                <div className="grid gap-2">
                                    <Label className="tf-label">Raison sociale *</Label>
                                    <Input className="h-11" value={data.company_name ?? ''}
                                           onChange={e => setData('company_name', e.target.value)}
                                           placeholder="NSIA Gabon"/>
                                    <InputError message={errors.company_name}/>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Adresse</Label>
                                        <Input className="h-11" value={data.company_address ?? ''}
                                               onChange={e => setData('company_address', e.target.value)}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Téléphone</Label>
                                        <Input className="h-11" value={data.company_phone ?? ''}
                                               onChange={e => setData('company_phone', e.target.value)}/>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Email</Label>
                                        <Input className="h-11" type="email" value={data.company_email ?? ''}
                                               onChange={e => setData('company_email', e.target.value)}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Site web</Label>
                                        <Input className="h-11" value={data.company_website ?? ''}
                                               onChange={e => setData('company_website', e.target.value)}/>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="grid gap-2">
                                        <Label className="tf-label">N° RCCM</Label>
                                        <Input className="h-11" value={data.company_rccm ?? ''}
                                               onChange={e => setData('company_rccm', e.target.value)}/>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="tf-label">Capital social</Label>
                                        <Input className="h-11" value={data.company_capital ?? ''}
                                               onChange={e => setData('company_capital', e.target.value)}
                                               placeholder="1.200.000.000 F CFA"/>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="tf-label">Cadre légal (régime CIMA…)</Label>
                                    <textarea className="tf-textarea" rows={2} value={data.legal_framework ?? ''}
                                              onChange={e => setData('legal_framework', e.target.value)}/>
                                </div>
                            </div>
                        </div>

                        {/* ── Options formulaire ── */}
                        <div className="tf-card">
                            <div className="tf-card-hdr">
                                <div className="tf-card-ttl">Options du formulaire</div>
                                <div className="tf-card-sub">Champs à afficher sur le certificat</div>
                            </div>
                            <div className="tf-card-body">
                                <Toggle field="is_bilingual" label="Bilingue FR / EN" hint="Ajoute les traductions anglaises (Guinée)"/>
                                <Toggle field="has_container_options" label="Options Container / Groupage / Conventionnel" hint="Gabon"/>
                                <Toggle field="has_flight_number" label="Numéro de vol" hint="Avion"/>
                                <Toggle field="has_vessel_name" label="Nom du navire (S/S)" hint="Maritime"/>
                                <Toggle field="has_currency_rate" label="Unité monétaire + Cours" hint="Togo"/>
                            </div>
                        </div>

                        {/* ── Décompte prime ── */}
                        <div className="tf-card">
                            <div className="tf-card-hdr">
                                <div className="tf-card-ttl">Lignes du décompte de prime</div>
                                <div className="tf-card-sub">Définissez les lignes RO, RG, Surprime, etc.</div>
                            </div>
                            <div className="tf-card-body">
                                <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 1fr 32px', gap:8, marginBottom:8 }}>
                                    <span style={{ fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' }}>Clé</span>
                                    <span style={{ fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' }}>Libellé FR</span>
                                    <span style={{ fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' }}>Libellé EN</span>
                                    <span/>
                                </div>
                                {data.prime_breakdown_lines.map((line: any, i: number) => (
                                    <div key={i} className="prime-row">
                                        <input className="prime-input" value={line.key ?? ''}
                                               onChange={e => updatePrimeLine(i, 'key', e.target.value)}
                                               placeholder="ro"/>
                                        <input className="prime-input" value={line.label ?? ''}
                                               onChange={e => updatePrimeLine(i, 'label', e.target.value)}
                                               placeholder="R.O./C.F.A"/>
                                        <input className="prime-input" value={line.label_en ?? ''}
                                               onChange={e => updatePrimeLine(i, 'label_en', e.target.value)}
                                               placeholder="O.R (optionnel)"/>
                                        <button type="button" onClick={() => removePrimeLine(i)}
                                                style={{ width:28, height:28, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }}>
                                            <Trash2 size={11}/>
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={addPrimeLine}
                                        style={{ marginTop:8, padding:'6px 12px', background:'#f8fafc', border:'1.5px dashed #cbd5e1', borderRadius:8, cursor:'pointer', fontSize:12, color:'#475569', display:'flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                                    <Plus size={12}/> Ajouter une ligne
                                </button>
                            </div>
                        </div>

                        {/* ── Texte footer ── */}
                        <div className="tf-card">
                            <div className="tf-card-hdr">
                                <div className="tf-card-ttl">Texte IMPORTANT (pied de page)</div>
                            </div>
                            <div className="tf-card-body">
                                <textarea className="tf-textarea" rows={3} value={data.footer_text ?? ''}
                                          onChange={e => setData('footer_text', e.target.value)}
                                          placeholder="LE PRESENT ORDRE D'ASSURANCE NE VAUT CERTIFICAT…"/>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8 }}>
                            <Button type="submit" disabled={processing}
                                    className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-10 px-5">
                                {processing ? 'Enregistrement…' : <><Check size={14}/> {submitLabel}</>}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Annuler
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}