import { formatCodigoTicket, TicketTI } from '../types/tickets';

const TELEGRAM_TOKEN_STORAGE_KEY = 'ferco_ti_telegram_bot_token';
const TELEGRAM_CHAT_ID_STORAGE_KEY = 'ferco_ti_telegram_chat_id';
const TELEGRAM_ENABLED_STORAGE_KEY = 'ferco_ti_telegram_enabled';
const COMANDO_URL = 'https://ferco-ti-hub.netlify.app/comando';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export function getTelegramBotToken(): string {
  try {
    const stored = localStorage.getItem(TELEGRAM_TOKEN_STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
  } catch {
    // Ignorar error de acceso a localStorage
  }
  const envToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string | undefined;
  if (
    envToken &&
    envToken.trim().length > 0 &&
    !envToken.includes('tu_token_de_botfather_aqui')
  ) {
    return envToken.trim();
  }
  return '';
}

export function getTelegramChatId(): string {
  try {
    const stored = localStorage.getItem(TELEGRAM_CHAT_ID_STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
  } catch {
    // Ignorar error de acceso a localStorage
  }
  const envChat = import.meta.env.VITE_TELEGRAM_CHAT_ID as string | undefined;
  if (envChat && envChat.trim().length > 0 && envChat.trim() !== '123456789') {
    return envChat.trim();
  }
  return '';
}

export function isTelegramEnabled(): boolean {
  try {
    const val = localStorage.getItem(TELEGRAM_ENABLED_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function getTelegramConfig(): TelegramConfig {
  return {
    botToken: getTelegramBotToken(),
    chatId: getTelegramChatId(),
    enabled: isTelegramEnabled(),
  };
}

export function saveTelegramConfig(config: {
  botToken: string;
  chatId: string;
  enabled?: boolean;
}): TelegramConfig {
  const cleanToken = config.botToken.trim();
  const cleanChatId = config.chatId.trim();
  const cleanEnabled = config.enabled ?? isTelegramEnabled();

  try {
    localStorage.setItem(TELEGRAM_TOKEN_STORAGE_KEY, cleanToken);
    localStorage.setItem(TELEGRAM_CHAT_ID_STORAGE_KEY, cleanChatId);
    localStorage.setItem(TELEGRAM_ENABLED_STORAGE_KEY, String(cleanEnabled));
  } catch {
    // Ignorar error de localStorage
  }

  return {
    botToken: cleanToken,
    chatId: cleanChatId,
    enabled: cleanEnabled,
  };
}

export function isTelegramConfigured(): boolean {
  const { botToken, chatId } = getTelegramConfig();
  return Boolean(botToken && chatId);
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildTelegramTicketHtml(ticket: TicketTI): string {
  const headerLine =
    ticket.score_prioridad >= 6
      ? '🚨 TICKET CRÍTICO TI/BI'
      : '📋 NUEVO REQUERIMIENTO TI/BI';

  const nivelTexto =
    ticket.score_prioridad >= 6
      ? 'Alta/Crítica'
      : ticket.score_prioridad >= 3
      ? 'Media'
      : 'Baja';

  return [
    `<b>${headerLine}</b>`,
    '',
    `<b>Prioridad:</b> Score ${ticket.score_prioridad} (${nivelTexto})`,
    `<b>Solicitante:</b> ${escapeHtml(ticket.solicitante_nombre)}`,
    `<b>Ubicación:</b> ${escapeHtml(ticket.departamento_tienda)}`,
    `<b>Categoría:</b> ${escapeHtml(ticket.categoria)}`,
    `<b>Asunto:</b> ${escapeHtml(ticket.titulo)}`,
    `<b>Asignado a:</b> ${escapeHtml(ticket.asignado_a)}`,
  ].join('\n');
}

/**
 * Envía una notificación instantánea mediante la API de Bots de Telegram cuando se crea un ticket
 */
export async function sendTelegramTicketNotification(
  ticket: TicketTI
): Promise<{ ok: boolean; error?: string }> {
  const { botToken, chatId, enabled } = getTelegramConfig();

  if (!enabled) {
    return { ok: false, error: 'Alertas de Telegram desactivadas localmente.' };
  }
  if (!botToken || !chatId) {
    return {
      ok: false,
      error: 'Falta configurar VITE_TELEGRAM_BOT_TOKEN o VITE_TELEGRAM_CHAT_ID.',
    };
  }

  const text = buildTelegramTicketHtml(ticket);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          parse_mode: 'HTML',
          text,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Abrir Centro de Comando',
                  url: COMANDO_URL,
                },
              ],
            ],
          },
        }),
      }
    );

    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      description?: string;
    } | null;

    if (!response.ok || !data?.ok) {
      return {
        ok: false,
        error:
          data?.description ||
          `Error HTTP ${response.status} desde la API de Telegram`,
      };
    }

    return { ok: true };
  } catch (err) {
    console.warn('No se pudo enviar mensaje a Telegram:', err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Error de red al conectar con api.telegram.org',
    };
  }
}

/**
 * Envía un mensaje Push de prueba real a Telegram y valida si la respuesta (`ok: true`) fue exitosa
 */
export async function sendTelegramTestNotification(override?: {
  botToken?: string;
  chatId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const botToken = (override?.botToken ?? getTelegramBotToken()).trim();
  const chatId = (override?.chatId ?? getTelegramChatId()).trim();

  if (!botToken || !chatId) {
    return {
      ok: false,
      error: 'Ingrese un Bot Token y un Chat ID válidos antes de enviar la prueba.',
    };
  }

  const dummyTicket: TicketTI = {
    id: 'test-telegram-push',
    codigo_ticket: 999,
    created_at: new Date().toISOString(),
    solicitante_nombre: 'Prueba de Sistema BI/TI',
    departamento_tienda: 'BI/TI | CDP1',
    categoria: 'Odoo ERP / TPV Tiendas',
    titulo: `Verificación de alerta Push instantánea (${formatCodigoTicket(999)})`,
    descripcion: 'Mensaje de prueba enviado desde el Centro de Comando.',
    impacto: 3,
    urgencia: 3,
    score_prioridad: 9,
    estado: 'Bandeja de Entrada',
    asignado_a: 'Luis Lugo - Analista BI/TI',
    notas_tecnicas: '',
    fecha_resolucion: null,
  };

  const text = buildTelegramTicketHtml(dummyTicket);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          parse_mode: 'HTML',
          text,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Abrir Centro de Comando',
                  url: COMANDO_URL,
                },
              ],
            ],
          },
        }),
      }
    );

    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      description?: string;
    } | null;

    if (!response.ok || data?.ok !== true) {
      return {
        ok: false,
        error:
          data?.description ||
          `La API de Telegram devolvió estado HTTP ${response.status}`,
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con api.telegram.org',
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
      playTone(880, 0, 0.11, 0.16);
      playTone(1174.66, 0.14, 0.16, 0.18);
    } else {
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
