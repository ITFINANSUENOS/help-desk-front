# TAREAS FRONTEND — DASHBOARD DE DESEMPEÑO
## Stack: React 19 + TypeScript + Vite + TailwindCSS
## Proyecto: help-desk-front

---

## ⚠️ REGLAS OBLIGATORIAS ANTES DE EMPEZAR

1. **Iconos**: Usar SOLO `@tabler/icons-react`. Nunca importar el barrel completo.
   ```typescript
   // ✅ CORRECTO
   import { IconTrendingUp } from '@tabler/icons-react/dist/esm/icons/IconTrendingUp';
   // ❌ INCORRECTO
   import { IconTrendingUp } from '@tabler/icons-react';
   ```
2. **Toasts**: Usar `sonner` (ya instalado), NO instalar react-hot-toast.
3. **Estilos**: Usar `clsx` + `tailwind-merge` (ya instalados). No escribir estilos inline.
4. **Formularios**: Si hay filtros, usar `react-hook-form` (ya instalado).
5. **Colores de marca** (respetar SIEMPRE):
   - `brand-blue: #2B378A` → Headers, títulos principales
   - `brand-teal: #43BBCA` → Acentos, highlights, loading states
   - `brand-red: #D92323` → Alertas críticas, destructivo
   - `brand-accent: #23468C` → Hover states, interacciones
   - `primary: #37c5d7` → Links, destaques sutiles
6. **Arquitectura**: Todo el dashboard va dentro de `/src/modules/dashboard/`.
7. **Tipos TypeScript**: Definir interfaces para TODAS las respuestas de la API.

---

## ORDEN DE EJECUCIÓN OBLIGATORIO

```
Tarea 1 (Dependencias) → Tarea 2 (Tipos) → Tarea 3 (API service) →
Tarea 4 (React Query hooks) → Tarea 5 (Utils) → Tarea 6 (Componentes UI) →
Tarea 7 (Componentes Charts) → Tareas 8-17 (Páginas) → Tarea 18 (Rutas) →
Tarea 19 (Sidebar) → Tarea 20 (Tests)
```

---

## BLOQUE 1 — SETUP Y DEPENDENCIAS

---

### TAREA 1: Instalar dependencias faltantes

```bash
npm install recharts @tanstack/react-query
npm install @tanstack/react-query-devtools --save-dev
```

> `axios`, `sonner`, `socket.io-client`, `clsx`, `tailwind-merge` ya están instalados.
> NO instalar lucide-react, react-hot-toast, ni lodash.

Configurar React Query en el punto de entrada (`src/main.tsx`):

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30 segundos antes de refetch
      gcTime: 5 * 60_000,       // 5 minutos en cache
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Envolver <App /> con:
<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

---

## BLOQUE 2 — TIPOS TYPESCRIPT

---

### TAREA 2: Crear interfaces de la API

Crear el archivo `src/modules/dashboard/types/dashboard.types.ts`:

```typescript
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
  total_ocurrencias: number;
  tickets_unicos: number;
  duracion_promedio: number;
  duracion_maxima: number;
  duracion_total: number;
  atrasados: number;
  pct_atrasos: number;
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
```

---

## BLOQUE 3 — CAPA DE DATOS

---

### TAREA 3: Crear servicio de API

Crear `src/modules/dashboard/services/dashboard.api.ts`:

> Usar la instancia de axios que ya existe en `/src/core/` (no crear una nueva).
> Si la instancia se llama distinto, adaptar el import.

