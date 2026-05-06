import { useEffect, useState } from 'react';
import { viaticoService } from '../services/viatico.service';
import { Icon } from '../../../shared/components/Icon';

interface Usuario {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    cargo?: string;
    regional?: string;
}

export default function ViaticoConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'cac' | 'analistas' | 'tesoreria'>('cac');
    const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

    const [usuarioCacId, setUsuarioCacId] = useState<number | null>(null);
    const [usuariosCac, setUsuariosCac] = useState<Usuario[]>([]);

    const [analistasSeleccionados, setAnalistasSeleccionados] = useState<number[]>([]);
    const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([]);
    const [analistasConfigurados, setAnalistasConfigurados] = useState<Usuario[]>([]);

    const [tesoreriaSeleccionados, setTesoreriaSeleccionados] = useState<number[]>([]);
    const [tesoreriaConfigurados, setTesoreriaConfigurados] = useState<Usuario[]>([]);

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    const cargarConfiguracion = async () => {
        try {
            setLoading(true);
            const [configCac, configAnalistas, configTesoreria] = await Promise.all([
                viaticoService.getConfigUsuarioCac(),
                viaticoService.getConfigAnalistasContables(),
                viaticoService.getConfigUsuariosTesoreria()
            ]);

            setUsuarioCacId(configCac.usuarioCacId);
            setUsuariosCac(configCac.usuariosCacDisponibles);

            setAnalistasSeleccionados(configAnalistas.analistasIds);
            setUsuariosDisponibles(configAnalistas.usuariosDisponibles);
            setAnalistasConfigurados(configAnalistas.analistas);

            setTesoreriaSeleccionados(configTesoreria.tesoreriaIds);
            setTesoreriaConfigurados(configTesoreria.tesoreria);
        } catch (error) {
            console.error('Error cargando configuración:', error);
            setMensaje({ tipo: 'error', texto: 'Error al cargar la configuración' });
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarCac = async () => {
        if (!usuarioCacId) {
            setMensaje({ tipo: 'error', texto: 'Debe seleccionar un usuario CAC' });
            return;
        }

        try {
            setSaving(true);
            setMensaje(null);
            const result = await viaticoService.setConfigUsuarioCac(usuarioCacId);
            setMensaje({ tipo: 'success', texto: result.mensaje });
        } catch (error) {
            console.error('Error guardando configuración:', error);
            setMensaje({ tipo: 'error', texto: 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    const handleGuardarAnalistas = async () => {
        if (analistasSeleccionados.length === 0) {
            setMensaje({ tipo: 'error', texto: 'Debe seleccionar al menos un analista contable' });
            return;
        }

        try {
            setSaving(true);
            setMensaje(null);
            const result = await viaticoService.setConfigAnalistasContables(analistasSeleccionados);
            setAnalistasConfigurados(
                usuariosDisponibles.filter(u => analistasSeleccionados.includes(u.id))
            );
            setMensaje({ tipo: 'success', texto: result.mensaje });
        } catch (error) {
            console.error('Error guardando configuración:', error);
            setMensaje({ tipo: 'error', texto: 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    const handleGuardarTesoreria = async () => {
        if (tesoreriaSeleccionados.length === 0) {
            setMensaje({ tipo: 'error', texto: 'Debe seleccionar al menos un usuario de tesorería' });
            return;
        }

        try {
            setSaving(true);
            setMensaje(null);
            const result = await viaticoService.setConfigUsuariosTesoreria(tesoreriaSeleccionados);
            setTesoreriaConfigurados(
                usuariosDisponibles.filter(u => tesoreriaSeleccionados.includes(u.id))
            );
            setMensaje({ tipo: 'success', texto: result.mensaje });
        } catch (error) {
            console.error('Error guardando configuración:', error);
            setMensaje({ tipo: 'error', texto: 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    const toggleAnalista = (usuarioId: number) => {
        setAnalistasSeleccionados(prev => 
            prev.includes(usuarioId)
                ? prev.filter(id => id !== usuarioId)
                : [...prev, usuarioId]
        );
    };

    const toggleTesoreria = (usuarioId: number) => {
        setTesoreriaSeleccionados(prev => 
            prev.includes(usuarioId)
                ? prev.filter(id => id !== usuarioId)
                : [...prev, usuarioId]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon name="autorenew" className="animate-spin text-4xl text-brand-blue" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-brand-blue to-brand-teal px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Icon name="settings" />
                        Configuración de Viáticos
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                        Configure los usuarios responsables de cada etapa de aprobación
                    </p>
                </div>

                <div className="border-b">
                    <nav className="flex">
                        <button
                            onClick={() => setActiveTab('cac')}
                            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'cac'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Icon name="supervisor_account" />
                            Usuario CAC
                        </button>
                        <button
                            onClick={() => setActiveTab('analistas')}
                            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'analistas'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Icon name="account_balance" />
                            Analistas Contables
                            {analistasConfigurados.length > 0 && (
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {analistasConfigurados.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('tesoreria')}
                            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'tesoreria'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Icon name="account_balance_wallet" />
                            Tesorería
                            {tesoreriaConfigurados.length > 0 && (
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {tesoreriaConfigurados.length}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {mensaje && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                            mensaje.tipo === 'success' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            <Icon name={mensaje.tipo === 'success' ? 'check_circle' : 'error'} />
                            {mensaje.texto}
                        </div>
                    )}

                    {activeTab === 'cac' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Usuario CAC para Aprobación
                                </label>
                                <p className="text-sm text-gray-500 mb-3">
                                    Seleccione el usuario que aprobará todos los viáticos que pasen por el proceso de CAC
                                </p>
                                
                                {usuariosCac.length === 0 ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
                                        <Icon name="warning" className="inline mr-2" />
                                        No hay usuarios con rol CAC disponibles
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {usuariosCac.map((usuario) => (
                                            <label
                                                key={usuario.id}
                                                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                    usuarioCacId === usuario.id
                                                        ? 'border-brand-blue bg-blue-50'
                                                        : 'border-gray-200 hover:border-brand-teal'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="usuarioCac"
                                                    value={usuario.id}
                                                    checked={usuarioCacId === usuario.id}
                                                    onChange={() => setUsuarioCacId(usuario.id)}
                                                    className="w-4 h-4 text-brand-blue"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-800">
                                                        {usuario.nombre} {usuario.apellido}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {usuario.email}
                                                    </div>
                                                </div>
                                                {usuarioCacId === usuario.id && (
                                                    <Icon name="check_circle" className="text-brand-blue" />
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleGuardarCac}
                                    disabled={saving || !usuarioCacId}
                                    className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-accent font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Icon name="autorenew" className="animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="save" />
                                            Guardar Configuración
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analistas' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Analistas Contables
                                </label>
                                <p className="text-sm text-gray-500 mb-3">
                                    Seleccione los usuarios que podrán aprobar el registro contable y legalización de viáticos. 
                                    Puede seleccionar múltiples usuarios.
                                </p>

                                {analistasConfigurados.length > 0 && (
                                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="text-sm font-medium text-green-700 mb-1">
                                            <Icon name="check_circle" className="inline mr-1" />
                                            Configurados ({analistasConfigurados.length})
                                        </div>
                                        <div className="text-sm text-green-600">
                                            {analistasConfigurados.map(u => `${u.nombre} ${u.apellido}`).join(', ')}
                                        </div>
                                    </div>
                                )}

                                <div className="border rounded-lg max-h-96 overflow-y-auto">
                                    {usuariosDisponibles.map((usuario) => (
                                        <label
                                            key={usuario.id}
                                            className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                                                analistasSeleccionados.includes(usuario.id)
                                                    ? 'bg-blue-50'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={analistasSeleccionados.includes(usuario.id)}
                                                onChange={() => toggleAnalista(usuario.id)}
                                                className="w-4 h-4 text-brand-blue rounded"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-800">
                                                    {usuario.nombre} {usuario.apellido}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {usuario.cargo} - {usuario.regional}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <div className="text-sm text-gray-500">
                                    {analistasSeleccionados.length} usuario(s) seleccionado(s)
                                </div>
                                <button
                                    onClick={handleGuardarAnalistas}
                                    disabled={saving || analistasSeleccionados.length === 0}
                                    className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-accent font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Icon name="autorenew" className="animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="save" />
                                            Guardar Analistas
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tesoreria' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Usuarios de Tesorería
                                </label>
                                <p className="text-sm text-gray-500 mb-3">
                                    Seleccione los usuarios que podrán realizar desembolsos de viáticos.
                                </p>

                                {tesoreriaConfigurados.length > 0 && (
                                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="text-sm font-medium text-green-700 mb-1">
                                            <Icon name="check_circle" className="inline mr-1" />
                                            Configurados ({tesoreriaConfigurados.length})
                                        </div>
                                        <div className="text-sm text-green-600">
                                            {tesoreriaConfigurados.map(u => `${u.nombre} ${u.apellido}`).join(', ')}
                                        </div>
                                    </div>
                                )}

                                <div className="border rounded-lg max-h-96 overflow-y-auto">
                                    {usuariosDisponibles.map((usuario) => (
                                        <label
                                            key={usuario.id}
                                            className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                                                tesoreriaSeleccionados.includes(usuario.id)
                                                    ? 'bg-blue-50'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={tesoreriaSeleccionados.includes(usuario.id)}
                                                onChange={() => toggleTesoreria(usuario.id)}
                                                className="w-4 h-4 text-brand-blue rounded"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-800">
                                                    {usuario.nombre} {usuario.apellido}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {usuario.cargo} - {usuario.regional}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <div className="text-sm text-gray-500">
                                    {tesoreriaSeleccionados.length} usuario(s) seleccionado(s)
                                </div>
                                <button
                                    onClick={handleGuardarTesoreria}
                                    disabled={saving || tesoreriaSeleccionados.length === 0}
                                    className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-accent font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Icon name="autorenew" className="animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="save" />
                                            Guardar Tesorería
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
