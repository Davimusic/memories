// pages/api/mongoDb/getMemoryDetail.js
import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

    const { userId, memoryTitle } = req.body;
    if (!userId || !memoryTitle) {
      return res.status(400).json({
        success: false,
        message: "El parámetro userId y memoryTitle son requeridos"
      });
    }

    // Transformar el userId para que coincida con el formato en MongoDB.
    const transformUserId = (userId) => userId.replace(/[@.]/g, '_');
    const transformedUserId = transformUserId(userId);

    // Conectar a la base de datos.
    const db = await connectToDatabase();
    if (!db) throw new Error("Error de conexión a MongoDB");

    const collection = db.collection('MemoriesCollection');
    const doc = await collection.findOne({ _id: "globalMemories" });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron recuerdos en la base de datos"
      });
    }

    const userMemories = doc[transformedUserId];
    if (!userMemories) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron recuerdos para el usuario especificado"
      });
    }

    const memoryData = userMemories[memoryTitle];
    if (!memoryData) {
      return res.status(404).json({
        success: false,
        message: "Recuerdo no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      memory: memoryData
    });
  } catch (error) {
    console.error("Error en getMemoryDetail:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}
