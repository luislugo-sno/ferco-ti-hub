import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_ASIGNADO,
  DEFAULT_FORM_SCHEMA,
  FormSchemaConfig,
  normalizeAsignadoA,
  NuevoTicketInput,
  PublicTicketTI,
  TicketTI,
} from '../types/tickets';
import { sendTelegramTicketNotification } from './notifications';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
    rawKey &&
    rawUrl.startsWith('http') &&
    !rawUrl.includes('tu-proyecto-id.supabase.co') &&
    !rawKey.endsWith('...')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl!, rawKey!)
  : null;

const LOCAL_STORAGE_KEY = 'ferco_tickets_ti_v2';
const LOCAL_PIN_STORAGE_KEY = 'ferco_admin_custom_pin';
const LOCAL_FORM_SCHEMA_KEY = 'ferco_form_schema_v1';
const BROADCAST_CHANNEL_NAME = 'ferco_tickets_ti_realtime_sync';

const horasAtras = (horas: number): string =>
  new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();

const SEED_TICKETS: TicketTI[] = [
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000001',
    codigo_ticket: 1,
    created_at: horasAtras(74),
    updated_at: horasAtras(62),
    tipo_solicitud: 'Soporte Técnico / TI',
    solicitante_nombre: 'Roberto Méndez',
    departamento_tienda: 'TIENDA | SNÖ Delicias (Grupo Ferco Maracaibo C.A. - Maracaibo)',
    categoria: 'Infraestructura / Redes / Starlink',
    titulo: 'Intermitencia en enlace principal y failover a Starlink en SNÖ Delicias',
    descripcion:
      'El enlace de fibra óptica presenta pérdida de paquetes del 45%. Estamos operando sobre el backup de Starlink pero necesitamos revisión del proveedor fibra y ajuste en el balanceador MikroTik.',
    impacto: 3,
    urgencia: 2,
    score_prioridad: 6,
    estado: 'Esperando Proveedor/Tercero',
    asignado_a: 'Plinio Becerra - Analista de Soluciones de Negocio',
    nota_publica:
      'El enlace de respaldo Starlink se encuentra operativo en la tienda mientras el proveedor externo de fibra óptica realiza la reparación en la troncal de la zona.',
    notas_tecnicas:
      'Se abrió ticket #ISP-99412 con el proveedor de fibra óptica. Failover automático en router MikroTik activo sobre antena Starlink.',
    fecha_resolucion: null,
    imagenes_urls: [],
    respuestas_extra: {},
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000002',
    codigo_ticket: 2,
    created_at: horasAtras(5),
    updated_at: horasAtras(2),
    tipo_solicitud: 'Consultas sobre Odoo',
    solicitante_nombre: 'Gabriela Rojas',
    departamento_tienda: 'TIENDA | SNÖ Sambil (Operadora 1903 C.A. - Maracaibo)',
    categoria: 'Punto de Venta / TPV',
    titulo: 'Diferencia en sincronización de sesión de Punto de Venta (Caja 03) en Odoo',
    descripcion:
      'Al intentar cerrar la sesión del TPV en Caja 03 aparece alerta de asiento descuadrado por nota de crédito en divisas IGTF.',
    impacto: 3,
    urgencia: 3,
    score_prioridad: 9,
    estado: 'En Progreso',
    asignado_a: 'Luis Lugo - Analista BI/TI',
    nota_publica:
      'Se está verificando el asiento del diario de pagos en divisas junto con Contabilidad para habilitar el cierre de la Caja 03.',
    notas_tecnicas:
      'Revisando diarios de pago IGTF y conciliación de pos.order en Odoo. Validando con CONTABILIDAD antes de forzar cierre.',
    fecha_resolucion: null,
    imagenes_urls: [],
    respuestas_extra: {},
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000003',
    codigo_ticket: 3,
    created_at: horasAtras(18),
    updated_at: horasAtras(4),
    tipo_solicitud: 'Soporte Técnico / TI',
    solicitante_nombre: 'Carlos Villamizar',
    departamento_tienda: 'GERENCIA',
    categoria: 'Business Intelligence / Reportes',
    titulo: 'Actualización de Dashboard de Rotación de Inventario y Margen por Familia',
    descripcion:
      'Incluir el comparativo intermensual de rotación de tiendas SNÖ y Chönkies y alerta de stock mínimo para comité de Junta Directiva.',
    impacto: 2,
    urgencia: 3,
    score_prioridad: 6,
    estado: 'En Progreso',
    asignado_a: 'Juan García - Gerente BI/TI',
    nota_publica:
      'El modelo de datos ya fue actualizado con los cierres recientes. Estamos validando los indicadores por sede comercial.',
    notas_tecnicas:
      'Vista materializada en PostgreSQL lista. Ajustando filtros por Razón Social y Municipio.',
    fecha_resolucion: null,
    imagenes_urls: [],
    respuestas_extra: {},
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000004',
    codigo_ticket: 4,
    created_at: horasAtras(9),
    updated_at: horasAtras(8),
    tipo_solicitud: 'Consultas sobre Odoo',
    solicitante_nombre: 'Mariana Pérez',
    departamento_tienda: 'CADENA DE SUMINISTROS | CDP1',
    categoria: 'Compras',
    titulo: 'Automatizar carga masiva de listas de precios de proveedores vía plantilla Excel',
    descripcion:
      'Necesitamos asistente para actualizar costos de reposición sin editar línea por línea en acuerdos de compra de CDP1 y CDP2.',
    impacto: 2,
    urgencia: 2,
    score_prioridad: 4,
    estado: 'En Cola',
    asignado_a: 'Leonardo Semprun - Especialista de Soluciones de Negocio',
    nota_publica: '',
    notas_tecnicas: 'Se diseñará validador previo de SKU para evitar duplicados.',
    fecha_resolucion: null,
    imagenes_urls: [],
    respuestas_extra: {},
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000005',
    codigo_ticket: 5,
    created_at: horasAtras(1),
    updated_at: horasAtras(1),
    tipo_solicitud: 'Soporte Técnico / TI',
    solicitante_nombre: 'Andrés Morales',
    departamento_tienda: 'RRHH',
    categoria: 'Accesos / Google Workspace',
    titulo: 'Creación de cuenta corporativa Google Workspace y permisos Odoo para nuevo analista',
    descripcion:
      'Ingreso programado en departamento de CONTABILIDAD. Requiere correo corporativo, grupo de distribución y perfil en Odoo.',
    impacto: 1,
    urgencia: 2,
    score_prioridad: 2,
    estado: 'Bandeja de Entrada',
    asignado_a: 'Luis Lugo - Analista BI/TI',
    nota_publica: '',
    notas_tecnicas: '',
    fecha_resolucion: null,
    imagenes_urls: [],
    respuestas_extra: {},
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000006',
    codigo_ticket: 6,
    created_at: horasAtras(28),
    updated_at: horasAtras(6),
    tipo_solicitud: 'Soporte Técnico / TI',
    solicitante_nombre: 'Elena Castillo',
    departamento_tienda: 'OPERACIONES | CDA-CCS',
    categoria: 'Hardware / Impresoras / Equipos',
    titulo: 'Configuración de impresora térmica Zebra de etiquetas en CDA-CCS',
    descripcion:
      'Se desconfiguró el tamaño de etiqueta de código de barras tras reinicio de estación de recepción.',
    impacto: 2,
    urgencia: 2,
    score_prioridad: 4,
    estado: 'Resuelto',
    asignado_a: 'Plinio Becerra - Analista de Soluciones de Negocio',
    nota_publica:
      'Impresora Zebra calibrada y operativa con formato estándar 50x25mm en la estación de recepción de CDA-CCS.',
    notas_tecnicas:
      'Se calibró sensor de gap en Zebra ZD220 y se fijó perfil 50x25mm predeterminado en el servidor de impresión.',
    fecha_resolucion: horasAtras(6),
    imagenes_urls: [],
    respuestas_extra: {},
  },
];

