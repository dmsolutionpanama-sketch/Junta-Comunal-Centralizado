import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido.')
    .email('El formato del correo electrónico es inválido.'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida.')
    .min(4, 'La contraseña debe tener al menos 4 caracteres.'),
  role: z.enum(['administrador', 'agente', 'usuario', 'supervisor']).optional(),
});

export const reportanteSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del reportante es obligatorio.')
    .min(2, 'El nombre del reportante debe tener al menos 2 caracteres.')
    .max(120, 'El nombre no puede exceder 120 caracteres.'),
  cedula: z
    .string()
    .min(1, 'La cédula del reportante es obligatoria.')
    .min(3, 'La cédula debe tener al menos 3 caracteres.')
    .max(30, 'La cédula no puede exceder 30 caracteres.'),
  telefono: z.string().optional().default(''),
  email: z
    .string()
    .email('El correo electrónico del reportante no es válido.')
    .optional()
    .or(z.literal('')),
  genero: z.enum(['femenino', 'masculino', 'otro']),
  edad: z.coerce
    .number()
    .min(1, 'La edad debe ser mayor a 0 años.')
    .max(120, 'La edad debe ser menor a 120 años.'),
  sector: z.string().optional().default(''),
});

export const adjuntoSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(['foto', 'video', 'documento']).default('foto'),
  nombre: z.string().min(1, 'El nombre del archivo es requerido.'),
  url: z.string().min(1, 'La URL o data del archivo es requerida.'),
  thumbnailUrl: z.string().optional(),
  tamanoBytes: z.number().optional(),
  fechaSubida: z.string().optional(),
});

export const createTicketSchema = z.object({
  asunto: z
    .string()
    .min(1, 'El asunto es obligatorio.')
    .min(3, 'El asunto debe tener al menos 3 caracteres.')
    .max(200, 'El asunto no debe superar los 200 caracteres.'),
  descripcion: z
    .string()
    .min(1, 'La descripción del caso es obligatoria.')
    .min(10, 'La descripción debe tener al menos 10 caracteres para mayor detalle.')
    .max(3000, 'La descripción no puede superar 3000 caracteres.'),
  categoriaId: z
    .string()
    .min(1, 'Debe seleccionar una categoría válida.'),
  categoriaNombre: z.string().optional(),
  sectorNombre: z
    .string()
    .min(1, 'Debe seleccionar un sector de residencia válido.'),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).default('media'),
  direccionDetallada: z.string().optional().default(''),
  ubicacionLat: z.coerce.number().optional().default(9.082),
  ubicacionLng: z.coerce.number().optional().default(-79.528),
  reportante: reportanteSchema,
  adjuntos: z.array(adjuntoSchema).optional().default([]),
  creadoPor: z.string().optional(),
});

export const updateTicketSchema = z.object({
  asunto: z.string().min(3).max(200).optional(),
  descripcion: z.string().min(10).max(3000).optional(),
  categoriaId: z.string().optional(),
  categoriaNombre: z.string().optional(),
  sectorNombre: z.string().optional(),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  estado: z.enum(['abierto', 'en_progreso', 'resuelto', 'cerrado']).optional(),
  asignadoA: z.string().optional(),
  departamento: z.string().optional(),
  direccionDetallada: z.string().optional(),
});

export const addTraceEventSchema = z.object({
  tipoEvento: z.enum(['creacion', 'cambio_estado', 'comentario', 'reasignacion', 'cierre']),
  responsable: z
    .string()
    .min(1, 'El nombre del responsable es obligatorio.')
    .min(2, 'El responsable debe tener al menos 2 caracteres.'),
  rolResponsable: z.string().optional().default('Funcionario'),
  nota: z
    .string()
    .min(1, 'La nota de bitácora es obligatoria.')
    .min(3, 'La nota debe tener al menos 3 caracteres explicativos.'),
  estadoNuevo: z.enum(['abierto', 'en_progreso', 'resuelto', 'cerrado']).optional(),
  canalInteraccion: z
    .enum(['whatsapp', 'llamada', 'presencial', 'web', 'correo', 'cuadrilla_campo'])
    .optional()
    .default('whatsapp'),
  minutosConsumidos: z.coerce.number().min(0).max(1440).optional().default(0),
});

/**
 * Format Zod validation errors into a clean, client-friendly structure
 */
export function formatZodErrors(error: z.ZodError) {
  const issues = (error as any).issues || (error as any).errors || [];
  return issues.map((err: any) => ({
    field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
    message: err.message || 'Dato inválido',
  }));
}
