import { Link, usePage } from '@inertiajs/react';
import {
    Award, BarChart2, Briefcase, Building2,
    ClipboardList, Database, Download, FileBadge,
    FileText, LayoutDashboard, Search, Settings,
    Shield, Users, TrendingUp, UserCheck,
    Bell, Percent, Users2, Upload,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';

export function AppSidebar() {
    const { auth } = usePage<{
        auth: { user: { permissions: any[]; roles: any[] } };
    }>().props;

    const can = (p: string) => (auth?.user?.permissions ?? [])
        .some((perm: any) => (typeof perm === 'string' ? perm : perm.name) === p);

    const isSA = () => (auth?.user?.roles ?? [])
        .some((r: any) => (typeof r === 'string' ? r : r.name) === 'super_admin');

    const isAdminFiliale = () => (auth?.user?.roles ?? [])
        .some((r: any) => (typeof r === 'string' ? r : r.name) === 'admin_filiale');

    const mainNavItems = [
        // ── Dashboard ──────────────────────────────────────────
        {
            title: 'Dashboard',
            href:  route('admin.dashboard'),
            icon:  LayoutDashboard,
        },

        // ── KPIs Filiale — US-043 ─────────────────────────────
        ...(can('certificates.view') ? [{
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
        ...(can('users.view') ? [{
            title: 'Utilisateurs',
            href:  route('admin.users.index'),
            icon:  Users,
            children: [
                { title: 'Liste',    href: route('admin.users.index') },
                ...(can('users.block')  ? [{ title: 'Bloqués', href: route('admin.users.index') + '?status=blocked' }] : []),
                ...(can('users.create') ? [{ title: 'Nouveau', href: route('admin.users.create') }] : []),
            ],
        }] : []),

        // ── Rôles & Permissions — US-003 ───────────────────────
        ...(isSA() ? [{
            title: 'Rôles & Permissions',
            href:  route('admin.roles.index'),
            icon:  Shield,
            children: [
                { title: 'Liste des rôles', href: route('admin.roles.index') },
                { title: 'Nouveau rôle',    href: route('admin.roles.index') + '?action=create' },
            ],
        }] : []),

        // ── Filiales — US-011 ──────────────────────────────────
        ...(isSA() ? [{
            title: 'Filiales',
            href:  route('admin.tenants.index'),
            icon:  Building2,
            children: [
                { title: 'Liste',    href: route('admin.tenants.index') },
                { title: 'Nouvelle', href: route('admin.tenants.create') },
            ],
        }] : []),

        // ── Courtiers — US-010 ────────────────────────────────
        ...(can('brokers.view') ? [{
            title: 'Courtiers',
            href:  route('admin.brokers.index'),
            icon:  Briefcase,
            children: [
                { title: 'Liste',   href: route('admin.brokers.index') },
                ...(can('brokers.create') ? [{ title: 'Nouveau', href: route('admin.brokers.create') }] : []),
            ],
        }] : []),

        // ── Coassureurs — US-041 ─────────────────────────────
        ...(can('coinsurers.view') ? [{
            title: 'Coassureurs',
            href:  route('admin.coinsurers.index'),
            icon:  Users2,
            children: [
                { title: 'Liste',   href: route('admin.coinsurers.index') },
                ...(can('coinsurers.create') ? [{ title: 'Nouveau', href: route('admin.coinsurers.create') }] : []),
            ],
        }] : []),

        // ── Experts — US-042 ─────────────────────────────────
        ...(can('experts.view') ? [{
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
        ...(isSA() ? [{
            title: 'Modèles certificats',
            href:  route('admin.certificate-templates.index'),
            icon:  FileBadge,
            children: [
                { title: 'Liste',   href: route('admin.certificate-templates.index') },
                { title: 'Nouveau', href: route('admin.certificate-templates.create') },
            ],
        }] : []),

        // ── Contrats — US-014 ──────────────────────────────────
        ...(can('contracts.view') ? [{
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
        ...(can('certificates.view') ? [{
            title: 'Certificats',
            href:  route('admin.certificates.index'),
            icon:  Award,
            children: [
                { title: 'Liste',              href: route('admin.certificates.index') },
                { title: 'Recherche avancée',  href: route('admin.certificates.search'), icon: Search },
                ...(can('certificates.create')   ? [{ title: 'Nouveau',    href: route('admin.certificates.create') }] : []),
                ...(can('certificates.validate') ? [{ title: 'En attente', href: route('admin.dashboard.pending') }]   : []),
            ],
        }] : []),

        // ── Certificats GUCE ───────────────────────────────────
        ...(can('certificates.view') ? [{
            title: 'Certificats GUCE',
            href:  route('admin.guce-certificates.index'),
            icon:  Upload,
            children: [
                { title: 'Liste',    href: route('admin.guce-certificates.index') },
                { title: 'Importer', href: route('admin.guce-certificates.create') },
            ],
        }] : []),

        // ── Escalades NN300 — US-035 ───────────────────────────
        // Visible uniquement par admin_filiale et super_admin
        ...(isSA() || isAdminFiliale() ? [{
            title: 'Escalades NN300',
            href:  route('admin.approvals.index'),
            icon:  TrendingUp,
        }] : []),
        ...(isSA() || isAdminFiliale() ? [{ 
            title: 'Délégations', 
            href: route('admin.delegations.index'), 
            icon: UserCheck 
         }] : []),
        {
            title: 'Commissions',
            href: route('admin.commissions.rules'),
            icon: Percent,
            children: [
                { title: 'Règles',     href: route('admin.commissions.rules') },
                { title: 'Bordereau',  href: route('admin.commissions.bordereau') },
            ],
        },
        // ── Rapports — US-044/045/046 ─────────────────────────
        ...(can('certificates.view') || can('contracts.view') || can('brokers.view') ? [{
            title: 'Rapports',
            href:  route('admin.reports.certificates'),
            icon:  BarChart2,
            children: [
                ...(can('certificates.view') ? [{ title: 'État certificats',    href: route('admin.reports.certificates') }]    : []),
                ...(can('contracts.view')    ? [{ title: 'État contrats',        href: route('admin.reports.contracts') }]       : []),
                ...(can('brokers.view')      ? [{ title: 'Intermédiaires',       href: route('admin.reports.intermediaries') }]  : []),
            ],
        }] : []),
        // ── Mes exports — US-047 ─────────────────────────────
        ...(can('certificates.view') ? [{
            title: 'Mes exports',
            href:  route('admin.exports.index'),
            icon:  Download,
        }] : []),
        {
            title: 'Notifications',
            href:  route('admin.notifications.index'),
            icon:  Bell,
        },
        // ── Audit Logs ─────────────────────────────────────────
        ...(can('audit_logs.view') ? [{
            title: 'Audit Logs',
            href:  route('admin.audit-logs.index'),
            icon:  ClipboardList,
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
            ],
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('admin.dashboard')} prefetch>
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