// se usa 
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

    const { memoryName, userID } = req.query;
    const { currentUser, type: folderName, fileType, fileName, token, uid, selectedTopic } = req.body;

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
    if (!selectedTopic) missingParams.push('selectedTopic'); // Added validation for selectedTopic

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

    // Sanitizar selectedTopic
    const safeTopicName = selectedTopic.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeTopicName) {
      throw new Error('Nombre de tópico inválido');
    }
    if (safeTopicName !== selectedTopic) {
      console.log(`Nombre de tópico sanitizado de "${selectedTopic}" a "${safeTopicName}"`);
    }

    // Verificar permisos
    const permission = await checkMemoryPermission({
      ownerKey: userID,
      memoryName,
      userEmail: currentUser,
      type: actionType,
      uid,
      token,
    });

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

    // Construir ruta con el nombre sanitizado, incluyendo selectedTopic
    const uploadPath = `${userID}/${memoryName}/${safeTopicName}/${fileType}/${safeFileName}`;
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
}*/
















