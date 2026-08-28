-- ========================================================================
-- JUNTA COMUNAL - SISTEMA CENTRALIZADO DE GESTIÓN DE INCIDENCIAS
-- Esquema de Base de Datos MySQL / MariaDB (InnoDB, UTF8mb4)
-- Incluye: Estructura DDL, Carga de Datos DML (Seeds), Fechas, Horas y
-- Lugar/Origen de Registro Georreferenciado para Todos los Componentes.
-- ========================================================================

CREATE DATABASE IF NOT EXISTS `junta_comunal_tickets_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `junta_comunal_tickets_db`;

-- ========================================================================
-- 1. ESTRUCTURA DE TABLAS (DDL)
-- ========================================================================

-- ------------------------------------------------------------------------
-- 1.1 TABLA DE USUARIOS Y ROLES (RBAC)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('administrador', 'supervisor', 'agente', 'ciudadano', 'usuario', 'usuario_reportante') NOT NULL DEFAULT 'ciudadano',
  `cedula` VARCHAR(30) NULL,
  `telefono` VARCHAR(30) NULL,
  `sector` VARCHAR(120) NULL,
  `genero` ENUM('femenino', 'masculino', 'otro') NULL,
  `edad` INT NULL,
  `avatar_url` VARCHAR(255) NULL,
  `departamento` VARCHAR(100) NULL,
  `lugar_registro` VARCHAR(150) NOT NULL DEFAULT 'Portal Web Ciudadano',
  `ip_registro` VARCHAR(50) NULL DEFAULT '190.140.22.10',
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `fecha_registro` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `hora_registro` TIME NOT NULL DEFAULT (CURRENT_TIME),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_usuarios_email` (`email`),
  INDEX `idx_usuarios_cedula` (`cedula`),
  INDEX `idx_usuarios_rol` (`rol`),
  INDEX `idx_usuarios_lugar` (`lugar_registro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 1.2 TABLA DE CATEGORÍAS DE INCIDENCIA
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` VARCHAR(60) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `prefijo_nomenclatura` VARCHAR(10) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `color` VARCHAR(20) NOT NULL DEFAULT '#0066FF',
  `icono` VARCHAR(50) NOT NULL DEFAULT 'Tag',
  `sla_horas` INT NOT NULL DEFAULT 48,
  `activa` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_categorias_prefijo` (`prefijo_nomenclatura`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 1.3 TABLA DE SECTORES RESIDENCIALES Y COMUNITARIOS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sectores` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `nombre` VARCHAR(120) NOT NULL UNIQUE,
  `corregimiento` VARCHAR(100) NOT NULL DEFAULT 'Las Cumbres',
  `distrito` VARCHAR(100) NOT NULL DEFAULT 'Panamá',
  `provincia` VARCHAR(100) NOT NULL DEFAULT 'Panamá',
  `zona` VARCHAR(50) NOT NULL DEFAULT 'Sector Residencial',
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sectores_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 1.4 TABLA PRINCIPAL DE TICKETS / INCIDENCIAS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` VARCHAR(50) NOT NULL,
  `numero_registro` VARCHAR(50) NOT NULL UNIQUE,
  `asunto` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `categoria_id` VARCHAR(60) NOT NULL,
  `categoria_nombre` VARCHAR(100) NOT NULL,
  `sector_nombre` VARCHAR(120) NOT NULL,
  `estado` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NOT NULL DEFAULT 'abierto',
  `prioridad` ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
  `direccion_detallada` VARCHAR(255) NULL,
  `ubicacion_lat` DECIMAL(10, 8) NULL DEFAULT 9.0834,
  `ubicacion_lng` DECIMAL(11, 8) NULL DEFAULT -79.5312,
  `lugar_registro` VARCHAR(150) NOT NULL DEFAULT 'Portal Web Ciudadano',
  `canal_radicacion` ENUM('web_portal', 'ventanilla_presencial', 'inspeccion_campo', 'whatsapp_comunal', 'llamada_telefonica') NOT NULL DEFAULT 'web_portal',
  `asignado_a` VARCHAR(120) NULL,
  `departamento` VARCHAR(100) NULL,
  `reportante_nombre` VARCHAR(120) NOT NULL,
  `reportante_cedula` VARCHAR(30) NOT NULL,
  `reportante_telefono` VARCHAR(30) NULL,
  `reportante_email` VARCHAR(150) NULL,
  `reportante_genero` ENUM('femenino', 'masculino', 'otro') NOT NULL,
  `reportante_edad` INT NOT NULL DEFAULT 30,
  `reportante_sector` VARCHAR(120) NOT NULL,
  `fecha_creacion` DATE NOT NULL,
  `hora_creacion` TIME NOT NULL,
  `fecha_hora_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_cierre` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_tickets_numero_registro` (`numero_registro`),
  INDEX `idx_tickets_categoria` (`categoria_id`),
  INDEX `idx_tickets_estado` (`estado`),
  INDEX `idx_tickets_prioridad` (`prioridad`),
  INDEX `idx_tickets_sector` (`sector_nombre`),
  INDEX `idx_tickets_lugar_registro` (`lugar_registro`),
  INDEX `idx_tickets_fecha_creacion` (`fecha_creacion`),
  INDEX `idx_tickets_reportante_cedula` (`reportante_cedula`),
  CONSTRAINT `fk_tickets_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 1.5 TABLA DE TRAZABILIDAD Y BITÁCORA DE INCIDENCIAS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trazabilidad_eventos` (
  `id` VARCHAR(60) NOT NULL,
  `ticket_id` VARCHAR(50) NOT NULL,
  `tipo_evento` ENUM('creacion', 'cambio_estado', 'comentario', 'reasignacion', 'cierre') NOT NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_evento` DATE NOT NULL,
  `hora_evento` TIME NOT NULL,
  `lugar_evento` VARCHAR(150) NOT NULL DEFAULT 'Sede Junta Comunal',
  `responsable` VARCHAR(120) NOT NULL,
  `rol_responsable` VARCHAR(80) NULL,
  `nota` TEXT NOT NULL,
  `estado_anterior` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NULL,
  `estado_nuevo` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NULL,
  `notificacion_correo_enviada` BOOLEAN NOT NULL DEFAULT FALSE,
  `destinatario_correo` VARCHAR(150) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_trazabilidad_ticket` (`ticket_id`),
  INDEX `idx_trazabilidad_tipo` (`tipo_evento`),
  INDEX `idx_trazabilidad_fecha` (`fecha_hora`),
  INDEX `idx_trazabilidad_lugar` (`lugar_evento`),
  CONSTRAINT `fk_trazabilidad_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 1.6 TABLA DE ARCHIVOS ADJUNTOS Y EVIDENCIAS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `adjuntos` (
  `id` VARCHAR(60) NOT NULL,
  `ticket_id` VARCHAR(50) NOT NULL,
  `tipo` ENUM('foto', 'video', 'documento') NOT NULL DEFAULT 'foto',
  `nombre` VARCHAR(255) NOT NULL,
  `url` TEXT NOT NULL,
  `thumbnail_url` TEXT NULL,
  `tamano_bytes` BIGINT NULL,
  `formato` VARCHAR(30) NULL,
  `lugar_captura` VARCHAR(150) NOT NULL DEFAULT 'Sitio de la Incidencia',
  `fecha_subida` DATE NOT NULL,
  `hora_subida` TIME NOT NULL,
  `fecha_hora_subida` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_adjuntos_ticket` (`ticket_id`),
  INDEX `idx_adjuntos_tipo` (`tipo`),
  CONSTRAINT `fk_adjuntos_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 1.7 TABLA DE LOGS DE NOTIFICACIONES POR CORREO
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notificaciones_correo_logs` (
  `id` VARCHAR(60) NOT NULL,
  `ticket_id` VARCHAR(50) NULL,
  `destinatario_email` VARCHAR(150) NOT NULL,
  `destinatario_nombre` VARCHAR(120) NOT NULL,
  `asunto_correo` VARCHAR(200) NOT NULL,
  `tipo_notificacion` ENUM('nuevo_ticket', 'cambio_estado', 'caso_resuelto', 'bienvenida', 'asignacion') NOT NULL,
  `origen_despacho` VARCHAR(150) NOT NULL DEFAULT 'Servidor Central Junta Comunal',
  `estado_envio` ENUM('enviado', 'simulado', 'fallido') NOT NULL DEFAULT 'enviado',
  `fecha_envio` DATE NOT NULL,
  `hora_envio` TIME NOT NULL,
  `fecha_hora_envio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notif_ticket` (`ticket_id`),
  INDEX `idx_notif_email` (`destinatario_email`),
  INDEX `idx_notif_fecha` (`fecha_hora_envio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ========================================================================
-- 2. CARGA DE DATOS CENTRALIZADOS Y REGISTROS INICIALES (SEEDS / DML)
-- ========================================================================

-- 2.1 USUARIOS DEL SISTEMA Y ROLES (RBAC)
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol`, `cedula`, `telefono`, `sector`, `genero`, `edad`, `departamento`, `lugar_registro`, `ip_registro`, `fecha_registro`, `hora_registro`) VALUES
('usr-admin-01', 'Ing. Carlos Mendoza', 'carlos.mendoza@juntacomunal.gob.pa', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'administrador', '8-340-1289', '+507 6712-4490', 'Altos de Las Cumbres', 'masculino', 46, 'Administración General de la Junta', 'Sede Central Despacho', '192.168.1.10', '2024-01-15', '08:00:00'),
('usr-sup-01', 'Lic. Roberto Díaz', 'roberto.diaz@juntacomunal.gob.pa', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'supervisor', '8-710-9982', '+507 6418-2009', 'Villa Zaita', 'masculino', 41, 'Coordinación Comunitaria y Fiscalización', 'Sede Central Despacho', '192.168.1.15', '2024-03-01', '08:15:00'),
('usr-agent-01', 'Téc. Javier Castillo', 'javier.castillo@juntacomunal.gob.pa', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'agente', '8-802-4412', '+507 6590-3321', 'Nueva Libia', 'masculino', 34, 'Cuadrilla de Obras & Alumbrado', 'Módulo Operativo Norte', '192.168.2.20', '2024-02-10', '09:00:00'),
('usr-agent-02', 'Lic. Sandra Moreno', 'sandra.moreno@juntacomunal.gob.pa', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'agente', '8-904-1182', '+507 6902-1455', 'Gonzalillo', 'femenino', 29, 'Trabajo Social y Asistencia Comunitaria', 'Oficina de Atención Social', '192.168.2.25', '2024-04-12', '10:00:00'),
('usr-user-01', 'María Elena Valdés', 'm.valdes@gmail.com', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'ciudadano', '8-742-1983', '+507 6821-4490', 'Altos de Las Cumbres', 'femenino', 38, 'Residente Comunal', 'Portal Web Ciudadano', '190.140.22.10', '2025-05-10', '08:30:00'),
('usr-user-02', 'Juan Carlos Batista', 'jc.batista@outlook.com', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'ciudadano', '8-612-3341', '+507 6390-1122', 'Gonzalillo', 'masculino', 52, 'Residente Comunal', 'Portal Web Ciudadano', '190.140.22.45', '2025-05-11', '09:15:00'),
('usr-user-03', 'Ana Lucía Gordon', 'ana.gordon@yahoo.com', '$2a$12$eX51V.K045/U70v15M8y3eT3d41K7928k52L90P', 'ciudadano', '8-890-2134', '+507 6788-9002', 'Villa Zaita', 'femenino', 26, 'Residente Comunal', 'Ventanilla Junta Comunal', '192.168.1.50', '2025-05-12', '11:00:00')
ON DUPLICATE KEY UPDATE `nombre`=VALUES(`nombre`), `rol`=VALUES(`rol`), `lugar_registro`=VALUES(`lugar_registro`);

-- 2.2 CATEGORÍAS OFICIALES
INSERT INTO `categorias` (`id`, `nombre`, `prefijo_nomenclatura`, `descripcion`, `color`, `icono`, `sla_horas`, `activa`) VALUES
('alumbrado-electrico', 'Alumbrado Eléctrico', 'ALU', 'Reparación de luminarias públicas, postes caídos o dañados, transformadores con chispas y cables expuestos.', '#F59E0B', 'Zap', 24, TRUE),
('agua-potable', 'Agua Potable & Fugas', 'AGU', 'Reporte de tuberías rotas, desbordamiento de aguas servidas, baja presión de agua potable y alcantarillas tapadas.', '#0EA5E9', 'Droplets', 12, TRUE),
('poda-arboles', 'Poda y Árboles en Peligro', 'POD', 'Solicitud de poda preventiva, retiro de ramas sobre tendido eléctrico y árboles caídos por tormentas.', '#10B981', 'TreePine', 48, TRUE),
('ayuda-social', 'Ayuda Social & Comunitaria', 'SOC', 'Solicitud de asistencia a familias vulnerables, medicamentos de urgencia, útiles escolares y apoyo a adultos mayores.', '#EC4899', 'HeartHandshake', 72, TRUE),
('permisos-certificaciones', 'Permisos y Certificaciones', 'CER', 'Trámite de cartas de residencia, constancias comunales, permisos de actividad barrial y fe de vida.', '#8B5CF6', 'FileCheck', 48, TRUE),
('deportes-recreacion', 'Deportes y Recreación', 'DEP', 'Mantenimiento de canchas sintéticas, parques infantiles, luminarias de complejos deportivos y eventos barriales.', '#F97316', 'Trophy', 96, TRUE),
('recoleccion-basura', 'Recolección y Aseo Urbano', 'BAS', 'Puntos críticos de acumulación de desechos, recolección de chatarras y limpieza de quebradas.', '#64748B', 'Trash2', 36, TRUE),
('vias-calles', 'Vías, Aceras & Calles', 'VIA', 'Bacheo de calles comunales, reparación de aceras peatonales, señalización vial y colocación de reductores.', '#6366F1', 'Truck', 120, TRUE)
ON DUPLICATE KEY UPDATE `nombre`=VALUES(`nombre`), `prefijo_nomenclatura`=VALUES(`prefijo_nomenclatura`), `sla_horas`=VALUES(`sla_horas`);

-- 2.3 SECTORES COMUNITARIOS
INSERT INTO `sectores` (`nombre`, `corregimiento`, `distrito`, `provincia`, `zona`) VALUES
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
ON DUPLICATE KEY UPDATE `corregimiento`=VALUES(`corregimiento`);

-- 2.4 TICKETS DE EJEMPLO REALISTAS CON COORDENADAS, HORA, FECHA Y LUGAR DE REGISTRO
INSERT INTO `tickets` (
  `id`, `numero_registro`, `asunto`, `descripcion`, `categoria_id`, `categoria_nombre`,
  `sector_nombre`, `estado`, `prioridad`, `direccion_detallada`, `ubicacion_lat`, `ubicacion_lng`,
  `lugar_registro`, `canal_radicacion`, `asignado_a`, `departamento`,
  `reportante_nombre`, `reportante_cedula`, `reportante_telefono`, `reportante_email`,
  `reportante_genero`, `reportante_edad`, `reportante_sector`,
  `fecha_creacion`, `hora_creacion`, `fecha_hora_registro`, `fecha_actualizacion`
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
ON DUPLICATE KEY UPDATE `asunto`=VALUES(`asunto`), `estado`=VALUES(`estado`), `lugar_registro`=VALUES(`lugar_registro`);

-- 2.5 TRAZABILIDAD Y BITÁCORA DETALLADA
INSERT INTO `trazabilidad_eventos` (
  `id`, `ticket_id`, `tipo_evento`, `fecha_hora`, `fecha_evento`, `hora_evento`,
  `lugar_evento`, `responsable`, `rol_responsable`, `nota`,
  `estado_anterior`, `estado_nuevo`, `notificacion_correo_enviada`, `destinatario_correo`
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
ON DUPLICATE KEY UPDATE `nota`=VALUES(`nota`), `lugar_evento`=VALUES(`lugar_evento`);

-- 2.6 ARCHIVOS ADJUNTOS / EVIDENCIAS MULTIMEDIA
INSERT INTO `adjuntos` (
  `id`, `ticket_id`, `tipo`, `nombre`, `url`, `thumbnail_url`, `tamano_bytes`,
  `formato`, `lugar_captura`, `fecha_subida`, `hora_subida`, `fecha_hora_subida`
) VALUES
('adj-001', 'TK-2025-001', 'foto', 'poste_chispas.jpg', 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&auto=format&fit=crop&q=80', 2450000, 'image/jpeg', 'Altos de Las Cumbres - Calle 3ra', '2025-05-10', '08:30:00', '2025-05-10 08:30:00'),
('adj-002', 'TK-2025-001', 'video', 'evidencia_chispas_noche.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80', 8400000, 'video/mp4', 'Altos de Las Cumbres - Frente a Tienda', '2025-05-10', '08:32:00', '2025-05-10 08:32:00'),
('adj-003', 'TK-2025-002', 'foto', 'tuberia_rota_inundacion.jpg', 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&auto=format&fit=crop&q=80', 3120000, 'image/jpeg', 'Vía Principal Gonzalillo', '2025-05-11', '09:15:00', '2025-05-11 09:15:00'),
('adj-004', 'TK-2025-004', 'documento', 'acta_entrega_social.pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&auto=format&fit=crop&q=80', 1150000, 'application/pdf', 'Despacho Trabajo Social', '2025-05-12', '16:45:00', '2025-05-12 16:45:00')
ON DUPLICATE KEY UPDATE `nombre`=VALUES(`nombre`), `lugar_captura`=VALUES(`lugar_captura`);

-- 2.7 LOGS DE NOTIFICACIONES AUTOMÁTICAS POR CORREO
INSERT INTO `notificaciones_correo_logs` (
  `id`, `ticket_id`, `destinatario_email`, `destinatario_nombre`, `asunto_correo`,
  `tipo_notificacion`, `origen_despacho`, `estado_envio`, `fecha_envio`, `hora_envio`, `fecha_hora_envio`
) VALUES
('notif-001', 'TK-2025-001', 'm.valdes@gmail.com', 'María Elena Valdés', 'Radicación Exitosa - Ticket ALU-2025-001 (Alumbrado Eléctrico)', 'nuevo_ticket', 'Servidor de Correo Junta Comunal', 'enviado', '2025-05-10', '08:30:05', '2025-05-10 08:30:05'),
('notif-002', 'TK-2025-001', 'm.valdes@gmail.com', 'María Elena Valdés', 'Actualización de Progreso: ALU-2025-001 pasó a En Progreso', 'cambio_estado', 'Mesa de Entrada Central', 'enviado', '2025-05-10', '10:15:10', '2025-05-10 10:15:10'),
('notif-003', 'TK-2025-002', 'jc.batista@outlook.com', 'Juan Carlos Batista', 'Radicación Exitosa - Ticket AGU-2025-002 (Agua Potable & Fugas)', 'nuevo_ticket', 'Servidor de Correo Junta Comunal', 'enviado', '2025-05-11', '09:15:02', '2025-05-11 09:15:02'),
('notif-004', 'TK-2025-004', 'pedro.rivas@gmail.com', 'Pedro Antonio Rivas', 'Caso Resuelto Exitosamente - SOC-2025-004 (Ayuda Social)', 'caso_resuelto', 'Despacho Trabajo Social', 'enviado', '2025-05-12', '16:45:15', '2025-05-12 16:45:15')
ON DUPLICATE KEY UPDATE `asunto_correo`=VALUES(`asunto_correo`);

-- ========================================================================
-- 3. VISTAS Y CONSULTAS ÚTILES DE GESTIÓN Y AUDITORÍA
-- ========================================================================

-- 3.1 Vista: Consolidado de Incidencias con Trazabilidad y Lugar de Registro
CREATE OR REPLACE VIEW `vw_tickets_consolidado` AS
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
FROM `tickets` t
LEFT JOIN `categorias` c ON t.categoria_id = c.id
LEFT JOIN `trazabilidad_eventos` tr ON t.id = tr.ticket_id
LEFT JOIN `adjuntos` a ON t.id = a.ticket_id
GROUP BY t.id;

-- 3.2 Consulta: Resumen de Incidencias por Lugar / Origen de Registro
-- SELECT lugar_registro, canal_radicacion, COUNT(*) AS total_tickets, 
--        SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) AS total_resueltos
-- FROM `tickets`
-- GROUP BY lugar_registro, canal_radicacion;
