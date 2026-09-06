import { Head, Link, router } from '@inertiajs/react';
import { Search, X, Eye, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type RequestStatus = 'PENDING' | 'IN_REVIEW' | 'INFO_REQUESTED' | 'COMPLETED' | 'APPROVED' | 'FULFILLED' | 'CLOSED' | 'REJECTED';

interface CertificateRequestRow {
    id: string;
    reference: string | null;
    insured_name: string | null;
    status: RequestStatus;
    created_at: string;
    broker: { id: string; name: string; code: string } | null;
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
    filters: { status?: string; search?: string };
    counts: Record<RequestStatus, number>;
}

const STATUS_COLORS: Record<RequestStatus, { bg: string; color: string }> = {
    PENDING:        { bg: '#fffbeb', color: '#b45309' },
    IN_REVIEW:      { bg: '#eff6ff', color: '#1d4ed8' },
    INFO_REQUESTED: { bg: '#fff7ed', color: '#c2410c' },
    COMPLETED:      { bg: '#eef2ff', color: '#4338ca' },
    APPROVED:       { bg: '#f0fdf4', color: '#15803d' },
    FULFILLED:      { bg: '#f0fdf4', color: '#15803d' },
    CLOSED:         { bg: '#f1f5f9', color: '#475569' },
    REJECTED:       { bg: '#fef2f2', color: '#b91c1c' },
};

export default function AdminCertificateRequestsIndex({ certificateRequests, filters, counts }: Props) {
    const { t } = useTranslation('certificates');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('requests.index.breadcrumb'), href: '/admin/certificate-requests' },
    ];

    const STATUS_STYLES: Record<RequestStatus, { bg: string; color: string; label: string }> = {
        PENDING:        { ...STATUS_COLORS.PENDING,        label: t('shared.requestStatus.PENDING') },
        IN_REVIEW:      { ...STATUS_COLORS.IN_REVIEW,      label: t('shared.requestStatus.IN_REVIEW') },
        INFO_REQUESTED: { ...STATUS_COLORS.INFO_REQUESTED, label: t('shared.requestStatus.INFO_REQUESTED') },
        COMPLETED:      { ...STATUS_COLORS.COMPLETED,      label: t('shared.requestStatus.COMPLETED') },
        APPROVED:       { ...STATUS_COLORS.APPROVED,       label: t('shared.requestStatus.APPROVED') },
        FULFILLED:      { ...STATUS_COLORS.FULFILLED,      label: t('shared.requestStatus.FULFILLED') },
        CLOSED:         { ...STATUS_COLORS.CLOSED,         label: t('shared.requestStatus.CLOSED') },
        REJECTED:       { ...STATUS_COLORS.REJECTED,       label: t('shared.requestStatus.REJECTED') },
    };

    const STATUS_TABS: { key: string; label: string }[] = [
        { key: '',               label: t('requests.index.tabs.all') },
        { key: 'PENDING',        label: t('requests.index.tabs.pending') },
        { key: 'IN_REVIEW',      label: t('requests.index.tabs.inReview') },
        { key: 'INFO_REQUESTED', label: t('requests.index.tabs.infoRequested') },
        { key: 'COMPLETED',      label: t('requests.index.tabs.completed') },
        { key: 'APPROVED',       label: t('requests.index.tabs.approved') },
        { key: 'FULFILLED',      label: t('requests.index.tabs.fulfilled') },
        { key: 'CLOSED',         label: t('requests.index.tabs.closed') },
        { key: 'REJECTED',       label: t('requests.index.tabs.rejected') },
    ];

    const [search, setSearch] = useState(filters.search ?? '');
    const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const activeStatus = filters.status ?? '';
    const queueCount = counts.PENDING + counts.IN_REVIEW + counts.INFO_REQUESTED + counts.COMPLETED;

    function applyFilters(next: Partial<{ status: string; search: string }>) {
        router.get('/admin/certificate-requests', { ...filters, ...next }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('requests.index.title')} />

            <div style={{ padding: '24px', width: '100%' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{t('requests.index.heading')}</h1>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
                        {t('requests.index.subtitle')}
                        {queueCount > 0 && <> {t('requests.index.queueCount', { count: queueCount })}</>}
                    </p>
                </div>

                {/* Onglets par statut */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {STATUS_TABS.map(tab => {
                        const count = tab.key === '' ? undefined : (counts as any)[tab.key] as number;
                        const isActive = activeStatus === tab.key;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => applyFilters({ status: tab.key })}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 13px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                                    border: '1px solid', cursor: 'pointer',
                                    borderColor: isActive ? '#1e3a8a' : '#e2e8f0',
                                    background: isActive ? '#1e3a8a' : '#fff',
                                    color: isActive ? '#fff' : '#374151',
                                }}>
                                {tab.label}
                                {count !== undefined && (
                                    <span style={{
                                        fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '1px 7px',
                                        background: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                                        color: isActive ? '#fff' : '#64748b',
                                    }}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters({ search })}
                            placeholder={t('requests.index.searchPlaceholder')}
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
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {[
                                    t('requests.index.table.reference'),
                                    t('requests.index.table.date'),
                                    t('requests.index.table.broker'),
                                    t('requests.index.table.insured'),
                                    t('requests.index.table.status'),
                                    '',
                                ].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {certificateRequests.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        <Inbox size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                                        {t('requests.index.empty')}
                                    </td>
                                </tr>
                            ) : certificateRequests.data.map((cr, i) => {
                                const s = STATUS_STYLES[cr.status];

                                return (
                                    <tr key={cr.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '10px 14px', color: '#374151', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{cr.reference ?? '—'}</td>
                                        <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{fmt(cr.created_at)}</td>
                                        <td style={{ padding: '10px 14px', color: '#0f172a' }}>{cr.broker?.name ?? '—'}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f172a' }}>{cr.insured_name ?? '—'}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 11.5, fontWeight: 500 }}>{s.label}</span>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <Link href={route('admin.certificate-requests.show', { certificateRequest: cr.id })}>
                                                <button title={t('requests.index.view')} style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer', color: '#3b82f6' }}>
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