function normalizeSingleTicket(raw: Partial<TicketTI> | null | undefined): TicketTI {
  const t = raw || {};
  const imp = (Number(t.impacto) >= 1 && Number(t.impacto) <= 3 ? Number(t.impacto) : 1) as 1 | 2 | 3;
  const urg = (Number(t.urgencia) >= 1 && Number(t.urgencia) <= 3 ? Number(t.urgencia) : 1) as 1 | 2 | 3;
  const score = Number(t.score_prioridad) > 0 ? Number(t.score_prioridad) : imp * urg;

  return {
    id: typeof t.id === 'string' && t.id ? t.id : `ticket-${t.codigo_ticket || Date.now()}`,
    codigo_ticket: Number(t.codigo_ticket) || 0,
    created_at:
      typeof t.created_at === 'string' && t.created_at
        ? t.created_at
        : new Date().toISOString(),
    updated_at:
      typeof t.updated_at === 'string' && t.updated_at
        ? t.updated_at
        : typeof t.created_at === 'string' && t.created_at
        ? t.created_at
        : new Date().toISOString(),
    tipo_solicitud:
      t.tipo_solicitud === 'Consultas sobre Odoo'
        ? 'Consultas sobre Odoo'
        : 'Soporte Técnico / TI',
    solicitante_nombre:
      typeof t.solicitante_nombre === 'string' && t.solicitante_nombre.trim()
        ? t.solicitante_nombre.trim()
        : 'Solicitante',
    departamento_tienda:
      typeof t.departamento_tienda === 'string' && t.departamento_tienda.trim()
        ? t.departamento_tienda.trim()
        : 'ADMINISTRACIÓN',
    categoria:
      typeof t.categoria === 'string' && t.categoria.trim()
        ? t.categoria.trim()
        : 'Soporte General',
    titulo:
      typeof t.titulo === 'string' && t.titulo.trim()
        ? t.titulo.trim()
        : 'Requerimiento sin asunto',
    descripcion: typeof t.descripcion === 'string' ? t.descripcion : '',
    impacto: imp,
    urgencia: urg,
    score_prioridad: score,
    estado:
      t.estado === 'En Cola' ||
      t.estado === 'En Progreso' ||
      t.estado === 'Esperando Proveedor/Tercero' ||
      t.estado === 'Resuelto'
        ? t.estado
        : 'Bandeja de Entrada',
    asignado_a: normalizeAsignadoA(t.asignado_a),
    nota_publica: typeof t.nota_publica === 'string' ? t.nota_publica : '',
    notas_tecnicas: typeof t.notas_tecnicas === 'string' ? t.notas_tecnicas : '',
    fecha_resolucion:
      typeof t.fecha_resolucion === 'string' ? t.fecha_resolucion : null,
    imagenes_urls: Array.isArray(t.imagenes_urls)
      ? t.imagenes_urls.filter((u): u is string => typeof u === 'string' && u.length > 0)
      : [],
    respuestas_extra:
      t.respuestas_extra &&
      typeof t.respuestas_extra === 'object' &&
      !Array.isArray(t.respuestas_extra)
        ? t.respuestas_extra
        : {},
  };
}

