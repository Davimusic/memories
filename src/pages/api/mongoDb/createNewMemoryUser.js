import clientPromise from '../connectToDatabase';
import { verifyLoginUser } from '../firebase/verifyLoginUser'; 

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
      editInvitedEmails,
      uid,
      token
    } = req.body;

    if (!userId || !memoryTitle) {
      return res.status(400).json({
        success: false,
        message: "Se requieren userId y memoryTitle"
      });
    }

    const loginResult = await verifyLoginUser({ uid, token });
        if (!loginResult.success) {
          return res.status(401).json({
            success: false,
            message: 'Authentication failed: ' + loginResult.error
          });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Normalizar título para usar como clave
    const normalizedTitle = memoryTitle.replace(/\s+/g, '_');
    const normalizedUserID = userId.replace(/[@.]/g, '_')

    // Verificar si el recuerdo ya existe
    const existingMemory = await collection.findOne({
      _id: "globalMemories",
      [`${normalizedUserID}.${normalizedTitle}`]: { $exists: true }
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
        createdBy: normalizedUserID,
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
        [`${normalizedUserID}.${normalizedTitle}`]: memoryData 
      }},
      { upsert: true }
    );

    res.status(201).json({
      success: true,
      message: "Recuerdo creado exitosamente",
      memory: {
        id: `${normalizedUserID}_${normalizedTitle.toLowerCase()}`,
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