import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import {
    Search, Plus, Eye, Trash2, X,
    ChevronLeft, ChevronRight, FileText,
    Download, Upload,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Certificats GUCE', href: '/admin/guce-certificates' },
];

interface GuceCertificate {
    id: string;
    guce_reference: string;
    certificate_number: string;
    policy_number: string | null;
    fdi_reference: string | null;
    insured_name: string;
    origin: string | null;
    destination: string | null;
    transit_date: string | null;
    insured_value: string | null;
    currency: string;
    total_premium: string | null;
    file_original_name: string;
    created_at: string;
    imported_by: { id: number; name: string } | null;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    certificates: Paginated<GuceCertificate>;
    filters: { search?: string };
}

export default function GuceCertificatesIndex({ certificates, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applySearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/guce-certificates', { search }, { preserveState: true, replace: true });
    }

    function clearSearch() {
        setSearch('');
        router.get('/admin/guce-certificates', {}, { preserveState: true, replace: true });
    }

    function handleDelete(id: string, ref: string) {
        if (!confirm(`Supprimer le certificat GUCE "${ref}" ? Cette action est irréversible.`)) return;
        router.delete(`/admin/guce-certificates/${id}`);
    }

    function formatCurrency(value: string | null, currency: string) {
        if (!value) return '—';
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(Number(value)) + ' ' + currency;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Certificats GUCE" />

            <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            Certificats GUCE
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
                            Certificats importés depuis le Guichet Unique du Commerce Extérieur
                        </p>
                    </div>
                    <Link href="/admin/guce-certificates/create">
                        <Button style={{ background: '#16a34a', color: '#fff', gap: '6px', display: 'flex', alignItems: 'center' }}>
                            <Upload size={16} /> Importer un certificat
                        </Button>
                    </Link>
                </div>

                {/* Barre de recherche */}
                <form onSubmit={applySearch} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Référence GUCE, N° certificat, police, assuré..."
                            style={{
                                width: '100%', padding: '8px 8px 8px 34px', border: '1px solid #e2e8f0',
                                borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                        {search && (
                            <button type="button" onClick={clearSearch}
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <Button type="submit" variant="outline">Rechercher</Button>
                </form>

                {/* Compteur */}
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>
                    {certificates.total} certificat{certificates.total !== 1 ? 's' : ''} importé{certificates.total !== 1 ? 's' : ''}
                    {certificates.total > 0 && ` — affichage ${certificates.from}–${certificates.to}`}
                </p>

                {/* Tableau */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Référence GUCE', 'N° Certificat', 'Police', 'Assuré', 'Voyage', 'Valeur assurée', 'Fichier', 'Importé par', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {certificates.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        <FileText size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                        Aucun certificat GUCE importé
                                    </td>
                                </tr>
                            ) : certificates.data.map((cert, i) => (
                                <tr key={cert.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#0f172a', fontWeight: 600 }}>
                                            {cert.guce_reference}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>
                                            {cert.certificate_number}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: '#64748b' }}>
                                        {cert.policy_number ?? '—'}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f172a', maxWidth: '160px' }}>
                                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {cert.insured_name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: '#374151', fontSize: '12px' }}>
                                        {cert.origin && cert.destination
                                            ? <>{cert.origin} <span style={{ color: '#94a3b8' }}>→</span> {cert.destination}</>
                                            : '—'}
                                    </td>
                                    <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>
                                        {formatCurrency(cert.insured_value, cert.currency)}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '12px' }}>
                                            <FileText size={13} />
                                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {cert.file_original_name}
                                            </span>
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px' }}>
                                        {cert.imported_by?.name ?? '—'}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <Link href={`/admin/guce-certificates/${cert.id}`}>
                                                <button title="Voir" style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer', color: '#3b82f6' }}>
                                                    <Eye size={14} />
                                                </button>
                                            </Link>
                                            <a href={`/admin/guce-certificates/${cert.id}/download`} title="Télécharger">
                                                <button style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer', color: '#16a34a' }}>
                                                    <Download size={14} />
                                                </button>
                                            </a>
                                            <button
                                                title="Supprimer"
                                                onClick={() => handleDelete(cert.id, cert.guce_reference)}
                                                style={{ border: '1px solid #fee2e2', background: '#fff', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer', color: '#dc2626' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {certificates.last_page > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
                        {certificates.links.map((link, i) => {
                            if (!link.url && !link.active) return null;
                            const isArrow = link.label.includes('Previous') || link.label.includes('Next');
                            return (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    style={{
                                        padding: '6px 10px', border: '1px solid',
                                        borderColor: link.active ? '#16a34a' : '#e2e8f0',
                                        background: link.active ? '#16a34a' : '#fff',
                                        color: link.active ? '#fff' : '#374151',
                                        borderRadius: '4px', cursor: link.url ? 'pointer' : 'default',
                                        opacity: link.url ? 1 : 0.4, fontSize: '13px',
                                    }}>
                                    {isArrow ? (link.label.includes('Previous') ? <ChevronLeft size={14} /> : <ChevronRight size={14} />) : link.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
