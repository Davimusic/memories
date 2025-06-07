import clientPromise from '../../connectToDatabase';
import { checkMemoryPermission } from '../../mongoDb/queries/checkMemoryPermission';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
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

    console.log('deleteFilesUserMongoDB');
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

    // Validate filesToDelete structure
    if (
      typeof filesToDelete !== 'object' ||
      !['photos', 'videos', 'audios'].some((cat) => Array.isArray(filesToDelete[cat]) && filesToDelete[cat].length > 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'filesToDelete debe ser un objeto con al menos una categoría (photos, videos, audios) con archivos válidos',
      });
    }

    console.log('MongoDB delete request:', { ownerKey, memoryName, userEmail, filesToDelete });

    // Check permissions
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

    // Fetch the user's document
    const doc = await collection.findOne({ _id: ownerKey });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el documento del usuario en la base de datos',
      });
    }

    // Verify memory exists
    const memoryData = doc[memoryName];
    if (!memoryData) {
      return res.status(404).json({
        success: false,
        message: 'Recuerdo no encontrado',
      });
    }

    // Check for media property
    let media = memoryData.media;
    if (!media) {
      return res.status(400).json({
        success: false,
        message: 'El recuerdo no contiene información de media',
      });
    }

    // Process each category and filter files to delete
    const categories = ['photos', 'videos', 'audios'];
    const updateFields = {};
    let filesRemoved = false;

    categories.forEach((cat) => {
      if (filesToDelete[cat] && Array.isArray(filesToDelete[cat]) && filesToDelete[cat].length > 0) {
        // Get list of file_name to delete
        const filesNamesToDelete = filesToDelete[cat].map((file) => file.file_name);
        // Get current files or empty array if none
        const currentFiles = Array.isArray(media[cat]) ? media[cat] : [];
        console.log(`Processing category ${cat}:`, {
          filesNamesToDelete,
          currentFiles: currentFiles.map((file) => ({
            file_name: file.file_name,
            derived_name: file.url ? file.url.split('/').pop() : null,
            raw: file,
          })),
        });

        // Filter files, ensuring file_name exists
        const filteredFiles = currentFiles.filter((file) => {
          const fileName = file.file_name || (file.url ? file.url.split('/').pop() : null);
          if (!fileName) {
            console.warn(`File in ${cat} missing file_name and valid url:`, file);
            return true; // Keep files without file_name to avoid unintended deletion
          }
          return !filesNamesToDelete.includes(fileName);
        });

        // Check if files were removed
        if (filteredFiles.length < currentFiles.length) {
          filesRemoved = true;
        }

        // Build field path for update
        const fieldPath = `${memoryName}.media.${cat}`;
        updateFields[fieldPath] = filteredFiles;
        console.log(`Updating ${fieldPath}:`, filteredFiles.map((file) => file.file_name || file.url.split('/').pop()));
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos válidos para eliminar en ninguna categoría',
      });
    }

    if (!filesRemoved) {
      console.warn('No files were removed; file names may not match:', {
        updateFields,
        filesToDelete,
      });
      return res.status(400).json({
        success: false,
        message: 'Ningún archivo fue eliminado; los nombres de archivo no coinciden con los existentes',
        details: filesToDelete,
      });
    }

    // Update document using $set
    const updateResult = await collection.updateOne(
      { _id: ownerKey },
      { $set: updateFields }
    );

    console.log('Update result:', updateResult);

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'No se realizaron cambios en la base de datos, posible error en la actualización',
        updateFields,
      });
    }

    // Verify post-update state
    const updatedDoc = await collection.findOne({ _id: ownerKey });
    const updatedMedia = updatedDoc[memoryName].media || {};
    const updatedVideos = updatedMedia.videos || [];
    const updatedPhotos = updatedMedia.photos || [];
    console.log('Post-update state:', {
      photos: updatedPhotos.map((file) => file.file_name || file.url.split('/').pop()),
      videos: updatedVideos.map((file) => file.file_name || file.url.split('/').pop()),
    });

    return res.status(200).json({
      success: true,
      message: 'Archivos eliminados correctamente',
      updateFields,
      remainingVideos: updatedVideos.map((file) => file.file_name || file.url.split('/').pop()),
      remainingPhotos: updatedPhotos.map((file) => file.file_name || file.url.split('/').pop()),
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

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

    const { userId, memoryName, userEmail, filesToDelete, uid, token } = req.body;

    console.log('deleteFilesUserMongoDB');
    console.log(userId);
    console.log(memoryName);
    console.log(userEmail);
    console.log(filesToDelete);

    if (!userId || !memoryName || !userEmail || !filesToDelete) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros userId, memoryName, userEmail y filesToDelete son requeridos'
      });
    }

    // Validate filesToDelete structure
    if (typeof filesToDelete !== 'object' || !['photos', 'videos', 'audios'].some(cat => Array.isArray(filesToDelete[cat]) && filesToDelete[cat].length > 0)) {
      return res.status(400).json({
        success: false,
        message: 'filesToDelete debe ser un objeto con al menos una categoría (photos, videos, audios) con archivos válidos'
      });
    }

    // Sanitize userEmail for permission check
    const sanitizedUser = userEmail.replace(/[@.]/g, '_');

    console.log('MongoDB delete request:', { userId, memoryName, userEmail, sanitizedUser, filesToDelete });

    // Check permissions
    const permission = await checkMemoryPermission({
      userId,
      memoryName,
      userEmail: sanitizedUser,
      type: 'edit',
      uid,
      token
    });

    console.log('Permission check result:', permission);

    if (!permission.accessAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for editing memories'
      });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Buscar el documento global
    const doc = await collection.findOne({ _id: "globalMemories" });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el documento global en la base de datos"
      });
    }

    // Iterar sobre las claves (emails saneados) para identificar al usuario por su userId
    let userEmailKey = null;
    let userMemories = null;
    for (const [emailKey, userData] of Object.entries(doc)) {
      if (emailKey !== '_id' && emailKey !== 'lastUpdated' && userData.userInformation) {
        if (userData.userInformation.id === userId) {
          userEmailKey = emailKey;
          userMemories = userData;
          break;
        }
      }
    }

    if (!userEmailKey) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el usuario con el ID especificado"
      });
    }

    // Verificar que exista el recuerdo indicado
    const memoryData = userMemories[memoryName];
    if (!memoryData) {
      return res.status(404).json({
        success: false,
        message: "Recuerdo no encontrado"
      });
    }

    // Se asume que la estructura del recuerdo tiene una propiedad "media"
    let media = memoryData.media;
    if (!media) {
      return res.status(400).json({
        success: false,
        message: "El recuerdo no contiene información de media"
      });
    }

    // Procesar cada categoría y filtrar los archivos a eliminar
    const categories = ['photos', 'videos', 'audios'];
    const updateFields = {};
    let filesRemoved = false;

    categories.forEach((cat) => {
      if (filesToDelete[cat] && Array.isArray(filesToDelete[cat]) && filesToDelete[cat].length > 0) {
        // Obtener la lista de file_name que se quieren eliminar
        const filesNamesToDelete = filesToDelete[cat].map(file => file.file_name);
        // Se toma el arreglo actual o un arreglo vacío si no existe
        const currentFiles = Array.isArray(media[cat]) ? media[cat] : [];
        console.log(`Processing category ${cat}:`, {
          filesNamesToDelete,
          currentFiles: currentFiles.map(file => ({
            file_name: file.file_name,
            derived_name: file.url ? file.url.split('/').pop() : null,
            raw: file
          }))
        });

        // Filtrar archivos, asegurando que file_name exista
        const filteredFiles = currentFiles.filter(file => {
          const fileName = file.file_name || (file.url ? file.url.split('/').pop() : null);
          if (!fileName) {
            console.warn(`File in ${cat} missing file_name and valid url:`, file);
            return true; // Keep files without file_name to avoid unintended deletion
          }
          return !filesNamesToDelete.includes(fileName);
        });

        // Verificar si se eliminaron archivos
        if (filteredFiles.length < currentFiles.length) {
          filesRemoved = true;
        }

        // Se construye el path dinámico para actualizar ese campo anidado en la DB
        const fieldPath = `${userEmailKey}.${memoryName}.media.${cat}`;
        updateFields[fieldPath] = filteredFiles;
        console.log(`Updating ${fieldPath}:`, filteredFiles.map(file => file.file_name || file.url.split('/').pop()));
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron archivos válidos para eliminar en ninguna categoría"
      });
    }

    if (!filesRemoved) {
      console.warn('No files were removed; file names may not match:', {
        updateFields,
        filesToDelete
      });
      return res.status(400).json({
        success: false,
        message: "Ningún archivo fue eliminado; los nombres de archivo no coinciden con los existentes",
        details: filesToDelete
      });
    }

    // Actualización del documento usando $set
    const updateResult = await collection.updateOne(
      { _id: "globalMemories" },
      { $set: updateFields }
    );

    console.log('Update result:', updateResult);

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "No se realizaron cambios en la base de datos, posible error en la actualización",
        updateFields
      });
    }

    // Verificar el estado posterior a la actualización
    const updatedDoc = await collection.findOne({ _id: "globalMemories" });
    const updatedMedia = updatedDoc[userEmailKey][memoryName].media || {};
    const updatedVideos = updatedMedia.videos || [];
    const updatedPhotos = updatedMedia.photos || [];
    console.log('Post-update state:', {
      photos: updatedPhotos.map(file => file.file_name || file.url.split('/').pop()),
      videos: updatedVideos.map(file => file.file_name || file.url.split('/').pop())
    });

    return res.status(200).json({
      success: true,
      message: "Archivos eliminados correctamente",
      updateFields,
      remainingVideos: updatedVideos.map(file => file.file_name || file.url.split('/').pop()),
      remainingPhotos: updatedPhotos.map(file => file.file_name || file.url.split('/').pop())
    });
  } catch (error) {
    console.error("Error en deleteFilesUser:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
      requestBody: req.body
    });
  }
}*/






















