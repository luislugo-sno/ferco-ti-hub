import React, { useId, useState } from 'react';
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
} from 'lucide-react';
import {
  CATEGORIAS_TICKET,
  EQUIPO_TI_BI,
  ESTADOS_TICKET,
  estaEstancadoProveedor,
  formatCodigoTicket,
  getHorasSinMoverse,
  getPrioridadMeta,
  TicketTI,
} from '../types/tickets';
import {
  CategorySvgIcon,
  SpecialistAvatarSvg,
} from './BrandSvgElements';
import { getExpectedPin, setCustomPin } from './PinAuthDialog';
import { TicketModalDialog } from './TicketModalDialog';

interface DashboardKPIsViewProps {
  tickets: TicketTI[];
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

export const DashboardKPIsView: React.FC<DashboardKPIsViewProps> = ({
  tickets,
  onUpdateTicket,
}) => {
  const filterEstadoId = useId();
  const filterCatId = useId();
  const filterAsignadoId = useId();
  const newPinInputId = useId();

  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroAsignado, setFiltroAsignado] = useState<string>('TODOS');
  const [selectedTicket, setSelectedTicket] = useState<TicketTI | null>(null);

  // Configuración rápida de PIN
  const [showPinConfig, setShowPinConfig] = useState(false);
  const [newPinValue, setNewPinValue] = useState(getExpectedPin());
  const [pinSaved, setPinSaved] = useState(false);

  // Cálculos de KPIs Ejecutivos
  const ticketsActivos = tickets.filter((t) => t.estado !== 'Resuelto');
  const ticketsCriticosActivos = ticketsActivos.filter((t) => t.score_prioridad >= 6);

  const hace7DiasMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const ticketsResueltosTotal = tickets.filter((t) => t.estado === 'Resuelto');
  const ticketsResueltosSemana = ticketsResueltosTotal.filter((t) => {
    const refDate = t.fecha_resolucion || t.updated_at || t.created_at;
    return new Date(refDate).getTime() >= hace7DiasMs;
  });

  const ticketsBloqueadosTerceros = tickets.filter(
    (t) => t.estado === 'Esperando Proveedor/Tercero'
  );
  const ticketsBloqueadosMas48h = ticketsBloqueadosTerceros.filter((t) =>
    estaEstancadoProveedor(t)
  );

  // Carga comparativa clave (Odoo vs Infraestructura vs BI)
  const countOdoo = ticketsActivos.filter(
    (t) => t.categoria === 'Odoo ERP / TPV Tiendas'
  ).length;
  const countInfra = ticketsActivos.filter(
    (t) => t.categoria === 'Infraestructura / Redes / Starlink'
  ).length;
  const countBI = ticketsActivos.filter(
    (t) => t.categoria === 'Business Intelligence / Reportes'
  ).length;

