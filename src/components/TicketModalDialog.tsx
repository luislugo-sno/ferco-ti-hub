import React, { useEffect, useId, useRef, useState } from 'react';
import {
  X,
  Save,
  UserCheck,
  Clock,
  AlertOctagon,
  MessageSquareCode,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  Layers,
  MapPin,
  Image as ImageIcon,
  ZoomIn,
  ClipboardList,
} from 'lucide-react';
import {
  AsignadoA,
  composeUbicacion,
  DEFAULT_ASIGNADO,
  DEFAULT_FORM_SCHEMA,
  EQUIPO_TI_BI,
  ESTADOS_TICKET,
  EstadoTicket,
  estaEstancadoProveedor,
  formatCodigoTicket,
  FormSchemaConfig,
  getHorasSinMoverse,
  getPrioridadMeta,
  NivelImpacto,
  NivelUrgencia,
  parseUbicacion,
  TicketTI,
} from '../types/tickets';
import { SpecialistBadge } from './BrandSvgElements';

interface TicketModalDialogProps {
  ticket: TicketTI | null;
  onClose: () => void;
  formSchema?: FormSchemaConfig;
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

export const TicketModalDialog: React.FC<TicketModalDialogProps> = ({
  ticket,
  onClose,
  formSchema = DEFAULT_FORM_SCHEMA,
  onUpdateTicket,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const notasRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const lightboxTitleId = useId();
  const notasId = useId();
  const asignadoId = useId();
  const categoriaId = useId();
  const deptoEditId = useId();
  const sedeEditId = useId();

  const [estado, setEstado] = useState<EstadoTicket>('Bandeja de Entrada');
  const [asignadoA, setAsignadoA] = useState<AsignadoA>(DEFAULT_ASIGNADO);
  const [categoria, setCategoria] = useState<string>('Odoo ERP / TPV Tiendas');
  const [departamento, setDepartamento] = useState<string>('ADMINISTRACIÓN');
  const [sedeComercial, setSedeComercial] = useState<string>('N/A (Oficina / No aplica)');
  const [impacto, setImpacto] = useState<NivelImpacto>(1);
  const [urgencia, setUrgencia] = useState<NivelUrgencia>(1);
  const [notasTecnicas, setNotasTecnicas] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Lightbox para ver imágenes adjuntas en tamaño completo
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (ticket) {
      const parsedUbic = parseUbicacion(ticket.departamento_tienda);
      setEstado(ticket.estado);
      setAsignadoA(ticket.asignado_a);
      setCategoria(ticket.categoria);
      setDepartamento(parsedUbic.departamento);
      setSedeComercial(parsedUbic.sede);
      setImpacto(ticket.impacto);
      setUrgencia(ticket.urgencia);
      setNotasTecnicas(ticket.notas_tecnicas || '');
      setSavedNotice(false);
      setZoomedImageUrl(null);

      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [ticket]);

  useEffect(() => {
    const lb = lightboxRef.current;
    if (!lb) return;
    if (zoomedImageUrl && !lb.open) {
      lb.showModal();
    } else if (!zoomedImageUrl && lb.open) {
      lb.close();
    }
  }, [zoomedImageUrl]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);

    // Fallback for closedby="any" light dismiss (modern-web-guidance: dialog)
    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
    };

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    };
  }, [onClose]);

  if (!ticket) {
    return (
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        className="hidden"
      />
    );
  }

  const scorePreview = impacto * urgencia;
  const meta = getPrioridadMeta(scorePreview);
  const horasSinMovimiento = getHorasSinMoverse(ticket);
  const estancado = estaEstancadoProveedor(ticket);

  const todasLasCategorias = Array.from(
    new Set([
      ...formSchema.categorias_ti,
      ...formSchema.modulos_odoo,
      ticket.categoria,
    ])
  );

  const imagenesAdjuntas = Array.isArray(ticket.imagenes_urls)
    ? ticket.imagenes_urls
    : [];

  const respuestasExtraEntries =
    ticket.respuestas_extra && typeof ticket.respuestas_extra === 'object'
      ? Object.entries(ticket.respuestas_extra)
      : [];

  const handleQuickStateClick = async (nuevoEstado: EstadoTicket) => {
    setEstado(nuevoEstado);
    setIsSaving(true);
    try {
      await onUpdateTicket(ticket.id, {
        estado: nuevoEstado,
        asignado_a: asignadoA,
        categoria,
        departamento_tienda: composeUbicacion(departamento, sedeComercial),
        impacto,
        urgencia,
        notas_tecnicas: notasTecnicas,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateTicket(ticket.id, {
        estado,
        asignado_a: asignadoA,
        categoria,
        departamento_tienda: composeUbicacion(departamento, sedeComercial),
        impacto,
        urgencia,
        notas_tecnicas: notasTecnicas,
      });
      setSavedNotice(true);
      setTimeout(() => {
        dialogRef.current?.close();
      }, 400);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        className="m-auto w-[calc(100%-1rem)] max-w-2xl rounded-md border border-slate-300 bg-white p-0 text-slate-900 shadow-lg open:flex open:flex-col max-h-[92vh]"
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-sm border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-800">
                {formatCodigoTicket(ticket.codigo_ticket)}
              </span>
              {ticket.tipo_solicitud && (
                <span className="rounded-sm border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                  {ticket.tipo_solicitud}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-bold ${meta.badgeClass}`}
              >
                <span className={`h-2 w-2 rounded-sm ${meta.dotClass}`} />
                Score {scorePreview} — {meta.codigoSLA}
              </span>
              {estancado && (
                <span className="inline-flex items-center gap-1 rounded-sm border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900">
                  <AlertOctagon className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                  +{horasSinMovimiento}h esperando proveedor
                </span>
              )}
            </div>
            <h2 id={titleId} className="text-sm font-bold text-slate-900 sm:text-base">
              {ticket.titulo}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Cerrar ficha técnica del ticket"
            className="shrink-0 rounded-sm p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <form
          onSubmit={handleSaveAll}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
        >
          {/* Metadatos del Solicitante */}
          <div className="grid grid-cols-1 gap-3 rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <div>
                <span className="block text-[10px] font-semibold uppercase text-slate-500">
                  Solicitante
                </span>
                <span className="font-semibold text-slate-900">
                  {ticket.solicitante_nombre}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <div>
                <span className="block text-[10px] font-semibold uppercase text-slate-500">
                  Fecha Creación / Tiempo en Estado
                </span>
                <span className="font-semibold text-slate-900">
                  {new Date(ticket.created_at).toLocaleDateString('es-VE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  ({horasSinMovimiento}h sin moverse)
                </span>
              </div>
            </div>
          </div>

          {/* Descripción Original */}
          <div className="rounded-sm border border-slate-200 bg-white p-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Descripción del Requerimiento
            </span>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
              {ticket.descripcion || 'Sin descripción adicional registrada (Captura rápida).'}
            </p>
          </div>

          {/* Respuestas de Campos Dinámicos Personalizados (respuestas_extra) */}
          {respuestasExtraEntries.length > 0 && (
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <ClipboardList className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                <span>Campos Adicionales del Formulario</span>
              </div>
              <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                {respuestasExtraEntries.map(([pregunta, respuesta]) => (
                  <div
                    key={pregunta}
                    className="rounded-sm border border-slate-200 bg-white px-2.5 py-1.5"
                  >
                    <dt className="text-[10px] font-semibold uppercase text-slate-500">
                      {pregunta}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-slate-900">
                      {typeof respuesta === 'boolean'
                        ? respuesta
                          ? 'Sí'
                          : 'No'
                        : String(respuesta)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Evidencias Fotográficas / Imágenes Adjuntas (Con Lightbox) */}
          {imagenesAdjuntas.length > 0 && (
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                  <span>
                    Evidencias Fotográficas ({imagenesAdjuntas.length})
                  </span>
                </span>
                <span className="text-[10px] text-slate-500">
                  Toque una miniatura para ampliar
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {imagenesAdjuntas.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setZoomedImageUrl(imgUrl)}
                    className="group relative overflow-hidden rounded-sm border border-slate-300 bg-white p-1 text-left transition hover:border-blue-700"
                  >
                    <img
                      src={imgUrl}
                      alt={`Evidencia adjunta ${idx + 1}`}
                      width={160}
                      height={110}
                      className="h-20 w-full object-cover sm:h-24"
                    />
                    <span className="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-blue-700">
                      <ZoomIn className="h-3 w-3" aria-hidden="true" />
                      <span>Ampliar #{idx + 1}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cambio de Estado con 1 Clic */}
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Cambiar Estado Operativo (1 Clic)
            </span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {ESTADOS_TICKET.map((st) => {
                const active = estado === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleQuickStateClick(st)}
                    className={`min-h-[42px] rounded-sm border px-2 py-2 text-center text-xs font-semibold transition sm:min-h-0 ${
                      active
                        ? st === 'Resuelto'
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : st === 'Esperando Proveedor/Tercero'
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ubicación: Departamento y Sede Comercial */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={deptoEditId}
                className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
              >
                <Building2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Departamento / Área</span>
              </label>
              <select
                id={deptoEditId}
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-xs"
              >
                {Array.from(
                  new Set([...formSchema.departamentos, departamento])
                ).map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={sedeEditId}
                className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
              >
                <MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Sede Comercial / Centro</span>
              </label>
              <select
                id={sedeEditId}
                value={sedeComercial}
                onChange={(e) => setSedeComercial(e.target.value)}
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-xs"
              >
                {Array.from(new Set([...formSchema.sedes, sedeComercial])).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Asignación (4 Integrantes BI/TI) y Categoría */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={asignadoId}
                className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
              >
                <UserCheck className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Responsable BI/TI Asignado</span>
              </label>
              <div className="flex items-center gap-2">
                <SpecialistBadge nombre={asignadoA} size="md" />
                <select
                  id={asignadoId}
                  name="asignado_a"
                  value={asignadoA}
                  onChange={(e) => setAsignadoA(e.target.value as AsignadoA)}
                  className="min-h-[44px] flex-1 rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-xs"
                >
                  {EQUIPO_TI_BI.map((miembro) => (
                    <option key={miembro} value={miembro}>
                      {miembro}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor={categoriaId}
                className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
              >
                <Layers className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Categoría / Módulo</span>
              </label>
              <select
                id={categoriaId}
                name="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-xs"
              >
                {todasLasCategorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ajuste rápido de Impacto x Urgencia en Triage */}
          <div className="grid grid-cols-1 gap-3 rounded-sm border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Ajustar Impacto (1–3)
              </span>
              <div className="flex gap-1.5">
                {([1, 2, 3] as NivelImpacto[]).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setImpacto(n)}
                    className={`min-h-[38px] flex-1 rounded-sm border py-1 text-xs font-bold transition sm:min-h-0 ${
                      impacto === n
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Impacto {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Ajustar Urgencia (1–3)
              </span>
              <div className="flex gap-1.5">
                {([1, 2, 3] as NivelUrgencia[]).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setUrgencia(n)}
                    className={`min-h-[38px] flex-1 rounded-sm border py-1 text-xs font-bold transition sm:min-h-0 ${
                      urgencia === n
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Urgencia {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notas Técnicas */}
          <div>
            <label
              htmlFor={notasId}
              className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <MessageSquareCode className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              <span>Bitácora / Notas Técnicas de Resolución o Proveedor</span>
            </label>
            <textarea
              ref={notasRef}
              id={notasId}
              name="notas_tecnicas"
              rows={3}
              autoFocus
              value={notasTecnicas}
              onChange={(e) => setNotasTecnicas(e.target.value)}
              placeholder="Documente diagnóstico técnico, número de ticket con proveedor ISP/Odoo o solución aplicada..."
              className="w-full rounded-sm border border-slate-300 bg-white p-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 sm:text-xs"
            />
          </div>

          {/* Pie del Modal */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="text-xs">
              {savedNotice ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Ficha actualizada correctamente
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Presione Esc para cerrar
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:h-9 sm:min-h-0 sm:w-auto"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-sm bg-blue-700 px-5 text-xs font-bold text-white transition hover:bg-blue-800 disabled:opacity-60 sm:h-9 sm:min-h-0 sm:w-auto"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </form>
      </dialog>

      {/* Modal Lightbox para Vista Ampliada de Evidencia Fotográfica */}
      <dialog
        ref={lightboxRef}
        aria-labelledby={lightboxTitleId}
        onClose={() => setZoomedImageUrl(null)}
        {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        className="m-auto w-[calc(100%-1rem)] max-w-4xl rounded-md border border-slate-300 bg-white p-3 text-slate-900 shadow-2xl open:flex open:flex-col"
      >
        <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 id={lightboxTitleId} className="text-xs font-bold uppercase text-slate-800">
            Vista Ampliada de Evidencia Adjunta — {formatCodigoTicket(ticket.codigo_ticket)}
          </h3>
          <button
            type="button"
            onClick={() => setZoomedImageUrl(null)}
            className="rounded-sm border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200"
          >
            Cerrar Vista
          </button>
        </div>
        {zoomedImageUrl && (
          <div className="flex max-h-[80vh] items-center justify-center overflow-auto bg-slate-100 p-2">
            <img
              src={zoomedImageUrl}
              alt="Evidencia ampliada"
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          </div>
        )}
      </dialog>
    </>
  );
};
