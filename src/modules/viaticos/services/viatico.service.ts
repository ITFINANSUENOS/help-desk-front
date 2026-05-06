import { api } from '../../../core/api/api';

export interface Viatico {
    id: number;
    codigo: string;
    tipo: 'anticipo' | 'reembolso' | 'mixto';
    estado: string;
    usuarioId: number;
    cedulaSolicitante?: string | null;
    nombreSolicitante?: string | null;
    empresaId?: number | null;
    creadoPorId?: number | null;
    esSolicitante?: number;
    departamentoId: number | null;
    cargoId: number | null;
    regionalId: number | null;
    destinoCiudad: string | null;
    destinoDepto: string | null;
    destinoPais: string;
    fechaSalida: string;
    fechaRegreso: string;
    diasDuracion: number | null;
    motivo: string;
    proyecto: string | null;
    montoSolicitado: number;
    montoAprobado: number;
    montoDesembolsado: number;
    montoLegalizado: number;
    montoDiferencia: number;
    aprobadoPorId: number | null;
    fechaAprobacion: string | null;
    comentarioAprobacion: string | null;
    // Nuevos campos del workflow
    usuJefeId?: number | null;
    usuCacId?: number | null;
    usuAnalistaId?: number | null;
    usuTesoreriaId?: number | null;
    fechaVistoBueno?: string | null;
    comentarioVistoBueno?: string | null;
    fechaAprobacionCac?: string | null;
    comentarioAprobacionCac?: string | null;
    fechaRegistroContable?: string | null;
    numComprobanteAnticipo?: string | null;
    metodoPago?: string | null;
    fechaAprobacionLegalizacion?: string | null;
    comentarioLegalizacion?: string | null;
    fechaAprobacionCacLegalizacion?: string | null;
    comentarioCacLegalizacion?: string | null;
    fechaContabilizacionLegalizacion?: string | null;
    numComprobanteLegalizacion?: string | null;
    saldoTipo?: string | null;
    saldoValor?: number | null;
    // Campos originales
    fechaDesembolso: string | null;
    fechaLegalizacion: string | null;
    fechaCierre: string | null;
    cerradoPorId: number | null;
    observacionCierre: string | null;
    creadoEn: string;
    actualizadoEn: string;
    usuario?: {
        id: number;
        nombre: string;
        apellido: string;
        email: string;
    };
    departamento?: {
        id: number;
        nombre: string;
    };
    conceptos?: ViaticoConcepto[];
    gastos?: ViaticoGasto[];
    historico?: ViaticoHistorico[];
    jefe?: {
        id: number;
        nombre: string;
        apellido: string;
    };
    cac?: {
        id: number;
        nombre: string;
        apellido: string;
    };
    analista?: {
        id: number;
        nombre: string;
        apellido: string;
    };
}

export interface ViaticoConcepto {
    id: number;
    viaticoId: number;
    tipo: string;
    descripcion: string | null;
    cantidad: number;
    valorUnitario: number;
    valorTotal: number;
    esAnticipado: boolean;
}

export interface ViaticoGasto {
    id: number;
    viaticoId: number;
    tipo: string;
    descripcion: string | null;
    fecha: string;
    valor: number;
    numeroSoporte: string | null;
    soporteArchivo: string | null;
    soporteTipo: string | null;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    observacion: string | null;
    creadoEn: string;
}

export interface ViaticoHistorico {
    id: number;
    viaticoId: number;
    estadoAnterior: string | null;
    estadoNuevo: string;
    comentario: string | null;
    usuarioId: number;
    fecha: string;
    usuario?: {
        id: number;
        nombre: string;
        apellido: string;
    };
}

export interface ViaticoArchivo {
    id: number;
    viaticoId: number;
    nombre: string;
    ruta: string;
    tipo: string;
    tamano: number;
    fechaCreacion: string;
    usuarioId: number;
}

export interface ViaticoFilter {
    via_estado?: string;
    usu_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    cedula_solicitante?: string;
}

export interface ViaticoResumen {
    pendientesAprobacion: number;
    pendientesLegalizacion: number;
    montoDesembolsadoMes: number;
    misPendientesLegalizacion: number;
}

export interface CreateViaticoPayload {
    via_tipo: 'anticipo' | 'reembolso' | 'mixto';
    cedula_solicitante: string;
    usu_jefe_id?: number;
    via_destino_pais?: string;
    via_fecha_salida: string;
    via_fecha_regreso: string;
    via_motivo: string;
    via_proyecto?: string;
    conceptos?: {
        vco_tipo: string;
        vco_descripcion?: string;
        vco_cantidad?: number;
        vco_valor_unit: number;
        vco_valor_total?: number;
        vco_es_anticipado?: boolean;
    }[];
}

