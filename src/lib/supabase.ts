import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NuevoTicketInput, TicketTI } from '../types/tickets';

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

const LOCAL_STORAGE_KEY = 'ferco_tickets_ti_v1';
const BROADCAST_CHANNEL_NAME = 'ferco_tickets_ti_realtime_sync';

const horasAtras = (horas: number): string =>
  new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();

const SEED_TICKETS: TicketTI[] = [
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000001',
    codigo_ticket: 1,
    created_at: horasAtras(74),
    updated_at: horasAtras(62),
    solicitante_nombre: 'Roberto Méndez',
    departamento_tienda: 'Tiendas Comerciales (Sucursales)',
    categoria: 'Infraestructura / Redes / Starlink',
    titulo: 'Intermitencia en enlace principal y failover a Starlink en Sucursal Norte',
    descripcion:
      'El enlace de fibra óptica presenta pérdida de paquetes del 45%. Estamos operando sobre el backup de Starlink pero necesitamos revisión del proveedor fibra y ajuste en el balanceador MikroTik.',
    impacto: 3,
    urgencia: 2,
    score_prioridad: 6,
    estado: 'Esperando Proveedor/Tercero',
    asignado_a: 'Plinio Becerra',
    notas_tecnicas:
      'Se abrió ticket #ISP-99412 con el proveedor de fibra óptica. Failover automático en router MikroTik activo sobre antena Starlink.',
    fecha_resolucion: null,
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000002',
    codigo_ticket: 2,
    created_at: horasAtras(5),
    updated_at: horasAtras(2),
    solicitante_nombre: 'Gabriela Rojas',
    departamento_tienda: 'Tiendas Comerciales (Sede Principal)',
    categoria: 'Odoo ERP / TPV Tiendas',
    titulo: 'Diferencia en sincronización de sesión de Punto de Venta (Caja 03) en Odoo',
    descripcion:
      'Al intentar cerrar la sesión del TPV en Caja 03 aparece alerta de asiento descuadrado por nota de crédito en divisas IGTF.',
    impacto: 3,
    urgencia: 3,
    score_prioridad: 9,
    estado: 'En Progreso',
    asignado_a: 'Luis Lugo',
    notas_tecnicas:
      'Revisando diarios de pago IGTF y conciliación de pos.order en Odoo 17. Validando con contabilidad antes de forzar cierre.',
    fecha_resolucion: null,
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000003',
    codigo_ticket: 3,
    created_at: horasAtras(18),
    updated_at: horasAtras(4),
    solicitante_nombre: 'Carlos Villamizar',
    departamento_tienda: 'Gerencia General / Directiva',
    categoria: 'Business Intelligence / Reportes',
    titulo: 'Actualización de Dashboard de Rotación de Inventario y Margen por Familia',
    descripcion:
      'Incluir el comparativo intermensual de rotación de productos importados y alerta de stock mínimo para comité del jueves.',
    impacto: 2,
    urgencia: 3,
    score_prioridad: 6,
    estado: 'En Progreso',
    asignado_a: 'Cristina Núñez',
    notas_tecnicas:
      'Vista materializada en PostgreSQL lista. Ajustando medidas DAX y filtros por sucursal.',
    fecha_resolucion: null,
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000004',
    codigo_ticket: 4,
    created_at: horasAtras(9),
    updated_at: horasAtras(8),
    solicitante_nombre: 'Mariana Pérez',
    departamento_tienda: 'Suministros / Compras',
    categoria: 'Desarrollo / Automatización',
    titulo: 'Automatizar carga masiva de listas de precios de proveedores vía plantilla Excel',
    descripcion:
      'Necesitamos script o asistente para actualizar costos de reposición sin editar línea por línea en acuerdos de compra.',
    impacto: 2,
    urgencia: 2,
    score_prioridad: 4,
    estado: 'En Cola',
    asignado_a: 'Leonardo Semprún',
    notas_tecnicas: 'Se diseñará validador previo de SKU para evitar duplicados.',
    fecha_resolucion: null,
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000005',
    codigo_ticket: 5,
    created_at: horasAtras(1),
    updated_at: horasAtras(1),
    solicitante_nombre: 'Andrés Morales',
    departamento_tienda: 'Capital Humano',
    categoria: 'Accesos / Google Workspace',
    titulo: 'Creación de cuenta corporativa Google Workspace y permisos Odoo para nuevo analista',
    descripcion:
      'Ingreso programado en departamento de Compras. Requiere correo corporativo, grupo de distribución y perfil Lector/Comprador en Odoo.',
    impacto: 1,
    urgencia: 2,
    score_prioridad: 2,
    estado: 'Bandeja de Entrada',
    asignado_a: 'Marinés González',
    notas_tecnicas: '',
    fecha_resolucion: null,
  },
  {
    id: 'c8f92e10-1a2b-4c3d-8e9f-000000000006',
    codigo_ticket: 6,
    created_at: horasAtras(28),
    updated_at: horasAtras(6),
    solicitante_nombre: 'Elena Castillo',
    departamento_tienda: 'Operaciones / Logística',
    categoria: 'Hardware / Impresoras / Equipos',
    titulo: 'Configuración de impresora térmica Zebra de etiquetas en Almacén Central',
    descripcion:
      'Se desconfiguró el tamaño de etiqueta de código de barras tras reinicio de estación de despacho.',
    impacto: 2,
    urgencia: 2,
    score_prioridad: 4,
    estado: 'Resuelto',
    asignado_a: 'Juan García',
    notas_tecnicas:
      'Se calibró sensor de gap en Zebra ZD220 y se fijó perfil 50x25mm predeterminado en el servidor de impresión.',
    fecha_resolucion: horasAtras(6),
  },
];

