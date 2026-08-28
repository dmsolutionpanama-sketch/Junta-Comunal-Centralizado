/**
 * Email Notification Engine & Alert Service - Junta Comunal
 * 
 * Este servicio gestiona las alertas y confirmaciones automáticas enviadas
 * por correo electrónico a ciudadanos y cuadrillas ante eventos de tickets.
 * 
 * PARA CONECTAR A UN SERVIDOR REAL DE CORREO (SMTP, SendGrid, Resend o Gmail):
 * 1. Configure las variables en su archivo .env (ver .env.example y EMAIL_CONFIG.md)
 * 2. En producción backend (server.ts / server/email.ts), active el transporte deseado
 *    utilizando nodemailer, @sendgrid/mail o resend.
 */

import { Ticket, TicketStatus, User, EmailNotificationLog } from '../types';

const STORAGE_KEY_EMAIL_LOGS = 'junta_comunal_email_logs_v1';

export function getStoredEmailLogs(): EmailNotificationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAIL_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading email logs from storage', e);
  }
  return [];
}

export function saveStoredEmailLogs(logs: EmailNotificationLog[]) {
  try {
    localStorage.setItem(STORAGE_KEY_EMAIL_LOGS, JSON.stringify(logs.slice(0, 50)));
  } catch (e) {
    console.warn('Error saving email logs to storage', e);
  }
}

class EmailService {
  private senderEmail: string = 'notificaciones@juntacomunal.gob.pa';
  private senderName: string = 'Junta Comunal - Sistema de Incidencias';

  /**
   * Registra y simula/despacha el envío de un correo electrónico
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    htmlBody: string;
    type: EmailNotificationLog['tipo'];
    ticketId?: string;
  }): Promise<{ success: boolean; log: EmailNotificationLog }> {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const log: EmailNotificationLog = {
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      destinatario: options.to || 'vecino@comunidad.gob.pa',
      asunto: options.subject,
      tipo: options.type,
      ticketId: options.ticketId,
      fechaHora: nowStr,
      estadoEnvio: 'enviado',
      cuerpoHtml: options.htmlBody,
    };

    // Store in history
    const existing = getStoredEmailLogs();
    existing.unshift(log);
    saveStoredEmailLogs(existing);

    // Intentar despacho al backend si está configurado
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          htmlBody: options.htmlBody,
          ticketId: options.ticketId,
          type: options.type,
        }),
      });
    } catch {
      // Fallback a simulación local transparente
    }

    return { success: true, log };
  }

  /**
   * 1. Alerta: Confirmación de radicación de ticket al ciudadano
   */
  async notifyTicketCreated(ticket: Ticket): Promise<EmailNotificationLog> {
    const recipient = ticket.reportante.email || 'vecino.notificaciones@juntacomunal.gob.pa';
    const trackingUrl = `${window.location.origin}/?ticket=${ticket.numeroRegistro}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">🏛️ JUNTA COMUNAL</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;">Confirmación de Radicación de Incidencia</p>
        </div>

        <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
          <p>Estimado(a) <strong>${ticket.reportante.nombre}</strong>,</p>
          <p>Su solicitud ha sido registrada exitosamente en el sistema de la Junta Comunal con el siguiente código oficial:</p>
          
          <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 18px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1e3a8a; font-family: monospace;">N° RADICADO: ${ticket.numeroRegistro}</p>
            <p style="margin: 6px 0 0 0; font-size: 14px;"><strong>Tipo de Incidencia:</strong> ${ticket.categoriaNombre}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Sector:</strong> ${ticket.sectorNombre}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Asunto:</strong> ${ticket.asunto}</p>
          </div>

          <p>Usted puede consultar en tiempo real los avances, fotografías de la cuadrilla y resolución ingresando su número de radicado en el <strong>Portal Ciudadano</strong>:</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${trackingUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Estado en Portal Ciudadano</a>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Este es un correo automático generado por el Sistema de Incidencias de la Junta Comunal. Por favor no responda a este mensaje.
          </p>
        </div>
      </div>
    `;

    const res = await this.sendEmail({
      to: recipient,
      subject: `[Radicado Oficial] Solicitud ${ticket.numeroRegistro} - ${ticket.categoriaNombre}`,
      htmlBody,
      type: 'nuevo_ticket',
      ticketId: ticket.id,
    });

    return res.log;
  }

  /**
   * 2. Alerta: Cambio de estado o asignación de cuadrilla
   */
  async notifyStatusUpdate(
    ticket: Ticket,
    nuevoEstado: TicketStatus,
    nota: string,
    responsable: string
  ): Promise<EmailNotificationLog> {
    const recipient = ticket.reportante.email || 'vecino.notificaciones@juntacomunal.gob.pa';
    const trackingUrl = `${window.location.origin}/?ticket=${ticket.numeroRegistro}`;

    const estadoMap: Record<TicketStatus, { label: string; color: string }> = {
      abierto: { label: 'RADICADO / EN RECEPCIÓN', color: '#3b82f6' },
      en_progreso: { label: 'EN PROGRESO / CUADRILLA ASIGNADA', color: '#f59e0b' },
      resuelto: { label: 'TRABAJO RESUELTO EN CAMPO', color: '#10b981' },
      cerrado: { label: 'CASO CERRADO Y ARCHIVADO', color: '#6b7280' },
    };

    const estadoInfo = estadoMap[nuevoEstado] || { label: nuevoEstado.toUpperCase(), color: '#3b82f6' };

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">🏛️ JUNTA COMUNAL</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;">Actualización de Estado de Incidencia</p>
        </div>

        <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
          <p>Estimado(a) <strong>${ticket.reportante.nombre}</strong>,</p>
          <p>Le notificamos que su ticket <strong>${ticket.numeroRegistro}</strong> ha cambiado de etapa:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 18px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px;"><strong>Nuevo Estado:</strong> <span style="background-color: ${estadoInfo.color}; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px;">${estadoInfo.label}</span></p>
            <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Responsable de Acción:</strong> ${responsable}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Nota de Avance en Campo:</strong></p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #1e293b; background-color: #ffffff; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1;">"${nota}"</p>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${trackingUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Bitácora Completa</a>
          </div>
        </div>
      </div>
    `;

    const res = await this.sendEmail({
      to: recipient,
      subject: `[Actualización] Ticket ${ticket.numeroRegistro} ahora está ${estadoInfo.label}`,
      htmlBody,
      type: nuevoEstado === 'resuelto' ? 'caso_resuelto' : 'cambio_estado',
      ticketId: ticket.id,
    });

    return res.log;
  }

  /**
   * 3. Alerta: Bienvenida a nuevo usuario registrado
   */
  async notifyUserRegistered(user: User): Promise<EmailNotificationLog> {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">🏛️ JUNTA COMUNAL</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;">Bienvenida a la Plataforma Comunitaria</p>
        </div>

        <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
          <p>Estimado(a) <strong>${user.nombre}</strong>,</p>
          <p>Su cuenta ha sido creada satisfactoriamente con la cédula <strong>${user.cedula || 'N/A'}</strong> y asignada al sector <strong>${user.sector || 'Comunal'}</strong>.</p>
          <p>A través de su cuenta podrá radicar incidencias, adjuntar evidencias fotográficas y hacer seguimiento directo al trabajo de las cuadrillas comunales.</p>
        </div>
      </div>
    `;

    const res = await this.sendEmail({
      to: user.email,
      subject: `Bienvenido(a) a la Plataforma de la Junta Comunal - ${user.nombre}`,
      htmlBody,
      type: 'bienvenida',
    });

    return res.log;
  }
}

export const emailService = new EmailService();
