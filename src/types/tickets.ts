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
  | 'Luis Lugo - Analista BI/TI'
  | 'Juan García - Gerente BI/TI'
  | 'Leonardo Semprun - Especialista de Soluciones de Negocio'
  | 'Plinio Becerra - Analista de Soluciones de Negocio';

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

export const DEFAULT_ASIGNADO: AsignadoA = 'Luis Lugo - Analista BI/TI';

export const EQUIPO_TI_BI: AsignadoA[] = [
  'Luis Lugo - Analista BI/TI',
  'Juan García - Gerente BI/TI',
  'Leonardo Semprun - Especialista de Soluciones de Negocio',
  'Plinio Becerra - Analista de Soluciones de Negocio',
];

export function normalizeAsignadoA(raw?: string | null): AsignadoA {
  if (!raw) return DEFAULT_ASIGNADO;
  if (raw.startsWith('Juan García')) return 'Juan García - Gerente BI/TI';
  if (raw.startsWith('Leonardo Sempr')) {
    return 'Leonardo Semprun - Especialista de Soluciones de Negocio';
  }
  if (raw.startsWith('Plinio Becerra')) {
    return 'Plinio Becerra - Analista de Soluciones de Negocio';
  }
  return 'Luis Lugo - Analista BI/TI';
}

export const CATALOGO_DEPARTAMENTOS: string[] = [
  'RRHH',
  'MANTENIMIENTO',
  'CALIDAD',
  'CADENA DE SUMINISTROS',
  'MERCADEO',
  'OPERACIONES',
  'PRODUCCIÓN',
  'JUNTA DIRECTIVA',
  'GERENCIA',
  'ADMINISTRACIÓN',
  'CONTABILIDAD',
  'BI/TI',
  'TIENDA',
  'CDP',
  'CDP2',
  'CDA-CCS',
  'CDA-BQTO',
  'RECEPCIÓN CDP1',
  'ALMACÉN',
  'ALMACÉN BI/TI',
  'ALMACÉN LA 13',
];

export interface SedeComercialItem {
  valor: string;
  nombreCorto: string;
  razonSocial?: string;
  municipio?: string;
  grupo: 'General / Corporativo' | 'Centros Logísticos (CDP / CDA)' | 'Tiendas SNÖ' | 'Tiendas Chönkies';
}

