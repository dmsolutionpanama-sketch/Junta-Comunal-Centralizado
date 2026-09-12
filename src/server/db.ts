import mysql from 'mysql2/promise';
import { Ticket, TrazabilidadEvento, User } from '../types';

export interface DBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
}

let pool: mysql.Pool | null = null;
let isConnected = false;
let lastConnectionAttempt = 0;
let lastErrorMessage = '';

export function getDbConfig(): DBConfig {
  return {
    host: process.env.DB_HOST || '31.97.208.81',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'u483786231_ticket_db',
    user: process.env.DB_USER || 'user_jc26',
    password: process.env.DB_PASSWORD || 'Eurmotion27$',
    ssl: process.env.DB_SSL === 'true',
  };
}

export async function getDbPool(): Promise<mysql.Pool | null> {
  const config = getDbConfig();

  if (!config.host || !config.password) {
    return null;
  }

  if (pool && isConnected) {
    return pool;
  }

  // Rate limit reconnect attempts to avoid spamming host
  const now = Date.now();
  if (now - lastConnectionAttempt < 10000 && pool === null && lastErrorMessage) {
    return null;
  }
  lastConnectionAttempt = now;

  try {
    const newPool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 7000,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    });

    // Test connectivity
    const connection = await newPool.getConnection();
    await connection.ping();
    connection.release();

    pool = newPool;
    isConnected = true;
    lastErrorMessage = '';
    console.log(`✅ [MySQL Directo] Conexión establecida con éxito a ${config.database} en ${config.host} (Usuario: ${config.user})`);
    return pool;
  } catch (err: any) {
    lastErrorMessage = err?.message || 'Error desconocido';
    console.warn(`⚠️ [MySQL Directo] Intento de conexión a ${config.host} falló:`, lastErrorMessage);
    pool = null;
    isConnected = false;
    return null;
  }
}

export function getDbStatus() {
  const config = getDbConfig();
  return {
    connected: isConnected,
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    lastError: lastErrorMessage,
    provider: 'Hostinger Remote MySQL',
  };
}

// Fallback coordinate centers for sectors in Ernesto Córdoba Campos / Panamá Norte
export const SECTOR_COORDS_MAP: Record<string, { lat: number; lng: number }> = {
  'Altos de Las Cumbres': { lat: 9.0834, lng: -79.5312 },
  'Nueva Libia': { lat: 9.0945, lng: -79.5241 },
  'Villa Zaita': { lat: 9.0712, lng: -79.5188 },
  'Gonzalillo': { lat: 9.0882, lng: -79.5153 },
  'Ciudad San Lorenzo': { lat: 9.0991, lng: -79.5388 },
  'Colinas del Rocío': { lat: 9.0776, lng: -79.5267 },
  'Las Praderas del Rocío': { lat: 9.0744, lng: -79.5291 },
  'Reparto Portofino': { lat: 9.0815, lng: -79.5219 },
  'Villa María': { lat: 9.0911, lng: -79.5304 },
  'Villa Milagros': { lat: 9.0858, lng: -79.5273 },
  'Milla 9': { lat: 9.0683, lng: -79.5142 },
  'Santa Rita': { lat: 9.0934, lng: -79.5192 },
  'Las Lajas': { lat: 9.0905, lng: -79.5340 },
  'Chilibre Centro': { lat: 9.1412, lng: -79.6150 },
  'Villa Grecia': { lat: 9.1020, lng: -79.5390 },
};

/**
 * Ensure table schemas in MySQL have required columns for WhatsApp & Web parity
 */
