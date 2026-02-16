import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { LayoutContext } from './context/LayoutContext';
import { NotificationsProvider, useNotificationsContext } from '../../shared/context/NotificationsContext';
import { GlobalErrorListener } from '../../shared/components/GlobalErrorListener';

function MainLayoutContent() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [title, setTitle] = useState('');
    const { toasts, removeToast } = useNotificationsContext();

    return (
        <LayoutContext.Provider value={{ setTitle }}>
            <GlobalErrorListener />
            <div id="app-layout" className="flex h-screen w-full flex-row overflow-hidden bg-[#f6f8f8]">
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

            {/* Toast Notifications Container */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </LayoutContext.Provider>
    );
}

export function MainLayout() {
    return (
        <NotificationsProvider>
            <MainLayoutContent />
        </NotificationsProvider>
    );
}
