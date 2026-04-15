import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { Icon } from '../../../shared/components/Icon';
import { reportService } from '../services/report.service';
import type { PasosEstadoNullItem } from '../services/report.service';

export default function ReportsPage() {
    const { can } = usePermissions();
    const { setTitle } = useLayout();
    const navigate = useNavigate();
    const [exportingFlujos, setExportingFlujos] = useState(false);
    const [exportingComments, setExportingComments] = useState(false);
    const [exportingTickets, setExportingTickets] = useState(false);
    const [exportingPerformance, setExportingPerformance] = useState(false);
    const [exportingDashboard, setExportingDashboard] = useState(false);
    const [exportingTickets, setExportingTickets] = useState(false);

    // Pasos con estado null (Admin only)
    const [showPasosNullModal, setShowPasosNullModal] = useState(false);
    const [pasosNullData, setPasosNullData] = useState<PasosEstadoNullItem[]>([]);
    const [pasosNullTotal, setPasosNullTotal] = useState(0);
    const [pasosNullPage, setPasosNullPage] = useState(1);
    const [pasosNullLoading, setPasosNullLoading] = useState(false);

    // Set page title
    useEffect(() => {
        setTitle('Reportes');
    }, [setTitle]);

    const handleExportPerformance = async () => {
        try {
            setExportingPerformance(true);
            await reportService.exportPerformance();
        } catch (error) {
            console.error('Error exporting performance report', error);
        } finally {
            setExportingPerformance(false);
        }
    };

    const handleExportDashboard = async () => {
        try {
            setExportingDashboard(true);
            await reportService.exportDashboard();
        } catch (error) {
            console.error('Error exporting dashboard report', error);
        } finally {
            setExportingDashboard(false);
        }
    };

    const handleExportFlujosReport = async () => {
        try {
            setExportingFlujos(true);
            await reportService.exportFlowUsage();
        } catch (error) {
            console.error('Error exporting flujos report', error);
        } finally {
            setExportingFlujos(false);
        }
    };

    const handleExportComments = async () => {
        try {
            setExportingComments(true);
            await reportService.exportComments();
        } catch (error) {
            console.error('Error exporting comments report', error);
        } finally {
            setExportingComments(false);
        }
    };

    const handleExportTicketsReport = async () => {
        try {
            setExportingTickets(true);
            await reportService.exportTicketReport();
        } catch (error) {
            console.error('Error exporting tickets report', error);
        } finally {
            setExportingTickets(false);
        }
    };

    const handleOpenPasosNull = async () => {
        setShowPasosNullModal(true);
        setPasosNullLoading(true);
        try {
            const result = await reportService.getPasosConEstadoNull();
            setPasosNullData(result.data);
            setPasosNullTotal(result.total);
        } catch (error) {
            console.error('Error loading pasos null report', error);
        } finally {
            setPasosNullLoading(false);
        }
    };

    const handlePasosNullPageChange = async (newPage: number) => {
        setPasosNullPage(newPage);
        setPasosNullLoading(true);
        try {
            const result = await reportService.getPasosConEstadoNull(undefined, undefined, 100, newPage);
            setPasosNullData(result.data);
            setPasosNullTotal(result.total);
        } catch (error) {
            console.error('Error loading pasos null page', error);
        } finally {
            setPasosNullLoading(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Centro de descarga de informes y análisis del sistema.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Performance Report Card */}
                {can('read', 'Report') && (
                    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand-blue/30 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Desempeño</p>
                                <p className="mt-2 text-xl font-bold text-gray-800">Métricas y Tiempos</p>
                                <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                                    Genera un archivo Excel detallado con los tiempos de resolución y demoras por usuario o departamento.
                                </p>
                            </div>
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand-blue">
                                <Icon name="insert_chart" className="text-2xl" style={{ fontVariationSettings: '"FILL" 1' }} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleExportPerformance}
                                disabled={exportingPerformance}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-teal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-50"
                            >
                                {exportingPerformance ? (
                                    <>
                                        <Icon name="sync" className="h-5 w-5 animate-spin" />
                                        <span>Generando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="download" className="h-5 w-5" />
                                        <span>Descargar Excel</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Dashboard Completo Card */}
                {can('read', 'Report') && (
                    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand-blue/30 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Dashboard Analytics</p>
                                <p className="mt-2 text-xl font-bold text-gray-800">Reporte Completo</p>
                                <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                                    Exporta todas las métricas del dashboard en un solo archivo Excel con múltiples hojas: KPIs, Ranking, Regionales, Mapa de Calor, Categorías y más.
                                </p>
                            </div>
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                                <Icon name="grid_view" className="text-2xl" style={{ fontVariationSettings: '"FILL" 1' }} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleExportDashboard}
                                disabled={exportingDashboard}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2B378A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#23468C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B378A] disabled:opacity-50"
                            >
                                {exportingDashboard ? (
                                    <>
                                        <Icon name="sync" className="h-5 w-5 animate-spin" />
                                        <span>Generando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="download" className="h-5 w-5" />
                                        <span>Descargar Excel</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Flujos Usage Report Card */}
                {can('read', 'Workflow') && (
                    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand-blue/30 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Flujos de Trabajo</p>
                                <p className="mt-2 text-xl font-bold text-gray-800">Uso de Flujos</p>
                                <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                                    Exporta a Excel los flujos que están en uso y los que no tienen tickets asociados.
                                </p>
                            </div>
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                <Icon name="account_tree" className="text-2xl" style={{ fontVariationSettings: '"FILL" 1' }} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleExportFlujosReport}
                                disabled={exportingFlujos}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-teal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-50"
                            >
                                {exportingFlujos ? (
                                    <>
                                        <Icon name="sync" className="h-5 w-5 animate-spin" />
                                        <span>Generando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="download" className="h-5 w-5" />
                                        <span>Descargar Excel</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Comments Report Card */}
                {can('read', 'Report') && (
                    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand-blue/30 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Comentarios</p>
                                <p className="mt-2 text-xl font-bold text-gray-800">Historial de Comentarios</p>
                                <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                                    Exporta a Excel todos los comentarios registrados en los tickets del sistema.
                                </p>
                            </div>
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                                <Icon name="comment" className="text-2xl" style={{ fontVariationSettings: '"FILL" 1' }} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleExportComments}
                                disabled={exportingComments}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-teal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-50"
                            >
                                {exportingComments ? (
                                    <>
                                        <Icon name="sync" className="h-5 w-5 animate-spin" />
                                        <span>Generando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="download" className="h-5 w-5" />
                                        <span>Descargar Excel</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Tickets Report Card */}
                {can('read', 'Report') && (
                    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand-blue/30 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tickets</p>
                                <p className="mt-2 text-xl font-bold text-gray-800">Reporte General</p>
                                <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                                    Exporta a Excel todos los tickets del sistema con estado actual, paso, asignado, creador y más.
                                </p>
                            </div>
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                <Icon name="list_alt" className="text-2xl" style={{ fontVariationSettings: '"FILL" 1' }} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleExportTicketsReport}
                                disabled={exportingTickets}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-teal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-50"
                            >
                                {exportingTickets ? (
                                    <>
                                        <Icon name="sync" className="h-5 w-5 animate-spin" />
                                        <span>Generando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="download" className="h-5 w-5" />
                                        <span>Descargar Excel</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Pasos con Estado NULL - Admin Only */}
                {can('view:all', 'Report') && (
                    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand-red/30 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Admin - Diagnóstico</p>
                                <p className="mt-2 text-xl font-bold text-gray-800">Pasos con Estado NULL</p>
                                <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                                    Pasos en el historial que tienen estado_tiempo_paso NULL pero ya tienen un registro posterior. Requieren corrección.
                                </p>
                            </div>
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                <Icon name="warning" className="text-2xl" style={{ fontVariationSettings: '"FILL" 1' }} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleOpenPasosNull}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-red/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
                            >
                                <Icon name="visibility" className="h-5 w-5" />
                                <span>Ver Reporte</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Si no tiene permisos */}
            {!can('read', 'Report') && (
                <div className="rounded-md bg-blue-50 p-4 mt-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Icon name="info" className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3 flex-1 md:flex md:justify-between">
                            <p className="text-sm text-blue-700">
                                No tienes permisos para visualizar o descargar los reportes disponibles.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pasos con Estado NULL */}
            {showPasosNullModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Pasos con Estado NULL</h3>
                                <p className="text-sm text-gray-500">Registros que necesitan corrección ({pasosNullTotal} total)</p>
                            </div>
                            <button
                                onClick={() => setShowPasosNullModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Icon name="close" className="text-2xl" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-6">
                            {pasosNullLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <Icon name="sync" className="text-4xl text-gray-400 animate-spin" />
                                </div>
                            ) : pasosNullData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                    <Icon name="check_circle" className="text-5xl text-green-500 mb-4" />
                                    <p className="text-lg font-medium">No hay registros con estado NULL</p>
                                    <p className="text-sm">Todos los pasos tienen su estado de tiempo correctamente registrado.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paso #</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paso Actual</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regional</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Asignación</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siguiente Paso</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siguiente Usuario</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pasosNullData.map((item) => (
                                                <tr key={`${item.ticket_id}-${item.historial_id}`} className="hover:bg-red-50/50">
                                                    <td className="px-4 py-3 text-sm">
                                                        <button
                                                            onClick={() => navigate(`/tickets/${item.ticket_id}`)}
                                                            className="font-medium text-brand-blue hover:text-brand-blue/80 hover:underline"
                                                        >
                                                            #{item.ticket_id}
                                                        </button>
                                                        <span className="text-gray-400 ml-1">- {item.titulo_ticket?.substring(0, 40)}{item.titulo_ticket && item.titulo_ticket.length > 40 ? '...' : ''}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.numero_paso}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.paso_nombre}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.usuario_nombre}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.regional || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.fecha_asignacion ? new Date(item.fecha_asignacion).toLocaleString() : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.next_paso_nombre || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.next_usuario_nombre || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.categoria} / {item.subcategoria}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {!pasosNullLoading && pasosNullData.length > 0 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    Mostrando {((pasosNullPage - 1) * 100) + 1} - {Math.min(pasosNullPage * 100, pasosNullTotal)} de {pasosNullTotal}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePasosNullPageChange(pasosNullPage - 1)}
                                        disabled={pasosNullPage === 1}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <span className="px-3 py-1 text-sm text-gray-700">
                                        Página {pasosNullPage} de {Math.ceil(pasosNullTotal / 100)}
                                    </span>
                                    <button
                                        onClick={() => handlePasosNullPageChange(pasosNullPage + 1)}
                                        disabled={pasosNullPage >= Math.ceil(pasosNullTotal / 100)}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
