import React, { useEffect, useId, useRef, useState } from 'react';
import {
  BellRing,
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Volume2,
  X,
  Save,
} from 'lucide-react';
import {
  getNtfyTopic,
  isNtfyEnabled,
  playAlertBeep,
  requestBrowserNotificationPermission,
  sendNtfyTestNotification,
  setNtfyEnabled,
  setNtfyTopic,
} from '../lib/notifications';

interface MobileAlertsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTopicChanged: (newTopic: string) => void;
}

export const MobileAlertsDialog: React.FC<MobileAlertsDialogProps> = ({
  isOpen,
  onClose,
  onTopicChanged,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const topicInputId = useId();
  const enabledCheckId = useId();

  const [topic, setTopic] = useState<string>(() => getNtfyTopic());
  const [enabled, setEnabled] = useState<boolean>(() => isNtfyEnabled());
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied'
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setTopic(getNtfyTopic());
      setEnabled(isNtfyEnabled());
      setTestResult(null);
      setSavedMsg(false);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setBrowserPerm(Notification.permission);
      }
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

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

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = setNtfyTopic(topic);
    setNtfyEnabled(enabled);
    setTopic(clean);
    onTopicChanged(clean);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleCopyTopic = () => {
    navigator.clipboard?.writeText(topic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestPush = async () => {
    const clean = setNtfyTopic(topic);
    setTopic(clean);
    onTopicChanged(clean);

    setIsSendingTest(true);
    setTestResult(null);
    playAlertBeep(true);

    const res = await sendNtfyTestNotification(clean);
    setIsSendingTest(false);

    if (res.ok) {
      setTestResult({
        ok: true,
        message: `Push enviado con éxito a https://ntfy.sh/${res.topic}. Verifique su celular.`,
      });
    } else {
      setTestResult({
        ok: false,
        message: res.error || 'No se pudo enviar la notificación Push a ntfy.sh.',
      });
    }
  };

  const handleRequestBrowserPerm = async () => {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPerm(perm);
    if (perm === 'granted') {
      playAlertBeep(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="m-auto w-full max-w-lg rounded-md border border-slate-300 bg-white p-0 text-slate-900 shadow-lg open:flex open:flex-col"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-blue-200 bg-blue-50 text-blue-700">
            <Smartphone className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-sm font-bold text-slate-900">
              Configuración de Alertas Móviles (ntfy.sh) y Navegador
            </h2>
            <p className="text-[11px] text-slate-600">
              Notificaciones Push instantáneas (&lt; 1 seg) al registrar nuevos tickets
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Cerrar configuración de alertas móviles"
          className="rounded-sm p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Cuerpo */}
      <form onSubmit={handleSaveConfig} className="space-y-4 p-5">
        {/* Canal ntfy.sh */}
        <div className="space-y-1.5">
          <label
            htmlFor={topicInputId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Canal / Topic de ntfy.sh
          </label>
          <div className="flex gap-1.5">
            <input
              id={topicInputId}
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="ferco-ti-luislugo-alertas"
              className="h-9 flex-1 rounded-sm border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
            />
            <button
              type="button"
              onClick={handleCopyTopic}
              className="inline-flex h-9 items-center gap-1 rounded-sm border border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span>Copiar</span>
                </>
              )}
            </button>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1 rounded-sm border border-blue-700 bg-blue-50 px-3 text-xs font-bold text-blue-800 transition hover:bg-blue-100"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Guardar</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Endpoint activo:{' '}
            <code className="rounded-sm border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono text-slate-800">
              https://ntfy.sh/{topic || 'ferco-ti-luislugo-alertas'}
            </code>
          </p>
        </div>

        {/* Switch activar/desactivar envío push */}
        <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">
          <input
            id={enabledCheckId}
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              setNtfyEnabled(e.target.checked);
            }}
            className="h-4 w-4 accent-blue-700"
          />
          <label
            htmlFor={enabledCheckId}
            className="cursor-pointer select-none text-xs font-semibold text-slate-800"
          >
            Enviar Push automático a ntfy.sh cada vez que se registre un ticket nuevo
          </label>
        </div>

        {/* Botón Principal de Prueba Instantánea al Celular */}
        <div className="rounded-sm border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Prueba de Recepción en Celular
            </span>
            <span className="font-mono text-[10px] font-semibold text-blue-700">
              Prioridad: urgent (5)
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            1. Instale la app gratuita <strong>ntfy</strong> en su celular (Android / iOS).
            <br />
            2. Suscríbase al tema <code className="font-mono font-bold text-slate-800">{topic}</code> y presione el botón debajo:
          </p>

          <button
            type="button"
            disabled={isSendingTest}
            onClick={handleSendTestPush}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isSendingTest
                ? 'Enviando Push a ntfy.sh...'
                : 'Enviar Push de Prueba a mi Celular'}
            </span>
          </button>

          <div aria-live="polite">
            {testResult && (
              <div
                className={`mt-2 flex items-start gap-2 rounded-sm border p-2.5 text-xs font-medium ${
                  testResult.ok
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-red-300 bg-red-50 text-red-800'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="h-4 w-4 shrink-0 text-red-600"
                    aria-hidden="true"
                  />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Estado de Notificaciones Nativas del Navegador + Sonido Web Audio */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-blue-700" aria-hidden="true" />
            <div className="text-xs">
              <span className="block font-bold text-slate-800">
                Notificación Nativa de Navegador + Sonido Web Audio
              </span>
              <span className="text-[11px] text-slate-500">
                Estado del permiso:{' '}
                <strong className="uppercase text-slate-700">{browserPerm}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => playAlertBeep(true)}
              className="inline-flex h-8 items-center gap-1 rounded-sm border border-slate-300 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Volume2 className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              <span>Probar Sonido</span>
            </button>

            {browserPerm !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestBrowserPerm}
                className="inline-flex h-8 items-center gap-1 rounded-sm bg-slate-800 px-2.5 text-[11px] font-bold text-white transition hover:bg-slate-900"
              >
                <span>Activar Permiso</span>
              </button>
            )}
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <div aria-live="polite" className="text-xs">
            {savedMsg && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Canal guardado en localStorage
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-sm border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </form>
    </dialog>
  );
};