function normalizeTicketsList(list: unknown): TicketTI[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is Partial<TicketTI> => Boolean(item && typeof item === 'object'))
    .map((item) => normalizeSingleTicket(item));
}

function getLocalTickets(): TicketTI[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_TICKETS));
      return SEED_TICKETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeTicketsList(parsed) : SEED_TICKETS;
  } catch {
    return SEED_TICKETS;
  }
}

function saveLocalTickets(tickets: TicketTI[], newlyCreated?: TicketTI): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      if (newlyCreated) {
        bc.postMessage({ type: 'NEW_TICKET_CREATED', payload: newlyCreated });
      } else {
        bc.postMessage({ type: 'SYNC_TICKETS', payload: tickets });
      }
      bc.close();
    }
  } catch (err) {
    console.error('Error guardando tickets en almacenamiento local:', err);
  }
}

/**
 * Sanitiza un TicketTI eliminando estrictamente notas_tecnicas para el Portal Público
 */
export function sanitizePublicTicket(ticket: Partial<TicketTI> | null | undefined): PublicTicketTI {
  const normalized = normalizeSingleTicket(ticket);
  const { notas_tecnicas: _privateNotes, ...publicFields } = normalized;
  return {
    ...publicFields,
    nota_publica: normalized.nota_publica ?? '',
  };
}

