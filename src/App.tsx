import React, { useCallback, useEffect, useState } from 'react';
import {
  ActiveTab,
  HeaderInstitucional,
} from './components/HeaderInstitucional';
import { PortalSolicitudView } from './components/PortalSolicitudView';
import { CentroComandoView } from './components/CentroComandoView';
import { DashboardKPIsView } from './components/DashboardKPIsView';
import { PinAuthDialog } from './components/PinAuthDialog';
import {
  createTicketTI,
  fetchTicketsTI,
  subscribeToTicketsTI,
  updateTicketTI,
} from './lib/supabase';
import { NuevoTicketInput, TicketTI } from './types/tickets';

const SESSION_UNLOCK_KEY = 'ferco_ti_bi_unlocked_session';

function getInitialTabFromUrl(): ActiveTab {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/comando') || path.includes('/kanban')) return 'comando';
  if (path.includes('/metricas') || path.includes('/kpis')) return 'metricas';
  return 'solicitar';
}

export const App: React.FC = () => {
  const [tickets, setTickets] = useState<TicketTI[]>([]);
  const [connectionMode, setConnectionMode] = useState<'supabase' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(true);

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const requested = getInitialTabFromUrl();
    const unlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
    if ((requested === 'comando' || requested === 'metricas') && !unlocked) {
      return 'solicitar';
    }
    return requested;
  });

  const [pendingProtectedTab, setPendingProtectedTab] = useState<ActiveTab | null>(() => {
    const requested = getInitialTabFromUrl();
    const unlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
    if ((requested === 'comando' || requested === 'metricas') && !unlocked) {
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

  useEffect(() => {
    loadTickets();
    const unsubscribe = subscribeToTicketsTI(() => {
      loadTickets();
    });
    return () => unsubscribe();
  }, [loadTickets]);

  // Sincronización con el historial del navegador (/solicitar, /comando, /metricas)
  useEffect(() => {
    const onPopState = () => {
      const target = getInitialTabFromUrl();
      if ((target === 'comando' || target === 'metricas') && !isUnlocked) {
        setPendingProtectedTab(target);
      } else {
        setActiveTab(target);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isUnlocked]);

  const navigateToTab = (tab: ActiveTab) => {
    if ((tab === 'comando' || tab === 'metricas') && !isUnlocked) {
      setPendingProtectedTab(tab);
      return;
    }
    setActiveTab(tab);
    const nextPath =
      tab === 'solicitar'
        ? '/solicitar'
        : tab === 'comando'
        ? '/comando'
        : '/metricas';
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
    const nextPath = destination === 'comando' ? '/comando' : '/metricas';
    window.history.pushState({}, '', nextPath);
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
    <div className="min-h-screen flex flex-col bg-gcf-950 text-slate-100">
      <HeaderInstitucional
        activeTab={activeTab}
        onSelectTab={navigateToTab}
        isUnlocked={isUnlocked}
        onLock={handleLock}
        connectionMode={connectionMode}
        activeTicketsCount={activeTicketsCount}
        criticalCount={criticalCount}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-gcf-200">
              <span className="h-3 w-3 animate-ping rounded-full bg-gcf-400" />
              <span>Cargando Hub Operativo TI/BI...</span>
            </div>
          </div>
        ) : activeTab === 'solicitar' ? (
          <PortalSolicitudView onCreateTicket={handleCreateTicket} />
        ) : activeTab === 'comando' ? (
          <CentroComandoView
            tickets={tickets}
            onCreateTicket={handleCreateTicket}
            onUpdateTicket={handleUpdateTicket}
          />
        ) : (
          <DashboardKPIsView
            tickets={tickets}
            onUpdateTicket={handleUpdateTicket}
          />
        )}
      </main>

      <footer className="border-t border-gcf-500/20 bg-gcf-950/95 py-3.5 text-center text-xs text-slate-400">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
          <span>
            Grupo Comercializadora Ferco • Gerencia de Inteligencia de Negocios y
            Tecnología
          </span>
          <span className="text-gcf-300/90">
            Hub Operativo TI/BI (ITSM) • Matriz Impacto × Urgencia • WIP Limit Activo
          </span>
        </div>
      </footer>

      <PinAuthDialog
        isOpen={pendingProtectedTab !== null}
        targetName={
          pendingProtectedTab === 'metricas'
            ? 'Métricas / KPIs Ejecutivos'
            : 'Centro de Comando (Kanban / Foco)'
        }
        onSuccess={handleUnlockSuccess}
        onCancel={() => setPendingProtectedTab(null)}
      />
    </div>
  );
};

export default App;
