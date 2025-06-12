import clientPromise from '../../connectToDatabase';
import { checkMemoryPermission } from '../../mongoDb/queries/checkMemoryPermission';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Fixed media type mapping
const mapTypeToCategory = (type) => {
  switch (type) {
    case 'image':
      return 'photos';
    case 'video':
      return 'videos';
    case 'audio':
      return 'audios';
    default:
      return 'texts';
  }
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
      });
    }

    const { ownerKey, memoryName, userEmail, filesToDelete, uid, token } = req.body;

    console.log('deleteFilesUserMongoDB.x.x.x.x.x.x.x.x.x.x.x.');
    console.log('ownerKey:', ownerKey);
    console.log('memoryName:', memoryName);
    console.log('userEmail:', userEmail);
    console.log('filesToDelete:', filesToDelete);

    if (!ownerKey || !memoryName || !userEmail || !filesToDelete) {
      return res.status(400).json({
        success: false,
        message: 'Parameters ownerKey, memoryName, userEmail, and filesToDelete are required',
      });
    }

    // Extract URLs from filesToDelete
    let urlsToDelete = [];
    if (filesToDelete.success === true && Array.isArray(filesToDelete.deletedFiles)) {
      urlsToDelete = filesToDelete.deletedFiles;
    } else if (filesToDelete.success === false && Array.isArray(filesToDelete.details)) {
      urlsToDelete = filesToDelete.details.map(detail => detail.file).filter(file => file);
    }

    // Validate that urlsToDelete is a non-empty array
    if (!Array.isArray(urlsToDelete) || urlsToDelete.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'filesToDelete must contain a non-empty array of URLs in deletedFiles or details',
      });
    }

    // Fixed: Normalize URLs consistently
    const normalizedUrls = urlsToDelete.map(url => {
      // Convert storage URL to CDN URL
      return url.replace(
        'ny.storage.bunnycdn.com/goodmemories', 
        'goodmemoriesapp.b-cdn.net'
      );
    });

    console.log('Normalized urlsToDelete:', normalizedUrls);

    // Verify permissions
    const permission = await checkMemoryPermission({
      ownerKey,
      memoryName,
      userEmail,
      type: 'edit',
      uid,
      token,
    });

    console.log('Permission check result:', permission);

    if (!permission.accessAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for editing memories',
      });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Find the user document
    const doc = await collection.findOne({ _id: ownerKey });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'User document not found in the database',
      });
    }

    // Verify that the memory exists
    const memoryData = doc[memoryName];
    if (!memoryData) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found',
      });
    }

    // Verify that the topics property exists
    const topics = memoryData.topics;
    if (!topics) {
      return res.status(400).json({
        success: false,
        message: 'The memory does not contain topics information',
      });
    }

    // Group files to delete by topic and category
    const filesToDeleteGrouped = {};

    normalizedUrls.forEach((url) => {
      // FIXED: Extract URL parts consistently
      const urlParts = url.split('/');
      
      // Find the index of memoryName in the URL
      const memoryNameIndex = urlParts.indexOf(memoryName);
      
      if (memoryNameIndex === -1 || memoryNameIndex >= urlParts.length - 3) {
        console.warn('Invalid URL format:', url);
        return;
      }

      // Extract parts after memoryName
      const topic = urlParts[memoryNameIndex + 1];
      const type = urlParts[memoryNameIndex + 2];
      const category = mapTypeToCategory(type);

      if (!filesToDeleteGrouped[topic]) {
        filesToDeleteGrouped[topic] = {};
      }
      if (!filesToDeleteGrouped[topic][category]) {
        filesToDeleteGrouped[topic][category] = [];
      }
      filesToDeleteGrouped[topic][category].push(url);
    });

    console.log('Files grouped for deletion:', filesToDeleteGrouped);

    if (Object.keys(filesToDeleteGrouped).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not process the provided URLs',
      });
    }

    // Build the $pull operations
    const pullOperations = {};
    Object.entries(filesToDeleteGrouped).forEach(([topic, categories]) => {
      Object.entries(categories).forEach(([category, urls]) => {
        const fieldPath = `${memoryName}.topics.${topic}.${category}`;
        // FIXED: Use $in with normalized URLs
        pullOperations[fieldPath] = { url: { $in: urls } };
      });
    });

    // Update the document using $pull
    const updateResult = await collection.updateOne(
      { _id: ownerKey },
      { $pull: pullOperations }
    );

    console.log('Update result:', updateResult);

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'No changes were made to the database, possible update error',
        pullOperations,
      });
    }

    // Return success response even if Bunny.net deletion failed
    return res.status(200).json({
      success: true,
      message: 'Files successfully deleted from the database',
      bunnyNetStatus: filesToDelete
    });
  } catch (error) {
    console.error('Error in deleteFilesUser:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      requestBody: req.body,
    });
  }
}



























