//se usa
import clientPromise from '../connectToDatabase';
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
          userId: userID,
          memoryName,
          userEmail: ownerEmail,
          type: 'upload',
          uid,
          token
        });
    
        console.log('Permiso obtenido:', permission);
    
        if (!permission.accessAllowed) {
          throw new Error(`Acceso denegado para ${actionType}`);
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

    // Sanitize ownerEmail to match database key format (e.g., testwebmemories_gmail_com)
    const sanitizedEmail = ownerEmail.replace(/[@.]/g, '_');
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

    // Validar existencia del usuario
    const userCheck = await collection.findOne(
      { 
        _id: 'globalMemories',
        [sanitizedEmail]: { $exists: true }
      },
      { projection: { _id: 0, [sanitizedEmail]: 1 } }
    );

    if (!userCheck || !userCheck[sanitizedEmail]) {
      return res.status(404).json({
        success: false,
        message: `El usuario con email ${ownerEmail} no existe en la base de datos`
      });
    }

    // Validar existencia del recuerdo
    const memoryCheck = await collection.findOne(
      { 
        _id: 'globalMemories',
        [`${sanitizedEmail}.${memoryTitle}`]: { $exists: true }
      },
      { projection: { _id: 0, [`${sanitizedEmail}.${memoryTitle}`]: 1 } }
    );

    if (!memoryCheck || !memoryCheck[sanitizedEmail] || !memoryCheck[sanitizedEmail][memoryTitle]) {
      return res.status(404).json({
        success: false,
        message: `El recuerdo '${memoryTitle}' no existe para el usuario ${ownerEmail}`
      });
    }

    // Construir operación de actualización
    const updateOperation = {
      $set: {
        [`${sanitizedEmail}.${memoryTitle}.metadata`]: memoryContent.metadata || null,
        [`${sanitizedEmail}.${memoryTitle}.activity.last_accessed`]: now.toISOString(),
        lastUpdated: now.toISOString()
      },
      $push: {
        [`${sanitizedEmail}.${memoryTitle}.activity.edits`]: memoryContent.activity.edits[0]
      }
    };

    // Añadir medios (photos, videos, audios)
    ['photos', 'videos', 'audios'].forEach(type => {
      if (memoryContent.media[type]?.length > 0) {
        updateOperation.$push[`${sanitizedEmail}.${memoryTitle}.media.${type}`] = {
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
      { _id: 'globalMemories' },
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



































/*import clientPromise from '../connectToDatabase';


export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    const { memoryData, ownerEmail } = req.body; //userId
    
    // Validación mejorada
    const requiredFields = ['memoryData', 'ownerEmail']; //'userId'
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan campos requeridos: ${missingFields.join(', ')}`
      });
    }

    console.log('en mongo..........');
    console.log(memoryData);
    console.log(ownerEmail);
    

    const memoryTitle = Object.keys(memoryData)[0];
    if (!memoryTitle) {
      return res.status(400).json({
        success: false,
        message: "Formato de memoryData inválido"
      });
    }

    const memoryContent = memoryData[memoryTitle];
    const now = new Date();

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Construir operación de actualización
    const updateOperation = {
      $set: {
        [`${ownerEmail}.${memoryTitle}.metadata`]: memoryContent.metadata,
        [`${ownerEmail}.${memoryTitle}.activity.last_accessed`]: now.toISOString(),
        "last_updated": now.toISOString()
      },
      $push: {
        [`${ownerEmail}.${memoryTitle}.activity.edits`]: memoryContent.activity.edits[0]
      }
    };

    // Añadir medios
    ['photos', 'videos', 'audios'].forEach(type => {
      if (memoryContent.media[type]?.length > 0) {
        updateOperation.$push[`${ownerEmail}.${memoryTitle}.media.${type}`] = {
          $each: memoryContent.media[type].map(file => ({
            url: file.url,
            //file_name: file.file_name,
            //storage_path: file.storage_path, estàn discriminados en la url
            metadata: {
              ...file.metadata,
              ownerEmail,//: ownerEmail,
              upload_date: now.toISOString()
            }
          }))
        };
      }
    });

    // Ejecutar actualización
    const result = await collection.updateOne(
      { _id: "globalMemories" },
      updateOperation,
      { upsert: true }
    );

    // Verificar resultado
    if (result.modifiedCount === 0 && result.upsertedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "No se realizaron cambios en la base de datos"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Datos actualizados correctamente",
      details: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedId || null
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
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al soporte técnico'
    });
  }
}*/







