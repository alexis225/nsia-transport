import { Link, usePage } from '@inertiajs/react';
import {
    Award, BarChart2, Briefcase, Building2,
    ClipboardList,
    FileText, LayoutDashboard, Settings, Shield, Users,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Children } from 'react';

export function AppSidebar() {
    const { auth } = usePage<{
        auth: { user: { permissions: any[]; roles: any[] } };
    }>().props;

    const can = (p: string) => (auth?.user?.permissions ?? [])
        .some((perm: any) => (typeof perm === 'string' ? perm : perm.name) === p);

    const isSA = () => (auth?.user?.roles ?? [])
        .some((r: any) => (typeof r === 'string' ? r : r.name) === 'super_admin');

    const mainNavItems = [
        // ── Dashboard ──────────────────────────────────────────
        {
            title: 'Dashboard',
            href:  route('admin.dashboard'),
            icon:  LayoutDashboard,
        },

        // ── Utilisateurs — US-007/008 ──────────────────────────
        ...(can('users.view') ? [{
            title: 'Utilisateurs',
            href:  route('admin.users.index'),
            icon:  Users,
            children: [
                { title: 'Liste',    href: route('admin.users.index') },
                ...(can('users.block')  ? [{ title: 'Bloqués', href: route('admin.users.index') + '?status=blocked' }] : []),
                ...(can('users.create') ? [{ title: 'Nouveau', href: route('admin.users.create') }]         : []),
            ],
        }] : []),

        // ── Rôles & Permissions — US-003 ───────────────────────
        // FIX : "Rôles" et "Permissions" avaient le même href → clés dupliquées
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
        // FIX : route('admin.tenants.index') n'existe pas → /admin/tenants
        ...(isSA() ? [{
            title: 'Filiales',
            href:  route('admin.tenants.index'),
            icon:  Building2,
            children: [
                { title: 'Liste',          href: route('admin.tenants.index') },
                { title: 'Nouvelle',       href: route('admin.tenants.create') },
            ],
        }] : []),

        // // ── Courtiers — US-010 ─────────────────────────────────
        // ...(can('brokers.view') ? [{
        //     title: 'Courtiers',
        //     href:  route('admin.brokers.index'),
        //     icon:  Briefcase,
        //     children: [
        //         { title: 'Liste',    href: route('admin.brokers.index') },
        //         ...(can('brokers.create') ? [{ title: 'Nouveau', href: route('admin.brokers.create') }] : []),
        //     ],
        // }] : []),

        // // ── Contrats — US-014 ──────────────────────────────────
        // ...(can('contracts.view') ? [{
        //     title: 'Contrats',
        //     href:  route('admin.contracts.index'),
        //     icon:  FileText,
        //     children: [
        //         { title: 'Liste',    href: route('admin.contracts.index') },
        //         ...(can('contracts.create') ? [{ title: 'Nouveau', href: route('admin.contracts.create') }] : []),
        //     ],
        // }] : []),

        // // ── Certificats — US-017 ───────────────────────────────
        // ...(can('certificates.view') ? [{
        //     title: 'Certificats',
        //     href:  route('admin.certificates.index'),
        //     icon:  Award,
        //     children: [
        //         { title: 'Liste',      href: route('admin.certificates.index') },
        //         ...(can('certificates.create')   ? [{ title: 'Nouveau',    href: route('admin.certificates.create') }]           : []),
        //         ...(can('certificates.validate') ? [{ title: 'En attente', href: route('admin.certificates.index') + '?status=submitted' }] : []),
        //     ],
        // }] : []),

        // // ── Rapports — US-043 ──────────────────────────────────
        // ...(can('reports.view') ? [{
        //     title: 'Rapports',
        //     href:  route('admin.reports.index'),
        //     icon:  BarChart2,
        //     children: [
        //         ...(can('reports.dashboard_filiale') ? [{ title: 'Dashboard filiale', href: route('admin.reports.filiale') }]      : []),
        //         ...(can('reports.dashboard_dtag')    ? [{ title: 'Dashboard DTAG',    href: route('admin.reports.dtag') }]          : []),
        //         ...(can('reports.certificates')      ? [{ title: 'Certificats',        href: route('admin.reports.certificates') }] : []),
        //         ...(can('reports.contracts')         ? [{ title: 'Contrats',           href: route('admin.reports.contracts') }]    : []),
        //     ],
        // }] : []),

        ...(can('audit_logs.view') ? [{
            title: 'Audit Logs',
            href:  route('admin.audit-logs.index'),
            icon:  ClipboardList, 
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
                            <Link href="/dashboard" prefetch>
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