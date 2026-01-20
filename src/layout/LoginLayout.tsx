import { type ReactNode } from 'react';

interface LoginLayoutProps {
    children: ReactNode;
}

export function LoginLayout({ children }: LoginLayoutProps) {
    return (
        <div className="flex min-h-screen w-full flex-row font-display text-[#121617] antialiased bg-background-light dark:bg-background-dark">
            {/* Left Panel: Brand Anchor */}
            {/* Hidden on mobile/tablet, visible on desktop (lg) */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-blue p-12 text-white lg:flex">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-100" style={{
                    backgroundImage: `
                radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.1) 1px, transparent 0),
                linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
                    backgroundSize: '24px 24px, 48px 48px, 48px 48px'
                }} />

                {/* Decorative Circle for "Unexpected" feel */}
                <div className="pointer-events-none absolute -right-[10%] -top-[10%] h-[400px] w-[400px] rounded-full bg-[#23468C] opacity-30 blur-3xl"></div>
                <div className="pointer-events-none absolute -left-[5%] bottom-[10%] h-[300px] w-[300px] rounded-full bg-[#43BBCA] opacity-20 blur-3xl"></div>

                {/* Logo Area */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>
                            support_agent
                        </span>
                    </div>
                    <span className="text-xl font-bold tracking-wide">DeskFlow</span>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-md">
                    <h2 className="mb-6 text-4xl font-bold leading-tight">
                        Soporte que Empodera,<br />
                        Soluciones Simplificadas.
                    </h2>
                    <div className="flex flex-col gap-4 border-l-2 border-white/20 pl-6">
                        <p className="text-lg leading-relaxed text-white/80">
                            "El panel es intuitivo, rápido y exactamente lo que nuestro equipo de TI necesitaba para escalar operaciones de forma segura."
                        </p>
                        <div className="flex items-center gap-3">
                            <div
                                className="h-10 w-10 rounded-full bg-cover bg-center"
                                style={{
                                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBuL1Ae2a8vuc_EG-_LG-F5NQ6oUtVPu_NqlId53Wfah6UGW0WBh8eKo8aGYHzDwk86LHnXXCPdpuE43R1DfDsCDhkm5mkVAG4bGnADIMalxoyLIYNL9s7l96PVl5T3o4XdqsEtYcNDkU2vftY8W7t1Y2PE_ykhYYpqoPS2pu4K_VjdhQKVkFBghQe-3bjcPOMCrI4lsuiOlnhzUMfJCxZ4RPoAteEJsNCnX_bRXcGMoGxqcRSBHa8RgEX8_09H2Kg1y58HwqaNEw')",
                                }}
                            />
                            <div>
                                <p className="text-sm font-semibold">Sarah Jenkins</p>
                                <p className="text-xs text-white/60">CTO at TechGlobal</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Metadata */}
                <div className="relative z-10 flex justify-between text-xs font-medium uppercase tracking-wider text-white/40">
                    <span>© 2026 DeskFlow Inc.</span>
                    <span>
                        Estado del Sistema: <span className="text-green-400">Operativo</span>
                    </span>
                </div>
            </div>

            {/* Right Panel: Content */}
            <div className="flex w-full flex-col justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-20 xl:px-32">
                {children}
            </div>
        </div>
    );
}
