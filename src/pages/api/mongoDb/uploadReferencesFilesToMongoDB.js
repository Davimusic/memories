import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    // 1. Validar método HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false, 
        message: 'Método no permitido' 
      });
    }

    // 2. Validar datos de entrada con logs
    console.log('Body recibido:', req.body);
    const { memoryData, userId } = req.body;

    if (!memoryData || !userId) {
      console.error('Datos incompletos:', { memoryData, userId });
      return res.status(400).json({
        success: false,
        message: "Se requieren userId y memoryData"
      });
    }

    // 3. Extraer contenido del recuerdo
    const memoryTitle = Object.keys(memoryData)[0];
    if (!memoryTitle) {
      console.error('No se encontró memoryTitle en:', memoryData);
      return res.status(400).json({
        success: false,
        message: "El memoryData debe contener un memoryTitle"
      });
    }

    const memoryContent = memoryData[memoryTitle];
    console.log('Contenido del recuerdo:', {
      photos: memoryContent.photos?.length,
      videos: memoryContent.videos?.length,
      audios: memoryContent.audios?.length
    });

    // 4. Validación mejorada de archivos
    const filesCount = {
      photos: memoryContent.photos?.length || 0,
      videos: memoryContent.videos?.length || 0,
      audios: memoryContent.audios?.length || 0
    };

    const totalFiles = filesCount.photos + filesCount.videos + filesCount.audios;
    if (totalFiles === 0) {
      console.error('No hay archivos en:', memoryContent);
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar al menos un archivo válido",
        receivedFiles: filesCount
      });
    }

    // 5. Conexión a MongoDB
    const db = await connectToDatabase();
    if (!db) throw new Error("Error de conexión a MongoDB");
    const collection = db.collection('MemoriesCollection');

    // 6. Preparar la actualización del documento para preservar el historial
    const now = new Date();
    const updateOperation = {
      $set: {
        // Actualiza o agrega el recuerdo específico dentro del objeto del usuario
        [`${userId}.${memoryTitle}`]: {
          ...memoryContent,
          metadata: {
            ...(memoryContent.metadata || {}),
            ultima_modificacion: now.toISOString()
          }
        },
        lastUpdated: now.toISOString()
      }
    };

    console.log('Operación de actualización a aplicar en MongoDB:', updateOperation);

    // 7. Operación de upsert utilizando updateOne
    const result = await collection.updateOne(
      { _id: "globalMemories" },
      updateOperation,
      { upsert: true }
    );

    // 8. Retornar respuesta
    return res.status(200).json({
      success: true,
      message: "Recuerdo guardado exitosamente",
      details: {
        memoryTitle,
        userId,
        filesSaved: filesCount,
        mongoResult: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedId: result.upsertedId
        }
      }
    });

  } catch (error) {
    console.error('Error en el backend:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}
