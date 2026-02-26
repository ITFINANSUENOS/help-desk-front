// ─── KPIs Globales ────────────────────────────────────────────────
export interface KpisGlobales {
    total_tickets: number;
    a_tiempo: number;
    atrasados: number;
    tickets_unicos: number;
    usuarios_activos: number;
    regionales_activos: number;
    errores_proceso: number;
    errores_informativo: number;
    pct_cumplimiento: number;
    pct_error_proceso: number;
    tiempo_promedio_hrs: number;
    tiempo_total_hrs: number;
    top_regional: string;
    ultima_actualizacion: string;
}

// ─── Ranking ──────────────────────────────────────────────────────
export interface UsuarioRanking {
    usuario_id: number;
    usuario_nombre: string;
    regional: string;
    rol: string;
    cargo: string;
    tickets_gestionados: number;
    a_tiempo: number;
    atrasados: number;
    errores_proceso: number;
    errores_informativo: number;
    tiempo_promedio: number;
    tiempo_total: number;
    pct_cumplimiento_sla: number;
    pct_error_proceso: number;
    score_cumplimiento: number;
    score_calidad: number;
    score_total: number;
    score_ponderado: number;
    ranking: number;
    clasificacion: 'verde' | 'amarillo' | 'rojo';
}

export interface RankingResponse {
    data: UsuarioRanking[];
    total: number;
    page: number;
    limit: number;
}

// ─── Regional ─────────────────────────────────────────────────────
export interface RegionalStats {
    regional: string;
    usuarios: number;
    total_tickets: number;
    a_tiempo: number;
    atrasados: number;
    errores_proceso: number;
    errores_informativo: number;
    tiempo_promedio: number;
    pct_cumplimiento: number;
    pct_error_proceso: number;
    clasificacion: 'verde' | 'amarillo' | 'rojo';
}

// ─── Mapa de Calor ────────────────────────────────────────────────
export interface MapaCalorItem {
    usuario_nombre: string;
    regional: string;
    tickets_gestionados: number;
    pct_cumplimiento_sla: number;
    pct_total_errores: number;
    tiempo_promedio: number;
    score_total: number;
    clasificacion: 'verde' | 'amarillo' | 'rojo';
}

// ─── Categorías ───────────────────────────────────────────────────
export interface CategoriaStats {
    categoria: string;
    total_tickets: number;
    total_pasos: number;
    pasos_por_ticket: number;
    duracion_promedio: number;
    duracion_maxima: number;
    pct_cumplimiento: number;
    pct_con_novedad: number;
    clasificacion: 'verde' | 'amarillo' | 'rojo';
}

// ─── Cuellos de Botella ───────────────────────────────────────────
export interface CuelloBottleneck {
    paso_flujo: string;
    total_asignaciones: number;
    tickets_unicos: number;
    duracion_promedio: number;
    duracion_maxima: number;
    total_atrasados: number;
    total_novedades: number;
    pct_atrasados: number;
    severidad: 'critico' | 'moderado' | 'normal';
    color: 'rojo' | 'amarillo' | 'verde';
}

// ─── Distribución de Tiempos ──────────────────────────────────────
export interface EstadisticasTiempo {
    media: number;
    desviacion_estandar: number;
    minimo: number;
    maximo: number;
}

export interface RangoTiempo {
    rango_tiempo: string;
    orden: number;
    cantidad: number;
    pct_total: number;
    pct_acumulado: number;
}

export interface DistribucionTiempos {
    estadisticas: EstadisticasTiempo;
    rangos: RangoTiempo[];
}

// ─── Detalle de Usuario ───────────────────────────────────────────
export interface DetallePaso {
    paso_flujo: string;
    veces_asignado: number;
    duracion_promedio: number;
    a_tiempo: number;
    pct_cumplimiento: number;
}

export interface DetalleUsuario {
    usuario_nombre: string;
    regional: string;
    rol: string;
    cargo: string;
    tickets_gestionados: number;
    a_tiempo: number;
    atrasados: number;
    errores_proceso: number;
    errores_informativo: number;
    tiempo_promedio: number;
    pct_cumplimiento: number;
    pct_error_proceso: number;
    score_total: number;
    ranking: number;
    detalle_por_paso: DetallePaso[];
}

// ─── Novedades ────────────────────────────────────────────────────
export interface TipoNovedad {
    tipo_novedad: string;
    cantidad: number;
    pct_total: number;
}

export interface UsuarioNovedad {
    usuario_nombre: string;
    regional: string;
    total_novedades: number;
    tickets_afectados: number;
    pct_tickets_con_novedad: number;
    clasificacion: 'verde' | 'amarillo' | 'rojo';
}

export interface Novedades {
    distribucion_tipos: TipoNovedad[];
    usuarios_con_mas_novedades: UsuarioNovedad[];
}
