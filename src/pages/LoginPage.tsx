import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LoginLayout } from '../layout/LoginLayout';
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Login attempt:', { email, password });
        // TODO: Implement actual API call
    };

    return (
        <LoginLayout>
            {/* Mobile Logo (Visible only on smaller screens) */}
            <div className="mb-8 flex items-center gap-2 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-blue text-white">
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '20px' }}
                    >
                        support_agent
                    </span>
                </div>
                <span className="text-lg font-bold text-brand-blue">DeskFlow</span>
            </div>

            <div className="mx-auto w-full max-w-[440px]">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="mb-2 text-[32px] font-bold leading-tight text-brand-blue">
                        Inicia sesión en tu cuenta
                    </h1>
                    <p className="text-base font-normal text-slate-500">
                        ¡Bienvenido de nuevo! Por favor, introduce tus datos.
                    </p>
                </div>

                {/* Form */}
                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <Input
                        id="email"
                        type="email"
                        label="Email"
                        placeholder="nombre@empresa.com"
                        icon="mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    {/* Password Field */}
                    <Input
                        id="password"
                        type="password"
                        label="Contraseña"
                        placeholder="••••••••"
                        icon="visibility_off"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {/* Actions Row */}
                    <div className="flex items-center justify-between">
                        <label className="group flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-brand-teal transition-all focus:ring-brand-teal/20"
                            />
                            <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-800">
                                Recordar por 30 días
                            </span>
                        </label>
                        <a
                            href="#"
                            className="text-sm font-semibold text-brand-teal transition-colors hover:text-[#3aa9b8]"
                        >
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>

                    {/* Sign In Button */}
                    <Button variant="brand" size="xl" className="w-full mt-2" type="submit">
                        Iniciar Sesión
                    </Button>

                    {/* Footer Link */}
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-600">
                            ¿No tienes una cuenta?{' '}
                            <a
                                href="#"
                                className="font-bold text-brand-teal transition-all hover:text-[#3aa9b8] hover:underline"
                            >
                                Regístrate
                            </a>
                        </p>
                    </div>
                </form>
            </div>

            {/* Simple footer for support links inside right panel */}
            <div className="mt-12 flex justify-center gap-6 text-xs text-slate-400">
                <a href="#" className="hover:text-slate-600">
                    Política de Privacidad
                </a>
                <a href="#" className="hover:text-slate-600">
                    Términos de Servicio
                </a>
                <a href="#" className="hover:text-slate-600">
                    Centro de Ayuda
                </a>
            </div>
        </LoginLayout>
    );
}
