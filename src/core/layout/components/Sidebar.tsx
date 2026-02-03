
import { Link } from 'react-router-dom';
import { cn } from '../../../shared/lib/utils';
import { useAuth } from '../../../modules/auth/context/useAuth';
import type { PermissionSubject } from '../../../modules/roles/interfaces/Permission';

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
    subject?: PermissionSubject; // Optional permission subject required
    action?: string; // Defaults to 'read' if not specified
}

export function Sidebar({ isCollapsed, toggleCollapse, isMobileOpen, closeMobile }: SidebarProps) {
    const { user } = useAuth();

    const hasPermission = (subject?: PermissionSubject, action: string = 'read') => {
        if (!subject) return true; // Public item
        if (!user?.permissions) return false;

        return user.permissions.some((p) =>
            (p.subject === subject || p.subject === 'all') &&
            (p.action === action || p.action === 'manage')
        );
    };

    const menuItems: MenuItem[] = [
        { to: "/", icon: "dashboard", label: "Dashboard" },
        { to: "/tickets", icon: "confirmation_number", label: "Tickets", subject: 'Ticket' }, // Keep as default (read)
        { to: "/users", icon: "group", label: "Usuarios", subject: 'User', action: 'manage' },
        { to: "/roles", icon: "admin_panel_settings", label: "Roles y Permisos", subject: 'Role', action: 'manage' },
        { to: "/permissions", icon: "lock_open", label: "Catálogo Permisos", subject: 'Permission', action: 'manage' },
        { to: "/departments", icon: "corporate_fare", label: "Departamentos", subject: 'Department', action: 'manage' },
        { to: "/companies", icon: "business", label: "Empresas", subject: 'Company' as any, action: 'manage' },
        { to: "/categories", icon: "category", label: "Categorías", subject: 'Category', action: 'manage' },
        { to: "/subcategories", icon: "segment", label: "Subcategorías", subject: 'Category' as any, action: 'manage' },
        { to: "/workflows", icon: "schema", label: "Gestión de Flujos", subject: 'Workflow' as any, action: 'manage' },
        { to: "/regions", icon: "map", label: "Regionales", subject: 'Regional' as any, action: 'manage' },
        { to: "/zones", icon: "location_on", label: "Zonas", subject: 'Zone' as any, action: 'manage' },
        { to: "/positions", icon: "badge", label: "Cargos", subject: 'Position' as any, action: 'manage' },
        { to: "/profiles", icon: "badge", label: "Perfiles", subject: 'Profile' as any, action: 'manage' },
        { to: "/organigrama", icon: "account_tree", label: "Organigrama", subject: 'Organigrama' as any, action: 'manage' },
        { to: "/error-types", icon: "quick_phrases", label: "Tipos de Error", subject: 'FastAnswer' as any, action: 'manage' },
        { to: "/mapping-rules", icon: "rule", label: "Reglas de Mapeo", subject: 'Rule' as any, action: 'manage' },
        { to: "/reports", icon: "bar_chart", label: "Reports", subject: 'Report' }, // Reports might be read-only? Leaving default for now unless specified.

        { to: "/settings", icon: "settings", label: "Settings" }
    ];

    const filteredItems = menuItems.filter(item => hasPermission(item.subject, item.action));

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
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-brand-blue text-white transition-all duration-300 lg:static lg:z-auto",
                    isCollapsed ? "w-20" : "w-64",
                    // Mobile slide behavior
                    !isMobileOpen && "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Header / Logo */}
                <div className={cn(
                    "flex h-20 items-center border-b border-white/10 transition-all",
                    isCollapsed ? "justify-center px-0" : "justify-between px-6"
                )}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-white/20 backdrop-blur-sm">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>support_agent</span>
                        </div>
                        <span className={cn(
                            "text-xl font-bold tracking-wide transition-opacity whitespace-nowrap",
                            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                        )}>
                            DeskFlow
                        </span>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={closeMobile}
                        className="lg:hidden text-white/80 hover:text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 no-scrollbar">
                    <ul className="space-y-2">
                        {filteredItems.map((item) => (
                            <li key={item.to}>
                                <Link
                                    to={item.to}
                                    title={isCollapsed ? item.label : undefined}
                                    className={cn(
                                        "group flex items-center rounded-lg py-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white",
                                        isCollapsed ? "justify-center px-0" : "px-4 gap-3",
                                        location.pathname === item.to && "bg-brand-accent text-white"
                                    )}
                                    onClick={() => closeMobile()} // Close on navigation in mobile
                                >
                                    <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '22px' }}>{item.icon}</span>
                                    <span className={cn(
                                        "font-medium text-sm transition-all whitespace-nowrap",
                                        isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                                    )}>
                                        {item.label}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer / Toggle */}
                <div className="border-t border-white/10 p-4">
                    {/* Support Link */}
                    <a
                        className={cn(
                            "flex items-center gap-3 text-sm text-white/60 hover:text-white mb-4",
                            isCollapsed ? "justify-center" : ""
                        )}
                        href="#"
                        title="Support Center"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
                        {!isCollapsed && <span>Support Center</span>}
                    </a>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden lg:flex w-full items-center justify-center rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">
                            {isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
