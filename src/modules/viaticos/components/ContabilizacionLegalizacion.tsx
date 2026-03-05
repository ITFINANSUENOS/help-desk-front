import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { api } from '../../../core/api/api';

interface ViaticoCompleto {
    solicitud_id: number;
    tick_id: number;
    formulario: {
        tipo_anticipo: string;
        valor_solicitado: number;
    };
    legalizacion: {
        gastos: {
            gasto_id: number;
            fecha_gasto: string;
            concepto: string;
            ciudad: string;
            valor: number;
        }[];
    };
    anticipo: {
        anticipo_aprobado: number;
        valor_desembolsado: number;
    };
    liquidacion: {
        total_gastos: number;
        saldo_empresa: number;
        saldo_empleado: number;
    };
    legalizacion_info?: {
        num_comprobante_legalizacion: string;
        fecha_contabilizacion_legal: string;
    };
}

interface ContabilizacionProps {
    tickId: number;
    onSuccess: () => void;
}

export function ContabilizacionLegalizacion({ tickId, onSuccess }: ContabilizacionProps) {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [viatico, setViatico] = useState<ViaticoCompleto | null>(null);
    const [numComprobante, setNumComprobante] = useState('');
    const [yaRegistrado, setYaRegistrado] = useState(false);

    useEffect(() => {
        fetchViatico();
    }, [tickId]);

    const fetchViatico = async () => {
        setLoadingData(true);
        try {
            const response = await api.get<ViaticoCompleto>(`/viaticos/${tickId}`);
            setViatico(response.data);
            
            // Verificar si ya hay comprobante registrado
            if (response.data.legalizacion_info?.num_comprobante_legalizacion) {
                setYaRegistrado(true);
                setNumComprobante(response.data.legalizacion_info.num_comprobante_legalizacion);
            }
        } catch (error) {
            console.error('Error fetching viatico:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleGuardar = async () => {
        if (!numComprobante.trim()) {
            alert('Por favor ingresa el número de comprobante');
            return;
        }

        setLoading(true);
        try {
            await api.patch(`/viaticos/${tickId}/contabilizacion`, {
                num_comprobante: numComprobante,
                fecha_contabilizacion: new Date().toISOString()
            });
            await fetchViatico();
            onSuccess();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="bg-white rounded-lg shadow border border-blue-200 p-6 mt-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                </div>
            </div>
        );
    }

    if (!viatico) {
        return (
            <div className="bg-white rounded-lg shadow border border-blue-200 p-6 mt-6">
                <p className="text-gray-500">No se encontró la solicitud de viático</p>
            </div>
        );
    }

    const totalGastos = viatico.liquidacion?.total_gastos || 0;
    const anticipoAprobado = viatico.anticipo?.anticipo_aprobado || 0;
    const saldoEmpresa = viatico.liquidacion?.saldo_empresa || 0;
    const saldoEmpleado = viatico.liquidacion?.saldo_empleado || 0;

    return (
        <div className="bg-white rounded-lg shadow border border-blue-200 p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Contabilización de Legalización
                    </h3>
                    <p className="text-sm text-gray-500">
                        Ingresa el número de comprobante de la legalización
                    </p>
                </div>
                {yaRegistrado ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Comprobante Registrado
                    </span>
                ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Pendiente de Contabilizar
                    </span>
                )}
            </div>

            {/* Resumen de Liquidación */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Resumen de Liquidación</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Total Gastos:</span>
                        <p className="font-medium">${totalGastos.toLocaleString('es-CO')}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Anticipo:</span>
                        <p className="font-medium">${anticipoAprobado.toLocaleString('es-CO')}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Saldo Empresa:</span>
                        <p className={`font-medium ${saldoEmpresa > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            ${saldoEmpresa.toLocaleString('es-CO')}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Saldo Empleado:</span>
                        <p className={`font-medium ${saldoEmpleado > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            ${saldoEmpleado.toLocaleString('es-CO')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Gastos */}
            <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Gastos Reportados</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left">Fecha</th>
                                <th className="px-3 py-2 text-left">Concepto</th>
                                <th className="px-3 py-2 text-left">Ciudad</th>
                                <th className="px-3 py-2 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {viatico.legalizacion?.gastos?.map((gasto) => (
                                <tr key={gasto.gasto_id}>
                                    <td className="px-3 py-2">{new Date(gasto.fecha_gasto).toLocaleDateString('es-CO')}</td>
                                    <td className="px-3 py-2">{gasto.concepto}</td>
                                    <td className="px-3 py-2">{gasto.ciudad || '-'}</td>
                                    <td className="px-3 py-2 text-right font-medium">${Number(gasto.valor).toLocaleString('es-CO')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Campo de Comprobante */}
            {yaRegistrado ? (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-green-600 text-2xl">✓</span>
                        <div>
                            <p className="font-medium text-green-800">Comprobante Registrado</p>
                            <p className="text-sm text-green-600">N°: {numComprobante}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border-t pt-4 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Comprobante *
                    </label>
                    <div className="flex gap-3">
                        <Input
                            value={numComprobante}
                            onChange={(e) => setNumComprobante(e.target.value)}
                            placeholder="Ej: LG-2026-001"
                            className="flex-1"
                        />
                        <Button
                            variant="brand"
                            onClick={handleGuardar}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar Comprobante'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
