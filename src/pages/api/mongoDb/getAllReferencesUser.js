//si se usa
import clientPromise from '../connectToDatabase';
import { verifyLoginUser } from '../firebase/verifyLoginUser';
import generateUserId from '@/functions/memories/generateUserId';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

    const { uid, token, userId } = req.body;
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro uid es requerido'
      });
    }

    const loginResult = await verifyLoginUser({ uid, token });
    if (!loginResult.success) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado: verificación de usuario fallida'
      });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    //id = generateUserId(userId)


    const userDoc = await collection.findOne({ _id: generateUserId(userId) });
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron recuerdos para el usuario especificado',
        memories: {}
      });
    }

    const userInfoId = generateUserId(userId)//userDoc.userInformation?.id;
    const { _id, ...memories } = userDoc;

    return res.status(200).json({
      success: true,
      userInfoId,
      memories
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








