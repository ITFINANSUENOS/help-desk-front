import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { viaticoService, type Viatico, type ViaticoResumen } from '../services/viatico.service';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { Icon } from '../../../shared/components/Icon';
import { FilterBar } from '../../../shared/components/FilterBar';

const ESTADOS_VIATICO: Record<string, { label: string; class: string }> = {
    borrador: { label: 'Borrador', class: 'bg-gray-100 text-gray-600' },
    en_visto_bueno: { label: 'En Visto Bueno', class: 'bg-yellow-50 text-yellow-700' },
    aprobado_visto_bueno: { label: 'Visto Bueno', class: 'bg-lime-50 text-lime-700' },
    en_aprobacion_cac: { label: 'En Aprobación CAC', class: 'bg-amber-50 text-amber-700' },
    aprobado: { label: 'Aprobado', class: 'bg-blue-50 text-blue-700' },
    en_registro_contable: { label: 'En Registro Contable', class: 'bg-indigo-50 text-indigo-700' },
    listo_desembolso: { label: 'Listo Desembolso', class: 'bg-cyan-50 text-cyan-700' },
    desembolsado: { label: 'Desembolsado', class: 'bg-teal-50 text-teal-700' },
    en_legalizacion: { label: 'En Legalización', class: 'bg-purple-50 text-purple-700' },
    en_aprobacion_legalizacion: { label: 'En Aprob. Legalización', class: 'bg-pink-50 text-pink-700' },
    legalizacion_aprobada: { label: 'Legalización Aprobada', class: 'bg-rose-50 text-rose-700' },
    en_aprobacion_cac_legalizacion: { label: 'En Aprob. CAC', class: 'bg-orange-50 text-orange-700' },
    legalizacion_cac_aprobada: { label: 'Legalización CAC', class: 'bg-green-50 text-green-700' },
    en_contabilizacion_legalizacion: { label: 'Contabilización', class: 'bg-slate-50 text-slate-700' },
    rechazado: { label: 'Rechazado', class: 'bg-red-50 text-red-700' },
    cerrado: { label: 'Cerrado', class: 'bg-emerald-50 text-emerald-700' },
};

export default function ViaticosPage() {
    const navigate = useNavigate();
    const { setTitle } = useLayout();
    const [viaticos, setViaticos] = useState<Viatico[]>([]);
    const [resumen, setResumen] = useState<ViaticoResumen | null>(null);
    const [loading, setLoading] = useState(true);
    const [filtroCedula, setFiltroCedula] = useState('');

    useEffect(() => {
        setTitle('Mis Viáticos');
        cargarDatos();
    }, [setTitle]);

    useEffect(() => {
        const timer = setTimeout(() => {
            cargarDatos(filtroCedula || undefined);
        }, filtroCedula ? 300 : 0);
        return () => clearTimeout(timer);
    }, [filtroCedula]);

    const cargarDatos = async (cedula?: string) => {
        try {
            setLoading(true);
            const [viaticosData, resumenData] = await Promise.all([
                viaticoService.getAll({ cedula_solicitante: cedula || undefined }),
                viaticoService.getResumen(),
            ]);
            setViaticos(viaticosData);
            setResumen(resumenData);
        } catch (error) {
            console.error('Error cargando viáticos:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-CO');
    };

    const getBadgeClass = (estado: string) => {
        return ESTADOS_VIATICO[estado]?.class || 'bg-gray-100 text-gray-600';
    };

    const getEstadoLabel = (estado: string) => {
        return ESTADOS_VIATICO[estado]?.label || estado.replace(/_/g, ' ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon name="autorenew" className="animate-spin text-4xl text-brand-teal" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {resumen && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-brand-blue/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                                <Icon name="pending" className="text-brand-orange" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Pendientes de Aprobación</div>
                                <div className="text-2xl font-bold text-gray-800">{resumen.pendientesAprobacion}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-brand-blue/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                                <Icon name="fact_check" className="text-brand-teal" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Pendientes de Legalizar</div>
                                <div className="text-2xl font-bold text-gray-800">{resumen.pendientesLegalizacion}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-brand-blue/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <Icon name="assignment" className="text-purple-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Mis Pendientes Legalizar</div>
                                <div className="text-2xl font-bold text-gray-800">{resumen.misPendientesLegalizacion}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-brand-blue/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                                <Icon name="payments" className="text-brand-teal" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Desembolsado este Mes</div>
                                <div className="text-xl font-bold text-gray-800">{formatCurrency(resumen.montoDesembolsadoMes)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Solicitudes de Viáticos</h2>
                <button
                    onClick={() => navigate('/viaticos/nuevo')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-blue via-[#2563a8] to-brand-teal hover:from-[#1a3a6e] hover:via-brand-blue hover:to-[#3aa9b8] text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
                >
                    <Icon name="add" />
                    Nueva Solicitud
                </button>
            </div>

            <FilterBar
                filters={[
                    {
                        type: 'search',
                        name: 'cedula',
                        placeholder: 'Buscar por cédula...',
                        value: filtroCedula,
                        onChange: (value) => setFiltroCedula(value as string),
                    },
                ]}
            />

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {viaticos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon name="flight_takeoff" className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay solicitudes de viáticos</h3>
                        <p className="text-gray-500 mb-6 text-center">Crea tu primera solicitud para comenzar</p>
                        <button
                            onClick={() => navigate('/viaticos/nuevo')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-brand-accent text-white rounded-lg font-medium transition-colors"
                        >
                            <Icon name="add" />
                            Nueva Solicitud
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fechas</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {viaticos.map((viatico) => (
                                    <tr key={viatico.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/viaticos/${viatico.id}`)}>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm font-medium text-brand-blue">{viatico.codigo}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="capitalize text-sm text-gray-700">{viatico.tipo}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {formatDate(viatico.fechaSalida)} - {formatDate(viatico.fechaRegreso)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-semibold text-gray-800">
                                                {formatCurrency(viatico.montoSolicitado)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getBadgeClass(viatico.estado)}`}>
                                                {getEstadoLabel(viatico.estado)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => navigate(`/viaticos/${viatico.id}`)}
                                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition-colors"
                                                title="Ver detalle"
                                            >
                                                <Icon name="visibility" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
