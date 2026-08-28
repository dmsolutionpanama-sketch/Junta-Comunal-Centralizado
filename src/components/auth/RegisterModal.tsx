import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { UserGender, UserRegistrationInput, User } from '../../types';
import { emailService } from '../../services/emailService';
import { analytics } from '../../services/analytics';
import { ticketService } from '../../services/ticketService';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (user: User, token: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState<UserRegistrationInput>({
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    sector: SECTORES_RESIDENCIA[0] || 'Altos de Las Cumbres',
    genero: 'femenino',
    edad: 30,
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof UserRegistrationInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.nombre.trim() || !formData.cedula.trim() || !formData.email.trim() || !formData.password) {
      setError('Por favor complete los campos obligatorios (*).');
      return;
    }

    if (formData.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifique.');
      return;
    }

    setLoading(true);

    try {
      const res = await ticketService.registerUser(formData);

      if (res.success && res.user) {
        setSuccess(true);
        // Track in Analytics
        analytics.trackUserRegistered(res.user.email, res.user.sector || '', res.user.rol);
        // Send Welcome Email Notification
        emailService.notifyUserRegistered(res.user);

        setTimeout(() => {
          onRegisterSuccess(res.user!, res.token || 'demo-jwt-user-token');
          onClose();
        }, 1500);
      } else {
        setError(res.message || 'Error al registrar usuario.');
        setLoading(false);
      }
    } catch {
      setError('Ocurrió un error inesperado al procesar el registro.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Registro de Ciudadano / Residente
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cree su cuenta comunal para radicar y hacer seguimiento a sus incidencias
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>¡Cuenta creada con éxito! Iniciando sesión automáticamente...</span>
            </div>
          )}

          {/* Nombre Completo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre Completo *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Ej: Lic. Carlos Valdés / María González"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
              />
              <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Cédula y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cédula de Identidad *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.cedula}
                  onChange={(e) => handleChange('cedula', e.target.value)}
                  placeholder="Ej: 8-742-1983 / PE-12-345"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
                />
                <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="+507 6821-4490"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
                />
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Correo Electrónico *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="su.correo@ejemplo.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
              />
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
              Aquí recibirá las alertas de avance de sus tickets radicados.
            </p>
          </div>

          {/* Sector, Género y Edad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sector Comunal *
              </label>
              <div className="relative">
                <select
                  value={formData.sector}
                  onChange={(e) => handleChange('sector', e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                >
                  {SECTORES_RESIDENCIA.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Género
              </label>
              <select
                value={formData.genero}
                onChange={(e) => handleChange('genero', e.target.value as UserGender)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Edad
              </label>
              <input
                type="number"
                min="18"
                max="100"
                value={formData.edad}
                onChange={(e) => handleChange('edad', parseInt(e.target.value) || 18)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
                />
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Repita la contraseña"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
                />
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Creando cuenta...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Completar Registro Ciudadano</span>
                </>
              )}
            </button>
          </div>

          {/* Link to login */}
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ¿Ya tiene una cuenta registrada?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToLogin();
                }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Iniciar Sesión
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
