import { type ReactNode } from 'react';

interface LoginLayoutProps {
    children: ReactNode;
}

/**
 * Layout específico para la página de Login.
 * Implementa un diseño de pantalla dividida:
 * - Izquierda: Panel de branding/marketing (oculto en móviles).
 * - Derecha: Contenido del formulario (children).
 */
export function LoginLayout({ children }: LoginLayoutProps) {
    return (
        <div className="flex min-h-screen w-full flex-row font-display text-[#121617] antialiased bg-background-light dark:bg-background-dark">
            {/* Left Panel: Brand Anchor */}
            {/* Hidden on mobile/tablet, visible on desktop (lg) */}
            <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-brand-blue p-12 text-white lg:flex">
                {/* Background Pattern & Gradient */}
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-blue/80 via-brand-blue to-[#0B1120]"></div>

                {/* Grid Pattern with reduced opacity (5-10%) */}
                <div className="absolute inset-0 z-0 opacity-[0.07]" style={{
                    backgroundImage: `
                radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.8) 1px, transparent 0),
                linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
            `,
                    backgroundSize: '32px 32px, 64px 64px, 64px 64px'
                }} />

                {/* Decorative Circle for "Unexpected" feel */}
                <div className="pointer-events-none absolute -right-[10%] -top-[10%] h-[400px] w-[400px] rounded-full bg-[#23468C] opacity-30 blur-3xl"></div>
                <div className="pointer-events-none absolute -left-[5%] bottom-[10%] h-[300px] w-[300px] rounded-full bg-[#43BBCA] opacity-20 blur-3xl"></div>

                {/* Hero Content */}
                <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
                    {/* Logo Container - Lighter Glassmorphism */}
                    <div className="mb-10 rounded-3xl bg-white/10 p-8 backdrop-blur-sm ring-1 ring-white/10 shadow-xl transition-transform hover:scale-105 duration-500">
                        <img
                            src="/img/electro-logo.png"
                            alt="Logo de la Empresa"
                            className="max-h-[14rem] max-w-[18rem] object-contain drop-shadow-sm"
                        />
                    </div>

                    {/* Typography: Medium + Bold */}
                    <h2 className="mb-6 text-5xl tracking-tight text-white drop-shadow-lg leading-tight">
                        <span className="font-medium block sm:inline">Plataforma de</span>{' '}
                        <span className="font-bold block sm:inline">Soporte</span>
                    </h2>

                    <p className="text-xl font-medium text-blue-100/90 max-w-md leading-relaxed">
                        Gestión eficiente para todas tus solicitudes.
                    </p>
                </div>

                {/* Bottom Metadata */}
                <div className="absolute bottom-8 left-0 z-10 flex w-full items-end justify-between px-12 text-xs font-medium uppercase tracking-wider text-white/50">
                    <div className="flex flex-col gap-1 text-left">
                        <span>© 2026 sistemas arpesod sas</span>
                        <div className="flex gap-3 normal-case tracking-normal opacity-80">
                            <a href="#" className="hover:text-white transition-colors underline-offset-2 hover:underline">Privacidad</a>
                            <span>•</span>
                            <a href="#" className="hover:text-white transition-colors underline-offset-2 hover:underline">Términos</a>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 backdrop-blur-sm border border-white/5">
                        <span>Estado del Sistema:</span>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-green-300 font-bold">Operativo</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Content */}
            <div className="flex w-full flex-col justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-20 xl:px-32">
                {children}
            </div>
        </div>
    );
}
