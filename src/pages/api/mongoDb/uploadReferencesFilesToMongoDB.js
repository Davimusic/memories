import clientPromise from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false, 
        message: 'Método no permitido' 
      });
    }

    const { memoryData, userId, ownerEmail } = req.body;

    if (!memoryData) {
      return res.status(400).json({
        success: false,
        message: "Se requieren pasar minimo memoryData"
      });
    }

    const memoryTitle = Object.keys(memoryData)[0];
    if (!memoryTitle) {
      return res.status(400).json({
        success: false,
        message: "Formato de memoryData inválido"
      });
    }

    const memoryContent = memoryData[memoryTitle];
    const media = memoryContent.media || {};
    const now = new Date();

    // Agregar userId a la metadata de cada archivo
    const attachUserMetadata = (files) => {
      return files.map(file => ({
        ...file,
        metadata: {
          ...file.metadata,
          uploadedBy: userId
        }
      }));
    };

    if (media.photos?.length > 0) {
      media.photos = attachUserMetadata(media.photos);
    }
    if (media.videos?.length > 0) {
      media.videos = attachUserMetadata(media.videos);
    }
    if (media.audios?.length > 0) {
      media.audios = attachUserMetadata(media.audios);
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Construir operación de actualización
    const updateOperation = {
      $set: {
        [`${ownerEmail}.${memoryTitle}.metadata`]: memoryContent.metadata,
        [`${ownerEmail}.${memoryTitle}.activity.lastAccessed`]: now.toISOString(),
        "lastUpdated": now.toISOString()
      },
      $push: {
        [`${ownerEmail}.${memoryTitle}.activity.edits`]: {
          user: userId,
          timestamp: now.toISOString(),
          action: "upload"
        }
      }
    };

    // Agregar solo los medios que tienen archivos
    if (media.photos?.length > 0) {
      updateOperation.$push[`${ownerEmail}.${memoryTitle}.media.photos`] = {
        $each: media.photos
      };
    }
    if (media.videos?.length > 0) {
      updateOperation.$push[`${ownerEmail}.${memoryTitle}.media.videos`] = {
        $each: media.videos
      };
    }
    if (media.audios?.length > 0) {
      updateOperation.$push[`${ownerEmail}.${memoryTitle}.media.audios`] = {
        $each: media.audios
      };
    }

    const result = await collection.updateOne(
      { _id: "globalMemories" },
      updateOperation,
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      details: {
        ownerEmail,
        memoryTitle,
        filesAdded: {
          photos: media.photos?.length || 0,
          videos: media.videos?.length || 0,
          audios: media.audios?.length || 0
        },
        mongoResult: result
      }
    });

  } catch (error) {
    console.error('Error en el backend:', error.message);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}