export async function ensureDatabaseTablesSchema(): Promise<boolean> {
  try {
    const db = await getDbPool();
    if (!db) return false;

    // 1. Create base tables if not exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        numero_registro VARCHAR(50) NOT NULL,
        consecutivo_seguridad VARCHAR(100) NULL,
        tipo_reporte VARCHAR(100) NULL,
        asunto VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        categoria_id VARCHAR(50) NOT NULL,
        categoria_nombre VARCHAR(100) NULL,
        estado VARCHAR(50) DEFAULT 'abierto',
        prioridad VARCHAR(50) DEFAULT 'media',
        sector_id VARCHAR(100) NULL,
        sector_nombre VARCHAR(100) NULL,
        ubicacion_lat DECIMAL(10, 7) NULL,
        ubicacion_lng DECIMAL(10, 7) NULL,
        direccion_detallada TEXT NULL,
        lugar_registro VARCHAR(100) DEFAULT 'Plataforma Web',
        canal_intake VARCHAR(100) DEFAULT 'Portal Web Ciudadano',
        canal_radicacion VARCHAR(50) DEFAULT 'web_portal',
        funcionario_registro VARCHAR(150) NULL,
        asignado_a VARCHAR(150) NULL,
        departamento VARCHAR(150) NULL,
        codigo_registro_ensa VARCHAR(100) NULL,
        canal_notificacion_copia VARCHAR(50) DEFAULT 'ambos',
        datos_especificos_reporte JSON NULL,
        adjuntos JSON NULL,
        trazabilidad JSON NULL,
        fecha_creacion DATE NULL,
        hora_creacion TIME NULL,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_estado (estado),
        INDEX idx_categoria (categoria_id),
        INDEX idx_sector (sector_nombre)
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS reportantes (
        ticket_id VARCHAR(50) NOT NULL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        apellido VARCHAR(150) NULL,
        cedula VARCHAR(50) NOT NULL,
        telefono VARCHAR(50) NULL,
        email VARCHAR(150) NULL,
        genero VARCHAR(20) DEFAULT 'otro',
        edad INT DEFAULT 35,
        sector VARCHAR(100) NULL,
        registrado_padron TINYINT(1) DEFAULT 0,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rep_cedula (cedula)
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS trazabilidad_eventos (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        ticket_id VARCHAR(50) NOT NULL,
        tipo_evento VARCHAR(50) NOT NULL,
        fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        responsable VARCHAR(150) NOT NULL,
        rol_responsable VARCHAR(100) NULL,
        nota TEXT NOT NULL,
        estado_anterior VARCHAR(50) NULL,
        estado_nuevo VARCHAR(50) NULL,
        canal_interaccion VARCHAR(50) NULL,
        minutos_consumidos INT DEFAULT 0,
        INDEX idx_te_ticket (ticket_id)
      ) ENGINE=InnoDB;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS configuracion_sistema (
        clave VARCHAR(100) NOT NULL PRIMARY KEY,
        valor LONGTEXT NOT NULL,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 2. Safely ensure all columns exist in existing tables
    const checkAndAddColumn = async (table: string, column: string, def: string) => {
      try {
        const [cols]: any = await db.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, column]
        );
        if (!Array.isArray(cols) || cols.length === 0) {
          await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${def}`);
          console.log(`[MySQL Schema] Columna '${column}' creada en tabla '${table}'`);
        }
      } catch (err: any) {
        // Fallback standard ADD COLUMN IF NOT EXISTS
        try {
          await db.query(`ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS \`${column}\` ${def}`);
        } catch {
          // ignore if already present
        }
      }
    };

    await checkAndAddColumn('tickets', 'codigo_registro_ensa', 'VARCHAR(100) NULL');
    await checkAndAddColumn('tickets', 'canal_notificacion_copia', "VARCHAR(50) DEFAULT 'ambos'");
    await checkAndAddColumn('tickets', 'consecutivo_seguridad', 'VARCHAR(100) NULL');
    await checkAndAddColumn('tickets', 'tipo_reporte', 'VARCHAR(100) NULL');
    await checkAndAddColumn('tickets', 'categoria_nombre', 'VARCHAR(100) NULL');
    await checkAndAddColumn('tickets', 'sector_nombre', 'VARCHAR(100) NULL');
    await checkAndAddColumn('tickets', 'ubicacion_lat', 'DECIMAL(10, 7) NULL');
    await checkAndAddColumn('tickets', 'ubicacion_lng', 'DECIMAL(10, 7) NULL');
    await checkAndAddColumn('tickets', 'canal_intake', "VARCHAR(100) DEFAULT 'Portal Web Ciudadano'");
    await checkAndAddColumn('tickets', 'canal_radicacion', "VARCHAR(50) DEFAULT 'web_portal'");
    await checkAndAddColumn('tickets', 'lugar_registro', "VARCHAR(100) DEFAULT 'Plataforma Web'");
    await checkAndAddColumn('tickets', 'funcionario_registro', 'VARCHAR(150) NULL');
    await checkAndAddColumn('tickets', 'datos_especificos_reporte', 'JSON NULL');
    await checkAndAddColumn('tickets', 'adjuntos', 'JSON NULL');
    await checkAndAddColumn('tickets', 'trazabilidad', 'JSON NULL');
    await checkAndAddColumn('tickets', 'hora_creacion', 'TIME NULL');

    await checkAndAddColumn('reportantes', 'apellido', 'VARCHAR(150) NULL');
    await checkAndAddColumn('reportantes', 'registrado_padron', 'TINYINT(1) DEFAULT 0');

    console.log('✅ [MySQL Schema] Tablas y campos de base de datos verificados con éxito.');
    return true;
  } catch (err: any) {
    console.warn('[MySQL Schema] Warning checking tickets table schema:', err.message);
    return false;
  }
}

