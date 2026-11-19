import React, { useCallback, useEffect, useId, useState } from 'react';
import {
  Search,
  FilePlus2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Building2,
  Calendar,
  MessageSquareText,
  Layers,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  ClipboardList,
} from 'lucide-react';
import {
  EstadoTicket,
  formatCodigoTicket,
  formatSafeDateTime,
  getPrioridadMeta,
  parseUbicacion,
  PublicTicketTI,
} from '../types/tickets';
import { fetchPublicTicketByCodigo, subscribeToTicketsTI } from '../lib/supabase';
import { SpecialistBadge } from './BrandSvgElements';

interface ConsultarTicketViewProps {
  initialCodigoParam?: string | null;
  onNavigateToSolicitar: () => void;
}

const STEPPER_HITOS: Array<{
  estado: EstadoTicket;
  titulo: string;
  descripcion: string;
}> = [
  {
    estado: 'Bandeja de Entrada',
    titulo: '1. Bandeja de Entrada',
    descripcion: 'Recibido en cola de Triage BI/TI',
  },
  {
    estado: 'En Cola',
    titulo: '2. En Cola',
    descripcion: 'Clasificado y asignado a especialista',
  },
  {
    estado: 'En Progreso',
    titulo: '3. En Progreso',
    descripcion: 'Atención técnica o desarrollo en curso',
  },
  {
    estado: 'Resuelto',
    titulo: '4. Resuelto',
    descripcion: 'Requerimiento completado y cerrado',
  },
];

const STEPPER_STATES_ORDER = [
  'Bandeja de Entrada',
  'En Cola',
  'En Progreso',
  'Resuelto',
];

function getSafeStepIndex(estadoRaw?: string | null): number {
  const st = typeof estadoRaw === 'string' && estadoRaw.trim() ? estadoRaw.trim() : 'Bandeja de Entrada';
  if (st === 'Esperando Proveedor/Tercero') return 2;
  const idx = STEPPER_STATES_ORDER.indexOf(st);
  return idx >= 0 ? idx : 0;
}

function extractSafeCodeNumber(input?: string | null): number {
  if (typeof input !== 'string' || !input.trim()) return Number.NaN;
  const cleanDigits = input.replace(/\D/g, '');
  if (!cleanDigits) return Number.NaN;
  return parseInt(cleanDigits, 10);
}

