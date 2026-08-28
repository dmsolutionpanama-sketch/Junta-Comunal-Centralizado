import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Bell,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Database,
  ExternalLink,
  ChevronRight,
  Send,
} from 'lucide-react';
import { Ticket } from '../../types';

interface FloatingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recentTickets: Ticket[];
  onSelectTicket: (ticketId: string) => void;
  onOpenNewTicket: () => void;
  onNavigateToTrace: (ticketId: string) => void;
}

export const FloatingDrawer: React.FC<FloatingDrawerProps> = ({
  isOpen,
  onClose,
  recentTickets,
  onSelectTicket,
  onOpenNewTicket,
  onNavigateToTrace,
}) => {
  const [activeTab, setActiveTab] = useState<'acciones' | 'notificaciones' | 'actividad'>('acciones');
  const [quickNote, setQuickNote] = useState('');
  const [noteSent, setNoteSent] = useState(false);

  const handleSendQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    setNoteSent(true);
    setTimeout(() => {
      setNoteSent(false);
      setQuickNote('');
    }, 2500);
  };

  return (
    <>
      {/* Floating Action Button (Always accessible on bottom right when drawer is closed) */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          id="fab-quick-actions"
          onClick={onClose} // toggles parent state
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-white hover:bg-slate-50 text-blue-600 shadow-2xl border border-blue-50 flex items-center justify-center cursor-pointer focus:outline-hidden transition-transform"
          title="Panel Rápido de Acciones"
        >
          <Zap className="w-6 h-6 text-blue-600" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-xs">
            3
          </span>
        </motion.button>
      )}

      {/* Floating Slide-over Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                id="floating-actions-drawer"
                className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Panel Rápido de Acciones</h3>
                      <p className="text-[11px] text-slate-500">Acceso directo y monitoreo ágil</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="btn-close-floating-drawer"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="flex border-b border-slate-200 px-5 pt-3 gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    id="tab-drawer-acciones"
                    onClick={() => setActiveTab('acciones')}
                    className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'acciones'
                        ? 'border-[#0066FF] text-[#0066FF]'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Acciones Rápidas
                  </button>
                  <button
                    type="button"
                    id="tab-drawer-notificaciones"
                    onClick={() => setActiveTab('notificaciones')}
                    className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'notificaciones'
                        ? 'border-[#0066FF] text-[#0066FF]'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Alertas (3)
                  </button>
                  <button
                    type="button"
                    id="tab-drawer-actividad"
                    onClick={() => setActiveTab('actividad')}
                    className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'actividad'
                        ? 'border-[#0066FF] text-[#0066FF]'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Actividad Reciente
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
                  {activeTab === 'acciones' && (
                    <div className="space-y-4">
                      {/* Primary create button */}
                      <button
                        type="button"
                        id="drawer-create-ticket-btn"
                        onClick={() => {
                          onClose();
                          onOpenNewTicket();
                        }}
                        className="w-full py-3 px-4 bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Registrar Nuevo Ticket / Incidencia
                      </button>

                      {/* Quick Broadcast Note to Field Teams */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-[#0066FF]" />
                          Nota rápida a cuadrillas de turno
                        </label>
                        <p className="text-[11px] text-slate-500 mb-2.5">
                          Envía un aviso de coordinación a los supervisores de cuadrilla en campo.
                        </p>
                        {noteSent ? (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Mensaje transmitido a las cuadrillas de guardia.</span>
                          </div>
                        ) : (
                          <form onSubmit={handleSendQuickNote} className="space-y-2">
                            <textarea
                              rows={2}
                              value={quickNote}
                              onChange={(e) => setQuickNote(e.target.value)}
                              placeholder="Ej: Priorizar casos de corte de agua en Villa Zaita..."
                              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0066FF] focus:ring-1 focus:ring-blue-500/20"
                            />
                            <button
                              type="submit"
                              className="w-full py-1.5 px-3 bg-white hover:bg-blue-50 hover:text-[#0066FF] border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              Despachar Mensaje
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Recent Tickets Quick Links */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-2.5 uppercase tracking-wider">
                          Tickets Recientes en Seguimiento
                        </h4>
                        <div className="space-y-2">
                          {recentTickets.slice(0, 4).map((ticket) => (
                            <div
                              key={ticket.id}
                              className="p-3 bg-white hover:bg-blue-50/50 border border-slate-200/80 rounded-xl transition-all flex items-center justify-between group"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-mono font-bold text-[#0066FF]">
                                    {ticket.numeroRegistro}
                                  </span>
                                  <span className="text-[10px] text-slate-400">• {ticket.sectorNombre}</span>
                                </div>
                                <p className="text-xs font-medium text-slate-800 truncate mt-0.5">
                                  {ticket.asunto}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onSelectTicket(ticket.id);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-[#0066FF] hover:text-white text-slate-700 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                                >
                                  Revisar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onNavigateToTrace(ticket.id);
                                  }}
                                  title="Ver Trazabilidad"
                                  className="p-1 text-slate-400 hover:text-[#0066FF] rounded-lg transition-colors cursor-pointer"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notificaciones' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-red-900">Alerta de Prioridad Urgente</p>
                            <p className="text-[11px] text-red-700 mt-0.5">
                              TK-2025-001: Transformador con chispas en Altos de Las Cumbres requiere atención.
                            </p>
                            <span className="text-[10px] text-red-500 font-medium mt-1 block">
                              Hace 15 minutos
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-2.5">
                          <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-900">SLA Próximo a Vencer</p>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                              TK-2025-002: Daños Agua en Villa Zaita cumple 18 horas sin cerrar.
                            </p>
                            <span className="text-[10px] text-amber-500 font-medium mt-1 block">
                              Hace 1 hora
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-emerald-900">Caso Resuelto Exitosamente</p>
                            <p className="text-[11px] text-emerald-700 mt-0.5">
                              TK-2025-003: Poda de ramas completada en Colinas del Rocío.
                            </p>
                            <span className="text-[10px] text-emerald-500 font-medium mt-1 block">
                              Hace 3 horas
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'actividad' && (
                    <div className="space-y-4">
                      <div className="border-l-2 border-blue-200 ml-2 pl-4 space-y-4">
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#0066FF] ring-4 ring-white" />
                          <p className="text-xs font-bold text-slate-900">Cambio de Estado a Resuelto</p>
                          <p className="text-[11px] text-slate-500">Ticket TK-2025-005 por Arq. Fernando Vega</p>
                          <span className="text-[10px] text-slate-400">Hoy 15:00</span>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                          <p className="text-xs font-bold text-slate-900">Nuevo Ticket Registrado</p>
                          <p className="text-[11px] text-slate-500">TK-2025-018: Solicitud de alumbrado deportivo</p>
                          <span className="text-[10px] text-slate-400">Hoy 11:30</span>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                          <p className="text-xs font-bold text-slate-900">Visita Comunitaria Registrada</p>
                          <p className="text-[11px] text-slate-500">TK-2025-004 por Lic. Ana Patricia Ruiz</p>
                          <span className="text-[10px] text-slate-400">Ayer 14:15</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Panel expandible listo para módulos adicionales
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