/**
 * Persist a complete ticket into MySQL (inserts or updates on duplicate key)
 */
export async function persistTicketToMySQL(ticket: Ticket): Promise<boolean> {
  try {
    const db = await getDbPool();
    if (!db) return false;

    await ensureDatabaseTablesSchema();

    const sectorStr = ticket.sectorNombre || ticket.sectorId || 'Altos de Las Cumbres';
    const fallbackCoord = SECTOR_COORDS_MAP[sectorStr] || { lat: 9.0834, lng: -79.5312 };
    const lat = ticket.ubicacionLat !== undefined && !isNaN(ticket.ubicacionLat) ? ticket.ubicacionLat : fallbackCoord.lat;
    const lng = ticket.ubicacionLng !== undefined && !isNaN(ticket.ubicacionLng) ? ticket.ubicacionLng : fallbackCoord.lng;

    const fechaCreacion = ticket.fechaCreacion || new Date().toISOString().split('T')[0];
    const horaCreacion = ticket.horaCreacion || new Date().toTimeString().split(' ')[0];
    const consecutivo = ticket.consecutivoSeguridad || `CS-${new Date().getFullYear()}-${ticket.numeroRegistro}`;

    // 1. Insert/Update into `tickets`
    const insertTicketSql = `
      INSERT INTO tickets (
        id, numero_registro, consecutivo_seguridad, tipo_reporte, asunto, descripcion,
        categoria_id, categoria_nombre, estado, prioridad, sector_id, sector_nombre,
        ubicacion_lat, ubicacion_lng, direccion_detallada, lugar_registro, canal_intake,
        canal_radicacion, funcionario_registro, asignado_a, departamento, codigo_registro_ensa,
        canal_notificacion_copia, datos_especificos_reporte, adjuntos, trazabilidad,
        fecha_creacion, hora_creacion, fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        asunto = VALUES(asunto),
        descripcion = VALUES(descripcion),
        categoria_id = VALUES(categoria_id),
        categoria_nombre = VALUES(categoria_nombre),
        estado = VALUES(estado),
        prioridad = VALUES(prioridad),
        sector_id = VALUES(sector_id),
        sector_nombre = VALUES(sector_nombre),
        ubicacion_lat = VALUES(ubicacion_lat),
        ubicacion_lng = VALUES(ubicacion_lng),
        direccion_detallada = VALUES(direccion_detallada),
        asignado_a = VALUES(asignado_a),
        departamento = VALUES(departamento),
        codigo_registro_ensa = VALUES(codigo_registro_ensa),
        canal_notificacion_copia = VALUES(canal_notificacion_copia),
        datos_especificos_reporte = VALUES(datos_especificos_reporte),
        adjuntos = VALUES(adjuntos),
        trazabilidad = VALUES(trazabilidad),
        fecha_actualizacion = NOW()
    `;

    const adjuntosJson = JSON.stringify(ticket.adjuntos || []);
    const trazabilidadJson = JSON.stringify(ticket.trazabilidad || []);
    const datosEspecificosJson = ticket.datosEspecificosReporte ? JSON.stringify(ticket.datosEspecificosReporte) : null;

    await db.query(insertTicketSql, [
      ticket.id,
      ticket.numeroRegistro,
      consecutivo,
      ticket.tipoReporte || ticket.categoriaNombre,
      ticket.asunto,
      ticket.descripcion,
      ticket.categoriaId,
      ticket.categoriaNombre,
      ticket.estado || 'abierto',
      ticket.prioridad || 'media',
      sectorStr,
      sectorStr,
      lat,
      lng,
      ticket.direccionDetallada || '',
      ticket.lugarRegistro || 'Portal Digital Comunal',
      ticket.canalIntake || 'Formulario Web',
      ticket.canalRadicacion || 'web_portal',
      ticket.funcionarioRegistro || 'Sistema',
      ticket.asignadoA || null,
      ticket.departamento || null,
      ticket.codigoRegistroEnsa || null,
      ticket.canalNotificacionCopia || 'ambos',
      datosEspecificosJson,
      adjuntosJson,
      trazabilidadJson,
      fechaCreacion,
      horaCreacion,
    ]);

    // 2. Insert/Update into `reportantes`
    if (ticket.reportante) {
      const rep = ticket.reportante;
      const insertReportanteSql = `
        INSERT INTO reportantes (
          ticket_id, nombre, apellido, cedula, telefono, email, genero, edad, sector, registrado_padron
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          apellido = VALUES(apellido),
          cedula = VALUES(cedula),
          telefono = VALUES(telefono),
          email = VALUES(email),
          genero = VALUES(genero),
          edad = VALUES(edad),
          sector = VALUES(sector),
          registrado_padron = VALUES(registrado_padron)
      `;

      await db.query(insertReportanteSql, [
        ticket.id,
        rep.nombre,
        rep.apellido || '',
        rep.cedula || 'N/A',
        rep.telefono || '',
        rep.email || '',
        rep.genero || 'otro',
        rep.edad || 35,
        rep.sector || sectorStr,
        rep.registradoEnPadron ? 1 : 0,
      ]);
    }

    // 3. Persist individual trace events
    if (Array.isArray(ticket.trazabilidad) && ticket.trazabilidad.length > 0) {
      for (const ev of ticket.trazabilidad) {
        try {
          await db.query(`
            INSERT INTO trazabilidad_eventos (
              id, ticket_id, tipo_evento, fecha_hora, responsable, rol_responsable, nota, estado_anterior, estado_nuevo, canal_interaccion, minutos_consumidos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              nota = VALUES(nota),
              estado_nuevo = VALUES(estado_nuevo)
          `, [
            ev.id || `tr-${ticket.id}-${Date.now()}`,
            ticket.id,
            ev.tipoEvento || 'comentario',
            ev.fechaHora || new Date().toISOString().replace('T', ' ').substring(0, 19),
            ev.responsable || 'Sistema',
            ev.rolResponsable || 'Funcionario',
            ev.nota || '',
            ev.estadoAnterior || null,
            ev.estadoNuevo || null,
            ev.canalInteraccion || 'web',
            ev.minutosConsumidos || 0,
          ]);
        } catch {
          // ignore duplicate trace id
        }
      }
    }

    console.log(`✅ [MySQL Directo] Ticket '${ticket.id}' (${ticket.numeroRegistro}) persistido exitosamente en MySQL.`);
    return true;
  } catch (err: any) {
    console.warn(`⚠️ [MySQL Directo] Error persistiendo ticket '${ticket.id}':`, err.message);
    return false;
  }
}

