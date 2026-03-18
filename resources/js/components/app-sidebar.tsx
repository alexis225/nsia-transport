import { Link, usePage } from '@inertiajs/react';
import {
    Award, BarChart2, BookOpen, Briefcase,
    Building2, FileText, LayoutDashboard,
    Settings, Shield, Users,
} from 'lucide-react';
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
import { dashboard } from '@/routes';
import { log } from 'console';

export function AppSidebar() {
    const { auth } = usePage<{
        auth: { user: { permissions: string[]; roles: string[] } };
    }>().props;

    const can  = (p: string) => auth?.user?.permissions?.includes(p) ?? false;
    const isSA = () => auth?.user?.roles?.includes('super_admin') ?? false;
    
    const mainNavItems = [
        { title: 'Dashboard', href: dashboard(), icon: LayoutDashboard },
        ...(can('users.view') ? [{
            title: 'Utilisateurs', href: '/admin/users', icon: Users,
            children: [
                { title: 'Liste',    href: '/admin/users' },
                ...(can('users.block') ? [{ title: 'Bloqués', href: '/admin/users?status=blocked' }] : []),
            ],
        }] : []),
        ...(isSA() ? [
            {
                title: 'Rôles & Permissions', href: '/admin/roles', icon: Shield,
                children: [
                    { title: 'Rôles',       href: '/admin/roles' },
                    { title: 'Permissions', href: '/admin/roles' },
                ],
            },
            {
                title: 'Filiales', href: '/admin/tenants', icon: Building2,
                children: [
                    { title: 'Liste',         href: '/admin/tenants' },
                    { title: 'Configuration', href: '/admin/tenants/config' },
                ],
            },
        ] : []),
        ...(can('brokers.view') ? [{
            title: 'Courtiers', href: '/admin/brokers', icon: Briefcase,
            children: [
                { title: 'Liste',    href: '/admin/brokers' },
                ...(can('brokers.create') ? [{ title: 'Nouveau', href: '/admin/brokers/create' }] : []),
            ],
        }] : []),
        ...(can('contracts.view') ? [{
            title: 'Contrats', href: '/admin/contracts', icon: FileText,
            children: [
                { title: 'Liste',    href: '/admin/contracts' },
                ...(can('contracts.create') ? [{ title: 'Nouveau', href: '/admin/contracts/create' }] : []),
            ],
        }] : []),
        ...(can('certificates.view') ? [{
            title: 'Certificats', href: '/admin/certificates', icon: Award,
            children: [
                { title: 'Liste',      href: '/admin/certificates' },
                ...(can('certificates.create')   ? [{ title: 'Nouveau',    href: '/admin/certificates/create' }] : []),
                ...(can('certificates.validate') ? [{ title: 'En attente', href: '/admin/certificates?status=submitted' }] : []),
            ],
        }] : []),
        ...(can('reports.view') ? [{
            title: 'Rapports', href: '/admin/reports', icon: BarChart2,
            children: [
                ...(can('reports.dashboard_filiale') ? [{ title: 'Dashboard filiale', href: '/admin/reports/filiale' }]      : []),
                ...(can('reports.dashboard_dtag')    ? [{ title: 'Dashboard DTAG',    href: '/admin/reports/dtag' }]          : []),
                ...(can('reports.certificates')      ? [{ title: 'Certificats',        href: '/admin/reports/certificates' }] : []),
                ...(can('reports.contracts')         ? [{ title: 'Contrats',           href: '/admin/reports/contracts' }]    : []),
            ],
        }] : []),
        {
            title: 'Paramètres', href: '/settings/profile', icon: Settings,
            children: [
                { title: 'Profil',    href: '/settings/profile' },
                { title: 'Sécurité', href: '/settings/password' },
                { title: 'MFA',      href: '/user/mfa-setup' },
                { title: 'Apparence', href: '/settings/appearance' },
            ],
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                {/* Logo NSIA */}
                                <div style={{
                                    width: 32, height: 32,
                                    background: 'rgba(255,255,255,0.15)',
                                    borderRadius: 8,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z"
                                              stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                                        <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="1.5"
                                              strokeLinecap="round" strokeLinejoin="round"/>
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
                <NavMain items={mainNavItems as any} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}