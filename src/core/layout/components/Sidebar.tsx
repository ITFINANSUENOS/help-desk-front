
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../../shared/lib/utils';
import { useAuth } from '../../../modules/auth/context/useAuth';
import type { PermissionSubject } from '../../../modules/roles/interfaces/Permission';
import { Icon } from '../../../shared/components/Icon';

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
    isMobileOpen: boolean;
    closeMobile: () => void;
}

interface MenuItem {
    to: string;
    icon: string;
    label: string;
    subject?: PermissionSubject;
    action?: string;
    /** Child items render an inline collapsible submenu */
    children?: Array<{ to: string; icon: string; label: string }>;
}

/** Collapsible submenu rendered inline inside the sidebar nav. */
function SubMenu({
    items,
    isCollapsed,
    closeMobile,
}: {
    items: Array<{ to: string; icon: string; label: string }>;
    isCollapsed: boolean;
    closeMobile: () => void;
}) {
    const location = useLocation();

    if (isCollapsed) return null;

    return (
        <ul className="mt-1 ml-3 space-y-1 border-l border-white/20 pl-3">
            {items.map((sub) => {
                const isActive = location.pathname === sub.to;
                return (
                    <li key={sub.to}>
                        <Link
                            to={sub.to}
                            title={sub.label}
                            onClick={closeMobile}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/80 transition-all hover:bg-white/15 hover:text-white',
                                isActive && 'bg-[#43BBCA]/25 text-white border-l-2 border-[#43BBCA]',
                            )}
                        >
                            <Icon
                                name={sub.icon}
                                style={{ fontSize: '18px', fontVariationSettings: '"FILL" 1' }}
                                className="flex-shrink-0"
                            />
                            <span className="whitespace-nowrap">{sub.label}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export function Sidebar({ isCollapsed, toggleCollapse, isMobileOpen, closeMobile }: SidebarProps) {
    const { user } = useAuth();
    const location = useLocation();

    /** Track which parent items have their submenu open */
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const toggleMenu = (to: string) =>
        setOpenMenus((prev) => ({ ...prev, [to]: !prev[to] }));

    const hasPermission = (subject?: PermissionSubject, action: string = 'read') => {
        if (!subject) return true;
        if (!user?.permissions) return false;
        return user.permissions.some((p) =>
            (p.subject === subject || p.subject === 'all') &&
            (p.action === action || p.action === 'manage'),
        );
    };

    const menuItems: MenuItem[] = [
        { to: '/', icon: 'dashboard', label: 'Dashboard' },
        { to: '/tickets', icon: 'confirmation_number', label: 'Tickets', subject: 'Ticket' },
        { to: '/users', icon: 'group', label: 'Usuarios', subject: 'User', action: 'manage' },
        { to: '/roles', icon: 'admin_panel_settings', label: 'Roles y Permisos', subject: 'Role', action: 'manage' },
        { to: '/permissions', icon: 'lock_open', label: 'Catálogo Permisos', subject: 'Permission', action: 'manage' },
        { to: '/departments', icon: 'corporate_fare', label: 'Departamentos', subject: 'Department', action: 'manage' },
        { to: '/companies', icon: 'business', label: 'Empresas', subject: 'Company' as any, action: 'manage' },
        { to: '/categories', icon: 'category', label: 'Categorías', subject: 'Category', action: 'manage' },
        { to: '/subcategories', icon: 'segment', label: 'Subcategorías', subject: 'Category' as any, action: 'manage' },
        { to: '/workflows', icon: 'schema', label: 'Gestión de Flujos', subject: 'Workflow' as any, action: 'manage' },
        { to: '/regions', icon: 'map', label: 'Regionales', subject: 'Regional' as any, action: 'manage' },
        { to: '/zones', icon: 'location_on', label: 'Zonas', subject: 'Zone' as any, action: 'manage' },
        { to: '/positions', icon: 'badge', label: 'Cargos', subject: 'Position' as any, action: 'manage' },
        { to: '/profiles', icon: 'badge', label: 'Perfiles', subject: 'Profile' as any, action: 'manage' },
        { to: '/organigrama', icon: 'account_tree', label: 'Organigrama', subject: 'Organigrama' as any, action: 'manage' },
        { to: '/error-types', icon: 'quick_phrases', label: 'Tipos de Error', subject: 'FastAnswer' as any, action: 'manage' },
        { to: '/mapping-rules', icon: 'rule', label: 'Reglas de Mapeo', subject: 'Rule' as any, action: 'manage' },
        { to: "/reports/flow-open", icon: "pending_actions", label: "Tickets Abiertos por Flujo", subject: 'Report', action: 'read' },
        {
            to: '/reports',
            icon: 'bar_chart',
            label: 'Reportes',
            subject: 'Report',
            action: 'read',
        },
        {
            // Dashboard analytics — submenu item intentionally has no permission guard
            // (access is controlled by the parent "Report" permission above)
            to: '/reports/dashboard',
            icon: 'insights',
            label: 'Dashboard Analytics',
            subject: 'Report',
            action: 'read',
            children: [
                { to: '/reports/dashboard', icon: 'space_dashboard', label: 'KPIs Globales' },
                { to: '/reports/dashboard/ranking', icon: 'military_tech', label: 'Ranking Usuarios' },
                { to: '/reports/dashboard/regionales', icon: 'map', label: 'Por Regional' },
                { to: '/reports/dashboard/mapa-calor', icon: 'local_fire_department', label: 'Mapa de Calor' },
                { to: '/reports/dashboard/categorias', icon: 'category', label: 'Por Categoría' },
                { to: '/reports/dashboard/cuellos-botella', icon: 'warning', label: 'Cuellos de Botella' },
                { to: '/reports/dashboard/distribucion', icon: 'timeline', label: 'Distribución Tiempos' },
                { to: '/reports/dashboard/novedades', icon: 'bug_report', label: 'Novedades' },
                { to: '/reports/dashboard/tickets-usuario', icon: 'people', label: 'Tickets por Usuario' },
            ],
        },
        { to: "/settings", icon: "settings", label: "Settings" }
    ];

    const filteredItems = menuItems.filter((item) => hasPermission(item.subject, item.action));

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={closeMobile}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col text-white transition-all duration-300 lg:static lg:z-auto overflow-hidden',
                    isCollapsed ? 'w-20' : 'w-64',
                    !isMobileOpen && '-translate-x-full lg:translate-x-0',
                )}
            >
                {/* Background gradient */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a3a6e] via-brand-blue to-[#0B1120]" />

                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 z-0 opacity-[0.08]"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.8) 1px, transparent 0),
                            linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
                        `,
                        backgroundSize: '32px 32px, 64px 64px, 64px 64px',
                    }}
                />

                {/* Sidebar content */}
                <div className="relative z-10 flex flex-col h-full">
                    {/* Header / Logo */}
                    <div
                        className={cn(
                            'flex h-20 items-center border-b border-white/20 transition-all',
                            isCollapsed ? 'justify-center px-0' : 'justify-between px-6',
                        )}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center">
                                <img src="img/LOGO-EC-FN.png" alt="" />
                            </div>
                            <span
                                className={cn(
                                    'text-xl font-extrabold tracking-wide transition-opacity whitespace-nowrap drop-shadow-md',
                                    isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100',
                                )}
                            >
                                Soporte
                            </span>
                        </div>
                        {/* Mobile Close Button */}
                        <button
                            onClick={closeMobile}
                            className="lg:hidden text-white/90 hover:text-white transition-colors"
                        >
                            <Icon name="close" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 no-scrollbar">
                        <ul className="space-y-2">
                            {/* Create Ticket Action */}
                            {hasPermission('Ticket', 'create') && (
                                <li>
                                    <Link
                                        to="/tickets/create"
                                        title="Crear Ticket"
                                        className={cn(
                                            'group flex items-center rounded-lg py-3 transition-all',
                                            isCollapsed ? 'justify-center px-0' : 'px-4 gap-3',
                                            'bg-gradient-to-r from-brand-teal via-[#3aa9b8] to-[#2563a8] hover:from-[#3aa9b8] hover:via-brand-teal hover:to-brand-blue text-white shadow-lg hover:shadow-xl font-semibold',
                                        )}
                                        onClick={closeMobile}
                                    >
                                        <Icon
                                            name="add_circle"
                                            className="flex-shrink-0"
                                            style={{ fontSize: '22px', fontVariationSettings: '"FILL" 1' }}
                                        />
                                        <span
                                            className={cn(
                                                'font-semibold text-sm transition-all whitespace-nowrap',
                                                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100',
                                            )}
                                        >
                                            Crear Ticket
                                        </span>
                                    </Link>
                                </li>
                            )}

                            {filteredItems.map((item) => {
                                const hasChildren = !!item.children?.length;
                                const isParentActive =
                                    location.pathname === item.to ||
                                    (hasChildren && item.children!.some((c) => location.pathname.startsWith(c.to) && c.to !== '/'));
                                const isOpen = openMenus[item.to] ?? isParentActive;

                                if (hasChildren) {
                                    return (
                                        <li key={item.to}>
                                            {/* Parent toggle button */}
                                            <button
                                                type="button"
                                                title={isCollapsed ? item.label : undefined}
                                                onClick={() => {
                                                    if (!isCollapsed) toggleMenu(item.to);
                                                }}
                                                className={cn(
                                                    'group flex w-full items-center rounded-lg py-3 text-white/90 transition-all hover:bg-white/15 hover:text-white hover:shadow-md',
                                                    isCollapsed ? 'justify-center px-0' : 'px-4 gap-3',
                                                    isParentActive && 'bg-gradient-to-r from-brand-teal/30 to-transparent text-white border-l-4 border-brand-teal shadow-md',
                                                )}
                                            >
                                                <Icon
                                                    name={item.icon}
                                                    className="flex-shrink-0"
                                                    style={{ fontSize: '22px', fontVariationSettings: '"FILL" 1' }}
                                                />
                                                {!isCollapsed && (
                                                    <>
                                                        <span className="flex-1 text-left font-medium text-sm whitespace-nowrap">
                                                            {item.label}
                                                        </span>
                                                        <Icon
                                                            name={isOpen ? 'expand_less' : 'expand_more'}
                                                            style={{ fontSize: '18px' }}
                                                            className="text-white/60"
                                                        />
                                                    </>
                                                )}
                                            </button>

                                            {/* Collapsible children */}
                                            {isOpen && (
                                                <SubMenu
                                                    items={item.children!}
                                                    isCollapsed={isCollapsed}
                                                    closeMobile={closeMobile}
                                                />
                                            )}
                                        </li>
                                    );
                                }

                                return (
                                    <li key={item.to}>
                                        <Link
                                            to={item.to}
                                            title={isCollapsed ? item.label : undefined}
                                            className={cn(
                                                'group flex items-center rounded-lg py-3 text-white/90 transition-all hover:bg-white/15 hover:text-white hover:shadow-md',
                                                isCollapsed ? 'justify-center px-0' : 'px-4 gap-3',
                                                location.pathname === item.to &&
                                                'bg-gradient-to-r from-brand-teal/30 to-transparent text-white border-l-4 border-brand-teal shadow-md',
                                            )}
                                            onClick={closeMobile}
                                        >
                                            <Icon
                                                name={item.icon}
                                                className="flex-shrink-0"
                                                style={{ fontSize: '22px', fontVariationSettings: '"FILL" 1' }}
                                            />
                                            <span
                                                className={cn(
                                                    'font-medium text-sm transition-all whitespace-nowrap',
                                                    isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100',
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Footer / Toggle */}
                    <div className="border-t border-white/20 p-4">
                        {/* Support Link */}
                        <a
                            className={cn(
                                'flex items-center gap-3 text-sm text-white/80 hover:text-white mb-4 transition-colors font-medium',
                                isCollapsed ? 'justify-center' : '',
                            )}
                            href="/manual/index.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Manual de Usuario"
                        >
                            <Icon
                                name="menu_book"
                                style={{ fontSize: '20px', fontVariationSettings: '"FILL" 1' }}
                            />
                            {!isCollapsed && <span>Manual de Usuario</span>}
                        </a>

                        {/* Desktop Collapse Toggle */}
                        <button
                            onClick={toggleCollapse}
                            className="hidden lg:flex w-full items-center justify-center rounded-lg bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all"
                        >
                            <Icon
                                name={isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
                            />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