  // Historial filtrado para tabla y exportación CSV/Excel
  const historialFiltrado = tickets.filter((t) => {
    if (filtroEstado !== 'TODOS' && t.estado !== filtroEstado) return false;
    if (filtroCategoria !== 'TODAS' && t.categoria !== filtroCategoria) return false;
    if (filtroAsignado !== 'TODOS' && t.asignado_a !== filtroAsignado) return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Codigo Ticket',
      'Fecha Creacion',
      'Solicitante',
      'Departamento / Tienda',
      'Categoria',
      'Titulo',
      'Descripcion',
      'Impacto (1-3)',
      'Urgencia (1-3)',
      'Score Prioridad',
      'Nivel SLA',
      'Estado Actual',
      'Asignado A',
      'Horas Sin Moverse',
      'Notas Tecnicas',
      'Fecha Resolucion',
    ];

    const escapeCsv = (val: unknown): string => {
      const str = val === null || val === undefined ? '' : String(val);
      const cleaned = str.replace(/"/g, '""');
      return `"${cleaned}"`;
    };

    const rows = historialFiltrado.map((t) => {
      const meta = getPrioridadMeta(t.score_prioridad);
      return [
        formatCodigoTicket(t.codigo_ticket),
        new Date(t.created_at).toLocaleString('es-VE'),
        t.solicitante_nombre,
        t.departamento_tienda,
        t.categoria,
        t.titulo,
        t.descripcion,
        t.impacto,
        t.urgencia,
        t.score_prioridad,
        meta.codigoSLA,
        t.estado,
        t.asignado_a,
        getHorasSinMoverse(t),
        t.notas_tecnicas || '',
        t.fecha_resolucion
          ? new Date(t.fecha_resolucion).toLocaleString('es-VE')
          : 'Pendiente',
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
    link.setAttribute('download', `Reporte_Gestion_TI_BI_Ferco_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinValue.trim().length < 4) return;
    setCustomPin(newPinValue.trim());
    setPinSaved(true);
    setTimeout(() => {
      setPinSaved(false);
      setShowPinConfig(false);
    }, 1500);
  };

  const activeModalTicket = selectedTicket
    ? tickets.find((t) => t.id === selectedTicket.id) || selectedTicket
    : null;

  return (
    <div className="space-y-6">
      {/* Cabecera Ejecutiva + Exportación */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gcf-500/25 bg-gradient-to-r from-slate-900 via-slate-900/95 to-gcf-900/40 p-4 shadow-gcf-glow sm:flex-row sm:items-center sm:p-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gcf-300">
            Dashboard Ejecutivo para Gerencia
          </span>
          <h2 className="text-lg font-bold text-white sm:text-xl">
            Indicadores de Carga Operativa, SLA y Resolución TI/BI
          </h2>
          <p className="text-xs text-slate-300">
            Monitoreo en tiempo real de requerimientos por unidad de negocio, cuellos de
            botella de proveedores y productividad del equipo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPinConfig((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gcf-500/35 bg-gcf-950 px-3.5 py-2.5 text-xs font-semibold text-gcf-100 transition hover:border-gcf-400 hover:text-white"
          >
            <KeyRound className="h-4 w-4 text-gcf-400" aria-hidden="true" />
            <span>Configurar PIN</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gcf-500 to-gcf-800 px-4 py-2.5 text-xs font-bold text-white shadow-gcf-glow transition hover:brightness-110"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Exportar Historial a Excel / CSV ({historialFiltrado.length})</span>
          </button>
        </div>
      </div>

      {/* Panel desplegable de configuración de PIN */}
      {showPinConfig && (
        <form
          onSubmit={handleSavePin}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-gcf-500/35 bg-gcf-900/25 p-4"
        >
          <div>
            <label
              htmlFor={newPinInputId}
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-gcf-200"
            >
              Nuevo PIN de Acceso (Mínimo 4 dígitos)
            </label>
            <input
              id={newPinInputId}
              type="text"
              inputMode="numeric"
              minLength={4}
              required
              value={newPinValue}
              onChange={(e) => setNewPinValue(e.target.value)}
              className="min-h-[40px] rounded-xl border border-slate-700 bg-gcf-950 px-3 py-1.5 font-mono text-sm text-white focus:border-gcf-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-gcf-500 to-gcf-800 px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>{pinSaved ? '¡PIN Actualizado!' : 'Guardar PIN'}</span>
          </button>
        </form>
      )}

      {/* 1. TARJETAS RESUMEN DE KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Tickets Activos */}
        <div className="rounded-2xl border border-gcf-500/25 bg-slate-900/80 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Tickets Activos
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gcf-500/15 text-gcf-300 ring-1 ring-gcf-500/30">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-black text-white">
              {ticketsActivos.length}
            </span>
            <span className="text-xs font-medium text-slate-400">
              de {tickets.length} registrados
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 font-bold text-rose-300 ring-1 ring-rose-500/30">
              <Flame className="h-3 w-3" aria-hidden="true" />
              {ticketsCriticosActivos.length} Críticos (P1/P2)
            </span>
          </div>
        </div>

        {/* Card 2: Tickets Resueltos en la Semana */}
        <div className="rounded-2xl border border-gcf-500/25 bg-slate-900/80 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Resueltos en la Semana
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-black text-emerald-400">
              {ticketsResueltosSemana.length}
            </span>
            <span className="text-xs font-medium text-slate-400">
              últimos 7 días ({ticketsResueltosTotal.length} histórico)
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-300">
            Tasa de resolución global:{' '}
            <strong className="text-emerald-300">
              {tickets.length > 0
                ? Math.round((ticketsResueltosTotal.length / tickets.length) * 100)
                : 0}
              %
            </strong>
          </div>
        </div>

        {/* Card 3: Tareas Bloqueadas por Terceros */}
        <div className="rounded-2xl border border-gcf-500/25 bg-slate-900/80 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Bloqueadas por Terceros
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
              <AlertOctagon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-black text-amber-300">
              {ticketsBloqueadosTerceros.length}
            </span>
            <span className="text-xs font-medium text-slate-400">
              esperando ISP / Proveedor
            </span>
          </div>
          <div className="mt-3 text-xs">
            {ticketsBloqueadosMas48h.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 font-bold text-rose-200 ring-1 ring-rose-500/40">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {ticketsBloqueadosMas48h.length} supera(n) las 48 horas
              </span>
            ) : (
              <span className="text-emerald-400">Sin retrasos mayores a 48h</span>
            )}
          </div>
        </div>

        {/* Card 4: Carga Activa Odoo vs Infra vs BI */}
        <div className="rounded-2xl border border-gcf-500/25 bg-slate-900/80 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Foco Odoo vs Infra vs BI
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gcf-500/15 text-gcf-300 ring-1 ring-gcf-500/30">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-gcf-500/25 bg-gcf-950/70 p-2">
              <span className="block font-mono text-lg font-black text-gcf-300">
                {countOdoo}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Odoo / TPV</span>
            </div>
            <div className="rounded-xl border border-gcf-500/25 bg-gcf-950/70 p-2">
              <span className="block font-mono text-lg font-black text-amber-400">
                {countInfra}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Infra / Red</span>
            </div>
            <div className="rounded-xl border border-gcf-500/25 bg-gcf-950/70 p-2">
              <span className="block font-mono text-lg font-black text-gcf-100">
                {countBI}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">BI / Datos</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DESGLOSE GRÁFICO POR CATEGORÍA (CON ICONOS SVG) Y POR ESPECIALISTA */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Carga por Categoría */}
        <section className="rounded-2xl border border-gcf-500/20 bg-slate-900/75 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
            <Layers className="h-4 w-4 text-gcf-400" aria-hidden="true" />
            <span>Distribución de Carga por Categoría TI/BI</span>
          </h3>
          <div className="mt-4 space-y-3.5">
            {CATEGORIAS_TICKET.map((cat) => {
              const todosCat = tickets.filter((t) => t.categoria === cat);
              const activosCat = todosCat.filter((t) => t.estado !== 'Resuelto');
              const resueltosCat = todosCat.filter((t) => t.estado === 'Resuelto');
              const pct =
                tickets.length > 0
                  ? Math.round((todosCat.length / tickets.length) * 100)
                  : 0;

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-slate-200">
                      <CategorySvgIcon categoria={cat} className="h-4 w-4 shrink-0" />
                      <span>{cat}</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-gcf-200">{activosCat.length} activos</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-emerald-400">
                        {resueltosCat.length} resueltos
                      </span>
                      <span className="text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gcf-950">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gcf-500 via-gcf-800 to-gcf-300 transition-all duration-300"
                      style={{ width: `${Math.max(pct, todosCat.length > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Carga por Especialista con Avatares SVG */}
        <section className="rounded-2xl border border-gcf-500/20 bg-slate-900/75 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
            <Users className="h-4 w-4 text-gcf-400" aria-hidden="true" />
            <span>Carga Asignada por Especialista TI/BI</span>
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {EQUIPO_TI_BI.map((miembro) => {
              const delMiembro = tickets.filter((t) => t.asignado_a === miembro);
              const enCurso = delMiembro.filter((t) => t.estado === 'En Progreso').length;
              const pendientes = delMiembro.filter(
                (t) => t.estado !== 'Resuelto' && t.estado !== 'En Progreso'
              ).length;
              const resueltos = delMiembro.filter((t) => t.estado === 'Resuelto').length;

              return (
                <div
                  key={miembro}
                  className="flex flex-col justify-between rounded-xl border border-gcf-500/20 bg-gcf-950/60 p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SpecialistAvatarSvg nombre={miembro} size="md" />
                      <span className="text-xs font-bold text-white">{miembro}</span>
                    </div>
                    <span className="rounded-full border border-gcf-500/30 bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-gcf-200">
                      {delMiembro.length} total
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      En Progreso:{' '}
                      <strong
                        className={
                          enCurso > 3
                            ? 'text-rose-400'
                            : enCurso > 0
                            ? 'text-amber-300'
                            : 'text-slate-300'
                        }
                      >
                        {enCurso}
                      </strong>
                    </span>
                    <span>
                      Cola/Espera: <strong className="text-gcf-200">{pendientes}</strong>
                    </span>
                    <span>
                      Resueltos: <strong className="text-emerald-400">{resueltos}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 3. TABLA DE HISTORIAL Y REPORTE DE GESTIÓN */}
      <section className="rounded-2xl border border-gcf-500/20 bg-slate-900/80 p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Bitácora General de Requerimientos (Haz clic en una fila para editar)
            </h3>
            <p className="text-xs text-slate-400">
              Filtra los registros antes de presionar &ldquo;Exportar Historial a Excel /
              CSV&rdquo;.
            </p>
          </div>

          <search className="flex flex-wrap items-center gap-2.5">
            <Filter className="h-4 w-4 text-gcf-400" aria-hidden="true" />

            <div>
              <label htmlFor={filterEstadoId} className="sr-only">
                Filtrar por estado
              </label>
              <select
                id={filterEstadoId}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="min-h-[38px] rounded-xl border border-slate-700 bg-gcf-950 px-3 py-1.5 text-xs font-semibold text-slate-200"
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
                className="min-h-[38px] rounded-xl border border-slate-700 bg-gcf-950 px-3 py-1.5 text-xs font-semibold text-slate-200"
              >
                <option value="TODAS">Todas las Categorías</option>
                {CATEGORIAS_TICKET.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={filterAsignadoId} className="sr-only">
                Filtrar por responsable
              </label>
              <select
                id={filterAsignadoId}
                value={filtroAsignado}
                onChange={(e) => setFiltroAsignado(e.target.value)}
                className="min-h-[38px] rounded-xl border border-slate-700 bg-gcf-950 px-3 py-1.5 text-xs font-semibold text-slate-200"
              >
                <option value="TODOS">Todos los Especialistas</option>
                {EQUIPO_TI_BI.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </search>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-gcf-950/95 text-[11px] font-bold uppercase tracking-wider text-gcf-200">
                <th className="px-3.5 py-3">Código</th>
                <th className="px-3.5 py-3">Prioridad</th>
                <th className="px-3.5 py-3">Requerimiento</th>
                <th className="px-3.5 py-3">Categoría</th>
                <th className="px-3.5 py-3">Solicitante / Sede</th>
                <th className="px-3.5 py-3">Estado</th>
                <th className="px-3.5 py-3">Asignado a</th>
                <th className="px-3.5 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-slate-900/40">
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No hay tickets que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((t) => {
                  const meta = getPrioridadMeta(t.score_prioridad);
                  const estancado = estaEstancadoProveedor(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="cursor-pointer transition hover:bg-gcf-500/10"
                    >
                      <td className="whitespace-nowrap px-3.5 py-3 font-mono font-bold text-gcf-300">
                        {formatCodigoTicket(t.codigo_ticket)}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                        >
                          Score {t.score_prioridad} ({meta.nivel})
                        </span>
                      </td>
                      <td className="max-w-xs px-3.5 py-3 font-semibold text-slate-100">
                        <div className="line-clamp-1">{t.titulo}</div>
                        {t.notas_tecnicas && (
                          <div className="mt-0.5 line-clamp-1 text-[10px] font-normal text-slate-400">
                            Nota: {t.notas_tecnicas}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3 text-slate-300">
                        <div className="inline-flex items-center gap-1.5">
                          <CategorySvgIcon categoria={t.categoria} className="h-4 w-4 shrink-0" />
                          <span>{t.categoria}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-slate-300">
                        <div className="font-medium text-slate-200">
                          {t.solicitante_nombre}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {t.departamento_tienda}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3">
                        <span className="rounded-lg border border-gcf-500/30 bg-gcf-950 px-2 py-1 text-[11px] font-semibold text-gcf-100">
                          {t.estado}
                        </span>
                        {estancado && (
                          <span className="ml-1.5 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                            &gt;48h
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3 font-medium text-slate-200">
                        <div className="inline-flex items-center gap-1.5">
                          <SpecialistAvatarSvg nombre={t.asignado_a} size="sm" />
                          <span>{t.asignado_a}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3 text-slate-400">
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
        onUpdateTicket={onUpdateTicket}
      />
    </div>
  );
};
