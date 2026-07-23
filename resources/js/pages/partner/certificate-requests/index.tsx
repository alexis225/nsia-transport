import { Head, Link, router } from '@inertiajs/react';
import { FilePlus2, Eye, ChevronLeft, ChevronRight, Inbox, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mes demandes', href: '/partner/certificate-requests' },
];

interface CertificateRequestRow {
    id: string;
    insured_name: string | null;
    voyage_from: string | null;
    voyage_to: string | null;
    status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
    created_at: string;
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
    filters: { search?: string; status?: string };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:   { bg: '#fffbeb', color: '#b45309', label: 'En attente' },
    IN_REVIEW: { bg: '#eff6ff', color: '#1d4ed8', label: "En cours d'examen" },
    APPROVED:  { bg: '#f0fdf4', color: '#15803d', label: 'Approuvée' },
    REJECTED:  { bg: '#fef2f2', color: '#b91c1c', label: 'Rejetée' },
};

export default function PartnerCertificateRequestsIndex({ certificateRequests, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    function applyFilters(next: Partial<{ search: string; status: string }>) {
        router.get(route('partner.certificate-requests.index'), { ...filters, ...next }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes demandes de certificat — NSIA Transport" />

            <div style={{ padding: '24px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Mes demandes de certificat</h1>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Suivez l'état de vos demandes soumises à NSIA</p>
                    </div>
                    <Link href={route('partner.certificate-requests.create')}>
                        <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FilePlus2 size={15} /> Nouvelle demande
                        </Button>
                    </Link>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters({ search })}
                            placeholder="Assuré, trajet..."
                            style={{ width: '100%', padding: '8px 8px 8px 34px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                        {search && (
                            <button type="button" onClick={() => {
                                    setSearch('');
                                    applyFilters({ search: '' });
                                }}
                                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <select value={filters.status ?? ''} onChange={e => applyFilters({ status: e.target.value })}
                            style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <option value="">Tous statuts</option>
                        <option value="PENDING">En attente</option>
                        <option value="IN_REVIEW">En cours d'examen</option>
                        <option value="APPROVED">Approuvée</option>
                        <option value="REJECTED">Rejetée</option>
                    </select>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Date', 'Assuré', 'Trajet', 'Statut', ''].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {certificateRequests.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        <Inbox size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                        Aucune demande soumise pour le moment
                                    </td>
                                </tr>
                            ) : certificateRequests.data.map((cr, i) => {
                                const s = STATUS_STYLES[cr.status];

                                return (
                                    <tr key={cr.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{fmt(cr.created_at)}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f172a' }}>{cr.insured_name ?? '—'}</td>
                                        <td style={{ padding: '10px 14px', color: '#374151', fontSize: 12 }}>
                                            {cr.voyage_from && cr.voyage_to ? <>{cr.voyage_from} <span style={{ color: '#94a3b8' }}>→</span> {cr.voyage_to}</> : '—'}
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 11.5, fontWeight: 500 }}>
                                                {s.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <Link href={route('partner.certificate-requests.show', { certificateRequest: cr.id })}>
                                                <button title="Voir" style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer', color: '#3b82f6' }}>
                                                    <Eye size={14} />
                                                </button>
                                            </Link>
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
