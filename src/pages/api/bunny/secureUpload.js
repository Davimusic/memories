import { checkMemoryPermission } from '../mongoDb/queries/checkMemoryPermission';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

const FOLDER_ACTIONS = {
  uploadFiles: 'upload',
  memories: 'view',
  editMemories: 'edit',
};

const VALID_FILE_TYPES = ['audio', 'image', 'video'];

const ALLOWED_EXTENSIONS = {
  audio: ['mp3'],
  image: ['jpg', 'jpeg', 'png', 'gif'],
  video: ['mp4'],
};

export default async function handler(req, res) {
  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    

    // Log de diagnóstico
    /*console.log('Request received:', {
      query: req.query,
      body: req.body,
    });*/

    const { memoryName, userID } = req.query;
    const { currentUser, type: folderName, fileType, fileName, token, uid } = req.body;


    console.log('secure upload.................XD');
    


    

    // Validar parámetros
    const missingParams = [];
    if (!memoryName) missingParams.push('memoryName');
    if (!userID) missingParams.push('userID');
    if (!currentUser) missingParams.push('currentUser');
    if (!folderName) missingParams.push('type');
    if (!fileType) missingParams.push('fileType');
    if (!fileName) missingParams.push('fileName');
    if (!token) missingParams.push('token');
    if (!uid) missingParams.push('uid');

    if (missingParams.length > 0) {
      throw new Error(`Parámetros faltantes: ${missingParams.join(', ')}`);
    }

    // Validar folderName
    const actionType = FOLDER_ACTIONS[folderName];
    if (!actionType) {
      throw new Error(`Tipo de carpeta inválido. Valores permitidos: ${Object.keys(FOLDER_ACTIONS).join(', ')}`);
    }

    

    // Validar fileType
    if (!VALID_FILE_TYPES.includes(fileType)) {
      throw new Error(`Tipo de archivo inválido. Valores permitidos: ${VALID_FILE_TYPES.join(', ')}`);
    }

    // Sanitizar y validar fileName
    const safeFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeFileName) {
      throw new Error('Nombre de archivo inválido');
    }
    if (safeFileName !== fileName) {
      console.log(`Nombre de archivo sanitizado de "${fileName}" a "${safeFileName}"`);
    }

    // Validar extensión del archivo
    const ext = path.extname(safeFileName).toLowerCase().replace('.', '');
    if (!ALLOWED_EXTENSIONS[fileType].includes(ext)) {
      throw new Error(`Extensión de archivo no permitida para el tipo ${fileType}. Extensiones permitidas: ${ALLOWED_EXTENSIONS[fileType].join(', ')}`);
    }

    
    
    
    
    console.log('mirarrrrrrrr');
    console.log({
      userId: userID,
      memoryName,
      userEmail: currentUser,
      type: actionType,
      uid,
      token
    });

    // Verificar permisos
    const permission = await checkMemoryPermission({
      ownerKey: userID,
      memoryName,
      userEmail: currentUser,
      type: actionType,
      uid,
      token
    });

    //console.log('Permiso obtenido:', permission);

    if (!permission.accessAllowed) {
      throw new Error(`Acceso denegado para ${actionType}`);
    }

    // Validar variables de entorno
    const requiredEnvVars = [
      'NEXT_PUBLIC_BUNNY_REGION',
      'NEXT_PUBLIC_BUNNY_STORAGE_ZONE',
      'NEXT_PUBLIC_BUNNY_ACCESS_KEY',
    ];

    const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingEnvVars.join(', ')}`);
    }

    // Construir ruta con el nombre sanitizado
    const uploadPath = `${userID}/${memoryName}/${fileType}/${safeFileName}`;
    console.log('Ruta generada:', uploadPath);

    // Construir URL final
    const uploadUrl = `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${
      process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE
    }/${uploadPath}`;

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      uploadUrl,
      headers: {
        AccessKey: process.env.NEXT_PUBLIC_BUNNY_ACCESS_KEY,
        'Content-Type': req.headers['file-type'] || 'application/octet-stream',
      },
      safeName: safeFileName,
    });
  } catch (error) {
    console.error('Error crítico:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });
  }
}

























/*import { checkMemoryPermission } from '../mongoDb/queries/checkMemoryPermission';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb' // Aumentar límite para subida de archivos grandes
    }
  }
};

export default async function handler(req, res) {
  // Extraer parámetros de la URL
  const { memoryName, userID } = req.query;
  
  // Extraer datos del body de la solicitud
  const { type: selectedType, currentUser: rawUserEmail } = req.body;

  try {
    // Validar parámetros esenciales
    if (!memoryName || !userID || !rawUserEmail) {
      throw new Error('Parámetros requeridos faltantes');
    }

    // Sanitizar email para coincidir con formato de la base de datos
    const currentUser = rawUserEmail.replace(/[@.]/g, '_');

    // Verificar permisos de subida
    const { uploadAllowed, ownerEmail } = await checkMemoryPermission({
      userId: userID,
      memoryName,
      currentUser,
      actionType: 'upload' // Nuevo parámetro para especificar tipo de acción
    });

    if (!uploadAllowed) {
      throw new Error(`Usuario ${rawUserEmail} no tiene permisos para subir archivos`);
    }

    res.status(200).json({
      uploadAllowed,
      ownerEmail,
    });


    // Generar nombre seguro para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const safeName = `${timestamp}_${randomString}`;

    // Construir ruta de subida
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
    const uploadPath = `${basePath}/${ownerEmail}/${memoryName}/${selectedType}/${safeName}`;

    // Construir URL final
    const uploadUrl = `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}/${uploadPath}`;

    res.status(200).json({
      uploadUrl,
      headers: {
        'AccessKey': process.env.NEXT_PUBLIC_BUNNY_ACCESS_KEY,
        'Content-Type': req.headers['file-type'] || 'application/octet-stream'
      },
      sanitizedName: safeName
    });

  } catch (error) {
    console.error('Error en secureUpload:', error);
    res.status(403).json({
      success: false,
      error: error.message || 'Error de autorización para subida de archivos'
    });
  }
}*/