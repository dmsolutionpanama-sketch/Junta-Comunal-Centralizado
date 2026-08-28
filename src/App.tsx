import React, { useState, useEffect } from 'react';
import { User, Ticket, TicketStatus, CreateTicketInput, TraceEventType } from './types';
import { ticketService } from './services/ticketService';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CitizenIndexView } from './components/public/CitizenIndexView';
import { LoginView } from './components/auth/LoginView';
import { Sidebar, MainNavView } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { FloatingDrawer } from './components/layout/FloatingDrawer';
import { GeneralView } from './components/tickets/GeneralView';
import { TraceabilityView } from './components/traceability/TraceabilityView';
import { QuickSearchView } from './components/search/QuickSearchView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ReportsView } from './components/reports/ReportsView';
import { ConfigView } from './components/config/ConfigView';
import { NewTicketModal } from './components/tickets/NewTicketModal';

type AppScreen = 'citizen-index' | 'login' | 'staff-portal';

const MainAppContent: React.FC = () => {
  const { isDarkMode } = useTheme();

  // Screen Mode: Starts at 'citizen-index' (Vista del Ciudadano) as requested
  const [activeScreen, setActiveScreen] = useState<AppScreen>('citizen-index');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ticketing_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default initial demo user for staff
    return {
      id: 'usr-admin-demo',
      nombre: 'Ing. Carlos Mendoza',
      email: 'carlos.mendoza@alcaldia.gob.pa',
      rol: 'administrador',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('ticketing_token') || 'demo-jwt-active-session';
  });

  // Navigation State inside Staff Portal
  const [currentView, setCurrentView] = useState<MainNavView>('vista-general');
  const [selectedCategoryDashboard, setSelectedCategoryDashboard] = useState<string | null>(null);
  const [activeTraceTicketId, setActiveTraceTicketId] = useState<string | null>(null);

  // Tickets State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UI Modals & Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // Load Tickets on Mount
  useEffect(() => {
    const loadInitialTickets = async () => {
      setIsLoading(true);
      try {
        const data = await ticketService.getAllTickets();
        setTickets(data);
      } catch (err) {
        console.error('Error fetching tickets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialTickets();
  }, []);

  // Handle Login Success
  const handleLoginSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem('ticketing_user', JSON.stringify(user));
    localStorage.setItem('ticketing_token', userToken);
    setActiveScreen('staff-portal');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    ticketService.logout();
    localStorage.removeItem('ticketing_user');
    localStorage.removeItem('ticketing_token');
    setActiveScreen('citizen-index');
  };

  // Navigation Handler inside Staff Portal
  const handleNavigate = (view: MainNavView, categoryId?: string | null) => {
    setCurrentView(view);
    if (view === 'dashboard') {
      setSelectedCategoryDashboard(categoryId || null);
    } else {
      setSelectedCategoryDashboard(null);
    }
  };

  // Quick Navigation to Traceability
  const handleNavigateToTrace = (ticketId: string) => {
    setActiveTraceTicketId(ticketId);
    setCurrentView('trazabilidad');
  };

  // Quick Search Jump
  const handleQuickSearch = (query: string) => {
    setActiveTraceTicketId(query);
    setCurrentView('busqueda-rapida');
  };

  // Ticket Operations
  const handleCreateTicket = async (ticketInput: CreateTicketInput): Promise<boolean> => {
    try {
      const res = await ticketService.createTicket(ticketInput);
      if (res.success && res.data) {
        setTickets((prev) => [res.data!, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating ticket:', err);
      return false;
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const updated = await ticketService.updateTicketStatus(
        ticketId,
        newStatus,
        currentUser?.nombre || 'Administrador',
        currentUser?.rol || 'Supervisor'
      );
      if (updated) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddTraceEvent = async (
    ticketId: string,
    event: {
      tipoEvento: TraceEventType;
      responsable: string;
      rolResponsable?: string;
      nota: string;
      estadoNuevo?: TicketStatus;
    }
  ) => {
    try {
      const updated = await ticketService.addTraceEvent(ticketId, event);
      if (updated) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      }
    } catch (err) {
      console.error('Error adding trace event:', err);
    }
  };

  const handleResetMockData = () => {
    const reset = ticketService.resetMockData();
    setTickets([...reset]);
  };

  // 1. CITIZEN PUBLIC VIEW (INDEX VIEW)
  if (activeScreen === 'citizen-index') {
    return (
      <CitizenIndexView
        tickets={tickets}
        onGoToLogin={() => {
          if (currentUser) {
            setActiveScreen('staff-portal');
          } else {
            setActiveScreen('login');
          }
        }}
        onOpenNewTicketModal={() => setIsNewTicketModalOpen(true)}
        onCreateTicketDirect={handleCreateTicket}
      />
    );
  }

  // 2. LOGIN SCREEN (JUNTA COMUNAL STAFF AUTH)
  if (activeScreen === 'login' || !currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onBackToPortal={() => setActiveScreen('citizen-index')}
      />
    );
  }

  // 3. STAFF / ADMINISTRATIVE PORTAL (JUNTA COMUNAL)
  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Left Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        selectedCategoryDashboard={selectedCategoryDashboard}
        onNavigate={handleNavigate}
        openNewTicketModal={() => setIsNewTicketModalOpen(true)}
        onOpenCitizenPortal={() => setActiveScreen('citizen-index')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onQuickSearch={handleQuickSearch}
          onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
          onToggleDrawer={() => setIsDrawerOpen(true)}
          onOpenCitizenPortal={() => setActiveScreen('citizen-index')}
          unreadNotificationsCount={tickets.filter((t) => t.estado === 'abierto').length}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Cargando base de datos...</p>
            </div>
          ) : (
            <>
              {/* 1. Vista General (Default Primary View) */}
              {currentView === 'vista-general' && (
                <GeneralView
                  tickets={tickets}
                  onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
                  onUpdateTicketStatus={handleUpdateTicketStatus}
                  onAddTraceNote={(tId, note, eventType, newStatus) => {
                    handleAddTraceEvent(tId, {
                      tipoEvento: eventType || 'comentario',
                      responsable: currentUser?.nombre || 'Administrador',
                      rolResponsable: currentUser?.rol || 'Supervisor',
                      nota: note,
                      estadoNuevo: newStatus,
                    });
                  }}
                  onNavigateToTrace={handleNavigateToTrace}
                />
              )}

              {/* 2. Trazabilidad del Ticket */}
              {currentView === 'trazabilidad' && (
                <TraceabilityView
                  tickets={tickets}
                  initialTicketId={activeTraceTicketId}
                  onAddTraceEvent={handleAddTraceEvent}
                />
              )}

              {/* 3. Búsqueda y Visualización Pública (Privacy Protected) */}
              {currentView === 'busqueda-rapida' && (
                <QuickSearchView tickets={tickets} />
              )}

              {/* 4. Reportes */}
              {currentView === 'reportes' && (
                <ReportsView tickets={tickets} />
              )}

              {/* 5. Configuración & Base de Datos */}
              {currentView === 'configuracion' && (
                <ConfigView onResetMockData={handleResetMockData} />
              )}

              {/* 6. Dashboard (ALWAYS LAST OPTION in Sidebar hierarchy) */}
              {currentView === 'dashboard' && (
                <DashboardView
                  tickets={tickets}
                  selectedCategoryFilter={selectedCategoryDashboard}
                  onSelectCategoryFilter={(catId) => setSelectedCategoryDashboard(catId)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Right Floating Drawer Panel */}
      <FloatingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        recentTickets={tickets}
        onSelectTicket={(tId) => {
          handleNavigateToTrace(tId);
        }}
        onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
        onNavigateToTrace={handleNavigateToTrace}
      />

      {/* New Ticket Modal */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        onSubmitTicket={handleCreateTicket}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
};

export default App;

