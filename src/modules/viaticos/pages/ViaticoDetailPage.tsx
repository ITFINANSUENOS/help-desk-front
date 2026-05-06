import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { viaticoService, type Viatico, type ViaticoArchivo } from '../services/viatico.service';
import { Icon } from '../../../shared/components/Icon';
import { Modal } from '../../../shared/components/Modal';
import { useAuth } from '../../../modules/auth/context/useAuth';

const ESTADOS_WORKFLOW: Record<string, { label: string; class: string }> = {
    borrador: { label: 'Borrador', class: 'bg-gray-100 text-gray-600' },
    en_visto_bueno: { label: 'En Visto Bueno', class: 'bg-yellow-50 text-yellow-700' },
    aprobado_visto_bueno: { label: 'Visto Bueno Aprobado', class: 'bg-lime-50 text-lime-700' },
    en_aprobacion_cac: { label: 'En Aprobación CAC', class: 'bg-amber-50 text-amber-700' },
    aprobado: { label: 'Aprobado', class: 'bg-blue-50 text-blue-700' },
    en_registro_contable: { label: 'En Registro Contable', class: 'bg-indigo-50 text-indigo-700' },
    listo_desembolso: { label: 'Listo para Desembolso', class: 'bg-cyan-50 text-cyan-700' },
    desembolsado: { label: 'Desembolsado', class: 'bg-teal-50 text-teal-700' },
    en_legalizacion: { label: 'En Legalización', class: 'bg-purple-50 text-purple-700' },
    en_aprobacion_legalizacion: { label: 'En Aprobación Legalización', class: 'bg-pink-50 text-pink-700' },
    legalizacion_aprobada: { label: 'Legalización Aprobada', class: 'bg-rose-50 text-rose-700' },
    en_aprobacion_cac_legalizacion: { label: 'En Aprobación CAC Legalización', class: 'bg-orange-50 text-orange-700' },
    legalizacion_cac_aprobada: { label: 'Legalización CAC Aprobada', class: 'bg-green-50 text-green-700' },
    en_contabilizacion_legalizacion: { label: 'En Contabilización', class: 'bg-slate-50 text-slate-700' },
    rechazado: { label: 'Rechazado', class: 'bg-red-50 text-red-700' },
    cerrado: { label: 'Cerrado', class: 'bg-emerald-50 text-emerald-700' },
};

