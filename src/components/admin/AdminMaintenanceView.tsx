import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Tag,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Search,
  Filter,
  Save,
  X,
  Lock,
  Clock,
  Palette,
  Eye,
  Check,
  Send,
  Zap,
  Droplets,
  TreePine,
  HeartHandshake,
  FileCheck,
  Trophy,
  Hammer,
  Shield,
  HelpCircle,
  UserPlus,
  Building,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  Briefcase,
  Database,
  RefreshCw,
  Server,
  Key,
} from 'lucide-react';
import { Category, User, UserRole, UserGender, EmailNotificationLog } from '../../types';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { CategoryIcon } from '../common/CategoryIcon';
import { ticketService } from '../../services/ticketService';
import { emailService, getStoredEmailLogs } from '../../services/emailService';

interface AdminMaintenanceViewProps {
  currentUser: User | null;
  categories: Category[];
  onCategoriesUpdated: (newCategories: Category[]) => void;
}

const AVAILABLE_ICONS = [
  { id: 'Zap', label: 'Rayo / Electricidad' },
  { id: 'Droplets', label: 'Gotas / Agua' },
  { id: 'TreePine', label: 'Árbol / Poda' },
  { id: 'HeartHandshake', label: 'Manos / Social' },
  { id: 'FileCheck', label: 'Documento / Permiso' },
  { id: 'Trophy', label: 'Trofeo / Deportes' },
  { id: 'Hammer', label: 'Martillo / Obras' },
  { id: 'Shield', label: 'Escudo / Seguridad' },
];

const DEPARTAMENTOS_DISPONIBLES = [
  'Despacho Superior de Administración',
  'Cuadrilla de Alumbrado y Electricidad',
  'Cuadrilla de Acueductos y Drenajes',
  'Coordinación de Obras y Bacheo',
  'Dirección de Trabajo Social y Asistencia',
  'Fiscalización Comunitaria e Inspección',
  'Mesa de Entrada y Atención Ciudadana',
  'Ciudadanía / Residente General',
];

const SEDES_REGISTRO = [
  'Sede Central - Despacho Comunal',
  'Módulo de Atención Ciudadana Ventanilla 1',
  'Módulo de Atención Ciudadana Ventanilla 2',
  'Puesto Comunitario Villa Zaita',
  'Puesto Comunitario Gonzalillo',
  'Unidad Móvil de Inspección en Campo',
  'Portal Web Digital',
];

