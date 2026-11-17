import React, { useEffect, useId, useRef, useState } from 'react';
import {
  X,
  Save,
  UserCheck,
  Clock,
  AlertOctagon,
  MessageSquareCode,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import {
  AsignadoA,
  CATEGORIAS_TICKET,
  CategoriaTicket,
  EQUIPO_TI_BI,
  ESTADOS_TICKET,
  EstadoTicket,
  estaEstancadoProveedor,
  formatCodigoTicket,
  getHorasSinMoverse,
  getPrioridadMeta,
  NivelImpacto,
  NivelUrgencia,
  TicketTI,
} from '../types/tickets';
import {
  CategorySvgIcon,
  EstadoColumnaSvg,
  SpecialistAvatarSvg,
} from './BrandSvgElements';

interface TicketModalDialogProps {
  ticket: TicketTI | null;
  onClose: () => void;
  onUpdateTicket: (
    id: string,
    changes: Partial<
      Pick<
        TicketTI,
        | 'estado'
        | 'asignado_a'
        | 'notas_tecnicas'
        | 'impacto'
        | 'urgencia'
        | 'categoria'
        | 'titulo'
        | 'descripcion'
      >
    >
  ) => Promise<void>;
}

export const TicketModalDialog: React.FC<TicketModalDialogProps> = ({
  ticket,
  onClose,
  onUpdateTicket,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const notasRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const notasId = useId();
  const asignadoId = useId();
  const categoriaId = useId();

  const [estado, setEstado] = useState<EstadoTicket>('Bandeja de Entrada');
  const [asignadoA, setAsignadoA] = useState<AsignadoA>('Luis Lugo');
  const [categoria, setCategoria] = useState<CategoriaTicket>('Odoo ERP / TPV Tiendas');
  const [impacto, setImpacto] = useState<NivelImpacto>(1);
  const [urgencia, setUrgencia] = useState<NivelUrgencia>(1);
  const [notasTecnicas, setNotasTecnicas] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (ticket) {
      setEstado(ticket.estado);
      setAsignadoA(ticket.asignado_a);
      setCategoria(ticket.categoria);
      setImpacto(ticket.impacto);
      setUrgencia(ticket.urgencia);
      setNotasTecnicas(ticket.notas_tecnicas || '');
      setSavedNotice(false);

      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [ticket]);

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

  if (!ticket) {
    return (
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        className="hidden"
      />
    );
  }

  const scorePreview = impacto * urgencia;
  const meta = getPrioridadMeta(scorePreview);
  const horasSinMovimiento = getHorasSinMoverse(ticket);
  const estancado = estaEstancadoProveedor(ticket);

  const handleQuickStateClick = async (nuevoEstado: EstadoTicket) => {
    setEstado(nuevoEstado);
    setIsSaving(true);
    try {
      await onUpdateTicket(ticket.id, {
        estado: nuevoEstado,
        asignado_a: asignadoA,
        categoria,
        impacto,
        urgencia,
        notas_tecnicas: notasTecnicas,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateTicket(ticket.id, {
        estado,
        asignado_a: asignadoA,
        categoria,
        impacto,
        urgencia,
        notas_tecnicas: notasTecnicas,
      });
      setSavedNotice(true);
      setTimeout(() => {
        dialogRef.current?.close();
      }, 450);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      className="m-auto w-full max-w-2xl rounded-2xl border border-gcf-500/35 bg-slate-900 p-0 text-slate-100 shadow-2xl shadow-black/80 open:flex open:flex-col max-h-[92vh]"
    >
      {/* Cabecera del Modal */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-gcf-500/20 px-2.5 py-1 font-mono text-xs font-black text-gcf-200 ring-1 ring-gcf-400/40">
              {formatCodigoTicket(ticket.codigo_ticket)}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${meta.badgeClass}`}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
              Score {scorePreview} — {meta.codigoSLA}
            </span>
            {estancado && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-rose-500/50 bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-200">
                <AlertOctagon className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                +{horasSinMovimiento}h esperando proveedor
              </span>
            )}
          </div>
          <h2 id={titleId} className="text-base font-bold text-white sm:text-lg">
            {ticket.titulo}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Cerrar ficha técnica del ticket"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Cuerpo scrollable */}
      <form
        onSubmit={handleSaveAll}
        className="flex-1 space-y-5 overflow-y-auto px-6 py-5"
      >
        {/* Metadatos del Solicitante */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-gcf-950/75 p-3.5 text-xs sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0 text-gcf-400" aria-hidden="true" />
            <div>
              <span className="block text-[10px] uppercase text-slate-400">
                Solicitante
              </span>
              <span className="font-semibold text-slate-100">
                {ticket.solicitante_nombre}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-gcf-400" aria-hidden="true" />
            <div>
              <span className="block text-[10px] uppercase text-slate-400">
                Departamento / Tienda
              </span>
              <span className="font-semibold text-slate-100">
                {ticket.departamento_tienda}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-gcf-400" aria-hidden="true" />
            <div>
              <span className="block text-[10px] uppercase text-slate-400">
                Creado / Sin moverse
              </span>
              <span className="font-semibold text-slate-100">
                {new Date(ticket.created_at).toLocaleDateString('es-VE', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                ({horasSinMovimiento}h)
              </span>
            </div>
          </div>
        </div>

        {/* Descripción Original */}
        <div className="rounded-xl border border-slate-800/80 bg-gcf-950/40 p-3.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Descripción del Requerimiento
          </span>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-200">
            {ticket.descripcion || 'Sin descripción adicional registrada (Captura rápida).'}
          </p>
        </div>

        {/* Cambio de Estado con 1 Clic e Icono SVG */}
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gcf-300">
            Cambiar Estado con 1 Clic
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {ESTADOS_TICKET.map((st) => {
              const active = estado === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleQuickStateClick(st)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2.5 py-2 text-center text-xs font-semibold transition ${
                    active
                      ? st === 'Resuelto'
                        ? 'border-emerald-500 bg-emerald-600/25 text-emerald-200 shadow-sm'
                        : st === 'Esperando Proveedor/Tercero'
                        ? 'border-amber-500 bg-amber-600/25 text-amber-200 shadow-sm'
                        : 'border-gcf-400 bg-gradient-to-r from-gcf-500 to-gcf-800 text-white shadow-sm'
                      : 'border-slate-800 bg-gcf-950/70 text-slate-400 hover:border-gcf-500/40 hover:text-slate-200'
                  }`}
                >
                  <EstadoColumnaSvg estado={st} className="h-4 w-4" />
                  <span className="leading-tight">{st}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Asignación, Categoría y Recálculo de Matriz */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={asignadoId}
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              <UserCheck className="h-3.5 w-3.5 text-gcf-400" aria-hidden="true" />
              <span>Especialista Asignado</span>
            </label>
            <div className="flex items-center gap-2">
              <SpecialistAvatarSvg nombre={asignadoA} size="md" />
              <select
                id={asignadoId}
                name="asignado_a"
                value={asignadoA}
                onChange={(e) => setAsignadoA(e.target.value as AsignadoA)}
                className="min-h-[44px] flex-1 rounded-xl border border-slate-700 bg-gcf-950 px-3 py-2 text-sm text-white focus:border-gcf-500 focus:outline-none"
              >
                {EQUIPO_TI_BI.map((miembro) => (
                  <option key={miembro} value={miembro}>
                    {miembro} {miembro === 'Luis Lugo' ? '(Líder / Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor={categoriaId}
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              <Layers className="h-3.5 w-3.5 text-gcf-400" aria-hidden="true" />
              <span>Categoría Técnica</span>
            </label>
            <div className="flex items-center gap-2">
              <CategorySvgIcon categoria={categoria} className="h-6 w-6 shrink-0" />
              <select
                id={categoriaId}
                name="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaTicket)}
                className="min-h-[44px] flex-1 rounded-xl border border-slate-700 bg-gcf-950 px-3 py-2 text-sm text-white focus:border-gcf-500 focus:outline-none"
              >
                {CATEGORIAS_TICKET.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ajuste rápido de Impacto x Urgencia en Triage */}
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-gcf-950/60 p-3.5">
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Ajustar Impacto (1–3)
            </span>
            <div className="flex gap-2">
              {([1, 2, 3] as NivelImpacto[]).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setImpacto(n)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                    impacto === n
                      ? 'border-gcf-400 bg-gcf-500/25 text-gcf-100'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Impacto {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Ajustar Urgencia (1–3)
            </span>
            <div className="flex gap-2">
              {([1, 2, 3] as NivelUrgencia[]).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setUrgencia(n)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                    urgencia === n
                      ? 'border-gcf-400 bg-gcf-500/25 text-gcf-100'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Urgencia {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notas Técnicas */}
        <div>
          <label
            htmlFor={notasId}
            className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gcf-300"
          >
            <MessageSquareCode className="h-4 w-4 text-gcf-400" aria-hidden="true" />
            <span>Bitácora / Notas Técnicas de Resolución o Proveedor</span>
          </label>
          <textarea
            ref={notasRef}
            id={notasId}
            name="notas_tecnicas"
            rows={4}
            autoFocus
            value={notasTecnicas}
            onChange={(e) => setNotasTecnicas(e.target.value)}
            placeholder="Documenta diagnósticos, número de ticket de ISP/Starlink, ajustes en Odoo, queries de BI o causa raíz..."
            className="w-full rounded-xl border border-slate-700 bg-gcf-950 p-3.5 text-sm text-white placeholder:text-slate-500 focus:border-gcf-500 focus:outline-none focus:ring-2 focus:ring-gcf-500/30"
          />
        </div>

        {/* Pie del Modal */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div aria-live="polite" className="text-xs">
            {savedNotice ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Cambios guardados y sincronizados
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Presiona Esc o haz clic fuera para cerrar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gcf-500 to-gcf-800 px-5 py-2.5 text-xs font-bold text-white shadow-gcf-glow transition hover:brightness-110 disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Ficha Técnica'}</span>
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
};
