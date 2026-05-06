import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { viaticoService, type CreateViaticoPayload, type JefeCandidato } from '../services/viatico.service';
import { Icon } from '../../../shared/components/Icon';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { Select, type Option } from '../../../shared/components/Select';

interface Concepto {
    vco_tipo: string;
    vco_descripcion: string;
    vco_cantidad: number;
    vco_valor_unit: number;
    vco_valor_total: number;
    vco_es_anticipado: boolean;
}

const TIPOS_GASTO: Option[] = [
    { value: 'transporte_aereo', label: 'Transporte Aéreo' },
    { value: 'transporte_terrestre', label: 'Transporte Terrestre' },
    { value: 'taxi', label: 'Taxi' },
    { value: 'combustible', label: 'Combustible' },
    { value: 'peaje', label: 'Peaje' },
    { value: 'alojamiento', label: 'Alojamiento' },
    { value: 'alimentacion_desayuno', label: 'Alimentación - Desayuno' },
    { value: 'alimentacion_almuerzo', label: 'Alimentación - Almuerzo' },
    { value: 'alimentacion_cena', label: 'Alimentación - Cena' },
    { value: 'gastos_representacion', label: 'Gastos de Representación' },
    { value: 'parqueadero', label: 'Parqueadero' },
    { value: 'mensajeria', label: 'Mensajería' },
    { value: 'imprevistos', label: 'Imprevistos' },
    { value: 'otros', label: 'Otros' },
];

const TIPOS_VIATICO: Option[] = [
    { value: 'anticipo', label: 'Anticipo' },
    { value: 'reembolso', label: 'Reembolso' },
    { value: 'mixto', label: 'Mixto' },
];

