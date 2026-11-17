import React, { useState } from 'react';
import {
  FilePlus2,
  Kanban,
  BarChart3,
  Lock,
  Unlock,
  Wifi,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { GcfVectorLogoSvg } from './BrandSvgElements';

export type ActiveTab = 'solicitar' | 'comando' | 'metricas';

interface HeaderInstitucionalProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isUnlocked: boolean;
  onLock: () => void;
  connectionMode: 'supabase' | 'local';
  activeTicketsCount: number;
  criticalCount: number;
}

export const HeaderInstitucional: React.FC<HeaderInstitucionalProps> = ({
  activeTab,
  onSelectTab,
  isUnlocked,
  onLock,
  connectionMode,
  activeTicketsCount,
  criticalCount,
}) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-gcf-500/25 bg-gcf-950/95 backdrop-blur-md">
      {/* Línea superior decorativa con el gradiente exacto del logo GCF (#6A87E4 -> #2524CD) */}
      <div
        className="h-1 w-full bg-gradient-to-r from-gcf-500 via-gcf-800 to-gcf-400"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Identidad Corporativa GCF */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex shrink-0 items-center justify-center rounded-xl border border-gcf-200/80 bg-white px-3 py-1.5 shadow-gcf-glow">
                {!logoError ? (
                  <img
                    src="/gcf_logo.png"
                    alt="Logo Grupo Comercializadora Ferco"
                    width={158}
                    height={35}
                    fetchPriority="high"
                    className="h-8 w-auto object-contain sm:h-9"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <GcfVectorLogoSvg className="h-8 w-auto sm:h-9" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gcf-300">
                    Grupo Comercializadora Ferco
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                      connectionMode === 'supabase'
                        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                        : 'border-gcf-400/40 bg-gcf-500/15 text-gcf-100'
                    }`}
                  >
                    {connectionMode === 'supabase' ? (
                      <>
                        <Wifi className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                        Realtime Supabase
                      </>
                    ) : (
                      <>
                        <HardDrive className="h-3 w-3 text-gcf-300" aria-hidden="true" />
                        Modo Local Sincronizado
                      </>
                    )}
                  </span>
                </div>
                <h1 className="text-sm font-bold tracking-tight text-white sm:text-base lg:text-lg">
                  Gerencia de Inteligencia de Negocios y Tecnología —{' '}
                  <span className="text-gcf-300">Hub Operativo TI/BI</span>
                </h1>
              </div>
            </div>

            {/* Botón de bloqueo en móvil */}
            {isUnlocked && (
              <button
                type="button"
                onClick={onLock}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gcf-500/30 bg-gcf-900/60 px-2.5 py-1.5 text-xs font-medium text-gcf-100 transition hover:border-rose-500/40 hover:bg-rose-950/30 hover:text-rose-200 lg:hidden"
              >
                <Unlock className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span>Bloquear</span>
              </button>
            )}
          </div>

          {/* Navegación Principal (Pestañas / Switch) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <nav
              aria-label="Vistas del sistema Hub Operativo TI/BI"
              className="flex w-full sm:w-auto items-center rounded-xl border border-gcf-500/25 bg-slate-900/90 p-1 shadow-inner"
            >
              <button
                type="button"
                onClick={() => onSelectTab('solicitar')}
                aria-current={activeTab === 'solicitar' ? 'page' : undefined}
                className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  activeTab === 'solicitar'
                    ? 'bg-gradient-to-r from-gcf-500 to-gcf-800 text-white shadow-md shadow-gcf-800/40'
                    : 'text-slate-300 hover:bg-gcf-500/10 hover:text-white'
                }`}
              >
                <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Nuevo Requerimiento</span>
                <span className="hidden xl:inline text-[10px] font-normal opacity-90">
                  (Vista Solicitante)
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('comando')}
                aria-current={activeTab === 'comando' ? 'page' : undefined}
                className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  activeTab === 'comando'
                    ? 'bg-gradient-to-r from-gcf-500 to-gcf-800 text-white shadow-md shadow-gcf-800/40'
                    : 'text-slate-300 hover:bg-gcf-500/10 hover:text-white'
                }`}
              >
                <Kanban className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Centro de Comando</span>
                <span className="hidden xl:inline text-[10px] font-normal opacity-90">
                  (Kanban / Foco)
                </span>
                {activeTicketsCount > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      criticalCount > 0
                        ? 'bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/50'
                        : 'bg-gcf-950/80 text-gcf-200'
                    }`}
                  >
                    {activeTicketsCount}
                  </span>
                )}
                {!isUnlocked && (
                  <Lock className="h-3 w-3 text-amber-400/90" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('metricas')}
                aria-current={activeTab === 'metricas' ? 'page' : undefined}
                className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  activeTab === 'metricas'
                    ? 'bg-gradient-to-r from-gcf-500 to-gcf-800 text-white shadow-md shadow-gcf-800/40'
                    : 'text-slate-300 hover:bg-gcf-500/10 hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Métricas / KPIs</span>
                {!isUnlocked && (
                  <Lock className="h-3 w-3 text-amber-400/90" aria-hidden="true" />
                )}
              </button>
            </nav>

            {isUnlocked && (
              <button
                type="button"
                onClick={onLock}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-gcf-500/25 bg-slate-900/90 px-3 py-2 text-xs font-medium text-gcf-100 transition hover:border-rose-500/40 hover:bg-rose-950/30 hover:text-rose-200"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span>Sesión TI Activa (Bloquear)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
