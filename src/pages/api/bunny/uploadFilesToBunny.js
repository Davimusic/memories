// pages/api/bunny/uploadFilesToBunny.js

import { IncomingForm } from 'formidable';
import { createReadStream, unlinkSync } from 'fs';
import { fetch } from '@whatwg-node/fetch';
import PQueue from 'p-queue';

// Configuración de la API de Next.js
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

// Constantes de configuración
const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500MB límite total
const CONCURRENCY_LIMIT = 3; // Subidas simultáneas máximas
const UPLOAD_TIMEOUT = 300_000; // 5 minutos (300,000 ms)
const BUNNY_ACCESS_KEY = '7026ecef-f874-4c3c-8968e8362281-949a-4e5b';
const STORAGE_ZONE = 'goodmemories';
const BUNNY_ENDPOINT = `https://ny.storage.bunnycdn.com/${STORAGE_ZONE}/`;

// Mapeo de extensiones a MIME types
const MIME_TYPES = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp'
};

// Crear estructura de directorios en BunnyCDN
async function createDirectoryHierarchy(baseUrl, accessKey, folderPath) {
  const segments = folderPath.split('/').filter(s => s);
  let currentPath = '';
  
  for (const segment of segments) {
    currentPath += `${segment}/`;
    try {
      const encodedPath = encodeURIComponent(currentPath).replace(/%2F/g, '/');
      const response = await fetch(`${baseUrl}${encodedPath}`, {
        method: 'PUT',
        headers: { 'AccessKey': accessKey }
      });
      
      if (!response.ok && response.status !== 409) { // Ignorar error si ya existe
        console.error(`Error creando directorio: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error en createDirectoryHierarchy: ${error.message}`);
    }
  }
}

// Función para sanitizar nombres de archivo
function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .toLowerCase();
}