```typescript
import axios from '@/core/axios'; // ajustar al path real de tu instancia axios
import type {
  KpisGlobales, RankingResponse, RegionalStats, MapaCalorItem,
  CategoriaStats, CuelloBottleneck, DistribucionTiempos,
  DetalleUsuario, UsuarioRanking, Novedades,
} from '../types/dashboard.types';

const BASE = '/api/dashboard';

export const dashboardApi = {
  getKpis: () =>
    axios.get<KpisGlobales>(`${BASE}/kpis`).then(r => r.data),

  getRanking: (limit = 50, page = 1) =>
    axios.get<RankingResponse>(`${BASE}/ranking`, { params: { limit, page } }).then(r => r.data),

  getRegionales: () =>
    axios.get<RegionalStats[]>(`${BASE}/regionales`).then(r => r.data),

  getMapaCalor: (regional?: string) =>
    axios.get<MapaCalorItem[]>(`${BASE}/mapa-calor`, { params: regional ? { regional } : {} }).then(r => r.data),

  getCategorias: () =>
    axios.get<CategoriaStats[]>(`${BASE}/categorias`).then(r => r.data),

  getCuellos: (limit = 20) =>
    axios.get<CuelloBottleneck[]>(`${BASE}/cuellos-botella`, { params: { limit } }).then(r => r.data),

  getDistribucion: () =>
    axios.get<DistribucionTiempos>(`${BASE}/distribucion-tiempos`).then(r => r.data),

  getDetalleUsuario: (id: number) =>
    axios.get<DetalleUsuario>(`${BASE}/usuario/${id}/detalle`).then(r => r.data),

  getPasosUsuario: (id: number) =>
    axios.get<DetallePaso[]>(`${BASE}/usuario/${id}/pasos`).then(r => r.data),

  getTopPerformers: (type: 'top' | 'bottom' = 'top', limit = 10) =>
    axios.get<UsuarioRanking[]>(`${BASE}/top-performers`, { params: { type, limit } }).then(r => r.data),

  getNovedades: () =>
    axios.get<Novedades>(`${BASE}/novedades`).then(r => r.data),

  exportar: (format = 'xlsx', type = 'full') =>
    axios.get(`${BASE}/export`, { params: { format, type }, responseType: 'blob' }).then(r => r.data),
};
```

---

### TAREA 4: Crear React Query hooks

Crear `src/modules/dashboard/hooks/useDashboard.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard.api';

// Keys centralizadas para invalidación
export const DASHBOARD_KEYS = {
  kpis:        ['dashboard', 'kpis'],
  ranking:     (limit: number, page: number) => ['dashboard', 'ranking', limit, page],
  regionales:  ['dashboard', 'regionales'],
  mapaCalor:   (regional?: string) => ['dashboard', 'mapa-calor', regional ?? 'all'],
  categorias:  ['dashboard', 'categorias'],
  cuellos:     (limit: number) => ['dashboard', 'cuellos', limit],
  distribucion:['dashboard', 'distribucion'],
  detalle:     (id: number) => ['dashboard', 'usuario', id, 'detalle'],
  pasos:       (id: number) => ['dashboard', 'usuario', id, 'pasos'],
  topPerf:     (type: string, limit: number) => ['dashboard', 'top-performers', type, limit],
  novedades:   ['dashboard', 'novedades'],
};

export const useKpis = () =>
  useQuery({ queryKey: DASHBOARD_KEYS.kpis, queryFn: dashboardApi.getKpis, staleTime: 30_000 });

export const useRanking = (limit = 50, page = 1) =>
  useQuery({ queryKey: DASHBOARD_KEYS.ranking(limit, page), queryFn: () => dashboardApi.getRanking(limit, page) });

export const useRegionales = () =>
  useQuery({ queryKey: DASHBOARD_KEYS.regionales, queryFn: dashboardApi.getRegionales });

export const useMapaCalor = (regional?: string) =>
  useQuery({ queryKey: DASHBOARD_KEYS.mapaCalor(regional), queryFn: () => dashboardApi.getMapaCalor(regional) });

export const useCategorias = () =>
  useQuery({ queryKey: DASHBOARD_KEYS.categorias, queryFn: dashboardApi.getCategorias });

export const useCuellos = (limit = 20) =>
  useQuery({ queryKey: DASHBOARD_KEYS.cuellos(limit), queryFn: () => dashboardApi.getCuellos(limit) });

export const useDistribucion = () =>
  useQuery({ queryKey: DASHBOARD_KEYS.distribucion, queryFn: dashboardApi.getDistribucion });

export const useDetalleUsuario = (id: number) =>
  useQuery({ queryKey: DASHBOARD_KEYS.detalle(id), queryFn: () => dashboardApi.getDetalleUsuario(id), enabled: !!id });

export const usePasosUsuario = (id: number) =>
  useQuery({ queryKey: DASHBOARD_KEYS.pasos(id), queryFn: () => dashboardApi.getPasosUsuario(id), enabled: !!id });

export const useTopPerformers = (type: 'top' | 'bottom' = 'top', limit = 10) =>
  useQuery({ queryKey: DASHBOARD_KEYS.topPerf(type, limit), queryFn: () => dashboardApi.getTopPerformers(type, limit) });

export const useNovedades = () =>
  useQuery({ queryKey: DASHBOARD_KEYS.novedades, queryFn: dashboardApi.getNovedades });
```

Crear también `src/modules/dashboard/hooks/useExport.ts`:

```typescript
import { useState } from 'react';
import { toast } from 'sonner';
import { dashboardApi } from '../services/dashboard.api';

export const useExport = () => {
  const [loading, setLoading] = useState(false);

  const exportar = async (format = 'xlsx', type = 'full') => {
    setLoading(true);
    try {
      const blob = await dashboardApi.exportar(format, type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportación descargada correctamente');
    } catch {
      toast.error('Error al exportar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  return { exportar, loading };
};
```

---

## BLOQUE 4 — UTILIDADES

---

### TAREA 5: Crear utilidades de colores y formateo

Crear `src/modules/dashboard/utils/colores.ts`:

```typescript
// Colores del sistema (coherentes con el diseño de la app)
export const COLORES_SISTEMA = {
  verde:    { bg: '#C6EFCE', text: '#006100', tailwind: 'bg-green-100 text-green-800' },
  amarillo: { bg: '#FFEB9C', text: '#9C6500', tailwind: 'bg-yellow-100 text-yellow-800' },
  rojo:     { bg: '#FFC7CE', text: '#C00000', tailwind: 'bg-red-100 text-red-800' },
};

export type Clasificacion = 'verde' | 'amarillo' | 'rojo';

// Cumplimiento SLA y Score (>= 90 verde | >= 75 amarillo | < 75 rojo)
export const getClasificacionCumplimiento = (valor: number): Clasificacion =>
  valor >= 90 ? 'verde' : valor >= 75 ? 'amarillo' : 'rojo';

// Errores (invertido: <= 5 verde | <= 15 amarillo | > 15 rojo)
export const getClasificacionErrores = (valor: number): Clasificacion =>
  valor <= 5 ? 'verde' : valor <= 15 ? 'amarillo' : 'rojo';

// Cuellos de botella por duración promedio
export const getClasificacionCuello = (duracion: number): Clasificacion =>
  duracion >= 100 ? 'rojo' : duracion >= 50 ? 'amarillo' : 'verde';

// Novedades por % de tickets afectados
export const getClasificacionNovedades = (pct: number): Clasificacion =>
  pct >= 30 ? 'rojo' : pct >= 15 ? 'amarillo' : 'verde';

// Tiempo promedio por percentil dentro de un array
export const getClasificacionTiempo = (valor: number, todos: number[]): Clasificacion => {
  const sorted = [...todos].sort((a, b) => a - b);
  const idx = sorted.indexOf(valor);
  const pct = (idx / sorted.length) * 100;
  return pct <= 33 ? 'verde' : pct <= 66 ? 'amarillo' : 'rojo';
};

// Obtener clases Tailwind según clasificación
export const getTailwindClasificacion = (c: Clasificacion) => COLORES_SISTEMA[c].tailwind;

// Colores para recharts (hex directo)
export const getHexClasificacion = (c: Clasificacion) => ({
  verde:    '#22c55e',
  amarillo: '#eab308',
  rojo:     '#ef4444',
}[c]);
```

Crear `src/modules/dashboard/utils/formatters.ts`:

```typescript
export const formatHoras = (horas: number): string => {
  if (horas < 1)   return `${Math.round(horas * 60)}min`;
  if (horas < 24)  return `${horas.toFixed(1)}h`;
  if (horas < 168) return `${(horas / 24).toFixed(1)} días`;
  return `${(horas / 168).toFixed(1)} sem`;
};

export const formatPct = (v: number): string => `${Number(v).toFixed(1)}%`;
export const formatScore = (v: number): string => Number(v).toFixed(1);
export const formatNumero = (n: number): string => n.toLocaleString('es-CO');

export const formatFecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
```

---

## BLOQUE 5 — COMPONENTES UI REUTILIZABLES

---

### TAREA 6: Crear componentes UI base

Ubicación: `src/modules/dashboard/components/ui/`

**6A — `KPICard.tsx`**

Props: `titulo`, `valor`, `subtitulo?`, `icono` (componente Tabler), `clasificacion?`, `sufijo?`
- Fondo blanco con sombra suave
- Borde izquierdo con color según clasificacion (brand-teal si no hay clasificación)
- Icono del lado derecho en color brand-teal
- Valor en fuente grande y negrita
- Loading skeleton si `isLoading` prop es true

```typescript
interface KPICardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icono: React.ReactNode;
  clasificacion?: 'verde' | 'amarillo' | 'rojo';
  sufijo?: string;
  isLoading?: boolean;
}
```

**6B — `ScoreBadge.tsx`**

