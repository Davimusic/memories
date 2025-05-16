import { IncomingForm } from 'formidable';
import { readFileSync, unlinkSync } from 'fs';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

// Función para crear estructura de directorios
async function createDirectoryHierarchy(BUNNY_ENDPOINT, BUNNY_ACCESS_KEY, folderPath) {
  const segments = folderPath.split('/').filter(s => s);
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `${segment}/`;
    try {
      const encodedPath = currentPath
        .split('/')
        .map(p => encodeURIComponent(p))
        .join('/');
      
      const response = await fetch(`${BUNNY_ENDPOINT}${encodedPath}`, {
        method: 'PUT',
        headers: { 'AccessKey': BUNNY_ACCESS_KEY }
      });
      
      // Si la respuesta es 400, se asume que el directorio ya existe
      if (!response.ok) {
        if (response.status === 400) {
          console.warn(`El directorio "${currentPath}" ya existe. Se continúa con el proceso.`);
        } else {
          console.error(`Error creando directorio "${currentPath}": ${response.status}`);
        }
      }
    } catch (error) {
      console.error(`Error en createDirectoryHierarchy para "${currentPath}": ${error.message}`);
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
  if (req.method !== 'POST')
    return res.status(405).json({ 
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
    const filesArray = files.file 
      ? (Array.isArray(files.file) ? files.file : [files.file])
      : [];
    
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
        const encodedFileName = finalFileName
          .split('/')
          .map(encodeURIComponent)
          .join('/');

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
        console.error(`Error subiendo archivo "${file.originalFilename}": ${error.message}`);
        uploadedFiles.push({
          originalName: file.originalFilename,
          error: error.message,
          success: false
        });
      } finally {
        try {
          unlinkSync(file.filepath);
        } catch (e) {
          console.error(`No se pudo eliminar el archivo temporal: ${e.message}`);
        }
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




