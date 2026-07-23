import { Link, usePage } from '@inertiajs/react';
import {
    Award, BarChart2, Briefcase, Building2,
    ClipboardList, Database, Download, FileBadge,
    FileText, LayoutDashboard, Search, Settings,
    Shield, Users, TrendingUp, UserCheck,
    Bell, Percent, Users2, FilePlus2, Inbox, Receipt,
    ShieldAlert,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';

export function AppSidebar() {
    const { auth } = usePage<{
        auth: { user: { permissions: any[]; roles: any[]; tenant?: { modules?: Record<string, boolean> } } };
    }>().props;

    const can = (p: string) => (auth?.user?.permissions ?? [])
        .some((perm: any) => (typeof perm === 'string' ? perm : perm.name) === p);

    // Modules métier activables/désactivables par filiale (super_admin
    // n'a pas de tenant : aucune restriction ne s'applique à lui).
    const moduleEnabled = (key: string) => {
        const modules = auth?.user?.tenant?.modules;

        return !modules || modules[key] !== false;
    };

    const isSA = () => (auth?.user?.roles ?? [])
        .some((r: any) => (typeof r === 'string' ? r : r.name) === 'super_admin');

    const isAdminFiliale = () => (auth?.user?.roles ?? [])
        .some((r: any) => (typeof r === 'string' ? r : r.name) === 'admin_filiale');

    const isPartner = () => (auth?.user?.roles ?? [])
        .some((r: any) => ['courtier_local', 'partenaire_etranger'].includes(typeof r === 'string' ? r : r.name));

    const partnerNavItems = [
        {
            title: 'Tableau de bord',
            href:  route('partner.dashboard'),
            icon:  LayoutDashboard,
        },
        {
            title: 'Mes demandes',
            href:  route('partner.certificate-requests.index'),
            icon:  Inbox,
        },
        {
            title: 'Nouvelle demande',
            href:  route('partner.certificate-requests.create'),
            icon:  FilePlus2,
        },
        {
            title: 'Mes certificats',
            href:  route('partner.certificates.index'),
            icon:  Award,
        },
        {
            title: 'Paramètres',
            href:  route('profile.edit'),
            icon:  Settings,
            children: [
                { title: 'Profil',    href: route('profile.edit') },
                { title: 'Sécurité', href: route('user-password.edit') },
                { title: 'MFA',      href: route('user.mfa-setup') },
            ],
        },
    ];

    const mainNavItems = isPartner() ? partnerNavItems : [
        // ── Dashboard ──────────────────────────────────────────
        {
            title: 'Dashboard',
            href:  route('admin.dashboard'),
            icon:  LayoutDashboard,
        },

        // ── KPIs Filiale — US-043 ─────────────────────────────
        ...(can('certificates.view') && moduleEnabled('kpi') ? [{
            title: 'KPIs Filiale',
            href:  route('admin.dashboard.kpi'),
            icon:  BarChart2,
        }] : []),

        // ── Dashboard DTAG — US-048 (super_admin uniquement) ──
        ...(isSA() ? [{
            title: 'Dashboard DTAG',
            href:  route('admin.dashboard.dtag'),
            icon:  Building2,
        }] : []),

        // ── Utilisateurs — US-007/008 ──────────────────────────
        // Regroupe aussi Rôles & Permissions (US-003) et Filiales
        // (US-011), réservés au super_admin.
        ...(can('users.view') ? [{
            title: 'Utilisateurs',
            href:  route('admin.users.index'),
            icon:  Users,
            children: [
                { title: 'Liste',    href: route('admin.users.index') },
                ...(can('users.block')  ? [{ title: 'Bloqués', href: route('admin.users.index') + '?status=blocked' }] : []),
                ...(can('users.create') ? [{ title: 'Nouveau', href: route('admin.users.create') }] : []),
                ...(isSA() ? [
                    { title: 'Rôles & permissions', href: route('admin.roles.index') },
                    { title: 'Nouveau rôle',        href: route('admin.roles.index') + '?action=create' },
                    { title: 'Filiales',            href: route('admin.tenants.index') },
                    { title: 'Nouvelle filiale',    href: route('admin.tenants.create') },
                ] : []),
            ],
        }] : []),

        // ── Partenaires — Courtiers & espace partenaire ────────
        ...((can('brokers.view') || can('certificates.view')) && moduleEnabled('brokers') ? [{
            title: 'Partenaires / Courtiers',
            href:  can('brokers.view') ? route('admin.brokers.index') : route('admin.certificate-requests.index'),
            icon:  Briefcase,
            children: [
                ...(can('brokers.view')   ? [{ title: 'Courtiers',           href: route('admin.brokers.index') }]          : []),
                ...(can('brokers.create') ? [{ title: 'Nouveau courtier',    href: route('admin.brokers.create') }]         : []),
                ...(can('certificates.view') ? [{ title: 'Demandes partenaires', href: route('admin.certificate-requests.index') }] : []),
            ],
        }] : []),

        // ── Coassureurs — US-041 ─────────────────────────────
        ...(can('coinsurers.view') && moduleEnabled('coinsurers') ? [{
            title: 'Coassureurs',
            href:  route('admin.coinsurers.index'),
            icon:  Users2,
            children: [
                { title: 'Liste',   href: route('admin.coinsurers.index') },
                ...(can('coinsurers.create') ? [{ title: 'Nouveau', href: route('admin.coinsurers.create') }] : []),
            ],
        }] : []),

        // ── Experts — US-042 ─────────────────────────────────
        ...(can('experts.view') && moduleEnabled('experts') ? [{
            title: 'Experts',
            href:  route('admin.experts.index'),
            icon:  UserCheck,
            children: [
                { title: 'Liste',   href: route('admin.experts.index') },
                ...(can('experts.create') ? [{ title: 'Nouveau', href: route('admin.experts.create') }] : []),
            ],
        }] : []),

        // ── Références ─────────────────────────────────────────
        ...(isSA() ? [{
            title: 'Références',
            href:  '/admin/reference',
            icon:  Database,
            children: [
                { title: 'Pays',         href: '/admin/reference?tab=countries' },
                { title: 'Devises',      href: '/admin/reference?tab=currencies' },
                { title: 'Incoterms',    href: '/admin/reference?tab=incoterms' },
                { title: 'Transports',   href: '/admin/reference?tab=transport_modes' },
                { title: 'Marchandises', href: '/admin/reference?tab=merchandise_categories' },
            ],
        }] : []),

        // ── Modèles de certificats — US-013 ────────────────────
        ...(isSA() && moduleEnabled('certificate_templates') ? [{
            title: 'Modèles certificats',
            href:  route('admin.certificate-templates.index'),
            icon:  FileBadge,
            children: [
                { title: 'Liste',   href: route('admin.certificate-templates.index') },
                { title: 'Nouveau', href: route('admin.certificate-templates.create') },
            ],
        }] : []),

        // ── Contrats — US-014 ──────────────────────────────────
        ...(can('contracts.view') && moduleEnabled('contracts') ? [{
            title: 'Contrats',
            href:  route('admin.contracts.index'),
            icon:  FileText,
            children: [
                { title: 'Liste',          href: route('admin.contracts.index') },
                { title: 'Plafonds NN300', href: route('admin.contracts.limits') },
                ...(can('contracts.create') ? [{ title: 'Nouveau', href: route('admin.contracts.create') }] : []),
            ],
        }] : []),

        // ── Certificats — US-017/055 ──────────────────────────
        // Regroupe aussi les Certificats GUCE (import), sous réserve
        // du module 'guce_certificates'.
        ...(can('certificates.view') && moduleEnabled('certificates') ? [{
            title: 'Certificats',
            href:  route('admin.certificates.index'),
            icon:  Award,
            children: [
                { title: 'Liste',              href: route('admin.certificates.index') },
                { title: 'Recherche avancée',  href: route('admin.certificates.search'), icon: Search },
                { title: 'Modèles d\'impression', href: route('admin.certificates.print-models') },
                ...(can('certificates.create')   ? [{ title: 'Nouveau',    href: route('admin.certificates.create') }] : []),
                ...(can('certificates.validate') ? [{ title: 'En attente', href: route('admin.dashboard.pending') }]   : []),
                ...(moduleEnabled('guce_certificates') ? [
                    { title: 'Certificats GUCE', href: route('admin.guce-certificates.index') },
                    { title: 'Importer GUCE',    href: route('admin.guce-certificates.create') },
                ] : []),
            ],
        }] : []),

        ...(moduleEnabled('commissions') ? [{
            title: 'Commissions',
            href: route('admin.commissions.rules'),
            icon: Percent,
            children: [
                { title: 'Règles',     href: route('admin.commissions.rules') },
                { title: 'Bordereau',  href: route('admin.commissions.bordereau') },
            ],
        }] : []),

        ...(moduleEnabled('taxes') ? [{
            title: 'Taxes',
            href: route('admin.taxes.rules'),
            icon: Receipt,
        }] : []),
        // ── Rapports — US-044/045/046 ─────────────────────────
        ...((can('certificates.view') || can('contracts.view') || can('brokers.view')) && moduleEnabled('reports') ? [{
            title: 'Rapports',
            href:  route('admin.reports.certificates'),
            icon:  BarChart2,
            children: [
                ...(can('certificates.view') ? [{ title: 'État certificats',    href: route('admin.reports.certificates') }]    : []),
                ...(can('contracts.view')    ? [{ title: 'État contrats',        href: route('admin.reports.contracts') }]       : []),
                ...(can('brokers.view')      ? [{ title: 'Intermédiaires',       href: route('admin.reports.intermediaries') }]  : []),
            ],
        }] : []),
        // ── Sécurité — US-050 (super_admin uniquement) ────────
        ...(isSA() ? [{
            title: 'Sécurité',
            href:  route('admin.security.ip-blacklist.index'),
            icon:  Shield,
            children: [
                { title: 'Blacklist IP', href: route('admin.security.ip-blacklist.index') },
            ],
        }] : []),

        // ── Paramètres ─────────────────────────────────────────
        {
            title: 'Paramètres',
            href:  route('profile.edit'),
            icon:  Settings,
            children: [
                { title: 'Profil',    href: route('profile.edit') },
                { title: 'Sécurité', href: route('user-password.edit') },
                { title: 'MFA',      href: route('user.mfa-setup') },
                { title: 'Apparence', href: route('appearance.edit') },
                ...((isSA() || isAdminFiliale()) && moduleEnabled('approvals') ? [{ title: 'Escalades NN300', href: route('admin.approvals.index'), icon: TrendingUp }] : []),
                ...((isSA() || isAdminFiliale()) && moduleEnabled('approvals') ? [{ title: 'Seuils NN300', href: route('admin.approvals.configs'), icon: ShieldAlert }] : []),
                ...((isSA() || isAdminFiliale()) && moduleEnabled('delegations') ? [{ title: 'Délégations', href: route('admin.delegations.index'), icon: UserCheck }] : []),
                ...(can('audit_logs.view') && moduleEnabled('audit_logs') ? [{ title: 'Audit Logs', href: route('admin.audit-logs.index'), icon: ClipboardList }] : []),
                ...(moduleEnabled('notifications') ? [{ title: 'Notifications', href: route('admin.notifications.index'), icon: Bell }] : []),
                ...(can('certificates.view') && moduleEnabled('exports') ? [{ title: 'Mes exports', href: route('admin.exports.index'), icon: Download }] : []),
            ],
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route(isPartner() ? 'partner.dashboard' : 'admin.dashboard')} prefetch>
                                <div style={{ width:32, height:32, background:'rgba(255,255,255,0.15)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                                        <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="font-bold text-white text-sm tracking-wide">NSIA</span>
                                    <span className="text-white/50 text-xs font-light">TRANSPORT</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems as any}/>
            </SidebarContent>

            <SidebarFooter>
                <NavUser/>
            </SidebarFooter>
        </Sidebar>
    );
}