/**
 * Consulta un ticket por su número de codigo_ticket para la vista pública "Consultar mi Ticket",
 * excluyendo bajo cualquier circunstancia el campo privado notas_tecnicas.
 */
export async function fetchPublicTicketByCodigo(
  codigoNumero: number
): Promise<{ ticket: PublicTicketTI | null; mode: 'supabase' | 'local' }> {
  const safeNum = Number(codigoNumero);
  if (Number.isNaN(safeNum) || safeNum <= 0) {
    return { ticket: null, mode: supabase ? 'supabase' : 'local' };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tickets_ti')
        .select('*')
        .eq('codigo_ticket', safeNum)
        .maybeSingle();

      if (!error && data) {
        return {
          ticket: sanitizePublicTicket(data as Partial<TicketTI>),
          mode: 'supabase',
        };
      }

      if (!error && !data) {
        return { ticket: null, mode: 'supabase' };
      }
      console.warn('Error consultando ticket en Supabase, verificando local:', error?.message);
    } catch (err) {
      console.warn('Fallback a búsqueda local para Consultar mi Ticket:', err);
    }
  }

  const localList = getLocalTickets();
  const found = localList.find((t) => Number(t?.codigo_ticket) === safeNum);
  return {
    ticket: found ? sanitizePublicTicket(found) : null,
    mode: 'local',
  };
}

// ============================================================================
// 1. PERSISTENCIA GLOBAL DE PIN EN SUPABASE (tabla app_config -> key: 'admin_pin')
// ============================================================================

export function getCachedAdminPin(): string {
  try {
    const custom = localStorage.getItem(LOCAL_PIN_STORAGE_KEY);
    if (custom && custom.trim().length >= 4) return custom.trim();
  } catch {
    // ignore
  }
  const envPin = import.meta.env.VITE_ADMIN_PIN as string | undefined;
  return envPin && envPin.trim().length > 0 ? envPin.trim() : '1234';
}

export async function fetchAdminPinFromSupabase(): Promise<{
  pin: string;
  mode: 'supabase' | 'local';
}> {
  const fallbackPin = getCachedAdminPin();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'admin_pin')
        .maybeSingle();

      if (!error && data?.value && typeof data.value === 'object') {
        const remotePin = String((data.value as { pin?: string }).pin || '').trim();
        if (remotePin.length >= 4) {
          try {
            localStorage.setItem(LOCAL_PIN_STORAGE_KEY, remotePin);
          } catch {
            // ignore
          }
          return { pin: remotePin, mode: 'supabase' };
        }
      }

      if (!error && !data) {
        await supabase.from('app_config').upsert(
          {
            key: 'admin_pin',
            value: { pin: fallbackPin },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
        return { pin: fallbackPin, mode: 'supabase' };
      }
    } catch (err) {
      console.warn('No se pudo leer admin_pin desde Supabase app_config:', err);
    }
  }

  return { pin: fallbackPin, mode: 'local' };
}

