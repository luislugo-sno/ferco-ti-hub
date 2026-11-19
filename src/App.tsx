import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActiveTab,
  HeaderInstitucional,
} from './components/HeaderInstitucional';
import { PortalSolicitudView } from './components/PortalSolicitudView';
import { CentroComandoView } from './components/CentroComandoView';
import { DashboardKPIsView } from './components/DashboardKPIsView';
import { ConfigurarFormularioView } from './components/ConfigurarFormularioView';
import { PinAuthDialog } from './components/PinAuthDialog';
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
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/comando') || path.includes('/kanban')) return 'comando';
  if (path.includes('/metricas') || path.includes('/kpis')) return 'metricas';
  if (path.includes('/formulario') || path.includes('/configurar')) return 'formulario';
  return 'solicitar';
}

export const App: React.FC = () => {
  const [tickets, setTickets] = useState<TicketTI[]>([]);
  const [formSchema, setFormSchema] = useState<FormSchemaConfig>(() =>
    getCachedFormSchema()
  );
  const [connectionMode, setConnectionMode] = useState<'supabase' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(true);

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const requested = getInitialTabFromUrl();
    const unlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
    if (
      (requested === 'comando' ||
        requested === 'metricas' ||
        requested === 'formulario') &&
      !unlocked
    ) {
      return 'solicitar';
    }
    return requested;
  });

  const activeTabRef = useRef<ActiveTab>(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const [pendingProtectedTab, setPendingProtectedTab] = useState<ActiveTab | null>(() => {
    const requested = getInitialTabFromUrl();
    const unlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
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
    const res = await fetchTicketsTI();
    setTickets(res.data);
    setConnectionMode(res.mode);
    setIsLoading(false);
  }, []);

  const loadAppConfig = useCallback(async () => {
    const [schemaRes] = await Promise.all([
      fetchFormSchemaFromSupabase(),
      fetchAdminPinFromSupabase(),
    ]);
    setFormSchema(schemaRes.schema);
  }, []);

  useEffect(() => {
    loadTickets();
    loadAppConfig();

    const unsubscribe = subscribeToTicketsTI(
      () => {
        loadTickets();
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
        loadAppConfig();
      }
    );
    return () => unsubscribe();
  }, [loadTickets, loadAppConfig]);

  // Sincronización con el historial del navegador
  useEffect(() => {
    const onPopState = () => {
      const target = getInitialTabFromUrl();
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
    if (tab === 'comando') return '/comando';
    if (tab === 'metricas') return '/metricas';
    if (tab === 'formulario') return '/configurar-formulario';
    return '/solicitar';
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
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  const handleUnlockSuccess = () => {
    sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true');
    setIsUnlocked(true);
    const destination = pendingProtectedTab || 'comando';
    setPendingProtectedTab(null);
    setActiveTab(destination);
    window.history.pushState({}, '', getPathForTab(destination));
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    setIsUnlocked(false);
    setActiveTab('solicitar');
    window.history.pushState({}, '', '/solicitar');
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

  const activeTicketsCount = tickets.filter((t) => t.estado !== 'Resuelto').length;
  const criticalCount = tickets.filter(
    (t) => t.estado !== 'Resuelto' && t.score_prioridad >= 6
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
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-700" />
              <span>Cargando Hub Operativo TI/BI...</span>
            </div>
          </div>
        ) : activeTab === 'solicitar' ? (
          <PortalSolicitudView
            onCreateTicket={handleCreateTicket}
            formSchema={formSchema}
          />
        ) : activeTab === 'comando' ? (
          <CentroComandoView
            tickets={tickets}
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
            tickets={tickets}
            formSchema={formSchema}
            onUpdateTicket={handleUpdateTicket}
          />
        )}
      </main>

      <footer className="hidden border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500 lg:block">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
          <span className="font-medium text-slate-600">
            Grupo Comercializadora Ferco • Gerencia de Inteligencia de Negocios y
            Tecnología
          </span>
          <span className="text-slate-500">
            Sistema ITSM • Matriz Impacto × Urgencia • Sincronización Global Supabase
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