export const CATALOGO_SEDES_DETALLE: SedeComercialItem[] = [
  {
    valor: 'N/A (Oficina / No aplica)',
    nombreCorto: 'N/A (Oficina / No aplica)',
    grupo: 'General / Corporativo',
  },
  {
    valor: 'CDP1',
    nombreCorto: 'CDP1',
    razonSocial: 'Centro de Distribución Principal 1',
    grupo: 'Centros Logísticos (CDP / CDA)',
  },
  {
    valor: 'CDP2',
    nombreCorto: 'CDP2',
    razonSocial: 'Centro de Distribución Principal 2',
    grupo: 'Centros Logísticos (CDP / CDA)',
  },
  {
    valor: 'CDA-CCS',
    nombreCorto: 'CDA-CCS',
    razonSocial: 'Centro de Distribución Caracas',
    municipio: 'Caracas',
    grupo: 'Centros Logísticos (CDP / CDA)',
  },
  {
    valor: 'CDA-BQTO',
    nombreCorto: 'CDA-BQTO',
    razonSocial: 'Centro de Distribución Barquisimeto',
    municipio: 'Barquisimeto',
    grupo: 'Centros Logísticos (CDP / CDA)',
  },
  {
    valor: 'SNÖ Delicias (Grupo Ferco Maracaibo C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Delicias',
    razonSocial: 'Grupo Ferco Maracaibo C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Camoruco (Grupo Jace C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Camoruco',
    razonSocial: 'Grupo Jace C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Las Lomas (Operadora Eleven 11 C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Las Lomas',
    razonSocial: 'Operadora Eleven 11 C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Coromoto (Operadora Uno Siete Uno C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Coromoto',
    razonSocial: 'Operadora Uno Siete Uno C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Sambil (Operadora 1903 C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Sambil',
    razonSocial: 'Operadora 1903 C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Terraza 77 (Operadora Siete Siete C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Terraza 77',
    razonSocial: 'Operadora Siete Siete C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ North Center (Dolce Idea C.A. - Maracaibo)',
    nombreCorto: 'SNÖ North Center',
    razonSocial: 'Dolce Idea C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Maraplus La Limpia (Farmacia Farma La Limpia C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Maraplus La Limpia',
    razonSocial: 'Farmacia Farma La Limpia C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Maraplus Coromoto (Farmacia Farma Servicio Coromoto C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Maraplus Coromoto',
    razonSocial: 'Farmacia Farma Servicio Coromoto C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Vereda del Lago (Operadora Siete Siete C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Vereda del Lago',
    razonSocial: 'Operadora Siete Siete C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Maraplus Los Coches (Farmacia y Servicios Las Delicias C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Maraplus Los Coches',
    razonSocial: 'Farmacia y Servicios Las Delicias C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Cima (Operadora Central Cima C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Cima',
    razonSocial: 'Operadora Central Cima C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Maraplus La Florida (Grupo Ferco Maracaibo - Caracas)',
    nombreCorto: 'SNÖ Maraplus La Florida',
    razonSocial: 'Grupo Ferco Maracaibo',
    municipio: 'Caracas',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ URBE (Raspa2023 C.A. - Maracaibo)',
    nombreCorto: 'SNÖ URBE',
    razonSocial: 'Raspa2023 C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Ciudad Ojeda (Comercializadora La Universal 25 C.A. - COL)',
    nombreCorto: 'SNÖ Ciudad Ojeda',
    razonSocial: 'Comercializadora La Universal 25 C.A.',
    municipio: 'COL',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Gran Bazar (Operadora Central Cima C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Gran Bazar',
    razonSocial: 'Operadora Central Cima C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Mall Paseo San Fco (Inversiones ZAP C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Mall Paseo San Fco',
    razonSocial: 'Inversiones ZAP C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Caribe Zulia (Operadora Central Cima C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Caribe Zulia',
    razonSocial: 'Operadora Central Cima C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Ana María Campos (Grupo Ferco Maracaibo C.A. - Maracaibo)',
    nombreCorto: 'SNÖ Ana María Campos',
    razonSocial: 'Grupo Ferco Maracaibo C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Nueva Segovia (Operadora Seinca C.A. - Barquisimeto)',
    nombreCorto: 'SNÖ Nueva Segovia',
    razonSocial: 'Operadora Seinca C.A.',
    municipio: 'Barquisimeto',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Cabimas (Comercializadora La Universal 25 Cabimas C.A. - COL)',
    nombreCorto: 'SNÖ Cabimas',
    razonSocial: 'Comercializadora La Universal 25 Cabimas C.A.',
    municipio: 'COL',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Altamira (Operadora Altamira C.A. - Caracas)',
    nombreCorto: 'SNÖ Altamira',
    razonSocial: 'Operadora Altamira C.A.',
    municipio: 'Caracas',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Unicentro El Marqués (Operadora Altamira - Caracas)',
    nombreCorto: 'SNÖ Unicentro El Marqués',
    razonSocial: 'Operadora Altamira',
    municipio: 'Caracas',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ Chacaito (Cepillados Villas C.A. - Caracas)',
    nombreCorto: 'SNÖ Chacaito',
    razonSocial: 'Cepillados Villas C.A.',
    municipio: 'Caracas',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'SNÖ URU (Operadora Siete Siete C.A. - Maracaibo)',
    nombreCorto: 'SNÖ URU',
    razonSocial: 'Operadora Siete Siete C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas SNÖ',
  },
  {
    valor: 'Chönkies Bella Vista (Fercom Group C.A. - Maracaibo)',
    nombreCorto: 'Chönkies Bella Vista',
    razonSocial: 'Fercom Group C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas Chönkies',
  },
  {
    valor: 'Chönkies Sambil (Fercom Group Norte C.A. - Maracaibo)',
    nombreCorto: 'Chönkies Sambil',
    razonSocial: 'Fercom Group Norte C.A.',
    municipio: 'Maracaibo',
    grupo: 'Tiendas Chönkies',
  },
];

export const CATALOGO_SEDES: string[] = CATALOGO_SEDES_DETALLE.map((s) => s.valor);

export function composeUbicacion(departamento: string, sede: string): string {
  const dep = departamento.trim();
  const sed = sede.trim();
  if (!sed || sed === 'N/A (Oficina / No aplica)') {
    return dep;
  }
  return `${dep} | ${sed}`;
}

export function parseUbicacion(departamentoTienda: string): {
  departamento: string;
  sede: string;
} {
  if (!departamentoTienda) {
    return { departamento: 'ADMINISTRACIÓN', sede: 'N/A (Oficina / No aplica)' };
  }
  if (departamentoTienda.includes(' | ')) {
    const [dep, ...rest] = departamentoTienda.split(' | ');
    return {
      departamento: dep.trim(),
      sede: rest.join(' | ').trim() || 'N/A (Oficina / No aplica)',
    };
  }
  return {
    departamento: departamentoTienda.trim(),
    sede: 'N/A (Oficina / No aplica)',
  };
}

export const IMPACTO_LABELS: Record<
  NivelImpacto,
  { corto: string; detalle: string; badge: string }
> = {
  1: {
    corto: '1 - Individual / Puntual',
    detalle: 'Solo me afecta a mí o es una consulta menor; tengo forma de seguir trabajando.',
    badge: 'Bajo Impacto',
  },
  2: {
    corto: '2 - Departamental / Tienda',
    detalle: 'Afecta a varios usuarios del área o ralentiza procesos operativos en sede/tienda.',
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
    corto: '2 - Media (Jornada Actual / 24h)',
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
      badgeClass: 'bg-red-50 text-red-800 border border-red-300',
      dotClass: 'bg-red-600',
      borderClass: 'border-l-4 border-l-red-600',
    };
  }
  if (score >= 3) {
    return {
      nivel: 'Medio',
      codigoSLA: 'P3 Medio',
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300',
      dotClass: 'bg-amber-500',
      borderClass: 'border-l-4 border-l-amber-500',
    };
  }
  return {
    nivel: 'Bajo',
    codigoSLA: 'P4 Bajo',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300',
    dotClass: 'bg-blue-700',
    borderClass: 'border-l-4 border-l-blue-700',
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
