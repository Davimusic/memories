import clientPromise from '../connectToDatabase';


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
}







