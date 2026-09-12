import React, { useState, useEffect } from 'react';
import { User, Ticket, TicketStatus, CreateTicketInput, TraceEventType, Category } from './types';
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
import { AdminReportsMapView } from './components/admin/AdminReportsMapView';
import { AdminCitizensDirectoryView } from './components/admin/AdminCitizensDirectoryView';
import { ConfigView } from './components/config/ConfigView';
import { CustomizationSettingsView } from './components/config/CustomizationSettingsView';
import { AdminMaintenanceView } from './components/admin/AdminMaintenanceView';
import { AdminVersionControlView } from './components/admin/AdminVersionControlView';
import { AdminBannerConfigView } from './components/admin/AdminBannerConfigView';
import { NewTicketModal } from './components/tickets/NewTicketModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { BackendSwitcherModal } from './components/layout/BackendSwitcherModal';
import { CATEGORIAS_SISTEMA } from './config/categories';
import { analytics } from './services/analytics';
import { LayoutList, Map, PhoneCall, Search, Menu as MenuIcon, LayoutDashboard, Plus } from 'lucide-react';

type AppScreen = 'citizen-index' | 'login' | 'staff-portal';

const MainAppContent: React.FC = () => {
  const { isDarkMode, systemTheme } = useTheme();

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
      departamento: 'Despacho de Administración Superior',
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
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>('TK-2025-001');
  const [categories, setCategories] = useState<Category[]>(CATEGORIAS_SISTEMA);

  // Tickets State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // UI Modals & Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initial Data Load & Event Listener
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
    analytics.trackPageView(activeScreen);

    // Subscribe to internal service event bus for instant updates
    const unsubscribe = ticketService.subscribe(() => {
      ticketService.getAllTickets().then((data) => {
        setTickets(data);
      });
    });

    // Also listen to window event 'ticket_db_updated'
    const handleDbUpdated = () => {
      ticketService.getAllTickets().then((data) => {
        setTickets(data);
      });
    };
    window.addEventListener('ticket_db_updated', handleDbUpdated);

    return () => {
      unsubscribe();
      window.removeEventListener('ticket_db_updated', handleDbUpdated);
    };
  }, [activeScreen]);

  // Periodic 30-Second Complete System Auto-Polling (Database & WhatsApp Ingestion)
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setIsSyncing(true);
        const freshData = await ticketService.getAllTickets();
        if (Array.isArray(freshData) && freshData.length > 0) {
          setTickets(freshData);
        }
      } catch (err) {
        console.warn('[AutoSync 30s] Error polling from DB:', err);
      } finally {
        setTimeout(() => setIsSyncing(false), 800);
      }
    };

    // Run poll every 30000 milliseconds (30 seconds) as explicitly requested
    const timer = setInterval(fetchLatest, 30000);

    return () => clearInterval(timer);
  }, []);

  // Manual immediate synchronization trigger
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const fresh = await ticketService.syncFromDatabase();
      setTickets(fresh);
    } catch (err) {
      console.error('Error in manual sync:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Handle Login Success
  const handleLoginSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem('ticketing_user', JSON.stringify(user));
    localStorage.setItem('ticketing_token', userToken);
    setActiveScreen('staff-portal');
    analytics.trackAuthEvent('login_success', user.rol);
  };

  // Handle Logout
  const handleLogout = () => {
    analytics.trackAuthEvent('logout', currentUser?.rol);
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
    analytics.trackPageView(`staff-portal/${view}`);
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
    setQuickSearchQuery(query);
    setActiveTraceTicketId(query);
    setCurrentView('busqueda-rapida');
  };

  // Ticket Operations
  const handleCreateTicket = async (ticketInput: CreateTicketInput): Promise<boolean> => {
    try {
      const res = await ticketService.createTicket(ticketInput);
      if (res.success && res.data) {
        setTickets((prev) => [res.data!, ...prev]);
        analytics.trackTicketCreated(res.data.id, res.data.categoriaId, res.data.prioridad);
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
        currentUser?.nombre || 'Personal Junta Comunal',
        currentUser?.rol || 'agente'
      );
      if (updated) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
        analytics.trackStatusUpdated(ticketId, newStatus, currentUser?.nombre || 'Junta Comunal');
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
      canalInteraccion?: any;
      minutosConsumidos?: number;
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

  const handleCategoriesUpdated = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  // 1. CITIZEN PUBLIC VIEW (INDEX VIEW)
  if (activeScreen === 'citizen-index') {
    return (
      <>
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
        <NewTicketModal
          isOpen={isNewTicketModalOpen}
          onClose={() => setIsNewTicketModalOpen(false)}
          onSubmitTicket={handleCreateTicket}
        />
      </>
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
    <div
      className={`min-h-screen flex transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Left Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        selectedCategoryDashboard={selectedCategoryDashboard}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        openNewTicketModal={() => setIsNewTicketModalOpen(true)}
        onOpenCitizenPortal={() => setActiveScreen('citizen-index')}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
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
          onOpenProfileModal={() => setIsUserProfileModalOpen(true)}
          onOpenBackendModal={() => setIsBackendModalOpen(true)}
          onForceSync={handleForceSync}
          isSyncing={isSyncing}
          unreadNotificationsCount={tickets.filter((t) => t.estado === 'abierto').length}
          tickets={tickets}
          onSelectTicket={handleNavigateToTrace}
        />

        {/* Dynamic Page Views */}
        <main
          style={{
            backgroundColor: isDarkMode ? undefined : systemTheme.backendBgColor,
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin transition-colors"
        >
          <div
            style={{
              maxWidth: systemTheme.mainMaxWidth === 'full' ? '100%' : systemTheme.mainMaxWidth,
            }}
            className="w-full mx-auto"
          >
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
                      responsable: currentUser?.nombre || 'Personal Junta Comunal',
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
                  currentUser={currentUser}
                  onAddTraceEvent={handleAddTraceEvent}
                />
              )}

              {/* 3. Búsqueda y Visualización Pública (Privacy Protected) */}
              {currentView === 'busqueda-rapida' && (
                <QuickSearchView
                  tickets={tickets}
                  initialQuery={quickSearchQuery}
                  onNavigateToTrace={handleNavigateToTrace}
                />
              )}

              {/* 4. Reportes */}
              {currentView === 'reportes' && (
                <ReportsView tickets={tickets} />
              )}

              {/* 5. Mapa Cartográfico de Incidencias (Solo Administradores) */}
              {currentView === 'mapa-reportes' && (
                <AdminReportsMapView
                  tickets={tickets}
                  currentUser={currentUser}
                  onUpdateTicketStatus={handleUpdateTicketStatus}
                  onAddTraceNote={(tId, note, eventType, newStatus) => {
                    handleAddTraceEvent(tId, {
                      tipoEvento: eventType || 'comentario',
                      responsable: currentUser?.nombre || 'Administrador',
                      rolResponsable: currentUser?.rol || 'administrador',
                      nota: note,
                      estadoNuevo: newStatus,
                    });
                  }}
                  onNavigateToTrace={handleNavigateToTrace}
                  onNavigateToDirectory={() => setCurrentView('directorio-ciudadanos')}
                />
              )}

              {/* 6. Directorio Ciudadano & WhatsApp Directo (Solo Administradores) */}
              {currentView === 'directorio-ciudadanos' && (
                <AdminCitizensDirectoryView
                  tickets={tickets}
                  currentUser={currentUser}
                  onNavigateToTrace={handleNavigateToTrace}
                  onAddTraceNote={(tId, note, eventType, newStatus) => {
                    handleAddTraceEvent(tId, {
                      tipoEvento: eventType || 'comentario',
                      responsable: currentUser?.nombre || 'Administrador',
                      rolResponsable: currentUser?.rol || 'administrador',
                      nota: note,
                      estadoNuevo: newStatus,
                    });
                  }}
                />
              )}

              {/* 7. Mantenimiento de Categorías & Roles (Superior Admin Only) */}
              {currentView === 'mantenimiento-admin' && (
                <AdminMaintenanceView
                  currentUser={currentUser}
                  categories={categories}
                  onCategoriesUpdated={handleCategoriesUpdated}
                />
              )}

              {/* 8. Control de Versiones del Sitio (Super Admin Only) */}
              {currentView === 'control-versiones' && (
                <AdminVersionControlView currentUser={currentUser} />
              )}

              {/* 6. Personalización & Diseño (Front-end & Back-end, Colores, Dimensiones y Tipografía) */}
              {currentView === 'personalizacion-diseno' && (
                <CustomizationSettingsView />
              )}

              {/* 7. Configuración & Base de Datos */}
              {currentView === 'configuracion' && (
                <ConfigView onResetMockData={handleResetMockData} />
              )}

              {/* 7.1 Configuración de Banner Institucional (Super Admin Only) */}
              {currentView === 'configuracion-banner' && (
                <AdminBannerConfigView currentUser={currentUser} />
              )}

              {/* 8. Dashboard (ALWAYS LAST OPTION in Sidebar hierarchy) */}
              {currentView === 'dashboard' && (
                <DashboardView
                  tickets={tickets}
                  selectedCategoryFilter={selectedCategoryDashboard}
                  onSelectCategoryFilter={(catId) => setSelectedCategoryDashboard(catId)}
                />
              )}
            </>
          )}
          </div>
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

      {/* Dual Backend Switcher Modal */}
      <BackendSwitcherModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        onTicketsUpdated={() => {
          handleForceSync();
        }}
      />

      {/* New Ticket Modal */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        onSubmitTicket={handleCreateTicket}
      />

      {/* User Profile & Photo Update Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isUserProfileModalOpen}
          onClose={() => setIsUserProfileModalOpen(false)}
          currentUser={currentUser}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('ticketing_user', JSON.stringify(updatedUser));
          }}
        />
      )}
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
