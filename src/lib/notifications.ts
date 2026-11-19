import { formatCodigoTicket, TicketTI } from '../types/tickets';

const NTFY_TOPIC_STORAGE_KEY = 'ferco_ti_ntfy_topic';
const NTFY_ENABLED_STORAGE_KEY = 'ferco_ti_ntfy_enabled';
const DEFAULT_NTFY_TOPIC = 'ferco-ti-luislugo-alertas';
const CLICK_URL_COMANDO = 'https://ferco-ti-hub.netlify.app/comando';

export function getNtfyTopic(): string {
  try {
    const stored = localStorage.getItem(NTFY_TOPIC_STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
  } catch {
    // Ignorar error de acceso a localStorage
  }
  const envTopic = import.meta.env.VITE_NTFY_TOPIC as string | undefined;
  if (envTopic && envTopic.trim().length > 0) {
    return envTopic.trim();
  }
  return DEFAULT_NTFY_TOPIC;
}

export function setNtfyTopic(topic: string): string {
  const cleaned = topic
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  const finalTopic = cleaned || DEFAULT_NTFY_TOPIC;
  try {
    localStorage.setItem(NTFY_TOPIC_STORAGE_KEY, finalTopic);
  } catch {
    // Ignorar error de acceso a localStorage
  }
  return finalTopic;
}

export function isNtfyEnabled(): boolean {
  try {
    const val = localStorage.getItem(NTFY_ENABLED_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setNtfyEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NTFY_ENABLED_STORAGE_KEY, String(enabled));
  } catch {
    // Ignorar
  }
}

export function mapScoreToNtfyPriority(score: number): 'urgent' | 'default' | 'low' {
  if (score >= 6) return 'urgent'; // 5 en ntfy
  if (score >= 3) return 'default'; // 3 en ntfy
  return 'low'; // 2 en ntfy
}

export function mapScoreToNtfyTags(score: number): string {
  if (score >= 6) return 'rotating_light,warning';
  return 'ticket,wrench';
}

/**
 * Envía una notificación Push instantánea (< 1s) a ntfy.sh cuando se crea un ticket nuevo
 */
export async function sendNtfyTicketNotification(
  ticket: TicketTI
): Promise<{ ok: boolean; error?: string }> {
  if (!isNtfyEnabled()) {
    return { ok: false, error: 'Notificaciones ntfy desactivadas localmente' };
  }

  const topic = getNtfyTopic();
  const priority = mapScoreToNtfyPriority(ticket.score_prioridad);
  const tags = mapScoreToNtfyTags(ticket.score_prioridad);
  const title = `[FER-TI] Nuevo Ticket (${ticket.categoria}) - Prioridad ${ticket.score_prioridad}`;

  const bodyLines = [
    `Solicitante: ${ticket.solicitante_nombre} (${ticket.departamento_tienda})`,
    `Asunto: ${ticket.titulo}`,
    `Asignado a: ${ticket.asignado_a}`,
  ];
  const body = bodyLines.join('\n');

  try {
    const response = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: {
        Title: title,
        Priority: priority,
        Tags: tags,
        Click: CLICK_URL_COMANDO,
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body,
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Error HTTP ${response.status} al enviar push a ntfy.sh`,
      };
    }

    return { ok: true };
  } catch (err) {
    console.warn('No se pudo enviar push a ntfy.sh:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Fallo de red hacia ntfy.sh',
    };
  }
}

/**
 * Envía un Push de prueba inmediato al celular del ingeniero para verificar el canal ntfy.sh
 */
export async function sendNtfyTestNotification(
  customTopic?: string
): Promise<{ ok: boolean; topic: string; error?: string }> {
  const topic = (customTopic && customTopic.trim()) || getNtfyTopic();
  const title = `[FER-TI] Nuevo Ticket (Odoo ERP / TPV Tiendas) - Prioridad 9`;
  const body = [
    `Solicitante: Prueba de Sistema (BI/TI | CDP1)`,
    `Asunto: Verificación de alerta Push instantánea en celular (${formatCodigoTicket(999)})`,
    `Asignado a: Luis Lugo - Analista BI/TI`,
  ].join('\n');

  try {
    const response = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: {
        Title: title,
        Priority: 'urgent',
        Tags: 'rotating_light,warning',
        Click: CLICK_URL_COMANDO,
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body,
    });

    if (!response.ok) {
      return {
        ok: false,
        topic,
        error: `Respuesta HTTP ${response.status} desde ntfy.sh`,
      };
    }
    return { ok: true, topic };
  } catch (err) {
    return {
      ok: false,
      topic,
      error: err instanceof Error ? err.message : 'No se pudo conectar con ntfy.sh',
    };
  }
}

/**
 * Reproduce un beep técnico corto y sutil usando Web Audio API (sin archivos MP3 externos)
 */
export function playAlertBeep(isCritical = false): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, startOffset: number, duration: number, gainVal: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + startOffset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.01);
    };

    if (isCritical) {
      // Doble pulso de alta prioridad (880Hz -> 1174Hz)
      playTone(880, 0, 0.11, 0.16);
      playTone(1174.66, 0.14, 0.16, 0.18);
    } else {
      // Pulso limpio corporativo (740Hz -> 987Hz)
      playTone(740, 0, 0.09, 0.12);
      playTone(987.77, 0.11, 0.12, 0.14);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 600);
  } catch {
    // El navegador puede bloquear Web Audio si aún no hubo interacción previa
  }
}

/**
 * Solicita permiso para la Web Notification API del navegador
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Lanza una notificación nativa del navegador + beep Web Audio cuando entra un ticket nuevo en tiempo real
 */
export function triggerBrowserTicketNotification(ticket: TicketTI): void {
  const isCritical = ticket.score_prioridad >= 6;
  playAlertBeep(isCritical);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const code = formatCodigoTicket(ticket.codigo_ticket);
      const n = new Notification(
        `[FER-TI] ${code} (${ticket.categoria}) - Prioridad ${ticket.score_prioridad}`,
        {
          body: `Solicitante: ${ticket.solicitante_nombre} (${ticket.departamento_tienda})\nAsunto: ${ticket.titulo}\nAsignado a: ${ticket.asignado_a}`,
          icon: '/gcf_icon.svg',
          tag: `ferco-ticket-${ticket.id}`,
        }
      );
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (err) {
      console.warn('No se pudo mostrar notificación nativa:', err);
    }
  }
}