Props: `score: number`
- Pill/chip con el score y color según clasificacion
- score >= 90 → verde | >= 75 → amarillo | < 75 → rojo
- Usar `getTailwindClasificacion` de utils/colores

**6C — `ClasificacionDot.tsx`**

Props: `clasificacion: 'verde' | 'amarillo' | 'rojo'`, `label?: string`
- Punto de color + label opcional
- Usado en tablas para indicar estado rápido

**6D — `DataTable.tsx`**

Props genérico: `columns: Column[]`, `data: T[]`, `isLoading?`, `emptyMessage?`

```typescript
interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;  // Para celdas custom
  align?: 'left' | 'center' | 'right';
}
```

- Header con fondo `brand-blue` texto blanco
- Filas alternas con `bg-gray-50`
- Hover con fondo `bg-blue-50`
- Celdas con `clasificacion` usan `ScoreBadge` o `ClasificacionDot`
- Skeleton loader si `isLoading`

**6E — `Pagination.tsx`**

Props: `total`, `page`, `limit`, `onPageChange`, `onLimitChange?`
- Botones anterior/siguiente
- Input de página o selector
- Muestra "Mostrando X-Y de Z resultados"
- Estilo coherente con brand-blue para página activa

**6F — `LoadingSkeleton.tsx`**

Props: `rows?: number`, `cols?: number`
- Animación pulse de Tailwind
- Para tablas: filas de barras grises
- Para KPI cards: rectángulos

**6G — `FiltroRegional.tsx`**

Usar `react-select` (ya instalado):
- Dropdown de regionales
- Opción "Todas las regionales" como default
- onChange llama al callback del padre
- Estilo personalizado para que use `brand-blue`/`brand-teal`

**6H — `AlertaBanner.tsx`**

Props: `nivel: 'critico' | 'warning'`, `mensaje: string`, `onClose`
- Crítico: fondo `brand-red` texto blanco
- Warning: fondo amarillo texto oscuro
- Botón X para cerrar
- Mostrado en la parte superior de cada página si hay alertas activas

---

## BLOQUE 6 — COMPONENTES DE GRÁFICOS

---

### TAREA 7: Crear componentes de charts con Recharts

Ubicación: `src/modules/dashboard/components/charts/`
Colores de recharts a usar: `#43BBCA` (brand-teal), `#2B378A` (brand-blue), `#ef4444`, `#eab308`, `#22c55e`

**7A — `BarChartCuellos.tsx`**

Props: `data: CuelloBottleneck[]`
- BarChart horizontal con `paso_flujo` en eje Y y `duracion_promedio` en X
- Color de barra según `color` del item (rojo/amarillo/verde)
- Tooltip mostrando: Duración promedio, % Atrasos, Severidad
- Truncar nombres largos de paso_flujo a 25 chars

```typescript
// Recharts config clave:
<BarChart layout="vertical" data={data}>
  <XAxis type="number" unit="h" />
  <YAxis type="category" dataKey="paso_flujo" width={200} />
  <Bar dataKey="duracion_promedio">
    {data.map((entry, i) => (
      <Cell key={i} fill={entry.color === 'rojo' ? '#ef4444' : entry.color === 'amarillo' ? '#eab308' : '#22c55e'} />
    ))}
  </Bar>
</BarChart>
```

**7B — `HistogramaTiempos.tsx`**

Props: `data: RangoTiempo[]`
- BarChart vertical con `rango_tiempo` en X y `cantidad` en Y
- Segunda línea (LineChart compuesto) para `pct_acumulado` en eje Y derecho
- Color barras: brand-teal `#43BBCA`
- Color línea acumulado: brand-blue `#2B378A`
- ComposedChart de Recharts

```typescript
<ComposedChart data={data}>
  <Bar dataKey="cantidad" fill="#43BBCA" />
  <Line type="monotone" dataKey="pct_acumulado" stroke="#2B378A" yAxisId="right" />
  <YAxis yAxisId="right" orientation="right" unit="%" />
</ComposedChart>
```

**7C — `PieNovedades.tsx`**

Props: `data: TipoNovedad[]`
- PieChart con cada tipo de novedad
- Colores: brand-red para Error Proceso, brand-teal para Error Informativo, grises para otros
- Leyenda abajo con nombre + porcentaje
- Tooltip con cantidad y % del total

**7D — `LineaTendencia.tsx`**