/**
 * Update ticket properties directly in MySQL
 */
export async function updateTicketInMySQL(ticketId: string, updates: Partial<Ticket>): Promise<boolean> {
  try {
    const db = await getDbPool();
    if (!db) return false;

    const setClauses: string[] = ['fecha_actualizacion = NOW()'];
    const params: any[] = [];

    if (updates.estado !== undefined) {
      setClauses.push('estado = ?');
      params.push(updates.estado);
    }
    if (updates.prioridad !== undefined) {
      setClauses.push('prioridad = ?');
      params.push(updates.prioridad);
    }
    if (updates.asunto !== undefined) {
      setClauses.push('asunto = ?');
      params.push(updates.asunto);
    }
    if (updates.descripcion !== undefined) {
      setClauses.push('descripcion = ?');
      params.push(updates.descripcion);
    }
    if (updates.asignadoA !== undefined) {
      setClauses.push('asignado_a = ?');
      params.push(updates.asignadoA);
    }
    if (updates.departamento !== undefined) {
      setClauses.push('departamento = ?');
      params.push(updates.departamento);
    }
    if (updates.codigoRegistroEnsa !== undefined) {
      setClauses.push('codigo_registro_ensa = ?');
      params.push(updates.codigoRegistroEnsa);
    }
    if (updates.canalNotificacionCopia !== undefined) {
      setClauses.push('canal_notificacion_copia = ?');
      params.push(updates.canalNotificacionCopia);
    }
    if (updates.trazabilidad !== undefined) {
      setClauses.push('trazabilidad = ?');
      params.push(JSON.stringify(updates.trazabilidad));
    }
    if (updates.adjuntos !== undefined) {
      setClauses.push('adjuntos = ?');
      params.push(JSON.stringify(updates.adjuntos));
    }

    params.push(ticketId);
    params.push(ticketId);

    const sql = `UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ? OR numero_registro = ?`;
    await db.query(sql, params);
    console.log(`✅ [MySQL Directo] Ticket '${ticketId}' actualizado con éxito en la base de datos.`);
    return true;
  } catch (err: any) {
    console.warn(`⚠️ [MySQL Directo] Error actualizando ticket '${ticketId}' en MySQL:`, err.message);
    return false;
  }
}

