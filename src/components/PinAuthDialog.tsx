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
      setError('PIN incorrecto. Verifique la credencial de acceso de la Gerencia BI/TI.');
      inputRef.current?.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="m-auto w-full max-w-md rounded-md border border-slate-300 bg-white p-0 text-slate-900 shadow-lg open:flex open:flex-col"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-blue-200 bg-blue-50 text-blue-700">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-sm font-bold text-slate-900">
              Control de Acceso Operativo BI/TI
            </h2>
            <p className="text-[11px] text-slate-600">
              Módulo solicitado: <span className="font-semibold text-blue-700">{targetName}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Cerrar ventana de autenticación"
          className="rounded-sm p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} method="post" className="space-y-4 p-5">
        <p id={descId} className="text-xs leading-relaxed text-slate-600">
          Ingrese el PIN de autorización de la{' '}
          <strong className="text-slate-900">
            Gerencia de Inteligencia de Negocios y Tecnología
          </strong>{' '}
          para acceder a la gestión de cola e indicadores.
        </p>

        <div className="space-y-1">
          <label
            htmlFor={pinInputId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            PIN de Seguridad <span aria-hidden="true" className="text-red-600">*</span>
          </label>
          <div className="relative flex items-center">
            <KeyRound
              className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
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
              placeholder="PIN (Ej: 1234)"
              className="h-10 w-full rounded-sm border border-slate-300 bg-white pl-9 pr-10 font-mono text-sm tracking-widest text-slate-900 placeholder:font-sans placeholder:text-xs placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
            />
            <button
              type="button"
              aria-pressed={showPin}
              aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              onClick={() => setShowPin((prev) => !prev)}
              className="absolute right-2 rounded-sm p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              {showPin ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            PIN predeterminado:{' '}
            <code className="rounded-sm border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono text-slate-800">
              1234
            </code>
          </p>
        </div>

        <div aria-live="polite">
          {error && (
            <div
              id={errorId}
              className="flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
            >
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-sm border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-sm bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
          >
            Autorizar Acceso
          </button>
        </div>
      </form>
    </dialog>
  );
};
