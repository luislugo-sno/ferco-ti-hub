import React, { useEffect, useId, useRef, useState } from 'react';
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
  Camera,
  ImagePlus,
  Trash2,
  Wrench,
  BookOpen,
} from 'lucide-react';
import {
  composeUbicacion,
  DEFAULT_ASIGNADO,
  formatCodigoTicket,
  FormSchemaConfig,
  getPrioridadMeta,
  getSedeMeta,
  IMPACTO_LABELS,
  NivelImpacto,
  NivelUrgencia,
  NuevoTicketInput,
  parseUbicacion,
  TicketTI,
  TipoSolicitud,
  URGENCIA_LABELS,
} from '../types/tickets';
import { uploadTicketEvidenceImage } from '../lib/supabase';

interface PortalSolicitudViewProps {
  onCreateTicket: (input: NuevoTicketInput) => Promise<TicketTI>;
  formSchema: FormSchemaConfig;
  onViewTicketStatus?: (codigoFormateado: string) => void;
}

const GRUPOS_SEDES = [
  'General / Corporativo',
  'Centros Logísticos (CDP / CDA)',
  'Tiendas SNÖ',
  'Tiendas Chönkies',
] as const;

interface UploadedImageItem {
  id: string;
  url: string;
  name: string;
  sizeKB: number;
}

