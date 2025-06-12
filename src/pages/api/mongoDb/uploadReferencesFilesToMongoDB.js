//se usa
import clientPromise from '../connectToDatabase';
import { checkMemoryPermission } from './queries/checkMemoryPermission';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    const { memoryName, userID } = req.query;
    const { memoryData, ownerEmail, uid, token, selectedTopic } = req.body;

    // Verificar permisos
    const permission = await checkMemoryPermission({
      ownerKey: userID,
      memoryName,
      userEmail: ownerEmail,
      type: 'upload',
      uid,
      token,
    });

    console.log('Permiso obtenido uploadFilesReferencesMongoDb:', permission.accessAllowed);

    if (!permission.accessAllowed) {
      throw new Error(`Acceso denegado para upload`);
    }

    // Validación de campos requeridos
    const requiredFields = ['memoryData', 'ownerEmail', 'selectedTopic'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan campos requeridos: ${missingFields.join(', ')}`,
      });
    }

    const memoryTitle = Object.keys(memoryData)[0];
    if (!memoryTitle) {
      return res.status(400).json({
        success: false,
        message: 'Formato de memoryData inválido: debe contener un título de recuerdo',
      });
    }

    const memoryContent = memoryData[memoryTitle];
    if (
      !memoryContent ||
      !memoryContent.activity ||
      !memoryContent.activity.edits ||
      !memoryContent.topics ||
      !memoryContent.topics[selectedTopic]
    ) {
      return res.status(400).json({
        success: false,
        message: 'Formato de memoryData inválido: estructura de datos incompleta o tópico no especificado',
      });
    }

    const now = new Date();
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Validar existencia del usuario usando userID como _id
    const userDoc = await collection.findOne({ _id: userID });
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: `El usuario con ID ${userID} no existe en la base de datos`,
      });
    }

    // Validar existencia del recuerdo
    if (!userDoc[memoryTitle]) {
      return res.status(404).json({
        success: false,
        message: `El recuerdo '${memoryTitle}' no existe para el usuario ${userID}`,
      });
    }

    // Validar existencia del tópico
    if (!userDoc[memoryTitle].topics || !userDoc[memoryTitle].topics[selectedTopic]) {
      return res.status(404).json({
        success: false,
        message: `El tópico '${selectedTopic}' no existe en el recuerdo '${memoryTitle}'`,
      });
    }

    // Construir operación de actualización
    const updateOperation = {
      $set: {
        [`${memoryTitle}.activity.last_accessed`]: now.toISOString(),
        [`${memoryTitle}.metadata.lastUpdated`]: now.toISOString(),
      },
      $push: {
        [`${memoryTitle}.activity.edits`]: { $each: memoryContent.activity.edits },
      },
    };

    // Añadir medios (photos, videos, audios, texts) al tópico especificado
    ['photos', 'videos', 'audios', 'texts'].forEach((type) => {
      if (memoryContent.topics[selectedTopic][type]?.length > 0) {
        updateOperation.$push[`${memoryTitle}.topics.${selectedTopic}.${type}`] = {
          $each: memoryContent.topics[selectedTopic][type].map((file) => ({
            url: file.url,
            metadata: {
              ...file.metadata,
              ownerEmail,
              upload_date: now.toISOString(),
            },
          })),
        };
      }
    });

    // Ejecutar actualización
    const result = await collection.updateOne({ _id: userID }, updateOperation);

    // Verificar resultado
    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'No se realizaron cambios en la base de datos',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Datos actualizados correctamente',
      details: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error en el endpoint MongoDB:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al soporte técnico',
    });
  }
}






























































/*import clientPromise from '../connectToDatabase';
import { checkMemoryPermission } from './queries/checkMemoryPermission';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    const { memoryName, userID } = req.query;
    const { memoryData, ownerEmail, uid, token } = req.body;

    const permission = await checkMemoryPermission({
      ownerKey: userID,
      memoryName,
      userEmail: ownerEmail,
      type: 'upload',
      uid,
      token
    });

    console.log('Permiso obtenido uploadFilesReferenceseMongoDb:', permission.accessAllowed);

    if (!permission.accessAllowed) {
      throw new Error(`Acceso denegado para upload`);
    }

    // Validación de campos requeridos
    const requiredFields = ['memoryData', 'ownerEmail'];

    
    
    
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan campos requeridos: ${missingFields.join(', ')}`
      });
    }

    const memoryTitle = Object.keys(memoryData)[0];
    if (!memoryTitle) {
      return res.status(400).json({
        success: false,
        message: 'Formato de memoryData inválido: debe contener un título de recuerdo'
      });
    }

    const memoryContent = memoryData[memoryTitle];
    if (!memoryContent || !memoryContent.activity || !memoryContent.activity.edits || !memoryContent.media) {
      return res.status(400).json({
        success: false,
        message: 'Formato de memoryData inválido: estructura de datos incompleta'
      });
    }

    const now = new Date();
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Validar existencia del usuario usando userID como _id
    const userDoc = await collection.findOne({ _id: userID });
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: `El usuario con ID ${userID} no existe en la base de datos`
      });
    }

    // Validar existencia del recuerdo
    if (!userDoc[memoryTitle]) {
      return res.status(404).json({
        success: false,
        message: `El recuerdo '${memoryTitle}' no existe para el usuario ${userID}`
      });
    }

    // Construir operación de actualización
    const updateOperation = {
      $set: {
        [`${memoryTitle}.activity.last_accessed`]: now.toISOString(),
        [`${memoryTitle}.metadata.lastUpdated`]: now.toISOString(),
      },
      $push: {
        [`${memoryTitle}.activity.edits`]: memoryContent.activity.edits[0]
      }
    };

    // Añadir medios (photos, videos, audios)
    ['photos', 'videos', 'audios'].forEach(type => {
      if (memoryContent.media[type]?.length > 0) {
        updateOperation.$push[`${memoryTitle}.media.${type}`] = {
          $each: memoryContent.media[type].map(file => ({
            url: file.url,
            metadata: {
              ...file.metadata,
              ownerEmail,
              upload_date: now.toISOString()
            }
          }))
        };
      }
    });

    // Ejecutar actualización
    const result = await collection.updateOne(
      { _id: userID },
      updateOperation
    );

    // Verificar resultado
    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'No se realizaron cambios en la base de datos'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Datos actualizados correctamente',
      details: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error en el endpoint MongoDB:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al soporte técnico'
    });
  }
}*/












