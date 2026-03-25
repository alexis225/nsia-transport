import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { TemplateForm } from './create';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { Camera, Trash2, Check } from 'lucide-react';
import { useRef, useState } from 'react';

interface Template {
    id: string; name: string; code: string; type: string;
    tenant_id: string; company_name: string; company_address: string | null;
    company_phone: string | null; company_email: string | null;
    company_website: string | null; company_rccm: string | null;
    company_capital: string | null; legal_framework: string | null;
    logo_path: string | null;
    currency_code: string; city: string | null; is_bilingual: boolean;
    has_container_options: boolean; has_flight_number: boolean;
    has_vessel_name: boolean; has_currency_rate: boolean;
    prime_breakdown_lines: any[]; footer_text: string | null;
    number_prefix: string | null; number_padding: number; is_active: boolean;
    tenant: { name: string; code: string } | null;
}
interface Tenant { id: string; name: string; code: string; }
interface Props   { template: Template; tenants: Tenant[]; }

export default function CertificateTemplateEdit({ template, tenants }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Modèles de certificats', href: '/admin/certificate-templates' },
        { title: template.name },
        { title: 'Modifier' },
    ];

    const fileRef                       = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        template.logo_path ? `/storage/${template.logo_path}` : null
    );
    const [logoFile,    setLogoFile]    = useState<File | null>(null);
    const [uploading,   setUploading]   = useState(false);

    const { data, setData, post, put, processing, errors } = useForm({
        tenant_id:             template.tenant_id,
        name:                  template.name,
        code:                  template.code,
        type:                  template.type,
        company_name:          template.company_name,
        company_address:       template.company_address ?? '',
        company_phone:         template.company_phone ?? '',
        company_email:         template.company_email ?? '',
        company_website:       template.company_website ?? '',
        company_rccm:          template.company_rccm ?? '',
        company_capital:       template.company_capital ?? '',
        legal_framework:       template.legal_framework ?? '',
        currency_code:         template.currency_code,
        city:                  template.city ?? '',
        number_prefix:         template.number_prefix ?? 'N°',
        number_padding:        template.number_padding,
        is_bilingual:          template.is_bilingual,
        has_container_options: template.has_container_options,
        has_flight_number:     template.has_flight_number,
        has_vessel_name:       template.has_vessel_name,
        has_currency_rate:     template.has_currency_rate,
        prime_breakdown_lines: template.prime_breakdown_lines ?? [],
        footer_text:           template.footer_text ?? '',
        is_active:             template.is_active,
        logo:                  null as File | null,
        logo_path:             template.logo_path ?? '',
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleLogoUpload = () => {
        if (!logoFile) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('logo', logoFile);
        router.post(
            route('admin.certificate-templates.logo', { certificateTemplate: template.id }),
            formData,
            {
                forceFormData: true,
                onSuccess: () => { setUploading(false); setLogoFile(null); },
                onError:   () => setUploading(false),
            }
        );
    };

    const handleLogoRemove = () => {
        if (!confirm('Supprimer le logo de ce modèle ?')) return;
        router.delete(
            route('admin.certificate-templates.logo.remove', { certificateTemplate: template.id }),
            { onSuccess: () => { setLogoPreview(null); setLogoFile(null); } }
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.certificate-templates.update', { certificateTemplate: template.id }));
    };

    // Card logo personnalisée pour l'édition (upload séparé)
    const LogoCard = () => (
        <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'15px 22px', borderBottom:'1px solid #f1f5f9' }}>
                <div style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>Logo de la filiale</div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:1 }}>JPG, PNG, WebP ou SVG · Max 2 Mo</div>
            </div>
            <div style={{ padding:22 }}>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    {/* Prévisualisation */}
                    <div onClick={() => fileRef.current?.click()}
                         style={{ width:80, height:80, borderRadius:12, border:'1.5px solid #e2e8f0', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0, cursor:'pointer' }}>
                        {logoPreview
                            ? <img src={logoPreview} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }}/>
                            : <Camera size={24} color="#cbd5e1"/>
                        }
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <input ref={fileRef} type="file"
                               accept="image/jpeg,image/png,image/webp,image/svg+xml"
                               style={{ display:'none' }} onChange={handleLogoChange}/>

                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            <button type="button"
                                    onClick={() => fileRef.current?.click()}
                                    style={{ padding:'8px 14px', background:'#f8fafc', border:'1.5px dashed #cbd5e1', borderRadius:9, fontSize:12, color:'#475569', cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6, transition:'all .15s' }}>
                                <Camera size={13}/> Choisir un logo
                            </button>

                            {logoPreview && (
                                <button type="button" onClick={handleLogoRemove}
                                        style={{ padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, fontSize:12, color:'#dc2626', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                                    <Trash2 size={12}/> Supprimer
                                </button>
                            )}
                        </div>

                        {logoFile ? (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <span style={{ fontSize:11, color:'#16a34a', display:'flex', alignItems:'center', gap:4 }}>
                                    <Check size={11}/>{logoFile.name}
                                </span>
                                <Button onClick={handleLogoUpload} disabled={uploading} size="sm"
                                        className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white h-8 px-3 text-xs">
                                    {uploading ? 'Upload…' : <><Check size={12}/> Enregistrer</>}
                                </Button>
                            </div>
                        ) : (
                            <span style={{ fontSize:11, color:'#94a3b8' }}>Format JPG, PNG, WebP ou SVG · Max 2 Mo</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${template.name} — NSIA Transport`}/>
            <TemplateForm
                data={data} setData={setData} errors={errors}
                processing={processing} onSubmit={submit}
                tenants={tenants}
                heroTitle={`Modifier — ${template.name}`}
                heroSub={`${template.tenant?.name ?? ''} · ${template.currency_code}`}
                submitLabel="Enregistrer les modifications"
                logoCard={<LogoCard/>}
            />
        </AppLayout>
    );
}