export async function upsertAdminPinInSupabase(newPin: string): Promise<{
  ok: boolean;
  pin: string;
  mode: 'supabase' | 'local';
  error?: string;
}> {
  const cleanPin = newPin.trim();
  try {
    localStorage.setItem(LOCAL_PIN_STORAGE_KEY, cleanPin);
  } catch {
    // ignore
  }

  if (typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.postMessage({ type: 'PIN_UPDATED', payload: cleanPin });
    bc.close();
  }

  if (supabase) {
    const { error } = await supabase.from('app_config').upsert(
      {
        key: 'admin_pin',
        value: { pin: cleanPin },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (!error) {
      return { ok: true, pin: cleanPin, mode: 'supabase' };
    }
    return {
      ok: true,
      pin: cleanPin,
      mode: 'local',
      error: `Guardado en caché local (ejecute schema.sql en Supabase para crear app_config: ${error.message})`,
    };
  }

  return { ok: true, pin: cleanPin, mode: 'local' };
}

// ============================================================================
// 2. EDITOR DINÁMICO DE FORMULARIO EN SUPABASE (app_config -> key: 'form_schema')
// ============================================================================

function normalizeFormSchema(raw: unknown): FormSchemaConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_FORM_SCHEMA;
  const obj = raw as Partial<FormSchemaConfig>;

  return {
    departamentos:
      Array.isArray(obj.departamentos) && obj.departamentos.length > 0
        ? obj.departamentos
        : [...DEFAULT_FORM_SCHEMA.departamentos],
    sedes:
      Array.isArray(obj.sedes) && obj.sedes.length > 0
        ? obj.sedes
        : [...DEFAULT_FORM_SCHEMA.sedes],
    categorias_ti:
      Array.isArray(obj.categorias_ti) && obj.categorias_ti.length > 0
        ? obj.categorias_ti
        : [...DEFAULT_FORM_SCHEMA.categorias_ti],
    modulos_odoo:
      Array.isArray(obj.modulos_odoo) && obj.modulos_odoo.length > 0
        ? obj.modulos_odoo
        : [...DEFAULT_FORM_SCHEMA.modulos_odoo],
    preguntas_personalizadas: Array.isArray(obj.preguntas_personalizadas)
      ? obj.preguntas_personalizadas
      : [],
  };
}

export function getCachedFormSchema(): FormSchemaConfig {
  try {
    const raw = localStorage.getItem(LOCAL_FORM_SCHEMA_KEY);
    if (raw) {
      return normalizeFormSchema(JSON.parse(raw));
    }
  } catch {
    // ignore
  }
  return DEFAULT_FORM_SCHEMA;
}

export async function fetchFormSchemaFromSupabase(): Promise<{
  schema: FormSchemaConfig;
  mode: 'supabase' | 'local';
}> {
  const cached = getCachedFormSchema();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'form_schema')
        .maybeSingle();

      if (!error && data?.value) {
        const normalized = normalizeFormSchema(data.value);
        try {
          localStorage.setItem(LOCAL_FORM_SCHEMA_KEY, JSON.stringify(normalized));
        } catch {
          // ignore
        }
        return { schema: normalized, mode: 'supabase' };
      }

      if (!error && !data) {
        await supabase.from('app_config').upsert(
          {
            key: 'form_schema',
            value: cached,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
        return { schema: cached, mode: 'supabase' };
      }
    } catch (err) {
      console.warn('No se pudo cargar form_schema desde Supabase:', err);
    }
  }

  return { schema: cached, mode: 'local' };
}

