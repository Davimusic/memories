import clientPromise from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }

    const { 
      userId, 
      memoryTitle, 
      description, 
      visibility, 
      invitedEmails,
      fileUploadVisibility,
      fileUploadInvitedEmails,
      editVisibility,
      editInvitedEmails
    } = req.body;

    if (!userId || !memoryTitle) {
      return res.status(400).json({
        success: false,
        message: "Se requieren userId y memoryTitle"
      });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Normalizar título para usar como clave
    const normalizedTitle = memoryTitle.replace(/\s+/g, '_');

    // Verificar si el recuerdo ya existe
    const existingMemory = await collection.findOne({
      _id: "globalMemories",
      [`${userId}.${normalizedTitle}`]: { $exists: true }
    });

    if (existingMemory) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un recuerdo con este título"
      });
    }

    // Crear estructura del nuevo recuerdo
    const now = new Date();
    const memoryData = {
      metadata: {
        title: memoryTitle,
        description: description || '',
        createdBy: userId,
        createdAt: now.toISOString(),
        lastUpdated: now.toISOString(),
        status: 'active'
      },
      access: {
        view: {
          visibility: visibility || 'private',
          invitedEmails: invitedEmails || []
        },
        upload: {
          visibility: fileUploadVisibility || 'private',
          invitedEmails: fileUploadInvitedEmails || []
        },
        edit: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || []
        },
        editPermissions: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || []
        }
      },
      media: {
        photos: [],
        videos: [],
        audios: [],
        documents: []
      },
      activity: {
        lastAccessed: now.toISOString(),
        viewCount: 0,
        edits: []
      }
    };

    // Insertar en la base de datos
    await collection.updateOne(
      { _id: "globalMemories" },
      { $set: { 
        [`${userId}.${normalizedTitle}`]: memoryData 
      }},
      { upsert: true }
    );

    res.status(201).json({
      success: true,
      message: "Recuerdo creado exitosamente",
      memory: {
        id: `${userId}_${normalizedTitle.toLowerCase()}`,
        ...memoryData.metadata,
        permissions: memoryData.access,
        mediaCount: {
          photos: 0,
          videos: 0,
          audios: 0,
          documents: 0
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}