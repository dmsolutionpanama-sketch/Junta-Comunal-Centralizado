# Configuración de Base de Datos MySQL - Sistema de Gestión de Tickets

Este proyecto incluye una arquitectura desacoplada para operar con datos en memoria/mock durante la etapa inicial y conectarse de manera inmediata a **MySQL** cuando esté listo.

---

## 1. Variables de Entorno (.env)

Crea o actualiza tu archivo `.env` en la raíz del proyecto:

```env
# Configuración del Servidor Express
PORT=3000
NODE_ENV=production

# Configuración de Conexión a MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ticket_helpdesk_db
DB_USER=root
DB_PASSWORD=tu_contraseña_segura
DB_SSL=false
```

---

## 2. Inicialización de la Base de Datos

Para crear la base de datos y todas las tablas con sus índices y relaciones foráneas:

```bash
mysql -u root -p < db/schema.sql
```

---

## 3. Diccionario de Entidades y Campos (Sección 10)

### 📋 Tabla `tickets`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(36) PK | Identificador único / UUID |
| `numero_registro` | VARCHAR(20) UNIQUE | Código público del ticket (ej. `TK-2025-001`) |
| `asunto` | VARCHAR(255) | Título conciso del reporte |
| `descripcion` | TEXT | Detalle exhaustivo de la incidencia |
| `categoria_id` | VARCHAR(50) FK | Relación con la categoría de caso (`categorias.id`) |
| `estado` | ENUM | `abierto`, `en_progreso`, `resuelto`, `cerrado` |
| `prioridad` | ENUM | `baja`, `media`, `alta`, `urgente` |
| `sector_id` | VARCHAR(120) | Nombre del sector de residencia |
| `ubicacion_lat` | DECIMAL(10,8) | Latitud GPS del lugar de la incidencia |
| `ubicacion_lng` | DECIMAL(11,8) | Longitud GPS del lugar de la incidencia |
| `direccion_detallada` | VARCHAR(255) | Punto de referencia o dirección escrita |
| `fecha_creacion` | DATE | Fecha en que se radicó el caso |
| `hora_creacion` | TIME | Hora en que se radicó el caso |
| `fecha_actualizacion`| TIMESTAMP | Última actualización registrada |
| `asignado_a` | VARCHAR(36) FK | Funcionario o técnico asignado |

---

### 👤 Tabla `reportantes` *(Datos privados protegidos)*
> **Regla de Privacidad:** Estos campos NUNCA se exponen en la consulta pública de tickets.
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador del registro |
| `ticket_id` | VARCHAR(36) FK | Relación con el ticket (`tickets.id`) |
| `nombre` | VARCHAR(150) | Nombre completo del ciudadano |
| `cedula` | VARCHAR(30) | Cédula de identidad personal |
| `telefono` | VARCHAR(30) | Teléfono de contacto |
| `email` | VARCHAR(120) | Correo electrónico |
| `genero` | ENUM | `femenino`, `masculino`, `otro` (para corte del Dashboard) |
| `edad` | INT | Edad del reportante (para corte por rangos de edad) |
| `sector` | VARCHAR(120) | Sector de residencia |

---

### 📎 Tabla `adjuntos`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(36) PK | Identificador del adjunto |
| `ticket_id` | VARCHAR(36) FK | Relación con el ticket |
| `tipo` | ENUM | `foto`, `video`, `documento` (PDF) |
| `nombre` | VARCHAR(255) | Nombre del archivo |
| `url_archivo` | TEXT | URL de descarga o almacenamiento |
| `thumbnail_url` | TEXT | Miniatura para fotos o carátula de video |
| `tamano_bytes` | BIGINT | Tamaño en bytes |
| `fecha_subida` | TIMESTAMP | Momento de carga |

---

### ⏱️ Tabla `trazabilidad`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(36) PK | Identificador del evento |
| `ticket_id` | VARCHAR(36) FK | Relación con el ticket |
| `tipo_evento` | ENUM | `creacion`, `cambio_estado`, `comentario`, `reasignacion`, `cierre` |
| `fecha_hora` | DATETIME | Momento exacto en que ocurrió |
| `responsable` | VARCHAR(150) | Usuario interno que ejecutó la acción |
| `rol_responsable` | VARCHAR(50) | Área o cargo del responsable |
| `nota` | TEXT | Bitácora, justificación o comentario |
| `estado_anterior`| VARCHAR(20) | Estado previo |
| `estado_nuevo` | VARCHAR(20) | Nuevo estado resultante |
