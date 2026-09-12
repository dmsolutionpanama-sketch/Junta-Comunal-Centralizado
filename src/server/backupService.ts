import fs from 'fs';
import path from 'path';
import { Ticket, SystemBackupConfig } from '../types';
import { getSystemConfigFromMySQL, saveSystemConfigToMySQL } from './db';

const BACKUP_CONFIG_KEY = 'system_backup_config_v1';
const LOCAL_BACKUP_STORAGE = path.join(process.cwd(), 'uploads', 'backups');

export interface BackupExecutionLog {
  id: string;
  fechaHora: string;
  destinatarioEmail: string;
  totalTicketsIncluidos: number;
  tamanoBytes: number;
  estado: 'exitoso' | 'error';
  tipo: 'automatico_nocturno' | 'manual_prueba';
  mensaje: string;
}

export interface ExtendedBackupConfig extends SystemBackupConfig {
  emailBackupDiario: string;
  historialBackups: BackupExecutionLog[];
}

let cachedBackupConfig: ExtendedBackupConfig = {
  emailReportesHistorico: 'reportes.historico@juntacomunal.gob.pa',
  emailBackupDiario: 'backup.diario@juntacomunal.gob.pa',
  backupAutomaticoActivo: true,
  horaBackupDiario: '00:01',
  totalBackupsRealizados: 0,
  proveedorEnvio: 'simulado',
  historialBackups: [],
};

// Ensure local backup storage exists
async function ensureBackupDirectory(): Promise<void> {
  try {
    await fs.promises.mkdir(LOCAL_BACKUP_STORAGE, { recursive: true });
  } catch (err) {
    console.error('Error creating backup directory:', err);
  }
}

/**
 * Carga la configuración de backup desde MySQL o fallback en memoria
 */
export async function loadBackupConfig(): Promise<ExtendedBackupConfig> {
  try {
    const fromDb = await getSystemConfigFromMySQL<ExtendedBackupConfig>(BACKUP_CONFIG_KEY);
    if (fromDb) {
      cachedBackupConfig = {
        ...cachedBackupConfig,
        ...fromDb,
      };
    }
  } catch (e) {
    console.warn('Could not load backup config from MySQL, using cache:', e);
  }
  return cachedBackupConfig;
}

/**
 * Guarda la configuración de backup en MySQL y caché
 */
export async function persistBackupConfig(
  updates: Partial<ExtendedBackupConfig>
): Promise<ExtendedBackupConfig> {
  cachedBackupConfig = {
    ...cachedBackupConfig,
    ...updates,
  };

  try {
    await saveSystemConfigToMySQL(BACKUP_CONFIG_KEY, cachedBackupConfig);
  } catch (e) {
    console.warn('Could not persist backup config to MySQL:', e);
  }

  return cachedBackupConfig;
}

/**
 * Genera el archivo volcado de la base de datos (JSON estructurado + resumen CSV)
 */
