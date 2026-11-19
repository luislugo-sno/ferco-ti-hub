import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActiveTab,
  HeaderInstitucional,
} from './components/HeaderInstitucional';
import { ConsultarTicketView } from './components/ConsultarTicketView';
import { PortalSolicitudView } from './components/PortalSolicitudView';
import { CentroComandoView } from './components/CentroComandoView';
import { DashboardKPIsView } from './components/DashboardKPIsView';
import { ConfigurarFormularioView } from './components/ConfigurarFormularioView';
import { PinAuthDialog } from './components/PinAuthDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  createTicketTI,
  fetchAdminPinFromSupabase,
  fetchFormSchemaFromSupabase,
  fetchTicketsTI,
  getCachedFormSchema,
  subscribeToTicketsTI,
  updateTicketTI,
} from './lib/supabase';
import { triggerBrowserTicketNotification } from './lib/notifications';
import { FormSchemaConfig, NuevoTicketInput, TicketTI } from './types/tickets';

const SESSION_UNLOCK_KEY = 'ferco_ti_bi_unlocked_session';

function getInitialTabFromUrl(): ActiveTab {
  try {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('/solicitar')) return 'solicitar';
    if (path.includes('/comando') || path.includes('/kanban')) return 'comando';
    if (path.includes('/metricas') || path.includes('/kpis')) return 'metricas';
    if (path.includes('/formulario') || path.includes('/configurar')) return 'formulario';
    return 'consultar';
  } catch {
    return 'consultar';
  }
}

