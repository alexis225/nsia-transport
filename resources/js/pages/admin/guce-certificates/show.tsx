import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { ChevronLeft, Download, Trash2, FileText, Calendar, Ship, MapPin, Package, DollarSign, User, Hash } from 'lucide-react';

interface GuceCertificate {
    id: string;
    guce_reference: string;
    certificate_number: string;
    policy_number: string | null;
    fdi_reference: string | null;
    insured_name: string;
    insured_address: string | null;
    cargo_description: string | null;
    weight: string | null;
    marks: string | null;
    vessel: string | null;
    origin: string | null;
    destination: string | null;
    transit_date: string | null;
    insured_value: string | null;
    currency: string;
    net_premium: string | null;
    total_premium: string | null;
    file_original_name: string;
    file_mime_type: string | null;
    notes: string | null;
    created_at: string;
    imported_by: { id: number; name: string } | null;
}

interface Props {
    certificate: GuceCertificate;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Certificats GUCE', href: '/admin/guce-certificates' },
    { title: 'Détail', href: '#' },
];

export default function GuceCertificatesShow({ certificate: cert }: Props) {

    function handleDelete() {
        if (!confirm(`Supprimer ce certificat GUCE (${cert.guce_reference}) ? Cette action est irréversible.`)) return;
        router.delete(`/admin/guce-certificates/${cert.id}`, {
            onSuccess: () => router.visit('/admin/guce-certificates'),
        });
    }

    function formatCurrency(value: string | null) {
        if (!value) return '—';
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(Number(value)) + ' ' + cert.currency;
    }

    function formatDate(value: string | null) {
        if (!value) return '—';
        return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    const sectionStyle: React.CSSProperties = {
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '16px',
    };
    const titleStyle: React.CSSProperties = {
        fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px',
        paddingBottom: '10px', borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: '7px',
    };
    const gridStyle: React.CSSProperties = {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
    };
    const fieldLabel: React.CSSProperties = { fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' };
    const fieldValue: React.CSSProperties = { fontSize: '14px', color: '#0f172a', fontWeight: 500 };

    function Field({ label, value }: { label: string; value: string | null | undefined }) {
        return (
            <div>
                <p style={fieldLabel}>{label}</p>
                <p style={fieldValue}>{value || '—'}</p>
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Certificat GUCE — ${cert.guce_reference}`} />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Link href="/admin/guce-certificates">
                            <button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                <ChevronLeft size={16} />
                            </button>
                        </Link>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                Certificat GUCE
                            </h1>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0' }}>
                                Importé le {formatDate(cert.created_at)}{cert.imported_by ? ` par ${cert.imported_by.name}` : ''}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={`/admin/guce-certificates/${cert.id}/download`}>
                            <Button variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                                <Download size={14} /> Télécharger
                            </Button>
                        </a>
                        <Button
                            onClick={handleDelete}
                            style={{ background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                            <Trash2 size={14} /> Supprimer
                        </Button>
                    </div>
                </div>

                {/* Fichier joint */}
                <div style={{ ...sectionStyle, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={20} color="#16a34a" />
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#15803d' }}>
                                {cert.file_original_name}
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                {cert.file_mime_type}
                            </p>
                        </div>
                        <a href={`/admin/guce-certificates/${cert.id}/download`}>
                            <Button variant="outline" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Download size={13} /> Télécharger
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Références GUCE */}
                <div style={sectionStyle}>
                    <h2 style={titleStyle}><Hash size={15} />Références GUCE</h2>
                    <div style={gridStyle}>
                        <Field label="Référence requête GUCE" value={cert.guce_reference} />
                        <Field label="N° Certificat" value={cert.certificate_number} />
                        <Field label="Police N°" value={cert.policy_number} />
                        <Field label="Référence FDI" value={cert.fdi_reference} />
                    </div>
                </div>

                {/* Assuré */}
                <div style={sectionStyle}>
                    <h2 style={titleStyle}><User size={15} />Assuré</h2>
                    <div style={gridStyle}>
                        <Field label="Nom" value={cert.insured_name} />
                        <Field label="Adresse" value={cert.insured_address} />
                    </div>
                </div>

                {/* Transport */}
                <div style={sectionStyle}>
                    <h2 style={titleStyle}><Ship size={15} />Transport & Marchandises</h2>
                    <div style={gridStyle}>
                        <Field label="Navire / Moyen de transport" value={cert.vessel} />
                        <Field label="Date du voyage" value={cert.transit_date ? formatDate(cert.transit_date) : null} />
                        <Field label="Origine" value={cert.origin} />
                        <Field label="Destination" value={cert.destination} />
                        <Field label="Description marchandises" value={cert.cargo_description} />
                        <div style={gridStyle}>
                            <Field label="Poids" value={cert.weight} />
                            <Field label="Marques" value={cert.marks} />
                        </div>
                    </div>
                </div>

                {/* Valeurs financières */}
                <div style={sectionStyle}>
                    <h2 style={titleStyle}><DollarSign size={15} />Valeurs financières</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <p style={{ ...fieldLabel, textAlign: 'center' }}>Valeur assurée</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                {formatCurrency(cert.insured_value)}
                            </p>
                        </div>
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <p style={{ ...fieldLabel, textAlign: 'center' }}>Prime nette</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#374151', margin: 0 }}>
                                {formatCurrency(cert.net_premium)}
                            </p>
                        </div>
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <p style={{ ...fieldLabel, textAlign: 'center' }}>Prime totale</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a', margin: 0 }}>
                                {formatCurrency(cert.total_premium)}
                            </p>
                        </div>
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <p style={{ ...fieldLabel, textAlign: 'center' }}>Devise</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#374151', margin: 0 }}>
                                {cert.currency}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {cert.notes && (
                    <div style={sectionStyle}>
                        <h2 style={titleStyle}>Notes</h2>
                        <p style={{ margin: 0, color: '#374151', fontSize: '14px', lineHeight: 1.6 }}>{cert.notes}</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