Props: `data: Array<{ fecha: string; pct_cumplimiento: number; errores_proceso: number }>`
- LineChart con dos líneas: cumplimiento (brand-teal) y errores (brand-red)
- Eje X: fechas formateadas
- ReferenceLine en Y=85 (meta de cumplimiento) con label "Meta 85%"
- Tooltip personalizado mostrando fecha + ambos valores

---

## BLOQUE 7 — PÁGINAS

---

### TAREA 8: Página — Dashboard Principal (KPIs Globales)

Archivo: `src/modules/dashboard/pages/DashboardPrincipal.tsx`

**Layout:**
```
[Row 1: 5 KPI Cards]
  - Total Tickets Gestionados  (IconTicket)        → sin clasificación, brand-teal
  - % Cumplimiento SLA         (IconTarget)        → clasificacion por cumplimiento
  - Usuarios Activos           (IconUsers)         → sin clasificación, brand-blue
  - Errores de Proceso         (IconAlertTriangle) → clasificacion por errores (invertido)
  - Tiempo Promedio Global     (IconClock)         → sin clasificación, brand-teal

[Row 2: 2 columnas]
  Columna izquierda (60%):
    Card "Resumen por Regional" → tabla simple con top 5 regionales
    Columna: Regional | Tickets | % Cumplimiento (con ClasificacionDot) | Tiempo Prom
  
  Columna derecha (40%):
    Card "Estado General":
    - Top Regional: [nombre]
    - Total Regionales activas: [n]
    - Tickets únicos: [n]
    - Tiempo total invertido: [n hrs]
    - Última actualización: [fecha]
```

Hook a usar: `useKpis()`, `useRegionales()`
Mostrar `LoadingSkeleton` mientras carga.
Si hay error, mostrar `EmptyState` con mensaje y botón reintentar.

---

### TAREA 9: Página — Ranking de Usuarios

Archivo: `src/modules/dashboard/pages/RankingUsuarios.tsx`

**Layout:**
```
[Header con filtros en una fila]
  - FiltroRegional (react-select)
  - Input búsqueda por nombre (react-hook-form)
  - Selector de filas por página: 10 | 25 | 50 (react-select)
  - Botón "Exportar Excel" → useExport()

[DataTable con columnas:]
  # Ranking | Usuario | Regional | Rol | Tickets | % SLA | % Error | T.Prom | Score | Estado

Columna Score: usar <ScoreBadge score={row.score_total} />
Columna Estado: usar <ClasificacionDot clasificacion={row.clasificacion} />
Columna Tiempo Prom: formatHoras(row.tiempo_promedio)
Row clickeable → navega a /dashboard/usuario/:id

[Footer: Pagination]
```

Filtros implementados en cliente (filtrar el array devuelto):
- Por regional: filter por `row.regional === selectedRegional`
- Por nombre: filter por `row.usuario_nombre.toLowerCase().includes(search)`

Hook: `useRanking(limit, page)`

---

### TAREA 10: Página — Análisis por Regional

Archivo: `src/modules/dashboard/pages/Regionales.tsx`

**Layout:**
```
[Row 1: 3 KPI Cards de resumen]
  - Total Regionales activas
  - Regional con mejor % SLA (nombre + valor)
  - Regional con peor % SLA  (nombre + valor)

[DataTable con columnas:]
  Regional | Usuarios | Total Tickets | A Tiempo | Atrasados |
  % Cumplimiento | % Error | Tiempo Prom | Estado

Cada fila tiene color de fondo suave según clasificacion:
  verde → bg-green-50 | amarillo → bg-yellow-50 | rojo → bg-red-50

[Debajo de la tabla]
  BarChart simple: regionales en X, pct_cumplimiento en Y
  Línea de referencia en 85% (meta)
  Colores de barras según clasificacion de cada regional
```

Hook: `useRegionales()`

---

### TAREA 11: Página — Mapa de Calor

Archivo: `src/modules/dashboard/pages/MapaCalor.tsx`

**Layout:**
```
[Filtro Regional en header]
  FiltroRegional (react-select) → actualiza query param

[Tabla de mapa de calor — el corazón de la página]
Columnas: Usuario | Regional | Tickets | % SLA | % Errores Totales | T.Promedio | Score

Reglas de color de celda (aplicar con estilos inline en la celda):
  - Celda "% SLA":
      >= 90% → bg:#C6EFCE text:#006100
      >= 75% → bg:#FFEB9C text:#9C6500
      < 75%  → bg:#FFC7CE text:#C00000
  
  - Celda "% Errores Totales":
      <= 5%  → bg:#C6EFCE text:#006100
      <= 15% → bg:#FFEB9C text:#9C6500
      > 15%  → bg:#FFC7CE text:#C00000
  
  - Celda "T.Promedio":
      Calcular percentiles del array completo
      Percentil 0-33 → verde | 34-66 → amarillo | 67-100 → rojo
  
  - Celda "Score": usar ScoreBadge

Filas agrupadas visualmente por regional:
  Primera fila de cada regional tiene un separador/header de sección
  con fondo brand-blue y texto blanco mostrando el nombre de la regional
```

