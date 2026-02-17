import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { LoginLayout } from '../../../core/layout/LoginLayout';

/**
 * Página principal de Inicio de Sesión.
 * 
 * Maneja:
 * - Estado del formulario (email, password).
 * - Llamada al servicio de autenticación vía context.
 * - Redirección al Dashboard tras éxito.
 * - Manejo de errores visuales.
 */
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login({ email, password });
            navigate('/'); // Redirect to dashboard
        } catch (err) {
            console.error('Login failed:', err);
            if (err instanceof AxiosError && err.response?.status === 401) {
                setError('Credenciales inválidas. Por favor, intente de nuevo.');
            } else {
                setError('Ocurrió un error al iniciar sesión. Intente más tarde.');
            }
        } finally {
            setLoading(false);
        }
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
                <span className="text-lg font-bold text-brand-blue">Mesa de Ayuda</span>
            </div>

            {/* Form */}
            <div className="mx-auto w-full max-w-[440px]">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="mb-3 text-[36px] font-extrabold leading-tight text-brand-blue">
                        Inicia sesión en tu cuenta
                    </h1>
                    <p className="text-lg font-medium text-slate-600">
                        ¡Bienvenido de nuevo! Por favor, introduce tus datos.
                    </p>
                </div>

                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                            {error}
                        </div>
                    )}
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
                        type={showPassword ? 'text' : 'password'}
                        label="Contraseña"
                        placeholder="••••••••"
                        icon={showPassword ? 'visibility' : 'visibility_off'}
                        onIconClick={() => setShowPassword(!showPassword)}
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
                            <span className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-slate-900">
                                Recordar por 30 días
                            </span>
                        </label>
                        <a
                            href="#"
                            className="text-sm font-bold text-brand-teal transition-colors hover:text-[#3aa9b8]"
                        >
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>

                    {/* Sign In Button - Degradado azul/turquesa de marca */}
                    <Button
                        variant="brand"
                        size="xl"
                        className="w-full mt-2 bg-gradient-to-r from-brand-blue via-[#2563a8] to-brand-teal hover:from-[#1a3a6e] hover:via-brand-blue hover:to-[#3aa9b8] shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-lg"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                    </Button>

                </form>
            </div>

            {/* Simple footer for support links inside right panel */}
            <div className="mt-12 flex justify-center gap-6 text-sm text-slate-600 font-medium">
                <a href="#" className="hover:text-brand-blue transition-colors">
                    Política de Privacidad
                </a>
                <a href="#" className="hover:text-brand-blue transition-colors">
                    Términos de Servicio
                </a>
                <a href="/manual/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition-colors">
                    Manual de Usuario
                </a>
            </div>
        </LoginLayout>
    );
}
