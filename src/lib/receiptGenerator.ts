import {
  formatCodigoTicket,
  formatSafeDateTime,
  PublicTicketTI,
  TicketTI,
} from '../types/tickets';

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  const clean = (text || '').trim();
  if (!clean) return '—';
  if (ctx.measureText(clean).width <= maxWidth) return clean;

  let truncated = clean;
  while (truncated.length > 0 && ctx.measureText(`${truncated}...`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated.trim()}...`;
}

/**
 * Genera y descarga automáticamente un comprobante PNG corporativo (800x520px)
 * usando HTML5 Canvas puro sin librerías externas.
 */
export function downloadTicketReceiptPng(
  ticket: TicketTI | PublicTicketTI
): { ok: boolean; fileName: string } {
  const codigoFormateado = formatCodigoTicket(ticket?.codigo_ticket);
  const fileName = `Comprobante-${codigoFormateado}.png`;

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 520;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar HTML5 Canvas para el comprobante.');
  }

  // 1. Fondo blanco puro (#FFFFFF) y marco exterior recto
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 800, 520);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 798, 518);

  // 2. Franja superior azul corporativo (#4242ca)
  ctx.fillStyle = '#4242ca';
  ctx.fillRect(0, 0, 800, 64);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Inter, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'GRUPO COMERCIALIZADORA FERCO — Gerencia de Inteligencia de Negocios y Tecnología',
    32,
    32
  );

  // 3. Bloque central destacado (#F8FAFC con borde #E2E8F0)
  const boxX = 32;
  const boxY = 86;
  const boxW = 736;
  const boxH = 104;

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Barra lateral izquierda de acento corporativo en el bloque del código
  ctx.fillStyle = '#4242ca';
  ctx.fillRect(boxX, boxY, 6, boxH);

  // Código en tipografía grande y negrita
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 38px "JetBrains Mono", Consolas, monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(codigoFormateado, boxX + 26, boxY + 54);

  // Etiqueta debajo del código
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px Inter, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('COMPROBANTE DE REQUERIMIENTO', boxX + 26, boxY + 80);

  // Estado y Prioridad a la derecha dentro del bloque destacado
  const estadoTexto = `ESTADO: ${(ticket?.estado || 'Bandeja de Entrada').toUpperCase()}`;
  const prioridadTexto = `PRIORIDAD: SCORE ${ticket?.score_prioridad ?? 1}`;

  ctx.textAlign = 'right';
  ctx.fillStyle = '#4242ca';
  ctx.font = 'bold 13px Inter, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(estadoTexto, boxX + boxW - 24, boxY + 46);

  ctx.fillStyle = '#64748B';
  ctx.font = '600 12px "JetBrains Mono", Consolas, monospace';
  ctx.fillText(prioridadTexto, boxX + boxW - 24, boxY + 72);
  ctx.textAlign = 'left';

  // 4. Datos estructurados en dos columnas limpias
  const fechaRegistro = formatSafeDateTime(ticket?.created_at, 'Sin fecha');
  const tipoSolicitud = ticket?.tipo_solicitud || 'Soporte Técnico / TI';
  const solicitante = ticket?.solicitante_nombre || 'Solicitante';
  const ubicacion = ticket?.departamento_tienda || 'ADMINISTRACIÓN';
  const categoria = ticket?.categoria || 'General';
  const asunto = ticket?.titulo || 'Requerimiento registrado';

  const col1X = 32;
  const col2X = 416;
  const colMaxWidth = 340;

  const drawField = (
    x: number,
    y: number,
    label: string,
    value: string,
    maxW: number
  ) => {
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 11px Inter, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(label.toUpperCase(), x, y);

    ctx.fillStyle = '#0F172A';
    ctx.font = '600 14px Inter, "Segoe UI", Roboto, sans-serif';
    const safeVal = truncateText(ctx, value, maxW);
    ctx.fillText(safeVal, x, y + 22);
  };

  // Fila 1 de columnas
  drawField(col1X, 224, 'Fecha y Hora de Registro', fechaRegistro, colMaxWidth);
  drawField(col2X, 224, 'Tipo de Solicitud', tipoSolicitud, colMaxWidth);

  // Línea divisoria horizontal sutil
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 266);
  ctx.lineTo(768, 266);
  ctx.stroke();

  // Fila 2 de columnas
  drawField(col1X, 288, 'Solicitante', solicitante, colMaxWidth);
  drawField(col2X, 288, 'Departamento / Sede', ubicacion, colMaxWidth);

  // Línea divisoria horizontal sutil
  ctx.beginPath();
  ctx.moveTo(32, 330);
  ctx.lineTo(768, 330);
  ctx.stroke();

  // Fila 3 de columnas
  drawField(col1X, 352, 'Categoría / Módulo', categoria, colMaxWidth);
  drawField(
    col2X,
    352,
    'Especialista Asignado',
    ticket?.asignado_a || 'Luis Lugo - Analista BI/TI',
    colMaxWidth
  );

  // Línea divisoria horizontal sutil
  ctx.beginPath();
  ctx.moveTo(32, 394);
  ctx.lineTo(768, 394);
  ctx.stroke();

  // Fila 4 (Ancho completo): Asunto
  drawField(col1X, 416, 'Asunto del Requerimiento', asunto, 730);

  // 5. Pie del comprobante con borde superior gris (#E2E8F0)
  const footerY = 468;
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(2, footerY, 796, 50);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(800, footerY);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = '600 12.5px Inter, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `Consulta el estado de tu solicitud en: ferco-ti-hub.netlify.app/consultar?codigo=${codigoFormateado}`,
    32,
    footerY + 25
  );

  // 6. Convertir con canvas.toDataURL('image/png') y disparar descarga
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { ok: true, fileName };
}
