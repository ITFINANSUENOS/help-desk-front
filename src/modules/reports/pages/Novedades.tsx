import { IconBug, IconAlertTriangle } from '@tabler/icons-react';
import { useNovedades } from '../hooks/useDashboard';
import { PieNovedades } from '../components/charts/PieNovedades';
import { ClasificacionDot } from '../components/ui/ClasificacionDot';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatPct, formatNumero } from '../utils/formatters';
import { getClasificacionNovedades, getTailwindClasificacion, COLORES_SISTEMA } from '../utils/colores';
import type { UsuarioNovedad, TipoNovedad } from '../types/dashboard.types';

// ─── Tabla pequeña de distribución de tipos ───────────────────────────────────
function TablaTipos({ data }: { data: TipoNovedad[] }) {
    return (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <th className="py-2 px-3 text-left">Tipo</th>
                        <th className="py-2 px-3 text-right">Cantidad</th>
                        <th className="py-2 px-3 text-right">%</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((item) => (
                        <tr key={item.tipo_novedad} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-2 px-3 text-gray-700 font-medium">{item.tipo_novedad}</td>
                            <td className="py-2 px-3 text-right text-gray-600">{formatNumero(item.cantidad)}</td>
                            <td className="py-2 px-3 text-right">
                                <span className="font-semibold text-gray-800">{formatPct(item.pct_total)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Celda de % Tickets con color según clasificación ─────────────────────────
function PctTicketsCell({ pct }: { pct: number }) {
    const clasificacion = getClasificacionNovedades(pct);
    const colores = COLORES_SISTEMA[clasificacion];

    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
            style={{ backgroundColor: colores.bg, color: colores.text }}
        >
            {formatPct(pct)}
        </span>
    );
}

// ─── Tabla principal de usuarios ──────────────────────────────────────────────
function TablaUsuarios({ data }: { data: UsuarioNovedad[] }) {
    const top15 = data.slice(0, 15);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#2B378A] text-white text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Regional</th>
                        <th className="py-3 px-4 text-right">Total Nov.</th>
                        <th className="py-3 px-4 text-right">Tickets Afect.</th>
                        <th className="py-3 px-4 text-center">% Tickets</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {top15.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-10 text-center text-gray-500 text-sm">
                                No hay datos de novedades disponibles.
                            </td>
                        </tr>
                    ) : (
                        top15.map((row, idx) => (
                            <tr
                                key={`${row.usuario_nombre}-${idx}`}
                                className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                            >
                                <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                                    {row.usuario_nombre}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">{row.regional}</td>
                                <td className="py-3 px-4 text-sm text-right font-medium text-gray-700">
                                    {formatNumero(row.total_novedades)}
                                </td>
                                <td className="py-3 px-4 text-sm text-right text-gray-700">
                                    {formatNumero(row.tickets_afectados)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <PctTicketsCell pct={row.pct_tickets_con_novedad} />
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex justify-center">
                                        <ClasificacionDot clasificacion={row.clasificacion} />
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────
/**
 * Página de Análisis de Novedades del dashboard.
 *
 * Muestra:
 * 1. Distribución por tipo de novedad (Pie chart + tabla pequeña)
 * 2. Top 15 usuarios con más novedades (tabla con colores por criticidad)
 * 3. Nota informativa al pie
 *
 * Hook: useNovedades()
 */
export default function Novedades() {
    const { data, isLoading, isError, refetch } = useNovedades();

    if (isError) {
        return (
            <div className="p-8">
                <EmptyState
                    icon="report_problem"
                    title="Error al cargar novedades"
                    description="No se pudieron cargar los datos de novedades. Intenta nuevamente."
                    action={{ label: 'Reintentar', onClick: () => refetch() }}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg text-[#D92323]">
                    <IconBug size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Análisis de Novedades</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Distribución de errores e incidencias reportadas por los usuarios.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-6">
                    <LoadingSkeleton rows={4} />
                    <LoadingSkeleton rows={6} />
                </div>
            ) : (
                <>
                    {/* ── Row 1: 2 columnas ──────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

                        {/* Columna izquierda (45%) — Distribución por tipo */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-1">
                                Distribución por Tipo
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Proporción de cada tipo de novedad sobre el total registrado.
                            </p>

                            {data?.distribucion_tipos && data.distribucion_tipos.length > 0 ? (
                                <>
                                    <PieNovedades data={data.distribucion_tipos} />
                                    <TablaTipos data={data.distribucion_tipos} />
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                                    Sin datos de distribución.
                                </div>
                            )}
                        </div>

                        {/* Columna derecha (55%) — Usuarios con más novedades */}
                        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 pt-6 pb-4">
                                <h3 className="text-base font-semibold text-gray-800">
                                    Usuarios con más Novedades
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Top 15 usuarios con mayor cantidad de novedades registradas.
                                </p>
                            </div>

                            {data?.usuarios_con_mas_novedades && data.usuarios_con_mas_novedades.length > 0 ? (
                                <TablaUsuarios data={data.usuarios_con_mas_novedades} />
                            ) : (
                                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                                    Sin usuarios con novedades registradas.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Leyenda de clasificación ───────────────────────────── */}
                    <div className="mb-4 flex items-center gap-6 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                            Verde: &lt;15% de tickets con novedad
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                            Amarillo: 15%–29%
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                            Rojo: ≥30%
                        </span>
                    </div>

                    {/* ── Nota informativa al pie ───────────────────────────── */}
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800">
                        <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
                        <p>
                            Una novedad puede ser <strong>Error de Proceso</strong> o{' '}
                            <strong>Error Informativo</strong>. Los usuarios con{' '}
                            <strong>≥30% de tickets con novedades</strong> requieren atención
                            prioritaria y posiblemente capacitación o acompañamiento.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