export const ConsultarTicketView: React.FC<ConsultarTicketViewProps> = ({
  initialCodigoParam,
  onNavigateToSolicitar,
}) => {
  const searchInputId = useId();

  const [queryInput, setQueryInput] = useState<string>(() => {
    try {
      if (initialCodigoParam) return String(initialCodigoParam);
      const params = new URLSearchParams(window.location.search);
      return params.get('codigo') || '';
    } catch {
      return '';
    }
  });

  const [searchedCodeNum, setSearchedCodeNum] = useState<number | null>(() => {
    try {
      const raw =
        initialCodigoParam ||
        new URLSearchParams(window.location.search).get('codigo') ||
        '';
      const num = extractSafeCodeNumber(raw);
      return !Number.isNaN(num) && num > 0 ? num : null;
    } catch {
      return null;
    }
  });

  const [ticketResult, setTicketResult] = useState<PublicTicketTI | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>('');

  const executeLookup = useCallback(async (num: number, updateUrl = true) => {
    if (typeof num !== 'number' || Number.isNaN(num) || num <= 0) {
      setInputError('Código inválido. Verifique el número de ticket ingresado.');
      setTicketResult(null);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setInputError('');
    setSearchedCodeNum(num);

    const formatted = formatCodigoTicket(num);
    if (updateUrl) {
      try {
        const nextUrl = `/consultar?codigo=${encodeURIComponent(formatted)}`;
        if (window.location.pathname + window.location.search !== nextUrl) {
          window.history.replaceState({}, '', nextUrl);
        }
      } catch {
        // Ignorar si history.replaceState está restringido
      }
    }

    try {
      const res = await fetchPublicTicketByCodigo(num);
      setTicketResult(res?.ticket ?? null);
      setHasSearched(true);
    } catch (err) {
      console.error('Error al consultar ticket:', err);
      setTicketResult(null);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Lectura defensiva del parámetro ?codigo=FER-TI-002 al montar o cambiar prop
  useEffect(() => {
    try {
      const paramCode =
        initialCodigoParam ||
        new URLSearchParams(window.location.search).get('codigo');

      if (paramCode && paramCode.trim()) {
        setQueryInput(paramCode);
        const num = extractSafeCodeNumber(paramCode);
        if (!Number.isNaN(num) && num > 0) {
          void executeLookup(num, false);
        } else {
          setInputError('Código inválido en el enlace. Ingrese un código válido (ej. FER-TI-002 o 2).');
          setTicketResult(null);
          setHasSearched(false);
        }
      }
    } catch (err) {
      console.warn('Error leyendo parámetro URL en ConsultarTicketView:', err);
    }
  }, [initialCodigoParam, executeLookup]);

  // Suscripción en tiempo real: si cambia el ticket consultado, refrescar sin recargar
  useEffect(() => {
    if (searchedCodeNum === null || Number.isNaN(searchedCodeNum)) return;
    const unsubscribe = subscribeToTicketsTI(() => {
      void executeLookup(searchedCodeNum, false);
    });
    return () => unsubscribe();
  }, [searchedCodeNum, executeLookup]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');

    const num = extractSafeCodeNumber(queryInput);
    if (Number.isNaN(num) || num <= 0) {
      setInputError(
        'Código inválido. Ingrese el código completo (ej. FER-TI-0014) o únicamente el número (ej. 14).'
      );
      setTicketResult(null);
      setHasSearched(false);
      return;
    }

    await executeLookup(num, true);
  };

  // ==========================================================================
  // PROGRAMACIÓN DEFENSIVA ESTRICTA PARA TODAS LAS PROPIEDADES DEL TICKET
  // ==========================================================================
  const ticket = ticketResult;
  const imagenes = Array.isArray(ticket?.imagenes_urls)
    ? ticket.imagenes_urls.filter(
        (u): u is string => typeof u === 'string' && u.trim().length > 0
      )
    : [];
  const extras =
    ticket?.respuestas_extra &&
    typeof ticket.respuestas_extra === 'object' &&
    !Array.isArray(ticket.respuestas_extra)
      ? ticket.respuestas_extra
      : {};
  const extrasEntries = Object.entries(extras);
  const estadoActual = ticket?.estado || 'Bandeja de Entrada';
  const notaPublica =
    typeof ticket?.nota_publica === 'string' ? ticket.nota_publica : '';
  const fechaCreacion = ticket?.created_at
    ? formatSafeDateTime(ticket.created_at, 'Sin fecha')
    : 'Sin fecha';
  const fechaActualizacion = ticket?.updated_at
    ? formatSafeDateTime(ticket.updated_at, fechaCreacion)
    : fechaCreacion;
  const fechaResolucion = ticket?.fecha_resolucion
    ? formatSafeDateTime(ticket.fecha_resolucion, '')
    : '';

  const stepIndex = getSafeStepIndex(estadoActual);
  const isWaitingThirdParty = estadoActual === 'Esperando Proveedor/Tercero';
  const ubicacion = parseUbicacion(ticket?.departamento_tienda);
  const prioridadMeta = getPrioridadMeta(ticket?.score_prioridad ?? 1);
  const codigoMostrado = formatCodigoTicket(ticket?.codigo_ticket);
  const tipoSolicitud = ticket?.tipo_solicitud || 'Soporte Técnico / TI';
  const tituloMostrado = ticket?.titulo || 'Requerimiento registrado';
  const solicitanteMostrado = ticket?.solicitante_nombre || 'Usuario Solicitante';
  const categoriaMostrada = ticket?.categoria || 'General';
  const asignadoMostrado = ticket?.asignado_a || 'Luis Lugo - Analista BI/TI';

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-1 pb-20 lg:pb-8">
      {/* 1. BLOQUE PRINCIPAL DE ACCIÓN RÁPIDA: CONSULTAR O REGISTRAR NUEVA SOLICITUD */}
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Portal Público de Atención • Gerencia BI/TI Ferco
            </span>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Seguimiento en Línea de Solicitudes y Soporte Técnico
            </h2>
            <p className="text-xs text-slate-600">
              Consulte el estatus en tiempo real de su ticket existente o registre un
              nuevo requerimiento de TI / Odoo.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToSolicitar}
            className="inline-flex min-h-[46px] w-full shrink-0 items-center justify-center gap-2 rounded-sm bg-blue-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-blue-800 sm:w-auto"
          >
            <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Registrar Nueva Solicitud / Reportar Incidencia</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* 2. BUSCADOR DE TICKET POR CÓDIGO O NÚMERO (<search>) */}
      <search className="rounded-md border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label
            htmlFor={searchInputId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-800"
          >
            Consultar Estado de mi Ticket (Ingrese código completo o número)
          </label>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id={searchInputId}
                type="search"
                value={queryInput}
                onChange={(e) => {
                  setQueryInput(e.target.value);
                  if (inputError) setInputError('');
                }}
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Ej: FER-TI-0014 o solo el número 14"
                className="min-h-[48px] w-full rounded-sm border border-slate-300 bg-white pl-10 pr-4 font-mono text-base font-semibold uppercase text-slate-900 placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-sm bg-slate-900 px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>{isSearching ? 'Consultando...' : 'Consultar Ticket'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              Puede escribir{' '}
              <code className="font-mono font-semibold text-slate-700">FER-TI-002</code>,{' '}
              <code className="font-mono font-semibold text-slate-700">fer-ti-2</code> o
              directamente <code className="font-mono font-semibold text-slate-700">2</code>.
            </span>
          </div>

          <div aria-live="polite">
            {inputError && (
              <div className="flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                <span>{inputError}</span>
              </div>
            )}
          </div>
        </form>
      </search>

      {/* 3. ALERTA SOBRIA SI EL CÓDIGO NO EXISTE */}
      {hasSearched && !isSearching && !ticket && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-slate-300 bg-white p-5 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-amber-300 bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                No se encontró ningún requerimiento con el código{' '}
                <span className="font-mono text-blue-700">
                  {searchedCodeNum ? formatCodigoTicket(searchedCodeNum) : queryInput}
                </span>
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Verifique que el número ingresado coincida con el comprobante emitido al
                registrar su solicitud. Si aún no ha registrado su requerimiento, puede
                crearlo haciendo clic en{' '}
                <button
                  type="button"
                  onClick={onNavigateToSolicitar}
                  className="font-bold text-blue-700 underline hover:text-blue-800"
                >
                  Registrar Nueva Solicitud
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. TARJETA ESTRUCTURADA DE SEGUIMIENTO DEL TICKET ENCONTRADO */}
      {ticket && (
        <article
          aria-label={`Estado del ticket ${codigoMostrado}`}
          className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-xs"
        >
          {/* Cabecera del Ticket */}
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-sm font-bold text-blue-800">
                  {codigoMostrado}
                </span>

                <span className="rounded-sm border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold uppercase text-slate-700">
                  {tipoSolicitud}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-bold ${prioridadMeta.badgeClass}`}
                >
                  <span className={`h-2 w-2 rounded-sm ${prioridadMeta.dotClass}`} />
                  Prioridad {prioridadMeta.nivel}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  searchedCodeNum && void executeLookup(searchedCodeNum, false)
                }
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 self-start rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:min-h-0 sm:self-auto"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Actualizar Estatus</span>
              </button>
            </div>

            <h3 className="mt-2.5 text-base font-bold text-slate-900 sm:text-lg">
              {tituloMostrado}
            </h3>

            {/* Fechas de registro y última actualización */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Registrado:</span>
                <strong className="font-semibold text-slate-800">
                  {fechaCreacion}
                </strong>
              </span>

              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Última actualización:</span>
                <strong className="font-semibold text-slate-800">
                  {fechaActualizacion}
                </strong>
              </span>
            </div>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            {/* BARRA DE PROGRESO VISUAL (STEPPER HORIZONTAL EN PC / VERTICAL EN MÓVIL) */}
            <div>
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Progreso de Atención del Requerimiento
                </span>
                <span className="rounded-sm border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-900">
                  Estado actual: {estadoActual}
                </span>
              </div>

              {/* Alerta destacada si está en 'Esperando Proveedor/Tercero' */}
              {isWaitingThirdParty && (
                <div
                  role="status"
                  className="mb-3 flex items-start gap-2.5 rounded-sm border border-amber-400 bg-amber-50 p-3 text-xs text-amber-950"
                >
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                    aria-hidden="true"
                  />
                  <div>
                    <strong className="block font-bold text-amber-900">
                      Estado Especial: Esperando Proveedor / Tercero Externo
                    </strong>
                    <span className="mt-0.5 block leading-relaxed text-amber-800">
                      Este requerimiento ya fue diagnosticado por el equipo BI/TI y se
                      encuentra a la espera de validación, respuesta o intervención de un
                      proveedor o tercero externo (ej. proveedor de internet/ISP, soporte
                      externo o autorización).
                    </span>
                  </div>
                </div>
              )}

              {/* Stepper: Vertical en móvil (grid-cols-1), Horizontal en PC (sm:grid-cols-4) */}
              <ol
                aria-label="Hitos de progreso del ticket"
                className="grid grid-cols-1 gap-2 sm:grid-cols-4"
              >
                {STEPPER_HITOS.map((hito, idx) => {
                  const isCompleted =
                    idx < stepIndex || (idx === 3 && estadoActual === 'Resuelto');
                  const isCurrent =
                    idx === stepIndex && estadoActual !== 'Resuelto';
                  const isCurrentWaiting = isCurrent && isWaitingThirdParty;

                  let boxClasses =
                    'border-slate-200 bg-slate-50 text-slate-500';
                  let badgeClasses =
                    'border-slate-300 bg-white text-slate-500';

                  if (isCompleted) {
                    boxClasses =
                      'border-emerald-300 bg-emerald-50/60 text-emerald-950';
                    badgeClasses =
                      'border-emerald-600 bg-emerald-600 text-white';
                  } else if (isCurrentWaiting) {
                    boxClasses =
                      'border-2 border-amber-500 bg-amber-50 text-amber-950';
                    badgeClasses =
                      'border-amber-600 bg-amber-500 text-white';
                  } else if (isCurrent) {
                    boxClasses =
                      'border-2 border-blue-700 bg-blue-50/50 text-slate-900';
                    badgeClasses =
                      'border-blue-700 bg-blue-700 text-white';
                  }

                  return (
                    <li
                      key={hito.estado}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={`flex items-start gap-2.5 rounded-sm border p-3 transition sm:flex-col sm:gap-1.5 ${boxClasses}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border font-mono text-xs font-bold ${badgeClasses}`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <span className="text-xs font-bold leading-tight">
                          {isCurrentWaiting
                            ? '3. Esperando Proveedor'
                            : hito.titulo}
                        </span>
                      </div>

                      <p className="text-[11px] leading-snug opacity-85">
                        {isCurrentWaiting
                          ? 'En espera de validación o respuesta de tercero externo'
                          : hito.descripcion}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* RECUADRO DESTACADO: ACTUALIZACIÓN / RESPUESTA DEL EQUIPO BI/TI (ÚNICAMENTE NOTA_PUBLICA) */}
            <div className="rounded-sm border border-slate-200 border-l-4 border-l-blue-700 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800">
                <MessageSquareText className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <span>Actualización / Respuesta del Equipo BI/TI</span>
              </div>

              {notaPublica.trim().length > 0 ? (
                <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-900">
                  {notaPublica}
                </p>
              ) : (
                <p className="mt-2 text-xs italic leading-relaxed text-slate-600">
                  Tu solicitud está siendo gestionada por el equipo de BI/TI. Te
                  actualizaremos por este medio ante cualquier avance.
                </p>
              )}
            </div>

            {/* METADATOS PÚBLICOS DEL REQUERIMIENTO Y ESPECIALISTA ASIGNADO */}
            <dl className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 text-xs sm:grid-cols-3">
              <div className="rounded-sm border border-slate-200 bg-white p-3">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <UserCheck className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                  <span>Especialista Asignado</span>
                </dt>
                <dd className="mt-1.5 flex items-center gap-2 font-bold text-slate-900">
                  <SpecialistBadge nombre={asignadoMostrado} size="sm" />
                  <span>{asignadoMostrado}</span>
                </dd>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white p-3">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span>Solicitante y Ubicación</span>
                </dt>
                <dd className="mt-1 font-bold text-slate-900">
                  {solicitanteMostrado}
                </dd>
                <dd className="mt-0.5 text-[11px] text-slate-600">
                  {ubicacion.departamento}
                  {ubicacion.sede !== 'N/A (Oficina / No aplica)'
                    ? ` • ${ubicacion.sede}`
                    : ''}
                </dd>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white p-3">
                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Layers className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span>Categoría / Módulo</span>
                </dt>
                <dd className="mt-1 font-bold text-slate-900">
                  {categoriaMostrada}
                </dd>
                {fechaResolucion && (
                  <dd className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                    Resuelto: {fechaResolucion}
                  </dd>
                )}
              </div>
            </dl>

            {/* Respuestas adicionales del formulario si existen */}
            {extrasEntries.length > 0 && (
              <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <ClipboardList className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                  <span>Datos Adicionales Registrados</span>
                </div>
                <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  {extrasEntries.map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-sm border border-slate-200 bg-white px-2.5 py-1.5"
                    >
                      <dt className="text-[10px] font-semibold uppercase text-slate-500">
                        {k}
                      </dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">
                        {typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v ?? '')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Miniaturas de evidencias si el usuario adjuntó fotos */}
            {imagenes.length > 0 && (
              <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                  <span>Evidencias Adjuntas ({imagenes.length})</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {imagenes.map((url, i) => (
                    <a
                      key={`${url}-${i}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-sm border border-slate-300 bg-white p-1 hover:border-blue-700"
                    >
                      <img
                        src={url}
                        alt={`Evidencia ${i + 1}`}
                        className="h-20 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  );
};
