import React, { useEffect, useId, useRef, useState } from 'react';
import { LockKeyhole, Eye, EyeOff, ShieldAlert, KeyRound, X } from 'lucide-react';
import {
  fetchAdminPinFromSupabase,
  getCachedAdminPin,
  upsertAdminPinInSupabase,
} from '../lib/supabase';

interface PinAuthDialogProps {
  isOpen: boolean;
  targetName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function getExpectedPin(): string {
  return getCachedAdminPin();
}

export async function updateGlobalPin(newPin: string): Promise<{
  ok: boolean;
  pin: string;
  mode: 'supabase' | 'local';
  error?: string;
}> {
  return upsertAdminPinInSupabase(newPin);
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
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setPin('');
      setError('');
      dialog.showModal();
      void fetchAdminPinFromSupabase();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    try {
      const { pin: remotePin } = await fetchAdminPinFromSupabase();
      if (pin.trim() === remotePin) {
        setPin('');
        if (dialogRef.current?.open) {
          dialogRef.current.close();
        }
        onSuccess();
      } else {
        setError('PIN incorrecto. Verifique la credencial de acceso de la Gerencia BI/TI.');
        inputRef.current?.focus();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="m-auto w-[calc(100%-1.5rem)] max-w-md rounded-md border border-slate-300 bg-white p-0 text-slate-900 shadow-lg open:flex open:flex-col"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-blue-200 bg-blue-50 text-blue-700">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-sm font-bold text-slate-900">
              Control de Acceso Operativo BI/TI
            </h2>
            <p className="text-[11px] text-slate-600">
              Módulo: <span className="font-semibold text-blue-700">{targetName}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Cerrar ventana de autenticación"
          className="rounded-sm p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} method="post" className="space-y-4 p-4 sm:p-5">
        <p id={descId} className="text-xs leading-relaxed text-slate-600">
          Ingrese el PIN global sincronizado en Supabase de la{' '}
          <strong className="text-slate-900">
            Gerencia de Inteligencia de Negocios y Tecnología
          </strong>
          .
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
              placeholder="Ingrese PIN"
              className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white pl-9 pr-11 font-mono text-base tracking-widest text-slate-900 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
            />
            <button
              type="button"
              aria-pressed={showPin}
              aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              onClick={() => setShowPin((prev) => !prev)}
              className="absolute right-2 rounded-sm p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              {showPin ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
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

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:h-9 sm:min-h-0 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isVerifying}
            className="min-h-[44px] w-full rounded-sm bg-blue-700 px-5 text-xs font-bold text-white transition hover:bg-blue-800 disabled:opacity-60 sm:h-9 sm:min-h-0 sm:w-auto"
          >
            {isVerifying ? 'Verificando...' : 'Autorizar Acceso'}
          </button>
        </div>
      </form>
    </dialog>
  );
};
