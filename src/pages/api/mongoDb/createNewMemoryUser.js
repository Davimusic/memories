// se usa
import clientPromise from '../connectToDatabase';
import { verifyLoginUser } from '../firebase/verifyLoginUser';
import { createHash } from 'crypto'; // For generating unique encrypted key
import generateUserId from '@/functions/memories/generateUserId';

export default async function handler(req, res) {
  // 1. Validate HTTP method (POST only)
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const {
    userId, // This is userEmail from the frontend
    memoryTitle,
    description,
    visibility,
    invitedEmails,
    fileUploadVisibility,
    fileUploadInvitedEmails,
    editVisibility,
    editInvitedEmails,
    uid,
    token,
  } = req.body;

  console.log('Request received for:', {
    userId,
    memoryTitle,
    uid,
    authType: 'createNewMemoryUser',
  });

  // 2. Validate required fields
  if (!userId || !uid || !token || !memoryTitle) {
    return res.status(400).json({
      success: false,
      message: 'Email, user ID, token, and memory title are required',
    });
  }

  // 3. Verify token using verifyLoginUser
  try {
    const loginResult = await verifyLoginUser({ uid, token });
    if (!loginResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: ' + loginResult.error,
      });
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Token verification failed',
      details: error.message,
    });
  }

  const now = new Date();
  const normalizedUserID = userId.replace(/[@.]/g, '_');
  const timestamp = now
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 12); // YYYYMMDDHHMM
  const normalizedTitle = memoryTitle.replace(/\s+/g, '_');
  const memoryKey = createHash('sha256')
    .update(`${normalizedTitle}_${timestamp}`)
    .digest('base64')
    .replace(/[^a-zA-Z0-9]/g, ''); // Create a unique, safe key

  try {
    // 4. Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');


    const hashUserID = generateUserId(userId)
    // 5. Check if user exists
    const existingUser = await collection.findOne({ _id: hashUserID });

    console.log('existingUser');
    console.log(existingUser);
    
    

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist. Please register first.',
      });
    }

    // 6. Check if memory key already exists in user document
    if (existingUser[memoryKey]) {
      return res.status(409).json({
        success: false,
        message: 'A memory with this title and timestamp already exists',
      });
    }

    // 7. Prepare memory data
    const memoryData = {
      metadata: {
        memoryKey,
        title: memoryTitle,
        description: description || '',
        createdBy: normalizedUserID,
        createdAt: now.toISOString(),
        lastUpdated: now.toISOString(),
        status: 'active',
      },
      access: {
        view: {
          visibility: visibility || 'private',
          invitedEmails: invitedEmails || [],
        },
        upload: {
          visibility: fileUploadVisibility || 'private',
          invitedEmails: fileUploadInvitedEmails || [],
        },
        edit: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || [],
        },
        editPermissions: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || [],
        },
      },
      media: {
        photos: [],
        videos: [],
        audios: [],
        documents: [],
      },
      activity: {
        lastAccessed: now.toISOString(),
        viewCount: 0,
        edits: [],
      },
    };

    // 8. Update user document with new memory data
    const updateResult = await collection.updateOne(
      { _id: hashUserID },
      {
        $set: {
          [memoryKey]: memoryData,
          'userInformation.lastLogin': now.toISOString(),
        },
      }
    );

    if (!updateResult.acknowledged) {
      throw new Error('Memory creation failed');
    }

    console.log(`Memory created with key: ${memoryKey}`, JSON.stringify(memoryData, null, 2));

    // 9. Return success response
    return res.status(201).json({
      success: true,
      message: 'Memory created successfully',
      user: {
        id: hashUserID,
        ...existingUser.userInformation,
        lastLogin: now.toISOString(),
      },
      memory: {
        id: memoryKey,
        ...memoryData.metadata,
        permissions: memoryData.access,
        mediaCount: {
          photos: 0,
          videos: 0,
          audios: 0,
          documents: 0,
        },
      },
    });

  } catch (error) {
    console.error('Error in createNewMemoryUser endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message,
    });
  }
}





















/*import clientPromise from '../connectToDatabase';
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
}*/