export default function ViaticoDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [viatico, setViatico] = useState<Viatico | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [usuarioCacId, setUsuarioCacId] = useState<number | null>(null);
    const [analistasContables, setAnalistasContables] = useState<{ id: number; nombre: string; apellido: string }[]>([]);
    const [usuariosTesoreria, setUsuariosTesoreria] = useState<{ id: number; nombre: string; apellido: string }[]>([]);
    const [showAnalistaModal, setShowAnalistaModal] = useState(false);
    const [showDesembolsoModal, setShowDesembolsoModal] = useState(false);
    const [showTesoreriaModal, setShowTesoreriaModal] = useState(false);
    const [showListoDesembolsoModal, setShowListoDesembolsoModal] = useState(false);
    const [selectedAnalistaId, setSelectedAnalistaId] = useState<number | null>(null);
    const [tempMontoAprobado, setTempMontoAprobado] = useState<string>('');
    const [tempComentario, setTempComentario] = useState<string>('');
    const [tempMontoDesembolso, setTempMontoDesembolso] = useState<string>('');
    const [tempMetodoPago, setTempMetodoPago] = useState<string>('efectivo');
    const [selectedTesoreriaId, setSelectedTesoreriaId] = useState<number | null>(null);
    const [archivos, setArchivos] = useState<ViaticoArchivo[]>([]);
    const [showLegalizacionArchivosModal, setShowLegalizacionArchivosModal] = useState(false);
    const [legalizacionArchivos, setLegalizacionArchivos] = useState<File[]>([]);
    const [showAprobarLegalizacionCacModal, setShowAprobarLegalizacionCacModal] = useState(false);
    
    // Modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalConfig, setConfirmModalConfig] = useState<{
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        type?: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
        inputPlaceholder?: string;
        inputLabel?: string;
        showInput?: boolean;
    } | null>(null);
    const [modalInputValue, setModalInputValue] = useState('');

    const openConfirmModal = (config: {
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        type?: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
        inputPlaceholder?: string;
        inputLabel?: string;
        showInput?: boolean;
    }) => {
        setConfirmModalConfig(config);
        setModalInputValue('');
        setShowConfirmModal(true);
    };

    const handleConfirmModalAction = () => {
        if (confirmModalConfig?.showInput && !modalInputValue.trim()) {
            return;
        }
        confirmModalConfig?.onConfirm();
        setShowConfirmModal(false);
    };

    const isJefeAsignado = viatico?.usuJefeId && currentUser?.id === viatico.usuJefeId;
    const isUsuarioCac = usuarioCacId && currentUser?.id === usuarioCacId;
    const isAnalistaContable = currentUser && analistasContables.some(a => a.id === currentUser.id);
    const esTesoreroAsignado = viatico?.usuTesoreriaId && currentUser?.id === viatico.usuTesoreriaId;
    const esCreadorViatico = currentUser && (viatico?.usuarioId === currentUser.id || viatico?.creadoPorId === currentUser.id);

    useEffect(() => {
        if (id) {
            cargarViatico();
            cargarConfiguracionCac();
        }
    }, [id]);

    const cargarViatico = async () => {
        try {
            setLoading(true);
            const [data, archivosData] = await Promise.all([
                viaticoService.getById(Number(id)),
                viaticoService.obtenerArchivos(Number(id))
            ]);
            setViatico(data);
            setArchivos(archivosData);
        } catch (error) {
            console.error('Error cargando viático:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarConfiguracionCac = async () => {
        try {
            const [configCac, configAnalistas, configTesoreria] = await Promise.all([
                viaticoService.getConfigUsuarioCac(),
                viaticoService.getConfigAnalistasContables(),
                viaticoService.getConfigUsuariosTesoreria()
            ]);
            setUsuarioCacId(configCac.usuarioCacId);
            setAnalistasContables(configAnalistas.analistas);
            setUsuariosTesoreria(configTesoreria.tesoreria);
        } catch (error) {
            console.error('Error cargando config:', error);
        }
    };

    const handleEnviarVistoBueno = async () => {
        openConfirmModal({
            title: 'Enviar a Visto Bueno',
            message: '¿Está seguro de enviar esta solicitud para visto bueno del jefe?',
            confirmText: 'Enviar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.enviarVistoBueno(Number(id));
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al enviar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleAprobarVistoBueno = async () => {
        openConfirmModal({
            title: 'Aprobar Visto Bueno',
            message: '¿Está seguro de aprobar este viático?',
            confirmText: 'Aprobar',
            cancelText: 'Cancelar',
            showInput: true,
            inputLabel: 'Comentario (opcional)',
            inputPlaceholder: 'Ingrese un comentario...',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.aprobarVistoBueno(Number(id), modalInputValue || undefined);
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al aprobar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleEnviarCac = async () => {
        openConfirmModal({
            title: 'Enviar a CAC',
            message: '¿Está seguro de enviar esta solicitud al CAC para aprobación?',
            confirmText: 'Enviar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.enviarAprobacionCac(Number(id));
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al enviar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleAprobarCac = async () => {
        setTempMontoAprobado(viatico?.montoSolicitado?.toString() || '');
        setTempComentario('');
        setSelectedAnalistaId(analistasContables.length === 1 ? analistasContables[0].id : null);
        setShowAnalistaModal(true);
    };

    const handleConfirmAprobarCac = async () => {
        if (!tempMontoAprobado) {
            alert('Debe ingresar el monto aprobado');
            return;
        }
        if (analistasContables.length > 0 && !selectedAnalistaId) {
            alert('Debe seleccionar un analista contable');
            return;
        }
        try {
            setActionLoading(true);
            await viaticoService.aprobarCac(Number(id), {
                via_monto_aprobado: Number(tempMontoAprobado),
                via_comentario_aprobacion: tempComentario || undefined,
                usuAnalistaId: selectedAnalistaId || undefined
            });
            setShowAnalistaModal(false);
            await cargarViatico();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al aprobar');
        } finally {
            setActionLoading(false);
        }
    };

    const formatCurrency = (value?: number) => {
        if (value == null) return '-';
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('es-CO');
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getBadgeClass = (estado: string) => {
        return ESTADOS_WORKFLOW[estado]?.class || 'bg-gray-100 text-gray-600';
    };

    const getEstadoLabel = (estado: string) => {
        return ESTADOS_WORKFLOW[estado]?.label || estado;
    };

    // Funciones de acción con modal
    const handleRechazar = async () => {
        openConfirmModal({
            title: 'Rechazar Viático',
            message: 'Ingrese el motivo del rechazo',
            confirmText: 'Rechazar',
            cancelText: 'Cancelar',
            type: 'danger',
            showInput: true,
            inputLabel: 'Motivo del rechazo',
            inputPlaceholder: 'Ej: Faltan documentos',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.rechazar(Number(id), modalInputValue);
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al rechazar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleRegistrarContable = async () => {
        openConfirmModal({
            title: 'Registrar Contable',
            message: 'Ingrese el número de comprobante',
            confirmText: 'Registrar',
            cancelText: 'Cancelar',
            showInput: true,
            inputLabel: 'Número de comprobante',
            inputPlaceholder: 'Ej: COMP-001',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.registrarContableSimple(Number(id), modalInputValue);
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al registrar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleConfirmarListoDesembolso = () => {
        setTempMontoDesembolso(viatico?.montoAprobado?.toString() || viatico?.montoSolicitado?.toString() || '');
        if (usuariosTesoreria.length === 1) {
            setSelectedTesoreriaId(usuariosTesoreria[0].id);
        } else {
            setSelectedTesoreriaId(null);
        }
        setShowListoDesembolsoModal(true);
    };

    const handleConfirmarListoDesembolsoSubmit = async () => {
        if (usuariosTesoreria.length > 1 && !selectedTesoreriaId) {
            return;
        }
        try {
            setActionLoading(true);
            if (selectedTesoreriaId) {
                await viaticoService.confirmarDesembolsoConTesoreria(Number(id), selectedTesoreriaId);
            } else {
                await viaticoService.confirmarDesembolso(Number(id));
            }
            setShowListoDesembolsoModal(false);
            await cargarViatico();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al confirmar listo para desembolso');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDesembolsar = async () => {
        if (usuariosTesoreria.length === 0) {
            openConfirmModal({
                title: 'Sin Tesorería Configurada',
                message: 'No hay usuarios de tesorería configurados. Por favor configure los usuarios de tesorería en la página de configuración.',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => {}
            });
            return;
        }
        
        setTempMontoDesembolso(viatico?.montoAprobado?.toString() || viatico?.montoSolicitado?.toString() || '');
        setTempMetodoPago('efectivo');
        
        if (viatico?.usuTesoreriaId) {
            setShowDesembolsoModal(true);
            return;
        }
        
        if (usuariosTesoreria.length === 1) {
            setSelectedTesoreriaId(usuariosTesoreria[0].id);
            setShowDesembolsoModal(true);
            return;
        }
        
        setShowTesoreriaModal(true);
    };

    const handleConfirmDesembolso = async () => {
        if (!tempMontoDesembolso || tempMontoDesembolso === '0') {
            openConfirmModal({
                title: 'Monto Requerido',
                message: 'Por favor ingrese el monto a desembolsar.',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => {}
            });
            return;
        }
        
        const tieneTesoreroAsignado = !!viatico?.usuTesoreriaId;
        const tieneUnTesoreroConfigurado = usuariosTesoreria.length > 0;
        if (tieneUnTesoreroConfigurado && !tieneTesoreroAsignado && !selectedTesoreriaId) {
            openConfirmModal({
                title: 'Tesorero Requerido',
                message: 'Por favor seleccione un usuario de tesorería.',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => {}
            });
            return;
        }
        
        openConfirmModal({
            title: 'Confirmar Desembolso',
            message: `¿Está seguro de registrar el desembolso por ${formatCurrency(Number(tempMontoDesembolso))}?`,
            confirmText: 'Desembolsar',
            cancelText: 'Cancelar',
            type: 'warning',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.desembolsar(Number(id), {
                        via_monto_desembolsado: Number(tempMontoDesembolso),
                        metodo_pago: tempMetodoPago
                    });
                    setShowDesembolsoModal(false);
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    setShowDesembolsoModal(false);
                    openConfirmModal({
                        title: 'Error',
                        message: 'Error al realizar el desembolso. Intente nuevamente.',
                        confirmText: 'Aceptar',
                        cancelText: 'Cancelar',
                        onConfirm: () => {}
                    });
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleConfirmarDesembolsoConTesoreria = async () => {
        if (!selectedTesoreriaId) {
            openConfirmModal({
                title: 'Tesorero Requerido',
                message: 'Por favor seleccione un usuario de tesorería.',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => {}
            });
            return;
        }
        openConfirmModal({
            title: 'Confirmar Tesorero',
            message: '¿Está seguro de asignar este tesorero?',
            confirmText: 'Confirmar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    setTempMontoDesembolso(viatico?.montoAprobado?.toString() || '');
                    setTempMetodoPago('efectivo');
                    setShowTesoreriaModal(false);
                    setShowDesembolsoModal(true);
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al confirmar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleSubirArchivosLegalizacion = async () => {
        if (legalizacionArchivos.length === 0) {
            openConfirmModal({
                title: 'Sin Archivos',
                message: 'Por favor seleccione al menos un archivo para subir.',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => {}
            });
            return;
        }
        try {
            setActionLoading(true);
            await viaticoService.subirArchivos(Number(id), legalizacionArchivos);
            setShowLegalizacionArchivosModal(false);
            setLegalizacionArchivos([]);
            await cargarViatico();
            openConfirmModal({
                title: 'Éxito',
                message: 'Archivos de legalización subidos correctamente.',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => {}
            });
        } catch (error) {
            console.error('Error:', error);
            openConfirmModal({
                title: 'Error',
                message: 'Error al subir archivos de legalización.',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => {}
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleEnviarLegalizacion = async () => {
        openConfirmModal({
            title: 'Enviar a Legalización',
            message: '¿Está seguro de enviar este viático a legalización?',
            confirmText: 'Enviar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.enviarLegalizacion(Number(id));
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al enviar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleAprobarLegalizacionJefe = async () => {
        openConfirmModal({
            title: 'Aprobar Legalización',
            message: '¿Está seguro de aprobar la legalización de este viático?',
            confirmText: 'Aprobar',
            cancelText: 'Cancelar',
            showInput: true,
            inputLabel: 'Comentario (opcional)',
            inputPlaceholder: 'Ingrese un comentario...',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.aprobarLegalizacionJefe(Number(id), modalInputValue || undefined);
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al aprobar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleEnviarLegalizacionCac = async () => {
        openConfirmModal({
            title: 'Enviar a CAC',
            message: '¿Está seguro de enviar la legalización al CAC?',
            confirmText: 'Enviar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.enviarLegalizacionCac(Number(id));
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al enviar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleAprobarLegalizacionCac = () => {
        setTempComentario('');
        setSelectedAnalistaId(analistasContables.length === 1 ? analistasContables[0].id : null);
        setShowAprobarLegalizacionCacModal(true);
    };

    const handleConfirmAprobarLegalizacionCac = async () => {
        if (analistasContables.length > 0 && !selectedAnalistaId) {
            openConfirmModal({
                title: 'Analista Requerido',
                message: 'Por favor seleccione un analista contable.',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => {}
            });
            return;
        }
        try {
            setActionLoading(true);
            await viaticoService.aprobarLegalizacionCac(Number(id), {
                comentario: tempComentario || undefined,
                analista_id: selectedAnalistaId || undefined
            });
            setShowAprobarLegalizacionCacModal(false);
            await cargarViatico();
        } catch (error) {
            console.error('Error:', error);
            openConfirmModal({
                title: 'Error',
                message: 'Error al aprobar la legalización en CAC.',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => {}
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleContabilizarLegalizacion = async () => {
        openConfirmModal({
            title: 'Contabilizar Legalización',
            message: 'Ingrese el número de comprobante de legalización',
            confirmText: 'Contabilizar',
            cancelText: 'Cancelar',
            showInput: true,
            inputLabel: 'Número de comprobante',
            inputPlaceholder: 'Ej: COMP-Legal-001',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.contabilizarLegalizacion(Number(id), modalInputValue);
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al contabilizar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleCerrar = async () => {
        openConfirmModal({
            title: 'Cerrar Viático',
            message: 'Ingrese una observación de cierre',
            confirmText: 'Cerrar',
            cancelText: 'Cancelar',
            showInput: true,
            inputLabel: 'Observación de cierre',
            inputPlaceholder: 'Ej: Viaje culminado sin novedad',
            onConfirm: async () => {
                try {
                    setActionLoading(true);
                    await viaticoService.cerrar(Number(id), { via_observacion_cierre: modalInputValue });
                    await cargarViatico();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al cerrar');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const renderAcciones = () => {
        if (!viatico) return null;

        const estado = viatico.estado;

        switch (estado) {
            case 'borrador':
                return (
                    <button onClick={handleEnviarVistoBueno} disabled={actionLoading} className="btn-primary">
                        <Icon name="send" /> Enviar para Visto Bueno
                    </button>
                );
            case 'en_visto_bueno':
                if (!isJefeAsignado) {
                    return <span className="text-yellow-600">Esperando aprobación del jefe</span>;
                }
                return (
                    <>
                        <button onClick={handleAprobarVistoBueno} disabled={actionLoading} className="btn-success">
                            <Icon name="check_circle" /> Aprobar Visto Bueno
                        </button>
                        <button onClick={handleRechazar} disabled={actionLoading} className="btn-danger">
                            <Icon name="cancel" /> Rechazar
                        </button>
                    </>
                );
            case 'aprobado_visto_bueno':
                return (
                    <button onClick={handleEnviarCac} disabled={actionLoading} className="btn-primary">
                        <Icon name="send" /> Enviar a CAC
                    </button>
                );
            case 'en_aprobacion_cac':
                if (!isUsuarioCac) {
                    return <span className="text-yellow-600">Esperando aprobación del CAC</span>;
                }
                return (
                    <>
                        <button onClick={handleAprobarCac} disabled={actionLoading} className="btn-success">
                            <Icon name="check_circle" /> Aprobar en CAC
                        </button>
                        <button onClick={handleRechazar} disabled={actionLoading} className="btn-danger">
                            <Icon name="cancel" /> Rechazar
                        </button>
                    </>
                );
            case 'aprobado':
                if (!isAnalistaContable) {
                    return <span className="text-yellow-600">Esperando registro contable</span>;
                }
                return (
                    <button onClick={handleRegistrarContable} disabled={actionLoading} className="btn-primary">
                        <Icon name="assignment" /> Registrar Contable
                    </button>
                );
            case 'en_registro_contable':
                const tieneAnalistaAsignado = viatico?.usuAnalistaId != null;
                const esAnalistaAsignado = tieneAnalistaAsignado && currentUser?.id === viatico.usuAnalistaId;
                const esAnalistaConfigurado = currentUser && analistasContables.some(a => a.id === currentUser.id);
                
                if (!esAnalistaAsignado && !esAnalistaConfigurado) {
                    return <span className="text-yellow-600">Esperando confirmación del analista</span>;
                }
                return (
                    <button onClick={handleConfirmarListoDesembolso} disabled={actionLoading} className="btn-primary">
                        <Icon name="check" /> Confirmar Listo Desembolso
                    </button>
                );
            case 'listo_desembolso':
                if (!esTesoreroAsignado) {
                    return <span className="text-yellow-600">Esperando desembolso del usuario de tesorería seleccionado</span>;
                }
                return (
                    <button onClick={handleDesembolsar} disabled={actionLoading} className="btn-primary">
                        <Icon name="payments" /> Registrar Desembolso
                    </button>
                );
            case 'desembolsado':
                if (!esCreadorViatico) {
                    return <span className="text-yellow-600">Esperando que el solicitante envíe a legalización</span>;
                }
                return (
                    <div className="flex gap-2">
                        <button onClick={() => setShowLegalizacionArchivosModal(true)} disabled={actionLoading} className="btn-secondary">
                            <Icon name="cloud_upload" /> Subir Comprobantes
                        </button>
                        <button onClick={handleEnviarLegalizacion} disabled={actionLoading} className="btn-primary">
                            <Icon name="fact_check" /> Enviar a Legalización
                        </button>
                    </div>
                );
            case 'en_legalizacion':
            case 'en_aprobacion_legalizacion':
                if (!isJefeAsignado) {
                    return <span className="text-yellow-600"> Esperando aprobación del jefe</span>;
                }
                return (
                    <>
                        <button onClick={handleAprobarLegalizacionJefe} disabled={actionLoading} className="btn-success">
                            <Icon name="check_circle" /> Aprobar Legalización
                        </button>
                        <button onClick={handleRechazar} disabled={actionLoading} className="btn-danger">
                            <Icon name="cancel" /> Rechazar
                        </button>
                    </>
                );
            case 'legalizacion_aprobada':
                return (
                    <button onClick={handleEnviarLegalizacionCac} disabled={actionLoading} className="btn-primary">
                        <Icon name="send" /> Enviar a CAC
                    </button>
                );
            case 'en_aprobacion_cac_legalizacion':
                if (!isUsuarioCac) {
                    return <span className="text-yellow-600"> Esperando aprobación del CAC</span>;
                }
                return (
                    <>
                        <button onClick={handleAprobarLegalizacionCac} disabled={actionLoading} className="btn-success">
                            <Icon name="check_circle" /> Aprobar Legalización CAC
                        </button>
                        <button onClick={handleRechazar} disabled={actionLoading} className="btn-danger">
                            <Icon name="cancel" /> Rechazar
                        </button>
                    </>
                );
            case 'legalizacion_cac_aprobada':
                return (
                    <button onClick={handleContabilizarLegalizacion} disabled={actionLoading} className="btn-primary">
                        <Icon name="assignment" /> Contabilizar Legalización
                    </button>
                );
            case 'en_contabilizacion_legalizacion':
                return (
                    <button onClick={handleCerrar} disabled={actionLoading} className="btn-success">
                        <Icon name="check_circle" /> Cerrar Viático
                    </button>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon name="autorenew" className="animate-spin text-4xl text-brand-teal" />
            </div>
        );
    }

    if (!viatico) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Viático no encontrado</p>
                <button onClick={() => navigate('/viaticos')} className="btn-secondary">
                    <Icon name="arrow_back" /> Volver
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/viaticos')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <Icon name="arrow_back" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Viático {viatico.codigo}</h1>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getBadgeClass(viatico.estado)}`}>
                            {getEstadoLabel(viatico.estado)}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {renderAcciones()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Icon name="flight_takeoff" className="text-brand-blue" />
                        Datos del Viaje
                    </h3>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Tipo:</dt>
                            <dd className="capitalize font-medium">{viatico.tipo}</dd>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Destino:</dt>
                            <dd className="font-medium">{viatico.destinoCiudad}, {viatico.destinoDepto}</dd>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Fechas:</dt>
                            <dd className="font-medium">{viatico.fechaSalida} - {viatico.fechaRegreso}</dd>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Duración:</dt>
                            <dd className="font-medium">{viatico.diasDuracion} días</dd>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Motivo:</dt>
                            <dd className="font-medium">{viatico.motivo}</dd>
                        </div>
                        {viatico.proyecto && (
                            <div className="flex justify-between py-2">
                                <dt className="text-gray-500">Proyecto:</dt>
                                <dd className="font-medium">{viatico.proyecto}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="card">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Icon name="payments" className="text-brand-teal" />
                        Montos
                    </h3>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Solicitado:</dt>
                            <dd className="font-medium">{formatCurrency(viatico.montoSolicitado)}</dd>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Aprobado:</dt>
                            <dd className="font-medium text-brand-blue">{formatCurrency(viatico.montoAprobado)}</dd>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Desembolsado:</dt>
                            <dd className="font-medium">{formatCurrency(viatico.montoDesembolsado)}</dd>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Legalizado:</dt>
                            <dd className="font-medium">{formatCurrency(viatico.montoLegalizado)}</dd>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-gray-500">Diferencia:</dt>
                            <dd className={`font-medium ${(viatico.montoDiferencia || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(viatico.montoDiferencia || 0)}
                            </dd>
                        </div>
                        {viatico.saldoTipo && (
                            <div className="flex justify-between py-2">
                                <dt className="text-gray-500">Saldo:</dt>
                                <dd className={`font-medium ${viatico.saldoTipo === 'favor_empresa' ? 'text-red-600' : 'text-green-600'}`}>
                                    {viatico.saldoTipo === 'favor_empresa' ? 'A favor de la empresa' : viatico.saldoTipo === 'favor_empleado' ? 'A favor del empleado' : 'Cuadrado'}: {formatCurrency(viatico.saldoValor || 0)}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                {viatico.conceptos && viatico.conceptos.length > 0 && (
                    <div className="card md:col-span-2">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <Icon name="receipt_long" className="text-brand-teal" />
                            Conceptos Solicitados
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Tipo</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Descripción</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">Cantidad</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">Valor Unit.</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {viatico.conceptos.map((concepto, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2 capitalize">{concepto.tipo?.replace(/_/g, ' ')}</td>
                                            <td className="px-3 py-2">{concepto.descripcion || '-'}</td>
                                            <td className="px-3 py-2 text-right">{concepto.cantidad}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(concepto.valorUnitario)}</td>
                                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(concepto.valorTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={4} className="px-3 py-2 text-right font-semibold">Total:</td>
                                        <td className="px-3 py-2 text-right font-bold text-brand-blue">
                                            {formatCurrency(viatico.conceptos.reduce((sum, c) => sum + c.valorTotal, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {viatico.nombreSolicitante && (
                    <div className="card">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <Icon name="person" className="text-brand-blue" />
                            Solicitante
                        </h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between py-1">
                                <dt className="text-gray-500">Nombre:</dt>
                                <dd className="font-medium">{viatico.nombreSolicitante}</dd>
                            </div>
                            <div className="flex justify-between py-1">
                                <dt className="text-gray-500">Cédula:</dt>
                                <dd className="font-medium">{viatico.cedulaSolicitante}</dd>
                            </div>
                        </dl>
                    </div>
                )}

                <div className="card">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Icon name="history" className="text-brand-blue" />
                        Fechas del Proceso
                    </h3>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between py-1">
                            <dt className="text-gray-500">Creado:</dt>
                            <dd className="font-medium">{formatDate(viatico.creadoEn)}</dd>
                        </div>
                        {viatico.fechaVistoBueno && (
                            <div className="flex justify-between py-1">
                                <dt className="text-gray-500">Visto Bueno:</dt>
                                <dd className="font-medium">{formatDate(viatico.fechaVistoBueno)}</dd>
                            </div>
                        )}
                        {viatico.fechaAprobacionCac && (
                            <div className="flex justify-between py-1">
                                <dt className="text-gray-500">Aprobado CAC:</dt>
                                <dd className="font-medium">{formatDate(viatico.fechaAprobacionCac)}</dd>
                            </div>
                        )}
                        {viatico.fechaDesembolso && (
                            <div className="flex justify-between py-1">
                                <dt className="text-gray-500">Desembolso:</dt>
                                <dd className="font-medium">{formatDate(viatico.fechaDesembolso)}</dd>
                            </div>
                        )}
                        {viatico.fechaLegalizacion && (
                            <div className="flex justify-between py-1">
                                <dt className="text-gray-500">Legalización:</dt>
                                <dd className="font-medium">{formatDate(viatico.fechaLegalizacion)}</dd>
                            </div>
                        )}
                        {viatico.fechaCierre && (
                            <div className="flex justify-between py-1">
                                <dt className="text-gray-500">Cierre:</dt>
                                <dd className="font-medium">{formatDate(viatico.fechaCierre)}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="card md:col-span-2">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Icon name="attach_file" className="text-brand-blue" />
                        Archivos Adjuntos
                    </h3>
                    {archivos.length === 0 ? (
                        <p className="text-gray-500 text-sm">No hay archivos adjuntos</p>
                    ) : (
                        <div className="space-y-2">
                            {archivos.map((archivo) => (
                                <div key={archivo.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Icon name="description" className="text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{archivo.nombre}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(archivo.tamano)} - {formatDate(archivo.fechaCreacion)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                            <a
                                            href={`/uploads/viaticos/${archivo.ruta.split('/').pop()}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-brand-blue hover:text-brand-accent"
                                        >
                                            <Icon name="visibility" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {viatico.historico && viatico.historico.length > 0 && (
                <div className="card">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Icon name="history" className="text-brand-blue" />
                        Historial
                    </h3>
                    <div className="space-y-3">
                        {viatico.historico.map((h, i) => (
                            <div key={i} className="flex gap-3 text-sm border-l-2 border-gray-200 pl-3">
                                <span className="text-gray-400">{formatDate(h.fecha)}</span>
                                <span className="font-medium">{h.estadoNuevo}</span>
                                <span className="text-gray-600">{h.comentario}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(to right, #2563eb, #0d9488);
                    color: white;
                    border-radius: 0.5rem;
                    font-weight: 500;
                    transition: all;
                }
                .btn-primary:hover { box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-success {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #059669;
                    color: white;
                    border-radius: 0.5rem;
                    font-weight: 500;
                }
                .btn-success:hover { background: #047857; }
                .btn-danger {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #dc2626;
                    color: white;
                    border-radius: 0.5rem;
                    font-weight: 500;
                }
                .btn-danger:hover { background: #b91c1c; }
                .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #f3f4f6;
                    color: #374151;
                    border-radius: 0.5rem;
                    font-weight: 500;
                }
                .card {
                    background: white;
                    border-radius: 0.75rem;
                    border: 1px solid #e5e7eb;
                    padding: 1.25rem;
                }
            `}</style>

            <Modal
                isOpen={showAnalistaModal}
                onClose={() => setShowAnalistaModal(false)}
                title="Aprobar en CAC"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto Aprobado <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={tempMontoAprobado}
                            onChange={(e) => setTempMontoAprobado(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comentario
                        </label>
                        <textarea
                            value={tempComentario}
                            onChange={(e) => setTempComentario(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                            placeholder="Comentario opcional..."
                        />
                    </div>
                    
                    {analistasContables.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Asignar Analista Contable
                            </label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {analistasContables.map((analista) => (
                                    <label
                                        key={analista.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            selectedAnalistaId === analista.id 
                                                ? 'border-brand-blue bg-blue-50' 
                                                : 'border-gray-200 hover:border-brand-teal'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="analista"
                                            value={analista.id}
                                            checked={selectedAnalistaId === analista.id}
                                            onChange={() => setSelectedAnalistaId(analista.id)}
                                            className="w-4 h-4 text-brand-blue"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-800">{analista.nombre} {analista.apellido}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowAnalistaModal(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmAprobarCac}
                            disabled={!tempMontoAprobado || actionLoading}
                            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-accent font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {actionLoading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="check" />}
                            Aprobar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showDesembolsoModal}
                onClose={() => setShowDesembolsoModal(false)}
                title="Registrar Desembolso"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto a Desembolsar <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={tempMontoDesembolso}
                            onChange={(e) => setTempMontoDesembolso(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Método de Pago
                        </label>
                        <select
                            value={tempMetodoPago}
                            onChange={(e) => setTempMetodoPago(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>
                    
                    {usuariosTesoreria.length > 0 && !viatico?.usuTesoreriaId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Usuario de Tesorería
                            </label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {usuariosTesoreria.map((tesorero) => (
                                    <label
                                        key={tesorero.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            selectedTesoreriaId === tesorero.id 
                                                ? 'border-brand-blue bg-blue-50' 
                                                : 'border-gray-200 hover:border-brand-teal'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="tesorero"
                                            value={tesorero.id}
                                            checked={selectedTesoreriaId === tesorero.id}
                                            onChange={() => setSelectedTesoreriaId(tesorero.id)}
                                            className="w-4 h-4 text-brand-blue"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-800">{tesorero.nombre} {tesorero.apellido}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowDesembolsoModal(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmDesembolso}
                            disabled={!tempMontoDesembolso || actionLoading}
                            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-accent font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {actionLoading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="check" />}
                            Desembolsar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showListoDesembolsoModal}
                onClose={() => setShowListoDesembolsoModal(false)}
                title="Confirmar Listo para Desembolso"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usuario de Tesorería / Caja <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {usuariosTesoreria.map((tesorero) => (
                                <label
                                    key={tesorero.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedTesoreriaId === tesorero.id 
                                            ? 'border-brand-blue bg-blue-50' 
                                            : 'border-gray-200 hover:border-brand-teal'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="tesorero"
                                        value={tesorero.id}
                                        checked={selectedTesoreriaId === tesorero.id}
                                        onChange={() => setSelectedTesoreriaId(tesorero.id)}
                                        className="w-4 h-4 text-brand-blue"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-800">{tesorero.nombre} {tesorero.apellido}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowListoDesembolsoModal(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmarListoDesembolsoSubmit}
                            disabled={(usuariosTesoreria.length > 1 && !selectedTesoreriaId) || actionLoading}
                            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-accent font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {actionLoading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="check" />}
                            Confirmar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showTesoreriaModal}
                onClose={() => setShowTesoreriaModal(false)}
                title="Seleccionar Usuario de Tesorería"
            >
                <div>
                    <p className="text-gray-600 mb-4">
                        Seleccione el usuario de tesorería que realizará el desembolso:
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {usuariosTesoreria.map((tesorero) => (
                            <label
                                key={tesorero.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    selectedTesoreriaId === tesorero.id 
                                        ? 'border-brand-blue bg-blue-50' 
                                        : 'border-gray-200 hover:border-brand-teal'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="tesorero"
                                    value={tesorero.id}
                                    checked={selectedTesoreriaId === tesorero.id}
                                    onChange={() => setSelectedTesoreriaId(tesorero.id)}
                                    className="w-4 h-4 text-brand-blue"
                                />
                                <div>
                                    <div className="font-medium text-gray-800">{tesorero.nombre} {tesorero.apellido}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowTesoreriaModal(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmarDesembolsoConTesoreria}
                            disabled={!selectedTesoreriaId || actionLoading}
                            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-accent font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {actionLoading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="check" />}
                            Confirmar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title={confirmModalConfig?.title || 'Confirmar'}
            >
                <div className="space-y-4">
                    {confirmModalConfig?.type === 'danger' && (
                        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <Icon name="warning" className="text-red-500" />
                            <span className="text-red-700">Esta acción no se puede deshacer</span>
                        </div>
                    )}
                    
                    <p className="text-gray-600">{confirmModalConfig?.message}</p>

                    {confirmModalConfig?.showInput && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {confirmModalConfig.inputLabel}
                            </label>
                            <input
                                type="text"
                                value={modalInputValue}
                                onChange={(e) => setModalInputValue(e.target.value)}
                                placeholder={confirmModalConfig.inputPlaceholder}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            {confirmModalConfig?.cancelText || 'Cancelar'}
                        </button>
                        <button
                            onClick={handleConfirmModalAction}
                            disabled={confirmModalConfig?.showInput && !modalInputValue.trim()}
                            className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                confirmModalConfig?.type === 'danger' 
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-brand-blue hover:bg-brand-accent text-white'
                            }`}
                        >
                            {confirmModalConfig?.confirmText || 'Confirmar'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showLegalizacionArchivosModal}
                onClose={() => { setShowLegalizacionArchivosModal(false); setLegalizacionArchivos([]); }}
                title="Subir Comprobantes de Legalización"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                        Seleccione los comprobantes de los gastos realizados durante el viaje para justificar la legalización.
                    </p>
                    
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setLegalizacionArchivos(prev => [...prev, ...files]);
                        }}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-medium
                            file:bg-brand-blue file:text-white
                            file:cursor-pointer file:transition-colors
                            file:hover:bg-brand-accent"
                    />
                    
                    {legalizacionArchivos.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {legalizacionArchivos.map((file, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                                    <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setLegalizacionArchivos(prev => prev.filter((_, idx) => idx !== i))}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Icon name="close" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => { setShowLegalizacionArchivosModal(false); setLegalizacionArchivos([]); }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubirArchivosLegalizacion}
                            disabled={legalizacionArchivos.length === 0 || actionLoading}
                            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-accent font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {actionLoading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="cloud_upload" />}
                            Subir Archivos
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showAprobarLegalizacionCacModal}
                onClose={() => setShowAprobarLegalizacionCacModal(false)}
                title="Aprobar Legalización en CAC"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto Aprobado
                        </label>
                        <div className="text-lg font-semibold text-brand-blue">
                            {formatCurrency(viatico?.montoAprobado)}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto Legalizado
                        </label>
                        <div className="text-lg font-semibold text-brand-teal">
                            {formatCurrency(viatico?.montoLegalizado)}
                        </div>
                    </div>

                    {(viatico?.montoDiferencia || 0) !== 0 && (
                        <div className={`p-3 rounded-lg ${(viatico?.montoDiferencia || 0) > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            <span className="font-medium">
                                {(viatico?.montoDiferencia || 0) > 0 
                                    ? `Diferencia a favor de la empresa: ${formatCurrency(viatico?.montoDiferencia)}`
                                    : `Diferencia a favor del empleado: ${formatCurrency(Math.abs(viatico?.montoDiferencia || 0))}`
                                }
                            </span>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comentario
                        </label>
                        <textarea
                            value={tempComentario}
                            onChange={(e) => setTempComentario(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                            placeholder="Comentario opcional..."
                        />
                    </div>
                    
                    {analistasContables.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Asignar Analista Contable para Contabilización
                            </label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {analistasContables.map((analista) => (
                                    <label
                                        key={analista.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            selectedAnalistaId === analista.id 
                                                ? 'border-brand-blue bg-blue-50' 
                                                : 'border-gray-200 hover:border-brand-teal'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="analistaLegalizacion"
                                            value={analista.id}
                                            checked={selectedAnalistaId === analista.id}
                                            onChange={() => setSelectedAnalistaId(analista.id)}
                                            className="w-4 h-4 text-brand-blue"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-800">{analista.nombre} {analista.apellido}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowAprobarLegalizacionCacModal(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmAprobarLegalizacionCac}
                            disabled={actionLoading}
                            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-accent font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {actionLoading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="check" />}
                            Aprobar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
