// Importación correcta, sin destructurar (ni llaves)
import clientPromise from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro userId es requerido'
      });
    }

    // Transforma el userId según necesidades
    const transformUserId = id => id.replace(/[@.]/g, '_');
    const transformedUserId = transformUserId(userId);

    // Obten el cliente de MongoDB a partir de la promesa
    const client = await clientPromise;
    const db = client.db('goodMemories');

    const collection = db.collection('MemoriesCollection');
    const doc = await collection.findOne({ _id: 'globalMemories' });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron recuerdos en la base de datos'
      });
    }

    const userMemories = doc[transformedUserId];
    if (!userMemories) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron recuerdos para el usuario especificado',
        memories: {}
      });
    }

    return res.status(200).json({
      success: true,
      memories: userMemories
    });
  } catch (error) {
    console.error('Error en getAllReferencesUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

