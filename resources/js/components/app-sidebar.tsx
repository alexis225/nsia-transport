import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BarChart2,
    Briefcase,
    Building2,
    ClipboardList,
    Database,
    Download,
    FileBadge,
    FileText,
    LayoutDashboard,
    Search,
    Settings,
    Shield,
    Users,
    TrendingUp,
    UserCheck,
    Bell,
    Percent,
    Users2,
    FilePlus2,
    Inbox,
    Receipt,
    ShieldAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';

export function AppSidebar() {
    // Les libelles du menu vivent dans le namespace `navigation` : la
    // structure (permissions, modules actifs) reste pilotee cote code.
    const { t } = useTranslation('navigation');
    const { auth } = usePage<{
        auth: {
            user: {
                permissions: any[];
                roles: any[];
                tenant?: { modules?: Record<string, boolean> };
            };
        };
    }>().props;

    const can = (p: string) =>
        (auth?.user?.permissions ?? []).some(
            (perm: any) => (typeof perm === 'string' ? perm : perm.name) === p,
        );

    // Modules métier activables/désactivables par filiale (super_admin
    // n'a pas de tenant : aucune restriction ne s'applique à lui).
    const moduleEnabled = (key: string) => {
        const modules = auth?.user?.tenant?.modules;

        return !modules || modules[key] !== false;
    };

    const isSA = () =>
        (auth?.user?.roles ?? []).some(
            (r: any) => (typeof r === 'string' ? r : r.name) === 'super_admin',
        );

    const isAdminFiliale = () =>
        (auth?.user?.roles ?? []).some(
            (r: any) =>
                (typeof r === 'string' ? r : r.name) === 'admin_filiale',
        );

    const isPartner = () =>
        (auth?.user?.roles ?? []).some((r: any) =>
            ['courtier_local', 'partenaire_etranger'].includes(
                typeof r === 'string' ? r : r.name,
            ),
        );

    const partnerNavItems = [
        {
            title: t('partner.dashboard'),
            href: route('partner.dashboard'),
            icon: LayoutDashboard,
        },
        {
            title: t('partner.requests'),
            href: route('partner.certificate-requests.index'),
            icon: Inbox,
        },
        {
            title: t('partner.newRequest'),
            href: route('partner.certificate-requests.create'),
            icon: FilePlus2,
        },
        {
            title: t('partner.certificates'),
            href: route('partner.certificates.index'),
            icon: Award,
        },
        {
            title: t('sections.settings'),
            href: route('profile.edit'),
            icon: Settings,
            children: [
                { title: t('items.profile'), href: route('profile.edit') },
                {
                    title: t('items.accountSecurity'),
                    href: route('user-password.edit'),
                },
                { title: t('items.mfa'), href: route('user.mfa-setup') },
            ],
        },
    ];

    const mainNavItems = isPartner()
        ? partnerNavItems
        : [
              // ── Dashboard ──────────────────────────────────────────
              {
                  title: t('sections.dashboard'),
                  href: route('admin.dashboard'),
                  icon: LayoutDashboard,
              },

              // ── KPIs Filiale — US-043 ─────────────────────────────
              ...(can('certificates.view') && moduleEnabled('kpi')
                  ? [
                        {
                            title: t('sections.kpi'),
                            href: route('admin.dashboard.kpi'),
                            icon: BarChart2,
                        },
                    ]
                  : []),

              // ── Dashboard DTAG — US-048 (super_admin uniquement) ──
              ...(isSA()
                  ? [
                        {
                            title: t('sections.dtag'),
                            href: route('admin.dashboard.dtag'),
                            icon: Building2,
                        },
                    ]
                  : []),

              // ── Utilisateurs — US-007/008 ──────────────────────────
              // Regroupe aussi Rôles & Permissions (US-003) et Filiales
              // (US-011), réservés au super_admin.
              ...(can('users.view')
                  ? [
                        {
                            title: t('sections.users'),
                            href: route('admin.users.index'),
                            icon: Users,
                            children: [
                                {
                                    title: t('items.list'),
                                    href: route('admin.users.index'),
                                },
                                ...(can('users.block')
                                    ? [
                                          {
                                              title: t('items.blockedUsers'),
                                              href:
                                                  route('admin.users.index') +
                                                  '?status=blocked',
                                          },
                                      ]
                                    : []),
                                ...(can('users.create')
                                    ? [
                                          {
                                              title: t('items.newUser'),
                                              href: route('admin.users.create'),
                                          },
                                      ]
                                    : []),
                                ...(isSA()
                                    ? [
                                          {
                                              title: t('items.roles'),
                                              href: route('admin.roles.index'),
                                          },
                                          {
                                              title: t('items.newRole'),
                                              href:
                                                  route('admin.roles.index') +
                                                  '?action=create',
                                          },
                                          {
                                              title: t('items.tenants'),
                                              href: route(
                                                  'admin.tenants.index',
                                              ),
                                          },
                                          {
                                              title: t('items.newTenant'),
                                              href: route(
                                                  'admin.tenants.create',
                                              ),
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),

              // ── Courtiers ───────────────────────────────────────────
              ...(can('brokers.view') && moduleEnabled('brokers')
                  ? [
                        {
                            title: t('sections.brokers'),
                            href: route('admin.brokers.index'),
                            icon: Briefcase,
                            children: [
                                {
                                    title: t('items.list'),
                                    href: route('admin.brokers.index'),
                                },
                                ...(can('brokers.create')
                                    ? [
                                          {
                                              title: t('items.newBroker'),
                                              href: route(
                                                  'admin.brokers.create',
                                              ),
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),

              // ── Demandes de certificats d'assurance (Module 1 — espace
              // partenaire ↔ souscripteur, rapport DTAG 14/08/2026) ─────
              ...(can('certificates.view') && moduleEnabled('brokers')
                  ? [
                        {
                            title: t('sections.certificateRequests'),
                            href: route('admin.certificate-requests.index'),
                            icon: Inbox,
                        },
                    ]
                  : []),

              // ── Coassureurs — US-041 ─────────────────────────────
              ...(can('coinsurers.view') && moduleEnabled('coinsurers')
                  ? [
                        {
                            title: t('sections.coinsurers'),
                            href: route('admin.coinsurers.index'),
                            icon: Users2,
                            children: [
                                {
                                    title: t('items.list'),
                                    href: route('admin.coinsurers.index'),
                                },
                                ...(can('coinsurers.create')
                                    ? [
                                          {
                                              title: t('items.new'),
                                              href: route(
                                                  'admin.coinsurers.create',
                                              ),
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),

              // ── Experts — US-042 ─────────────────────────────────
              ...(can('experts.view') && moduleEnabled('experts')
                  ? [
                        {
                            title: t('sections.experts'),
                            href: route('admin.experts.index'),
                            icon: UserCheck,
                            children: [
                                {
                                    title: t('items.list'),
                                    href: route('admin.experts.index'),
                                },
                                ...(can('experts.create')
                                    ? [
                                          {
                                              title: t('items.new'),
                                              href: route(
                                                  'admin.experts.create',
                                              ),
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),

              // ── Références ─────────────────────────────────────────
              ...(isSA()
                  ? [
                        {
                            title: t('sections.reference'),
                            href: '/admin/reference',
                            icon: Database,
                            children: [
                                {
                                    title: t('items.countries'),
                                    href: '/admin/reference?tab=countries',
                                },
                                {
                                    title: t('items.currencies'),
                                    href: '/admin/reference?tab=currencies',
                                },
                                {
                                    title: t('items.incoterms'),
                                    href: '/admin/reference?tab=incoterms',
                                },
                                {
                                    title: t('items.transportModes'),
                                    href: '/admin/reference?tab=transport_modes',
                                },
                                {
                                    title: t('items.merchandiseCategories'),
                                    href: '/admin/reference?tab=merchandise_categories',
                                },
                            ],
                        },
                    ]
                  : []),

              // ── Modèles de certificats — US-013 ────────────────────
              ...(isSA() && moduleEnabled('certificate_templates')
                  ? [
                        {
                            title: t('sections.certificateTemplates'),
                            href: route('admin.certificate-templates.index'),
                            icon: FileBadge,
                            children: [
                                {
                                    title: t('items.list'),
                                    href: route(
                                        'admin.certificate-templates.index',
                                    ),
                                },
                                {
                                    title: t('items.new'),
                                    href: route(
                                        'admin.certificate-templates.create',
                                    ),
                                },
                                {
                                    title: t('items.fieldPositions'),
                                    href: route(
                                        'admin.certificate-print-templates.index',
                                    ),
                                },
                                {
                                    title: t('items.visualCalibrator'),
                                    href: '/tools/calibreur_nsia_togo.html',
                                    external: true,
                                },
                            ],
                        },
                    ]
                  : []),

              // ── Contrats — US-014 ──────────────────────────────────
              ...(can('contracts.view') && moduleEnabled('contracts')
                  ? [
                        {
                            title: t('sections.contracts'),
                            href: route('admin.contracts.index'),
                            icon: FileText,
                            children: [
                                {
                                    title: t('items.list'),
                                    href: route('admin.contracts.index'),
                                },
                                {
                                    title: t('items.limits'),
                                    href: route('admin.contracts.limits'),
                                },
                                ...(can('contracts.create')
                                    ? [
                                          {
                                              title: t('items.new'),
                                              href: route(
                                                  'admin.contracts.create',
                                              ),
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),

              // ── Certificats — US-017/055 ──────────────────────────
              // Regroupe aussi les Certificats GUCE (import), sous réserve
              // du module 'guce_certificates'.
              ...(can('certificates.view') && moduleEnabled('certificates')
                  ? [
                        {
                            title: t('sections.certificates'),
                            href: route('admin.certificates.index'),
                            icon: Award,
                            children: [
                                {
                                    title: t('items.list'),
                                    href: route('admin.certificates.index'),
                                },
                                {
                                    title: t('items.advancedSearch'),
                                    href: route('admin.certificates.search'),
                                    icon: Search,
                                },
                                {
                                    title: t('items.printModels'),
                                    href: route(
                                        'admin.certificates.print-models',
                                    ),
                                },
                                ...(can('certificates.create')
                                    ? [
                                          {
                                              title: t('items.new'),
                                              href: route(
                                                  'admin.certificates.create',
                                              ),
                                          },
                                      ]
                                    : []),
                                ...(can('certificates.validate')
                                    ? [
                                          {
                                              title: t('items.pending'),
                                              href: route(
                                                  'admin.dashboard.pending',
                                              ),
                                          },
                                      ]
                                    : []),
                                ...(moduleEnabled('guce_certificates')
                                    ? [
                                          {
                                              title: t(
                                                  'items.guceCertificates',
                                              ),
                                              href: route(
                                                  'admin.guce-certificates.index',
                                              ),
                                          },
                                          {
                                              title: t('items.guceImport'),
                                              href: route(
                                                  'admin.guce-certificates.create',
                                              ),
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),

              ...(moduleEnabled('commissions')
                  ? [
                        {
                            title: t('sections.commissions'),
                            href: route('admin.commissions.rules'),
                            icon: Percent,
                            children: [
                                {
                                    title: t('items.commissionRules'),
                                    href: route('admin.commissions.rules'),
                                },
                                {
                                    title: t('items.commissionBordereau'),
                                    href: route('admin.commissions.bordereau'),
                                },
                            ],
                        },
                    ]
                  : []),

              ...(moduleEnabled('taxes')
                  ? [
                        {
                            title: t('sections.taxes'),
                            href: route('admin.taxes.rules'),
                            icon: Receipt,
                        },
                    ]
                  : []),
              // ── Rapports — US-044/045/046 ─────────────────────────
              ...((can('certificates.view') ||
                  can('contracts.view') ||
                  can('brokers.view')) &&
              moduleEnabled('reports')
                  ? [
                        {
                            title: t('sections.reports'),
                            href: route('admin.reports.certificates'),
                            icon: BarChart2,
                            children: [
                                ...(can('certificates.view')
                                    ? [
                                          {
                                              title: t(
                                                  'items.reportCertificates',
                                              ),
                                              href: route(
                                                  'admin.reports.certificates',
                                              ),
                                          },
                                      ]
                                    : []),
                                ...(can('contracts.view')
                                    ? [
                                          {
                                              title: t('items.reportContracts'),
                                              href: route(
                                                  'admin.reports.contracts',
                                              ),
                                          },
                                      ]
                                    : []),
                                ...(can('brokers.view')
                                    ? [
                                          {
                                              title: t(
                                                  'items.reportIntermediaries',
                                              ),
                                              href: route(
                                                  'admin.reports.intermediaries',
                                              ),
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),
              // ── Sécurité — US-050 (super_admin uniquement) ────────
              ...(isSA()
                  ? [
                        {
                            title: t('sections.security'),
                            href: route('admin.security.ip-blacklist.index'),
                            icon: Shield,
                            children: [
                                {
                                    title: t('items.ipBlacklist'),
                                    href: route(
                                        'admin.security.ip-blacklist.index',
                                    ),
                                },
                            ],
                        },
                    ]
                  : []),

              // ── Paramètres ─────────────────────────────────────────
              {
                  title: t('sections.settings'),
                  href: route('profile.edit'),
                  icon: Settings,
                  children: [
                      {
                          title: t('items.profile'),
                          href: route('profile.edit'),
                      },
                      {
                          title: t('items.accountSecurity'),
                          href: route('user-password.edit'),
                      },
                      { title: t('items.mfa'), href: route('user.mfa-setup') },
                      {
                          title: t('items.appearance'),
                          href: route('appearance.edit'),
                      },
                      ...((isSA() || isAdminFiliale()) &&
                      moduleEnabled('approvals')
                          ? [
                                {
                                    title: t('items.escalations'),
                                    href: route('admin.approvals.index'),
                                    icon: TrendingUp,
                                },
                            ]
                          : []),
                      ...((isSA() || isAdminFiliale()) &&
                      moduleEnabled('approvals')
                          ? [
                                {
                                    title: t('items.thresholds'),
                                    href: route('admin.approvals.configs'),
                                    icon: ShieldAlert,
                                },
                            ]
                          : []),
                      ...((isSA() || isAdminFiliale()) &&
                      moduleEnabled('delegations')
                          ? [
                                {
                                    title: t('items.delegations'),
                                    href: route('admin.delegations.index'),
                                    icon: UserCheck,
                                },
                            ]
                          : []),
                      ...(can('audit_logs.view') && moduleEnabled('audit_logs')
                          ? [
                                {
                                    title: t('items.auditLogs'),
                                    href: route('admin.audit-logs.index'),
                                    icon: ClipboardList,
                                },
                            ]
                          : []),
                      ...(moduleEnabled('notifications')
                          ? [
                                {
                                    title: t('items.notifications'),
                                    href: route('admin.notifications.index'),
                                    icon: Bell,
                                },
                            ]
                          : []),
                      ...(can('certificates.view') && moduleEnabled('exports')
                          ? [
                                {
                                    title: t('items.exports'),
                                    href: route('admin.exports.index'),
                                    icon: Download,
                                },
                            ]
                          : []),
                  ],
              },
          ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={route(
                                    isPartner()
                                        ? 'partner.dashboard'
                                        : 'admin.dashboard',
                                )}
                                prefetch
                            >
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        background: 'rgba(255,255,255,0.15)',
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M9 12L11 14L15 10"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-sm font-bold tracking-wide text-white">
                                        NSIA
                                    </span>
                                    <span className="text-xs font-light text-white/50">
                                        TRANSPORT
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems as any} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