export async function upsertFormSchemaInSupabase(
  schema: FormSchemaConfig
): Promise<{
  ok: boolean;
  schema: FormSchemaConfig;
  mode: 'supabase' | 'local';
  error?: string;
}> {
  const normalized = normalizeFormSchema(schema);
  try {
    localStorage.setItem(LOCAL_FORM_SCHEMA_KEY, JSON.stringify(normalized));
  } catch {
    // ignore
  }

  if (typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.postMessage({ type: 'FORM_SCHEMA_UPDATED', payload: normalized });
    bc.close();
  }

  if (supabase) {
    const { error } = await supabase.from('app_config').upsert(
      {
        key: 'form_schema',
        value: normalized,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (!error) {
      return { ok: true, schema: normalized, mode: 'supabase' };
    }
    return {
      ok: true,
      schema: normalized,
      mode: 'local',
      error: `Esquema guardado localmente (ejecute schema.sql en Supabase para sincronizar app_config: ${error.message})`,
    };
  }

  return { ok: true, schema: normalized, mode: 'local' };
}

// ============================================================================
// 3. COMPRESIÓN HTML5 CANVAS Y SUBIDA A SUPABASE STORAGE ('ticket-evidencias')
// ============================================================================

export async function compressImageWithCanvas(
  file: File,
  maxWidth = 1280,
  quality = 0.75
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido.'));
      img.onload = () => {
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > maxWidth) {
          const ratio = maxWidth / targetWidth;
          targetWidth = maxWidth;
          targetHeight = Math.round(targetHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el compresor HTML5 Canvas.'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir imagen con Canvas.'));
              return;
            }
            resolve({
              blob,
              dataUrl,
              width: targetWidth,
              height: targetHeight,
            });
          },
          'image/jpeg',
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadTicketEvidenceImage(file: File): Promise<{
  url: string;
  mode: 'supabase' | 'local';
  sizeKB: number;
}> {
  const compressed = await compressImageWithCanvas(file, 1280, 0.75);
  const sizeKB = Math.max(1, Math.round(compressed.blob.size / 1024));

  if (supabase) {
    try {
      const safeName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const uniquePath = `evidencias/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}_${safeName}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-evidencias')
        .upload(uniquePath, compressed.blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (!uploadError) {
        const { data: pubData } = supabase.storage
          .from('ticket-evidencias')
          .getPublicUrl(uniquePath);

        if (pubData?.publicUrl) {
          return { url: pubData.publicUrl, mode: 'supabase', sizeKB };
        }
      } else {
        console.warn(
          'Fallback a DataURL comprimido (bucket ticket-evidencias no disponible):',
          uploadError.message
        );
      }
    } catch (err) {
      console.warn('Error subiendo a Supabase Storage:', err);
    }
  }

  return {
    url: compressed.dataUrl,
    mode: 'local',
    sizeKB,
  };
}

// ============================================================================
// 4. CRUD DE TICKETS (tickets_ti) Y SUSCRIPCIÓN REALTIME
// ============================================================================

export async function fetchTicketsTI(): Promise<{
  data: TicketTI[];
  mode: 'supabase' | 'local';
  error?: string;
}> {
  if (supabase) {
    const { data, error } = await supabase
      .from('tickets_ti')
      .select('*')
      .order('score_prioridad', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      return { data: normalizeTicketsList(data as TicketTI[]), mode: 'supabase' };
    }
    console.warn('Supabase fallback a modo local:', error?.message);
    return {
      data: getLocalTickets(),
      mode: 'local',
      error: error?.message,
    };
  }

  return { data: getLocalTickets(), mode: 'local' };
}

export async function createTicketTI(
  input: NuevoTicketInput
): Promise<{ ticket: TicketTI; mode: 'supabase' | 'local' }> {
  const tipoSolicitud = input.tipo_solicitud || 'Soporte Técnico / TI';
  const imagenesUrls = Array.isArray(input.imagenes_urls) ? input.imagenes_urls : [];
  const respuestasExtra =
    input.respuestas_extra && typeof input.respuestas_extra === 'object'
      ? input.respuestas_extra
      : {};

  const fullPayload = {
    tipo_solicitud: tipoSolicitud,
    solicitante_nombre: input.solicitante_nombre.trim(),
    departamento_tienda: input.departamento_tienda.trim(),
    categoria: input.categoria,
    titulo: input.titulo.trim(),
    descripcion: (input.descripcion || '').trim(),
    impacto: input.impacto,
    urgencia: input.urgencia,
    estado: input.estado || 'Bandeja de Entrada',
    asignado_a: normalizeAsignadoA(input.asignado_a || DEFAULT_ASIGNADO),
    nota_publica: input.nota_publica ?? '',
    notas_tecnicas: input.notas_tecnicas ?? '',
    imagenes_urls: imagenesUrls,
    respuestas_extra: respuestasExtra,
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('tickets_ti')
      .insert([fullPayload])
      .select('*')
      .single();

    if (!error && data) {
      const created: TicketTI = {
        ...(data as TicketTI),
        tipo_solicitud: data.tipo_solicitud || tipoSolicitud,
        asignado_a: normalizeAsignadoA(data.asignado_a),
        nota_publica: data.nota_publica ?? '',
        score_prioridad: data.score_prioridad ?? data.impacto * data.urgencia,
        imagenes_urls: Array.isArray(data.imagenes_urls)
          ? data.imagenes_urls
          : imagenesUrls,
        respuestas_extra:
          data.respuestas_extra && typeof data.respuestas_extra === 'object'
            ? data.respuestas_extra
            : respuestasExtra,
      };
      void sendTelegramTicketNotification(created);
      return { ticket: created, mode: 'supabase' };
    }

    if (error) {
      const legacyPayload = {
        solicitante_nombre: fullPayload.solicitante_nombre,
        departamento_tienda: fullPayload.departamento_tienda,
        categoria: fullPayload.categoria,
        titulo: fullPayload.titulo,
        descripcion: fullPayload.descripcion,
        impacto: fullPayload.impacto,
        urgencia: fullPayload.urgencia,
        estado: fullPayload.estado,
        asignado_a: fullPayload.asignado_a,
        notas_tecnicas: fullPayload.notas_tecnicas,
      };

      const retry = await supabase
        .from('tickets_ti')
        .insert([legacyPayload])
        .select('*')
        .single();

      if (!retry.error && retry.data) {
        const created: TicketTI = {
          ...(retry.data as TicketTI),
          tipo_solicitud: tipoSolicitud,
          asignado_a: normalizeAsignadoA(retry.data.asignado_a),
          nota_publica: '',
          score_prioridad:
            retry.data.score_prioridad ?? retry.data.impacto * retry.data.urgencia,
          imagenes_urls: imagenesUrls,
          respuestas_extra: respuestasExtra,
        };
        void sendTelegramTicketNotification(created);
        return { ticket: created, mode: 'supabase' };
      }
    }

    console.warn('Fallo inserción en Supabase, guardando en almacenamiento local:', error?.message);
  }

  const current = getLocalTickets();
  const maxCodigo = current.reduce((max, t) => Math.max(max, Number(t.codigo_ticket) || 0), 0);
  const nowIso = new Date().toISOString();

  const newTicket: TicketTI = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-${Date.now()}`,
    codigo_ticket: maxCodigo + 1,
    created_at: nowIso,
    updated_at: nowIso,
    tipo_solicitud: tipoSolicitud,
    solicitante_nombre: fullPayload.solicitante_nombre,
    departamento_tienda: fullPayload.departamento_tienda,
    categoria: fullPayload.categoria,
    titulo: fullPayload.titulo,
    descripcion: fullPayload.descripcion,
    impacto: fullPayload.impacto,
    urgencia: fullPayload.urgencia,
    score_prioridad: fullPayload.impacto * fullPayload.urgencia,
    estado: fullPayload.estado,
    asignado_a: fullPayload.asignado_a,
    nota_publica: fullPayload.nota_publica,
    notas_tecnicas: fullPayload.notas_tecnicas,
    fecha_resolucion: fullPayload.estado === 'Resuelto' ? nowIso : null,
    imagenes_urls: imagenesUrls,
    respuestas_extra: respuestasExtra,
  };

  const updated = [newTicket, ...current];
  saveLocalTickets(updated, newTicket);

  void sendTelegramTicketNotification(newTicket);

  return { ticket: newTicket, mode: 'local' };
}

export async function updateTicketTI(
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
      | 'fecha_resolucion'
    >
  >
): Promise<{ ticket: TicketTI; mode: 'supabase' | 'local' }> {
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    ...changes,
  };

  if (changes.asignado_a) {
    patch.asignado_a = normalizeAsignadoA(changes.asignado_a);
  }

  if (changes.estado === 'Resuelto' && changes.fecha_resolucion === undefined) {
    patch.fecha_resolucion = nowIso;
  } else if (changes.estado && changes.estado !== 'Resuelto') {
    patch.fecha_resolucion = null;
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('tickets_ti')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const updatedTicket: TicketTI = {
        ...(data as TicketTI),
        asignado_a: normalizeAsignadoA(data.asignado_a),
        nota_publica: data.nota_publica ?? (changes.nota_publica || ''),
        score_prioridad: data.score_prioridad ?? data.impacto * data.urgencia,
      };
      return { ticket: updatedTicket, mode: 'supabase' };
    }
    console.warn('Fallo actualización en Supabase, aplicando en local:', error?.message);
  }

  const current = getLocalTickets();
  let updatedItem: TicketTI | null = null;

  const nextList = current.map((item) => {
    if (item.id !== id) return item;
    const nextImpacto = (changes.impacto ?? item.impacto) as 1 | 2 | 3;
    const nextUrgencia = (changes.urgencia ?? item.urgencia) as 1 | 2 | 3;
    const nextEstado = changes.estado ?? item.estado;

    updatedItem = {
      ...item,
      ...changes,
      asignado_a: normalizeAsignadoA(changes.asignado_a ?? item.asignado_a),
      nota_publica: changes.nota_publica ?? item.nota_publica ?? '',
      impacto: nextImpacto,
      urgencia: nextUrgencia,
      score_prioridad: nextImpacto * nextUrgencia,
      updated_at: nowIso,
      fecha_resolucion:
        nextEstado === 'Resuelto' ? item.fecha_resolucion || nowIso : null,
    };
    return updatedItem;
  });

  saveLocalTickets(nextList);

  if (!updatedItem) {
    throw new Error('Ticket no encontrado');
  }
  return { ticket: updatedItem, mode: 'local' };
}

