import { Head, Link, router } from '@inertiajs/react';
import {
    Search,
    Plus,
    Eye,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Tenant {
    id: string;
    name: string;
    code: string;
}
interface Coinsurer {
    id: string;
    name: string;
    country_code: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    tenant: Tenant | null;
}
interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Props {
    coinsurers: Paginated<Coinsurer>;
    filters: { search?: string; status?: string };
    isSA: boolean;
    can: { create: boolean; edit: boolean; delete: boolean };
}

const COLORS = [
    { bg: '#EEF2FF', color: '#4338CA' },
    { bg: '#FFF7ED', color: '#C2410C' },
    { bg: '#FDF4FF', color: '#7E22CE' },
    { bg: '#F0FDF4', color: '#15803D' },
    { bg: '#ECFDF5', color: '#065F46' },
    { bg: '#EFF6FF', color: '#1D4ED8' },
];

export default function CoinsurerIndex({
    coinsurers,
    filters,
    isSA,
    can,
}: Props) {
    const { t } = useTranslation('coinsurers');
    const { t: tc } = useTranslation('common');
    const [search, setSearch] = useState(filters?.search ?? '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('index.breadcrumb'), href: '/admin/coinsurers' },
    ];

    const applyFilter = (params: Record<string, string>) =>
        router.get(
            '/admin/coinsurers',
            { ...filters, ...params },
            { preserveState: true, replace: true },
        );

    const handleDelete = (c: Coinsurer) => {
        if (confirm(t('index.confirmDelete', { name: c.name }))) {
            router.delete(
                route('admin.coinsurers.destroy', { coinsurer: c.id }),
            );
        }
    };

    const handleToggle = (c: Coinsurer) => {
        const msg = c.is_active
            ? t('index.confirmDeactivate', { name: c.name })
            : t('index.confirmActivate', { name: c.name });

        if (confirm(msg)) {
            router.patch(route('admin.coinsurers.toggle', { coinsurer: c.id }));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('index.title')} />
            <style>{`
                .ci-page{padding:4px;display:flex;flex-direction:column;gap:16px;}
                .ci-hdr{display:flex;align-items:center;justify-content:space-between;}
                .ci-title{font-size:18px;font-weight:600;color:#1e293b;}
                .ci-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
                .ci-toolbar{display:flex;gap:8px;flex-wrap:wrap;}
                .ci-search{display:flex;gap:0;flex:1;min-width:220px;}
                .ci-search input{flex:1;padding:9px 14px;font-size:13px;font-family:inherit;color:#1e293b;background:#fff;border:1.5px solid #e2e8f0;border-right:none;border-radius:8px 0 0 8px;outline:none;}
                .ci-search input:focus{border-color:#1e3a8a;}
                .ci-search button{padding:9px 13px;background:#1e3a8a;border:none;border-radius:0 8px 8px 0;cursor:pointer;color:#fff;display:flex;align-items:center;}
                .ci-select{padding:9px 12px;font-size:13px;font-family:inherit;color:#475569;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;outline:none;cursor:pointer;}
                .ci-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                thead{background:#f8fafc;}
                th{padding:10px 16px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;text-align:left;border-bottom:1px solid #f1f5f9;}
                td{padding:12px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc;vertical-align:middle;}
                tr:last-child td{border-bottom:none;}
                tr:hover td{background:#fafafa;}
                .ci-avatar{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
                .ci-name{font-weight:500;color:#1e293b;font-size:13px;}
                .s-active{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:500;}
                .s-inactive{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:500;}
                .s-dot{width:5px;height:5px;border-radius:50%;}
                .actions{display:flex;gap:5px;flex-wrap:wrap;}
                .btn-act{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid;display:inline-flex;align-items:center;gap:4px;font-family:inherit;background:none;transition:all .13s;white-space:nowrap;text-decoration:none;}
                .btn-view{color:#1d4ed8;border-color:#bfdbfe;} .btn-view:hover{background:#eff6ff;}
                .btn-edit{color:#0f766e;border-color:#99f6e4;} .btn-edit:hover{background:#f0fdfa;}
                .btn-del{color:#dc2626;border-color:#fecaca;} .btn-del:hover{background:#fef2f2;}
                .btn-on{color:#dc2626;border-color:#fecaca;} .btn-on:hover{background:#fef2f2;}
                .btn-off{color:#059669;border-color:#a7f3d0;} .btn-off:hover{background:#ecfdf5;}
                .ci-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f8fafc;}
                .ci-pg-info{font-size:12px;color:#94a3b8;}
                .ci-pg-links{display:flex;gap:4px;}
                .pg-btn{width:30px;height:30px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .13s;}
                .pg-btn:hover:not(:disabled){border-color:#1e3a8a;color:#1e3a8a;}
                .pg-btn.act{background:#1e3a8a;border-color:#1e3a8a;color:#fff;}
                .pg-btn:disabled{opacity:.4;cursor:not-allowed;}
                .ci-empty{padding:48px;text-align:center;color:#94a3b8;font-size:13px;}
            `}</style>

            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="ci-page">
                    {/* Header */}
                    <div className="ci-hdr">
                        <div>
                            <h1 className="ci-title">{t('index.heading')}</h1>
                            <p className="ci-sub">
                                {t('index.count', { count: coinsurers.total })}
                            </p>
                        </div>
                        {can.create && (
                            <Link href={route('admin.coinsurers.create')}>
                                <Button className="h-10 bg-[#1e3a8a] px-4 text-white hover:bg-[#1e40af]">
                                    <Plus size={15} /> {t('index.newCoinsurer')}
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div className="ci-toolbar">
                        <form
                            className="ci-search"
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilter({ search, page: '1' });
                            }}
                        >
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('index.searchPlaceholder')}
                            />
                            <button type="submit">
                                <Search size={14} />
                            </button>
                        </form>
                        <select
                            className="ci-select"
                            value={filters?.status ?? ''}
                            onChange={(e) =>
                                applyFilter({
                                    status: e.target.value,
                                    page: '1',
                                })
                            }
                        >
                            <option value="">{t('index.statusAll')}</option>
                            <option value="active">
                                {t('index.statusActive')}
                            </option>
                            <option value="inactive">
                                {t('index.statusInactive')}
                            </option>
                        </select>
                        {(filters?.search || filters?.status) && (
                            <button
                                onClick={() => router.get('/admin/coinsurers')}
                                style={{
                                    padding: '9px 12px',
                                    background: 'none',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: 12,
                                }}
                            >
                                <X size={12} /> {t('index.clear')}
                            </button>
                        )}
                    </div>

                    {/* Tableau */}
                    <div className="ci-card">
                        {coinsurers.data.length === 0 ? (
                            <div className="ci-empty">{t('index.empty')}</div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>
                                                {t('index.table.coinsurer')}
                                            </th>
                                            <th>{t('index.table.country')}</th>
                                            <th>{t('index.table.contact')}</th>
                                            {isSA && (
                                                <th>
                                                    {t('index.table.tenant')}
                                                </th>
                                            )}
                                            <th>{t('index.table.status')}</th>
                                            <th>{t('index.table.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coinsurers.data.map((ci, i) => {
                                            const c = COLORS[i % COLORS.length];
                                            const initials = ci.name
                                                .slice(0, 2)
                                                .toUpperCase();

                                            return (
                                                <tr key={ci.id}>
                                                    <td>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 10,
                                                            }}
                                                        >
                                                            <div
                                                                className="ci-avatar"
                                                                style={{
                                                                    background:
                                                                        c.bg,
                                                                    color: c.color,
                                                                }}
                                                            >
                                                                {initials}
                                                            </div>
                                                            <div className="ci-name">
                                                                {ci.name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#64748b',
                                                        }}
                                                    >
                                                        {ci.country_code ?? (
                                                            <span
                                                                style={{
                                                                    color: '#cbd5e1',
                                                                }}
                                                            >
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#64748b',
                                                        }}
                                                    >
                                                        {ci.email ||
                                                        ci.phone ? (
                                                            <>
                                                                {ci.email && (
                                                                    <div>
                                                                        {
                                                                            ci.email
                                                                        }
                                                                    </div>
                                                                )}
                                                                {ci.phone && (
                                                                    <div>
                                                                        {
                                                                            ci.phone
                                                                        }
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    color: '#cbd5e1',
                                                                }}
                                                            >
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    {isSA && (
                                                        <td
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#64748b',
                                                            }}
                                                        >
                                                            {ci.tenant?.name ??
                                                                '—'}
                                                        </td>
                                                    )}
                                                    <td>
                                                        {ci.is_active ? (
                                                            <span className="s-active">
                                                                <span
                                                                    className="s-dot"
                                                                    style={{
                                                                        background:
                                                                            '#22c55e',
                                                                    }}
                                                                />
                                                                {tc(
                                                                    'states.active',
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="s-inactive">
                                                                <span
                                                                    className="s-dot"
                                                                    style={{
                                                                        background:
                                                                            '#94a3b8',
                                                                    }}
                                                                />
                                                                {tc(
                                                                    'states.inactive',
                                                                )}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="actions">
                                                            <Link
                                                                href={route(
                                                                    'admin.coinsurers.show',
                                                                    {
                                                                        coinsurer:
                                                                            ci.id,
                                                                    },
                                                                )}
                                                                className="btn-act btn-view"
                                                            >
                                                                <Eye
                                                                    size={12}
                                                                />{' '}
                                                                {t(
                                                                    'index.view',
                                                                )}
                                                            </Link>
                                                            {can.edit && (
                                                                <Link
                                                                    href={route(
                                                                        'admin.coinsurers.edit',
                                                                        {
                                                                            coinsurer:
                                                                                ci.id,
                                                                        },
                                                                    )}
                                                                    className="btn-act btn-edit"
                                                                >
                                                                    <Edit2
                                                                        size={
                                                                            12
                                                                        }
                                                                    />{' '}
                                                                    {t(
                                                                        'index.edit',
                                                                    )}
                                                                </Link>
                                                            )}
                                                            {can.edit && (
                                                                <button
                                                                    className={`btn-act ${ci.is_active ? 'btn-on' : 'btn-off'}`}
                                                                    onClick={() =>
                                                                        handleToggle(
                                                                            ci,
                                                                        )
                                                                    }
                                                                >
                                                                    {ci.is_active ? (
                                                                        <>
                                                                            <ToggleLeft
                                                                                size={
                                                                                    12
                                                                                }
                                                                            />{' '}
                                                                            {t(
                                                                                'index.deactivate',
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ToggleRight
                                                                                size={
                                                                                    12
                                                                                }
                                                                            />{' '}
                                                                            {t(
                                                                                'index.activate',
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                            {can.delete && (
                                                                <button
                                                                    className="btn-act btn-del"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            ci,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            12
                                                                        }
                                                                    />{' '}
                                                                    {t(
                                                                        'index.delete',
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {coinsurers.last_page > 1 && (
                                    <div className="ci-pagination">
                                        <span className="ci-pg-info">
                                            {t('index.pageInfo', {
                                                current:
                                                    coinsurers.current_page,
                                                last: coinsurers.last_page,
                                                total: coinsurers.total,
                                            })}
                                        </span>
                                        <div className="ci-pg-links">
                                            <button
                                                className="pg-btn"
                                                disabled={
                                                    coinsurers.current_page ===
                                                    1
                                                }
                                                onClick={() =>
                                                    applyFilter({
                                                        page: String(
                                                            coinsurers.current_page -
                                                                1,
                                                        ),
                                                    })
                                                }
                                            >
                                                <ChevronLeft size={13} />
                                            </button>
                                            {coinsurers.links.map((link, i) => {
                                                if (
                                                    i === 0 ||
                                                    i ===
                                                        coinsurers.links
                                                            .length -
                                                            1
                                                ) {
                                                    return null;
                                                }

                                                return (
                                                    <button
                                                        key={`p-${i}`}
                                                        className={`pg-btn ${link.active ? 'act' : ''}`}
                                                        onClick={() =>
                                                            link.url &&
                                                            applyFilter({
                                                                page: link.label,
                                                            })
                                                        }
                                                        disabled={!link.url}
                                                        dangerouslySetInnerHTML={{
                                                            __html: link.label,
                                                        }}
                                                    />
                                                );
                                            })}
                                            <button
                                                className="pg-btn"
                                                disabled={
                                                    coinsurers.current_page ===
                                                    coinsurers.last_page
                                                }
                                                onClick={() =>
                                                    applyFilter({
                                                        page: String(
                                                            coinsurers.current_page +
                                                                1,
                                                        ),
                                                    })
                                                }
                                            >
                                                <ChevronRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
