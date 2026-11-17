import React, { useId, useState } from 'react';
import {
  Send,
  Building2,
  User,
  Layers,
  AlertTriangle,
  Clock,
  FileText,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  CATEGORIAS_TICKET,
  CategoriaTicket,
  DEPARTAMENTOS_FERCO,
  formatCodigoTicket,
  getPrioridadMeta,
  IMPACTO_LABELS,
  NivelImpacto,
  NivelUrgencia,
  NuevoTicketInput,
  TicketTI,
  URGENCIA_LABELS,
} from '../types/tickets';
import {
  CategorySvgIcon,
  ImpactoVectorSvg,
  SuccessTicketVectorSvg,
  UrgenciaVectorSvg,
} from './BrandSvgElements';

interface PortalSolicitudViewProps {
  onCreateTicket: (input: NuevoTicketInput) => Promise<TicketTI>;
}

export const PortalSolicitudView: React.FC<PortalSolicitudViewProps> = ({
  onCreateTicket,
}) => {
  const formTitleId = useId();
  const nombreId = useId();
  const deptoId = useId();
  const otroDeptoId = useId();
  const categoriaId = useId();
  const tituloId = useId();
  const descId = useId();

  const [solicitanteNombre, setSolicitanteNombre] = useState('');
  const [departamentoSelect, setDepartamentoSelect] = useState(DEPARTAMENTOS_FERCO[0]);
  const [departamentoOtro, setDepartamentoOtro] = useState('');
  const [categoria, setCategoria] = useState<CategoriaTicket>('Odoo ERP / TPV Tiendas');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const deptoFinal =
      departamentoSelect === 'Otro' ? departamentoOtro.trim() : departamentoSelect;

    if (!solicitanteNombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre y apellido.');
      return;
    }
    if (!deptoFinal) {
      setErrorMsg('Por favor especifica el nombre de tu departamento, sede o tienda.');
      return;
    }
    if (!titulo.trim()) {
      setErrorMsg('Por favor escribe un título breve para tu requerimiento.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onCreateTicket({
        solicitante_nombre: solicitanteNombre,
        departamento_tienda: deptoFinal,
        categoria,
        titulo,
        descripcion,
        impacto,
        urgencia,
        estado: 'Bandeja de Entrada',
        asignado_a: 'Luis Lugo',
      });
      setTicketCreado(created);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al registrar la solicitud. Intenta nuevamente.'
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

    return (
      <section className="mx-auto max-w-2xl py-6 sm:py-10">
        <div
          role="status"
          aria-live="polite"
          className="overflow-hidden rounded-2xl border border-gcf-500/40 bg-slate-900/95 p-6 sm:p-8 shadow-gcf-glow"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3">
              <SuccessTicketVectorSvg className="h-20 w-20" />
            </div>

            <span className="rounded-full border border-gcf-400/40 bg-gcf-500/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-gcf-100">
              Solicitud Encolada Exitosamente
            </span>

            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              ¡Requerimiento Registrado!
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              Tu solicitud ya se encuentra en la{' '}
              <strong className="text-white">Bandeja de Entrada</strong> del Hub Operativo de
              la Gerencia de Inteligencia de Negocios y Tecnología.
            </p>

            {/* Tarjeta del Código Generado */}
            <div className="mt-6 w-full max-w-md rounded-2xl border border-gcf-500/30 bg-gcf-950/90 p-5 shadow-inner">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gcf-300">
                Código Oficial de Seguimiento
              </span>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-black tracking-tight text-gcf-300 sm:text-4xl">
                  {codigoFormateado}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gcf-500/40 bg-slate-900 px-3 py-2 text-xs font-semibold text-gcf-100 transition hover:border-gcf-400 hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-gcf-300" aria-hidden="true" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800/90 pt-4 text-left text-xs">
                <div>
                  <dt className="text-slate-400">Solicitante</dt>
                  <dd className="mt-0.5 font-semibold text-slate-100">
                    {ticketCreado.solicitante_nombre}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Departamento / Tienda</dt>
                  <dd className="mt-0.5 font-semibold text-slate-100">
                    {ticketCreado.departamento_tienda}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Categoría</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-gcf-200">
                    <CategorySvgIcon
                      categoria={ticketCreado.categoria}
                      className="h-4 w-4 shrink-0"
                    />
                    <span className="truncate">{ticketCreado.categoria}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Prioridad Asignada</dt>
                  <dd className="mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${createdMeta.badgeClass}`}
                    >
                      {createdMeta.codigoSLA} (Score {ticketCreado.score_prioridad})
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gcf-500 to-gcf-800 px-5 py-3 text-xs font-bold text-white shadow-gcf-glow transition hover:brightness-110"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Registrar Otra Solicitud</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl py-2 sm:py-4">
      {/* Banner informativo superior con estética GCF */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-gcf-500/30 bg-gradient-to-r from-gcf-900/60 via-slate-900/95 to-gcf-950/90 p-4 sm:p-5 shadow-gcf-glow">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gcf-300">
              <Sparkles className="h-4 w-4 text-gcf-400" aria-hidden="true" />
              <span>Portal Unificado de Atención TI y Business Intelligence</span>
            </div>
            <h2 id={formTitleId} className="text-lg font-bold text-white sm:text-xl">
              Registro de Requerimiento o Incidencia Técnica
            </h2>
            <p className="text-xs leading-relaxed text-slate-300">
              Evita reportes dispersos por WhatsApp o pasillo. Toda solicitud registrada aquí
              recibe un código único <code className="text-gcf-200 font-semibold">FER-TI-00X</code> y se
              prioriza automáticamente según su <strong className="text-white">Impacto × Urgencia</strong>.
            </p>
          </div>
          <div className="hidden sm:flex shrink-0 items-center justify-center rounded-2xl border border-gcf-500/30 bg-gcf-950/80 p-3">
            <CategorySvgIcon categoria={categoria} className="h-10 w-10" />
          </div>
        </div>
      </div>

      <form
        aria-labelledby={formTitleId}
        onSubmit={handleSubmit}
        method="post"
        className="space-y-6 rounded-2xl border border-gcf-500/20 bg-slate-900/80 p-5 shadow-xl sm:p-7"
      >
        {/* Bloque 1: Identificación del Solicitante */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor={nombreId}
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              <User className="h-3.5 w-3.5 text-gcf-400" aria-hidden="true" />
              <span>Nombre y Apellido del Solicitante</span>
              <span aria-hidden="true" className="text-rose-400">*</span>
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
              className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-gcf-950/90 px-3.5 py-2.5 text-base text-white placeholder:text-sm placeholder:text-slate-500 focus:border-gcf-500 focus:outline-none focus:ring-2 focus:ring-gcf-500/30"
            />
          </div>

          <div>
            <label
              htmlFor={deptoId}
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              <Building2 className="h-3.5 w-3.5 text-gcf-400" aria-hidden="true" />
              <span>Departamento / Tienda Comercial</span>
              <span aria-hidden="true" className="text-rose-400">*</span>
            </label>
            <select
              id={deptoId}
              name="departamento_tienda"
              value={departamentoSelect}
              onChange={(e) => setDepartamentoSelect(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-gcf-950/90 px-3.5 py-2.5 text-base text-white focus:border-gcf-500 focus:outline-none focus:ring-2 focus:ring-gcf-500/30"
            >
              {DEPARTAMENTOS_FERCO.map((dep) => (
                <option key={dep} value={dep}>
                  {dep === 'Otro' ? 'Otro (Especificar sede o área...)' : dep}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Campo condicional si elige "Otro" en Departamento/Tienda */}
        {departamentoSelect === 'Otro' && (
          <div className="rounded-xl border border-gcf-500/35 bg-gcf-900/25 p-4">
            <label
              htmlFor={otroDeptoId}
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gcf-200"
            >
              Especifica tu Departamento, Sucursal o Tienda{' '}
              <span aria-hidden="true" className="text-rose-400">*</span>
            </label>
            <input
              id={otroDeptoId}
              name="departamento_otro"
              type="text"
              required
              value={departamentoOtro}
              onChange={(e) => setDepartamentoOtro(e.target.value)}
              placeholder="Ej: Tienda Ferco Centro / Almacén Externo Zona Industrial"
              className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-gcf-950/90 px-3.5 py-2.5 text-base text-white placeholder:text-sm placeholder:text-slate-500 focus:border-gcf-500 focus:outline-none focus:ring-2 focus:ring-gcf-500/30"
            />
          </div>
        )}

        {/* Bloque 2: Categoría con Selector Visual SVG + Título */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor={categoriaId}
              className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              <Layers className="h-3.5 w-3.5 text-gcf-400" aria-hidden="true" />
              <span>Categoría del Servicio TI / BI</span>
              <span aria-hidden="true" className="text-rose-400">*</span>
            </label>

            {/* Tarjetas SVG interactivas de Categoría sincronizadas con el select nativo */}
            <div className="mb-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {CATEGORIAS_TICKET.map((cat) => {
                const isSelected = categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                      isSelected
                        ? 'border-gcf-400 bg-gcf-500/20 text-white shadow-sm ring-1 ring-gcf-400/40'
                        : 'border-slate-800 bg-gcf-950/60 text-slate-300 hover:border-gcf-500/40 hover:text-white'
                    }`}
                  >
                    <CategorySvgIcon categoria={cat} className="h-6 w-6 shrink-0" />
                    <span className="text-xs font-semibold leading-tight">{cat}</span>
                  </button>
                );
              })}
            </div>

            <select
              id={categoriaId}
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaTicket)}
              className="sr-only"
            >
              {CATEGORIAS_TICKET.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={tituloId}
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              <FileText className="h-3.5 w-3.5 text-gcf-400" aria-hidden="true" />
              <span>Asunto / Resumen del Problema o Solicitud</span>
              <span aria-hidden="true" className="text-rose-400">*</span>
            </label>
            <input
              id={tituloId}
              name="titulo"
              type="text"
              required
              maxLength={140}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Error al validar factura fiscal en Caja 02 de Odoo"
              className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-gcf-950/90 px-3.5 py-2.5 text-base text-white placeholder:text-sm placeholder:text-slate-500 focus:border-gcf-500 focus:outline-none focus:ring-2 focus:ring-gcf-500/30"
            />
          </div>
        </div>

        {/* Descripción detallada */}
        <div>
          <label
            htmlFor={descId}
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Descripción Detallada (Pasos, mensajes de error, códigos de producto o anexos)
          </label>
          <textarea
            id={descId}
            name="descripcion"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe qué estabas haciendo, qué mensaje mostró el sistema o qué información requiere el reporte de BI..."
            className="w-full rounded-xl border border-slate-700 bg-gcf-950/90 p-3.5 text-base text-white placeholder:text-sm placeholder:text-slate-500 focus:border-gcf-500 focus:outline-none focus:ring-2 focus:ring-gcf-500/30"
          />
        </div>

        {/* Bloque 3: Matriz de Priorización (Impacto x Urgencia con Radio Buttons e Ilustraciones SVG) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Nivel de Impacto */}
          <fieldset className="rounded-2xl border border-slate-800 bg-gcf-950/60 p-4">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-gcf-300">
              <AlertTriangle className="h-3.5 w-3.5 text-gcf-400" aria-hidden="true" />
              <span>1. Nivel de Impacto (Alcance Operativo)</span>
            </legend>
            <div className="mt-2 space-y-2.5">
              {([1, 2, 3] as NivelImpacto[]).map((nivel) => {
                const info = IMPACTO_LABELS[nivel];
                const isSelected = impacto === nivel;
                const radioId = `impacto-radio-${nivel}`;
                return (
                  <div
                    key={nivel}
                    onClick={() => setImpacto(nivel)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      isSelected
                        ? nivel === 3
                          ? 'border-rose-500/60 bg-rose-950/25'
                          : nivel === 2
                          ? 'border-amber-500/60 bg-amber-950/20'
                          : 'border-gcf-400/70 bg-gcf-500/15'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <input
                      id={radioId}
                      type="radio"
                      name="impacto"
                      value={nivel}
                      checked={isSelected}
                      onChange={() => setImpacto(nivel)}
                      className="h-4 w-4 shrink-0 accent-[#6A87E4]"
                    />
                    <ImpactoVectorSvg nivel={nivel} className="h-8 w-8 shrink-0" />
                    <label htmlFor={radioId} className="cursor-pointer select-none">
                      <span className="block text-xs font-bold text-white">
                        {info.corto}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-300">
                        {info.detalle}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* Nivel de Urgencia */}
          <fieldset className="rounded-2xl border border-slate-800 bg-gcf-950/60 p-4">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-gcf-300">
              <Clock className="h-3.5 w-3.5 text-gcf-400" aria-hidden="true" />
              <span>2. Nivel de Urgencia (Tiempo de Respuesta)</span>
            </legend>
            <div className="mt-2 space-y-2.5">
              {([1, 2, 3] as NivelUrgencia[]).map((nivel) => {
                const info = URGENCIA_LABELS[nivel];
                const isSelected = urgencia === nivel;
                const radioId = `urgencia-radio-${nivel}`;
                return (
                  <div
                    key={nivel}
                    onClick={() => setUrgencia(nivel)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      isSelected
                        ? nivel === 3
                          ? 'border-rose-500/60 bg-rose-950/25'
                          : nivel === 2
                          ? 'border-amber-500/60 bg-amber-950/20'
                          : 'border-gcf-400/70 bg-gcf-500/15'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <input
                      id={radioId}
                      type="radio"
                      name="urgencia"
                      value={nivel}
                      checked={isSelected}
                      onChange={() => setUrgencia(nivel)}
                      className="h-4 w-4 shrink-0 accent-[#6A87E4]"
                    />
                    <UrgenciaVectorSvg nivel={nivel} className="h-8 w-8 shrink-0" />
                    <label htmlFor={radioId} className="cursor-pointer select-none">
                      <span className="block text-xs font-bold text-white">
                        {info.corto}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-300">
                        {info.detalle}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Barra inferior de Previsualización de Prioridad y Envío */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gcf-500/25 bg-gcf-950/90 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-gcf-500/40 bg-gcf-900/50 font-mono">
              <span className="text-[9px] uppercase text-gcf-200">Score</span>
              <span className="text-base font-black text-white">{scoreCalculado}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  Prioridad Calculada (Impacto {impacto} × Urgencia {urgencia}):
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-bold ${metaPrioridad.badgeClass}`}
                >
                  <span className={`h-2 w-2 rounded-full ${metaPrioridad.dotClass}`} />
                  {metaPrioridad.codigoSLA} — Nivel {metaPrioridad.nivel}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                El equipo de TI/BI validará este nivel en la Bandeja de Entrada (Triage).
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gcf-500 to-gcf-800 px-6 py-3 text-sm font-bold text-white shadow-gcf-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{isSubmitting ? 'Encolando Ticket...' : 'Enviar Requerimiento TI/BI'}</span>
          </button>
        </div>

        <div aria-live="polite">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-200">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </form>
    </section>
  );
};
