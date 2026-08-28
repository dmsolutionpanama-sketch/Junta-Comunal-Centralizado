-- ========================================================================
-- SISTEMA DE GESTIÓN DE TICKETS E INCIDENCIAS MUNICIPALES
-- Esquema de Base de Datos MySQL Centralizada (InnoDB, UTF8mb4)
-- ========================================================================

CREATE DATABASE IF NOT EXISTS `tickets_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tickets_db`;

-- 1. Tabla de Usuarios y Roles (RBAC)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('administrador', 'agente', 'usuario', 'supervisor') NOT NULL DEFAULT 'usuario',
  `avatar_url` VARCHAR(255) NULL,
  `departamento` VARCHAR(100) NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_usuarios_email` (`email`),
  INDEX `idx_usuarios_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla Centralizada: Categorías de Caso (Sección 8)
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` VARCHAR(60) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `descripcion` TEXT NOT NULL,
  `color` VARCHAR(20) NOT NULL DEFAULT '#0066FF',
  `icono` VARCHAR(50) NOT NULL DEFAULT 'Tag',
  `sla_horas` INT NOT NULL DEFAULT 48,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla Centralizada: Sectores de Residencia (Sección 9)
CREATE TABLE IF NOT EXISTS `sectores` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `nombre` VARCHAR(120) NOT NULL UNIQUE,
  `corregimiento` VARCHAR(100) NOT NULL DEFAULT 'Las Cumbres',
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sectores_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Tickets
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` VARCHAR(50) NOT NULL,
  `numero_registro` VARCHAR(50) NOT NULL UNIQUE,
  `asunto` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `categoria_id` VARCHAR(60) NOT NULL,
  `sector_nombre` VARCHAR(120) NOT NULL,
  `estado` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NOT NULL DEFAULT 'abierto',
  `prioridad` ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
  `direccion_detallada` VARCHAR(255) NULL,
  `ubicacion_lat` DECIMAL(10, 8) NULL DEFAULT 9.0820,
  `ubicacion_lng` DECIMAL(11, 8) NULL DEFAULT -79.5280,
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
  `fecha_actualizacion` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_tickets_categoria` (`categoria_id`),
  INDEX `idx_tickets_estado` (`estado`),
  INDEX `idx_tickets_prioridad` (`prioridad`),
  INDEX `idx_tickets_sector` (`sector_nombre`),
  INDEX `idx_tickets_fecha` (`fecha_creacion`),
  CONSTRAINT `fk_tickets_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Trazabilidad y Bitácora
CREATE TABLE IF NOT EXISTS `trazabilidad_eventos` (
  `id` VARCHAR(60) NOT NULL,
  `ticket_id` VARCHAR(50) NOT NULL,
  `tipo_evento` ENUM('creacion', 'cambio_estado', 'comentario', 'reasignacion', 'cierre') NOT NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `responsable` VARCHAR(120) NOT NULL,
  `rol_responsable` VARCHAR(80) NULL,
  `nota` TEXT NOT NULL,
  `estado_anterior` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NULL,
  `estado_nuevo` ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_trazabilidad_ticket` (`ticket_id`),
  CONSTRAINT `fk_trazabilidad_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla de Archivos Adjuntos (Fotos, Videos, Documentos)
CREATE TABLE IF NOT EXISTS `adjuntos` (
  `id` VARCHAR(60) NOT NULL,
  `ticket_id` VARCHAR(50) NOT NULL,
  `tipo` ENUM('foto', 'video', 'documento') NOT NULL DEFAULT 'foto',
  `nombre` VARCHAR(255) NOT NULL,
  `url` TEXT NOT NULL,
  `thumbnail_url` TEXT NULL,
  `tamano_bytes` BIGINT NULL,
  `fecha_subida` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_adjuntos_ticket` (`ticket_id`),
  CONSTRAINT `fk_adjuntos_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