/**
 * Add a trace event to a ticket in MySQL
 */
export async function addTraceEventToMySQL(ticketId: string, event: TrazabilidadEvento): Promise<boolean> {
  try {
    const db = await getDbPool();
    if (!db) return false;

    // 1. Insert into trazabilidad_eventos
    await db.query(`
      INSERT INTO trazabilidad_eventos (
        id, ticket_id, tipo_evento, fecha_hora, responsable, rol_responsable, nota, estado_anterior, estado_nuevo, canal_interaccion, minutos_consumidos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE nota = VALUES(nota)
    `, [
      event.id,
      ticketId,
      event.tipoEvento,
      event.fechaHora,
      event.responsable,
      event.rolResponsable || 'Funcionario',
      event.nota,
      event.estadoAnterior || null,
      event.estadoNuevo || null,
      event.canalInteraccion || 'web',
      event.minutosConsumidos || 0,
    ]);

    // 2. If status updated, update tickets table
    if (event.estadoNuevo) {
      await db.query(
        `UPDATE tickets SET estado = ?, fecha_actualizacion = NOW() WHERE id = ? OR numero_registro = ?`,
        [event.estadoNuevo, ticketId, ticketId]
      );
    }

    return true;
  } catch (err: any) {
    console.warn(`⚠️ [MySQL Directo] Error guardando evento de trazabilidad en MySQL:`, err.message);
    return false;
  }
}

/**
 * Fetch all tickets from MySQL tables with fallback to in-memory/mock
 */
