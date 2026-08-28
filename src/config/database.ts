/**
 * Configuración de Conexión a Base de Datos MySQL
 * Sección 10 del prompt.
 * 
 * Este archivo define la estructura de conexión y mapeo para cuando se
 * conecte la base de datos de producción MySQL.
 */

export interface MySQLConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  connectionLimit?: number;
  ssl?: boolean;
}

export const defaultMySQLConfig: MySQLConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'ticket_helpdesk_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  connectionLimit: 10,
  ssl: process.env.DB_SSL === 'true',
};

/**
 * Diccionario de Entidades y Campos de la Base de Datos
 */
export const DB_ENTITIES_REFERENCE = {
  tickets: {
    tableName: 'tickets',
    description: 'Registro central de incidencias y solicitudes reportadas',
    fields: [
      { name: 'id', type: 'VARCHAR(36)', description: 'Identificador único o UUID' },
      { name: 'numero_registro', type: 'VARCHAR(20) UNIQUE', description: 'Código público del ticket (ej. TK-2025-001)' },
      { name: 'asunto', type: 'VARCHAR(255)', description: 'Título o asunto principal' },
      { name: 'categoria_id', type: 'VARCHAR(50)', description: 'Relación a la categoría del caso (Sección 8)' },
      { name: 'descripcion', type: 'TEXT', description: 'Mensaje/detalle completo de la incidencia' },
      { name: 'estado', type: "ENUM('abierto','en_progreso','resuelto','cerrado')", description: 'Estado actual del ticket' },
      { name: 'prioridad', type: "ENUM('baja','media','alta','urgente')", description: 'Nivel de urgencia del caso' },
      { name: 'sector_id', type: 'VARCHAR(100)', description: 'Relación al sector de residencia (Sección 9)' },
      { name: 'ubicacion_lat', type: 'DECIMAL(10,8)', description: 'Latitud GPS reportada' },
      { name: 'ubicacion_lng', type: 'DECIMAL(11,8)', description: 'Longitud GPS reportada' },
      { name: 'direccion_detallada', type: 'VARCHAR(255)', description: 'Punto de referencia o dirección escrita' },
      { name: 'fecha_creacion', type: 'DATE', description: 'Fecha del registro' },
      { name: 'hora_creacion', type: 'TIME', description: 'Hora del registro' },
      { name: 'fecha_actualizacion', type: 'TIMESTAMP', description: 'Última modificación' },
      { name: 'asignado_a', type: 'VARCHAR(100)', description: 'Funcionario o técnico asignado' },
    ],
  },
  reportantes: {
    tableName: 'reportantes',
    description: 'Datos privados del ciudadano/usuario (excluidos de consulta pública)',
    fields: [
      { name: 'id', type: 'INT AUTO_INCREMENT PRIMARY KEY', description: 'Identificador del reportante' },
      { name: 'ticket_id', type: 'VARCHAR(36)', description: 'FK al ticket correspondiente' },
      { name: 'nombre', type: 'VARCHAR(150)', description: 'Nombre completo' },
      { name: 'cedula', type: 'VARCHAR(30)', description: 'Cédula de identidad personal o pasaporte' },
      { name: 'telefono', type: 'VARCHAR(30)', description: 'Número de contacto' },
      { name: 'email', type: 'VARCHAR(100)', description: 'Correo electrónico' },
      { name: 'genero', type: "ENUM('femenino','masculino','otro')", description: 'Género para corte analítico' },
      { name: 'edad', type: 'INT', description: 'Edad o fecha de nacimiento' },
      { name: 'sector', type: 'VARCHAR(100)', description: 'Sector de residencia' },
    ],
  },
  adjuntos: {
    tableName: 'adjuntos',
    description: 'Archivos multimedia o documentos vinculados al ticket',
    fields: [
      { name: 'id', type: 'VARCHAR(36) PRIMARY KEY', description: 'ID único del archivo' },
      { name: 'ticket_id', type: 'VARCHAR(36)', description: 'FK al ticket' },
      { name: 'tipo', type: "ENUM('foto','video','documento')", description: 'Tipo de adjunto' },
      { name: 'nombre', type: 'VARCHAR(255)', description: 'Nombre original del archivo' },
      { name: 'url_archivo', type: 'TEXT', description: 'URL pública o S3/Storage link' },
      { name: 'thumbnail_url', type: 'TEXT', description: 'Miniatura optimizada' },
      { name: 'tamano_bytes', type: 'BIGINT', description: 'Peso del archivo en bytes' },
      { name: 'fecha_subida', type: 'TIMESTAMP', description: 'Fecha y hora de subida' },
    ],
  },
  trazabilidad: {
    tableName: 'trazabilidad',
    description: 'Línea de tiempo de eventos y seguimiento histórico del caso',
    fields: [
      { name: 'id', type: 'VARCHAR(36) PRIMARY KEY', description: 'ID único del evento' },
      { name: 'ticket_id', type: 'VARCHAR(36)', description: 'FK al ticket' },
      { name: 'tipo_evento', type: "ENUM('creacion','cambio_estado','comentario','reasignacion','cierre')", description: 'Tipo de hito' },
      { name: 'fecha_hora', type: 'DATETIME', description: 'Momento exacto en que ocurrió' },
      { name: 'responsable', type: 'VARCHAR(150)', description: 'Usuario interno que ejecutó la acción' },
      { name: 'rol_responsable', type: 'VARCHAR(50)', description: 'Cargo o área del responsable' },
      { name: 'nota', type: 'TEXT', description: 'Descripción o comentario del evento' },
      { name: 'estado_anterior', type: 'VARCHAR(20)', description: 'Estado previo si hubo cambio' },
      { name: 'estado_nuevo', type: 'VARCHAR(20)', description: 'Nuevo estado asignado' },
    ],
  },
};