export const App: React.FC = () => {
  const [tickets, setTickets] = useState<TicketTI[]>([]);
  const [formSchema, setFormSchema] = useState<FormSchemaConfig>(() =>
    getCachedFormSchema()
  );
  const [connectionMode, setConnectionMode] = useState<'supabase' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(true);
  const [trackedCodigoParam, setTrackedCodigoParam] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('codigo');
    } catch {
      return null;
    }
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const requested = getInitialTabFromUrl();
    let unlocked = false;
    try {
      unlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
    } catch {
      unlocked = false;
    }
    if (
      (requested === 'comando' ||
        requested === 'metricas' ||
        requested === 'formulario') &&
      !unlocked
    ) {
      return 'consultar';
    }
    return requested;
  });

  const activeTabRef = useRef<ActiveTab>(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const [pendingProtectedTab, setPendingProtectedTab] = useState<ActiveTab | null>(() => {
    const requested = getInitialTabFromUrl();
    let unlocked = false;
    try {
      unlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
    } catch {
      unlocked = false;
    }
    if (
      (requested === 'comando' ||
        requested === 'metricas' ||
        requested === 'formulario') &&
      !unlocked
    ) {
      return requested;
    }
    return null;
  });

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetchTicketsTI();
      setTickets(Array.isArray(res?.data) ? res.data : []);
      setConnectionMode(res?.mode || 'local');
    } catch (err) {
      console.error('Error cargando lista de tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAppConfig = useCallback(async () => {
    try {
      const [schemaRes] = await Promise.all([
        fetchFormSchemaFromSupabase(),
        fetchAdminPinFromSupabase(),
      ]);
      if (schemaRes?.schema) {
        setFormSchema(schemaRes.schema);
      }
    } catch (err) {
      console.warn('Error cargando configuración global:', err);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
    void loadAppConfig();

    const unsubscribe = subscribeToTicketsTI(
      () => {
        void loadTickets();
      },
      (newTicket) => {
        if (
          activeTabRef.current === 'comando' ||
          sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true'
        ) {
          triggerBrowserTicketNotification(newTicket);
        }
      },
      () => {
        void loadAppConfig();
      }
    );
    return () => unsubscribe();
  }, [loadTickets, loadAppConfig]);

  // Sincronización con el historial del navegador
  useEffect(() => {
    const onPopState = () => {
      const target = getInitialTabFromUrl();
      try {
        const params = new URLSearchParams(window.location.search);
        setTrackedCodigoParam(params.get('codigo'));
      } catch {
        setTrackedCodigoParam(null);
      }

      if (
        (target === 'comando' || target === 'metricas' || target === 'formulario') &&
        !isUnlocked
      ) {
        setPendingProtectedTab(target);
      } else {
        setActiveTab(target);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isUnlocked]);

  const getPathForTab = (tab: ActiveTab): string => {
    if (tab === 'solicitar') return '/solicitar';
    if (tab === 'comando') return '/comando';
    if (tab === 'metricas') return '/metricas';
    if (tab === 'formulario') return '/configurar-formulario';
    return '/consultar';
  };

  const navigateToTab = (tab: ActiveTab) => {
    if (
      (tab === 'comando' || tab === 'metricas' || tab === 'formulario') &&
      !isUnlocked
    ) {
      setPendingProtectedTab(tab);
      return;
    }
    setActiveTab(tab);
    const nextPath = getPathForTab(tab);
    try {
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath);
      }
    } catch {
      // ignore
    }
  };

  const handleViewTicketStatus = (codigoFormateado: string) => {
    setTrackedCodigoParam(codigoFormateado);
    setActiveTab('consultar');
    try {
      const nextUrl = `/consultar?codigo=${encodeURIComponent(codigoFormateado)}`;
      window.history.pushState({}, '', nextUrl);
    } catch {
      // ignore
    }
  };

  const handleUnlockSuccess = () => {
    try {
      sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true');
    } catch {
      // ignore
    }
    setIsUnlocked(true);
    const destination = pendingProtectedTab || 'comando';
    setPendingProtectedTab(null);
    setActiveTab(destination);
    try {
      window.history.pushState({}, '', getPathForTab(destination));
    } catch {
      // ignore
    }
  };

  const handleLock = () => {
    try {
      sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    } catch {
      // ignore
    }
    setIsUnlocked(false);
    setActiveTab('consultar');
    try {
      window.history.pushState({}, '', '/consultar');
    } catch {
      // ignore
    }
  };

  const handleCreateTicket = async (input: NuevoTicketInput): Promise<TicketTI> => {
    const { ticket, mode } = await createTicketTI(input);
    setConnectionMode(mode);
    await loadTickets();
    return ticket;
  };

  const handleUpdateTicket = async (
    id: string,
    changes: Partial<
      Pick<
        TicketTI,
        | 'estado'
        | 'asignado_a'
        | 'nota_publica'
        | 'notas_tecnicas'
        | 'impacto'
        | 'urgencia'
        | 'categoria'
        | 'titulo'
        | 'descripcion'
        | 'departamento_tienda'
      >
    >
  ) => {
    const { mode } = await updateTicketTI(id, changes);
    setConnectionMode(mode);
    await loadTickets();
  };

  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const activeTicketsCount = safeTickets.filter((t) => t?.estado !== 'Resuelto').length;
  const criticalCount = safeTickets.filter(
    (t) => t?.estado !== 'Resuelto' && (Number(t?.score_prioridad) || 0) >= 6
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      <HeaderInstitucional
        activeTab={activeTab}
        onSelectTab={navigateToTab}
        isUnlocked={isUnlocked}
        onLock={handleLock}
        connectionMode={connectionMode}
        activeTicketsCount={activeTicketsCount}
        criticalCount={criticalCount}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
        <ErrorBoundary
          onReset={() => {
            setTrackedCodigoParam(null);
            navigateToTab('consultar');
          }}
        >
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-700" />
                <span>Cargando Hub Operativo TI/BI...</span>
              </div>
            </div>
          ) : activeTab === 'consultar' ? (
            <ConsultarTicketView
              initialCodigoParam={trackedCodigoParam}
              onNavigateToSolicitar={() => navigateToTab('solicitar')}
            />
          ) : activeTab === 'solicitar' ? (
            <PortalSolicitudView
              onCreateTicket={handleCreateTicket}
              formSchema={formSchema}
              onViewTicketStatus={handleViewTicketStatus}
            />
          ) : activeTab === 'comando' ? (
            <CentroComandoView
              tickets={safeTickets}
              formSchema={formSchema}
              onCreateTicket={handleCreateTicket}
              onUpdateTicket={handleUpdateTicket}
            />
          ) : activeTab === 'formulario' && isUnlocked ? (
            <ConfigurarFormularioView
              formSchema={formSchema}
              onSchemaUpdated={(next) => setFormSchema(next)}
            />
          ) : (
            <DashboardKPIsView
              tickets={safeTickets}
              formSchema={formSchema}
              onUpdateTicket={handleUpdateTicket}
            />
          )}
        </ErrorBoundary>
      </main>

      <footer className="hidden border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500 lg:block">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
          <span className="font-medium text-slate-600">
            Grupo Comercializadora Ferco • Gerencia de Inteligencia de Negocios y
            Tecnología
          </span>
          <span className="text-slate-500">
            Sistema ITSM • Matriz Impacto × Urgencia • Portal Público de Seguimiento
          </span>
        </div>
      </footer>

      <PinAuthDialog
        isOpen={pendingProtectedTab !== null}
        targetName={
          pendingProtectedTab === 'metricas'
            ? 'Métricas / KPIs Ejecutivos'
            : pendingProtectedTab === 'formulario'
            ? 'Configurar Formulario y Catálogos'
            : 'Centro de Comando (Kanban / Foco)'
        }
        onSuccess={handleUnlockSuccess}
        onCancel={() => setPendingProtectedTab(null)}
      />
    </div>
  );
};

export default App;
