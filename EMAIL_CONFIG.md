# 📧 Guía de Configuración de Correo Electrónico - Junta Comunal

Esta guía explica detalladamente dónde y cómo configurar el servicio de correos electrónicos para el envío automático de confirmaciones y alertas de avance en tickets.

---

## 1. Archivos Clave del Sistema de Correos

1. **`src/services/emailService.ts`**:
   - Contiene la lógica del motor de correos, las plantillas HTML (radicación de ticket, avance de cuadrilla, caso resuelto, bienvenida a usuario) y el registro de bitácora de envíos.
2. **`server.ts`**:
   - Endpoint `/api/notifications/email` que procesa los despachos desde el servidor.
3. **`.env` / `.env.example`**:
   - Variables de entorno donde se configuran las credenciales del servidor SMTP o API Key.

---

## 2. Variables de Entorno Requeridas (.env)

Agregue las siguientes variables a su archivo `.env` según su proveedor:

```env
# Proveedor activo: 'smtp' | 'sendgrid' | 'resend' | 'gmail' | 'simulated'
EMAIL_SERVICE_PROVIDER=smtp

# Datos de Remitente Oficial
EMAIL_FROM_ADDRESS=notificaciones@juntacomunal.gob.pa
EMAIL_FROM_NAME="Junta Comunal - Sistema de Incidencias"

# Configuración SMTP Estándar (Office 365, Servidor Propio, Hostinger, cPanel)
EMAIL_SMTP_HOST=mail.juntacomunal.gob.pa
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=notificaciones@juntacomunal.gob.pa
EMAIL_SMTP_PASSWORD=MiContraseñaSegura2025!
```

---

## 3. Ejemplos de Conexión según Proveedor

### Opción A: Conexión con Gmail / Google Workspace (SMTP)
```env
EMAIL_SERVICE_PROVIDER=gmail
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=su-correo@gmail.com
EMAIL_SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Contraseña de aplicación de 16 dígitos de Google
```

### Opción B: Conexión con SendGrid (API REST)
```env
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=notificaciones@juntacomunal.gob.pa
```
*Instalación de paquete opcional:* `npm install @sendgrid/mail`

### Opción C: Conexión con Resend
```env
EMAIL_SERVICE_PROVIDER=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=onboarding@resend.dev
```

---

## 4. Tipos de Alertas Generadas Automáticamente

1. **`notifyTicketCreated(ticket)`**: Se dispara al crear un ticket. Envía al correo del ciudadano el número de radicado con prefijo (ej: `ALU-2025-001`), sector, descripción y enlace directo al portal.
2. **`notifyStatusUpdate(ticket, nuevoEstado, nota, responsable)`**: Se dispara al cambiar el progreso o agregar bitácora. Notifica a los interesados si la cuadrilla está en camino o el estado actual.
3. **`notifyUserRegistered(user)`**: Se dispara al registrar un nuevo vecino en el sistema.

---

## 5. Visualizador de Notificaciones en la Interfaz

El personal administrativo y la Junta Comunal pueden ver el historial de correos despachados en tiempo real desde la sección **"Alertas & Correos"** del panel administrativo.