Hook: `useMapaCalor(regional)`

---

### TAREA 12: Página — Análisis por Categoría

Archivo: `src/modules/dashboard/pages/Categorias.tsx`

**Layout:**
```
[DataTable con columnas:]
  Categoría | Tickets | Total Pasos | Pasos/Ticket | Duración Prom |
  Duración Máx | % Cumplimiento | % Con Novedad | Estado

Columna "Pasos/Ticket": número con tooltip explicando "mayor valor = flujo más complejo"
Columna "% Con Novedad": color según getClasificacionErrores (invertido)
Columna "Estado": ClasificacionDot

[Debajo]
  BarChart horizontal: categorias en Y, duracion_promedio en X
  Colores de barra según clasificacion
  Tooltip con pasos_por_ticket y pct_con_novedad
```

Hook: `useCategorias()`

---

### TAREA 13: Página — Cuellos de Botella

Archivo: `src/modules/dashboard/pages/CuellosBottleneck.tsx`

**Layout:**
```
[Header con selector de cantidad]
  "Mostrar top" + react-select [10 | 20 | 30 | 50]

[Row: 2 columnas]
  Columna izquierda (55%):
    <BarChartCuellos data={data} />
    (Gráfico de barras horizontal, paso_flujo vs duracion_promedio)

  Columna derecha (45%):
    DataTable con columnas:
    Paso | Ocurrencias | Tickets Únicos | Dur.Prom | % Atrasos | Severidad
    
    Columna Severidad: badge coloreado ('CRÍTICO' rojo | 'MODERADO' amarillo | 'NORMAL' verde)
    Ordenado por duracion_promedio DESC

[Footer: Leyenda]
  🔴 Crítico: duración promedio ≥ 100 hrs
  🟡 Moderado: duración promedio ≥ 50 hrs  
  🟢 Normal: duración promedio < 50 hrs
```

Hook: `useCuellos(limit)`

---

### TAREA 14: Página — Distribución de Tiempos

Archivo: `src/modules/dashboard/pages/DistribucionTiempos.tsx`

**Layout:**
```
[Row 1: 4 KPI Cards con estadísticas descriptivas]
  - Media Global     → formatHoras(estadisticas.media)
  - Mínimo           → formatHoras(estadisticas.minimo)
  - Máximo           → formatHoras(estadisticas.maximo)
  - Desv. Estándar   → formatHoras(estadisticas.desviacion_estandar)

[Row 2: Gráfico principal]
  <HistogramaTiempos data={rangos} />
  (Barras de cantidad + línea de % acumulado)
  Ancho completo

[Row 3: Tabla de rangos]
  DataTable:
  Rango | Cantidad | % del Total | % Acumulado
  
  Barra de progreso visual en columna "% del Total":
    <div style={{ width: `${row.pct_total}%` }} className="h-2 bg-brand-teal rounded" />
```

Hook: `useDistribucion()`

---

### TAREA 15: Página — Top & Bottom Performers

Archivo: `src/modules/dashboard/pages/TopPerformers.tsx`

**Layout:**
```
[Toggle en header]
  Botones: [🏆 TOP 10] [⚠️ NECESITAN APOYO]
  Estilo: botón activo con fondo brand-blue texto blanco

[Cuando type = 'top']
  Tabla con podio visual:
  Posición 1 → icono medalla dorada (IconMedal)
  Posición 2 → icono medalla plateada
  Posición 3 → icono medalla bronce
  Posiciones 4-10 → número normal

[Cuando type = 'bottom']
  Tabla con ícono IconAlertCircle en rojo para cada usuario
  Nota informativa: "Usuarios con mínimo 10 tickets gestionados"

[Columnas en ambos casos:]
  # | Usuario | Regional | Tickets | % SLA | % Error | T.Prom | Score
  
  Fila clickeable → navega a /dashboard/usuario/:id
```

