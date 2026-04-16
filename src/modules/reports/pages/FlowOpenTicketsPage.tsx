import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { Icon } from '../../../shared/components/Icon';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { StatsCard } from '../../../modules/dashboard/components/StatsCard';
import { PageLoader } from '../../../shared/components/PageLoader';
import { FiltroFecha, useDateFilter } from '../components/ui/FiltroFecha';
import { ReportHeader } from '../components/ui/ReportHeader';
import { reportService } from '../services/report.service';
import { workflowService } from '../../workflows/services/workflow.service';
import type { Workflow } from '../../workflows/interfaces/Workflow';

interface Regional {
    reg_id: number;
    reg_nom: string;
}

export default function FlowOpenTicketsPage() {
    const { setTitle } = useLayout();
    const { dateRange, setDateRange } = useDateFilter();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [regionales, setRegionales] = useState<Regional[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
    const [isLoadingWorkflows, setLoadingWorkflows] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

    // Filtros
    const [estado, setEstado] = useState<string>('Abierto');
    const [regionalId, setRegionalId] = useState<number | undefined>(undefined);

    const estadoOptions = [
        { value: 'Abierto', label: 'Abierto' },
        { value: 'Cerrado', label: 'Cerrado' },
        { value: 'Pausado', label: 'Pausado' },
    ];

    const regionalesOptions = regionales.map(r => ({
        value: r.reg_id as number,
        label: r.reg_nom
    }));

    console.log('Regionales loaded:', regionales, 'Options:', regionalesOptions);

    useEffect(() => {
        setTitle('Tickets por Flujo');
    }, [setTitle]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [workflowsResult, regionalesResult] = await Promise.all([
                    workflowService.getWorkflows({ estado: 1, limit: 100 }),
                    reportService.getRegionales().catch(() => [])
                ]);
                setWorkflows(workflowsResult.data || []);
                setRegionales(regionalesResult || []);
            } catch (error) {
                console.error('Error loading data', error);
                setWorkflows([]);
                setRegionales([]);
            } finally {
                setLoadingWorkflows(false);
            }
        };
        loadData();
    }, []);

    const handleWorkflowChange = (value: string | number | undefined) => {
        if (value) {
            const flujoId = Number(value);
            setSelectedWorkflow(String(flujoId));
        } else {
            setSelectedWorkflow('');
        }
    };

    const { data: flowData, isLoading } = useQuery({
        queryKey: ['flowOpenTickets', selectedWorkflow, dateRange.dateFrom, dateRange.dateTo, estado, regionalId],
        queryFn: () => reportService.getFlowOpenTickets(
            Number(selectedWorkflow),
            dateRange.dateFrom || undefined,
            dateRange.dateTo || undefined,
            estado,
            regionalId
        ),
        enabled: !!selectedWorkflow,
    });

    const handleApplyFilters = () => {
        // React Query will refetch automatically when dependencies change
    };

    const handleClearFilters = () => {
        setDateRange({ dateFrom: undefined, dateTo: undefined });
        setEstado('Abierto');
        setRegionalId(undefined);
    };

    const handleExport = async () => {
        if (!selectedWorkflow) return;
        setExporting(true);
        try {
            await reportService.exportFlowOpenTickets(Number(selectedWorkflow));
        } catch (error) {
            console.error('Error exporting', error);
        } finally {
            setExporting(false);
        }
    };

    const toggleStep = (pasoId: number) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(pasoId)) {
            newExpanded.delete(pasoId);
        } else {
            newExpanded.add(pasoId);
        }
        setExpandedSteps(newExpanded);
    };

    const workflowOptions = workflows.map(w => ({
        value: w.id,
        label: w.nombre || `Flujo #${w.id}`
    }));

    const getDaysBadgeClass = (dias: number) => {
        if (dias > 7) return 'bg-red-100 text-red-700';
        if (dias > 3) return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    };

    const getCountBadgeClass = (count: number) => {
        if (count > 50) return 'bg-red-100 text-red-700';
        if (count > 20) return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    };

    if (isLoadingWorkflows) {
        return <PageLoader />;
    }

    return (
        <div className="flex min-h-full flex-col bg-gray-50/50">
            <ReportHeader
                title="Tickets Abiertos por Flujo"
                subtitle="Visualiza y exporta los tickets abiertos de un flujo específico."
                icon={<Icon name="account_tree" className="text-2xl" />}
                actions={selectedWorkflow ? (
                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                        variant="brand"
                        size="lg"
                        className="gap-2"
                    >
                        {exporting ? (
                            <>
                                <Icon name="sync" className="h-5 w-5 animate-spin" />
                                <span>Exportando...</span>
                            </>
                        ) : (
                            <>
                                <Icon name="download" className="h-5 w-5" />
                                <span>Exportar Excel</span>
                            </>
                        )}
                    </Button>
                ) : undefined}
            >
                <Select
                    value={selectedWorkflow}
                    onChange={handleWorkflowChange}
                    options={workflowOptions}
                    placeholder="-- Seleccione un flujo --"
                    label="Flujo de Trabajo"
                    required
                />
                <Select
                    value={estado}
                    onChange={(val) => setEstado(String(val || 'Abierto'))}
                    options={estadoOptions}
                    label="Estado"
                />
                <Select
                    value={regionalId}
                    onChange={(val) => setRegionalId(val as number | undefined)}
                    options={regionalesOptions}
                    label="Regional"
                    placeholder="Todas"
                />
                <FiltroFecha value={dateRange} onChange={setDateRange} />
                <Button
                    onClick={handleApplyFilters}
                    disabled={isLoading || !selectedWorkflow}
                    variant="default"
                    size="lg"
                >
                    <Icon name="filter_list" className="h-5 w-5 mr-1" />
                    Filtrar
                </Button>
                {(dateRange.dateFrom || dateRange.dateTo) && (
                    <Button
                        onClick={handleClearFilters}
                        variant="outline"
                        size="lg"
                    >
                        <Icon name="clear" className="h-5 w-5 mr-1" />
                        Limpiar
                    </Button>
                )}
            </ReportHeader>

            {/* Filtros activos */}
            {flowData?.filtros && (flowData.filtros.fechaInicio || flowData.filtros.fechaFin || flowData.filtros.estado || flowData.filtros.regionalId) && (
                <div className="px-6 pt-4 lg:px-8">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">Filtros activos:</span>
                        {flowData.filtros.estado && flowData.filtros.estado !== 'Abierto' && (
                            <span className="px-2 py-1 bg-brand-teal/10 text-brand-teal rounded text-xs font-medium">
                                Estado: {flowData.filtros.estado}
                            </span>
                        )}
                        {flowData.filtros.regionalId && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                Regional: {regionalesOptions.find(r => r.value === flowData.filtros.regionalId)?.label || flowData.filtros.regionalId}
                            </span>
                        )}
                        {flowData.filtros.fechaInicio && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                Desde: {new Date(flowData.filtros.fechaInicio).toLocaleDateString('es-CO')}
                            </span>
                        )}
                        {flowData.filtros.fechaFin && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                Hasta: {new Date(flowData.filtros.fechaFin).toLocaleDateString('es-CO')}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex flex-col gap-6 px-6 pt-4 pb-16 lg:px-8">
                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <PageLoader />
                    </div>
                )}

                {/* Datos del Flujo */}
                {flowData && !isLoading && (
                    <div className="space-y-6">
                        {/* Stats Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900">{flowData.flujo.flujo_nom}</h3>
                                    <p className="text-sm text-gray-500 mt-1">Subcategoría: {flowData.flujo.cats_nom}</p>
                                </div>
                            </div>
                            <StatsCard
                                title="Total Tickets Abiertos"
                                value={flowData.total_tickets}
                                icon="pending_actions"
                                iconColor="text-brand-teal"
                                iconBgColor="bg-teal-50"
                            />
                        </div>

                        {/* Lista de Pasos */}
                        <div className="space-y-4">
                            {flowData.pasos.map((paso) => (
                                <div 
                                    key={paso.paso_id} 
                                    className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                                >
                                    {/* Header del paso */}
                                    <div 
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => toggleStep(paso.paso_id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon 
                                                name={expandedSteps.has(paso.paso_id) ? 'expand_more' : 'chevron_right'} 
                                                className="text-gray-400 text-xl"
                                            />
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{paso.paso_nombre}</h4>
                                                <p className="text-xs text-gray-500">Orden: {paso.paso_orden}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCountBadgeClass(paso.tickets_count)}`}>
                                            {paso.tickets_count} {flowData.filtros.estado.toLowerCase() === 'abierto' ? 'abiertos' : flowData.filtros.estado.toLowerCase() === 'cerrado' ? 'cerrados' : 'pausados'}
                                        </span>
                                    </div>

                                    {/* Detalle de tickets */}
                                    {expandedSteps.has(paso.paso_id) && paso.tickets.length > 0 && (
                                        <div className="border-t border-gray-200">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Título</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Días Abierto</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {paso.tickets.map((ticket) => (
                                                            <tr key={ticket.tick_id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3">
                                                                    <a 
                                                                        href={`/tickets/${ticket.tick_id}`}
                                                                        className="text-brand-teal hover:underline font-medium"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        #{ticket.tick_id}
                                                                    </a>
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-700 max-w-md truncate">
                                                                    {ticket.tick_titulo}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-500 text-sm">
                                                                    {new Date(ticket.fech_crea).toLocaleDateString('es-CO', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDaysBadgeClass(ticket.dias_abierto)}`}>
                                                                        {ticket.dias_abierto} días
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sin datos */}
                {!flowData && !isLoading && selectedWorkflow && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Icon name="inbox" className="h-12 w-12 text-gray-300 mb-4" />
                        <p>No hay tickets abiertos para este flujo.</p>
                    </div>
                )}

                {/* Estado inicial - sin selección */}
                {!selectedWorkflow && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Icon name="account_tree" className="h-12 w-12 text-gray-300 mb-4" />
                        <p>Selecciona un flujo para ver los tickets abiertos.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