/*import clientPromise from '../../connectToDatabase';
import { checkMemoryPermission } from '../../mongoDb/queries/checkMemoryPermission';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Fixed media type mapping
const mapTypeToCategory = (type) => {
  switch (type) {
    case 'image':
      return 'photos';
    case 'video':
      return 'videos';
    case 'audio':
      return 'audios';
    default:
      return 'texts';
  }
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido',
      });
    }

    const { ownerKey, memoryName, userEmail, filesToDelete, uid, token } = req.body;

    console.log('deleteFilesUserMongoDB.x.x.x.x.x.x.x.x.x.x.x.');
    console.log('ownerKey:', ownerKey);
    console.log('memoryName:', memoryName);
    console.log('userEmail:', userEmail);
    console.log('filesToDelete:', filesToDelete);

    if (!ownerKey || !memoryName || !userEmail || !filesToDelete) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros ownerKey, memoryName, userEmail y filesToDelete son requeridos',
      });
    }

    // Extraer URLs de filesToDelete
    let urlsToDelete = [];
    if (filesToDelete.success === true && Array.isArray(filesToDelete.deletedFiles)) {
      urlsToDelete = filesToDelete.deletedFiles;
    } else if (filesToDelete.success === false && Array.isArray(filesToDelete.details)) {
      urlsToDelete = filesToDelete.details.map(detail => detail.file).filter(file => file);
    }

    // Validar que urlsToDelete sea un array no vacío
    if (!Array.isArray(urlsToDelete) || urlsToDelete.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'filesToDelete debe contener un array no vacío de URLs en deletedFiles o details',
      });
    }

    // Fixed: Normalizar URLs consistentemente
    const normalizedUrls = urlsToDelete.map(url => {
      // Convertir URL de almacenamiento a URL CDN
      return url.replace(
        'ny.storage.bunnycdn.com/goodmemories', 
        'goodmemoriesapp.b-cdn.net'
      );
    });

    console.log('Normalized urlsToDelete:', normalizedUrls);

    // Verificar permisos
    const permission = await checkMemoryPermission({
      ownerKey,
      memoryName,
      userEmail,
      type: 'edit',
      uid,
      token,
    });

    console.log('Permission check result:', permission);

    if (!permission.accessAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado para editar recuerdos',
      });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Buscar el documento del usuario
    const doc = await collection.findOne({ _id: ownerKey });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el documento del usuario en la base de datos',
      });
    }

    // Verificar que el recuerdo exista
    const memoryData = doc[memoryName];
    if (!memoryData) {
      return res.status(404).json({
        success: false,
        message: 'Recuerdo no encontrado',
      });
    }

    // Verificar que exista la propiedad topics
    const topics = memoryData.topics;
    if (!topics) {
      return res.status(400).json({
        success: false,
        message: 'El recuerdo no contiene información de topics',
      });
    }

    // Agrupar archivos a eliminar por tema y categoría
    const filesToDeleteGrouped = {};

    normalizedUrls.forEach((url) => {
      // FIXED: Extraer partes de la URL consistentemente
      const urlParts = url.split('/');
      
      // Buscar el índice del memoryName en la URL
      const memoryNameIndex = urlParts.indexOf(memoryName);
      
      if (memoryNameIndex === -1 || memoryNameIndex >= urlParts.length - 3) {
        console.warn('URL con formato inválido:', url);
        return;
      }

      // Extraer partes después del memoryName
      const topic = urlParts[memoryNameIndex + 1];
      const type = urlParts[memoryNameIndex + 2];
      const category = mapTypeToCategory(type);

      if (!filesToDeleteGrouped[topic]) {
        filesToDeleteGrouped[topic] = {};
      }
      if (!filesToDeleteGrouped[topic][category]) {
        filesToDeleteGrouped[topic][category] = [];
      }
      filesToDeleteGrouped[topic][category].push(url);
    });

    console.log('Files grouped for deletion:', filesToDeleteGrouped);

    if (Object.keys(filesToDeleteGrouped).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se pudieron procesar las URLs proporcionadas',
      });
    }

    // Construir las operaciones de $pull
    const pullOperations = {};
    Object.entries(filesToDeleteGrouped).forEach(([topic, categories]) => {
      Object.entries(categories).forEach(([category, urls]) => {
        const fieldPath = `${memoryName}.topics.${topic}.${category}`;
        // FIXED: Usar $in con las URLs normalizadas
        pullOperations[fieldPath] = { url: { $in: urls } };
      });
    });

    // Actualizar el documento usando $pull
    const updateResult = await collection.updateOne(
      { _id: ownerKey },
      { $pull: pullOperations }
    );

    console.log('Update result:', updateResult);

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'No se realizaron cambios en la base de datos, posible error en la actualización',
        pullOperations,
      });
    }

    // Return success response even if Bunny.net deletion failed
    return res.status(200).json({
      success: true,
      message: 'Archivos eliminados correctamente de la base de datos',
      bunnyNetStatus: filesToDelete
    });
  } catch (error) {
    console.error('Error en deleteFilesUser:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      requestBody: req.body,
    });
  }
}*/




