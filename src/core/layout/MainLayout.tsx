import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LayoutContext } from './context/LayoutContext';

export function MainLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [title, setTitle] = useState('');
    const location = useLocation();

    // Reset title on location change? Optional, but pages will usually set it.
    // Actually, pages should set it on mount.

    return (
        <LayoutContext.Provider value={{ setTitle }}>
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
                    <div className="flex-1 overflow-y-auto p-4 md:p-8" id="main-content">
                        <Outlet />
                    </div>
                </main>
            </div>
        </LayoutContext.Provider>
    );
}
