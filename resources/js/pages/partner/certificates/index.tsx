import { Head, Link, router } from '@inertiajs/react';
import { Award, ChevronLeft, ChevronRight, Download, Eye, Search, X } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mes certificats', href: '/partner/certificates' },
];

interface CertificateRequestRow {
    id: string;
    insured_name: string | null;
    created_at: string;
    certificate: { id: string; certificate_number: string; status: string; issued_at: string | null } | null;
    guce_certificate: { id: string; certificate_number: string; insured_name: string; created_at: string } | null;
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
    certificateRequests: Paginated<CertificateRequestRow>;
    filters: { search?: string };
}

export default function PartnerCertificatesIndex({ certificateRequests, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    function applySearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(route('partner.certificates.index'), { search }, { preserveState: true, replace: true });
    }

    function clearSearch() {
        setSearch('');
        router.get(route('partner.certificates.index'), {}, { preserveState: true, replace: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes certificats — NSIA Transport" />

            <div style={{ padding: '24px', width: '100%' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Mes certificats</h1>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Certificats rattachés à vos demandes approuvées</p>
                </div>

                <form onSubmit={applySearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Assuré, N° certificat..."
                            style={{ width: '100%', padding: '8px 8px 8px 34px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                        {search && (
                            <button type="button" onClick={clearSearch}
                                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </form>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Date de demande', 'Assuré', 'N° certificat', 'Origine', ''].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {certificateRequests.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        <Award size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                        Aucun certificat disponible pour le moment
                                    </td>
                                </tr>
                            ) : certificateRequests.data.map((cr, i) => {
                                const certNumber = cr.certificate?.certificate_number ?? cr.guce_certificate?.certificate_number ?? '—';
                                const isGuce = !cr.certificate && !!cr.guce_certificate;
                                const downloadRoute = cr.certificate
                                    ? route('partner.certificate-requests.certificate.download', { certificateRequest: cr.id })
                                    : route('partner.certificate-requests.guce-certificate.download', { certificateRequest: cr.id });

                                return (
                                    <tr key={cr.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{fmt(cr.created_at)}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f172a' }}>{cr.insured_name ?? '—'}</td>
                                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#0f172a' }}>{certNumber}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{
                                                background: isGuce ? '#fdf4ff' : '#f0fdf4',
                                                color: isGuce ? '#a21caf' : '#15803d',
                                                borderRadius: 20, padding: '3px 10px', fontSize: 11.5, fontWeight: 500,
                                            }}>
                                                {isGuce ? 'Importé (GUCE)' : 'Émis'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <Link href={route('partner.certificate-requests.show', { certificateRequest: cr.id })}>
                                                    <button title="Voir la demande" style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer', color: '#3b82f6' }}>
                                                        <Eye size={14} />
                                                    </button>
                                                </Link>
                                                <a href={downloadRoute}>
                                                    <button title="Télécharger" style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer', color: '#16a34a' }}>
                                                        <Download size={14} />
                                                    </button>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {certificateRequests.last_page > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
                        {certificateRequests.links.map((link, i) => {
                            if (!link.url && !link.active) {
                                return null;
                            }

                            const isArrow = link.label.includes('Previous') || link.label.includes('Next');

                            return (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    style={{
                                        padding: '6px 10px', border: '1px solid',
                                        borderColor: link.active ? '#1e3a8a' : '#e2e8f0',
                                        background: link.active ? '#1e3a8a' : '#fff',
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