Estado local con `useState` para el toggle top/bottom.
Hook: `useTopPerformers(type, 10)`

---

### TAREA 16: Página — Análisis de Novedades

Archivo: `src/modules/dashboard/pages/Novedades.tsx`

**Layout:**
```
[Row 1: 2 columnas]
  Columna izquierda (45%):
    Card "Distribución por Tipo"
    <PieNovedades data={distribucion_tipos} />
    Debajo: tabla pequeña con tipo | cantidad | %

  Columna derecha (55%):
    Card "Usuarios con más Novedades"
    DataTable columnas:
    Usuario | Regional | Total Nov. | Tickets Afect. | % Tickets | Estado
    
    Columna "% Tickets": color según getClasificacionNovedades
    Columna "Estado": ClasificacionDot
    Limite: top 15

[Nota informativa al pie]
  "Una novedad puede ser Error de Proceso o Error Informativo. 
   Los usuarios con ≥30% de tickets con novedades requieren atención."
```

Hook: `useNovedades()`

---

### TAREA 17: Página — Detalle de Usuario

Archivo: `src/modules/dashboard/pages/DetalleUsuario.tsx`

Recibe `id` de `useParams()` de react-router-dom v7.

**Layout:**
```
[Header con breadcrumb]
  Dashboard > Ranking > {usuario_nombre}
  Botón "← Volver"

[Row 1: Tarjeta de perfil + Score grande]
  Lado izquierdo:
    Avatar con iniciales (fondo brand-blue)
    Nombre completo
    Rol | Cargo | Regional
    Ranking actual: #X de Y usuarios
  
  Lado derecho:
    Score total grande centrado (tamaño 72px)
    Color del score: verde/amarillo/rojo
    ScoreGauge visual (arco semicircular usando SVG simple):
      Arco gris de fondo
      Arco coloreado proporcional al score
      Texto del score en el centro

[Row 2: 4 KPI Cards]
  - Tickets Gestionados
  - % Cumplimiento SLA  (con clasificación)
  - % Error Proceso     (con clasificación invertida)
  - Tiempo Promedio     (formatHoras)

[Row 3: Tabla "Desempeño por Paso de Flujo"]
  Columnas: Paso de Flujo | Veces Asignado | Duración Prom | % Cumplimiento | Estado
  Ordenado por veces_asignado DESC
  Máx 10 filas visibles (scroll interno si hay más)
```

ScoreGauge (SVG simple — no instalar librería nueva):
```typescript
// Semicírculo: 0-180 grados mapeado a 0-100 de score
const angulo = (score / 100) * 180;
const x = 100 + 80 * Math.cos(((180 + angulo) * Math.PI) / 180);
const y = 100 + 80 * Math.sin(((180 + angulo) * Math.PI) / 180);
// Usar path SVG con arc
```

Hooks: `useDetalleUsuario(id)`, `usePasosUsuario(id)`

---

## BLOQUE 8 — RUTAS Y NAVEGACIÓN

---

### TAREA 18: Configurar rutas del dashboard

En `src/routes/` agregar las rutas del módulo dashboard.
Usar el sistema de rutas existente (react-router-dom v7):

```typescript
// Rutas a agregar:
/dashboard                           → DashboardPrincipal
/dashboard/ranking                   → RankingUsuarios
/dashboard/regionales                → Regionales
/dashboard/mapa-calor                → MapaCalor
/dashboard/categorias                → Categorias
/dashboard/cuellos-botella           → CuellosBottleneck
/dashboard/distribucion-tiempos      → DistribucionTiempos
/dashboard/top-performers            → TopPerformers
/dashboard/novedades                 → Novedades
/dashboard/usuario/:id               → DetalleUsuario

// Todas protegidas con el AuthGuard/ProtectedRoute que ya existe en el proyecto
// Aplicar lazy loading con React.lazy() para cada página
```

---

### TAREA 19: Agregar Dashboard al Sidebar existente

En `src/shared/` (o donde esté el Sidebar actual del proyecto), agregar la sección de Dashboard con los ítems de navegación:

