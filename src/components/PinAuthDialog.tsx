import React, { useEffect, useId, useRef, useState } from 'react';
import { LockKeyhole, Eye, EyeOff, ShieldAlert, KeyRound, X } from 'lucide-react';

interface PinAuthDialogProps {
  isOpen: boolean;
  targetName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CUSTOM_PIN_STORAGE_KEY = 'ferco_admin_custom_pin';

export function getExpectedPin(): string {
  const custom = localStorage.getItem(CUSTOM_PIN_STORAGE_KEY);
  if (custom && custom.trim().length >= 4) return custom.trim();
  const envPin = import.meta.env.VITE_ADMIN_PIN as string | undefined;
  return envPin && envPin.trim().length > 0 ? envPin.trim() : '1234';
}

export function setCustomPin(newPin: string): void {
  localStorage.setItem(CUSTOM_PIN_STORAGE_KEY, newPin.trim());
}

export const PinAuthDialog: React.FC<PinAuthDialogProps> = ({
  isOpen,
  targetName,
  onSuccess,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descId = useId();
  const errorId = useId();
  const pinInputId = useId();

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setPin('');
      setError('');
      dialog.showModal();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onCancel();
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
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = getExpectedPin();
    if (pin.trim() === expected) {
      setError('');
      setPin('');
      if (dialogRef.current?.open) {
        dialogRef.current.close();
      }
      onSuccess();
    } else {
      setError('PIN incorrecto. Verifica el código de acceso de la Gerencia TI/BI.');
      inputRef.current?.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="m-auto w-full max-w-md rounded-2xl border border-gcf-500/35 bg-slate-900 p-0 text-slate-100 shadow-2xl shadow-black/80 open:flex open:flex-col"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gcf-500/20 text-gcf-300 ring-1 ring-gcf-400/40">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-base font-bold text-white">
              Acceso Restringido TI/BI
            </h2>
            <p className="text-xs text-slate-400">
              Módulo: <span className="font-medium text-gcf-200">{targetName}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Cerrar ventana de autenticación"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} method="post" className="space-y-4 p-6">
        <p id={descId} className="text-xs leading-relaxed text-slate-300">
          Ingresa el PIN de seguridad del equipo de la{' '}
          <strong className="text-white">
            Gerencia de Inteligencia de Negocios y Tecnología
          </strong>{' '}
          para gestionar la cola operativa y visualizar indicadores.
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor={pinInputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            PIN de Autorización <span aria-hidden="true" className="text-rose-400">*</span>
          </label>
          <div className="relative flex items-center">
            <KeyRound
              className="pointer-events-none absolute left-3.5 h-4 w-4 text-gcf-300"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id={pinInputId}
              name="admin_pin"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete="current-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              required
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? errorId : undefined}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ingresa tu PIN (Ej: 1234)"
              className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-gcf-950 pl-10 pr-11 py-2.5 font-mono text-base tracking-widest text-white placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-500 focus:border-gcf-500 focus:outline-none focus:ring-2 focus:ring-gcf-500/30"
            />
            <button
              type="button"
              aria-pressed={showPin}
              aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              onClick={() => setShowPin((prev) => !prev)}
              className="absolute right-2.5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              {showPin ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            PIN predeterminado de configuración:{' '}
            <code className="rounded bg-gcf-900/60 px-1.5 py-0.5 text-gcf-200">1234</code>{' '}
            (configurable en <code className="text-slate-300">.env</code> o desde el panel de KPIs).
          </p>
        </div>

        <div aria-live="polite">
          {error && (
            <div
              id={errorId}
              className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-200"
            >
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-gcf-500 to-gcf-800 px-5 py-2.5 text-xs font-bold text-white shadow-gcf-glow transition hover:brightness-110"
          >
            Desbloquear Acceso
          </button>
        </div>
      </form>
    </dialog>
  );
};
