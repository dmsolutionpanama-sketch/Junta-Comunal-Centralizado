import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
const EVIDENCIAS_ROOT = path.join(UPLOADS_ROOT, 'evidencias');

// Ensure base upload directories exist
export async function ensureUploadDirectories(): Promise<void> {
  try {
    await fs.promises.mkdir(EVIDENCIAS_ROOT, { recursive: true });
  } catch (err) {
    console.error('Error creating base upload directory:', err);
  }
}

export interface SavedFileInfo {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  relativePath: string;
  absolutePath: string;
  fechaSubida: string;
  cedulaUsuario: string;
}

/**
 * Guarda una foto o documento organizado por fecha y usuario:
 * uploads/evidencias/{YYYY}/{MM}/{DD}/{cedula_limpia}/{timestamp}_{random}_{nombre_limpio}
 */
export async function savePhotoBuffer(
  buffer: Buffer,
  originalFilename: string,
  cedula: string = 'anonimo',
  mimeType: string = 'image/jpeg'
): Promise<SavedFileInfo> {
  await ensureUploadDirectories();

  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Sanitize cédula and filename to prevent directory traversal or malformed characters
  const cleanCedula = (cedula || 'anonimo').trim().replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30) || 'anonimo';
  const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
  const baseName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40) || 'foto';
  
  const targetDir = path.join(EVIDENCIAS_ROOT, year, month, day, cleanCedula);
  await fs.promises.mkdir(targetDir, { recursive: true });

  const randomHash = crypto.randomBytes(4).toString('hex');
  const finalFilename = `${Date.now()}_${randomHash}_${baseName}${ext}`;
  const absolutePath = path.join(targetDir, finalFilename);

  await fs.promises.writeFile(absolutePath, buffer);

  const relativePath = path.join('uploads', 'evidencias', year, month, day, cleanCedula, finalFilename);
  const publicUrl = `/uploads/evidencias/${year}/${month}/${day}/${cleanCedula}/${finalFilename}`;

  return {
    id: `att-${Date.now()}-${randomHash}`,
    url: publicUrl,
    fileName: finalFilename,
    originalName: originalFilename,
    mimeType,
    sizeBytes: buffer.length,
    relativePath,
    absolutePath,
    fechaSubida: now.toISOString(),
    cedulaUsuario: cleanCedula,
  };
}

/**
 * Guarda una imagen proveniente de data URL base64 (ej: data:image/png;base64,....)
 */
export async function savePhotoFromBase64(
  base64OrDataUri: string,
  originalFilename: string = 'evidencia.jpg',
  cedula: string = 'anonimo'
): Promise<SavedFileInfo> {
  let mimeType = 'image/jpeg';
  let rawData = base64OrDataUri;

  if (base64OrDataUri.startsWith('data:')) {
    const matches = base64OrDataUri.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      rawData = matches[2];
    }
  }

  const buffer = Buffer.from(rawData, 'base64');
  return savePhotoBuffer(buffer, originalFilename, cedula, mimeType);
}

/**
 * Métricas de almacenamiento de archivos en el servidor
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMb: string;
  uploadsRoot: string;
}> {
  let totalFiles = 0;
  let totalSizeBytes = 0;

  async function walkDir(dir: string) {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walkDir(full);
        } else if (entry.isFile()) {
          totalFiles++;
          const stat = await fs.promises.stat(full);
          totalSizeBytes += stat.size;
        }
      }
    } catch {
      // dir doesn't exist yet
    }
  }

  await walkDir(EVIDENCIAS_ROOT);

  return {
    totalFiles,
    totalSizeBytes,
    totalSizeMb: (totalSizeBytes / (1024 * 1024)).toFixed(2),
    uploadsRoot: '/uploads/evidencias/{año}/{mes}/{día}/{cédula}/',
  };
}
