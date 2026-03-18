import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

interface NavItemExtended extends NavItem {
    children?: { title: string; href: string }[];
}

/**
 * ============================================================
 * NavMain NSIA — Style Midone
 * ============================================================
 * Remplace nav-main.tsx Breeze.
 * N'utilise PAS Collapsible — CSS natif uniquement.
 * Items parents dans une card blanche arrondie.
 * Sous-menus dans un bloc indenté distinct.
 * ============================================================
 */
export function NavMain({ items = [] }: { items: NavItemExtended[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    const [openItems, setOpenItems] = useState<string[]>(() =>
        items
            .filter(item => item.children?.some(c => isCurrentUrl(c.href)))
            .map(item => item.title)
    );

    const toggle = (title: string) =>
        setOpenItems(prev =>
            prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
        );

    const simpleItems  = items.filter(i => !i.children?.length);
    const complexItems = items.filter(i => !!i.children?.length);

    return (
        <>
            <style>{`
                /* ── Section label ── */
                .mn-section {
                    padding: 16px 14px 6px;
                    font-size: 9.5px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.3);
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                }

                /* ── Item simple ── */
                .mn-simple {
                    margin: 2px 10px;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .mn-simple-link {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    color: rgba(255,255,255,0.65);
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 400;
                    border-radius: 10px;
                    transition: all 0.15s;
                    border: none;
                    background: none;
                    width: 100%;
                    cursor: pointer;
                    font-family: inherit;
                }
                .mn-simple-link:hover {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                }
                .mn-simple-link.active {
                    background: rgba(255,255,255,0.15);
                    color: #fff;
                    font-weight: 500;
                }
                .mn-ico {
                    width: 30px;
                    height: 30px;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .mn-simple-link.active .mn-ico {
                    background: rgba(255,255,255,0.2);
                }

                /* ── Item avec sous-menu (card blanche) ── */
                .mn-group {
                    margin: 4px 10px;
                    border-radius: 12px;
                    overflow: hidden;
                }

                /* Header de la card */
                .mn-parent {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    background: rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.75);
                    cursor: pointer;
                    border: none;
                    width: 100%;
                    text-align: left;
                    font-size: 13px;
                    font-weight: 500;
                    font-family: inherit;
                    border-radius: 12px;
                    transition: background 0.15s;
                    position: relative;
                    z-index: 1;
                }
                .mn-parent:hover {
                    background: rgba(255,255,255,0.13);
                    color: #fff;
                }
                .mn-parent.open {
                    background: rgba(255,255,255,0.13);
                    color: #fff;
                    border-radius: 12px 12px 0 0;
                }
                .mn-parent.active-parent {
                    background: rgba(255,255,255,0.15);
                    color: #fff;
                }
                .mn-label { flex: 1; }

                /* Badge count */
                .mn-badge {
                    background: rgba(255,255,255,0.2);
                    color: #fff;
                    font-size: 10px;
                    font-weight: 600;
                    padding: 1px 6px;
                    border-radius: 10px;
                    flex-shrink: 0;
                }

                /* Chevron animé */
                .mn-chevron {
                    flex-shrink: 0;
                    opacity: 0.5;
                    transition: transform 0.2s ease;
                }
                .mn-chevron.open { transform: rotate(180deg); }

                /* Sous-menu — bloc indenté dans la card */
                .mn-submenu {
                    background: rgba(0,0,0,0.15);
                    border-radius: 0 0 12px 12px;
                    overflow: hidden;
                    max-height: 0;
                    transition: max-height 0.25s ease;
                }
                .mn-submenu.open { max-height: 400px; }

                .mn-sublink {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    padding: 8px 14px 8px 20px;
                    color: rgba(255,255,255,0.5);
                    text-decoration: none;
                    font-size: 12px;
                    transition: all 0.13s;
                    border-left: 2px solid transparent;
                }
                .mn-sublink:hover {
                    color: rgba(255,255,255,0.9);
                    background: rgba(255,255,255,0.05);
                }
                .mn-sublink.active {
                    color: #93c5fd;
                    font-weight: 500;
                    border-left-color: #60a5fa;
                    background: rgba(96,165,250,0.08);
                }
                .mn-subdot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: currentColor;
                    opacity: 0.5;
                    flex-shrink: 0;
                }

                /* Icône active */
                .mn-ico-active {
                    background: rgba(96,165,250,0.25) !important;
                }
            `}</style>

            {/* ── Items simples ── */}
            {simpleItems.length > 0 && (
                <SidebarGroup className="px-0 py-0">
                    <div className="mn-section">Navigation</div>
                    <SidebarMenu>
                        {simpleItems.map(item => {
                            const act = isCurrentUrl(item.href ?? '');
                            return (
                                <SidebarMenuItem key={item.title} className="mn-simple">
                                    <Link
                                        href={item.href ?? '#'}
                                        className={`mn-simple-link ${act ? 'active' : ''}`}
                                        prefetch
                                    >
                                        <span className={`mn-ico ${act ? 'mn-ico-active' : ''}`}>
                                            {item.icon && <item.icon size={15}/>}
                                        </span>
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            )}

            {/* ── Items avec sous-menus ── */}
            {complexItems.length > 0 && (
                <SidebarGroup className="px-0 py-0">
                    <div className="mn-section">Modules</div>
                    <SidebarMenu>
                        {complexItems.map(item => {
                            const isOpen    = openItems.includes(item.title);
                            const isActPar  = item.children?.some(c => isCurrentUrl(c.href)) ?? false;
                            const childCount = item.children?.length ?? 0;

                            return (
                                <SidebarMenuItem key={item.title} className="mn-group">
                                    {/* ── Parent ── */}
                                    <button
                                        className={`mn-parent ${isOpen ? 'open' : ''} ${isActPar ? 'active-parent' : ''}`}
                                        onClick={() => toggle(item.title)}
                                    >
                                        <span className={`mn-ico ${isActPar ? 'mn-ico-active' : ''}`}>
                                            {item.icon && <item.icon size={15}/>}
                                        </span>
                                        <span className="mn-label">{item.title}</span>
                                        {childCount > 0 && (
                                            <span className="mn-badge">{childCount}</span>
                                        )}
                                        <ChevronDown
                                            size={13}
                                            className={`mn-chevron ${isOpen ? 'open' : ''}`}
                                        />
                                    </button>

                                    {/* ── Sous-menu ── */}
                                    <div className={`mn-submenu ${isOpen ? 'open' : ''}`}>
                                        {item.children!.map(child => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={`mn-sublink ${isCurrentUrl(child.href) ? 'active' : ''}`}
                                                prefetch
                                            >
                                                <span className="mn-subdot"/>
                                                {child.title}
                                            </Link>
                                        ))}
                                    </div>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            )}
        </>
    );
}