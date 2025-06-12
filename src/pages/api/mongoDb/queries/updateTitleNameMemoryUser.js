//Se usa updateTittleNameMemoryUser

import clientPromise from '../../connectToDatabase';
import { checkMemoryPermission } from './checkMemoryPermission';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    const { title, description, currentUser, uid, token, userId, memoryName } = req.body;

    // Check permissions
    const permission = await checkMemoryPermission({
      ownerKey: userId,
      memoryName,
      userEmail: currentUser,
      type: 'editTitleNameUser', 
      uid,
      token
    });

    if (!permission.accessAllowed) {
      throw new Error('Acceso denegado para actualizar metadatos');
    }

    // Validate required fields
    const requiredFields = ['title', 'currentUser'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan campos requeridos: ${missingFields.join(', ')}`
      });
    }

    if (!title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El título no puede estar vacío'
      });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');


    
    

    // Validate user existence
    const userDoc = await collection.findOne({ _id: userId });
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: `El usuario con ID ${userId} no existe en la base de datos`
      });
    }

    // Validate memory existence
    if (!userDoc[memoryName]) {
      return res.status(404).json({
        success: false,
        message: `El recuerdo '${memoryName}' no existe para el usuario ${userId}`
      });
    }

    // Prepare update operation
    const now = new Date();
    const updateOperation = {
      $set: {
        [`${memoryName}.metadata.title`]: title.trim(),
        [`${memoryName}.metadata.description`]: description ? description.trim() : '',
        [`${memoryName}.metadata.lastUpdated`]: now.toISOString(),
        [`${memoryName}.activity.lastAccessed`]: now.toISOString()
      }
    };

    // Execute update
    const result = await collection.updateOne(
      { _id: userId },
      updateOperation
    );

    // Verify result
    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'No se realizaron cambios en la base de datos'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Title and description updated successfully',
      details: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error en el endpoint updateMemoryMetadata:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al soporte técnico'
    });
  }
}