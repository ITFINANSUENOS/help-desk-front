
import { useState, type ReactNode } from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Header } from '../components/dashboard/Header';

interface DashboardLayoutProps {
    children: ReactNode;
    title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full flex-row overflow-hidden bg-[#f6f8f8]">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isMobileOpen={isMobileSidebarOpen}
                closeMobile={() => setIsMobileSidebarOpen(false)}
            />
            <main className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
                <Header
                    toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    title={title}
                />
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
