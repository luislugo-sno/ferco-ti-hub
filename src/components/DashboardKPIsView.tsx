import React, { useId, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertOctagon,
  Layers,
  Download,
  Users,
  Filter,
  KeyRound,
  Check,
  Clock,
  Flame,
  CalendarRange,
  Timer,
  Building2,
  SplitSquareVertical,
} from 'lucide-react';
import {
  DEFAULT_FORM_SCHEMA,
  EQUIPO_TI_BI,
  ESTADOS_TICKET,
  estaEstancadoProveedor,
  formatCodigoTicket,
  FormSchemaConfig,
  getHorasSinMoverse,
  getPrioridadMeta,
  getSedeMeta,
  parseUbicacion,
  TicketTI,
} from '../types/tickets';
import { SpecialistBadge } from './BrandSvgElements';
import { getExpectedPin, updateGlobalPin } from './PinAuthDialog';
import { TicketModalDialog } from './TicketModalDialog';

interface DashboardKPIsViewProps {
  tickets: TicketTI[];
  formSchema?: FormSchemaConfig;
  onUpdateTicket: (
    id: string,
    changes: Partial<
      Pick<
        TicketTI,
        | 'estado'
        | 'asignado_a'
        | 'nota_publica'
        | 'notas_tecnicas'
        | 'impacto'
        | 'urgencia'
        | 'categoria'
        | 'titulo'
        | 'descripcion'
        | 'departamento_tienda'
      >
    >
  ) => Promise<void>;
}

export type RangoFechaKPI =
  | 'ESTE_MES'
  | 'MES_ANTERIOR'
  | 'ULTIMOS_30_DIAS'
  | 'HISTORICO';

const RANGO_FECHA_OPTIONS: Array<{ value: RangoFechaKPI; label: string }> = [
  { value: 'ESTE_MES', label: 'Este Mes' },
  { value: 'MES_ANTERIOR', label: 'Mes Anterior' },
  { value: 'ULTIMOS_30_DIAS', label: 'Últimos 30 días' },
  { value: 'HISTORICO', label: 'Histórico Completo' },
];

function isTicketInDateRange(ticket: TicketTI, rango: RangoFechaKPI): boolean {
  if (rango === 'HISTORICO') return true;
  if (!ticket?.created_at) return true;

  const createdDate = new Date(ticket.created_at);
  const createdMs = createdDate.getTime();
  if (Number.isNaN(createdMs)) return true;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (rango === 'ESTE_MES') {
    return (
      createdDate.getFullYear() === currentYear &&
      createdDate.getMonth() === currentMonth
    );
  }

  if (rango === 'MES_ANTERIOR') {
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    return (
      createdDate.getFullYear() === prevMonthDate.getFullYear() &&
      createdDate.getMonth() === prevMonthDate.getMonth()
    );
  }

  if (rango === 'ULTIMOS_30_DIAS') {
    const hace30DiasMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return createdMs >= hace30DiasMs;
  }

  return true;
}

