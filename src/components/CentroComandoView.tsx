import React, { useId, useState } from 'react';
import {
  Zap,
  Flame,
  AlertTriangle,
  AlertOctagon,
  Search,
  UserCheck,
  MessageSquareText,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  PlusCircle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AsignadoA,
  CATEGORIAS_TICKET,
  CategoriaTicket,
  EQUIPO_TI_BI,
  ESTADOS_TICKET,
  EstadoTicket,
  estaEstancadoProveedor,
  formatCodigoTicket,
  getHorasSinMoverse,
  getPrioridadMeta,
  NivelImpacto,
  NivelUrgencia,
  NuevoTicketInput,
  TicketTI,
} from '../types/tickets';
import {
  CategorySvgIcon,
  EmptyColumnVectorSvg,
  EstadoColumnaSvg,
  SpecialistAvatarSvg,
} from './BrandSvgElements';
import { TicketModalDialog } from './TicketModalDialog';

interface CentroComandoViewProps {
  tickets: TicketTI[];
  onCreateTicket: (input: NuevoTicketInput) => Promise<TicketTI>;
  onUpdateTicket: (
    id: string,
    changes: Partial<
      Pick<
        TicketTI,
        | 'estado'
        | 'asignado_a'
        | 'notas_tecnicas'
        | 'impacto'
        | 'urgencia'
        | 'categoria'
        | 'titulo'
        | 'descripcion'
      >
    >
  ) => Promise<void>;
}

const CATEGORIA_SHORT_LABELS: Record<CategoriaTicket, string> = {
  'Infraestructura / Redes / Starlink': 'Infra / Starlink',
  'Odoo ERP / TPV Tiendas': 'Odoo / TPV',
  'Business Intelligence / Reportes': 'BI / Reportes',
  'Hardware / Impresoras / Equipos': 'Hardware / Impr.',
  'Accesos / Google Workspace': 'Accesos / Google',
  'Desarrollo / Automatización': 'Desarrollo / Auto.',
};

const NEXT_STATE_MAP: Record<EstadoTicket, EstadoTicket | null> = {
  'Bandeja de Entrada': 'En Cola',
  'En Cola': 'En Progreso',
  'En Progreso': 'Resuelto',
  'Esperando Proveedor/Tercero': 'En Progreso',
  Resuelto: null,
};