export async function queryTicketsFromMySQL(): Promise<Ticket[] | null> {
  try {
    const db = await getDbPool();
    if (!db) return null;

    // Query all fields including ENSA code, copies, and JSON columns
    const [rows]: any = await db.query(`
      SELECT 
        t.id, 
        t.numero_registro as numeroRegistro, 
        t.consecutivo_seguridad as consecutivoSeguridad,
        t.tipo_reporte as tipoReporte,
        t.asunto, 
        t.categoria_id as categoriaId, 
        t.categoria_nombre as categoriaNombre,
        t.descripcion, 
        t.estado, 
        t.prioridad, 
        t.sector_id as sectorId, 
        t.sector_nombre as sectorNombre,
        t.ubicacion_lat as ubicacionLat, 
        t.ubicacion_lng as ubicacionLng, 
        t.direccion_detallada as direccionDetallada, 
        t.lugar_registro as lugarRegistro,
        t.canal_intake as canalIntake,
        t.canal_radicacion as canalRadicacion,
        t.funcionario_registro as funcionarioRegistro,
        t.codigo_registro_ensa as codigoRegistroEnsa,
        t.canal_notificacion_copia as canalNotificacionCopia,
        t.datos_especificos_reporte as datosEspecificosReporte,
        t.adjuntos as raw_adjuntos,
        t.trazabilidad as raw_trazabilidad,
        t.fecha_creacion as fechaCreacion, 
        t.hora_creacion as horaCreacion, 
        t.fecha_actualizacion as fechaActualizacion,
        t.asignado_a as asignadoA,
        t.departamento,
        r.nombre as rep_nombre,
        r.apellido as rep_apellido,
        r.cedula as rep_cedula,
        r.telefono as rep_telefono,
        r.email as rep_email,
        r.genero as rep_genero,
        r.edad as rep_edad,
        r.sector as rep_sector,
        r.registrado_padron as rep_registrado_padron
      FROM tickets t
      LEFT JOIN reportantes r ON t.id = r.ticket_id
      ORDER BY t.fecha_actualizacion DESC
      LIMIT 1500
    `);

    if (!Array.isArray(rows)) return null;

    // Map rows to Ticket interface preserving WhatsApp vs Web channels & coordinates
    const tickets: Ticket[] = rows.map((row: any) => {
      const sectorStr = row.sectorNombre || row.sectorId || row.rep_sector || 'Altos de Las Cumbres';
      const fallbackCoord = SECTOR_COORDS_MAP[sectorStr] || { lat: 9.0834, lng: -79.5312 };

      const latNum = Number(row.ubicacionLat);
      const lngNum = Number(row.ubicacionLng);
      const validLat = !isNaN(latNum) && latNum !== 0 ? latNum : fallbackCoord.lat;
      const validLng = !isNaN(lngNum) && lngNum !== 0 ? lngNum : fallbackCoord.lng;

      // Parse JSON fields safely
      let parsedAdjuntos: any[] = [];
      if (row.raw_adjuntos) {
        try {
          parsedAdjuntos = typeof row.raw_adjuntos === 'string' ? JSON.parse(row.raw_adjuntos) : row.raw_adjuntos;
        } catch {
          parsedAdjuntos = [];
        }
      }

      let parsedTrazabilidad: TrazabilidadEvento[] = [];
      if (row.raw_trazabilidad) {
        try {
          parsedTrazabilidad = typeof row.raw_trazabilidad === 'string' ? JSON.parse(row.raw_trazabilidad) : row.raw_trazabilidad;
        } catch {
          parsedTrazabilidad = [];
        }
      }

      // If empty trace, add default creation event
      if (!Array.isArray(parsedTrazabilidad) || parsedTrazabilidad.length === 0) {
        parsedTrazabilidad = [
          {
            id: `tr-${row.id}-1`,
            ticketId: String(row.id),
            tipoEvento: 'creacion',
            fechaHora: row.fechaCreacion ? String(row.fechaCreacion) : '2026-08-29 12:00:00',
            responsable: row.funcionarioRegistro || 'Sistema de Incidencias',
            rolResponsable: 'Plataforma Comunal',
            nota: `Ticket registrado y verificado en base de datos. ${row.codigoRegistroEnsa ? `Código ENSA previo: ${row.codigoRegistroEnsa}.` : ''}`,
            estadoNuevo: row.estado || 'abierto',
            canalInteraccion: row.canalRadicacion || 'web',
            minutosConsumidos: 2,
          },
        ];
      }

      let parsedDatosEspecificos: any = null;
      if (row.datosEspecificosReporte) {
        try {
          parsedDatosEspecificos = typeof row.datosEspecificosReporte === 'string' ? JSON.parse(row.datosEspecificosReporte) : row.datosEspecificosReporte;
        } catch {
          parsedDatosEspecificos = null;
        }
      }

      // Identify whether this ticket was generated from WhatsApp
      const isWpp = 
        (row.canalRadicacion && String(row.canalRadicacion).toLowerCase().includes('whatsapp')) ||
        (row.canalIntake && String(row.canalIntake).toLowerCase().includes('whatsapp')) ||
        String(row.id || '').startsWith('TK-WPP') ||
        String(row.numeroRegistro || '').includes('WPP');

      const canalRadicacion = isWpp ? 'whatsapp_comunal' : (row.canalRadicacion || 'web_portal');
      const canalIntake = isWpp ? 'WhatsApp Comunitario (n8n)' : (row.canalIntake || 'Portal Web Ciudadano');
      const lugarRegistro = isWpp ? 'WhatsApp Comunitario (n8n)' : (row.lugarRegistro || 'Plataforma Web');

      return {
        id: String(row.id || row.numeroRegistro),
        numeroRegistro: row.numeroRegistro || `TK-${row.id}`,
        consecutivoSeguridad: row.consecutivoSeguridad || undefined,
        tipoReporte: row.tipoReporte || undefined,
        asunto: row.asunto || 'Incidencia comunal registrada',
        categoriaId: row.categoriaId || 'general',
        categoriaNombre: row.categoriaNombre || row.categoriaId || 'General',
        descripcion: row.descripcion || '',
        estado: row.estado || 'abierto',
        prioridad: row.prioridad || 'media',
        sectorId: sectorStr,
        sectorNombre: sectorStr,
        ubicacionLat: validLat,
        ubicacionLng: validLng,
        direccionDetallada: row.direccionDetallada || (isWpp ? `Reporte recibido vía WhatsApp - ${sectorStr}` : ''),
        lugarRegistro,
        canalIntake,
        canalRadicacion,
        funcionarioRegistro: row.funcionarioRegistro || undefined,
        asignadoA: row.asignadoA || undefined,
        departamento: row.departamento || undefined,
        codigoRegistroEnsa: row.codigoRegistroEnsa || undefined,
        canalNotificacionCopia: row.canalNotificacionCopia || 'ambos',
        datosEspecificosReporte: parsedDatosEspecificos || undefined,
        fechaCreacion: row.fechaCreacion ? String(row.fechaCreacion).slice(0, 10) : '2026-08-29',
        horaCreacion: row.horaCreacion ? String(row.horaCreacion).slice(0, 8) : '12:00:00',
        fechaActualizacion: row.fechaActualizacion ? String(row.fechaActualizacion) : '2026-08-29 12:00:00',
        reportante: {
          nombre: row.rep_nombre || (isWpp ? 'Ciudadano WhatsApp' : 'Ciudadano Residente'),
          apellido: row.rep_apellido || '',
          cedula: row.rep_cedula || (isWpp ? '8-WhatsApp' : 'N/A'),
          telefono: row.rep_telefono || '',
          email: row.rep_email || (isWpp ? 'contacto@whatsapp.comunal' : ''),
          genero: row.rep_genero || 'otro',
          edad: Number(row.rep_edad) || 35,
          sector: sectorStr,
          registradoEnPadron: row.rep_registrado_padron === 1,
        },
        adjuntos: parsedAdjuntos,
        trazabilidad: parsedTrazabilidad,
      };
    });

    return tickets;
  } catch (err) {
    console.warn('[MySQL Directo] No se pudieron listar tickets desde MySQL (usando memoria sincronizada):', (err as Error).message);
    return null;
  }
}

