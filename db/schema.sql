-- =========================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS MYSQL (SISTEMA DE GESTIÓN DE TICKETS)
-- Sección 10: Tablas de tickets, reportantes, adjuntos, trazabilidad y maestros
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `ticket_helpdesk_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `ticket_helpdesk_db`;

-- 1. Tabla de Categorías de Caso (Sección 8)
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  `color` VARCHAR(20) DEFAULT '#0066FF',
  `icono` VARCHAR(50) DEFAULT 'HelpCircle',
  `sla_horas` INT DEFAULT 48,
  `activo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabla de Sectores de Residencia (Sección 9)
CREATE TABLE IF NOT EXISTS `sectores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(120) NOT NULL UNIQUE,
  `activo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Tabla de Usuarios Administrativos / Agentes
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('administrador', 'agente', 'supervisor') DEFAULT 'agente',
  `departamento` VARCHAR(100) NULL,
  `avatar_url` TEXT NULL,
  `activo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabla de Tickets (Incidencias y Solicitudes)
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `numero_registro` VARCHAR(20) NOT NULL UNIQUE,
  `asunto` VARCHAR(255) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `categoria_id` VARCHAR(50) NOT NULL,
  `estado` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') DEFAULT 'abierto',
  `prioridad` ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
  `sector_id` VARCHAR(120) NOT NULL,
  `ubicacion_lat` DECIMAL(10, 8) NULL,
  `ubicacion_lng` DECIMAL(11, 8) NULL,
  `direccion_detallada` VARCHAR(255) NULL,
  `fecha_creacion` DATE NOT NULL,
  `hora_creacion` TIME NOT NULL,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `asignado_a` VARCHAR(36) NULL,
  INDEX `idx_tickets_estado` (`estado`),
  INDEX `idx_tickets_categoria` (`categoria_id`),
  INDEX `idx_tickets_sector` (`sector_id`),
  INDEX `idx_tickets_fecha` (`fecha_creacion`),
  CONSTRAINT `fk_tickets_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_asignado` FOREIGN KEY (`asignado_a`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Tabla de Reportantes (Datos Privados de Contacto y Demográficos)
-- IMPORTANTE: Excluidos por diseño en la consulta pública de tickets
CREATE TABLE IF NOT EXISTS `reportantes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` VARCHAR(36) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `cedula` VARCHAR(30) NOT NULL,
  `telefono` VARCHAR(30) NULL,
  `email` VARCHAR(120) NULL,
  `genero` ENUM('femenino', 'masculino', 'otro') DEFAULT 'otro',
  `edad` INT NOT NULL,
  `sector` VARCHAR(120) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reportantes_genero` (`genero`),
  INDEX `idx_reportantes_edad` (`edad`),
  CONSTRAINT `fk_reportantes_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Tabla de Adjuntos (Fotos, Videos, Documentos PDF)
CREATE TABLE IF NOT EXISTS `adjuntos` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `ticket_id` VARCHAR(36) NOT NULL,
  `tipo` ENUM('foto', 'video', 'documento') NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `url_archivo` TEXT NOT NULL,
  `thumbnail_url` TEXT NULL,
  `tamano_bytes` BIGINT NULL,
  `fecha_subida` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_adjuntos_ticket` (`ticket_id`),
  CONSTRAINT `fk_adjuntos_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Tabla de Trazabilidad (Línea de tiempo cronológica de eventos)
CREATE TABLE IF NOT EXISTS `trazabilidad` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `ticket_id` VARCHAR(36) NOT NULL,
  `tipo_evento` ENUM('creacion', 'cambio_estado', 'comentario', 'reasignacion', 'cierre') NOT NULL,
  `fecha_hora` DATETIME NOT NULL,
  `responsable` VARCHAR(150) NOT NULL,
  `rol_responsable` VARCHAR(50) NULL,
  `nota` TEXT NOT NULL,
  `estado_anterior` VARCHAR(20) NULL,
  `estado_nuevo` VARCHAR(20) NULL,
  INDEX `idx_trazabilidad_ticket` (`ticket_id`),
  INDEX `idx_trazabilidad_fecha` (`fecha_hora`),
  CONSTRAINT `fk_trazabilidad_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