export const DashboardKPIsView: React.FC<DashboardKPIsViewProps> = ({
  tickets,
  formSchema = DEFAULT_FORM_SCHEMA,
  onUpdateTicket,
}) => {
  const filterEstadoId = useId();
  const filterCatId = useId();
  const filterDeptoId = useId();
  const filterSedeId = useId();
  const filterAsignadoId = useId();
  const newPinInputId = useId();

  // Filtro Superior de Rango de Fechas (por defecto Histórico Completo o Últimos 30 días)
  const [rangoFecha, setRangoFecha] = useState<RangoFechaKPI>('HISTORICO');

  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('TODOS');
  const [filtroSede, setFiltroSede] = useState<string>('TODAS');
  const [filtroAsignado, setFiltroAsignado] = useState<string>('TODOS');
  const [selectedTicket, setSelectedTicket] = useState<TicketTI | null>(null);

  // Configuración rápida de PIN Global en Supabase app_config
  const [showPinConfig, setShowPinConfig] = useState(false);
  const [newPinValue, setNewPinValue] = useState(getExpectedPin());
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinSavedMsg, setPinSavedMsg] = useState<string | null>(null);

  // 1. Tickets filtrados por el Rango de Fechas seleccionado
  const ticketsEnRango = useMemo(
    () => tickets.filter((t) => isTicketInDateRange(t, rangoFecha)),
    [tickets, rangoFecha]
  );

  // 2. Cálculos de KPIs Ejecutivos sobre el rango seleccionado
  const ticketsActivos = ticketsEnRango.filter((t) => t.estado !== 'Resuelto');
  const ticketsCriticosActivos = ticketsActivos.filter(
    (t) => (Number(t.score_prioridad) || 0) >= 6
  );

  const ticketsResueltosRango = ticketsEnRango.filter((t) => t.estado === 'Resuelto');

  const ticketsBloqueadosTerceros = ticketsEnRango.filter(
    (t) => t.estado === 'Esperando Proveedor/Tercero'
  );
  const ticketsBloqueadosMas48h = ticketsBloqueadosTerceros.filter((t) =>
    estaEstancadoProveedor(t)
  );

  // 3. Tiempo Medio de Resolución (MTTR) calculado con la diferencia entre created_at y updated_at de tickets en estado 'Resuelto'
  const mttrStats = useMemo(() => {
    const diffsHours: number[] = [];
    for (const t of ticketsResueltosRango) {
      const startMs = t.created_at ? new Date(t.created_at).getTime() : Number.NaN;
      const endRaw = t.updated_at || t.fecha_resolucion || t.created_at;
      const endMs = endRaw ? new Date(endRaw).getTime() : Number.NaN;

      if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs >= startMs) {
        const hours = (endMs - startMs) / (1000 * 60 * 60);
        diffsHours.push(hours);
      }
    }

    if (diffsHours.length === 0) {
      return { avgHours: null, count: 0, formatted: '—', detail: 'Sin cierres en el periodo' };
    }

    const sum = diffsHours.reduce((acc, h) => acc + h, 0);
    const avg = sum / diffsHours.length;
    const rounded = Math.round(avg * 10) / 10;

    let detail = `Promedio sobre ${diffsHours.length} ticket(s) resuelto(s)`;
    if (rounded >= 24) {
      const days = Math.round((rounded / 24) * 10) / 10;
      detail = `~${days} día(s) (${diffsHours.length} resueltos)`;
    }

    return {
      avgHours: rounded,
      count: diffsHours.length,
      formatted: `${rounded} h`,
      detail,
    };
  }, [ticketsResueltosRango]);

  // 4. Comparativa visual Soporte Técnico / TI vs Consultas sobre Odoo
  const comparativaTipo = useMemo(() => {
    const total = ticketsEnRango.length;
    const odooList = ticketsEnRango.filter(
      (t) =>
        t.tipo_solicitud === 'Consultas sobre Odoo' ||
        t.categoria === 'Odoo ERP / TPV Tiendas'
    );
    const tiList = ticketsEnRango.filter(
      (t) =>
        t.tipo_solicitud !== 'Consultas sobre Odoo' &&
        t.categoria !== 'Odoo ERP / TPV Tiendas'
    );

    const pctTI = total > 0 ? Math.round((tiList.length / total) * 100) : 0;
    const pctOdoo = total > 0 ? 100 - pctTI : 0;

    return {
      total,
      tiCount: tiList.length,
      tiActivos: tiList.filter((t) => t.estado !== 'Resuelto').length,
      tiResueltos: tiList.filter((t) => t.estado === 'Resuelto').length,
      pctTI,
      odooCount: odooList.length,
      odooActivos: odooList.filter((t) => t.estado !== 'Resuelto').length,
      odooResueltos: odooList.filter((t) => t.estado === 'Resuelto').length,
      pctOdoo,
    };
  }, [ticketsEnRango]);

  // 5. Ranking Top 5 de departamento_tienda con mayor volumen de reportes
  const top5Ubicaciones = useMemo(() => {
    const countsMap = new Map<
      string,
      { total: number; activos: number; resueltos: number }
    >();

    for (const t of ticketsEnRango) {
      const key = (t.departamento_tienda || 'ADMINISTRACIÓN').trim();
      const prev = countsMap.get(key) || { total: 0, activos: 0, resueltos: 0 };
      prev.total += 1;
      if (t.estado === 'Resuelto') {
        prev.resueltos += 1;
      } else {
        prev.activos += 1;
      }
      countsMap.set(key, prev);
    }

    const totalPeriodo = ticketsEnRango.length;
    return Array.from(countsMap.entries())
      .map(([ubicacion, stats]) => ({
        ubicacion,
        ...stats,
        pct: totalPeriodo > 0 ? Math.round((stats.total / totalPeriodo) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [ticketsEnRango]);

  const todasLasCategorias = Array.from(
    new Set([
      ...formSchema.categorias_ti,
      ...formSchema.modulos_odoo,
      ...tickets.map((t) => t.categoria),
    ])
  );

  const sedesMetaList = formSchema.sedes.map((s) => getSedeMeta(s));

  // Historial filtrado para tabla y exportación CSV/Excel (aplica rangoFecha + filtros de tabla)
  const historialFiltrado = ticketsEnRango.filter((t) => {
    if (filtroEstado !== 'TODOS' && t.estado !== filtroEstado) return false;
    if (filtroCategoria !== 'TODAS' && t.categoria !== filtroCategoria) return false;
    if (filtroAsignado !== 'TODOS' && t.asignado_a !== filtroAsignado) return false;

    const ubic = parseUbicacion(t.departamento_tienda);
    if (filtroDepartamento !== 'TODOS' && ubic.departamento !== filtroDepartamento) {
      return false;
    }
    if (filtroSede !== 'TODAS' && ubic.sede !== filtroSede) {
      return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Rango Reporte',
      'Codigo Ticket',
      'Tipo Solicitud',
      'Fecha Creacion',
      'Ultima Actualizacion',
      'Solicitante',
      'Departamento / Area',
      'Sede Comercial / Centro',
      'Categoria / Modulo',
      'Titulo',
      'Descripcion',
      'Impacto (1-3)',
      'Urgencia (1-3)',
      'Score Prioridad',
      'Nivel SLA',
      'Estado Actual',
      'Asignado A',
      'Tiempo Resolucion (Horas)',
      'Nota Publica',
      'Notas Tecnicas Internas',
    ];

    const escapeCsv = (val: unknown): string => {
      const str = val === null || val === undefined ? '' : String(val);
      const cleaned = str.replace(/"/g, '""');
      return `"${cleaned}"`;
    };

    const rangoLabel =
      RANGO_FECHA_OPTIONS.find((r) => r.value === rangoFecha)?.label || 'Histórico';

    const rows = historialFiltrado.map((t) => {
      const meta = getPrioridadMeta(t.score_prioridad);
      const ubic = parseUbicacion(t.departamento_tienda);
      let mttrTicket = 'En curso';
      if (t.estado === 'Resuelto' && t.created_at) {
        const sMs = new Date(t.created_at).getTime();
        const eMs = new Date(t.updated_at || t.fecha_resolucion || t.created_at).getTime();
        if (!Number.isNaN(sMs) && !Number.isNaN(eMs) && eMs >= sMs) {
          mttrTicket = String(Math.round(((eMs - sMs) / (1000 * 60 * 60)) * 10) / 10);
        }
      }

      return [
        rangoLabel,
        formatCodigoTicket(t.codigo_ticket),
        t.tipo_solicitud || 'Soporte Técnico / TI',
        new Date(t.created_at).toLocaleString('es-VE'),
        new Date(t.updated_at || t.created_at).toLocaleString('es-VE'),
        t.solicitante_nombre,
        ubic.departamento,
        ubic.sede,
        t.categoria,
        t.titulo,
        t.descripcion,
        t.impacto,
        t.urgencia,
        t.score_prioridad,
        meta.codigoSLA,
        t.estado,
        t.asignado_a,
        mttrTicket,
        t.nota_publica || '',
        t.notas_tecnicas || '',
      ]
        .map(escapeCsv)
        .join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute(
      'download',
      `Reporte_BI_TI_Ferco_${rangoFecha}_${dateStamp}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinValue.trim().length < 4) return;
    setIsSavingPin(true);
    setPinSavedMsg(null);
    try {
      const res = await updateGlobalPin(newPinValue.trim());
      setPinSavedMsg(
        res.mode === 'supabase'
          ? 'PIN actualizado globalmente en Supabase (app_config) para todos los dispositivos.'
          : res.error || 'PIN actualizado localmente.'
      );
      setTimeout(() => {
        setPinSavedMsg(null);
        setShowPinConfig(false);
      }, 3000);
    } finally {
      setIsSavingPin(false);
    }
  };

  const activeModalTicket = selectedTicket
    ? tickets.find((t) => t.id === selectedTicket.id) || selectedTicket
    : null;

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* CABECERA EJECUTIVA + FILTRO DE RANGO DE FECHAS + EXPORTACIÓN */}
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs sm:px-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Reporte Ejecutivo de Gestión ITSM • Grupo Comercializadora Ferco
            </span>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Indicadores de Carga Operativa, MTTR y Productividad BI/TI
            </h2>
            <p className="text-xs text-slate-600">
              Métricas recalculadas dinámicamente según el periodo seleccionado ({ticketsEnRango.length}{' '}
              requerimientos en el rango).
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => setShowPinConfig((p) => !p)}
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:h-9 sm:min-h-0 sm:w-auto"
            >
              <KeyRound className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>PIN Global</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 sm:h-9 sm:min-h-0 sm:w-auto"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Exportar Excel / CSV ({historialFiltrado.length})</span>
            </button>
          </div>
        </div>

        {/* Selector Superior de Rango de Fechas */}
        <div className="mt-3.5 flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <CalendarRange className="h-4 w-4 text-blue-700" aria-hidden="true" />
            <span>Periodo de Análisis y Exportación:</span>
          </div>

          <div
            role="group"
            aria-label="Filtro de rango de fechas"
            className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center"
          >
            {RANGO_FECHA_OPTIONS.map((opt) => {
              const active = rangoFecha === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRangoFecha(opt.value)}
                  className={`min-h-[38px] rounded-sm border px-3 py-1.5 text-xs font-bold transition sm:min-h-0 ${
                    active
                      ? 'border-blue-700 bg-blue-700 text-white shadow-xs'
                      : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel desplegable de configuración de PIN Global en app_config */}
      {showPinConfig && (
        <form
          onSubmit={handleSavePin}
          className="space-y-3 rounded-md border border-slate-300 bg-white p-4 shadow-xs"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 sm:max-w-xs">
              <label
                htmlFor={newPinInputId}
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Nuevo PIN Global en Supabase (app_config • mín. 4 dígitos)
              </label>
              <input
                id={newPinInputId}
                type="text"
                inputMode="numeric"
                minLength={4}
                required
                value={newPinValue}
                onChange={(e) => setNewPinValue(e.target.value)}
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-3 font-mono text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingPin}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 disabled:opacity-60 sm:h-9 sm:min-h-0 sm:w-auto"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isSavingPin ? 'Sincronizando...' : 'Guardar PIN Global'}</span>
            </button>
          </div>

          <div aria-live="polite">
            {pinSavedMsg && (
              <div className="flex items-center gap-2 rounded-sm border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <span>{pinSavedMsg}</span>
              </div>
            )}
          </div>
        </form>
      )}

      {/* 1. TARJETAS RESUMEN DE KPIs (INCLUYENDO MTTR) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Tickets Activos en el Rango */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tickets Activos (Periodo)
            </span>
            <Activity className="h-4 w-4 text-blue-700" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900">
              {ticketsActivos.length}
            </span>
            <span className="text-xs text-slate-500">
              de {ticketsEnRango.length} en el rango
            </span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2 py-0.5 font-bold text-red-800">
              <Flame className="h-3 w-3 text-red-600" aria-hidden="true" />
              {ticketsCriticosActivos.length} Críticos Activos (P1/P2)
            </span>
          </div>
        </div>

        {/* Card 2: Tickets Resueltos y Efectividad en el Rango */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tickets Resueltos
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-emerald-700">
              {ticketsResueltosRango.length}
            </span>
            <span className="text-xs text-slate-500">cerrados en el periodo</span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 text-xs text-slate-600">
            Tasa de resolución:{' '}
            <strong className="font-mono text-slate-900">
              {ticketsEnRango.length > 0
                ? Math.round(
                    (ticketsResueltosRango.length / ticketsEnRango.length) * 100
                  )
                : 0}
              %
            </strong>
          </div>
        </div>

        {/* Card 3: Tiempo Medio de Resolución (MTTR: created_at -> updated_at) */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tiempo Medio Resolución (MTTR)
            </span>
            <Timer className="h-4 w-4 text-blue-700" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-blue-700">
              {mttrStats.formatted}
            </span>
            <span className="text-xs text-slate-500">promedio (creación a cierre)</span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 text-xs text-slate-600">
            <span>{mttrStats.detail}</span>
          </div>
        </div>

        {/* Card 4: Tareas Bloqueadas por Terceros */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bloqueadas por Terceros
            </span>
            <AlertOctagon className="h-4 w-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-amber-700">
              {ticketsBloqueadosTerceros.length}
            </span>
            <span className="text-xs text-slate-500">esperando ISP / Proveedor</span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 text-xs">
            {ticketsBloqueadosMas48h.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-sm border border-red-300 bg-red-50 px-2 py-0.5 font-bold text-red-800">
                <Clock className="h-3 w-3 text-red-600" aria-hidden="true" />
                {ticketsBloqueadosMas48h.length} supera(n) 48 horas
              </span>
            ) : (
              <span className="font-medium text-emerald-700">
                Sin tickets estancados (&gt;48h)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. COMPARATIVA SOPORTE TI VS CONSULTAS ODOO + TOP 5 UBICACIONES CON MAYOR VOLUMEN */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Comparativa Visual: Soporte Técnico / TI vs Consultas sobre Odoo */}
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs lg:col-span-5">
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <SplitSquareVertical className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>Comparativa: Soporte TI vs Consultas sobre Odoo</span>
            </h3>
            <span className="font-mono text-[11px] font-semibold text-slate-500">
              {comparativaTipo.total} total
            </span>
          </div>

          {/* Barra segmentada dual */}
          <div className="mb-4">
            <div className="flex h-3.5 w-full overflow-hidden rounded-sm border border-slate-200 bg-slate-100">
              <div
                className="h-full bg-blue-700 transition-all duration-300"
                style={{ width: `${comparativaTipo.pctTI}%` }}
                title={`Soporte Técnico / TI: ${comparativaTipo.pctTI}%`}
              />
              <div
                className="h-full bg-slate-700 transition-all duration-300"
                style={{ width: `${comparativaTipo.pctOdoo}%` }}
                title={`Consultas sobre Odoo: ${comparativaTipo.pctOdoo}%`}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-blue-800">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-700" />
                Soporte Técnico / TI ({comparativaTipo.pctTI}%)
              </span>
              <span className="flex items-center gap-1.5 text-slate-800">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" />
                Consultas sobre Odoo ({comparativaTipo.pctOdoo}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
              <span className="text-[11px] font-bold uppercase text-blue-800">
                Soporte Técnico / TI
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-slate-900">
                  {comparativaTipo.tiCount}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {comparativaTipo.pctTI}%
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-1.5 text-[11px]">
                <span className="text-blue-700 font-semibold">
                  {comparativaTipo.tiActivos} activos
                </span>
                <span className="text-emerald-700 font-semibold">
                  {comparativaTipo.tiResueltos} resueltos
                </span>
              </div>
            </div>

            <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
              <span className="text-[11px] font-bold uppercase text-slate-800">
                Consultas sobre Odoo
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-slate-900">
                  {comparativaTipo.odooCount}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {comparativaTipo.pctOdoo}%
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-1.5 text-[11px]">
                <span className="text-blue-700 font-semibold">
                  {comparativaTipo.odooActivos} activos
                </span>
                <span className="text-emerald-700 font-semibold">
                  {comparativaTipo.odooResueltos} resueltos
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Ranking Top 5 de departamento_tienda con mayor volumen de reportes */}
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs lg:col-span-7">
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Building2 className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>Top 5 Departamentos / Sedes con Mayor Volumen de Reportes</span>
            </h3>
            <span className="text-[11px] font-medium text-slate-500">
              Ranking por Demanda
            </span>
          </div>

          {top5Ubicaciones.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Sin reportes registrados en el rango de fechas seleccionado.
            </div>
          ) : (
            <div className="space-y-2.5">
              {top5Ubicaciones.map((item, idx) => (
                <div
                  key={item.ubicacion}
                  className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-white font-mono text-[10px] font-bold text-slate-800">
                        #{idx + 1}
                      </span>
                      <span className="truncate font-bold text-slate-900">
                        {item.ubicacion}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 font-mono text-[11px]">
                      <span className="font-bold text-slate-900">
                        {item.total} {item.total === 1 ? 'ticket' : 'tickets'}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-blue-700">{item.activos} act.</span>
                      <span className="text-emerald-700">{item.resueltos} res.</span>
                      <span className="text-slate-500">({item.pct}%)</span>
                    </div>
                  </div>

                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-sm bg-slate-200">
                    <div
                      className="h-full bg-blue-700 transition-all duration-300"
                      style={{ width: `${Math.max(item.pct, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 3. DESGLOSE EJECUTIVO: PERSONAL BI/TI (4 INTEGRANTES) Y CATEGORÍAS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Matriz de Carga de los 4 Integrantes BI/TI */}
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs lg:col-span-7">
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Users className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>Matriz de Carga Operativa por Personal BI/TI</span>
            </h3>
            <span className="text-[11px] font-medium text-slate-500">
              4 Integrantes Oficiales
            </span>
          </div>

          {/* Vista móvil (< sm): Tarjetas compactas sin desborde horizontal */}
          <div className="space-y-2 sm:hidden">
            {EQUIPO_TI_BI.map((miembro) => {
              const [nombrePersona, cargoPersona] = miembro.split(' - ');
              const delMiembro = ticketsEnRango.filter((t) => t.asignado_a === miembro);
              const enProgreso = delMiembro.filter(
                (t) => t.estado === 'En Progreso'
              ).length;
              const enCola = delMiembro.filter(
                (t) =>
                  t.estado === 'Bandeja de Entrada' || t.estado === 'En Cola'
              ).length;
              const enEspera = delMiembro.filter(
                (t) => t.estado === 'Esperando Proveedor/Tercero'
              ).length;
              const resueltos = delMiembro.filter(
                (t) => t.estado === 'Resuelto'
              ).length;

              return (
                <div
                  key={miembro}
                  className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SpecialistBadge nombre={miembro} size="md" />
                      <div>
                        <div className="font-bold text-slate-900">{nombrePersona}</div>
                        <div className="text-[10px] text-slate-500">{cargoPersona}</div>
                      </div>
                    </div>
                    <span className="rounded-sm border border-slate-300 bg-white px-2 py-0.5 font-mono font-bold text-slate-900">
                      {delMiembro.length} total
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1 border-t border-slate-200 pt-2 text-center text-[10px]">
                    <div>
                      <span className="block text-slate-500">Progreso</span>
                      <strong className="font-mono text-blue-700">{enProgreso}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">En Cola</span>
                      <strong className="font-mono text-slate-800">{enCola}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">Espera 3ro</span>
                      <strong className="font-mono text-amber-700">{enEspera}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500">Resueltos</span>
                      <strong className="font-mono text-emerald-700">{resueltos}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista Desktop/Tablet (sm+): Tabla ejecutiva */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                  <th className="px-3 py-2">Integrante / Cargo</th>
                  <th className="px-2.5 py-2 text-center">En Progreso</th>
                  <th className="px-2.5 py-2 text-center">En Cola / Triage</th>
                  <th className="px-2.5 py-2 text-center">Espera 3ros</th>
                  <th className="px-2.5 py-2 text-center">Resueltos</th>
                  <th className="px-2.5 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {EQUIPO_TI_BI.map((miembro) => {
                  const [nombrePersona, cargoPersona] = miembro.split(' - ');
                  const delMiembro = ticketsEnRango.filter(
                    (t) => t.asignado_a === miembro
                  );
                  const enProgreso = delMiembro.filter(
                    (t) => t.estado === 'En Progreso'
                  ).length;
                  const enCola = delMiembro.filter(
                    (t) =>
                      t.estado === 'Bandeja de Entrada' || t.estado === 'En Cola'
                  ).length;
                  const enEspera = delMiembro.filter(
                    (t) => t.estado === 'Esperando Proveedor/Tercero'
                  ).length;
                  const resueltos = delMiembro.filter(
                    (t) => t.estado === 'Resuelto'
                  ).length;

                  return (
                    <tr key={miembro} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <SpecialistBadge nombre={miembro} size="md" />
                          <div>
                            <div className="font-bold text-slate-900">{nombrePersona}</div>
                            <div className="text-[11px] text-slate-500">{cargoPersona}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-mono">
                        <span
                          className={`inline-block rounded-sm px-2 py-0.5 font-bold ${
                            enProgreso > 3
                              ? 'border border-red-300 bg-red-100 text-red-800'
                              : enProgreso > 0
                              ? 'border border-blue-200 bg-blue-50 text-blue-800'
                              : 'text-slate-500'
                          }`}
                        >
                          {enProgreso}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-mono font-semibold text-slate-700">
                        {enCola}
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-mono font-semibold text-amber-700">
                        {enEspera}
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-mono font-semibold text-emerald-700">
                        {resueltos}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-mono font-bold text-slate-900">
                        {delMiembro.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Distribución por Categoría */}
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs lg:col-span-5">
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Layers className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>Distribución por Categoría / Módulo</span>
            </h3>
          </div>

          <div className="space-y-3">
            {todasLasCategorias
              .filter((cat) => ticketsEnRango.some((t) => t.categoria === cat))
              .map((cat) => {
                const todosCat = ticketsEnRango.filter((t) => t.categoria === cat);
                const activosCat = todosCat.filter((t) => t.estado !== 'Resuelto');
                const resueltosCat = todosCat.filter((t) => t.estado === 'Resuelto');
                const pct =
                  ticketsEnRango.length > 0
                    ? Math.round((todosCat.length / ticketsEnRango.length) * 100)
                    : 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-semibold text-slate-800">{cat}</span>
                      <div className="flex shrink-0 items-center gap-1.5 font-mono text-[11px]">
                        <span className="font-bold text-blue-700">
                          {activosCat.length} act.
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-emerald-700">{resueltosCat.length} res.</span>
                        <span className="text-slate-500">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-sm border border-slate-200 bg-slate-100">
                      <div
                        className="h-full bg-blue-700 transition-all duration-300"
                        style={{ width: `${Math.max(pct, todosCat.length > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>

      {/* 4. TABLA / TARJETAS DE HISTORIAL Y AUDITORÍA DE TICKETS */}
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex flex-col justify-between gap-3 border-b border-slate-200 pb-3 xl:flex-row xl:items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Registro Maestro de Requerimientos (Toque cualquier registro para abrir ficha)
            </h3>
            <p className="text-[11px] text-slate-500">
              Filtre por estado, categoría, departamento, sede comercial o responsable antes
              de exportar a Excel/CSV.
            </p>
          </div>

          <search className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <Filter className="hidden h-3.5 w-3.5 text-slate-500 sm:block" aria-hidden="true" />

            <div>
              <label htmlFor={filterEstadoId} className="sr-only">
                Filtrar por estado
              </label>
              <select
                id={filterEstadoId}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="min-h-[40px] w-full rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 sm:h-8 sm:min-h-0"
              >
                <option value="TODOS">Todos los Estados</option>
                {ESTADOS_TICKET.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={filterCatId} className="sr-only">
                Filtrar por categoría
              </label>
              <select
                id={filterCatId}
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="min-h-[40px] w-full truncate rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 sm:h-8 sm:min-h-0 sm:max-w-[180px]"
              >
                <option value="TODAS">Todas las Categorías</option>
                {todasLasCategorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={filterDeptoId} className="sr-only">
                Filtrar por departamento
              </label>
              <select
                id={filterDeptoId}
                value={filtroDepartamento}
                onChange={(e) => setFiltroDepartamento(e.target.value)}
                className="min-h-[40px] w-full rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 sm:h-8 sm:min-h-0"
              >
                <option value="TODOS">Todos los Deptos.</option>
                {formSchema.departamentos.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={filterSedeId} className="sr-only">
                Filtrar por sede comercial
              </label>
              <select
                id={filterSedeId}
                value={filtroSede}
                onChange={(e) => setFiltroSede(e.target.value)}
                className="min-h-[40px] w-full truncate rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 sm:h-8 sm:min-h-0 sm:max-w-[175px]"
              >
                <option value="TODAS">Todas las Sedes</option>
                {sedesMetaList.map((s) => (
                  <option key={s.valor} value={s.valor}>
                    {s.nombreCorto}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label htmlFor={filterAsignadoId} className="sr-only">
                Filtrar por responsable
              </label>
              <select
                id={filterAsignadoId}
                value={filtroAsignado}
                onChange={(e) => setFiltroAsignado(e.target.value)}
                className="min-h-[40px] w-full truncate rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 sm:h-8 sm:min-h-0 sm:max-w-[195px]"
              >
                <option value="TODOS">Todo el Equipo BI/TI</option>
                {EQUIPO_TI_BI.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </search>
        </div>

        {/* Vista Móvil (< md): Tarjetas compactas verticales sin desbordamiento horizontal */}
        <div className="space-y-2 md:hidden">
          {historialFiltrado.length === 0 ? (
            <div className="rounded-sm border border-slate-200 p-6 text-center text-xs text-slate-500">
              No existen registros que coincidan con los criterios de filtrado en este
              periodo.
            </div>
          ) : (
            historialFiltrado.map((t) => {
              const meta = getPrioridadMeta(t.score_prioridad);
              const ubic = parseUbicacion(t.departamento_tienda);
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`cursor-pointer rounded-sm border border-slate-200 bg-white p-3 text-xs shadow-xs ${meta.borderClass}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-blue-700">
                      {formatCodigoTicket(t.codigo_ticket)}
                    </span>
                    <span
                      className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                    >
                      Score {t.score_prioridad} • {meta.nivel}
                    </span>
                  </div>
                  <div className="mt-1 font-bold text-slate-900">{t.titulo}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {ubic.departamento}
                    </span>
                    <span>•</span>
                    <span>{t.categoria}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px]">
                    <span className="rounded-sm border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-800">
                      {t.estado}
                    </span>
                    <span className="text-slate-600">
                      {t.asignado_a.split(' - ')[0]}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Vista Tablet/Desktop (md+): Tabla completa */}
        <div className="hidden overflow-x-auto rounded-sm border border-slate-200 md:block">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Prioridad</th>
                <th className="px-3 py-2.5">Asunto / Requerimiento</th>
                <th className="px-3 py-2.5">Categoría / Módulo</th>
                <th className="px-3 py-2.5">Departamento / Sede</th>
                <th className="px-3 py-2.5">Solicitante</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5">Asignado a</th>
                <th className="px-3 py-2.5">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No existen registros que coincidan con los criterios de filtrado en este
                    periodo.
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((t) => {
                  const meta = getPrioridadMeta(t.score_prioridad);
                  const estancado = estaEstancadoProveedor(t);
                  const ubic = parseUbicacion(t.departamento_tienda);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono font-bold text-blue-700">
                        {formatCodigoTicket(t.codigo_ticket)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                        >
                          Score {t.score_prioridad} • {meta.nivel}
                        </span>
                      </td>
                      <td className="max-w-xs px-3 py-2.5 font-semibold text-slate-900">
                        <div className="line-clamp-1">{t.titulo}</div>
                        {t.notas_tecnicas && (
                          <div className="mt-0.5 line-clamp-1 text-[10px] font-normal text-slate-500">
                            Nota: {t.notas_tecnicas}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                        <div>{t.categoria}</div>
                        {t.tipo_solicitud === 'Consultas sobre Odoo' && (
                          <span className="text-[10px] font-bold text-blue-700">
                            Consultas sobre Odoo
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-800">
                          {ubic.departamento}
                        </div>
                        {ubic.sede !== 'N/A (Oficina / No aplica)' && (
                          <div className="text-[10px] text-slate-500">{ubic.sede}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-800">
                        {t.solicitante_nombre}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="rounded-sm border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                          {t.estado}
                        </span>
                        {estancado && (
                          <span className="ml-1 inline-block rounded-sm border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            &gt;48h
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-800">
                        <div className="inline-flex items-center gap-1.5">
                          <SpecialistBadge nombre={t.asignado_a} size="sm" />
                          <span className="font-medium">
                            {t.asignado_a.split(' - ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                        {new Date(t.created_at).toLocaleDateString('es-VE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <TicketModalDialog
        ticket={activeModalTicket}
        onClose={() => setSelectedTicket(null)}
        formSchema={formSchema}
        onUpdateTicket={onUpdateTicket}
      />
    </div>
  );
};