export const PortalSolicitudView: React.FC<PortalSolicitudViewProps> = ({
  onCreateTicket,
  formSchema,
  onViewTicketStatus,
}) => {
  const formTitleId = useId();
  const nombreId = useId();
  const deptoId = useId();
  const sedeId = useId();
  const sedeFiltroId = useId();
  const categoriaId = useId();
  const tituloId = useId();
  const descId = useId();
  const fileGalleryRef = useRef<HTMLInputElement>(null);
  const fileCameraRef = useRef<HTMLInputElement>(null);

  const [tipoSolicitud, setTipoSolicitud] = useState<TipoSolicitud>(
    'Soporte Técnico / TI'
  );
  const [solicitanteNombre, setSolicitanteNombre] = useState('');
  const [departamento, setDepartamento] = useState<string>(
    formSchema.departamentos[0] || 'ADMINISTRACIÓN'
  );
  const [sedeComercial, setSedeComercial] = useState<string>(
    formSchema.sedes[0] || 'N/A (Oficina / No aplica)'
  );
  const [busquedaSede, setBusquedaSede] = useState('');

  const activeCategoryList =
    tipoSolicitud === 'Consultas sobre Odoo'
      ? formSchema.modulos_odoo
      : formSchema.categorias_ti;

  const [categoria, setCategoria] = useState<string>(
    activeCategoryList[0] || 'Odoo ERP / TPV Tiendas'
  );
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [impacto, setImpacto] = useState<NivelImpacto>(1);
  const [urgencia, setUrgencia] = useState<NivelUrgencia>(2);

  // Preguntas personalizadas dinámicas
  const [respuestasExtra, setRespuestasExtra] = useState<
    Record<string, string | boolean>
  >({});

  // Evidencias fotográficas comprimidas (máx. 3)
  const [imagenes, setImagenes] = useState<UploadedImageItem[]>([]);
  const [isCompressingImg, setIsCompressingImg] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketCreado, setTicketCreado] = useState<TicketTI | null>(null);
  const [copied, setCopied] = useState(false);

  // Al cambiar entre "Soporte Técnico / TI" y "Consultas sobre Odoo", actualizar la primera categoría correspondiente
  useEffect(() => {
    const list =
      tipoSolicitud === 'Consultas sobre Odoo'
        ? formSchema.modulos_odoo
        : formSchema.categorias_ti;
    if (list.length > 0 && !list.includes(categoria)) {
      setCategoria(list[0]);
    }
  }, [tipoSolicitud, formSchema.modulos_odoo, formSchema.categorias_ti, categoria]);

  const scoreCalculado = impacto * urgencia;
  const metaPrioridad = getPrioridadMeta(scoreCalculado);

  // Vinculación inteligente Departamento <-> Sede Comercial
  const handleDepartamentoChange = (nuevoDepto: string) => {
    setDepartamento(nuevoDepto);
    if (nuevoDepto === 'CDP' || nuevoDepto === 'RECEPCIÓN CDP1') {
      if (formSchema.sedes.includes('CDP1')) setSedeComercial('CDP1');
    } else if (nuevoDepto === 'CDP2') {
      if (formSchema.sedes.includes('CDP2')) setSedeComercial('CDP2');
    } else if (nuevoDepto === 'CDA-CCS') {
      if (formSchema.sedes.includes('CDA-CCS')) setSedeComercial('CDA-CCS');
    } else if (nuevoDepto === 'CDA-BQTO') {
      if (formSchema.sedes.includes('CDA-BQTO')) setSedeComercial('CDA-BQTO');
    } else if (
      nuevoDepto === 'TIENDA' &&
      sedeComercial === 'N/A (Oficina / No aplica)'
    ) {
      const firstStore = formSchema.sedes.find(
        (s) => s.startsWith('SNÖ') || s.startsWith('Chönkies')
      );
      if (firstStore) setSedeComercial(firstStore);
    }
  };

  // Construir lista de sedes con sus metadatos a partir de formSchema.sedes
  const sedesConDetalle = formSchema.sedes.map((valor) => getSedeMeta(valor));

  const sedesFiltradas = sedesConDetalle.filter((item) => {
    if (!busquedaSede.trim()) return true;
    const q = busquedaSede.toLowerCase();
    return (
      item.valor.toLowerCase().includes(q) ||
      (item.razonSocial && item.razonSocial.toLowerCase().includes(q)) ||
      (item.municipio && item.municipio.toLowerCase().includes(q))
    );
  });

  const sedeSeleccionadaInfo = sedesConDetalle.find(
    (s) => s.valor === sedeComercial
  );

  // Preguntas dinámicas activas aplicables al tipo de solicitud actual
  const preguntasActivas = formSchema.preguntas_personalizadas.filter(
    (q) => q.activa && (q.aplica_a === 'Todos' || q.aplica_a === tipoSolicitud)
  );

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const remainingSlots = 3 - imagenes.length;
    if (remainingSlots <= 0) {
      setErrorMsg('Solo se permiten máximo 3 imágenes por requerimiento.');
      e.target.value = '';
      return;
    }

    const selectedFiles = Array.from(fileList).slice(0, remainingSlots);
    setIsCompressingImg(true);
    setErrorMsg('');

    try {
      const uploadedItems: UploadedImageItem[] = [];
      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) continue;
        const res = await uploadTicketEvidenceImage(file);
        uploadedItems.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          url: res.url,
          name: file.name,
          sizeKB: res.sizeKB,
        });
      }
      setImagenes((prev) => [...prev, ...uploadedItems].slice(0, 3));
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Error al comprimir o subir la imagen.'
      );
    } finally {
      setIsCompressingImg(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setImagenes((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!solicitanteNombre.trim()) {
      setErrorMsg('Ingrese el nombre y apellido del solicitante.');
      return;
    }
    if (!titulo.trim()) {
      setErrorMsg('Ingrese un asunto o resumen del requerimiento.');
      return;
    }

    // Validar preguntas personalizadas obligatorias
    for (const q of preguntasActivas) {
      if (q.obligatoria) {
        const val = respuestasExtra[q.titulo];
        if (
          val === undefined ||
          val === '' ||
          (q.tipo === 'casilla_verificacion' && val !== true)
        ) {
          setErrorMsg(`El campo "${q.titulo}" es obligatorio.`);
          return;
        }
      }
    }

    const ubicacionCombinada = composeUbicacion(departamento, sedeComercial);

    // Filtrar respuestasExtra solo de preguntas activas
    const respuestasLimpias: Record<string, string | boolean> = {};
    for (const q of preguntasActivas) {
      const val = respuestasExtra[q.titulo];
      if (val !== undefined && val !== '') {
        respuestasLimpias[q.titulo] = val;
      } else if (q.tipo === 'casilla_verificacion') {
        respuestasLimpias[q.titulo] = Boolean(val);
      }
    }

    setIsSubmitting(true);
    try {
      const created = await onCreateTicket({
        tipo_solicitud: tipoSolicitud,
        solicitante_nombre: solicitanteNombre,
        departamento_tienda: ubicacionCombinada,
        categoria,
        titulo,
        descripcion,
        impacto,
        urgencia,
        estado: 'Bandeja de Entrada',
        asignado_a: DEFAULT_ASIGNADO,
        imagenes_urls: imagenes.map((img) => img.url),
        respuestas_extra: respuestasLimpias,
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
    setImagenes([]);
    setRespuestasExtra({});
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
      <section className="mx-auto max-w-2xl py-4 pb-20 lg:pb-8">
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-slate-300 bg-white p-5 shadow-xs sm:p-8"
        >
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Comprobante de Registro ITSM
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Requerimiento Encolado Exitosamente
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Su solicitud ha sido ingresada en la{' '}
              <strong className="text-slate-900">Bandeja de Entrada</strong> de la Gerencia
              de Inteligencia de Negocios y Tecnología.
            </p>
          </div>

          <div className="my-5 flex flex-col justify-between gap-3 rounded-sm border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Código Oficial de Ticket
              </span>
              <span className="font-mono text-2xl font-bold text-blue-700 sm:text-3xl">
                {codigoFormateado}
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-sm border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 transition hover:bg-slate-100 sm:h-9 sm:min-h-0 sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                    <span>Código Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>

              {onViewTicketStatus && (
                <button
                  type="button"
                  onClick={() => onViewTicketStatus(codigoFormateado)}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 sm:h-9 sm:min-h-0 sm:w-auto"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span>Ver Estado de mi Ticket</span>
                </button>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">Tipo de Solicitud</dt>
              <dd className="mt-0.5 font-semibold text-blue-700">
                {ticketCreado.tipo_solicitud || 'Soporte Técnico / TI'}
              </dd>
            </div>
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
              <dt className="font-medium text-slate-500">
                {ticketCreado.tipo_solicitud === 'Consultas sobre Odoo'
                  ? 'Módulo de Odoo'
                  : 'Categoría de Servicio'}
              </dt>
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
          </dl>

          <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-sm bg-blue-700 px-5 text-xs font-bold text-white transition hover:bg-blue-800 sm:h-10 sm:min-h-0 sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Registrar Nuevo Requerimiento</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl py-1 pb-20 lg:pb-6">
      {/* SELECTOR SUPERIOR DE TIPO DE SOLICITUD (2 PESTAÑAS RECTANGULARES SOBRIAS) */}
      <div className="mb-3 rounded-md border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
        <div className="mb-2.5 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Portal de Atención BI/TI • Grupo Comercializadora Ferco
            </span>
            <h2 id={formTitleId} className="text-sm font-bold text-slate-900 sm:text-base">
              Seleccione el Tipo de Requerimiento
            </h2>
          </div>
          <span className="self-start rounded-sm border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 sm:self-auto">
            Código Automático FER-TI-00X
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Tipo de requerimiento"
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tipoSolicitud === 'Soporte Técnico / TI'}
            onClick={() => setTipoSolicitud('Soporte Técnico / TI')}
            className={`flex min-h-[46px] items-center justify-center gap-2 rounded-sm border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              tipoSolicitud === 'Soporte Técnico / TI'
                ? 'border-blue-700 bg-blue-700 text-white shadow-xs'
                : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Soporte Técnico / TI</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tipoSolicitud === 'Consultas sobre Odoo'}
            onClick={() => setTipoSolicitud('Consultas sobre Odoo')}
            className={`flex min-h-[46px] items-center justify-center gap-2 rounded-sm border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              tipoSolicitud === 'Consultas sobre Odoo'
                ? 'border-blue-700 bg-blue-700 text-white shadow-xs'
                : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Consultas sobre Odoo</span>
          </button>
        </div>
      </div>

      <form
        aria-labelledby={formTitleId}
        onSubmit={handleSubmit}
        method="post"
        className="space-y-5 rounded-md border border-slate-200 bg-white p-4 shadow-xs sm:p-6"
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
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 sm:h-10 sm:min-h-0 sm:text-sm"
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
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 sm:h-10 sm:min-h-0 sm:text-sm"
              >
                {formSchema.departamentos.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector B: Sede Comercial / Tienda / Centro Operativo */}
            <div className="sm:col-span-5">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-1.5">
                <label
                  htmlFor={sedeId}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700"
                >
                  <MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span>Sede Comercial / Centro</span>
                  <span aria-hidden="true" className="text-red-600">*</span>
                </label>

                {/* Buscador rápido integrado para filtrar Sedes o Razón Social */}
                <div className="relative w-36 sm:w-40">
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
                      const firstMatch = sedesConDetalle.find(
                        (s) =>
                          s.valor.toLowerCase().includes(val.toLowerCase()) ||
                          (s.razonSocial &&
                            s.razonSocial.toLowerCase().includes(val.toLowerCase()))
                      );
                      if (val.trim() && firstMatch) {
                        setSedeComercial(firstMatch.valor);
                      }
                    }}
                    placeholder="Filtrar tienda..."
                    className="h-6 w-full rounded-sm border border-slate-200 bg-slate-50 pl-6 pr-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-700 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <select
                id={sedeId}
                name="sede_comercial"
                value={sedeComercial}
                onChange={(e) => setSedeComercial(e.target.value)}
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 sm:h-10 sm:min-h-0 sm:text-sm"
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

        {/* SECCIÓN 2: CLASIFICACIÓN TÉCNICA / MÓDULO ODOO Y DETALLE */}
        <div>
          <h3 className="mb-3 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            2.{' '}
            {tipoSolicitud === 'Consultas sobre Odoo'
              ? 'Módulo de Odoo y Detalle de la Consulta'
              : 'Clasificación Técnica y Detalle del Requerimiento'}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <label
                htmlFor={categoriaId}
                className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
              >
                <Layers className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>
                  {tipoSolicitud === 'Consultas sobre Odoo'
                    ? 'Módulo de Odoo'
                    : 'Categoría de Servicio'}
                </span>
                <span aria-hidden="true" className="text-red-600">*</span>
              </label>
              <select
                id={categoriaId}
                name="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 sm:h-10 sm:min-h-0 sm:text-sm"
              >
                {activeCategoryList.map((cat) => (
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
                <span>Asunto / Resumen del Problema o Consulta</span>
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
                placeholder={
                  tipoSolicitud === 'Consultas sobre Odoo'
                    ? 'Ej: Consulta sobre cuadre de cierre en Punto de Venta Caja 02'
                    : 'Ej: Falla de impresión de etiquetas / Solicitud de acceso'
                }
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 sm:h-10 sm:min-h-0 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-12">
              <label
                htmlFor={descId}
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Descripción Detallada (Pasos, mensajes en pantalla, códigos SKU o documento)
              </label>
              <textarea
                id={descId}
                name="descripcion"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Indique los detalles específicos para agilizar la atención..."
                className="w-full rounded-sm border border-slate-300 bg-white p-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* PREGUNTAS DINÁMICAS PERSONALIZADAS (CONFIGURADAS EN APP_CONFIG) */}
        {preguntasActivas.length > 0 && (
          <div>
            <h3 className="mb-3 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              Información Adicional Requerida
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {preguntasActivas.map((q) => {
                const fieldId = `custom-field-${q.id}`;
                const val = respuestasExtra[q.titulo];

                return (
                  <div
                    key={q.id}
                    className={q.tipo === 'parrafo' ? 'sm:col-span-2' : ''}
                  >
                    {q.tipo === 'casilla_verificacion' ? (
                      <div className="flex min-h-[44px] items-center gap-2.5 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">
                        <input
                          id={fieldId}
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) =>
                            setRespuestasExtra((prev) => ({
                              ...prev,
                              [q.titulo]: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 accent-blue-700"
                        />
                        <label
                          htmlFor={fieldId}
                          className="cursor-pointer select-none text-xs font-semibold text-slate-800"
                        >
                          {q.titulo}{' '}
                          {q.obligatoria && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                      </div>
                    ) : (
                      <>
                        <label
                          htmlFor={fieldId}
                          className="mb-1 block text-xs font-semibold text-slate-700"
                        >
                          {q.titulo}{' '}
                          {q.obligatoria && (
                            <span aria-hidden="true" className="text-red-600">
                              *
                            </span>
                          )}
                        </label>

                        {q.tipo === 'texto_corto' && (
                          <input
                            id={fieldId}
                            type="text"
                            required={q.obligatoria}
                            value={typeof val === 'string' ? val : ''}
                            onChange={(e) =>
                              setRespuestasExtra((prev) => ({
                                ...prev,
                                [q.titulo]: e.target.value,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-10 sm:min-h-0 sm:text-sm"
                          />
                        )}

                        {q.tipo === 'parrafo' && (
                          <textarea
                            id={fieldId}
                            rows={2}
                            required={q.obligatoria}
                            value={typeof val === 'string' ? val : ''}
                            onChange={(e) =>
                              setRespuestasExtra((prev) => ({
                                ...prev,
                                [q.titulo]: e.target.value,
                              }))
                            }
                            className="w-full rounded-sm border border-slate-300 bg-white p-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:text-sm"
                          />
                        )}

                        {q.tipo === 'lista_desplegable' && (
                          <select
                            id={fieldId}
                            required={q.obligatoria}
                            value={typeof val === 'string' ? val : ''}
                            onChange={(e) =>
                              setRespuestasExtra((prev) => ({
                                ...prev,
                                [q.titulo]: e.target.value,
                              }))
                            }
                            className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-10 sm:min-h-0 sm:text-sm"
                          >
                            <option value="">Seleccione una opción...</option>
                            {q.opciones.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECCIÓN DE EVIDENCIAS FOTOGRÁFICAS (MÁX. 3 IMÁGENES COMPRIMIDAS CON CANVAS) */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Evidencias Fotográficas / Capturas de Pantalla (Opcional • Máx. 3)
            </h3>
            <span className="font-mono text-[11px] font-semibold text-slate-500">
              {imagenes.length}/3 adjuntas (Compresión automática Canvas)
            </span>
          </div>

          {/* Inputs ocultos para Galería y Cámara Móvil */}
          <input
            ref={fileGalleryRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
          <input
            ref={fileCameraRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFilesSelected}
            className="hidden"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {imagenes.length < 3 && (
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <button
                  type="button"
                  disabled={isCompressingImg}
                  onClick={() => fileGalleryRef.current?.click()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-sm border border-slate-300 bg-slate-50 px-3.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <ImagePlus className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  <span>{isCompressingImg ? 'Comprimiendo...' : 'Subir de Galería'}</span>
                </button>

                <button
                  type="button"
                  disabled={isCompressingImg}
                  onClick={() => fileCameraRef.current?.click()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-sm border border-slate-300 bg-slate-50 px-3.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <Camera className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  <span>Tomar Foto</span>
                </button>
              </div>
            )}

            {/* Miniaturas de imágenes cargadas */}
            {imagenes.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap">
                {imagenes.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative flex flex-col overflow-hidden rounded-sm border border-slate-300 bg-slate-50 p-1"
                  >
                    <img
                      src={img.url}
                      alt={`Evidencia ${idx + 1}`}
                      width={96}
                      height={72}
                      className="h-16 w-full object-cover sm:h-16 sm:w-24"
                    />
                    <div className="mt-1 flex items-center justify-between gap-1 px-0.5">
                      <span className="font-mono text-[10px] font-semibold text-slate-600">
                        {img.sizeKB} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        aria-label={`Eliminar imagen ${idx + 1}`}
                        className="rounded-sm p-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      className={`flex min-h-[48px] cursor-pointer items-start gap-2.5 rounded-sm border p-3 transition ${
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
                      className={`flex min-h-[48px] cursor-pointer items-start gap-2.5 rounded-sm border p-3 transition ${
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

        {/* BARRA INFERIOR DE RESUMEN DE PRIORIDAD Y BOTÓN DE ENVÍO (W-FULL EN MÓVIL) */}
        <div className="flex flex-col justify-between gap-4 rounded-sm border border-slate-200 bg-slate-50 px-4 py-3.5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-sm border border-slate-300 bg-white font-mono">
              <span className="text-[9px] font-semibold uppercase text-slate-500">
                Score
              </span>
              <span className="text-sm font-bold text-slate-900">{scoreCalculado}</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Prioridad ({impacto} × {urgencia}):
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-bold ${metaPrioridad.badgeClass}`}
                >
                  <span className={`h-2 w-2 rounded-sm ${metaPrioridad.dotClass}`} />
                  {metaPrioridad.codigoSLA} — {metaPrioridad.nivel}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                Ubicación:{' '}
                <strong className="text-slate-700">
                  {composeUbicacion(departamento, sedeComercial)}
                </strong>
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isCompressingImg}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm bg-blue-700 px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:min-h-0 sm:w-auto"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
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