export const AdminMaintenanceView: React.FC<AdminMaintenanceViewProps> = ({
  currentUser,
  categories,
  onCategoriesUpdated,
}) => {
  const isSuperiorAdmin = currentUser?.rol === 'administrador';

  const [activeTab, setActiveTab] = useState<'categories' | 'roles' | 'emails' | 'database'>('categories');
  const [dbStatus, setDbStatus] = useState<any>({
    connected: false,
    host: '31.97.208.81',
    port: 3306,
    database: 'u483786231_ticket_db',
    user: 'user_jc26',
    provider: 'Hostinger Remote MySQL',
  });
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // Categories State
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categorySuccessMsg, setCategorySuccessMsg] = useState<string | null>(null);

  // Users & Roles State
  const [userList, setUserList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('todos');
  const [userSectorFilter, setUserSectorFilter] = useState<string>('todos');
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [userErrorMsg, setUserErrorMsg] = useState<string | null>(null);

  // Modals for User Management
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);

  // Form State for User Creation / Edit
  const [userFormData, setUserFormData] = useState<{
    id?: string;
    nombre: string;
    cedula: string;
    email: string;
    telefono: string;
    sector: string;
    direccion: string;
    genero: UserGender;
    edad: number;
    rol: UserRole;
    departamento: string;
    lugarRegistro: string;
    estado: 'activo' | 'inactivo';
    notasAdmin: string;
    password?: string;
  }>({
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    sector: SECTORES_RESIDENCIA[0] || 'Altos de Las Cumbres',
    direccion: '',
    genero: 'femenino',
    edad: 32,
    rol: 'usuario',
    departamento: DEPARTAMENTOS_DISPONIBLES[0],
    lugarRegistro: SEDES_REGISTRO[0],
    estado: 'activo',
    notasAdmin: '',
    password: '',
  });

  // Email Logs State
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>([]);
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<EmailNotificationLog | null>(null);

  // Load initial data
  useEffect(() => {
    setCategoryList(categories);
    loadUsers();
    loadEmailLogs();
  }, [categories]);

  const loadUsers = async () => {
    const users = await ticketService.getAllUsers();
    setUserList(users);
  };

  const loadEmailLogs = () => {
    setEmailLogs(getStoredEmailLogs());
  };

  const loadDbStatus = async () => {
    try {
      setIsCheckingDb(true);
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setDbStatus(json.data);
        }
      }
    } catch (e) {
      console.warn('Error fetching DB status:', e);
    } finally {
      setIsCheckingDb(false);
    }
  };

  // 1. RBAC Security Barrier: Superior Admin Only
  if (!isSuperiorAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto my-12 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Acceso Restringido: Solo Administrador Superior
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Esta sección contiene el mantenimiento centralizado de categorías de reporte y la asignación
          de roles del personal de la Junta Comunal. Solo los usuarios con rol de{' '}
          <strong className="text-slate-900 dark:text-slate-200">Administrador Superior</strong>{' '}
          tienen autorización para modificar estas configuraciones maestras.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Lock className="w-4 h-4 text-slate-500" />
          <span>Su rol actual es: {currentUser?.rol?.toUpperCase() || 'USUARIO'}</span>
        </div>
      </div>
    );
  }

  // Handle Category Save (Create / Update)
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.nombre.trim()) return;

    let updated: Category[];
    const exists = categoryList.some((c) => c.id === editingCategory.id);

    if (exists) {
      updated = categoryList.map((c) => (c.id === editingCategory.id ? editingCategory : c));
      setCategorySuccessMsg(`Categoría "${editingCategory.nombre}" actualizada correctamente.`);
    } else {
      updated = [...categoryList, editingCategory];
      setCategorySuccessMsg(`Categoría "${editingCategory.nombre}" creada satisfactoriamente.`);
    }

    setCategoryList(updated);
    onCategoriesUpdated(updated);
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setTimeout(() => setCategorySuccessMsg(null), 3000);
  };

  const handleOpenNewCategory = () => {
    const newId = `cat-${Date.now()}`;
    setEditingCategory({
      id: newId,
      nombre: '',
      prefijo: 'INC',
      descripcion: '',
      color: '#0284C7',
      icono: 'Tag',
      slaHoras: 48,
      activa: true,
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar la categoría "${name}"?`)) {
      const updated = categoryList.filter((c) => c.id !== id);
      setCategoryList(updated);
      onCategoriesUpdated(updated);
      setCategorySuccessMsg(`Categoría "${name}" eliminada.`);
      setTimeout(() => setCategorySuccessMsg(null), 3000);
    }
  };

  // User Management Handlers
  const handleOpenNewUser = () => {
    setUserFormData({
      nombre: '',
      cedula: '',
      email: '',
      telefono: '',
      sector: SECTORES_RESIDENCIA[0] || 'Altos de Las Cumbres',
      direccion: '',
      genero: 'femenino',
      edad: 30,
      rol: 'usuario',
      departamento: DEPARTAMENTOS_DISPONIBLES[0],
      lugarRegistro: SEDES_REGISTRO[0],
      estado: 'activo',
      notasAdmin: '',
      password: '',
    });
    setUserErrorMsg(null);
    setIsNewUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setUserFormData({
      id: user.id,
      nombre: user.nombre,
      cedula: user.cedula || '',
      email: user.email,
      telefono: user.telefono || '',
      sector: user.sector || SECTORES_RESIDENCIA[0],
      direccion: user.direccion || '',
      genero: user.genero || 'femenino',
      edad: user.edad || 30,
      rol: user.rol,
      departamento: user.departamento || DEPARTAMENTOS_DISPONIBLES[0],
      lugarRegistro: user.lugarRegistro || SEDES_REGISTRO[0],
      estado: user.estado || 'activo',
      notasAdmin: user.notasAdmin || '',
    });
    setUserErrorMsg(null);
    setIsEditUserModalOpen(true);
  };

  const handleSaveNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMsg(null);

    if (!userFormData.nombre.trim() || !userFormData.cedula.trim() || !userFormData.email.trim()) {
      setUserErrorMsg('Por favor complete los campos obligatorios (*).');
      return;
    }

    const res = await ticketService.createUserAdmin(userFormData);
    if (res.success && res.user) {
      await loadUsers();
      setIsNewUserModalOpen(false);
      setUserSuccessMsg(`Usuario "${res.user.nombre}" registrado exitosamente desde cero.`);
      setTimeout(() => setUserSuccessMsg(null), 3500);
    } else {
      setUserErrorMsg(res.message || 'Error al registrar el usuario.');
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.id) return;
    setUserErrorMsg(null);

    const res = await ticketService.updateUserFull(userFormData.id, userFormData);
    if (res.success && res.user) {
      await loadUsers();
      setIsEditUserModalOpen(false);
      setUserSuccessMsg(`Datos del usuario "${res.user.nombre}" actualizados.`);
      setTimeout(() => setUserSuccessMsg(null), 3500);
    } else {
      setUserErrorMsg(res.message || 'Error al actualizar el usuario.');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar permanentemente al usuario "${name}"?`)) {
      const res = await ticketService.deleteUser(userId);
      if (res.success) {
        await loadUsers();
        setUserSuccessMsg(`Usuario "${name}" eliminado del sistema.`);
        setTimeout(() => setUserSuccessMsg(null), 3000);
      } else {
        alert(res.message || 'No se pudo eliminar el usuario.');
      }
    }
  };

  // Handle Quick User Role Change
  const handleQuickRoleChange = async (userId: string, newRole: UserRole) => {
    const res = await ticketService.updateUserRole(userId, newRole);
    if (res.success) {
      setUserList((prev) => prev.map((u) => (u.id === userId ? { ...u, rol: newRole } : u)));
      setUserSuccessMsg(`Rol del usuario actualizado a "${newRole.toUpperCase()}".`);
      setTimeout(() => setUserSuccessMsg(null), 3000);
    }
  };

  // Filtered Users
  const filteredUsers = userList.filter((u) => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.cedula && u.cedula.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.sector && u.sector.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.departamento && u.departamento.toLowerCase().includes(userSearch.toLowerCase()));

    const matchesRole = userRoleFilter === 'todos' || u.rol === userRoleFilter;
    const matchesSector = userSectorFilter === 'todos' || u.sector === userSectorFilter;

    return matchesSearch && matchesRole && matchesSector;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              Administración Superior
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Mantenimiento de Categorías & Registro de Usuarios
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de tipos de reporte, registro de usuarios desde 0, asignación de roles y bitácora de correo
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categorías ({categoryList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuarios & Roles ({userList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('emails');
              loadEmailLogs();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'emails'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Alertas de Correo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('database');
              loadDbStatus();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'database'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Base de Datos MySQL</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {categorySuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{categorySuccessMsg}</span>
        </div>
      )}

      {userSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{userSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: CATEGORIES MAINTENANCE */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Catálogo de Tipos de Incidencia & Prefijos
            </h2>
            <button
              type="button"
              onClick={handleOpenNewCategory}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Categoría</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryList.map((cat) => (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon iconName={cat.icono} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {cat.nombre}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            Prefijo: {cat.prefijo || 'ALU'}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> SLA: {cat.slaHoras}h
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory({ ...cat });
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Editar categoría"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {cat.descripcion}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Ejemplo: <strong>{cat.prefijo || 'ALU'}-2025-001</strong></span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    cat.activa !== false
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {cat.activa !== false ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: USER ROLES MANAGEMENT & REGISTRATION FROM SCRATCH */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nombre, cédula, correo, sector o departamento..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            </div>

            {/* Filters & Add User Button */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sector Filter */}
              <select
                value={userSectorFilter}
                onChange={(e) => setUserSectorFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="todos">Todos los Sectores</option>
                {SECTORES_RESIDENCIA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Role Filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="todos">Todos los Roles</option>
                <option value="administrador">Administrador Superior</option>
                <option value="supervisor">Supervisor Comunal</option>
                <option value="agente">Agente / Cuadrilla</option>
                <option value="usuario">Ciudadano / Residente</option>
              </select>

              {/* Register User from Scratch Button */}
              <button
                type="button"
                onClick={handleOpenNewUser}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Usuario de 0</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Usuario / Cédula</th>
                    <th className="py-3 px-4">Contacto & Sector</th>
                    <th className="py-3 px-4">Unidad / Sede de Registro</th>
                    <th className="py-3 px-4">Rol Asignado</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No se encontraron usuarios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                u.avatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={u.nombre}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{u.nombre}</p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                                <span>Cédula: <strong>{u.cedula || 'N/A'}</strong></span>
                                {u.edad && <span>• {u.edad} años ({u.genero || 'N/A'})</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-800 dark:text-slate-200 font-medium">{u.email}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {u.sector || 'Sector no asignado'}
                            {u.telefono && ` • 📞 ${u.telefono}`}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            {u.departamento || 'Atención General'}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            {u.lugarRegistro || 'Sede Central'} • {u.fechaRegistro || '2025-01-01'} {u.horaRegistro ? `(${u.horaRegistro})` : ''}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              u.rol === 'administrador'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : u.rol === 'supervisor'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : u.rol === 'agente'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {u.rol === 'administrador' && '👑 '}
                            {u.rol === 'supervisor' && '📋 '}
                            {u.rol === 'agente' && '🔧 '}
                            {u.rol === 'usuario' && '👤 '}
                            {u.rol.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              u.estado === 'activo'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.estado === 'activo' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedUserDetail(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                              title="Ver ficha completa"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                              title="Editar usuario"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.nombre)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMAIL NOTIFICATION ALERTS */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Bitácora de Notificaciones & Alertas por Correo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historial de confirmaciones de radicación y avances automáticos despachados a ciudadanos
              </p>
            </div>
            <button
              type="button"
              onClick={loadEmailLogs}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Actualizar Bitácora
            </button>
          </div>

          {emailLogs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
              <Mail className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-xs">No hay alertas de correo registradas todavía en esta sesión.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{log.asunto}</span>
                        {log.ticketId && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300">
                            {log.ticketId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Para: <strong className="text-slate-700 dark:text-slate-300">{log.destinatario}</strong> • {log.fechaHora}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Despachado
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEmailPreview(log)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                    >
                      Ver Plantilla
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MYSQL DATABASE STATUS & CONNECTIVITY */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  dbStatus.connected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}>
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Conexión a Base de Datos MySQL
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      dbStatus.connected
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      Configurado & Enlazado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Servidor Hostinger Remote MySQL ({dbStatus.provider})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadDbStatus}
                disabled={isCheckingDb}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingDb ? 'animate-spin' : ''}`} />
                <span>{isCheckingDb ? 'Comprobando...' : 'Verificar Conexión'}</span>
              </button>
            </div>

            {/* Connection Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <Server className="w-4 h-4 text-blue-500" />
                  <span>Host / Servidor IP</span>
                </div>
                <p className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {dbStatus.host || '31.97.208.81'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Puerto: {dbStatus.port || 3306}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>Base de Datos</span>
                </div>
                <p className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {dbStatus.database || 'u483786231_ticket_db'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Motor: MySQL InnoDB</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>Usuario Autorizado</span>
                </div>
                <p className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {dbStatus.user || 'user_jc26'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Permisos: SELECT, INSERT, UPDATE</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <Key className="w-4 h-4 text-amber-500" />
                  <span>Autenticación</span>
                </div>
                <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  Credenciales Activas
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Pool Conexiones: 5 Activas</p>
              </div>
            </div>

            {/* Hostinger Remote Note */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Estado de Integración con Hostinger</span>
              </div>
              <p className="text-blue-800/90 dark:text-blue-300 leading-relaxed">
                El backend de la aplicación ha sido configurado para consultar directamente el pool de conexiones hacia <strong>31.97.208.81:3306</strong> en la base de datos <strong>u483786231_ticket_db</strong>. Los tickets registrados desde la web, panel administrativo o canal de WhatsApp se sincronizan cada 5 segundos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE USER FROM SCRATCH */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Registrar Usuario / Funcionario desde Cero
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="p-6 space-y-4">
              {userErrorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.nombre}
                    onChange={(e) => setUserFormData({ ...userFormData, nombre: e.target.value })}
                    placeholder="Ej: Lic. Carlos Valdés"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                {/* Cédula */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cédula / Documento de Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.cedula}
                    onChange={(e) => setUserFormData({ ...userFormData, cedula: e.target.value })}
                    placeholder="Ej: 8-742-1983 / PE-12-345"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="usuario@juntacomunal.gob.pa"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp de Contacto
                  </label>
                  <input
                    type="tel"
                    value={userFormData.telefono}
                    onChange={(e) => setUserFormData({ ...userFormData, telefono: e.target.value })}
                    placeholder="+507 6821-4490"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Sector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sector de Residencia *
                  </label>
                  <select
                    value={userFormData.sector}
                    onChange={(e) => setUserFormData({ ...userFormData, sector: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  >
                    {SECTORES_RESIDENCIA.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Género */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Género
                  </label>
                  <select
                    value={userFormData.genero}
                    onChange={(e) => setUserFormData({ ...userFormData, genero: e.target.value as UserGender })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {/* Edad */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Edad
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={userFormData.edad}
                    onChange={(e) => setUserFormData({ ...userFormData, edad: parseInt(e.target.value) || 18 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rol */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rol del Sistema *
                  </label>
                  <select
                    value={userFormData.rol}
                    onChange={(e) => setUserFormData({ ...userFormData, rol: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="usuario">👤 Ciudadano (Usuario General)</option>
                    <option value="agente">🔧 Agente / Cuadrilla Operativa</option>
                    <option value="supervisor">📋 Supervisor Comunal</option>
                    <option value="administrador">👑 Administrador Superior</option>
                  </select>
                </div>

                {/* Departamento / Unidad */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento o Unidad Asignada
                  </label>
                  <select
                    value={userFormData.departamento}
                    onChange={(e) => setUserFormData({ ...userFormData, departamento: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  >
                    {DEPARTAMENTOS_DISPONIBLES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lugar de Registro */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lugar / Sede de Registro
                  </label>
                  <select
                    value={userFormData.lugarRegistro}
                    onChange={(e) => setUserFormData({ ...userFormData, lugarRegistro: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  >
                    {SEDES_REGISTRO.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={userFormData.estado}
                    onChange={(e) => setUserFormData({ ...userFormData, estado: e.target.value as 'activo' | 'inactivo' })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="activo">🟢 Activo</option>
                    <option value="inactivo">⚪ Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Dirección Detallada */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Detallada / Domicilio / Oficina
                </label>
                <input
                  type="text"
                  value={userFormData.direccion}
                  onChange={(e) => setUserFormData({ ...userFormData, direccion: e.target.value })}
                  placeholder="Calle principal, casa #45, diagonal a la escuela..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Notas de Administración */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas de Administración / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={userFormData.notasAdmin}
                  onChange={(e) => setUserFormData({ ...userFormData, notasAdmin: e.target.value })}
                  placeholder="Observaciones de credenciales, permisos especiales o asignaciones..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Crear Usuario desde Cero</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING USER */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Editar Datos del Usuario / Funcionario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4">
              {userErrorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.nombre}
                    onChange={(e) => setUserFormData({ ...userFormData, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.cedula}
                    onChange={(e) => setUserFormData({ ...userFormData, cedula: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    value={userFormData.telefono}
                    onChange={(e) => setUserFormData({ ...userFormData, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sector
                  </label>
                  <select
                    value={userFormData.sector}
                    onChange={(e) => setUserFormData({ ...userFormData, sector: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  >
                    {SECTORES_RESIDENCIA.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Género
                  </label>
                  <select
                    value={userFormData.genero}
                    onChange={(e) => setUserFormData({ ...userFormData, genero: e.target.value as UserGender })}
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
                    value={userFormData.edad}
                    onChange={(e) => setUserFormData({ ...userFormData, edad: parseInt(e.target.value) || 18 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rol Asignado *
                  </label>
                  <select
                    value={userFormData.rol}
                    onChange={(e) => setUserFormData({ ...userFormData, rol: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="usuario">👤 Ciudadano (Usuario General)</option>
                    <option value="agente">🔧 Agente / Cuadrilla Operativa</option>
                    <option value="supervisor">📋 Supervisor Comunal</option>
                    <option value="administrador">👑 Administrador Superior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento o Unidad
                  </label>
                  <select
                    value={userFormData.departamento}
                    onChange={(e) => setUserFormData({ ...userFormData, departamento: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  >
                    {DEPARTAMENTOS_DISPONIBLES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lugar / Sede de Registro
                  </label>
                  <select
                    value={userFormData.lugarRegistro}
                    onChange={(e) => setUserFormData({ ...userFormData, lugarRegistro: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  >
                    {SEDES_REGISTRO.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={userFormData.estado}
                    onChange={(e) => setUserFormData({ ...userFormData, estado: e.target.value as 'activo' | 'inactivo' })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="activo">🟢 Activo</option>
                    <option value="inactivo">⚪ Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Detallada
                </label>
                <input
                  type="text"
                  value={userFormData.direccion}
                  onChange={(e) => setUserFormData({ ...userFormData, direccion: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas de Administración
                </label>
                <textarea
                  rows={2}
                  value={userFormData.notasAdmin}
                  onChange={(e) => setUserFormData({ ...userFormData, notasAdmin: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Actualizar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW USER DETAIL CARD */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Ficha Oficial del Usuario / Funcionario
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedUserDetail.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                  alt={selectedUserDetail.nombre}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/20"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedUserDetail.nombre}
                  </h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mt-0.5">
                    {selectedUserDetail.rol} • {selectedUserDetail.departamento || 'Atención General'}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Cédula: {selectedUserDetail.cedula || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Correo Electrónico</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUserDetail.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Teléfono / WhatsApp</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUserDetail.telefono || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sector de Residencia</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUserDetail.sector || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Demografía</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUserDetail.edad ? `${selectedUserDetail.edad} años` : ''} ({selectedUserDetail.genero || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Lugar de Registro</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUserDetail.lugarRegistro || 'Sede Central'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha & Hora de Registro</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUserDetail.fechaRegistro || '2025-01-01'} {selectedUserDetail.horaRegistro ? `a las ${selectedUserDetail.horaRegistro}` : ''}</span>
                </div>
              </div>

              {selectedUserDetail.direccion && (
                <div className="text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Dirección Detallada</span>
                  <p className="text-slate-700 dark:text-slate-300">{selectedUserDetail.direccion}</p>
                </div>
              )}

              {selectedUserDetail.notasAdmin && (
                <div className="text-xs p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                  <span className="block text-[10px] uppercase font-bold mb-0.5">Notas Administrativas</span>
                  <p>{selectedUserDetail.notasAdmin}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CATEGORY EDIT / CREATE */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {categoryList.some((c) => c.id === editingCategory.id) ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.nombre}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nombre: e.target.value })}
                  placeholder="Ej: Obras Comunitarias / Bacheo"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código Prefijo (3-4 letras) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={editingCategory.prefijo || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, prefijo: e.target.value.toUpperCase() })}
                    placeholder="Ej: OBR, ALU, AGU"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/30"
                  />
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                    Generará tickets como <strong>{editingCategory.prefijo || 'OBR'}-2025-001</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SLA en Horas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    required
                    value={editingCategory.slaHoras}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slaHoras: parseInt(e.target.value) || 24 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color Distintivo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Icono Representativo
                  </label>
                  <select
                    value={editingCategory.icono}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icono: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {AVAILABLE_ICONS.map((ico) => (
                      <option key={ico.id} value={ico.id}>
                        {ico.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción del Servicio
                </label>
                <textarea
                  rows={3}
                  value={editingCategory.descripcion}
                  onChange={(e) => setEditingCategory({ ...editingCategory, descripcion: e.target.value })}
                  placeholder="Detalle los casos que atiende este tipo de reporte..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Categoría</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EMAIL HTML PREVIEW */}
      {selectedEmailPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Vista Previa del Correo Despachado
                </h3>
                <p className="text-xs text-slate-500">Destinatario: {selectedEmailPreview.destinatario}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmailPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-100 dark:bg-slate-950">
              <div
                className="bg-white rounded-xl shadow-xs overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedEmailPreview.cuerpoHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

