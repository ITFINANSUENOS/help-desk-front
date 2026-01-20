
import { Link } from 'react-router-dom';

export function Sidebar() {
    return (
        <aside className="flex w-64 flex-col bg-brand-blue text-white transition-all duration-300">
            <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-white/20 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>support_agent</span>
                </div>
                <span className="text-xl font-bold tracking-wide">DeskFlow</span>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <ul className="space-y-2">
                    <li>
                        <Link className="group flex items-center gap-3 rounded-lg bg-brand-accent px-4 py-3 text-white transition-colors"
                            to="/">
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>dashboard</span>
                            <span className="font-semibold text-sm">Dashboard</span>
                        </Link>
                    </li>
                    <li>
                        <Link className="group flex items-center gap-3 rounded-lg px-4 py-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            to="/tickets">
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>confirmation_number</span>
                            <span className="font-medium text-sm">Tickets</span>
                        </Link>
                    </li>
                    <li>
                        <Link className="group flex items-center gap-3 rounded-lg px-4 py-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            to="/customers">
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>group</span>
                            <span className="font-medium text-sm">Customers</span>
                        </Link>
                    </li>
                    <li>
                        <Link className="group flex items-center gap-3 rounded-lg px-4 py-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            to="/reports">
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>bar_chart</span>
                            <span className="font-medium text-sm">Reports</span>
                        </Link>
                    </li>
                    <li>
                        <Link className="group flex items-center gap-3 rounded-lg px-4 py-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            to="/roles">
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>admin_panel_settings</span>
                            <span className="font-medium text-sm">Roles y Permisos</span>
                        </Link>
                    </li>
                    <li>
                        <Link className="group flex items-center gap-3 rounded-lg px-4 py-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            to="/permissions">
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>lock_open</span>
                            <span className="font-medium text-sm">Catálogo Permisos</span>
                        </Link>
                    </li>
                    <li>
                        <Link className="group flex items-center gap-3 rounded-lg px-4 py-3 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            to="/settings">
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>settings</span>
                            <span className="font-medium text-sm">Settings</span>
                        </Link>
                    </li>
                </ul>
            </nav>
            <div className="border-t border-white/10 p-6">
                <a className="flex items-center gap-3 text-sm text-white/60 hover:text-white" href="#">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
                    <span>Support Center</span>
                </a>
            </div>
        </aside>
    );
}
