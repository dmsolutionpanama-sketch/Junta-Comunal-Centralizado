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
  Camera,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Database,
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

const AVATAR_PRESETS = [
  { label: 'Avatar 1 (Femenino)', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { label: 'Avatar 2 (Femenino)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { label: 'Avatar 3 (Masculino)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Avatar 4 (Masculino)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { label: 'Avatar 5 (Profesional)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { label: 'Avatar 6 (Ciudadano)', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
];

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
    direccion: '',
    departamento: 'Comunidad / Residencia General',
    lugarRegistro: 'Portal Web Digital',
    genero: 'femenino',
    edad: 30,
    password: '',
    confirmPassword: '',
    avatarUrl: AVATAR_PRESETS[0].url,
    fechaRegistro: '2026-08-28',
    horaRegistro: new Date().toTimeString().split(' ')[0].substring(0, 5),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof UserRegistrationInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleChange('avatarUrl', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
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
      const now = new Date();
      const currentHora = now.toTimeString().split(' ')[0].substring(0, 5);

      const payload = {
        ...formData,
        fechaRegistro: '2026-08-28',
        horaRegistro: currentHora,
      };

      const res = await ticketService.registerUser(payload);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Registro de Ciudadano / Residente
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" /> 28 de agosto del 2026
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Database className="w-3.5 h-3.5" /> u483786231_ticket_db
                </span>
              </div>
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

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>¡Cuenta creada con éxito! Guardada en base de datos. Iniciando sesión...</span>
            </div>
          )}

          {/* Foto de Perfil / Avatar Selection */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Foto de Perfil del Usuario
              </label>
              <button
                type="button"
                onClick={() => setCustomAvatarInput(!customAvatarInput)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                {customAvatarInput ? 'Elegir avatar prediseñado' : 'Subir archivo o URL propia'}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={formData.avatarUrl || AVATAR_PRESETS[0].url}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              {!customAvatarInput ? (
                <div className="flex-1">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                    Seleccione un avatar oficial o cargue su fotografía:
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleChange('avatarUrl', preset.url)}
                        className={`relative rounded-full p-0.5 transition-transform hover:scale-105 cursor-pointer shrink-0 ${
                          formData.avatarUrl === preset.url
                            ? 'ring-2 ring-blue-600 ring-offset-1'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.avatarUrl}
                      onChange={(e) => handleChange('avatarUrl', e.target.value)}
                      placeholder="https://ejemplo.com/mifoto.jpg"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                    <label className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-semibold hover:bg-blue-700 cursor-pointer flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Subir</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Aquí recibirá las alertas y notificaciones automáticas de sus trámites.
            </p>
          </div>

          {/* Dirección Residencial Detallada */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dirección Residencial / Calle / Casa
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              placeholder="Ej: Calle 3ra, Casa #45-B, frente a la tienda comunal"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
            />
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

          {/* Contraseñas con Confirmación y Visibilidad */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Seguridad y Contraseña de Acceso
              </span>
              {formData.password && formData.confirmPassword && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  formData.password === formData.confirmPassword
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {formData.password === formData.confirmPassword ? '✓ Coinciden' : '✗ No coinciden'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Crear Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Repita la contraseña"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fecha y Hora de Registro */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Fecha de Registro: <strong className="text-slate-800 dark:text-slate-200">28 de agosto de 2026</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{formData.horaRegistro} hrs</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Guardando en base de datos...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Completar Registro y Guardar en BD</span>
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

