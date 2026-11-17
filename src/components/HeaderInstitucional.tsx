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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1600px] px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Identidad Corporativa sobre fondo blanco limpio */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex shrink-0 items-center pr-2 border-r border-slate-200">
                {!logoError ? (
                  <img
                    src="/gcf_logo.png"
                    alt="Logo Grupo Comercializadora Ferco"
                    width={148}
                    height={33}
                    fetchPriority="high"
                    className="h-8 w-auto object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <GcfVectorLogoSvg className="h-8 w-auto" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Grupo Comercializadora Ferco
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-semibold border ${
                      connectionMode === 'supabase'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-300 bg-slate-100 text-slate-700'
                    }`}
                  >
                    {connectionMode === 'supabase' ? (
                      <>
                        <Wifi className="h-3 w-3 text-emerald-700" aria-hidden="true" />
                        Supabase En Línea
                      </>
                    ) : (
                      <>
                        <HardDrive className="h-3 w-3 text-slate-600" aria-hidden="true" />
                        Almacenamiento Local
                      </>
                    )}
                  </span>
                </div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                  Gerencia de Inteligencia de Negocios y Tecnología —{' '}
                  <span className="text-blue-700">Hub Operativo TI/BI</span>
                </h1>
              </div>
            </div>

            {isUnlocked && (
              <button
                type="button"
                onClick={onLock}
                className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 lg:hidden"
              >
                <Unlock className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                <span>Bloquear</span>
              </button>
            )}
          </div>

          {/* Navegación Principal estilo ERP */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <nav
              aria-label="Vistas del sistema Hub Operativo TI/BI"
              className="flex w-full sm:w-auto items-center rounded-sm border border-slate-300 bg-slate-100 p-0.5"
            >
              <button
                type="button"
                onClick={() => onSelectTab('solicitar')}
                aria-current={activeTab === 'solicitar' ? 'page' : undefined}
                className={`flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'solicitar'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
              >
                <FilePlus2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Nuevo Requerimiento</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('comando')}
                aria-current={activeTab === 'comando' ? 'page' : undefined}
                className={`flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'comando'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Kanban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Centro de Comando</span>
                {activeTicketsCount > 0 && (
                  <span
                    className={`ml-0.5 rounded-sm px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                      activeTab === 'comando'
                        ? 'bg-blue-900 text-white'
                        : criticalCount > 0
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {activeTicketsCount}
                  </span>
                )}
                {!isUnlocked && (
                  <Lock className="h-3 w-3 opacity-75" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('metricas')}
                aria-current={activeTab === 'metricas' ? 'page' : undefined}
                className={`flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'metricas'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Métricas / KPIs</span>
                {!isUnlocked && (
                  <Lock className="h-3 w-3 opacity-75" aria-hidden="true" />
                )}
              </button>
            </nav>

            {isUnlocked && (
              <button
                type="button"
                onClick={onLock}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-800"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                <span>Sesión Activa (Bloquear)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
