import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, HelpCircle, X, CheckCircle2, UserCheck, Shield, Wrench, User as UserIcon, ArrowLeft, ClipboardCheck, Crown } from 'lucide-react';
import { User, UserRole } from '../../types';
import { ticketService } from '../../services/ticketService';

interface LoginViewProps {
  onLoginSuccess: (user: User, token: string) => void;
  onBackToPortal?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onBackToPortal }) => {
  const [email, setEmail] = useState('carlos.mendoza@alcaldia.gob.pa');
  const [password, setPassword] = useState('Admin2025*');
  const [selectedRole, setSelectedRole] = useState<UserRole>('administrador');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors([]);

    setIsLoading(true);

    try {
      const res = await ticketService.login(email.trim(), password, selectedRole);

      if (res.success && res.user && res.token) {
        onLoginSuccess(res.user, res.token);
      } else {
        setErrorMessage(res.message || 'Error en las credenciales ingresadas.');
        if (res.errors && Array.isArray(res.errors)) {
          setFieldErrors(res.errors);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con el servicio de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setRecoverySuccess(true);
    setTimeout(() => {
      setRecoverySuccess(false);
      setShowForgotModal(false);
      setRecoveryEmail('');
    }, 3000);
  };

  const getFieldError = (fieldName: string) => {
    return fieldErrors.find((err) => err.field === fieldName)?.message;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Subtle top branding bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-blue-700" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 sm:p-10 relative z-10"
      >
        {onBackToPortal && (
          <button
            type="button"
            onClick={onBackToPortal}
            id="btn-login-back-portal"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Portal Ciudadano / Dashboard</span>
          </button>
        )}

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 mb-3 shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Junta Comunal
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-normal">
            Acceso Administrativo y Cuadrillas Operativas
          </p>
        </div>

        {/* Role Selection Tabs for fast testing */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">
            Perfil de Acceso (RBAC)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {/* 1. Usuario Regular */}
            <button
              type="button"
              id="role-btn-regular"
              onClick={() => {
                setSelectedRole('agente');
                setEmail('javier.castillo@alcaldia.gob.pa');
                setPassword('Agente2025*');
              }}
              className={`flex flex-col items-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                selectedRole === 'agente' || selectedRole === 'usuario'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate">1. Regular</span>
            </button>

            {/* 2. Supervisor */}
            <button
              type="button"
              id="role-btn-supervisor"
              onClick={() => {
                setSelectedRole('supervisor');
                setEmail('roberto.diaz@juntacomunal.gob.pa');
                setPassword('Supervisor2025*');
              }}
              className={`flex flex-col items-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                selectedRole === 'supervisor'
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-cyan-500" />
              <span className="truncate">2. Supervisor</span>
            </button>

            {/* 3. Administrador */}
            <button
              type="button"
              id="role-btn-admin"
              onClick={() => {
                setSelectedRole('administrador');
                setEmail('carlos.mendoza@alcaldia.gob.pa');
                setPassword('Admin2025*');
              }}
              className={`flex flex-col items-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                selectedRole === 'administrador'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-500" />
              <span className="truncate">3. Admin</span>
            </button>

            {/* 4. Super Administrador */}
            <button
              type="button"
              id="role-btn-superadmin"
              onClick={() => {
                setSelectedRole('super_administrador');
                setEmail('superadmin@juntacomunal.gob.pa');
                setPassword('SuperAdmin2025*');
              }}
              className={`flex flex-col items-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                selectedRole === 'super_administrador'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">4. Super Admin</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              id="login-error-alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Error de validación</span>
                {errorMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@alcaldia.gob.pa"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/60 border rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-medium ${
                  getFieldError('email')
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            {getFieldError('email') && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{getFieldError('email')}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Contraseña
              </label>
              <button
                type="button"
                id="btn-forgot-password"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/60 border rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-medium ${
                  getFieldError('password')
                    ? 'border-rose-400 dark:border-rose-600'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            {getFieldError('password') && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{getFieldError('password')}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-submit-login"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 ease-out flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Iniciar Sesión ({selectedRole})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Token Info */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
            Token JWT con expiración de 7 días y validación estricta Zod en backend.
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                type="button"
                id="btn-close-forgot-modal"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Restablecer Contraseña</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ingrese su correo institucional para enviarle un enlace seguro de recuperación.
              </p>

              {recoverySuccess ? (
                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Enlace de recuperación enviado. Por favor revise su bandeja de entrada.</span>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="usuario@alcaldia.gob.pa"
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
                    >
                      Enviar Enlace
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} Sistema Institucional de Tickets. Todos los derechos reservados.
      </footer>
    </div>
  );
};