export interface JefeCandidato {
    id: number;
    nombre: string;
    cargo: string;
    regional: string;
}

export const viaticoService = {
    async getAll(filtros: ViaticoFilter = {}) {
        const params = new URLSearchParams();
        if (filtros.via_estado) params.append('via_estado', filtros.via_estado);
        if (filtros.usu_id) params.append('usu_id', filtros.usu_id.toString());
        if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
        if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
        if (filtros.cedula_solicitante) params.append('cedula_solicitante', filtros.cedula_solicitante);

        const response = await api.get<{ data: Viatico[]; total: number }>(`/viaticos?${params}`);
        return response.data.data || [];
    },

    async getById(id: number) {
        const response = await api.get<Viatico>(`/viaticos/${id}`);
        return response.data;
    },

    async create(data: CreateViaticoPayload) {
        const response = await api.post<Viatico>('/viaticos', data);
        return response.data;
    },

    async update(id: number, data: Partial<Viatico>) {
        const response = await api.put<Viatico>(`/viaticos/${id}`, data);
        return response.data;
    },

    async delete(id: number) {
        const response = await api.delete(`/viaticos/${id}`);
        return response.data;
    },

    // ============ Workflow de viáticos ============
    
    async enviarVistoBueno(id: number) {
        const response = await api.post<Viatico>(`/viaticos/${id}/enviar-visto-bueno`, {});
        return response.data;
    },

    async aprobarVistoBueno(id: number, comentario?: string) {
        const response = await api.post<Viatico>(`/viaticos/${id}/aprobar-visto-bueno`, { comentario: comentario || '' });
        return response.data;
    },

    async enviarAprobacionCac(id: number) {
        const response = await api.post<Viatico>(`/viaticos/${id}/enviar-aprobacion-cac`, {});
        return response.data;
    },

    async aprobarCac(id: number, data: { via_monto_aprobado?: number; via_comentario_aprobacion?: string; usuAnalistaId?: number }) {
        const response = await api.post<Viatico>(`/viaticos/${id}/aprobar-cac`, data);
        return response.data;
    },

    async registrarContable(id: number, numComprobante: string, usuAnalistaId: number) {
        const response = await api.post<Viatico>(`/viaticos/${id}/registrar-contable`, { numComprobante, usuAnalistaId });
        return response.data;
    },

    async registrarContableSimple(id: number, numComprobante: string) {
        const response = await api.post<Viatico>(`/viaticos/${id}/registrar-contable-simple`, { numComprobante });
        return response.data;
    },

    async confirmarDesembolso(id: number) {
        const response = await api.post<Viatico>(`/viaticos/${id}/confirmar-desembolso`, {});
        return response.data;
    },

    async confirmarDesembolsoConTesoreria(id: number, usuTesoreriaId: number) {
        const response = await api.post<Viatico>(`/viaticos/${id}/confirmar-desembolso`, { usuTesoreriaId });
        return response.data;
    },

    async desembolsar(id: number, data: { via_monto_desembolsado: number; metodo_pago?: string }) {
        const response = await api.post<Viatico>(`/viaticos/${id}/desembolsar`, data);
        return response.data;
    },

    async enviarLegalizacion(id: number) {
        const response = await api.post<Viatico>(`/viaticos/${id}/enviar-legalizacion`, {});
        return response.data;
    },

    async aprobarLegalizacionJefe(id: number, comentario?: string) {
        const response = await api.post<Viatico>(`/viaticos/${id}/aprobar-legalizacion-jefe`, { comentario: comentario || '' });
        return response.data;
    },

    async enviarLegalizacionCac(id: number) {
        const response = await api.post<Viatico>(`/viaticos/${id}/enviar-legalizacion-cac`, {});
        return response.data;
    },

    async aprobarLegalizacionCac(id: number, data: { comentario?: string; analista_id?: number }) {
        const response = await api.post<Viatico>(`/viaticos/${id}/aprobar-legalizacion-cac`, data);
        return response.data;
    },

    async contabilizarLegalizacion(id: number, numComprobante: string) {
        const response = await api.post<Viatico>(`/viaticos/${id}/contabilizar-legalizacion`, { numComprobante });
        return response.data;
    },

    async legalizar(id: number, gastos: Partial<ViaticoGasto>[]) {
        const response = await api.post<Viatico>(`/viaticos/${id}/legalizar`, { gastos });
        return response.data;
    },

    async rechazar(id: number, comentario: string) {
        const response = await api.post<Viatico>(`/viaticos/${id}/rechazar`, { comentario });
        return response.data;
    },

    async cerrar(id: number, data: { via_observacion_cierre?: string } = {}) {
        const response = await api.post<Viatico>(`/viaticos/${id}/cerrar`, data);
        return response.data;
    },

    async getResumen() {
        const response = await api.get<ViaticoResumen>('/viaticos/resumen');
        return response.data;
    },

    async getConceptos(id: number) {
        const response = await api.get<ViaticoConcepto[]>(`/viaticos/${id}/conceptos`);
        return response.data;
    },

    async getGastos(id: number) {
        const response = await api.get<ViaticoGasto[]>(`/viaticos/${id}/gastos`);
        return response.data;
    },

    async getHistorico(id: number) {
        const response = await api.get<ViaticoHistorico[]>(`/viaticos/${id}/historico`);
        return response.data;
    },

    async buscarUsuarioPorCedula(cedula: string) {
        const response = await api.get<{
            found: boolean;
            message?: string;
            data?: {
                cedula: string;
                nombre: string;
                apellido: string;
                nombre_cargo: string;
                empresa: string;
                regional: string;
                ciudad: string;
            }
        }>(`/viaticos/buscar-usuario/${cedula}`);
        return response.data;
    },

    async getJefeCandidatos(nombreCargo: string, nombreRegional: string) {
        const params = new URLSearchParams();
        params.append('nombre_cargo', nombreCargo);
        if (nombreRegional) params.append('nombre_regional', nombreRegional);
        
        const response = await api.get<{
            candidatos: JefeCandidato[];
            tieneOpciones: boolean;
            mensaje: string;
        }>(`/viaticos/jefe-candidatos?${params}`);
        return response.data;
    },

    async getConfigUsuarioCac() {
        const response = await api.get<{
            configurado: boolean;
            usuarioCacId: number | null;
            usuarioCacNombre: string | null;
            usuariosCacDisponibles: { id: number; nombre: string; apellido: string; email: string }[];
        }>(`/viaticos/config/usuario-cac`);
        return response.data;
    },

    async setConfigUsuarioCac(usuarioCacId: number) {
        const response = await api.post<{
            success: boolean;
            mensaje: string;
            usuarioCacId: string;
        }>(`/viaticos/config/usuario-cac`, { usuario_cac_id: usuarioCacId });
        return response.data;
    },

    async getConfigAnalistasContables() {
        const response = await api.get<{
            configurado: boolean;
            analistasIds: number[];
            analistas: { id: number; nombre: string; apellido: string; email: string }[];
            usuariosDisponibles: { id: number; nombre: string; apellido: string; email: string; cargo: string; regional: string }[];
        }>(`/viaticos/config/analistas-contables`);
        return response.data;
    },

    async setConfigAnalistasContables(analistasIds: number[]) {
        const response = await api.post<{
            success: boolean;
            mensaje: string;
            analistasIds: number[];
            analistas: string[];
        }>(`/viaticos/config/analistas-contables`, { analistas_ids:analistasIds });
        return response.data;
    },

    async getConfigUsuariosTesoreria() {
        const response = await api.get<{
            configurado: boolean;
            tesoreriaIds: number[];
            tesoreria: { id: number; nombre: string; apellido: string; email: string }[];
            usuariosDisponibles: { id: number; nombre: string; apellido: string; email: string; cargo: string; regional: string }[];
        }>(`/viaticos/config/usuarios-tesoreria`);
        return response.data;
    },

    async setConfigUsuariosTesoreria(tesoreriaIds: number[]) {
        const response = await api.post<{
            success: boolean;
            mensaje: string;
            tesoreriaIds: number[];
            tesoreria: string[];
        }>(`/viaticos/config/usuarios-tesoreria`, { usuarios_tesoreria_ids: tesoreriaIds });
        return response.data;
    },

    async subirArchivos(viaticoId: number, archivos: File[]) {
        const formData = new FormData();
        archivos.forEach((archivo) => {
            formData.append('archivos', archivo);
        });
        const response = await api.post<ViaticoArchivo[]>(`/viaticos/${viaticoId}/archivos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async obtenerArchivos(viaticoId: number) {
        const response = await api.get<ViaticoArchivo[]>(`/viaticos/${viaticoId}/archivos`);
        return response.data;
    },

    async eliminarArchivo(archivoId: number) {
        const response = await api.delete<{ mensaje: string }>(`/viaticos/archivos/${archivoId}`);
        return response.data;
    },
};