function getLocalTickets(): TicketTI[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_TICKETS));
      return SEED_TICKETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_TICKETS;
  } catch {
    return SEED_TICKETS;
  }
}

function saveLocalTickets(tickets: TicketTI[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({ type: 'SYNC_TICKETS', payload: tickets });
      bc.close();
    }
  } catch (err) {
    console.error('Error guardando tickets en almacenamiento local:', err);
  }
}

export async function fetchTicketsTI(): Promise<{ data: TicketTI[]; mode: 'supabase' | 'local'; error?: string }> {
  if (supabase) {
    const { data, error } = await supabase
      .from('tickets_ti')
      .select('*')
      .order('score_prioridad', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      const normalized = (data as TicketTI[]).map((t) => ({
        ...t,
        score_prioridad: t.score_prioridad ?? t.impacto * t.urgencia,
      }));
      return { data: normalized, mode: 'supabase' };
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

export async function createTicketTI(input: NuevoTicketInput): Promise<{ ticket: TicketTI; mode: 'supabase' | 'local' }> {
  const payload = {
    solicitante_nombre: input.solicitante_nombre.trim(),
    departamento_tienda: input.departamento_tienda.trim(),
    categoria: input.categoria,
    titulo: input.titulo.trim(),
    descripcion: (input.descripcion || '').trim(),
    impacto: input.impacto,
    urgencia: input.urgencia,
    estado: input.estado || 'Bandeja de Entrada',
    asignado_a: input.asignado_a || 'Luis Lugo',
    notas_tecnicas: input.notas_tecnicas ?? '',
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('tickets_ti')
      .insert([payload])
      .select('*')
      .single();

    if (!error && data) {
      const created: TicketTI = {
        ...(data as TicketTI),
        score_prioridad: data.score_prioridad ?? data.impacto * data.urgencia,
      };
      return { ticket: created, mode: 'supabase' };
    }
    console.warn('Fallo inserción en Supabase, guardando en almacenamiento local:', error?.message);
  }

  const current = getLocalTickets();
  const maxCodigo = current.reduce((max, t) => Math.max(max, Number(t.codigo_ticket) || 0), 0);
  const nowIso = new Date().toISOString();

  const newTicket: TicketTI = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
    codigo_ticket: maxCodigo + 1,
    created_at: nowIso,
    updated_at: nowIso,
    solicitante_nombre: payload.solicitante_nombre,
    departamento_tienda: payload.departamento_tienda,
    categoria: payload.categoria,
    titulo: payload.titulo,
    descripcion: payload.descripcion,
    impacto: payload.impacto,
    urgencia: payload.urgencia,
    score_prioridad: payload.impacto * payload.urgencia,
    estado: payload.estado,
    asignado_a: payload.asignado_a,
    notas_tecnicas: payload.notas_tecnicas,
    fecha_resolucion: payload.estado === 'Resuelto' ? nowIso : null,
  };

  const updated = [newTicket, ...current];
  saveLocalTickets(updated);
  return { ticket: newTicket, mode: 'local' };
}

export async function updateTicketTI(
  id: string,
  changes: Partial<Pick<TicketTI, 'estado' | 'asignado_a' | 'notas_tecnicas' | 'impacto' | 'urgencia' | 'categoria' | 'titulo' | 'descripcion' | 'fecha_resolucion'>>
): Promise<{ ticket: TicketTI; mode: 'supabase' | 'local' }> {
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    ...changes,
  };

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
      impacto: nextImpacto,
      urgencia: nextUrgencia,
      score_prioridad: nextImpacto * nextUrgencia,
      updated_at: nowIso,
      fecha_resolucion:
        nextEstado === 'Resuelto'
          ? item.fecha_resolucion || nowIso
          : null,
    };
    return updatedItem;
  });

  saveLocalTickets(nextList);

  if (!updatedItem) {
    throw new Error('Ticket no encontrado');
  }
  return { ticket: updatedItem, mode: 'local' };
}

export function subscribeToTicketsTI(onUpdate: () => void): () => void {
  const cleanups: Array<() => void> = [];

  if (supabase) {
    const channel = supabase
      .channel('tickets_ti_realtime_hub')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets_ti' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    cleanups.push(() => {
      supabase.removeChannel(channel);
    });
  }

  if (typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const handler = () => onUpdate();
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
  };
  window.addEventListener('storage', storageHandler);
  cleanups.push(() => window.removeEventListener('storage', storageHandler));

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