export default function CreateViaticoPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    
    const [formData, setFormData] = useState({
        via_tipo: 'anticipo' as 'anticipo' | 'reembolso' | 'mixto',
        via_fecha_salida: '',
        via_fecha_regreso: '',
        via_motivo: '',
        via_proyecto: '',
    });

    const [cedulaSolicitante, setCedulaSolicitante] = useState<string>('');
    const [loadingSolicitante, setLoadingSolicitante] = useState(false);
    const [solicitanteData, setSolicitanteData] = useState<{
        nombre: string;
        apellido: string;
        nombre_cargo: string;
        empresa: string;
        regional: string;
        ciudad: string;
    } | null>(null);
    const [solicitanteError, setSolicitanteError] = useState<string>('');
    const [jefeCandidatos, setJefeCandidatos] = useState<JefeCandidato[]>([]);
    const [showJefeModal, setShowJefeModal] = useState(false);
    const [selectedJefeId, setSelectedJefeId] = useState<number | null>(null);
    const [loadingCandidatos, setLoadingCandidatos] = useState(false);

    const [conceptos, setConceptos] = useState<Concepto[]>([]);
    const [archivos, setArchivos] = useState<File[]>([]);

    const handleBuscarSolicitante = async (cedula: string) => {
        if (!cedula || cedula.length < 5) return;
        
        setLoadingSolicitante(true);
        setSolicitanteError('');
        setSelectedJefeId(null);
        setJefeCandidatos([]);
        try {
            const result = await viaticoService.buscarUsuarioPorCedula(cedula);
            if (result.found && result.data) {
                setSolicitanteData(result.data);
                
                setLoadingCandidatos(true);
                try {
                    const candidatosResult = await viaticoService.getJefeCandidatos(
                        result.data.nombre_cargo,
                        result.data.regional
                    );
                    if (candidatosResult.candidatos && candidatosResult.candidatos.length > 0) {
                        setJefeCandidatos(candidatosResult.candidatos);
                        if (candidatosResult.candidatos.length === 1) {
                            setSelectedJefeId(candidatosResult.candidatos[0].id);
                        } else {
                            setShowJefeModal(true);
                        }
                    }
                } catch (e) {
                    console.error('Error buscando candidatos a jefe:', e);
                } finally {
                    setLoadingCandidatos(false);
                }
            } else {
                setSolicitanteData(null);
                setSolicitanteError('No se encontró ningún empleado con esa cédula');
            }
        } catch (error) {
            console.error('Error:', error);
            setSolicitanteError('Error al buscar empleado');
        } finally {
            setLoadingSolicitante(false);
        }
    };

    const agregarConcepto = () => {
        setConceptos([...conceptos, {
            vco_tipo: 'transporte_terrestre',
            vco_descripcion: '',
            vco_cantidad: 1,
            vco_valor_unit: 0,
            vco_valor_total: 0,
            vco_es_anticipado: true,
        }]);
    };

    const actualizarConcepto = (index: number, campo: keyof Concepto, valor: string | number | boolean) => {
        const nuevos = [...conceptos];
        nuevos[index] = { ...nuevos[index], [campo]: valor };
        if (campo === 'vco_cantidad' || campo === 'vco_valor_unit') {
            nuevos[index].vco_valor_total = nuevos[index].vco_cantidad * nuevos[index].vco_valor_unit;
        }
        setConceptos(nuevos);
    };

    const eliminarConcepto = (index: number) => {
        setConceptos(conceptos.filter((_, i) => i !== index));
    };

    const getTotal = () => {
        return conceptos.reduce((sum, c) => sum + (c.vco_cantidad * c.vco_valor_unit), 0);
    };

    const handleSubmit = async () => {
        if (!solicitanteData) {
            alert('Debe buscar y seleccionar un solicitante');
            return;
        }

        if (!selectedJefeId && jefeCandidatos.length > 0) {
            alert('Debe seleccionar un jefe aprobador');
            return;
        }

        try {
            setLoading(true);
            
            const payload: CreateViaticoPayload = {
                via_tipo: formData.via_tipo,
                via_fecha_salida: formData.via_fecha_salida,
                via_fecha_regreso: formData.via_fecha_regreso,
                via_motivo: formData.via_motivo,
                via_proyecto: formData.via_proyecto,
                cedula_solicitante: cedulaSolicitante,
                usu_jefe_id: selectedJefeId || undefined,
                conceptos: conceptos.map(c => ({
                    vco_tipo: c.vco_tipo,
                    vco_descripcion: c.vco_descripcion,
                    vco_cantidad: c.vco_cantidad,
                    vco_valor_unit: c.vco_valor_unit,
                    vco_valor_total: c.vco_cantidad * c.vco_valor_unit,
                    vco_es_anticipado: c.vco_es_anticipado,
                })),
            };
            
            const viatico = await viaticoService.create(payload);
            
            if (archivos.length > 0) {
                await viaticoService.subirArchivos(viatico.id, archivos);
            }
            
            if (formData.via_tipo === 'anticipo') {
                await viaticoService.enviarVistoBueno(viatico.id);
            }
            
            navigate('/viaticos');
        } catch (error) {
            console.error('Error creando viático:', error);
            alert('Error al crear la solicitud');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
    };

    const getStepClass = (stepNumber: number) => {
        if (stepNumber < step) return 'bg-brand-teal text-white';
        if (stepNumber === step) return 'bg-brand-blue text-white';
        return 'bg-gray-100 text-gray-400';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/viaticos')}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Nueva Solicitud de Viático</h1>
                </div>
                <div className="flex gap-2">
                    <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStepClass(1)}`}>
                        <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">1</span>
                        <span className="hidden sm:inline">Datos del Viaje</span>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStepClass(2)}`}>
                        <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">2</span>
                        <span className="hidden sm:inline">Conceptos</span>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStepClass(3)}`}>
                        <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">3</span>
                        <span className="hidden sm:inline">Revisión</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Icon name="flight_takeoff" className="text-brand-blue" />
                            <h2 className="text-lg font-semibold text-gray-800">Datos del Solicitante y Viaje</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cédula del Solicitante *</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={cedulaSolicitante}
                                        onChange={(e) => setCedulaSolicitante(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleBuscarSolicitante(cedulaSolicitante)}
                                        placeholder="Ingrese la cédula..."
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={() => handleBuscarSolicitante(cedulaSolicitante)}
                                        disabled={loadingSolicitante || cedulaSolicitante.length < 5}
                                        variant="brand"
                                    >
                                        {loadingSolicitante ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="search" />}
                                    </Button>
                                </div>
                                {solicitanteError && <p className="text-red-500 text-sm mt-1">{solicitanteError}</p>}
                            </div>
                        </div>

                        {solicitanteData && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon name="person" className="text-brand-teal" />
                                    <h3 className="font-semibold text-gray-800">Datos del Solicitante</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                    <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{solicitanteData.nombre} {solicitanteData.apellido}</span></div>
                                    <div><span className="text-gray-500">Cargo:</span> <span className="font-medium">{solicitanteData.nombre_cargo}</span></div>
                                    <div><span className="text-gray-500">Empresa:</span> <span className="font-medium">{solicitanteData.empresa}</span></div>
                                    <div><span className="text-gray-500">Regional:</span> <span className="font-medium">{solicitanteData.regional}</span></div>
                                </div>
                                {loadingCandidatos && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-brand-blue">
                                        <Icon name="autorenew" className="animate-spin" />
                                        Buscando jefe aprobador...
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Icon name="info" className="text-brand-blue" />
                                <h3 className="font-semibold text-gray-800">Detalles del Viaje</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Tipo de Viático"
                                    value={formData.via_tipo}
                                    onChange={(val) => setFormData({ ...formData, via_tipo: (val as 'anticipo' | 'reembolso' | 'mixto') || 'anticipo' })}
                                    options={TIPOS_VIATICO}
                                />

                                <Input
                                    label="Fecha de Salida"
                                    type="date"
                                    value={formData.via_fecha_salida}
                                    onChange={(e) => setFormData({ ...formData, via_fecha_salida: e.target.value })}
                                />

                                <Input
                                    label="Fecha de Regreso"
                                    type="date"
                                    value={formData.via_fecha_regreso}
                                    onChange={(e) => setFormData({ ...formData, via_fecha_regreso: e.target.value })}
                                />

                                <div className="md:col-span-2">
                                    <Input
                                        label="Motivo del Viaje"
                                        value={formData.via_motivo}
                                        onChange={(e) => setFormData({ ...formData, via_motivo: e.target.value })}
                                        placeholder="Describa el motivo del viaje..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Input
                                        label="Proyecto (opcional)"
                                        value={formData.via_proyecto}
                                        onChange={(e) => setFormData({ ...formData, via_proyecto: e.target.value })}
                                        placeholder="Código o nombre del proyecto..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Icon name="receipt_long" className="text-brand-blue" />
                                <h2 className="text-lg font-semibold text-gray-800">Conceptos del Viático</h2>
                            </div>
                            <Button onClick={agregarConcepto} variant="outline" size="sm">
                                <Icon name="add" /> Agregar Concepto
                            </Button>
                        </div>

                        {conceptos.length === 0 ? (
                            <div className="text-center py-8">
                                <Icon name="receipt_long" className="text-4xl text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">No hay conceptos agregados</p>
                                <Button onClick={agregarConcepto} variant="brand" className="mt-4">
                                    <Icon name="add" /> Agregar Primer Concepto
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {conceptos.map((concepto, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-medium text-gray-800">Concepto #{index + 1}</h4>
                                            <button
                                                onClick={() => eliminarConcepto(index)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <Icon name="delete" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
                                            <Select
                                                label="Tipo"
                                                value={concepto.vco_tipo}
                                                onChange={(val) => actualizarConcepto(index, 'vco_tipo', val as string)}
                                                options={TIPOS_GASTO}
                                            />
                                            <Input
                                                label="Descripción"
                                                value={concepto.vco_descripcion}
                                                onChange={(e) => actualizarConcepto(index, 'vco_descripcion', e.target.value)}
                                                placeholder="Descripción adicional..."
                                            />
                                            <Input
                                                label="Cantidad"
                                                type="number"
                                                value={concepto.vco_cantidad}
                                                onChange={(e) => actualizarConcepto(index, 'vco_cantidad', parseInt(e.target.value) || 0)}
                                            />
                                            <Input
                                                label="Valor Unitario"
                                                type="number"
                                                value={concepto.vco_valor_unit}
                                                onChange={(e) => actualizarConcepto(index, 'vco_valor_unit', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="mt-3 flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`anticipado-${index}`}
                                                    checked={concepto.vco_es_anticipado}
                                                    onChange={(e) => actualizarConcepto(index, 'vco_es_anticipado', e.target.checked)}
                                                    className="w-4 h-4 text-brand-blue rounded"
                                                />
                                                <label htmlFor={`anticipado-${index}`} className="text-sm text-gray-700">
                                                    Solicitar anticipo
                                                </label>
                                            </div>
                                            <div className="ml-auto text-lg font-semibold text-brand-blue">
                                                Total: {formatCurrency(concepto.vco_cantidad * concepto.vco_valor_unit)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {conceptos.length > 0 && (
                            <div className="bg-brand-blue/10 rounded-lg p-4 border border-brand-blue/20">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-800">Total Solicitado:</span>
                                    <span className="text-2xl font-bold text-brand-blue">{formatCurrency(getTotal())}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Icon name="fact_check" className="text-brand-blue" />
                            <h2 className="text-lg font-semibold text-gray-800">Revisión de la Solicitud</h2>
                        </div>
                        
                        {solicitanteData && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Icon name="person" className="text-brand-teal" />
                                    Solicitante
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{solicitanteData.nombre} {solicitanteData.apellido}</span></div>
                                    <div><span className="text-gray-500">Cédula:</span> <span className="font-medium">{cedulaSolicitante}</span></div>
                                    <div><span className="text-gray-500">Cargo:</span> <span className="font-medium">{solicitanteData.nombre_cargo}</span></div>
                                    <div><span className="text-gray-500">Empresa:</span> <span className="font-medium">{solicitanteData.empresa}</span></div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Icon name="flight_takeoff" className="text-brand-teal" />
                                Datos del Viaje
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-gray-500">Tipo:</span> <span className="font-medium capitalize">{formData.via_tipo}</span></div>
                                <div><span className="text-gray-500">Fechas:</span> <span className="font-medium">{formData.via_fecha_salida} - {formData.via_fecha_regreso}</span></div>
                                <div><span className="text-gray-500">Motivo:</span> <span className="font-medium">{formData.via_motivo}</span></div>
                                {formData.via_proyecto && <div><span className="text-gray-500">Proyecto:</span> <span className="font-medium">{formData.via_proyecto}</span></div>}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                                <Icon name="receipt_long" className="text-brand-teal" />
                                Conceptos ({conceptos.length})
                            </h3>
                            <table className="w-full text-sm">
                                <thead className="border-b border-gray-200">
                                    <tr className="text-left">
                                        <th className="pb-2 font-medium text-gray-500">Tipo</th>
                                        <th className="pb-2 font-medium text-gray-500">Descripción</th>
                                        <th className="pb-2 font-medium text-gray-500 text-right">Cantidad</th>
                                        <th className="pb-2 font-medium text-gray-500 text-right">Valor Unitario</th>
                                        <th className="pb-2 font-medium text-gray-500 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conceptos.map((c, i) => (
                                        <tr key={i} className="border-b border-gray-100">
                                            <td className="py-2 capitalize">{c.vco_tipo.replace(/_/g, ' ')}</td>
                                            <td className="py-2">{c.vco_descripcion || '-'}</td>
                                            <td className="py-2 text-right">{c.vco_cantidad}</td>
                                            <td className="py-2 text-right">{formatCurrency(c.vco_valor_unit)}</td>
                                            <td className="py-2 text-right font-medium">{formatCurrency(c.vco_cantidad * c.vco_valor_unit)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-right font-bold text-lg mt-3 text-gray-800">
                                Total: <span className="text-brand-blue">{formatCurrency(getTotal())}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                                <Icon name="attach_file" className="text-brand-teal" />
                                Archivos Adjuntos
                            </h3>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setArchivos(prev => [...prev, ...files]);
                                }}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-medium
                                    file:bg-brand-blue file:text-white
                                    file:cursor-pointer file:transition-colors
                                    file:hover:bg-brand-accent"
                            />
                            {archivos.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {archivos.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                            <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setArchivos(prev => prev.filter((_, idx) => idx !== i))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Icon name="close" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <Button
                    onClick={() => step > 1 ? setStep(step - 1) : navigate('/viaticos')}
                    variant="outline"
                >
                    <Icon name="arrow_back" />
                    {step > 1 ? 'Anterior' : 'Cancelar'}
                </Button>
                
                {step < 3 ? (
                    <Button
                        onClick={() => setStep(step + 1)}
                        disabled={step === 1 && !solicitanteData}
                        variant="brand"
                    >
                        Siguiente
                        <Icon name="arrow_forward" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || conceptos.length === 0}
                        variant="brand"
                    >
                        {loading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="send" />}
                        Enviar Solicitud
                    </Button>
                )}
            </div>

            <Modal
                isOpen={showJefeModal}
                onClose={() => setShowJefeModal(false)}
                title="Seleccionar Jefe Aprobador"
            >
                <div>
                    <p className="text-gray-600 mb-4">
                        Se encontraron múltiples candidatos a jefe para el solicitante <strong>{solicitanteData?.nombre} {solicitanteData?.apellido}</strong>.
                        Por favor seleccione el jefe que debe aprobar este viático:
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {jefeCandidatos.map((jefe) => (
                            <label
                                key={jefe.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    selectedJefeId === jefe.id 
                                        ? 'border-brand-blue bg-blue-50' 
                                        : 'border-gray-200 hover:border-brand-teal'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="jefe"
                                    value={jefe.id}
                                    checked={selectedJefeId === jefe.id}
                                    onChange={() => setSelectedJefeId(jefe.id)}
                                    className="w-4 h-4 text-brand-blue"
                                />
                                <div>
                                    <div className="font-medium text-gray-800">{jefe.nombre}</div>
                                    <div className="text-sm text-gray-500">{jefe.cargo} - {jefe.regional}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            onClick={() => setShowJefeModal(false)}
                            variant="outline"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => setShowJefeModal(false)}
                            disabled={!selectedJefeId}
                            variant="brand"
                        >
                            Confirmar Selección
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