/**
 * Ensure configuracion_sistema table exists in MySQL
 */
export async function ensureConfigTable(): Promise<boolean> {
  try {
    const db = await getDbPool();
    if (!db) return false;

    await db.query(`
      CREATE TABLE IF NOT EXISTS configuracion_sistema (
        clave VARCHAR(100) NOT NULL PRIMARY KEY,
        valor LONGTEXT NOT NULL,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    return true;
  } catch (err: any) {
    console.warn('[MySQL Config] Error ensuring configuracion_sistema table:', err.message);
    return false;
  }
}

/**
 * Fetch a configuration setting from MySQL
 */
export async function getSystemConfigFromMySQL<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getDbPool();
    if (!db) return null;

    await ensureConfigTable();

    const [rows]: any = await db.query(
      `SELECT valor FROM configuracion_sistema WHERE clave = ? LIMIT 1`,
      [key]
    );

    if (Array.isArray(rows) && rows.length > 0 && rows[0].valor) {
      return JSON.parse(rows[0].valor) as T;
    }
    return null;
  } catch (err: any) {
    console.warn(`[MySQL Config] Error getting config '${key}':`, err.message);
    return null;
  }
}

/**
 * Save a configuration setting into MySQL
 */
export async function saveSystemConfigToMySQL(key: string, value: any): Promise<boolean> {
  try {
    const db = await getDbPool();
    if (!db) return false;

    await ensureConfigTable();

    const jsonStr = JSON.stringify(value);
    await db.query(
      `INSERT INTO configuracion_sistema (clave, valor)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), fecha_actualizacion = NOW()`,
      [key, jsonStr]
    );
    console.log(`✅ [MySQL Config] Configuración '${key}' guardada exitosamente en MySQL`);
    return true;
  } catch (err: any) {
    console.warn(`[MySQL Config] Error saving config '${key}':`, err.message);
    return false;
  }
}