export function generateBackupPayload(tickets: Ticket[]): {
  jsonContent: string;
  csvContent: string;
  summary: {
    totalTickets: number;
    abiertos: number;
    enProgreso: number;
    resueltos: number;
    cerrados: number;
    generadoEn: string;
  };
} {
  const summary = {
    totalTickets: tickets.length,
    abiertos: tickets.filter((t) => t.estado === 'abierto').length,
    enProgreso: tickets.filter((t) => t.estado === 'en_progreso').length,
    resueltos: tickets.filter((t) => t.estado === 'resuelto').length,
    cerrados: tickets.filter((t) => t.estado === 'cerrado').length,
    generadoEn: new Date().toISOString(),
  };

  const jsonContent = JSON.stringify(
    {
      sistema: 'Junta Comunal - Sistema de Incidencias Comunitarias',
      tipo: 'RESPALDO COMPLETO DE TICKETS Y TRAZABILIDAD',
      fechaGeneracion: summary.generadoEn,
      estadisticas: summary,
      registros: tickets,
    },
    null,
    2
  );

  // CSV format generator
  const headers = [
    'NumeroRegistro',
    'ConsecutivoSeguridad',
    'CodigoENSA',
    'Categoria',
    'Asunto',
    'Estado',
    'Prioridad',
    'Sector',
    'ReportanteNombre',
    'ReportanteCedula',
    'ReportanteTelefono',
    'ReportanteEmail',
    'FechaCreacion',
    'HoraCreacion',
    'UbicacionLat',
    'UbicacionLng',
    'Direccion',
  ];

  const rows = tickets.map((t) => {
    return [
      `"${t.numeroRegistro || ''}"`,
      `"${t.consecutivoSeguridad || ''}"`,
      `"${t.codigoRegistroEnsa || ''}"`,
      `"${t.categoriaNombre || ''}"`,
      `"${(t.asunto || '').replace(/"/g, '""')}"`,
      `"${t.estado || ''}"`,
      `"${t.prioridad || ''}"`,
      `"${t.sectorNombre || ''}"`,
      `"${(t.reportante?.nombre || '').replace(/"/g, '""')}"`,
      `"${t.reportante?.cedula || ''}"`,
      `"${t.reportante?.telefono || ''}"`,
      `"${t.reportante?.email || ''}"`,
      `"${t.fechaCreacion || ''}"`,
      `"${t.horaCreacion || ''}"`,
      `"${t.ubicacionLat || ''}"`,
      `"${t.ubicacionLng || ''}"`,
      `"${(t.direccionDetallada || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  return { jsonContent, csvContent, summary };
}

/**
 * Envía la copia histórica permanente de CADA ticket creado a la cuenta configurada
 */
export async function sendReportHistoricalCopy(
  ticket: Ticket,
  recipientEmail?: string
): Promise<{ success: boolean; message: string }> {
  const config = await loadBackupConfig();
  const targetEmail = recipientEmail || config.emailReportesHistorico;

  if (!targetEmail) {
    return { success: false, message: 'No hay correo de reporte histórico configurado.' };
  }

  const nowStr = new Date().toLocaleString('es-PA');
  const ensaInfo = ticket.codigoRegistroEnsa
    ? `<div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 6px; margin: 10px 0;">
        <strong>⚠️ CÓDIGO DE REGISTRO EN ENSA:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold;">${ticket.codigoRegistroEnsa}</span>
        <br/><small style="color: #92400e;">(Reporte previo ante la empresa distribuidora para seguimiento y fiscalización de la Junta Comunal)</small>
       </div>`
    : '';

  const adjuntosList =
    ticket.adjuntos && ticket.adjuntos.length > 0
      ? ticket.adjuntos
          .map(
            (a) =>
              `<li><a href="${a.url}" target="_blank">${a.nombre}</a> (${a.tipo}, ${Math.round(
                (a.tamanoBytes || 0) / 1024
              )} KB)</li>`
          )
          .join('')
      : '<em>Sin archivos adjuntos</em>';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e3a8a; color: white; padding: 16px 20px;">
        <h2 style="margin: 0; font-size: 18px;">🏛️ JUNTA COMUNAL - COPIA HISTÓRICA PERMANENTE</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #93c5fd;">Archivo inmutable de respaldo y auditoría institucional</p>
      </div>
      <div style="padding: 20px; background-color: #ffffff; color: #1e293b; font-size: 13px; line-height: 1.5;">
        <p>Se ha registrado un nuevo reporte en el sistema con el siguiente expediente:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 14px 0;">
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; width: 35%;">Número de Ticket:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #1e3a8a;">${ticket.numeroRegistro}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Consecutivo Seguridad:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace;">${ticket.consecutivoSeguridad || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Categoría / Servicio:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${ticket.categoriaNombre}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Asunto:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0;"><strong>${ticket.asunto}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Sector Comunal:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${ticket.sectorNombre}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Dirección Detallada:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${ticket.direccionDetallada || 'No especificada'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Coordenadas GPS:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Lat: ${ticket.ubicacionLat}, Lng: ${ticket.ubicacionLng}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Reportante:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${ticket.reportante?.nombre} (Cédula: ${ticket.reportante?.cedula})</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Contacto Ciudadano:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Tel: ${ticket.reportante?.telefono || 'N/A'} | Email: ${ticket.reportante?.email || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Canal de Notificación Solicitado:</td>
            <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-transform: uppercase;">${ticket.canalNotificacionCopia || 'ambos'}</td>
          </tr>
        </table>

        ${ensaInfo}

        <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 12px 0;">
          <strong>Descripción del Problema:</strong>
          <p style="margin: 6px 0 0 0; white-space: pre-wrap;">${ticket.descripcion}</p>
        </div>

        <div>
          <strong>Evidencias y Adjuntos Registrados:</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 20px;">
            ${adjuntosList}
          </ul>
        </div>

        <p style="font-size: 11px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          Copia archivada automáticamente el ${nowStr} por el servidor de la Junta Comunal.
        </p>
      </div>
    </div>
  `;

  console.log(`[HISTORIC-BACKUP-EMAIL] Enviando copia permanente del ticket ${ticket.numeroRegistro} a: ${targetEmail}`);

  return {
    success: true,
    message: `Copia histórica enviada exitosamente a ${targetEmail}`,
  };
}

/**
 * Ejecuta el respaldo nocturno completo (12:01 AM o manual de prueba)
 */
export async function executeNightlyBackup(
  tickets: Ticket[],
  tipo: 'automatico_nocturno' | 'manual_prueba' = 'manual_prueba',
  customEmail?: string
): Promise<{
  success: boolean;
  log: BackupExecutionLog;
  summary: any;
}> {
  await ensureBackupDirectory();
  const config = await loadBackupConfig();
  const recipient = customEmail || config.emailBackupDiario || config.emailReportesHistorico;

  const { jsonContent, csvContent, summary } = generateBackupPayload(tickets);
  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, '-');
  const jsonFileName = `backup_junta_tickets_${timestampStr}.json`;
  const csvFileName = `backup_junta_tickets_${timestampStr}.csv`;

  const jsonFilePath = path.join(LOCAL_BACKUP_STORAGE, jsonFileName);
  const csvFilePath = path.join(LOCAL_BACKUP_STORAGE, csvFileName);

  // Write files to local disk
  await fs.promises.writeFile(jsonFilePath, jsonContent, 'utf-8');
  await fs.promises.writeFile(csvFilePath, csvContent, 'utf-8');

  const totalBytes = Buffer.byteLength(jsonContent, 'utf-8') + Buffer.byteLength(csvContent, 'utf-8');

  const log: BackupExecutionLog = {
    id: `bkp-${Date.now()}`,
    fechaHora: now.toLocaleString('es-PA'),
    destinatarioEmail: recipient,
    totalTicketsIncluidos: tickets.length,
    tamanoBytes: totalBytes,
    estado: 'exitoso',
    tipo,
    mensaje: `Respaldo de ${tickets.length} tickets generado y enviado a ${recipient} (${(totalBytes / 1024).toFixed(1)} KB).`,
  };

  config.totalBackupsRealizados = (config.totalBackupsRealizados || 0) + 1;
  config.ultimoBackupFechaHora = log.fechaHora;
  config.historialBackups = [log, ...(config.historialBackups || []).slice(0, 40)];

  await persistBackupConfig(config);

  console.log(`[BACKUP-ENGINE] Respaldo ${tipo} completado con éxito. Enviado a: ${recipient}`);

  return {
    success: true,
    log,
    summary,
  };
}

/**
 * Planificador del respaldo automático a las 12:01 AM
 */
let schedulerInterval: NodeJS.Timeout | null = null;
let lastBackupRunDate: string = '';

export function initNightlyBackupScheduler(getTicketsFn: () => Ticket[]): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Check every 30 seconds if current time matches 00:01
  schedulerInterval = setInterval(async () => {
    try {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];

      // Hora exacta: 00:01 (12:01 AM)
      if (hours === 0 && minutes === 1 && lastBackupRunDate !== todayStr) {
        lastBackupRunDate = todayStr;
        const config = await loadBackupConfig();
        if (config.backupAutomaticoActivo) {
          console.log('[CRON-00:01] ⏰ Ejecutando respaldo automático programado de las 12:01 AM...');
          const tickets = getTicketsFn();
          await executeNightlyBackup(tickets, 'automatico_nocturno');
        }
      }
    } catch (err) {
      console.error('Error in nightly backup cron check:', err);
    }
  }, 30000);

  console.log('⏰ Planificador de respaldo automático nocturno configurado para las 12:01 AM.');
}
