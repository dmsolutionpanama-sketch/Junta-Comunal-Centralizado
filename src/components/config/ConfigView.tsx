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
  Download,
  FileCode,
  TableProperties,
  Clock,
  Navigation,
  Sparkles,
  Search,
  Zap,
} from 'lucide-react';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { CategoryIcon } from '../common/CategoryIcon';

interface ConfigViewProps {
  onResetMockData: () => void;
}

type ScriptSectionType = 'unificado' | 'ddl' | 'dml' | 'queries';

export const ConfigView: React.FC<ConfigViewProps> = ({ onResetMockData }) => {
  const [activeSubTab, setActiveSubTab] = useState<'bd' | 'tablas-detalle' | 'categorias' | 'sectores' | 'seguridad'>('bd');
  const [selectedScriptType, setSelectedScriptType] = useState<ScriptSectionType>('unificado');
  const [copiedSql, setCopiedSql] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Script SQL DDL Completo
  const ddlSqlScript = `-- ========================================================================
-- JUNTA COMUNAL - ESTRUCTURA DE TABLAS (DDL)
-- Base de Datos MySQL / MariaDB (InnoDB, UTF8mb4)
-- Incluye: Fechas, Horas, Lugar de Registro, Georreferenciación e Índices
-- ========================================================================

CREATE DATABASE IF NOT EXISTS \`junta_comunal_tickets_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`junta_comunal_tickets_db\`;

-- 1. TABLA DE USUARIOS Y ROLES (RBAC)
CREATE TABLE IF NOT EXISTS \`usuarios\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`nombre\` VARCHAR(120) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`rol\` ENUM('administrador', 'supervisor', 'agente', 'ciudadano', 'usuario', 'usuario_reportante') NOT NULL DEFAULT 'ciudadano',
  \`cedula\` VARCHAR(30) NULL,
  \`telefono\` VARCHAR(30) NULL,
  \`sector\` VARCHAR(120) NULL,
  \`genero\` ENUM('femenino', 'masculino', 'otro') NULL,
  \`edad\` INT NULL,
  \`avatar_url\` VARCHAR(255) NULL,
  \`departamento\` VARCHAR(100) NULL,
  \`lugar_registro\` VARCHAR(150) NOT NULL DEFAULT 'Portal Web Ciudadano',
  \`ip_registro\` VARCHAR(50) NULL DEFAULT '190.140.22.10',
  \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`fecha_registro\` DATE NOT NULL DEFAULT (CURRENT_DATE),
  \`hora_registro\` TIME NOT NULL DEFAULT (CURRENT_TIME),
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_usuarios_email\` (\`email\`),
  INDEX \`idx_usuarios_cedula\` (\`cedula\`),
  INDEX \`idx_usuarios_rol\` (\`rol\`),
  INDEX \`idx_usuarios_lugar\` (\`lugar_registro\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA DE CATEGORÍAS CON PREFIJO DE NOMENCLATURA
CREATE TABLE IF NOT EXISTS \`categorias\` (
  \`id\` VARCHAR(60) NOT NULL,
  \`nombre\` VARCHAR(100) NOT NULL UNIQUE,
  \`prefijo_nomenclatura\` VARCHAR(10) NOT NULL,
  \`descripcion\` TEXT NOT NULL,
  \`color\` VARCHAR(20) NOT NULL DEFAULT '#0066FF',
  \`icono\` VARCHAR(50) NOT NULL DEFAULT 'Tag',
  \`sla_horas\` INT NOT NULL DEFAULT 48,
  \`activa\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_categorias_prefijo\` (\`prefijo_nomenclatura\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA DE SECTORES RESIDENCIALES Y COMUNITARIOS
CREATE TABLE IF NOT EXISTS \`sectores\` (
  \`id\` INT AUTO_INCREMENT NOT NULL,
  \`nombre\` VARCHAR(120) NOT NULL UNIQUE,
  \`corregimiento\` VARCHAR(100) NOT NULL DEFAULT 'Las Cumbres',
  \`distrito\` VARCHAR(100) NOT NULL DEFAULT 'Panamá',
  \`provincia\` VARCHAR(100) NOT NULL DEFAULT 'Panamá',
  \`zona\` VARCHAR(50) NOT NULL DEFAULT 'Sector Residencial',
  \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_sectores_nombre\` (\`nombre\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA PRINCIPAL DE TICKETS / INCIDENCIAS
CREATE TABLE IF NOT EXISTS \`tickets\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`numero_registro\` VARCHAR(50) NOT NULL UNIQUE,
  \`asunto\` VARCHAR(200) NOT NULL,
  \`descripcion\` TEXT NOT NULL,
  \`categoria_id\` VARCHAR(60) NOT NULL,
  \`categoria_nombre\` VARCHAR(100) NOT NULL,
  \`sector_nombre\` VARCHAR(120) NOT NULL,
  \`estado\` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NOT NULL DEFAULT 'abierto',
  \`prioridad\` ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
  \`direccion_detallada\` VARCHAR(255) NULL,
  \`ubicacion_lat\` DECIMAL(10, 8) NULL DEFAULT 9.0834,
  \`ubicacion_lng\` DECIMAL(11, 8) NULL DEFAULT -79.5312,
  \`lugar_registro\` VARCHAR(150) NOT NULL DEFAULT 'Portal Web Ciudadano',
  \`canal_radicacion\` ENUM('web_portal', 'ventanilla_presencial', 'inspeccion_campo', 'whatsapp_comunal', 'llamada_telefonica') NOT NULL DEFAULT 'web_portal',
  \`asignado_a\` VARCHAR(120) NULL,
  \`departamento\` VARCHAR(100) NULL,
  \`reportante_nombre\` VARCHAR(120) NOT NULL,
  \`reportante_cedula\` VARCHAR(30) NOT NULL,
  \`reportante_telefono\` VARCHAR(30) NULL,
  \`reportante_email\` VARCHAR(150) NULL,
  \`reportante_genero\` ENUM('femenino', 'masculino', 'otro') NOT NULL,
  \`reportante_edad\` INT NOT NULL DEFAULT 30,
  \`reportante_sector\` VARCHAR(120) NOT NULL,
  \`fecha_creacion\` DATE NOT NULL,
  \`hora_creacion\` TIME NOT NULL,
  \`fecha_hora_registro\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`fecha_actualizacion\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`fecha_cierre\` DATETIME NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_tickets_numero_registro\` (\`numero_registro\`),
  INDEX \`idx_tickets_categoria\` (\`categoria_id\`),
  INDEX \`idx_tickets_estado\` (\`estado\`),
  INDEX \`idx_tickets_prioridad\` (\`prioridad\`),
  INDEX \`idx_tickets_sector\` (\`sector_nombre\`),
  INDEX \`idx_tickets_lugar_registro\` (\`lugar_registro\`),
  INDEX \`idx_tickets_fecha_creacion\` (\`fecha_creacion\`),
  INDEX \`idx_tickets_reportante_cedula\` (\`reportante_cedula\`),
  CONSTRAINT \`fk_tickets_categoria\` FOREIGN KEY (\`categoria_id\`) REFERENCES \`categorias\` (\`id\`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA DE TRAZABILIDAD Y BITÁCORA DE INCIDENCIAS
CREATE TABLE IF NOT EXISTS \`trazabilidad_eventos\` (
  \`id\` VARCHAR(60) NOT NULL,
  \`ticket_id\` VARCHAR(50) NOT NULL,
  \`tipo_evento\` ENUM('creacion', 'cambio_estado', 'comentario', 'reasignacion', 'cierre') NOT NULL,
  \`fecha_hora\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`fecha_evento\` DATE NOT NULL,
  \`hora_evento\` TIME NOT NULL,
  \`lugar_evento\` VARCHAR(150) NOT NULL DEFAULT 'Sede Junta Comunal',
  \`responsable\` VARCHAR(120) NOT NULL,
  \`rol_responsable\` VARCHAR(80) NULL,
  \`nota\` TEXT NOT NULL,
  \`estado_anterior\` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NULL,
  \`estado_nuevo\` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NULL,
  \`notificacion_correo_enviada\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`destinatario_correo\` VARCHAR(150) NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_trazabilidad_ticket\` (\`ticket_id\`),
  INDEX \`idx_trazabilidad_tipo\` (\`tipo_evento\`),
  INDEX \`idx_trazabilidad_fecha\` (\`fecha_hora\`),
  INDEX \`idx_trazabilidad_lugar\` (\`lugar_evento\`),
  CONSTRAINT \`fk_trazabilidad_ticket\` FOREIGN KEY (\`ticket_id\` ) REFERENCES \`tickets\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABLA DE ARCHIVOS ADJUNTOS Y EVIDENCIAS
CREATE TABLE IF NOT EXISTS \`adjuntos\` (
  \`id\` VARCHAR(60) NOT NULL,
  \`ticket_id\` VARCHAR(50) NOT NULL,
  \`tipo\` ENUM('foto', 'video', 'documento') NOT NULL DEFAULT 'foto',
  \`nombre\` VARCHAR(255) NOT NULL,
  \`url\` TEXT NOT NULL,
  \`thumbnail_url\` TEXT NULL,
  \`tamano_bytes\` BIGINT NULL,
  \`formato\` VARCHAR(30) NULL,
  \`lugar_captura\` VARCHAR(150) NOT NULL DEFAULT 'Sitio de la Incidencia',
  \`fecha_subida\` DATE NOT NULL,
  \`hora_subida\` TIME NOT NULL,
  \`fecha_hora_subida\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_adjuntos_ticket\` (\`ticket_id\`),
  INDEX \`idx_adjuntos_tipo\` (\`tipo\`),
  CONSTRAINT \`fk_adjuntos_ticket\` FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABLA DE LOGS DE NOTIFICACIONES POR CORREO
CREATE TABLE IF NOT EXISTS \`notificaciones_correo_logs\` (
  \`id\` VARCHAR(60) NOT NULL,
  \`ticket_id\` VARCHAR(50) NULL,
  \`destinatario_email\` VARCHAR(150) NOT NULL,
  \`destinatario_nombre\` VARCHAR(120) NOT NULL,
  \`asunto_correo\` VARCHAR(200) NOT NULL,
  \`tipo_notificacion\` ENUM('nuevo_ticket', 'cambio_estado', 'caso_resuelto', 'bienvenida', 'asignacion') NOT NULL,
  \`origen_despacho\` VARCHAR(150) NOT NULL DEFAULT 'Servidor Central Junta Comunal',
  \`estado_envio\` ENUM('enviado', 'simulado', 'fallido') NOT NULL DEFAULT 'enviado',
  \`fecha_envio\` DATE NOT NULL,
  \`hora_envio\` TIME NOT NULL,
  \`fecha_hora_envio\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_notif_ticket\` (\`ticket_id\`),
  INDEX \`idx_notif_email\` (\`destinatario_email\`),
  INDEX \`idx_notif_fecha\` (\`fecha_hora_envio\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  // Script SQL DML (Seeds) Completo
  const dmlSqlScript = `-- ========================================================================
-- JUNTA COMUNAL - CARGA DE DATOS CENTRALIZADOS Y SEEDS (DML)
-- Inserta: Usuarios RBAC, Categorías, Sectores, Tickets con Nomenclatura,
-- Coordenadas, Trazabilidad, Adjuntos y Logs de Notificación.
-- ========================================================================

USE \`junta_comunal_tickets_db\`;

-- 1. USUARIOS DEL SISTEMA Y ROLES (RBAC)
INSERT INTO \`usuarios\` (\`id\`, \`nombre\`, \`email\`, \`password_hash\`, \`rol\`, \`cedula\`, \`telefono\`, \`sector\`, \`genero\`, \`edad\`, \`departamento\`, \`lugar_registro\`, \`ip_registro\`, \`fecha_registro\`, \`hora_registro\`) VALUES
('usr-admin-01', 'Ing. Carlos Mendoza', 'carlos.mendoza@juntacomunal.gob.pa', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'administrador', '8-340-1289', '+507 6712-4490', 'Altos de Las Cumbres', 'masculino', 46, 'Administración General de la Junta', 'Sede Central Despacho', '192.168.1.10', '2024-01-15', '08:00:00'),
('usr-sup-01', 'Lic. Roberto Díaz', 'roberto.diaz@juntacomunal.gob.pa', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'supervisor', '8-710-9982', '+507 6418-2009', 'Villa Zaita', 'masculino', 41, 'Coordinación Comunitaria y Fiscalización', 'Sede Central Despacho', '192.168.1.15', '2024-03-01', '08:15:00'),
('usr-agent-01', 'Téc. Javier Castillo', 'javier.castillo@juntacomunal.gob.pa', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'agente', '8-802-4412', '+507 6590-3321', 'Nueva Libia', 'masculino', 34, 'Cuadrilla de Obras & Alumbrado', 'Módulo Operativo Norte', '192.168.2.20', '2024-02-10', '09:00:00'),
('usr-agent-02', 'Lic. Sandra Moreno', 'sandra.moreno@juntacomunal.gob.pa', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'agente', '8-904-1182', '+507 6902-1455', 'Gonzalillo', 'femenino', 29, 'Trabajo Social y Asistencia Comunitaria', 'Oficina de Atención Social', '192.168.2.25', '2024-04-12', '10:00:00'),
('usr-user-01', 'María Elena Valdés', 'm.valdes@gmail.com', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'ciudadano', '8-742-1983', '+507 6821-4490', 'Altos de Las Cumbres', 'femenino', 38, 'Residente Comunal', 'Portal Web Ciudadano', '190.140.22.10', '2025-05-10', '08:30:00'),
('usr-user-02', 'Juan Carlos Batista', 'jc.batista@outlook.com', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'ciudadano', '8-612-3341', '+507 6390-1122', 'Gonzalillo', 'masculino', 52, 'Residente Comunal', 'Portal Web Ciudadano', '190.140.22.45', '2025-05-11', '09:15:00'),
('usr-user-03', 'Ana Lucía Gordon', 'ana.gordon@yahoo.com', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'ciudadano', '8-890-2134', '+507 6788-9002', 'Villa Zaita', 'femenino', 26, 'Residente Comunal', 'Ventanilla Junta Comunal', '192.168.1.50', '2025-05-12', '11:00:00')
ON DUPLICATE KEY UPDATE \`nombre\`=VALUES(\`nombre\`), \`rol\`=VALUES(\`rol\`), \`lugar_registro\`=VALUES(\`lugar_registro\`);

-- 2. CATEGORÍAS OFICIALES CON PREFIJOS DE NOMENCLATURA
INSERT INTO \`categorias\` (\`id\`, \`nombre\`, \`prefijo_nomenclatura\`, \`descripcion\`, \`color\`, \`icono\`, \`sla_horas\`, \`activa\`) VALUES
('alumbrado-electrico', 'Alumbrado Eléctrico', 'ALU', 'Reparación de luminarias públicas, postes caídos o dañados, transformadores con chispas y cables expuestos.', '#F59E0B', 'Zap', 24, TRUE),
('agua-potable', 'Agua Potable & Fugas', 'AGU', 'Reporte de tuberías rotas, desbordamiento de aguas servidas, baja presión de agua potable y alcantarillas tapadas.', '#0EA5E9', 'Droplets', 12, TRUE),
('poda-arboles', 'Poda y Árboles en Peligro', 'POD', 'Solicitud de poda preventiva, retiro de ramas sobre tendido eléctrico y árboles caídos por tormentas.', '#10B981', 'TreePine', 48, TRUE),
('ayuda-social', 'Ayuda Social & Comunitaria', 'SOC', 'Solicitud de asistencia a familias vulnerables, medicamentos de urgencia, útiles escolares y apoyo a adultos mayores.', '#EC4899', 'HeartHandshake', 72, TRUE),
('permisos-certificaciones', 'Permisos y Certificaciones', 'CER', 'Trámite de cartas de residencia, constancias comunales, permisos de actividad barrial y fe de vida.', '#8B5CF6', 'FileCheck', 48, TRUE),
('deportes-recreacion', 'Deportes y Recreación', 'DEP', 'Mantenimiento de canchas sintéticas, parques infantiles, luminarias de complejos deportivos y eventos barriales.', '#F97316', 'Trophy', 96, TRUE),
('recoleccion-basura', 'Recolección y Aseo Urbano', 'BAS', 'Puntos críticos de acumulación de desechos, recolección de chatarras y limpieza de quebradas.', '#64748B', 'Trash2', 36, TRUE),
('vias-calles', 'Vías, Aceras & Calles', 'VIA', 'Bacheo de calles comunales, reparación de aceras peatonales, señalización vial y colocación de reductores.', '#6366F1', 'Truck', 120, TRUE)
ON DUPLICATE KEY UPDATE \`nombre\`=VALUES(\`nombre\`), \`prefijo_nomenclatura\`=VALUES(\`prefijo_nomenclatura\`), \`sla_horas\`=VALUES(\`sla_horas\`);

-- 3. SECTORES RESIDENCIALES
INSERT INTO \`sectores\` (\`nombre\`, \`corregimiento\`, \`distrito\`, \`provincia\`, \`zona\`) VALUES
('Altos de Las Cumbres', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Norte'),
('Gonzalillo', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Este'),
('Villa Zaita', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Central'),
('Nueva Libia', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Norte'),
('Lucha Franco', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Oeste'),
('Cumbres del Este', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Este'),
('Las Lajas', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Central'),
('Monserrat', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Norte'),
('San Pablo', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Oeste'),
('Milla 8', 'Las Cumbres', 'Panamá', 'Panamá', 'Sector Sur')
ON DUPLICATE KEY UPDATE \`corregimiento\`=VALUES(\`corregimiento\`);

-- 4. TICKETS REALISTAS CON COORDENADAS, HORA, FECHA Y LUGAR DE REGISTRO
INSERT INTO \`tickets\` (
  \`id\`, \`numero_registro\`, \`asunto\`, \`descripcion\`, \`categoria_id\`, \`categoria_nombre\`,
  \`sector_nombre\`, \`estado\`, \`prioridad\`, \`direccion_detallada\`, \`ubicacion_lat\`, \`ubicacion_lng\`,
  \`lugar_registro\`, \`canal_radicacion\`, \`asignado_a\`, \`departamento\`,
  \`reportante_nombre\`, \`reportante_cedula\`, \`reportante_telefono\`, \`reportante_email\`,
  \`reportante_genero\`, \`reportante_edad\`, \`reportante_sector\`,
  \`fecha_creacion\`, \`hora_creacion\`, \`fecha_hora_registro\`, \`fecha_actualizacion\`
) VALUES
(
  'TK-2025-001', 'ALU-2025-001', 'Poste con transformador chispeando y luminaria rota',
  'En la entrada principal frente a la tienda comunal, el poste #43 tiene la luminaria pública apagada desde hace 4 días y anoche el transformador comenzó a arrojar chispas con el viento.',
  'alumbrado-electrico', 'Alumbrado Eléctrico', 'Altos de Las Cumbres', 'en_progreso', 'urgente',
  'Calle 3ra, frente al minisúper La Unión, casa #12', 9.08340000, -79.53120000,
  'Portal Web Ciudadano', 'web_portal', 'Cuadrilla Eléctrica Norte', 'Servicios Públicos',
  'María Elena Valdés', '8-742-1983', '+507 6821-4490', 'm.valdes@gmail.com', 'femenino', 38, 'Altos de Las Cumbres',
  '2025-05-10', '08:30:00', '2025-05-10 08:30:00', '2025-05-11 14:15:00'
),
(
  'TK-2025-002', 'AGU-2025-002', 'Rotura de tubería madre de 4 pulgadas y anegación de calle',
  'Fuga considerable de agua potable sobre la vía principal. El agua corre como un río hacia las casas bajas y está socavando la base del pavimento.',
  'agua-potable', 'Agua Potable & Fugas', 'Gonzalillo', 'abierto', 'urgente',
  'Vía Principal Gonzalillo, diagonal a la parada de buses', 9.09120000, -79.52450000,
  'Portal Web Ciudadano', 'web_portal', 'Coordinación IDAAN / Junta', 'Aguas y Drenajes',
  'Juan Carlos Batista', '8-612-3341', '+507 6390-1122', 'jc.batista@outlook.com', 'masculino', 52, 'Gonzalillo',
  '2025-05-11', '09:15:00', '2025-05-11 09:15:00', '2025-05-11 09:15:00'
),
(
  'TK-2025-003', 'POD-2025-003', 'Árbol de corotú inclinado a punto de colapsar sobre el tendido',
  'Con las últimas lluvias de mayo, las raíces de un gran árbol cedieron y está recostado sobre los cables de alta tensión. Si cae dejará a todo el sector sin luz.',
  'poda-arboles', 'Poda y Árboles en Peligro', 'Villa Zaita', 'en_progreso', 'alta',
  'Calle Los Eucaliptos, lote 8B', 9.07650000, -79.51890000,
  'Ventanilla de Atención al Ciudadano', 'ventanilla_presencial', 'Cuadrilla de Ornato y Poda', 'Medio Ambiente',
  'Ana Lucía Gordon', '8-890-2134', '+507 6788-9002', 'ana.gordon@yahoo.com', 'femenino', 26, 'Villa Zaita',
  '2025-05-12', '11:00:00', '2025-05-12 11:00:00', '2025-05-13 08:30:00'
),
(
  'TK-2025-004', 'SOC-2025-004', 'Solicitud de apoyo con silla de ruedas y suplemento para adulto mayor',
  'Adulto mayor de 82 años con movilidad reducida requiere con urgencia una silla de ruedas estándar y evaluación para apoyo con canasta básica comunitaria.',
  'ayuda-social', 'Ayuda Social & Comunitaria', 'Nueva Libia', 'resuelto', 'media',
  'Sector 4, Calle B, vereda 15, casa color verde', 9.09800000, -79.53900000,
  'Sede Central Junta Comunal', 'ventanilla_presencial', 'Lic. Sandra Moreno (Trabajadora Social)', 'Desarrollo Social',
  'Pedro Antonio Rivas', '8-234-567', '+507 6210-9844', 'pedro.rivas@gmail.com', 'masculino', 68, 'Nueva Libia',
  '2025-05-08', '14:20:00', '2025-05-08 14:20:00', '2025-05-12 16:45:00'
),
(
  'TK-2025-005', 'CER-2025-005', 'Constancia de residencia comunal y carta de vecindad para trámite bancario',
  'Solicitud formal de certificación de residencia de los últimos 5 años en la comunidad para completar expediente de crédito de vivienda del MIVIOT.',
  'permisos-certificaciones', 'Permisos y Certificaciones', 'Altos de Las Cumbres', 'cerrado', 'baja',
  'Residencial Las Cumbres, Mz 4 Casa 19', 9.08500000, -79.53000000,
  'Portal Web Ciudadano', 'web_portal', 'Secretaría General de la Junta', 'Asesoría Legal',
  'Yolanda Esther Chen', 'PE-12-890', '+507 6500-1122', 'yolanda.chen@outlook.com', 'femenino', 34, 'Altos de Las Cumbres',
  '2025-05-05', '10:00:00', '2025-05-05 10:00:00', '2025-05-07 15:00:00'
),
(
  'TK-2025-006', 'DEP-2025-006', 'Reparación de luminarias de la cancha sintética y malla perimetral',
  'Los reflectores del cuadro de fútbol sala tienen 3 semanas quemados y los jóvenes no pueden practicar en la noche. Además la cerca perimetral está rota en dos tramos.',
  'deportes-recreacion', 'Deportes y Recreación', 'Gonzalillo', 'abierto', 'media',
  'Complejo Deportivo Comunal de Gonzalillo', 9.09300000, -79.52200000,
  'Inspección de Cuadrilla en Campo', 'inspeccion_campo', 'Comité de Deportes Comunal', 'Cultura y Deporte',
  'Manuel De Jesús Morales', '8-501-2290', '+507 6677-8899', 'manuel.morales@gmail.com', 'masculino', 45, 'Gonzalillo',
  '2025-05-13', '16:00:00', '2025-05-13 16:00:00', '2025-05-13 16:00:00'
)
ON DUPLICATE KEY UPDATE \`asunto\`=VALUES(\`asunto\`), \`estado\`=VALUES(\`estado\`), \`lugar_registro\`=VALUES(\`lugar_registro\`);

-- 5. TRAZABILIDAD Y BITÁCORA DETALLADA
INSERT INTO \`trazabilidad_eventos\` (
  \`id\`, \`ticket_id\`, \`tipo_evento\`, \`fecha_hora\`, \`fecha_evento\`, \`hora_evento\`,
  \`lugar_evento\`, \`responsable\`, \`rol_responsable\`, \`nota\`,
  \`estado_anterior\`, \`estado_nuevo\`, \`notificacion_correo_enviada\`, \`destinatario_correo\`
) VALUES
('tr-001-1', 'TK-2025-001', 'creacion', '2025-05-10 08:30:00', '2025-05-10', '08:30:00', 'Portal Web Ciudadano', 'Sistema Web (Ciudadano)', 'Portal Ciudadano', 'Ticket radicado exitosamente por residente vía formulario web.', NULL, 'abierto', TRUE, 'm.valdes@gmail.com'),
('tr-001-2', 'TK-2025-001', 'cambio_estado', '2025-05-10 10:15:00', '2025-05-10', '10:15:00', 'Mesa de Entrada Central', 'Lic. Roberto Díaz', 'Mesa de Entrada', 'Se valida la urgencia del caso por riesgo inminente de corto circuito. Pasa a En Progreso.', 'abierto', 'en_progreso', TRUE, 'm.valdes@gmail.com'),
('tr-001-3', 'TK-2025-001', 'reasignacion', '2025-05-11 09:00:00', '2025-05-11', '09:00:00', 'Despacho de Obras', 'Ing. Carlos Mendoza', 'Supervisor de Obras', 'Asignado a Cuadrilla Eléctrica Norte para cambio de aisladores e inspección de transformador.', 'en_progreso', 'en_progreso', FALSE, 'm.valdes@gmail.com'),
('tr-001-4', 'TK-2025-001', 'comentario', '2025-05-11 14:15:00', '2025-05-11', '14:15:00', 'En Sitio: Altos de Las Cumbres Calle 3ra', 'Téc. Javier Castillo', 'Líder de Cuadrilla', 'Inspección en sitio completada. Se aisló la línea secundaria. Repuestos solicitados a bodega central.', 'en_progreso', 'en_progreso', TRUE, 'm.valdes@gmail.com'),
('tr-002-1', 'TK-2025-002', 'creacion', '2025-05-11 09:15:00', '2025-05-11', '09:15:00', 'Portal Web Ciudadano', 'Sistema Web (Ciudadano)', 'Portal Ciudadano', 'Radicación de emergencia recibida en plataforma.', NULL, 'abierto', TRUE, 'jc.batista@outlook.com'),
('tr-003-1', 'TK-2025-003', 'creacion', '2025-05-12 11:00:00', '2025-05-12', '11:00:00', 'Ventanilla Sede Central', 'Ventanilla Junta Comunal', 'Recepción Presencial', 'Atención directa en despacho de la Junta Comunal con fotografías impresas.', NULL, 'abierto', TRUE, 'ana.gordon@yahoo.com'),
('tr-003-2', 'TK-2025-003', 'cambio_estado', '2025-05-13 08:30:00', '2025-05-13', '08:30:00', 'Oficina de Medio Ambiente', 'Ing. Carlos Mendoza', 'Coordinador Técnico', 'Cuadrilla de motosierras despachada con camión canasta.', 'abierto', 'en_progreso', TRUE, 'ana.gordon@yahoo.com'),
('tr-004-1', 'TK-2025-004', 'creacion', '2025-05-08 14:20:00', '2025-05-08', '14:20:00', 'Sede Central Junta Comunal', 'Lic. Sandra Moreno', 'Trabajo Social', 'Evaluación socioeconómica presencial realizada a familiar del adulto mayor.', NULL, 'abierto', TRUE, 'pedro.rivas@gmail.com'),
('tr-004-2', 'TK-2025-004', 'cierre', '2025-05-12 16:45:00', '2025-05-12', '16:45:00', 'Domicilio del Residente (Nueva Libia)', 'Lic. Sandra Moreno', 'Trabajadora Social', 'Entrega formal de silla de ruedas e insumos en el domicilio del beneficiario con acta firmada.', 'en_progreso', 'resuelto', TRUE, 'pedro.rivas@gmail.com')
ON DUPLICATE KEY UPDATE \`nota\`=VALUES(\`nota\`), \`lugar_evento\`=VALUES(\`lugar_evento\`);

-- 6. ARCHIVOS ADJUNTOS / EVIDENCIAS MULTIMEDIA
INSERT INTO \`adjuntos\` (
  \`id\`, \`ticket_id\`, \`tipo\`, \`nombre\`, \`url\`, \`thumbnail_url\`, \`tamano_bytes\`,
  \`formato\`, \`lugar_captura\`, \`fecha_subida\`, \`hora_subida\`, \`fecha_hora_subida\`
) VALUES
('adj-001', 'TK-2025-001', 'foto', 'poste_chispas.jpg', 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&auto=format&fit=crop&q=80', 2450000, 'image/jpeg', 'Altos de Las Cumbres - Calle 3ra', '2025-05-10', '08:30:00', '2025-05-10 08:30:00'),
('adj-002', 'TK-2025-001', 'video', 'evidencia_chispas_noche.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80', 8400000, 'video/mp4', 'Altos de Las Cumbres - Frente a Tienda', '2025-05-10', '08:32:00', '2025-05-10 08:32:00'),
('adj-003', 'TK-2025-002', 'foto', 'tuberia_rota_inundacion.jpg', 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&auto=format&fit=crop&q=80', 3120000, 'image/jpeg', 'Vía Principal Gonzalillo', '2025-05-11', '09:15:00', '2025-05-11 09:15:00'),
('adj-004', 'TK-2025-004', 'documento', 'acta_entrega_social.pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&auto=format&fit=crop&q=80', 1150000, 'application/pdf', 'Despacho Trabajo Social', '2025-05-12', '16:45:00', '2025-05-12 16:45:00')
ON DUPLICATE KEY UPDATE \`nombre\`=VALUES(\`nombre\`), \`lugar_captura\`=VALUES(\`lugar_captura\`);

-- 7. LOGS DE NOTIFICACIONES AUTOMÁTICAS POR CORREO
INSERT INTO \`notificaciones_correo_logs\` (
  \`id\`, \`ticket_id\`, \`destinatario_email\`, \`destinatario_nombre\`, \`asunto_correo\`,
  \`tipo_notificacion\`, \`origen_despacho\`, \`estado_envio\`, \`fecha_envio\`, \`hora_envio\`, \`fecha_hora_envio\`
) VALUES
('notif-001', 'TK-2025-001', 'm.valdes@gmail.com', 'María Elena Valdés', 'Radicación Exitosa - Ticket ALU-2025-001 (Alumbrado Eléctrico)', 'nuevo_ticket', 'Servidor de Correo Junta Comunal', 'enviado', '2025-05-10', '08:30:05', '2025-05-10 08:30:05'),
('notif-002', 'TK-2025-001', 'm.valdes@gmail.com', 'María Elena Valdés', 'Actualización de Progreso: ALU-2025-001 pasó a En Progreso', 'cambio_estado', 'Mesa de Entrada Central', 'enviado', '2025-05-10', '10:15:10', '2025-05-10 10:15:10'),
('notif-003', 'TK-2025-002', 'jc.batista@outlook.com', 'Juan Carlos Batista', 'Radicación Exitosa - Ticket AGU-2025-002 (Agua Potable & Fugas)', 'nuevo_ticket', 'Servidor de Correo Junta Comunal', 'enviado', '2025-05-11', '09:15:02', '2025-05-11 09:15:02'),
('notif-004', 'TK-2025-004', 'pedro.rivas@gmail.com', 'Pedro Antonio Rivas', 'Caso Resuelto Exitosamente - SOC-2025-004 (Ayuda Social)', 'caso_resuelto', 'Despacho Trabajo Social', 'enviado', '2025-05-12', '16:45:15', '2025-05-12 16:45:15')
ON DUPLICATE KEY UPDATE \`asunto_correo\`=VALUES(\`asunto_correo\`);`;

  // Script SQL Consultas de Auditoría
  const queriesSqlScript = `-- ========================================================================
-- JUNTA COMUNAL - CONSULTAS ÚTILES DE GESTIÓN, AUDITORÍA Y METRICAS
-- Incluye análisis por Lugar de Registro, Cumplimiento de SLA y Eficiencia
-- ========================================================================

-- 1. Vista Consolidada de Incidencias con Trazabilidad y Ubicación
CREATE OR REPLACE VIEW \`vw_tickets_consolidado\` AS
SELECT 
  t.id AS ticket_id,
  t.numero_registro,
  t.asunto,
  t.categoria_nombre,
  c.prefijo_nomenclatura,
  t.sector_nombre,
  t.estado,
  t.prioridad,
  t.lugar_registro,
  t.canal_radicacion,
  t.reportante_nombre,
  t.reportante_cedula,
  t.reportante_telefono,
  t.reportante_email,
  t.fecha_creacion,
  t.hora_creacion,
  t.fecha_hora_registro,
  t.asignado_a,
  t.departamento,
  t.ubicacion_lat,
  t.ubicacion_lng,
  COUNT(DISTINCT tr.id) AS total_hitos_trazabilidad,
  COUNT(DISTINCT a.id) AS total_adjuntos,
  MAX(tr.fecha_hora) AS fecha_ultimo_avance
FROM \`tickets\` t
LEFT JOIN \`categorias\` c ON t.categoria_id = c.id
LEFT JOIN \`trazabilidad_eventos\` tr ON t.id = tr.ticket_id
LEFT JOIN \`adjuntos\` a ON t.id = a.ticket_id
GROUP BY t.id;

-- 2. Reporte de Tickets por Lugar / Origen de Registro
SELECT 
  lugar_registro, 
  canal_radicacion, 
  COUNT(*) AS total_tickets, 
  SUM(CASE WHEN estado = 'abierto' THEN 1 ELSE 0 END) AS abiertos,
  SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) AS en_progreso,
  SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) AS resueltos,
  SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) AS cerrados
FROM \`tickets\`
GROUP BY lugar_registro, canal_radicacion
ORDER BY total_tickets DESC;

-- 3. Análisis de Incidencias por Sector y Rango Horario de Mayor Registro
SELECT 
  sector_nombre,
  HOUR(hora_creacion) AS hora_del_dia,
  COUNT(*) AS cantidad_incidencias
FROM \`tickets\`
GROUP BY sector_nombre, HOUR(hora_creacion)
ORDER BY cantidad_incidencias DESC;

-- 4. Cumplimiento de SLA (Horas transcurridas vs SLA asignado)
SELECT 
  t.numero_registro,
  t.asunto,
  c.nombre AS categoria,
  c.sla_horas,
  t.fecha_hora_registro,
  t.estado,
  TIMESTAMPDIFF(HOUR, t.fecha_hora_registro, NOW()) AS horas_transcurridas,
  CASE 
    WHEN TIMESTAMPDIFF(HOUR, t.fecha_hora_registro, NOW()) > c.sla_horas AND t.estado != 'resuelto' AND t.estado != 'cerrado' 
    THEN 'VENCIDO' 
    ELSE 'DENTRO DE SLA' 
  END AS estado_sla
FROM \`tickets\` t
JOIN \`categorias\` c ON t.categoria_id = c.id;`;

  // Script SQL Unificado (DDL + DML + Queries)
  const unifiedSqlScript = `${ddlSqlScript}

-- ========================================================================
-- CARGA DE DATOS SEED
-- ========================================================================

${dmlSqlScript}

-- ========================================================================
-- VISTAS Y AUDITORÍA
-- ========================================================================

${queriesSqlScript}
`;

  const getCurrentScriptContent = () => {
    switch (selectedScriptType) {
      case 'ddl':
        return ddlSqlScript;
      case 'dml':
        return dmlSqlScript;
      case 'queries':
        return queriesSqlScript;
      case 'unificado':
      default:
        return unifiedSqlScript;
    }
  };

  const copyToClipboard = () => {
    const text = getCurrentScriptContent();
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSqlFile = () => {
    const text = getCurrentScriptContent();
    const filename = `junta_comunal_${selectedScriptType}_mysql.sql`;
    const blob = new Blob([text], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('¿Está seguro de reiniciar los tickets y catálogo a los registros demostrativos oficiales?')) {
      onResetMockData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const databaseTablesBreakdown = [
    {
      name: 'usuarios',
      description: 'Gestión RBAC de funcionarios, cuadrillas de campo y ciudadanos residentes.',
      keyFields: ['id', 'nombre', 'email', 'rol (ENUM)', 'cedula', 'lugar_registro', 'fecha_registro', 'hora_registro', 'activo'],
      recordsCount: '7 registros iniciales',
    },
    {
      name: 'categorias',
      description: 'Catálogo de servicios de la Junta con códigos de nomenclatura (ALU, AGU, POD, etc.) y SLA.',
      keyFields: ['id', 'nombre', 'prefijo_nomenclatura', 'sla_horas', 'color', 'icono', 'activa', 'created_at'],
      recordsCount: '8 categorías oficiales',
    },
    {
      name: 'sectores',
      description: 'Sectores comunitarios y zonas residenciales del corregimiento.',
      keyFields: ['id', 'nombre', 'corregimiento', 'distrito', 'provincia', 'zona', 'activo'],
      recordsCount: '10 sectores residenciales',
    },
    {
      name: 'tickets',
      description: 'Tabla central de incidencias con nomenclatura, coordenadas Google Maps, datos del reportante, fechas y lugar de registro.',
      keyFields: ['id', 'numero_registro', 'asunto', 'categoria_id', 'sector_nombre', 'estado', 'prioridad', 'ubicacion_lat', 'ubicacion_lng', 'lugar_registro', 'canal_radicacion', 'fecha_creacion', 'hora_creacion', 'fecha_hora_registro'],
      recordsCount: '6 tickets completos demo',
    },
    {
      name: 'trazabilidad_eventos',
      description: 'Línea de tiempo cronológica y bitácora técnica de avances por cuadrillas y mesa de entrada.',
      keyFields: ['id', 'ticket_id', 'tipo_evento', 'fecha_hora', 'fecha_evento', 'hora_evento', 'lugar_evento', 'responsable', 'rol_responsable', 'nota', 'notificacion_correo_enviada'],
      recordsCount: '9 hitos de trazabilidad',
    },
    {
      name: 'adjuntos',
      description: 'Evidencias multimedia (fotos, videos, actas y certificados en PDF) con origen de captura.',
      keyFields: ['id', 'ticket_id', 'tipo', 'nombre', 'url', 'thumbnail_url', 'lugar_captura', 'fecha_subida', 'hora_subida', 'fecha_hora_subida'],
      recordsCount: '4 archivos adjuntos',
    },
    {
      name: 'notificaciones_correo_logs',
      description: 'Registro histórico de alertas automáticas despachadas por correo al ciudadano.',
      keyFields: ['id', 'ticket_id', 'destinatario_email', 'asunto_correo', 'origen_despacho', 'estado_envio', 'fecha_envio', 'hora_envio', 'fecha_hora_envio'],
      recordsCount: '4 despachos de correo',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Base de Datos, Scripts SQL & Configuración
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900">
              MySQL 8.0+ / MariaDB
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
            Scripts DDL y DML para cargar todas las tablas con componentes, horas, fechas, lugar de registro y georreferenciación
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetData}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Datos Demo</span>
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Base de datos y catálogo de incidencias reestablecidos con éxito.</span>
        </div>
      )}

      {downloadSuccess && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <span>Archivo SQL descargado con éxito en su carpeta de descargas.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('bd')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'bd'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileCode className="w-4 h-4" />
            Scripts SQL de Carga Completa
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tablas-detalle')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'tablas-detalle'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <TableProperties className="w-4 h-4" />
            Estructura de Tablas ({databaseTablesBreakdown.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('categorias')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'categorias'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Categorías & Nomenclatura ({CATEGORIAS_SISTEMA.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sectores')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'sectores'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Sectores Comunitarios ({SECTORES_RESIDENCIA.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('seguridad')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'seguridad'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Seguridad & Roles RBAC
        </button>
      </div>

      {/* 1. SubTab: Scripts SQL de Carga */}
      {activeSubTab === 'bd' && (
        <div className="space-y-6">
          {/* Information summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Fechas y Horas</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">En Cada Registro</p>
              <p className="text-[11px] text-slate-400">
                Campos <code className="text-blue-500">fecha_creacion</code>, <code className="text-blue-500">hora_creacion</code> y <code className="text-blue-500">fecha_hora_registro</code> incluidos.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Navigation className="w-4 h-4" />
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Lugar de Registro</span>
              </div>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Origen & Canal</p>
              <p className="text-[11px] text-slate-400">
                Identifica si se registró en Portal Web, Ventanilla, Cuadrilla de Campo o Sede.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <MapPin className="w-4 h-4" />
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Georreferenciación</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Google Maps</p>
              <p className="text-[11px] text-slate-400">
                Campos <code className="text-purple-500">ubicacion_lat</code> y <code className="text-purple-500">ubicacion_lng</code> con precisión de 8 decimales.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Nomenclatura</span>
              </div>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">ALU, AGU, POD...</p>
              <p className="text-[11px] text-slate-400">
                Códigos dinámicos secuenciales por tipo de servicio comunitario.
              </p>
            </div>
          </div>

          {/* Script Viewer Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            {/* Sub-selector of script types */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedScriptType('unificado')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedScriptType === 'unificado'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Script Completo (DDL + Seeds + Consultas)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScriptType('ddl')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedScriptType === 'ddl'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Solo Estructura DDL (Tablas)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScriptType('dml')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedScriptType === 'dml'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Solo Carga de Datos DML (Seeds)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScriptType('queries')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedScriptType === 'queries'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Consultas & Auditoría
                </button>
              </div>

              {/* Action Buttons: Copy & Download .sql */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-copy-sql"
                  onClick={copyToClipboard}
                  className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                >
                  {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>

                <button
                  type="button"
                  id="btn-download-sql"
                  onClick={handleDownloadSqlFile}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo .sql</span>
                </button>
              </div>
            </div>

            {/* Code Display Area */}
            <div className="relative">
              <div className="absolute right-3 top-3 px-2 py-1 bg-slate-800 text-[10px] font-mono text-slate-400 rounded-md border border-slate-700">
                MySQL 8.0+ / MariaDB • UTF8mb4
              </div>
              <pre className="p-5 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[500px] leading-relaxed select-all">
                {getCurrentScriptContent()}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 2. SubTab: Desglose de Tablas y Campos */}
      {activeSubTab === 'tablas-detalle' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Inventario de Tablas Creadas en la Base de Datos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Todos los componentes del sistema (usuarios, incidencias, bitácoras, evidencias, sectores y categorías) están vinculados mediante integridad referencial.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {databaseTablesBreakdown.map((t) => (
                <div
                  key={t.name}
                  className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                      `{t.name}`
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {t.recordsCount}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {t.description}
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Campos y Elementos Clave:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {t.keyFields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-mono text-slate-700 dark:text-slate-300"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. SubTab: Categorías */}
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
                  <span className="text-[10px] font-mono text-slate-400">
                    Prefijo: <strong className="text-blue-500">{cat.prefijo || 'TK'}</strong> • SLA: {cat.slaHoras}h
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{cat.descripcion}</p>
            </div>
          ))}
        </div>
      )}

      {/* 4. SubTab: Sectores */}
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

      {/* 5. SubTab: Seguridad y RBAC */}
      {activeSubTab === 'seguridad' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[11px] font-bold">
                Rol: Administrador Superior
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Control Total del Sistema</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Mantenimiento de categorías y SLA</li>
                <li>Asignación de roles y permisos</li>
                <li>Acceso a scripts y base de datos</li>
                <li>Reportes analíticos globales</li>
              </ul>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                Rol: Supervisor Comunal
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Gestión de Cuadrillas</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Asignación de casos a brigadas</li>
                <li>Validación y cambio de estados</li>
                <li>Monitoreo de cumplimiento de SLA</li>
                <li>Despacho de notificaciones</li>
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
                <li>Actualización de estado en sitio</li>
                <li>Carga de evidencias fotográficas</li>
              </ul>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                Rol: Ciudadano Residente
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Portal Público</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Radicación rápida con ubicación</li>
                <li>Consulta de casos sin login</li>
                <li>Recepción de alertas por correo</li>
                <li>Seguimiento en tiempo real</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
