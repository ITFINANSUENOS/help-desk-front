
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';


interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
    isMobileOpen: boolean;
    closeMobile: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse, isMobileOpen, closeMobile }: SidebarProps) {
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
                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6">
                    <ul className="space-y-2">
                        {[
                            { to: "/", icon: "dashboard", label: "Dashboard" },
                            { to: "/tickets", icon: "confirmation_number", label: "Tickets" },
                            { to: "/customers", icon: "group", label: "Customers" },
                            { to: "/reports", icon: "bar_chart", label: "Reports" },
                            { to: "/roles", icon: "admin_panel_settings", label: "Roles y Permisos" },
                            { to: "/permissions", icon: "lock_open", label: "Catálogo Permisos" },
                            { to: "/settings", icon: "settings", label: "Settings" }
                        ].map((item) => (
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
