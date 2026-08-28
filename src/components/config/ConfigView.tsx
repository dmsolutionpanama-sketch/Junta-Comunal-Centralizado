import React, { useState } from 'react';
import {
  Settings,
  Database,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  RotateCcw,
  Server,
  Shield,
  Code,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { CategoryIcon } from '../common/CategoryIcon';

interface ConfigViewProps {
  onResetMockData: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ onResetMockData }) => {
  const [activeSubTab, setActiveSubTab] = useState<'bd' | 'categorias' | 'sectores' | 'seguridad'>('bd');
  const [copiedSql, setCopiedSql] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const copySchemaSql = () => {
    const sqlContent = `-- ESQUEMA DE BASE DE DATOS MYSQL CENTRALIZADA - JUNTA COMUNAL (GESTIÓN DE INCIDENCIAS)
CREATE DATABASE IF NOT EXISTS \`tickets_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`tickets_db\`;

-- 1. TABLA USUARIOS Y ROLES (RBAC)
CREATE TABLE IF NOT EXISTS \`usuarios\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`nombre\` VARCHAR(120) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`rol\` ENUM('administrador', 'agente', 'usuario', 'supervisor') NOT NULL DEFAULT 'usuario',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;

-- 2. TABLA CENTRALIZADA: CATEGORÍAS DE CASO (Sección 8)
CREATE TABLE IF NOT EXISTS \`categorias\` (
  \`id\` VARCHAR(60) NOT NULL,
  \`nombre\` VARCHAR(100) NOT NULL UNIQUE,
  \`descripcion\` TEXT NOT NULL,
  \`color\` VARCHAR(20) NOT NULL DEFAULT '#0066FF',
  \`sla_horas\` INT NOT NULL DEFAULT 48,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;

-- 3. TABLA CENTRALIZADA: SECTORES DE RESIDENCIA (Sección 9)
CREATE TABLE IF NOT EXISTS \`sectores\` (
  \`id\` INT AUTO_INCREMENT NOT NULL,
  \`nombre\` VARCHAR(120) NOT NULL UNIQUE,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;

-- 4. TABLA DE TICKETS
CREATE TABLE IF NOT EXISTS \`tickets\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`numero_registro\` VARCHAR(50) NOT NULL UNIQUE,
  \`asunto\` VARCHAR(200) NOT NULL,
  \`descripcion\` TEXT NOT NULL,
  \`categoria_id\` VARCHAR(60) NOT NULL,
  \`sector_nombre\` VARCHAR(120) NOT NULL,
  \`estado\` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NOT NULL DEFAULT 'abierto',
  \`prioridad\` ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
  \`reportante_nombre\` VARCHAR(120) NOT NULL,
  \`reportante_cedula\` VARCHAR(30) NOT NULL,
  \`fecha_creacion\` DATE NOT NULL,
  PRIMARY KEY (\`id\`),
  CONSTRAINT \`fk_tickets_categoria\` FOREIGN KEY (\`categoria_id\`) REFERENCES \`categorias\` (\`id\`)
) ENGINE=InnoDB;`;

    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleResetData = () => {
    if (window.confirm('¿Está seguro de reiniciar los tickets a los registros demostrativos iniciales?')) {
      onResetMockData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Configuración del Sistema & Base de Datos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900">
              MySQL & Zod Validated
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
            Catálogos centralizados en `catalogs.json`, autenticación JWT por roles (RBAC) y esquemas MySQL
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Datos Demo</span>
        </button>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Base de datos reestablecida exitosamente con el catálogo completo de prueba.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('bd')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'bd'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Base de Datos MySQL
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('categorias')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'categorias'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Categorías Centralizadas ({CATEGORIAS_SISTEMA.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('sectores')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'sectores'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Sectores Residenciales ({SECTORES_RESIDENCIA.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('seguridad')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'seguridad'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Seguridad & JWT RBAC
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'bd' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Server className="w-5 h-5" />
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Motor MySQL / MariaDB</span>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200">MySQL 8.0+ InnoDB</p>
              <p className="text-[11px] text-slate-400">
                Tablas relacionales con integridad referencial, índices y llaves foráneas.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Validación de Entradas</span>
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Zod Schema Activo</p>
              <p className="text-[11px] text-slate-400">
                Validación estricta en backend para Login, Tickets y Bitácora de Trazabilidad.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Shield className="w-5 h-5" />
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Roles de Usuario (RBAC)</span>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200">Admin, Agente, Usuario</p>
              <p className="text-[11px] text-slate-400">
                Middleware de autorización con firma y verificación de JWT Bearer tokens.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Script DDL de Inicialización (`src/db/schema.sql`)
                </h3>
              </div>
              <button
                type="button"
                onClick={copySchemaSql}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed">
              {`-- TABLA PRINCIPAL DE TICKETS CON LLAVES FORÁNEAS (MySQL InnoDB)
CREATE TABLE IF NOT EXISTS \`tickets\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`numero_registro\` VARCHAR(50) NOT NULL UNIQUE,
  \`asunto\` VARCHAR(200) NOT NULL,
  \`descripcion\` TEXT NOT NULL,
  \`categoria_id\` VARCHAR(60) NOT NULL,
  \`sector_nombre\` VARCHAR(120) NOT NULL,
  \`estado\` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NOT NULL DEFAULT 'abierto',
  \`prioridad\` ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
  \`reportante_nombre\` VARCHAR(120) NOT NULL,
  \`reportante_cedula\` VARCHAR(30) NOT NULL,
  \`reportante_telefono\` VARCHAR(30) NULL,
  \`reportante_email\` VARCHAR(150) NULL,
  \`reportante_genero\` ENUM('femenino', 'masculino', 'otro') NOT NULL,
  \`reportante_edad\` INT NOT NULL DEFAULT 30,
  \`fecha_creacion\` DATE NOT NULL,
  \`hora_creacion\` TIME NOT NULL,
  PRIMARY KEY (\`id\`),
  CONSTRAINT \`fk_tickets_categoria\` FOREIGN KEY (\`categoria_id\`) REFERENCES \`categorias\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'categorias' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIAS_SISTEMA.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  <CategoryIcon name={cat.icono} className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{cat.nombre}</h4>
                  <span className="text-[10px] font-mono text-slate-400">ID: {cat.id} • SLA: {cat.slaHoras}h</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{cat.descripcion}</p>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'sectores' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500" />
            Catálogo Oficial de Sectores Residenciales Centralizados ({SECTORES_RESIDENCIA.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SECTORES_RESIDENCIA.map((sector, index) => (
              <div
                key={sector}
                className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="truncate">{sector}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'seguridad' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                Rol: Administrador
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Control Total del Sistema</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Creación y edición de tickets</li>
                <li>Visualización de datos de reportante completos</li>
                <li>Reasignación y cierre de tickets</li>
                <li>Reportes gerenciales y analítica</li>
              </ul>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                Rol: Agente / Cuadrilla
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Operador Técnico de Campo</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Atención operativa de incidencias</li>
                <li>Registro de notas de trazabilidad</li>
                <li>Actualización de estado operativo</li>
                <li>Visualización de mapas y sectores</li>
              </ul>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                Rol: Usuario Ciudadano
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Radicación y Consulta Pública</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Radicación de nuevos tickets</li>
                <li>Búsqueda rápida por código TK</li>
                <li>Protección estricta de datos PII</li>
                <li>Seguimiento de resolución en tiempo real</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
