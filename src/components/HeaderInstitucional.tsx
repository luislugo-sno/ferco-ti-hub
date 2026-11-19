import React, { useState } from 'react';
import {
  Search,
  FilePlus2,
  Kanban,
  BarChart3,
  Sliders,
  Lock,
  Unlock,
  Wifi,
  HardDrive,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { GcfVectorLogoSvg } from './BrandSvgElements';

export type ActiveTab =
  | 'consultar'
  | 'solicitar'
  | 'comando'
  | 'metricas'
  | 'formulario';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (tab: ActiveTab) => {
    setMobileMenuOpen(false);
    onSelectTab(tab);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-3 py-2 sm:px-6 sm:py-2.5 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            {/* Identidad Corporativa Compacta en Móvil */}
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
              <div className="flex shrink-0 items-center border-r border-slate-200 pr-2 sm:pr-2.5">
                {!logoError ? (
                  <img
                    src="/gcf_logo.png"
                    alt="Logo Grupo Comercializadora Ferco"
                    width={148}
                    height={33}
                    fetchPriority="high"
                    className="h-6 w-auto object-contain sm:h-8"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <GcfVectorLogoSvg className="h-6 w-auto sm:h-8" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:text-[11px]">
                    Grupo Comercializadora Ferco
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold sm:px-2 sm:text-[10px] ${
                      connectionMode === 'supabase'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-300 bg-slate-100 text-slate-700'
                    }`}
                  >
                    {connectionMode === 'supabase' ? (
                      <>
                        <Wifi className="h-2.5 w-2.5 text-emerald-700" aria-hidden="true" />
                        <span className="hidden xs:inline sm:inline">En Línea</span>
                      </>
                    ) : (
                      <>
                        <HardDrive className="h-2.5 w-2.5 text-slate-600" aria-hidden="true" />
                        <span className="hidden xs:inline sm:inline">Local</span>
                      </>
                    )}
                  </span>
                </div>
                <h1 className="truncate text-xs font-bold tracking-tight text-slate-900 sm:text-base">
                  <span className="hidden sm:inline">
                    Gerencia de Inteligencia de Negocios y Tecnología —{' '}
                  </span>
                  <span className="text-blue-700">Hub Operativo TI/BI</span>
                </h1>
              </div>
            </div>

            {/* Controles Móviles (Menú Hamburguesa + Bloqueo) */}
            <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
              {isUnlocked && (
                <button
                  type="button"
                  onClick={onLock}
                  className="inline-flex h-9 items-center gap-1 rounded-sm border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-800"
                >
                  <Unlock className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                  <span className="hidden sm:inline">Bloquear</span>
                </button>
              )}

              <button
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-label="Abrir menú de navegación"
                onClick={() => setMobileMenuOpen((p) => !p)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-slate-300 bg-slate-50 text-slate-800 transition hover:bg-slate-100"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Menu className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Navegación Desktop (lg+) */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              <nav
                aria-label="Vistas del sistema Hub Operativo TI/BI"
                className="flex items-center rounded-sm border border-slate-300 bg-slate-100 p-0.5"
              >
                <button
                  type="button"
                  onClick={() => onSelectTab('consultar')}
                  aria-current={activeTab === 'consultar' ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === 'consultar'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Consultar mi Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('solicitar')}
                  aria-current={activeTab === 'solicitar' ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
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
                  className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
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
                          ? 'border border-red-300 bg-red-100 text-red-800'
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
                  className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
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

                {/* Pestaña Configurar Formulario: SOLO visible con sesión TI activa */}
                {isUnlocked && (
                  <button
                    type="button"
                    onClick={() => onSelectTab('formulario')}
                    aria-current={activeTab === 'formulario' ? 'page' : undefined}
                    className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                      activeTab === 'formulario'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Configurar Formulario</span>
                  </button>
                )}
              </nav>

              {isUnlocked && (
                <button
                  type="button"
                  onClick={onLock}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-800"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                  <span>Sesión Activa (Bloquear)</span>
                </button>
              )}
            </div>
          </div>

          {/* Menú Desplegable Móvil cuando se toca el botón Hamburguesa */}
          {mobileMenuOpen && (
            <nav
              aria-label="Menú móvil desplegable"
              className="mt-2.5 flex flex-col gap-1 border-t border-slate-200 pt-2.5 lg:hidden"
            >
              <button
                type="button"
                onClick={() => handleMobileNav('consultar')}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-sm px-3 text-left text-xs font-bold ${
                  activeTab === 'consultar'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span>Consultar mi Ticket (Seguimiento Público)</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileNav('solicitar')}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-sm px-3 text-left text-xs font-bold ${
                  activeTab === 'solicitar'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  <span>Nuevo Requerimiento (Registrar Solicitud)</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileNav('comando')}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-sm px-3 text-left text-xs font-bold ${
                  activeTab === 'comando'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Kanban className="h-4 w-4" aria-hidden="true" />
                  <span>Centro de Comando (Kanban / Foco)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  {activeTicketsCount > 0 && (
                    <span className="rounded-sm bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-900">
                      {activeTicketsCount}
                    </span>
                  )}
                  {!isUnlocked && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleMobileNav('metricas')}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-sm px-3 text-left text-xs font-bold ${
                  activeTab === 'metricas'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  <span>Métricas / KPIs Ejecutivos</span>
                </span>
                {!isUnlocked && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
              </button>

              {isUnlocked && (
                <button
                  type="button"
                  onClick={() => handleMobileNav('formulario')}
                  className={`flex min-h-[44px] w-full items-center justify-between rounded-sm px-3 text-left text-xs font-bold ${
                    activeTab === 'formulario'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="h-4 w-4" aria-hidden="true" />
                    <span>Configurar Formulario y Catálogos</span>
                  </span>
                </button>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Barra de Navegación Inferior Fija en Móvil (360px - 430px) */}
      <nav
        aria-label="Barra de navegación inferior móvil"
        className="fixed bottom-0 inset-x-0 z-30 flex border-t border-slate-300 bg-white shadow-sm lg:hidden"
      >
        <button
          type="button"
          onClick={() => handleMobileNav('consultar')}
          aria-current={activeTab === 'consultar' ? 'page' : undefined}
          className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition ${
            activeTab === 'consultar'
              ? 'border-t-2 border-blue-700 bg-blue-50/50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Consultar</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('solicitar')}
          aria-current={activeTab === 'solicitar' ? 'page' : undefined}
          className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition ${
            activeTab === 'solicitar'
              ? 'border-t-2 border-blue-700 bg-blue-50/50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Solicitar</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('comando')}
          aria-current={activeTab === 'comando' ? 'page' : undefined}
          className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition ${
            activeTab === 'comando'
              ? 'border-t-2 border-blue-700 bg-blue-50/50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1">
            <Kanban className="h-4 w-4 shrink-0" aria-hidden="true" />
            {activeTicketsCount > 0 && (
              <span
                className={`rounded-sm px-1 font-mono text-[9px] font-bold ${
                  criticalCount > 0
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {activeTicketsCount}
              </span>
            )}
            {!isUnlocked && <Lock className="h-2.5 w-2.5 opacity-70" aria-hidden="true" />}
          </div>
          <span className="truncate">Comando</span>
        </button>

        <button
          type="button"
          onClick={() => handleMobileNav('metricas')}
          aria-current={activeTab === 'metricas' ? 'page' : undefined}
          className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition ${
            activeTab === 'metricas'
              ? 'border-t-2 border-blue-700 bg-blue-50/50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!isUnlocked && <Lock className="h-2.5 w-2.5 opacity-70" aria-hidden="true" />}
          </div>
          <span className="truncate">KPIs</span>
        </button>

        {isUnlocked && (
          <button
            type="button"
            onClick={() => handleMobileNav('formulario')}
            aria-current={activeTab === 'formulario' ? 'page' : undefined}
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition ${
              activeTab === 'formulario'
                ? 'border-t-2 border-blue-700 bg-blue-50/50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Formulario</span>
          </button>
        )}
      </nav>
    </>
  );
};
