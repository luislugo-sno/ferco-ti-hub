export type CategoriaTicket =
  | 'Infraestructura / Redes / Starlink'
  | 'Odoo ERP / TPV Tiendas'
  | 'Business Intelligence / Reportes'
  | 'Hardware / Impresoras / Equipos'
  | 'Accesos / Google Workspace'
  | 'Desarrollo / Automatización';

export type EstadoTicket =
  | 'Bandeja de Entrada'
  | 'En Cola'
  | 'En Progreso'
  | 'Esperando Proveedor/Tercero'
  | 'Resuelto';

export type AsignadoA =
  | 'Luis Lugo'
  | 'Plinio Becerra'
  | 'Leonardo Semprún'
  | 'Cristina Núñez'
  | 'Marinés González'
  | 'Juan García';

export type NivelImpacto = 1 | 2 | 3;
export type NivelUrgencia = 1 | 2 | 3;

export interface TicketTI {
  id: string;
  codigo_ticket: number;
  created_at: string;
  updated_at?: string;
  solicitante_nombre: string;
  departamento_tienda: string;
  categoria: CategoriaTicket;
  titulo: string;
  descripcion: string;
  impacto: NivelImpacto;
  urgencia: NivelUrgencia;
  score_prioridad: number;
  estado: EstadoTicket;
  asignado_a: AsignadoA;
  notas_tecnicas: string | null;
  fecha_resolucion: string | null;
}

export interface NuevoTicketInput {
  solicitante_nombre: string;
  departamento_tienda: string;
  categoria: CategoriaTicket;
  titulo: string;
  descripcion: string;
  impacto: NivelImpacto;
  urgencia: NivelUrgencia;
  estado?: EstadoTicket;
  asignado_a?: AsignadoA;
  notas_tecnicas?: string;
}

export const CATEGORIAS_TICKET: CategoriaTicket[] = [
  'Infraestructura / Redes / Starlink',
  'Odoo ERP / TPV Tiendas',
  'Business Intelligence / Reportes',
  'Hardware / Impresoras / Equipos',
  'Accesos / Google Workspace',
  'Desarrollo / Automatización',
];

export const ESTADOS_TICKET: EstadoTicket[] = [
  'Bandeja de Entrada',
  'En Cola',
  'En Progreso',
  'Esperando Proveedor/Tercero',
  'Resuelto',
];

export const EQUIPO_TI_BI: AsignadoA[] = [
  'Luis Lugo',
  'Plinio Becerra',
  'Leonardo Semprún',
  'Cristina Núñez',
  'Marinés González',
  'Juan García',
];

export const DEPARTAMENTOS_FERCO: string[] = [
  'Administración',
  'Suministros / Compras',
  'Operaciones / Logística',
  'Capital Humano',
  'Tiendas Comerciales (Sede Principal)',
  'Tiendas Comerciales (Sucursales)',
  'Finanzas / Tesorería',
  'Comercialización / Ventas',
  'Gerencia General / Directiva',
  'Otro',
];

export const IMPACTO_LABELS: Record<NivelImpacto, { corto: string; detalle: string; badge: string }> = {
  1: {
    corto: '1 - Individual / Puntual',
    detalle: 'Solo me afecta a mí o es una consulta menor; tengo forma de seguir trabajando.',
    badge: 'Bajo Impacto',
  },
  2: {
    corto: '2 - Departamental / Tienda',
    detalle: 'Afecta a varios compañeros de mi departamento o ralentiza procesos en una tienda.',
    badge: 'Impacto Medio',
  },
  3: {
    corto: '3 - Crítico / Operación Detenida',
    detalle: 'Detiene facturación, cajas TPV, cierre contable, enlace Starlink o toda una sede.',
    badge: 'Impacto Crítico',
  },
};

export const URGENCIA_LABELS: Record<NivelUrgencia, { corto: string; detalle: string }> = {
  1: {
    corto: '1 - Baja (Planificable)',
    detalle: 'Puede resolverse en los próximos días sin afectar entregas inmediatas.',
  },
  2: {
    corto: '2 - Media (Hoy / Mañana)',
    detalle: 'Requiere atención dentro de la jornada o en las próximas 24 horas.',
  },
  3: {
    corto: '3 - Alta / Inmediata',
    detalle: 'Urgencia máxima: el proceso no puede esperar, bloquea entrega o venta en vivo.',
  },
};

export function formatCodigoTicket(num?: number | null): string {
  if (num === undefined || num === null || Number.isNaN(Number(num))) {
    return 'FER-TI-000';
  }
  return `FER-TI-${String(num).padStart(3, '0')}`;
}

export function getPrioridadMeta(score: number): {
  nivel: 'Crítico' | 'Medio' | 'Bajo';
  codigoSLA: 'P1 Crítico' | 'P2 Alto' | 'P3 Medio' | 'P4 Bajo';
  badgeClass: string;
  dotClass: string;
  borderClass: string;
} {
  if (score >= 6) {
    return {
      nivel: 'Crítico',
      codigoSLA: score === 9 ? 'P1 Crítico' : 'P2 Alto',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30',
      dotClass: 'bg-rose-400',
      borderClass: 'border-l-4 border-l-rose-500',
    };
  }
  if (score >= 3) {
    return {
      nivel: 'Medio',
      codigoSLA: 'P3 Medio',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30',
      dotClass: 'bg-amber-400',
      borderClass: 'border-l-4 border-l-amber-500',
    };
  }
  return {
    nivel: 'Bajo',
    codigoSLA: 'P4 Bajo',
    badgeClass: 'bg-gcf-500/15 text-gcf-200 border-gcf-500/40 ring-1 ring-gcf-500/30',
    dotClass: 'bg-gcf-400',
    borderClass: 'border-l-4 border-l-gcf-500',
  };
}

export function getHorasSinMoverse(ticket: TicketTI): number {
  const refDate = ticket.updated_at || ticket.created_at;
  if (!refDate) return 0;
  const diffMs = Date.now() - new Date(refDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}

export function estaEstancadoProveedor(ticket: TicketTI): boolean {
  return ticket.estado === 'Esperando Proveedor/Tercero' && getHorasSinMoverse(ticket) >= 48;
}
