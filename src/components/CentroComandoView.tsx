import React, { useEffect, useId, useState } from 'react';
import {
  Zap,
  Flame,
  AlertTriangle,
  AlertOctagon,
  Search,
  MessageSquareText,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  Plus,
  MapPin,
  Smartphone,
  Image as ImageIcon,
} from 'lucide-react';
import {
  AsignadoA,
  composeUbicacion,
  DEFAULT_ASIGNADO,
  EQUIPO_TI_BI,
  ESTADOS_TICKET,
  EstadoTicket,
  estaEstancadoProveedor,
  formatCodigoTicket,
  FormSchemaConfig,
  getHorasSinMoverse,
  getPrioridadMeta,
  getSedeMeta,
  NivelImpacto,
  NivelUrgencia,
  NuevoTicketInput,
  parseUbicacion,
  TicketTI,
} from '../types/tickets';
import {
  isTelegramConfigured,
  isTelegramEnabled,
  requestBrowserNotificationPermission,
} from '../lib/notifications';
import { SpecialistBadge } from './BrandSvgElements';
import { MobileAlertsDialog } from './MobileAlertsDialog';
import { TicketModalDialog } from './TicketModalDialog';

interface CentroComandoViewProps {
  tickets: TicketTI[];
  formSchema: FormSchemaConfig;
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
        | 'departamento_tienda'
      >
    >
  ) => Promise<void>;
}