```typescript
// Ítem principal con submenú colapsable
{
  label: 'Dashboard',
  icono: IconChartBar,          // @tabler/icons-react
  path: '/dashboard',
  submenu: [
    { label: 'KPIs Globales',          path: '/dashboard',                 icono: IconLayoutDashboard },
    { label: 'Ranking Usuarios',       path: '/dashboard/ranking',         icono: IconTrophy },
    { label: 'Por Regional',           path: '/dashboard/regionales',      icono: IconMap },
    { label: 'Mapa de Calor',          path: '/dashboard/mapa-calor',      icono: IconFlame },
    { label: 'Por Categoría',          path: '/dashboard/categorias',      icono: IconCategory },
    { label: 'Cuellos de Botella',     path: '/dashboard/cuellos-botella', icono: IconAlertTriangle },
    { label: 'Distribución Tiempos',   path: '/dashboard/distribucion-tiempos', icono: IconTimeline },
    { label: 'Top Performers',         path: '/dashboard/top-performers',  icono: IconMedal },
    { label: 'Novedades',              path: '/dashboard/novedades',       icono: IconBug },
  ]
}
```

Ítem activo: fondo `brand-teal` con texto blanco.
Ítem hover: fondo `brand-accent` con texto blanco.

---

## BLOQUE 9 — TESTS

---

### TAREA 20: Tests con Vitest + Testing Library

Ubicación: `src/modules/dashboard/__tests__/`

```typescript
// colores.test.ts
import { getClasificacionCumplimiento, getClasificacionErrores } from '../utils/colores';

describe('getClasificacionCumplimiento', () => {
  it('>= 90 → verde',    () => expect(getClasificacionCumplimiento(95)).toBe('verde'));
  it('>= 75 → amarillo', () => expect(getClasificacionCumplimiento(80)).toBe('amarillo'));
  it('< 75  → rojo',     () => expect(getClasificacionCumplimiento(60)).toBe('rojo'));
  it('exactamente 90 → verde',    () => expect(getClasificacionCumplimiento(90)).toBe('verde'));
  it('exactamente 75 → amarillo', () => expect(getClasificacionCumplimiento(75)).toBe('amarillo'));
});

describe('getClasificacionErrores (invertido)', () => {
  it('<= 5  → verde',    () => expect(getClasificacionErrores(3)).toBe('verde'));
  it('<= 15 → amarillo', () => expect(getClasificacionErrores(10)).toBe('amarillo'));
  it('> 15  → rojo',     () => expect(getClasificacionErrores(20)).toBe('rojo'));
});

// formatters.test.ts
import { formatHoras, formatPct } from '../utils/formatters';

describe('formatHoras', () => {
  it('< 1h → minutos',  () => expect(formatHoras(0.5)).toBe('30min'));
  it('< 24h → horas',   () => expect(formatHoras(8)).toBe('8.0h'));
  it('< 168h → días',   () => expect(formatHoras(48)).toBe('2.0 días'));
  it('>= 168h → semanas',() => expect(formatHoras(336)).toBe('2.0 sem'));
});

// ScoreBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { ScoreBadge } from '../components/ui/ScoreBadge';

describe('ScoreBadge', () => {
  it('muestra el score formateado', () => {
    render(<ScoreBadge score={91.5} />);
    expect(screen.getByText('91.5')).toBeInTheDocument();
  });
  it('aplica clase verde para score >= 90', () => {
    const { container } = render(<ScoreBadge score={92} />);
    expect(container.firstChild).toHaveClass('bg-green-100');
  });
});
```

---

## RESUMEN DE PÁGINAS Y SUS HOOKS

| Página | Archivo | Hook principal |
|---|---|---|
| KPIs Globales | DashboardPrincipal.tsx | `useKpis()` + `useRegionales()` |
| Ranking | RankingUsuarios.tsx | `useRanking(limit, page)` |
| Regionales | Regionales.tsx | `useRegionales()` |
| Mapa de Calor | MapaCalor.tsx | `useMapaCalor(regional?)` |
| Categorías | Categorias.tsx | `useCategorias()` |
| Cuellos de Botella | CuellosBottleneck.tsx | `useCuellos(limit)` |
| Distribución Tiempos | DistribucionTiempos.tsx | `useDistribucion()` |
| Top Performers | TopPerformers.tsx | `useTopPerformers(type, 10)` |
| Novedades | Novedades.tsx | `useNovedades()` |
| Detalle Usuario | DetalleUsuario.tsx | `useDetalleUsuario(id)` + `usePasosUsuario(id)` |

## COLORES RECHARTS — REFERENCIA RÁPIDA

```typescript
export const CHART_COLORS = {
  primary:  '#43BBCA', // brand-teal  → barras principales
  secondary:'#2B378A', // brand-blue  → líneas secundarias
  verde:    '#22c55e',
  amarillo: '#eab308',
  rojo:     '#ef4444',
  gris:     '#94a3b8',
};
```