export const CentroComandoView: React.FC<CentroComandoViewProps> = ({
  tickets,
  onCreateTicket,
  onUpdateTicket,
}) => {
  const quickTitleId = useId();
  const searchInputId = useId();
  const filterAsignadoId = useId();

  // Estado de Captura Rápida (Quick-Add < 5 seg)
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCat, setQuickCat] = useState<CategoriaTicket>('Odoo ERP / TPV Tiendas');
  const [quickImpacto, setQuickImpacto] = useState<NivelImpacto>(2);
  const [quickUrgencia, setQuickUrgencia] = useState<NivelUrgencia>(2);
  const [quickAsignado, setQuickAsignado] = useState<AsignadoA>('Luis Lugo');
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);

  // Filtros Operativos y Modo Foco / Fuego Hoy
  const [modoFoco, setModoFoco] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroAsignado, setFiltroAsignado] = useState<string>('TODOS');
  const [selectedTicket, setSelectedTicket] = useState<TicketTI | null>(null);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<EstadoTicket | null>(null);

  const handleQuickAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTitle.trim() || isQuickSaving) return;

    setIsQuickSaving(true);
    try {
      const created = await onCreateTicket({
        solicitante_nombre: 'Captura Rápida (Pasillo / Directo)',
        departamento_tienda: 'Operación Directa TI/BI',
        categoria: quickCat,
        titulo: quickTitle.trim(),
        descripcion: 'Registrado mediante barra de Captura Rápida en el Centro de Comando.',
        impacto: quickImpacto,
        urgencia: quickUrgencia,
        estado: 'Bandeja de Entrada',
        asignado_a: quickAsignado,
      });
      setQuickTitle('');
      setQuickFeedback(
        `${formatCodigoTicket(created.codigo_ticket)} guardado en Bandeja de Entrada`
      );
      setTimeout(() => setQuickFeedback(null), 3500);
    } finally {
      setIsQuickSaving(false);
    }
  };

  // Manejar Enter verificando !isComposing según modern-web-guidance (forms)
  const handleQuickKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleQuickAddSubmit();
    }
  };

  // Aplicar filtros: Modo Foco / Fuego Hoy + Especialista + Búsqueda
  const filteredTickets = tickets.filter((t) => {
    if (modoFoco) {
      const esEnProgreso = t.estado === 'En Progreso';
      const esCriticoActivo = t.score_prioridad >= 6 && t.estado !== 'Resuelto';
      if (!esEnProgreso && !esCriticoActivo) return false;
    }

    if (filtroAsignado !== 'TODOS' && t.asignado_a !== filtroAsignado) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const code = formatCodigoTicket(t.codigo_ticket).toLowerCase();
      const match =
        code.includes(q) ||
        t.titulo.toLowerCase().includes(q) ||
        t.solicitante_nombre.toLowerCase().includes(q) ||
        t.departamento_tienda.toLowerCase().includes(q) ||
        t.categoria.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Conteo real de tareas en 'En Progreso' para alerta de WIP Limit (> 3)
  const totalEnProgreso = tickets.filter((t) => t.estado === 'En Progreso').length;
  const wipLimitExceeded = totalEnProgreso > 3;
  const wipAtLimit = totalEnProgreso === 3;

  // Conteo de tickets estancados (>48h en Esperando Proveedor/Tercero)
  const totalEstancadosProveedor = tickets.filter((t) =>
    estaEstancadoProveedor(t)
  ).length;

  const handleDropOnColumn = async (targetEstado: EstadoTicket) => {
    setDragOverCol(null);
    if (!draggedTicketId) return;
    const found = tickets.find((t) => t.id === draggedTicketId);
    setDraggedTicketId(null);
    if (!found || found.estado === targetEstado) return;
    await onUpdateTicket(found.id, { estado: targetEstado });
  };

  const activeModalTicket = selectedTicket
    ? tickets.find((t) => t.id === selectedTicket.id) || selectedTicket
    : null;

  return (
    <div className="space-y-4">
      {/* 1. BARRA SUPERIOR DE CAPTURA RÁPIDA (QUICK-ADD < 5 SEGUNDOS) */}
      <section
        aria-label="Captura Rápida de Requerimientos"
        className="rounded-2xl border border-gcf-500/35 bg-gradient-to-r from-slate-900 via-slate-900/95 to-gcf-900/40 p-3.5 shadow-gcf-glow sm:p-4"
      >
        <form onSubmit={handleQuickAddSubmit} className="space-y-3">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gcf-200 shrink-0">
              <Zap className="h-4 w-4 text-gcf-400" aria-hidden="true" />
              <label htmlFor={quickTitleId}>Captura Rápida (Pasillo / 5s):</label>
            </div>

            <div className="relative flex-1">
              <input
                id={quickTitleId}
                name="quick_title"
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={handleQuickKeyDown}
                placeholder="Escribe el requerimiento y presiona Enter para guardar al instante..."
                className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-gcf-950/90 px-3.5 py-2 text-sm text-white placeholder:text-slate-400 focus:border-gcf-500 focus:outline-none focus:ring-2 focus:ring-gcf-500/30"
              />
            </div>

            {/* Selector rápido de asignado (con icono SVG) y prioridad en 1 línea */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex items-center">
                <UserCheck
                  className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-gcf-300"
                  aria-hidden="true"
                />
                <select
                  aria-label="Asignar captura rápida a especialista"
                  value={quickAsignado}
                  onChange={(e) => setQuickAsignado(e.target.value as AsignadoA)}
                  className="min-h-[42px] rounded-xl border border-slate-700 bg-gcf-950 pl-8 pr-2.5 py-1.5 text-xs font-medium text-slate-200 focus:border-gcf-500 focus:outline-none"
                >
                  {EQUIPO_TI_BI.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <select
                aria-label="Prioridad rápida"
                value={`${quickImpacto}x${quickUrgencia}`}
                onChange={(e) => {
                  const [imp, urg] = e.target.value.split('x').map(Number);
                  setQuickImpacto((imp || 2) as NivelImpacto);
                  setQuickUrgencia((urg || 2) as NivelUrgencia);
                }}
                className="min-h-[42px] rounded-xl border border-slate-700 bg-gcf-950 px-2.5 py-1.5 text-xs font-medium text-slate-200 focus:border-gcf-500 focus:outline-none"
              >
                <option value="1x1">P4 Baja (Score 1)</option>
                <option value="2x2">P3 Media (Score 4)</option>
                <option value="3x2">P2 Alta (Score 6)</option>
                <option value="3x3">P1 Crítica (Score 9)</option>
              </select>

              <button
                type="submit"
                disabled={isQuickSaving || !quickTitle.trim()}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-gcf-500 to-gcf-800 px-4 py-2 text-xs font-bold text-white shadow-md shadow-gcf-800/40 transition hover:brightness-110 disabled:opacity-50"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span>Guardar (Enter)</span>
              </button>
            </div>
          </div>

          {/* Botones de Categoría con 1 solo clic e icono SVG a medida */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium text-slate-400">
                Categoría (1 clic):
              </span>
              {CATEGORIAS_TICKET.map((cat) => {
                const selected = quickCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setQuickCat(cat)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      selected
                        ? 'border-gcf-400 bg-gcf-500/20 text-white shadow-sm ring-1 ring-gcf-400/30'
                        : 'border-slate-800 bg-gcf-950/60 text-slate-400 hover:border-gcf-500/40 hover:text-slate-200'
                    }`}
                  >
                    <CategorySvgIcon categoria={cat} className="h-3.5 w-3.5 shrink-0" />
                    <span>{CATEGORIA_SHORT_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>

            <div aria-live="polite" className="text-xs">
              {quickFeedback && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {quickFeedback}
                </span>
              )}
            </div>
          </div>
        </form>
      </section>

      {/* 2. BARRA DE CONTROL: MODO FOCO / FUEGO HOY + ALERTAS WIP + FILTROS (<search>) */}
      <search className="flex flex-col gap-3 rounded-2xl border border-gcf-500/20 bg-slate-900/75 p-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón Modo Foco / Fuego Hoy */}
          <button
            type="button"
            aria-pressed={modoFoco}
            onClick={() => setModoFoco((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
              modoFoco
                ? 'border-rose-500 bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-950/60 ring-2 ring-rose-400/40'
                : 'border-gcf-500/30 bg-gcf-950 text-slate-200 hover:border-amber-500/50 hover:text-amber-200'
            }`}
          >
            <Flame
              className={`h-4 w-4 ${modoFoco ? 'animate-pulse text-amber-200' : 'text-amber-400'}`}
              aria-hidden="true"
            />
            <span>Modo Foco / Fuego Hoy</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                modoFoco ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {modoFoco ? 'ACTIVO (En Progreso o Score ≥ 6)' : 'Inactivo'}
            </span>
          </button>

          {/* Indicador global de WIP Limit */}
          <div
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
              wipLimitExceeded
                ? 'border-rose-500/70 bg-rose-950/40 text-rose-200 ring-1 ring-rose-500/40'
                : wipAtLimit
                ? 'border-amber-500/60 bg-amber-950/30 text-amber-200'
                : 'border-gcf-500/25 bg-gcf-950/70 text-gcf-100'
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 shrink-0 ${
                wipLimitExceeded
                  ? 'text-rose-400'
                  : wipAtLimit
                  ? 'text-amber-400'
                  : 'text-gcf-400'
              }`}
              aria-hidden="true"
            />
            <span>
              WIP En Progreso:{' '}
              <strong className="font-mono">{totalEnProgreso}/3</strong>
            </span>
            {wipLimitExceeded && (
              <span className="rounded bg-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-200">
                ¡Saturación!
              </span>
            )}
          </div>

          {totalEstancadosProveedor > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-950/30 px-3 py-2 text-xs font-semibold text-amber-200">
              <AlertOctagon className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>{totalEstancadosProveedor} ticket(s) &gt;48h en Proveedor/Tercero</span>
            </div>
          )}
        </div>

        {/* Buscador y Filtro por Miembro del Equipo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gcf-300"
              aria-hidden="true"
            />
            <label htmlFor={searchInputId} className="sr-only">
              Buscar ticket por código, título o solicitante
            </label>
            <input
              id={searchInputId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar FER-TI-00X, tienda, asunto..."
              className="min-h-[40px] w-full rounded-xl border border-slate-700 bg-gcf-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:border-gcf-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-gcf-300" aria-hidden="true" />
            <label htmlFor={filterAsignadoId} className="sr-only">
              Filtrar por especialista asignado
            </label>
            <select
              id={filterAsignadoId}
              value={filtroAsignado}
              onChange={(e) => setFiltroAsignado(e.target.value)}
              className="min-h-[40px] rounded-xl border border-slate-700 bg-gcf-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-gcf-500 focus:outline-none"
            >
              <option value="TODOS">Equipo Completo ({tickets.length})</option>
              {EQUIPO_TI_BI.map((miembro) => (
                <option key={miembro} value={miembro}>
                  {miembro}
                </option>
              ))}
            </select>
          </div>
        </div>
      </search>

      {/* 3. TABLERO KANBAN INTERACTIVO POR ESTADO (5 COLUMNAS) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {ESTADOS_TICKET.map((columnaEstado) => {
          const colTickets = filteredTickets
            .filter((t) => t.estado === columnaEstado)
            .sort((a, b) => b.score_prioridad - a.score_prioridad);

          const isEnProgresoCol = columnaEstado === 'En Progreso';
          const isProveedorCol = columnaEstado === 'Esperando Proveedor/Tercero';
          const isDragOver = dragOverCol === columnaEstado;

          // Estilo de alerta visual WIP Limit en la columna 'En Progreso'
          let colBorderClasses = 'border-gcf-500/20 bg-slate-900/65';
          if (isEnProgresoCol && wipLimitExceeded) {
            colBorderClasses =
              'border-2 border-rose-500/90 bg-rose-950/20 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/40';
          } else if (isEnProgresoCol && wipAtLimit) {
            colBorderClasses = 'border-2 border-amber-500/80 bg-amber-950/15';
          } else if (isDragOver) {
            colBorderClasses = 'border-2 border-gcf-400 bg-gcf-900/30';
          }

          return (
            <section
              key={columnaEstado}
              aria-label={`Columna ${columnaEstado}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCol !== columnaEstado) setDragOverCol(columnaEstado);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDropOnColumn(columnaEstado)}
              className={`flex flex-col rounded-2xl border p-3 transition-all min-h-[540px] ${colBorderClasses}`}
            >
              {/* Cabecera de Columna con Icono Vectorial SVG */}
              <div className="mb-3 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <EstadoColumnaSvg
                      estado={columnaEstado}
                      wipAlert={isEnProgresoCol && wipLimitExceeded}
                      className="h-4 w-4 shrink-0"
                    />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      {columnaEstado === 'Bandeja de Entrada'
                        ? 'Bandeja de Entrada (Triage)'
                        : columnaEstado}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-xs font-bold ${
                      isEnProgresoCol && wipLimitExceeded
                        ? 'bg-rose-500 text-white'
                        : 'bg-gcf-950 border border-gcf-500/30 text-gcf-200'
                    }`}
                  >
                    {isEnProgresoCol ? `${colTickets.length}/3` : colTickets.length}
                  </span>
                </div>

                {/* Banner WIP Limit dentro de la columna En Progreso */}
                {isEnProgresoCol && wipLimitExceeded && (
                  <div
                    role="alert"
                    className="mt-2 flex items-start gap-1.5 rounded-xl border border-rose-500/50 bg-rose-500/15 p-2 text-[11px] font-semibold leading-tight text-rose-200"
                  >
                    <AlertTriangle
                      className="h-4 w-4 shrink-0 text-rose-400"
                      aria-hidden="true"
                    />
                    <span>
                      ¡WIP Limit Excedido ({totalEnProgreso}/3)! Cierra o pasa a espera antes
                      de abrir otra tarea.
                    </span>
                  </div>
                )}

                {isProveedorCol && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Alerta automática si supera 48h sin movimiento
                  </p>
                )}
              </div>

              {/* Lista de Tarjetas */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                {colTickets.length === 0 ? (
                  <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-gcf-500/20 bg-gcf-950/30 p-4 text-center">
                    <EmptyColumnVectorSvg className="mb-1.5 h-12 w-12" />
                    <p className="text-xs font-medium text-slate-400">
                      Sin requerimientos en esta columna
                    </p>
                    {modoFoco && (
                      <span className="mt-1 text-[10px] text-amber-400/90">
                        (Modo Foco / Fuego Hoy activo)
                      </span>
                    )}
                  </div>
                ) : (
                  colTickets.map((ticket) => {
                    const meta = getPrioridadMeta(ticket.score_prioridad);
                    const estancado48h = estaEstancadoProveedor(ticket);
                    const horas = getHorasSinMoverse(ticket);
                    const nextEstado = NEXT_STATE_MAP[ticket.estado];

                    return (
                      <article
                        key={ticket.id}
                        draggable
                        onDragStart={() => setDraggedTicketId(ticket.id)}
                        onDragEnd={() => {
                          setDraggedTicketId(null);
                          setDragOverCol(null);
                        }}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`group relative cursor-pointer rounded-xl border bg-gcf-950/90 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gcf-400/60 hover:shadow-gcf-glow ${
                          estancado48h
                            ? 'border-amber-500/70 ring-1 ring-amber-500/30'
                            : 'border-slate-800/90'
                        } ${meta.borderClass}`}
                      >
                        {/* Fila 1: Código + Badge Score Prioridad */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-mono text-xs font-black text-gcf-300 group-hover:text-gcf-200">
                            {formatCodigoTicket(ticket.codigo_ticket)}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                            Score {ticket.score_prioridad} ({meta.nivel})
                          </span>
                        </div>

                        {/* Alerta >48h en Esperando Proveedor/Tercero */}
                        {estancado48h && (
                          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-200">
                            <AlertOctagon
                              className="h-3.5 w-3.5 shrink-0 text-amber-400"
                              aria-hidden="true"
                            />
                            <span>¡Alerta! {horas}h esperando proveedor/tercero</span>
                          </div>
                        )}

                        {/* Título del Ticket */}
                        <h4 className="mt-2 line-clamp-2 text-xs font-bold leading-snug text-slate-100 group-hover:text-white">
                          {ticket.titulo}
                        </h4>

                        {/* Categoría con Icono SVG + Departamento */}
                        <div className="mt-2 space-y-1.5 text-[11px] text-slate-400">
                          <div className="inline-flex items-center gap-1.5 rounded-md border border-gcf-500/25 bg-slate-900/90 px-2 py-0.5 font-medium text-gcf-200">
                            <CategorySvgIcon
                              categoria={ticket.categoria}
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            <span>
                              {CATEGORIA_SHORT_LABELS[ticket.categoria] || ticket.categoria}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <Building2 className="h-3 w-3 shrink-0 text-gcf-400" aria-hidden="true" />
                            <span className="truncate">{ticket.departamento_tienda}</span>
                            <span className="text-slate-600">•</span>
                            <span className="truncate text-slate-300">
                              {ticket.solicitante_nombre}
                            </span>
                          </div>
                        </div>

                        {/* Preview de Notas Técnicas si existen */}
                        {ticket.notas_tecnicas && (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-slate-800/90 bg-slate-900/70 p-1.5 text-[10px] text-slate-300">
                            <MessageSquareText
                              className="mt-0.5 h-3 w-3 shrink-0 text-gcf-400"
                              aria-hidden="true"
                            />
                            <span className="line-clamp-2">{ticket.notas_tecnicas}</span>
                          </div>
                        )}

                        {/* Pie de Tarjeta: Avatar SVG Especialista + Acciones Rápidas en 1 Clic */}
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
                            <SpecialistAvatarSvg nombre={ticket.asignado_a} size="sm" />
                            <span className="truncate max-w-[105px]">{ticket.asignado_a}</span>
                          </div>

                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="mr-1 inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {horas}h
                            </span>

                            {nextEstado && (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateTicket(ticket.id, { estado: nextEstado })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-gcf-400/40 bg-gcf-500/20 px-2 py-1 text-[10px] font-bold text-gcf-100 transition hover:bg-gcf-500 hover:text-white"
                              >
                                <span>
                                  {nextEstado === 'Resuelto' ? 'Resolver' : nextEstado}
                                </span>
                                <ArrowRight className="h-3 w-3" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Modal de Ficha Técnica y Notas */}
      <TicketModalDialog
        ticket={activeModalTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdateTicket={onUpdateTicket}
      />
    </div>
  );
};