export function subscribeToTicketsTI(
  onUpdate: () => void,
  onNewTicket?: (ticket: TicketTI) => void,
  onConfigUpdate?: () => void
): () => void {
  const cleanups: Array<() => void> = [];

  if (supabase) {
    const channel = supabase
      .channel('tickets_ti_realtime_hub')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets_ti' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new && onNewTicket) {
            const raw = payload.new as TicketTI;
            onNewTicket({
              ...raw,
              asignado_a: normalizeAsignadoA(raw.asignado_a),
              score_prioridad: raw.score_prioridad ?? raw.impacto * raw.urgencia,
            });
          }
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config' },
        () => {
          if (onConfigUpdate) onConfigUpdate();
        }
      )
      .subscribe();

    cleanups.push(() => {
      supabase.removeChannel(channel);
    });
  }

  if (typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const handler = (event: MessageEvent) => {
      if (
        event.data?.type === 'NEW_TICKET_CREATED' &&
        event.data?.payload &&
        onNewTicket
      ) {
        onNewTicket(event.data.payload as TicketTI);
      }
      if (
        (event.data?.type === 'PIN_UPDATED' ||
          event.data?.type === 'FORM_SCHEMA_UPDATED') &&
        onConfigUpdate
      ) {
        onConfigUpdate();
      }
      onUpdate();
    };
    bc.addEventListener('message', handler);
    cleanups.push(() => {
      bc.removeEventListener('message', handler);
      bc.close();
    });
  }

  const storageHandler = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY) {
      onUpdate();
    }
    if (
      (e.key === LOCAL_PIN_STORAGE_KEY || e.key === LOCAL_FORM_SCHEMA_KEY) &&
      onConfigUpdate
    ) {
      onConfigUpdate();
    }
  };
  window.addEventListener('storage', storageHandler);
  cleanups.push(() => window.removeEventListener('storage', storageHandler));

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
