import clientPromise from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

    const { userID, memoryTitle } = req.body;
    if (!userID || !memoryTitle) {
      return res.status(400).json({
        success: false,
        message: "Los parámetros userID y memoryTitle son requeridos"
      });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Buscar el documento global
    const doc = await collection.findOne({ _id: "globalMemories" });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron recuerdos en la base de datos"
      });
    }

    // Buscar el usuario por su ID
    let userEmailKey = null;
    let originalEmail = null;
    let userMemories = null;

    // Iterar sobre todas las claves (emails saneados)
    for (const [emailKey, userData] of Object.entries(doc)) {
      if (emailKey !== '_id' && emailKey !== 'lastUpdated' && 
          userData.userInformation && userData.userInformation.id === userID) {
        userEmailKey = emailKey;
        userMemories = userData;
        break;
      }
    }

    if (!userEmailKey) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el usuario con el ID especificado"
      });
    }

    // Buscar la memoria específica
    const memoryData = userMemories[memoryTitle];
    if (!memoryData) {
      return res.status(404).json({
        success: false,
        message: "Recuerdo no encontrado"
      });
    }

    // Respuesta completa
    return res.status(200).json({
      success: true,
      memory: memoryData,
      ownerEmail: userEmailKey,
      memoryTitle: memoryTitle,
      userID: userID
    });

  } catch (error) {
    console.error("Error en postMemoryReferenceUser:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}