import React, { useId, useState } from 'react';
import {
  Send,
  Building2,
  User,
  Layers,
  AlertTriangle,
  Clock,
  FileText,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Search,
} from 'lucide-react';
import {
  CATALOGO_DEPARTAMENTOS,
  CATALOGO_SEDES_DETALLE,
  CATEGORIAS_TICKET,
  CategoriaTicket,
  composeUbicacion,
  DEFAULT_ASIGNADO,
  formatCodigoTicket,
  getPrioridadMeta,
  IMPACTO_LABELS,
  NivelImpacto,
  NivelUrgencia,
  NuevoTicketInput,
  parseUbicacion,
  TicketTI,
  URGENCIA_LABELS,
} from '../types/tickets';

interface PortalSolicitudViewProps {
  onCreateTicket: (input: NuevoTicketInput) => Promise<TicketTI>;
}

const GRUPOS_SEDES = [
  'General / Corporativo',
  'Centros Logísticos (CDP / CDA)',
  'Tiendas SNÖ',
  'Tiendas Chönkies',
] as const;

export const PortalSolicitudView: React.FC<PortalSolicitudViewProps> = ({
  onCreateTicket,
}) => {
  const formTitleId = useId();
  const nombreId = useId();
  const deptoId = useId();
  const sedeId = useId();
  const sedeFiltroId = useId();
  const categoriaId = useId();
  const tituloId = useId();
  const descId = useId();

  const [solicitanteNombre, setSolicitanteNombre] = useState('');
  const [departamento, setDepartamento] = useState<string>('ADMINISTRACIÓN');
  const [sedeComercial, setSedeComercial] = useState<string>(
    'N/A (Oficina / No aplica)'
  );
  const [busquedaSede, setBusquedaSede] = useState('');
  const [categoria, setCategoria] = useState<CategoriaTicket>(
    'Odoo ERP / TPV Tiendas'
  );
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [impacto, setImpacto] = useState<NivelImpacto>(1);
  const [urgencia, setUrgencia] = useState<NivelUrgencia>(2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketCreado, setTicketCreado] = useState<TicketTI | null>(null);
  const [copied, setCopied] = useState(false);

  const scoreCalculado = impacto * urgencia;
  const metaPrioridad = getPrioridadMeta(scoreCalculado);

  // Vinculación inteligente Departamento <-> Sede Comercial
  const handleDepartamentoChange = (nuevoDepto: string) => {
    setDepartamento(nuevoDepto);
    if (nuevoDepto === 'CDP' || nuevoDepto === 'RECEPCIÓN CDP1') {
      setSedeComercial('CDP1');
    } else if (nuevoDepto === 'CDP2') {
      setSedeComercial('CDP2');
    } else if (nuevoDepto === 'CDA-CCS') {
      setSedeComercial('CDA-CCS');
    } else if (nuevoDepto === 'CDA-BQTO') {
      setSedeComercial('CDA-BQTO');
    } else if (
      nuevoDepto === 'TIENDA' &&
      sedeComercial === 'N/A (Oficina / No aplica)'
    ) {
      setSedeComercial(
        'SNÖ Delicias (Grupo Ferco Maracaibo C.A. - Maracaibo)'
      );
    }
  };

  // Filtrado rápido del catálogo de sedes
  const sedesFiltradas = CATALOGO_SEDES_DETALLE.filter((item) => {
    if (!busquedaSede.trim()) return true;
    const q = busquedaSede.toLowerCase();
    return (
      item.valor.toLowerCase().includes(q) ||
      (item.razonSocial && item.razonSocial.toLowerCase().includes(q)) ||
      (item.municipio && item.municipio.toLowerCase().includes(q))
    );
  });

  const sedeSeleccionadaInfo = CATALOGO_SEDES_DETALLE.find(
    (s) => s.valor === sedeComercial
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!solicitanteNombre.trim()) {
      setErrorMsg('Ingrese el nombre y apellido del solicitante.');
      return;
    }
    if (!titulo.trim()) {
      setErrorMsg('Ingrese un asunto o resumen técnico del requerimiento.');
      return;
    }

    const ubicacionCombinada = composeUbicacion(departamento, sedeComercial);

    setIsSubmitting(true);
    try {
      const created = await onCreateTicket({
        solicitante_nombre: solicitanteNombre,
        departamento_tienda: ubicacionCombinada,
        categoria,
        titulo,
        descripcion,
        impacto,
        urgencia,
        estado: 'Bandeja de Entrada',
        asignado_a: DEFAULT_ASIGNADO,
      });
      setTicketCreado(created);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Error al registrar la solicitud. Intente nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTicketCreado(null);
    setTitulo('');
    setDescripcion('');
    setImpacto(1);
    setUrgencia(2);
    setErrorMsg('');
    setCopied(false);
  };

  const handleCopyCode = () => {
    if (!ticketCreado) return;
    const code = formatCodigoTicket(ticketCreado.codigo_ticket);
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (ticketCreado) {
    const codigoFormateado = formatCodigoTicket(ticketCreado.codigo_ticket);
    const createdMeta = getPrioridadMeta(ticketCreado.score_prioridad);
    const ubicacionCreada = parseUbicacion(ticketCreado.departamento_tienda);

    return (
      <section className="mx-auto max-w-2xl py-6">
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-slate-300 bg-white p-6 shadow-xs sm:p-8"
        >
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Comprobante de Registro ITSM
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Requerimiento Encolado Exitosamente
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Su solicitud ha sido ingresada en la{' '}
              <strong className="text-slate-900">Bandeja de Entrada</strong> de la Gerencia
              de Inteligencia de Negocios y Tecnología.
            </p>
          </div>

          <div className="my-5 flex flex-col justify-between gap-4 rounded-sm border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Código Oficial de Ticket
              </span>
              <span className="font-mono text-2xl font-bold text-blue-700 sm:text-3xl">
                {codigoFormateado}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span>Código Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          </div>

          <dl className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">Solicitante</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {ticketCreado.solicitante_nombre}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Departamento / Área</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {ubicacionCreada.departamento}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Sede Comercial / Centro</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {ubicacionCreada.sede}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Categoría de Servicio</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {ticketCreado.categoria}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Nivel de Prioridad Inicial</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-bold ${createdMeta.badgeClass}`}
                >
                  {createdMeta.codigoSLA} (Score {ticketCreado.score_prioridad})
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Asignación Inicial</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {ticketCreado.asignado_a}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-sm bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Registrar Nuevo Requerimiento</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl py-2">
      {/* Encabezado Técnico Sobrio */}
      <div className="mb-4 rounded-md border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Módulo de Captura ITSM • Control de Requerimientos BI/TI
            </span>
            <h2 id={formTitleId} className="text-base font-bold text-slate-900 sm:text-lg">
              Formulario de Solicitud de Soporte y Requerimientos Técnicos
            </h2>
          </div>
          <span className="rounded-sm border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
            Matriz Impacto × Urgencia
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-600">
          Complete los datos de su área o tienda comercial. El sistema asignará un código
          secuencial <code className="font-mono font-semibold text-slate-800">FER-TI-00X</code>{' '}
          para seguimiento formal.
        </p>
      </div>

      <form
        aria-labelledby={formTitleId}
        onSubmit={handleSubmit}
        method="post"
        className="space-y-5 rounded-md border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
      >
        {/* SECCIÓN 1: IDENTIFICACIÓN Y UBICACIÓN ORGANIZACIONAL */}
        <div>
          <h3 className="mb-3 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Datos del Solicitante y Ubicación Operativa
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            {/* Nombre del Solicitante */}
            <div className="sm:col-span-4">
              <label
                htmlFor={nombreId}
                className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
              >
                <User className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Nombre y Apellido</span>
                <span aria-hidden="true" className="text-red-600">*</span>
              </label>
              <input
                id={nombreId}
                name="solicitante_nombre"
                type="text"
                autoComplete="name"
                required
                value={solicitanteNombre}
                onChange={(e) => setSolicitanteNombre(e.target.value)}
                placeholder="Ej: María Fernanda Gómez"
                className="h-9 w-full rounded-sm border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              />
            </div>

            {/* Selector A: Departamento / Área */}
            <div className="sm:col-span-3">
              <label
                htmlFor={deptoId}
                className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
              >
                <Building2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Departamento / Área</span>
                <span aria-hidden="true" className="text-red-600">*</span>
              </label>
              <select
                id={deptoId}
                name="departamento"
                value={departamento}
                onChange={(e) => handleDepartamentoChange(e.target.value)}
                className="h-9 w-full rounded-sm border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              >
                {CATALOGO_DEPARTAMENTOS.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector B: Sede Comercial / Tienda / Centro Operativo */}
            <div className="sm:col-span-5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <label
                  htmlFor={sedeId}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700"
                >
                  <MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span>Sede Comercial / Centro Operativo</span>
                  <span aria-hidden="true" className="text-red-600">*</span>
                </label>

                {/* Buscador rápido integrado para filtrar Sedes o Razón Social */}
                <div className="relative w-40">
                  <Search
                    className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <label htmlFor={sedeFiltroId} className="sr-only">
                    Filtrar sede comercial o razón social
                  </label>
                  <input
                    id={sedeFiltroId}
                    type="search"
                    value={busquedaSede}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBusquedaSede(val);
                      const firstMatch = CATALOGO_SEDES_DETALLE.find(
                        (s) =>
                          s.valor.toLowerCase().includes(val.toLowerCase()) ||
                          (s.razonSocial &&
                            s.razonSocial.toLowerCase().includes(val.toLowerCase()))
                      );
                      if (val.trim() && firstMatch) {
                        setSedeComercial(firstMatch.valor);
                      }
                    }}
                    placeholder="Filtrar tienda/razón..."
                    className="h-6 w-full rounded-sm border border-slate-200 bg-slate-50 pl-6 pr-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-blue-700 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <select
                id={sedeId}
                name="sede_comercial"
                value={sedeComercial}
                onChange={(e) => setSedeComercial(e.target.value)}
                className="h-9 w-full rounded-sm border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              >
                {GRUPOS_SEDES.map((grupo) => {
                  const itemsGrupo = sedesFiltradas.filter((s) => s.grupo === grupo);
                  if (itemsGrupo.length === 0) return null;
                  return (
                    <optgroup key={grupo} label={grupo}>
                      {itemsGrupo.map((sede) => (
                        <option key={sede.valor} value={sede.valor}>
                          {sede.valor}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>

              {sedeSeleccionadaInfo?.razonSocial && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Razón Social:{' '}
                  <strong className="font-semibold text-slate-700">
                    {sedeSeleccionadaInfo.razonSocial}
                  </strong>
                  {sedeSeleccionadaInfo.municipio
                    ? ` • Municipio: ${sedeSeleccionadaInfo.municipio}`
                    : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: CLASIFICACIÓN TÉCNICA Y DETALLE */}
        <div>
          <h3 className="mb-3 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            2. Clasificación y Detalle del Requerimiento
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <label
                htmlFor={categoriaId}
                className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
              >
                <Layers className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Categoría de Servicio</span>
                <span aria-hidden="true" className="text-red-600">*</span>
              </label>
              <select
                id={categoriaId}
                name="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaTicket)}
                className="h-9 w-full rounded-sm border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              >
                {CATEGORIAS_TICKET.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-8">
              <label
                htmlFor={tituloId}
                className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Asunto / Resumen del Problema o Solicitud</span>
                <span aria-hidden="true" className="text-red-600">*</span>
              </label>
              <input
                id={tituloId}
                name="titulo"
                type="text"
                required
                maxLength={140}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Diferencia al cerrar sesión de TPV Caja 02 en Odoo / Solicitud de reporte de inventario"
                className="h-9 w-full rounded-sm border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div className="sm:col-span-12">
              <label
                htmlFor={descId}
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Descripción Técnica / Contexto Operativo (Pasos, mensajes de error, códigos SKU o detalle de BI)
              </label>
              <textarea
                id={descId}
                name="descripcion"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Indique los detalles específicos para agilizar el diagnóstico sin requerir consultas adicionales..."
                className="w-full rounded-sm border border-slate-300 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: MATRIZ DE PRIORIZACIÓN (IMPACTO X URGENCIA) */}
        <div>
          <h3 className="mb-3 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            3. Matriz de Priorización Operativa (Impacto × Urgencia)
          </h3>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Nivel de Impacto */}
            <fieldset className="rounded-sm border border-slate-200 bg-slate-50 p-3.5">
              <legend className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-slate-800">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                <span>Nivel de Impacto (Alcance)</span>
              </legend>
              <div className="mt-2 space-y-2">
                {([1, 2, 3] as NivelImpacto[]).map((nivel) => {
                  const info = IMPACTO_LABELS[nivel];
                  const isSelected = impacto === nivel;
                  const radioId = `impacto-radio-${nivel}`;
                  return (
                    <div
                      key={nivel}
                      onClick={() => setImpacto(nivel)}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-sm border p-2.5 transition ${
                        isSelected
                          ? 'border-blue-700 bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        id={radioId}
                        type="radio"
                        name="impacto"
                        value={nivel}
                        checked={isSelected}
                        onChange={() => setImpacto(nivel)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700"
                      />
                      <label htmlFor={radioId} className="cursor-pointer select-none">
                        <span className="block text-xs font-bold text-slate-900">
                          {info.corto}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-slate-600">
                          {info.detalle}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {/* Nivel de Urgencia */}
            <fieldset className="rounded-sm border border-slate-200 bg-slate-50 p-3.5">
              <legend className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Clock className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                <span>Nivel de Urgencia (Tiempo)</span>
              </legend>
              <div className="mt-2 space-y-2">
                {([1, 2, 3] as NivelUrgencia[]).map((nivel) => {
                  const info = URGENCIA_LABELS[nivel];
                  const isSelected = urgencia === nivel;
                  const radioId = `urgencia-radio-${nivel}`;
                  return (
                    <div
                      key={nivel}
                      onClick={() => setUrgencia(nivel)}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-sm border p-2.5 transition ${
                        isSelected
                          ? 'border-blue-700 bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        id={radioId}
                        type="radio"
                        name="urgencia"
                        value={nivel}
                        checked={isSelected}
                        onChange={() => setUrgencia(nivel)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700"
                      />
                      <label htmlFor={radioId} className="cursor-pointer select-none">
                        <span className="block text-xs font-bold text-slate-900">
                          {info.corto}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-slate-600">
                          {info.detalle}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>

        {/* BARRA INFERIOR DE RESUMEN DE PRIORIDAD Y BOTÓN DE ENVÍO */}
        <div className="flex flex-col justify-between gap-4 rounded-sm border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-sm border border-slate-300 bg-white font-mono">
              <span className="text-[9px] font-semibold uppercase text-slate-500">
                Score
              </span>
              <span className="text-sm font-bold text-slate-900">{scoreCalculado}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Cálculo Matriz (Impacto {impacto} × Urgencia {urgencia}):
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-bold ${metaPrioridad.badgeClass}`}
                >
                  <span className={`h-2 w-2 rounded-sm ${metaPrioridad.dotClass}`} />
                  {metaPrioridad.codigoSLA} — {metaPrioridad.nivel}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Ubicación registrada:{' '}
                <strong className="text-slate-700">
                  {composeUbicacion(departamento, sedeComercial)}
                </strong>
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-blue-700 px-5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isSubmitting ? 'Registrando...' : 'Registrar Requerimiento'}</span>
          </button>
        </div>

        <div aria-live="polite">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </form>
    </section>
  );
};