export default async function handler(req, res) {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    // Validación temprana del tamaño del request
    let accumulatedSize = 0;
    const sizeValidation = new Promise((_, reject) => {
      req.on('data', (chunk) => {
        accumulatedSize += chunk.length;
        if (accumulatedSize > MAX_UPLOAD_SIZE) {
          req.destroy();
          reject(new Error(`Límite de tamaño excedido (${MAX_UPLOAD_SIZE} bytes)`));
        }
      });
    });

    // Configurar el parser de formulario
    const form = new IncomingForm({
      maxTotalFileSize: MAX_UPLOAD_SIZE,
      maxFileSize: MAX_UPLOAD_SIZE,
      multiples: true,
      keepExtensions: false,
      allowEmptyFiles: false,
    });

    // Parsear formulario
    const [fields, files] = await Promise.race([
      new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          err ? reject(err) : resolve([fields, files]);
        });
      }),
      sizeValidation
    ]);

    // Validar campos requeridos
    const requiredFields = ['userId', 'memoryTitle', 'fileType'];
    for (const field of requiredFields) {
      if (!fields[field]?.[0]?.trim()) {
        return res.status(400).json({ error: `Campo requerido faltante: ${field}` });
      }
    }

    // Sanitizar inputs
    const userId = sanitizeFilename(fields.userId[0]);
    const memoryTitle = sanitizeFilename(fields.memoryTitle[0]);
    const fileType = sanitizeFilename(fields.fileType[0]);
    const folderPath = `${userId}/${memoryTitle}/${fileType}`;

    // Crear directorios en BunnyCDN
    await createDirectoryHierarchy(BUNNY_ENDPOINT, BUNNY_ACCESS_KEY, folderPath);

    // Configurar cola de subidas
    const queue = new PQueue({
      concurrency: CONCURRENCY_LIMIT,
      timeout: UPLOAD_TIMEOUT,
    });

    // Procesar archivos
    const filesArray = files.file ? (Array.isArray(files.file) ? files.file : [files.file]) : [];
    const uploadedFiles = [];

    await queue.addAll(filesArray.map(file => async () => {
      try {
        // Extraer nombre y extensión
        const originalName = file.originalFilename || 'unnamed';
        const extIndex = originalName.lastIndexOf('.');
        const ext = extIndex !== -1 ? originalName.slice(extIndex + 1).toLowerCase() : '';
        
        if (!ext || !MIME_TYPES[ext]) {
          throw new Error('Tipo de archivo no permitido');
        }

        // Generar nombre único
        const sanitizedName = sanitizeFilename(originalName.slice(0, extIndex));
        const uniqueName = `${Date.now()}_${sanitizedName}.${ext}`;
        const finalPath = `${folderPath}/${uniqueName}`;
        const encodedPath = encodeURIComponent(finalPath).replace(/%2F/g, '/');

        // Configurar stream y timeout
        const fileStream = createReadStream(file.filepath);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT);

        // Subir archivo
        const response = await fetch(`${BUNNY_ENDPOINT}${encodedPath}`, {
          method: 'PUT',
          headers: {
            'AccessKey': BUNNY_ACCESS_KEY,
            'Content-Type': MIME_TYPES[ext],
            'Content-Length': file.size.toString(),
            'Cache-Control': 'public, max-age=31536000'
          },
          body: fileStream,
          signal: controller.signal,
          keepalive: true
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        uploadedFiles.push({
          originalName: originalName,
          fileName: uniqueName,
          url: `https://goodmemoriesapp.b-cdn.net/${finalPath}`,
          size: file.size,
          success: true
        });

      } catch (error) {
        uploadedFiles.push({
          originalName: file.originalFilename,
          error: error.message,
          success: false
        });
      } finally {
        try { unlinkSync(file.filepath); } catch (e) {
          console.error('Error limpiando temporal:', e);
        }
      }
    }));

    return res.status(200).json({
      success: uploadedFiles.some(f => f.success),
      files: uploadedFiles,
      stats: {
        totalFiles: filesArray.length,
        successCount: uploadedFiles.filter(f => f.success).length,
        totalSize: uploadedFiles.reduce((acc, f) => acc + (f.size || 0), 0)
      }
    });

  } catch (error) {
    console.error('Error global:', error);
    return res.status(error.statusCode || 500).json({
      error: error.message.includes('Límite') 
        ? error.message 
        : 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}


























/*import { IncomingForm } from 'formidable';
import { readFileSync, unlinkSync } from 'fs';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  },
};

// Función para crear estructura de directorios
async function createDirectoryHierarchy(BUNNY_ENDPOINT, BUNNY_ACCESS_KEY, folderPath) {
  const segments = folderPath.split('/').filter(s => s);
  let currentPath = '';
  
  for (const segment of segments) {
    currentPath += `${segment}/`;
    try {
      const encodedPath = currentPath.split('/')
        .map(p => encodeURIComponent(p))
        .join('/');
      
      const response = await fetch(`${BUNNY_ENDPOINT}${encodedPath}`, {
        method: 'PUT',
        headers: { 'AccessKey': BUNNY_ACCESS_KEY }
      });
      
      if (!response.ok) {
        console.error(`Error creando directorio: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error en createDirectoryHierarchy: ${error.message}`);
    }
  }
}

// Función para extraer nombre y extensión
function parseFileName(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return { name: filename, ext: '' };
  
  return {
    name: filename.slice(0, lastDotIndex),
    ext: filename.slice(lastDotIndex + 1).toLowerCase()
  };
}

// Mapeo de MIME types
const MIME_TYPES = {
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  // Video
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  // Imágenes
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp'
};

// Sanitización de nombres
function sanitizeFilename(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .toLowerCase();
}

export default async function handler(req, res) {
  // Configuración CORS para el endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ 
    error: 'Método no permitido',
    files: []
  });

  const BUNNY_ACCESS_KEY = '7026ecef-f874-4c3c-8968e8362281-949a-4e5b';
  const STORAGE_ZONE = 'goodmemories';
  const BUNNY_ENDPOINT = `https://ny.storage.bunnycdn.com/${STORAGE_ZONE}/`;

  try {
    // Parsear el formulario
    const form = new IncomingForm({
      multiples: true,
      keepExtensions: false,
      maxFileSize: 500 * 1024 * 1024 // 500MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        err ? reject(err) : resolve([fields, files]);
      });
    });

    // Validar campos requeridos
    const requiredFields = ['userId', 'memoryTitle', 'fileType'];
    for (const field of requiredFields) {
      if (!fields[field]?.[0]?.trim()) {
        return res.status(400).json({
          error: `Campo requerido faltante: ${field}`,
          files: []
        });
      }
    }

    // Normalizar parámetros
    const userId = sanitizeFilename(fields.userId[0]);
    const memoryTitle = sanitizeFilename(fields.memoryTitle[0]);
    const fileType = sanitizeFilename(fields.fileType[0]);
    const folderPath = `${userId}/${memoryTitle}/${fileType}`;

    // Crear estructura de directorios
    await createDirectoryHierarchy(BUNNY_ENDPOINT, BUNNY_ACCESS_KEY, folderPath);

    // Procesar archivos
    const filesArray = files.file ? (Array.isArray(files.file) ? files.file : [files.file]) : [];
    
    if (filesArray.length === 0) {
      return res.status(400).json({
        error: 'No se recibieron archivos',
        files: []
      });
    }

    const uploadedFiles = [];
    
    for (const file of filesArray) {
      try {
        // Extraer y validar nombre de archivo
        const { name: originalName, ext } = parseFileName(file.originalFilename);
        if (!ext) throw new Error('Extensión de archivo no válida');
        
        const sanitizedName = sanitizeFilename(originalName);
        const uniqueName = `${Date.now()}_${sanitizedName}.${ext}`;
        const finalFileName = `${folderPath}/${uniqueName}`;
        const encodedFileName = finalFileName.split('/').map(encodeURIComponent).join('/');

        // Obtener MIME type
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        const fileBuffer = readFileSync(file.filepath);

        // Subir a BunnyCDN
        const uploadResponse = await fetch(`${BUNNY_ENDPOINT}${encodedFileName}`, {
          method: 'PUT',
          headers: {
            'AccessKey': BUNNY_ACCESS_KEY,
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000'
          },
          body: fileBuffer,
          signal: AbortSignal.timeout(30000)
        });

        if (!uploadResponse.ok) {
          throw new Error(`Error ${uploadResponse.status}: ${await uploadResponse.text()}`);
        }

        // Construir URL pública
        const publicUrl = `https://goodmemoriesapp.b-cdn.net/${finalFileName}`;
        
        uploadedFiles.push({
          originalName: file.originalFilename,
          fileName: uniqueName,
          url: publicUrl,
          mimeType,
          path: finalFileName,
          success: true
        });

      } catch (error) {
        console.error(`Error subiendo archivo: ${error.message}`);
        uploadedFiles.push({
          originalName: file.originalFilename,
          error: error.message,
          success: false
        });
      } finally {
        try { unlinkSync(file.filepath); } catch (e) {}
      }
    }

    return res.status(200).json({
      success: uploadedFiles.some(f => f.success),
      files: uploadedFiles,
      directory: folderPath
    });

  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
      files: []
    });
  }
}*/