const MOBILE_TAB_SHORT_LABELS: Record<EstadoTicket, string> = {
  'Bandeja de Entrada': 'Bandeja',
  'En Cola': 'En Cola',
  'En Progreso': 'En Progreso',
  'Esperando Proveedor/Tercero': 'Esperando',
  Resuelto: 'Resuelto',
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
  formSchema,
  onCreateTicket,
  onUpdateTicket,
}) => {
  const quickTitleId = useId();
  const searchInputId = useId();
  const filterAsignadoId = useId();
  const filterDeptoId = useId();
  const filterSedeId = useId();

  // Estado de Captura Rápida (Quick-Add < 5 seg)
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCat, setQuickCat] = useState<string>(
    formSchema.categorias_ti[0] || 'Odoo ERP / TPV Tiendas'
  );
  const [quickDepto, setQuickDepto] = useState<string>('BI/TI');
  const [quickSede, setQuickSede] = useState<string>('N/A (Oficina / No aplica)');
  const [quickImpacto, setQuickImpacto] = useState<NivelImpacto>(2);
  const [quickUrgencia, setQuickUrgencia] = useState<NivelUrgencia>(2);
  const [quickAsignado, setQuickAsignado] = useState<AsignadoA>(DEFAULT_ASIGNADO);
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);

  // Pestaña activa de Estado en Pantallas Móviles (< xl) para evitar scroll horizontal
  const [mobileActiveEstado, setMobileActiveEstado] =
    useState<EstadoTicket>('Bandeja de Entrada');

  // Filtros Operativos y Modo Foco / Fuego Hoy
  const [modoFoco, setModoFoco] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroAsignado, setFiltroAsignado] = useState<string>('TODOS');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('TODOS');
  const [filtroSede, setFiltroSede] = useState<string>('TODAS');
  const [selectedTicket, setSelectedTicket] = useState<TicketTI | null>(null);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<EstadoTicket | null>(null);

  // Configuración de Alertas Telegram y permiso Web Notification API
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [telegramActive, setTelegramActive] = useState<boolean>(
    () => isTelegramConfigured() && isTelegramEnabled()
  );

  useEffect(() => {
    void requestBrowserNotificationPermission();
  }, []);

  const handleQuickAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTitle.trim() || isQuickSaving) return;

    setIsQuickSaving(true);
    try {
      const created = await onCreateTicket({
        tipo_solicitud: 'Soporte Técnico / TI',
        solicitante_nombre: 'Captura Rápida (Control Directo)',
        departamento_tienda: composeUbicacion(quickDepto, quickSede),
        categoria: quickCat,
        titulo: quickTitle.trim(),
        descripcion: 'Registrado mediante barra de Captura Rápida en el Centro de Comando.',
        impacto: quickImpacto,
        urgencia: quickUrgencia,
        estado: 'Bandeja de Entrada',
        asignado_a: quickAsignado,
      });
      setQuickTitle('');
      setMobileActiveEstado('Bandeja de Entrada');
      setQuickFeedback(
        `${formatCodigoTicket(created.codigo_ticket)} encolado correctamente`
      );
      setTimeout(() => setQuickFeedback(null), 3500);
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleQuickKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleQuickAddSubmit();
    }
  };

  // Filtrado integral de tickets
  const filteredTickets = tickets.filter((t) => {
    if (modoFoco) {
      const esEnProgreso = t.estado === 'En Progreso';
      const esCriticoActivo = t.score_prioridad >= 6 && t.estado !== 'Resuelto';
      if (!esEnProgreso && !esCriticoActivo) return false;
    }

    if (filtroAsignado !== 'TODOS' && t.asignado_a !== filtroAsignado) {
      return false;
    }

    const ubic = parseUbicacion(t.departamento_tienda);
    if (filtroDepartamento !== 'TODOS' && ubic.departamento !== filtroDepartamento) {
      return false;
    }
    if (filtroSede !== 'TODAS' && ubic.sede !== filtroSede) {
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

  const sedesMetaList = formSchema.sedes.map((s) => getSedeMeta(s));

  return (
    <div className="space-y-3.5 pb-20 lg:pb-6">
      {/* 1. BARRA SUPERIOR DE CAPTURA RÁPIDA (QUICK-ADD < 5 SEGUNDOS) */}
      <section
        aria-label="Captura Rápida de Requerimientos"
        className="rounded-md border border-slate-200 bg-white p-3 shadow-xs sm:p-3.5"
      >
        <form onSubmit={handleQuickAddSubmit} className="space-y-2.5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 shrink-0">
              <Zap className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              <label htmlFor={quickTitleId}>Captura Rápida:</label>
            </div>

            <div className="flex-1">
              <input
                id={quickTitleId}
                name="quick_title"
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={handleQuickKeyDown}
                placeholder="Escriba el requerimiento rápido y presione Enter para encolar..."
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 sm:h-9 sm:min-h-0 sm:text-xs"
              />
            </div>

            {/* Selectores compactos de Departamento, Sede, Responsable y Prioridad */}
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
              <select
                aria-label="Departamento de captura rápida"
                value={quickDepto}
                onChange={(e) => setQuickDepto(e.target.value)}
                className="min-h-[42px] rounded-sm border border-slate-300 bg-slate-50 px-2 text-xs font-medium text-slate-800 focus:border-blue-700 focus:bg-white focus:outline-none sm:h-9 sm:min-h-0"
              >
                {formSchema.departamentos.map((dep) => (
                  <option key={dep} value={dep}>
                    Área: {dep}
                  </option>
                ))}
              </select>

              <select
                aria-label="Sede comercial de captura rápida"
                value={quickSede}
                onChange={(e) => setQuickSede(e.target.value)}
                className="min-h-[42px] truncate rounded-sm border border-slate-300 bg-slate-50 px-2 text-xs font-medium text-slate-800 focus:border-blue-700 focus:bg-white focus:outline-none sm:h-9 sm:min-h-0 sm:max-w-[175px]"
              >
                {sedesMetaList.map((s) => (
                  <option key={s.valor} value={s.valor}>
                    {s.nombreCorto}
                  </option>
                ))}
              </select>

              <select
                aria-label="Asignar captura rápida a integrante BI/TI"
                value={quickAsignado}
                onChange={(e) => setQuickAsignado(e.target.value as AsignadoA)}
                className="min-h-[42px] truncate rounded-sm border border-slate-300 bg-slate-50 px-2 text-xs font-medium text-slate-800 focus:border-blue-700 focus:bg-white focus:outline-none sm:h-9 sm:min-h-0 sm:max-w-[190px]"
              >
                {EQUIPO_TI_BI.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                aria-label="Prioridad rápida"
                value={`${quickImpacto}x${quickUrgencia}`}
                onChange={(e) => {
                  const [imp, urg] = e.target.value.split('x').map(Number);
                  setQuickImpacto((imp || 2) as NivelImpacto);
                  setQuickUrgencia((urg || 2) as NivelUrgencia);
                }}
                className="min-h-[42px] rounded-sm border border-slate-300 bg-slate-50 px-2 text-xs font-medium text-slate-800 focus:border-blue-700 focus:bg-white focus:outline-none sm:h-9 sm:min-h-0"
              >
                <option value="1x1">P4 Baja (Score 1)</option>
                <option value="2x2">P3 Media (Score 4)</option>
                <option value="3x2">P2 Alta (Score 6)</option>
                <option value="3x3">P1 Crítica (Score 9)</option>
              </select>

              <button
                type="submit"
                disabled={isQuickSaving || !quickTitle.trim()}
                className="col-span-2 inline-flex min-h-[44px] items-center justify-center gap-1 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 disabled:opacity-50 sm:col-span-1 sm:h-9 sm:min-h-0"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Guardar</span>
              </button>
            </div>
          </div>

          {/* Selección de Categoría en 1 clic */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[11px] font-semibold text-slate-500">
                Categoría (1 clic):
              </span>
              {formSchema.categorias_ti.map((cat) => {
                const selected = quickCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setQuickCat(cat)}
                    aria-pressed={selected}
                    className={`rounded-sm border px-2 py-1 text-[11px] font-semibold transition ${
                      selected
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div aria-live="polite" className="text-xs">
              {quickFeedback && (
                <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  {quickFeedback}
                </span>
              )}
            </div>
          </div>
        </form>
      </section>

      {/* 2. BARRA DE CONTROL: MODO FOCO + ALERTAS TELEGRAM + WIP + FILTROS (<search>) */}
      <search className="flex flex-col gap-2.5 rounded-md border border-slate-200 bg-white p-3 shadow-xs xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Botón Modo Foco / Fuego Hoy */}
          <button
            type="button"
            aria-pressed={modoFoco}
            onClick={() => setModoFoco((prev) => !prev)}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-sm border px-2.5 text-xs font-bold transition sm:h-8 sm:min-h-0 ${
              modoFoco
                ? 'border-red-700 bg-red-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Flame
              className={`h-3.5 w-3.5 shrink-0 ${
                modoFoco ? 'text-white' : 'text-red-600'
              }`}
              aria-hidden="true"
            />
            <span>Modo Foco</span>
            <span
              className={`rounded-sm px-1.5 py-0.2 font-mono text-[10px] ${
                modoFoco
                  ? 'bg-red-800 text-white'
                  : 'border border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              {modoFoco ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Botón Discreto de Alertas Telegram */}
          <button
            type="button"
            onClick={() => setIsAlertsModalOpen(true)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-sm border border-slate-300 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 transition hover:border-blue-700 hover:bg-blue-50 hover:text-blue-800 sm:h-8 sm:min-h-0"
          >
            <Smartphone className="h-3.5 w-3.5 shrink-0 text-blue-700" aria-hidden="true" />
            <span>Alertas Telegram</span>
            <span
              className={`rounded-sm border px-1.5 py-0.2 font-mono text-[10px] ${
                telegramActive
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {telegramActive ? 'ACTIVO' : 'CONFIG'}
            </span>
          </button>

          {/* Indicador de WIP Limit */}
          <div
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-sm border px-2.5 text-xs font-semibold sm:h-8 sm:min-h-0 ${
              wipLimitExceeded
                ? 'border-red-400 bg-red-50 text-red-800'
                : wipAtLimit
                ? 'border-amber-400 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            <AlertTriangle
              className={`h-3.5 w-3.5 shrink-0 ${
                wipLimitExceeded
                  ? 'text-red-600'
                  : wipAtLimit
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
              aria-hidden="true"
            />
            <span>
              WIP: <strong className="font-mono">{totalEnProgreso}/3</strong>
            </span>
            {wipLimitExceeded && (
              <span className="rounded-sm bg-red-600 px-1 py-0.2 text-[9px] font-bold uppercase text-white">
                Excedido
              </span>
            )}
          </div>

          {totalEstancadosProveedor > 0 && (
            <div className="inline-flex min-h-[38px] items-center gap-1 rounded-sm border border-amber-400 bg-amber-50 px-2 text-xs font-semibold text-amber-900 sm:h-8 sm:min-h-0">
              <AlertOctagon className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
              <span>{totalEstancadosProveedor} &gt;48h en 3ros</span>
            </div>
          )}
        </div>

        {/* Filtros por Texto, Departamento, Sede y Especialista */}
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          <div className="relative col-span-2 sm:w-48">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
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
              placeholder="Buscar FER-TI-00X, asunto..."
              className="min-h-[40px] w-full rounded-sm border border-slate-300 bg-white pl-8 pr-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none sm:h-8 sm:min-h-0 sm:text-xs"
            />
          </div>

          <div>
            <label htmlFor={filterDeptoId} className="sr-only">
              Filtrar por Departamento / Área
            </label>
            <select
              id={filterDeptoId}
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className="min-h-[40px] w-full rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus:border-blue-700 focus:outline-none sm:h-8 sm:min-h-0"
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
              Filtrar por Sede Comercial / Centro
            </label>
            <select
              id={filterSedeId}
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
              className="min-h-[40px] w-full truncate rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus:border-blue-700 focus:outline-none sm:h-8 sm:min-h-0 sm:max-w-[175px]"
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
              Filtrar por integrante del equipo BI/TI
            </label>
            <select
              id={filterAsignadoId}
              value={filtroAsignado}
              onChange={(e) => setFiltroAsignado(e.target.value)}
              className="min-h-[40px] w-full truncate rounded-sm border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-blue-700 focus:outline-none sm:h-8 sm:min-h-0 sm:max-w-[200px]"
            >
              <option value="TODOS">Equipo BI/TI ({tickets.length})</option>
              {EQUIPO_TI_BI.map((miembro) => (
                <option key={miembro} value={miembro}>
                  {miembro}
                </option>
              ))}
            </select>
          </div>
        </div>
      </search>

      {/* 3. SELECTOR DE PESTAÑAS POR ESTADO EN MÓVIL/TABLET (< xl) PARA EVITAR SCROLL HORIZONTAL */}
      <div
        role="tablist"
        aria-label="Estados del Kanban en vista móvil"
        className="grid grid-cols-5 gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-xs xl:hidden"
      >
        {ESTADOS_TICKET.map((st) => {
          const count = filteredTickets.filter((t) => t.estado === st).length;
          const isSelected = mobileActiveEstado === st;
          const isWipCol = st === 'En Progreso' && wipLimitExceeded;

          return (
            <button
              key={st}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setMobileActiveEstado(st)}
              className={`flex min-h-[48px] flex-col items-center justify-center rounded-sm px-1 py-1 text-center transition ${
                isSelected
                  ? isWipCol
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-700 text-white'
                  : isWipCol
                  ? 'border border-red-400 bg-red-50 text-red-900'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="w-full truncate text-[10px] font-bold leading-tight sm:text-xs">
                {MOBILE_TAB_SHORT_LABELS[st]}
              </span>
              <span
                className={`mt-0.5 rounded-sm px-1.5 font-mono text-[10px] font-bold ${
                  isSelected
                    ? 'bg-black/20 text-white'
                    : isWipCol
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {st === 'En Progreso' ? `${count}/3` : count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. TABLERO KANBAN INTERACTIVO POR ESTADO (1 COLUMNA ACTIVA EN MÓVIL, 5 EN DESKTOP XL) */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        {ESTADOS_TICKET.map((columnaEstado) => {
          const colTickets = filteredTickets
            .filter((t) => t.estado === columnaEstado)
            .sort((a, b) => b.score_prioridad - a.score_prioridad);

          const isEnProgresoCol = columnaEstado === 'En Progreso';
          const isProveedorCol = columnaEstado === 'Esperando Proveedor/Tercero';
          const isDragOver = dragOverCol === columnaEstado;
          const isVisibleOnMobile = mobileActiveEstado === columnaEstado;

          // Estilo de columna en gris claro corporativo + alerta WIP Limit
          let colBorderClasses = 'border border-slate-200 bg-slate-100';
          if (isEnProgresoCol && wipLimitExceeded) {
            colBorderClasses = 'border-2 border-red-600 bg-red-50/40';
          } else if (isEnProgresoCol && wipAtLimit) {
            colBorderClasses = 'border-2 border-amber-500 bg-amber-50/30';
          } else if (isDragOver) {
            colBorderClasses = 'border-2 border-blue-700 bg-blue-50/30';
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
              className={`${
                isVisibleOnMobile ? 'flex' : 'hidden xl:flex'
              } flex-col rounded-md p-2.5 transition xl:min-h-[540px] ${colBorderClasses}`}
            >
              {/* Cabecera de Columna */}
              <div className="mb-2.5 border-b border-slate-200 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {columnaEstado === 'Bandeja de Entrada'
                      ? 'Bandeja de Entrada (Triage)'
                      : columnaEstado}
                  </h3>

                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                      isEnProgresoCol && wipLimitExceeded
                        ? 'bg-red-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {isEnProgresoCol ? `${colTickets.length}/3` : colTickets.length}
                  </span>
                </div>

                {/* Alerta visual WIP Limit dentro de la columna En Progreso */}
                {isEnProgresoCol && wipLimitExceeded && (
                  <div
                    role="alert"
                    className="mt-2 flex items-start gap-1.5 rounded-sm border border-red-300 bg-red-100 p-2 text-[11px] font-semibold leading-tight text-red-900"
                  >
                    <AlertTriangle
                      className="h-3.5 w-3.5 shrink-0 text-red-700"
                      aria-hidden="true"
                    />
                    <span>
                      Alerta WIP Limit ({totalEnProgreso}/3): Exceso de tareas simultáneas en
                      curso.
                    </span>
                  </div>
                )}

                {isProveedorCol && (
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Monitoreo SLA de terceros (&gt;48h sin movimiento)
                  </p>
                )}
              </div>

              {/* Lista de Tarjetas Blancas con Borde Izquierdo de Prioridad */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                {colTickets.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center rounded-sm border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center">
                    <p className="text-xs font-medium text-slate-500">
                      Sin requerimientos en esta columna
                    </p>
                    {modoFoco && (
                      <span className="mt-1 text-[10px] font-semibold text-red-700">
                        (Filtro Modo Foco activo)
                      </span>
                    )}
                  </div>
                ) : (
                  colTickets.map((ticket) => {
                    const meta = getPrioridadMeta(ticket.score_prioridad);
                    const estancado48h = estaEstancadoProveedor(ticket);
                    const horas = getHorasSinMoverse(ticket);
                    const nextEstado = NEXT_STATE_MAP[ticket.estado];
                    const ubic = parseUbicacion(ticket.departamento_tienda);
                    const nombreCortoAsignado =
                      ticket.asignado_a.split(' - ')[0] || ticket.asignado_a;
                    const imgCount = ticket.imagenes_urls?.length || 0;

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
                        className={`group relative cursor-pointer rounded-sm border border-slate-200 bg-white p-3 shadow-xs transition hover:border-slate-400 sm:p-2.5 ${meta.borderClass}`}
                      >
                        {/* Fila 1: Código + Badge Score Prioridad */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-blue-700 group-hover:underline">
                              {formatCodigoTicket(ticket.codigo_ticket)}
                            </span>
                            {ticket.tipo_solicitud === 'Consultas sobre Odoo' && (
                              <span className="rounded-sm border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[9px] font-bold uppercase text-blue-800">
                                Odoo
                              </span>
                            )}
                            {imgCount > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-sm border border-slate-300 bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700"
                                title={`${imgCount} evidencia(s) adjunta(s)`}
                              >
                                <ImageIcon className="h-2.5 w-2.5 text-blue-700" aria-hidden="true" />
                                {imgCount}
                              </span>
                            )}
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-sm ${meta.dotClass}`} />
                            Score {ticket.score_prioridad} • {meta.nivel}
                          </span>
                        </div>

                        {/* Alerta >48h en Esperando Proveedor/Tercero */}
                        {estancado48h && (
                          <div className="mt-1.5 flex items-center gap-1 rounded-sm border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-900">
                            <AlertOctagon
                              className="h-3 w-3 shrink-0 text-amber-700"
                              aria-hidden="true"
                            />
                            <span>+{horas}h esperando proveedor/tercero</span>
                          </div>
                        )}

                        {/* Título del Ticket */}
                        <h4 className="mt-1.5 line-clamp-2 text-xs font-bold leading-snug text-slate-900">
                          {ticket.titulo}
                        </h4>

                        {/* Categoría + Departamento + Sede */}
                        <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                          <div className="inline-block rounded-sm border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {ticket.categoria}
                          </div>

                          <div className="flex items-center gap-1 truncate text-[11px]">
                            <Building2
                              className="h-3 w-3 shrink-0 text-slate-400"
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-slate-800">
                              {ubic.departamento}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="truncate text-slate-600">
                              {ticket.solicitante_nombre}
                            </span>
                          </div>

                          {ubic.sede !== 'N/A (Oficina / No aplica)' && (
                            <div className="flex items-center gap-1 truncate text-[10px] text-slate-500">
                              <MapPin
                                className="h-3 w-3 shrink-0 text-blue-700"
                                aria-hidden="true"
                              />
                              <span className="truncate font-medium text-slate-700">
                                {ubic.sede}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Preview de Notas Técnicas si existen */}
                        {ticket.notas_tecnicas && (
                          <div className="mt-2 flex items-start gap-1.5 rounded-sm border border-slate-200 bg-slate-50 p-1.5 text-[10px] text-slate-700">
                            <MessageSquareText
                              className="mt-0.5 h-3 w-3 shrink-0 text-slate-500"
                              aria-hidden="true"
                            />
                            <span className="line-clamp-2">{ticket.notas_tecnicas}</span>
                          </div>
                        )}

                        {/* Pie de Tarjeta: Especialista + Avance Rápido */}
                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                          <div
                            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700"
                            title={ticket.asignado_a}
                          >
                            <SpecialistBadge nombre={ticket.asignado_a} size="sm" />
                            <span className="truncate max-w-[110px]">
                              {nombreCortoAsignado}
                            </span>
                          </div>

                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="mr-0.5 inline-flex items-center gap-0.5 text-[10px] text-slate-500">
                              <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                              {horas}h
                            </span>

                            {nextEstado && (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateTicket(ticket.id, { estado: nextEstado })
                                }
                                className="inline-flex min-h-[30px] items-center gap-0.5 rounded-sm border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-800 transition hover:border-blue-700 hover:bg-blue-700 hover:text-white sm:min-h-0"
                              >
                                <span>
                                  {nextEstado === 'Resuelto' ? 'Resolver' : nextEstado}
                                </span>
                                <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
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
        formSchema={formSchema}
        onUpdateTicket={onUpdateTicket}
      />

      {/* Modal de Configuración de Alertas Telegram */}
      <MobileAlertsDialog
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        onConfigChanged={(active) => setTelegramActive(active)}
      />
    </div>
  );
};
