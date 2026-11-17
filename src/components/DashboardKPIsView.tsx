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
  CATALOGO_DEPARTAMENTOS,
  CATALOGO_SEDES_DETALLE,
  CATEGORIAS_TICKET,
  EQUIPO_TI_BI,
  ESTADOS_TICKET,
  estaEstancadoProveedor,
  formatCodigoTicket,
  getHorasSinMoverse,
  getPrioridadMeta,
  parseUbicacion,
  TicketTI,
} from '../types/tickets';
import { SpecialistBadge } from './BrandSvgElements';
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
        | 'departamento_tienda'
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
  const filterDeptoId = useId();
  const filterSedeId = useId();
  const filterAsignadoId = useId();
  const newPinInputId = useId();

  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('TODOS');
  const [filtroSede, setFiltroSede] = useState<string>('TODAS');
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
      'Codigo Ticket',
      'Fecha Creacion',
      'Solicitante',
      'Departamento / Area',
      'Sede Comercial / Centro',
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
      const ubic = parseUbicacion(t.departamento_tienda);
      return [
        formatCodigoTicket(t.codigo_ticket),
        new Date(t.created_at).toLocaleString('es-VE'),
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
    <div className="space-y-5">
      {/* Cabecera Ejecutiva + Exportación */}
      <div className="flex flex-col justify-between gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:px-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Reporte Ejecutivo de Gestión ITSM • Grupo Comercializadora Ferco
          </span>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Indicadores de Carga Operativa, SLA y Productividad BI/TI
          </h2>
          <p className="text-xs text-slate-600">
            Consolidado de requerimientos por unidad de negocio, sedes comerciales y
            desempeño de resolución.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPinConfig((p) => !p)}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <KeyRound className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span>Configurar PIN</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Exportar Excel / CSV ({historialFiltrado.length})</span>
          </button>
        </div>
      </div>

      {/* Panel desplegable de configuración de PIN */}
      {showPinConfig && (
        <form
          onSubmit={handleSavePin}
          className="flex flex-wrap items-end gap-3 rounded-md border border-slate-300 bg-white p-4 shadow-xs"
        >
          <div>
            <label
              htmlFor={newPinInputId}
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700"
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
              className="h-9 rounded-sm border border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{pinSaved ? 'PIN Guardado' : 'Actualizar PIN'}</span>
          </button>
        </form>
      )}

      {/* 1. TARJETAS RESUMEN DE KPIs (ESTILO FINANCIERO SOBRIO) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Tickets Activos */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Tickets Activos
            </span>
            <Activity className="h-4 w-4 text-blue-700" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900">
              {ticketsActivos.length}
            </span>
            <span className="text-xs text-slate-500">
              de {tickets.length} registrados
            </span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2 py-0.5 font-bold text-red-800">
              <Flame className="h-3 w-3 text-red-600" aria-hidden="true" />
              {ticketsCriticosActivos.length} Críticos (P1/P2)
            </span>
          </div>
        </div>

        {/* Card 2: Tickets Resueltos en la Semana */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resueltos en la Semana
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-emerald-700">
              {ticketsResueltosSemana.length}
            </span>
            <span className="text-xs text-slate-500">
              últimos 7 días ({ticketsResueltosTotal.length} histórico)
            </span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 text-xs text-slate-600">
            Efectividad de cierre:{' '}
            <strong className="font-mono text-slate-900">
              {tickets.length > 0
                ? Math.round((ticketsResueltosTotal.length / tickets.length) * 100)
                : 0}
              %
            </strong>
          </div>
        </div>

        {/* Card 3: Tareas Bloqueadas por Terceros */}
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

        {/* Card 4: Carga Activa Odoo vs Infra vs BI */}
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Carga: Odoo vs Infra vs BI
            </span>
            <Layers className="h-4 w-4 text-blue-700" aria-hidden="true" />
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-1.5">
              <span className="block font-mono text-base font-bold text-slate-900">
                {countOdoo}
              </span>
              <span className="text-[10px] font-semibold text-slate-600">Odoo / TPV</span>
            </div>
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-1.5">
              <span className="block font-mono text-base font-bold text-slate-900">
                {countInfra}
              </span>
              <span className="text-[10px] font-semibold text-slate-600">Infra / Red</span>
            </div>
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-1.5">
              <span className="block font-mono text-base font-bold text-slate-900">
                {countBI}
              </span>
              <span className="text-[10px] font-semibold text-slate-600">BI / Datos</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DESGLOSE EJECUTIVO: PERSONAL BI/TI (4 INTEGRANTES) Y CATEGORÍAS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Tabla Financiera/Ejecutiva de Carga de los 4 Integrantes BI/TI */}
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

          <div className="overflow-x-auto">
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
                  const delMiembro = tickets.filter((t) => t.asignado_a === miembro);
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
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : enProgreso > 0
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
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
              <span>Distribución por Categoría de Servicio</span>
            </h3>
          </div>

          <div className="space-y-3">
            {CATEGORIAS_TICKET.map((cat) => {
              const todosCat = tickets.filter((t) => t.categoria === cat);
              const activosCat = todosCat.filter((t) => t.estado !== 'Resuelto');
              const resueltosCat = todosCat.filter((t) => t.estado === 'Resuelto');
              const pct =
                tickets.length > 0
                  ? Math.round((todosCat.length / tickets.length) * 100)
                  : 0;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="font-bold text-blue-700">
                        {activosCat.length} act.
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-emerald-700">{resueltosCat.length} res.</span>
                      <span className="text-slate-500">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-100 border border-slate-200">
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

      {/* 3. TABLA DE HISTORIAL Y AUDITORÍA DE TICKETS */}
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex flex-col justify-between gap-3 border-b border-slate-200 pb-3 xl:flex-row xl:items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Registro Maestro de Requerimientos (Clic en cualquier fila para abrir ficha)
            </h3>
            <p className="text-[11px] text-slate-500">
              Filtre por estado, categoría, departamento, sede comercial o responsable antes
              de exportar a Excel/CSV.
            </p>
          </div>

          <search className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />

            <div>
              <label htmlFor={filterEstadoId} className="sr-only">
                Filtrar por estado
              </label>
              <select
                id={filterEstadoId}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="h-8 rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800"
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
                className="h-8 rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800"
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
              <label htmlFor={filterDeptoId} className="sr-only">
                Filtrar por departamento
              </label>
              <select
                id={filterDeptoId}
                value={filtroDepartamento}
                onChange={(e) => setFiltroDepartamento(e.target.value)}
                className="h-8 rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800"
              >
                <option value="TODOS">Todos los Departamentos</option>
                {CATALOGO_DEPARTAMENTOS.map((dep) => (
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
                className="h-8 max-w-[180px] rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800"
              >
                <option value="TODAS">Todas las Sedes / Tiendas</option>
                {CATALOGO_SEDES_DETALLE.map((s) => (
                  <option key={s.valor} value={s.valor}>
                    {s.nombreCorto}
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
                className="h-8 max-w-[195px] rounded-sm border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800"
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

        <div className="overflow-x-auto rounded-sm border border-slate-200">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Prioridad</th>
                <th className="px-3 py-2.5">Asunto / Requerimiento</th>
                <th className="px-3 py-2.5">Categoría</th>
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
                    No existen registros que coincidan con los criterios de filtrado.
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
                        {t.categoria}
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
        onUpdateTicket={onUpdateTicket}
      />
    </div>
  );
};
