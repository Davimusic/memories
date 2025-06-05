import clientPromise from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    // Verificar que el método sea POST
    if (req.method !== 'POST') {
      console.log('Método no permitido:', req.method);
      return res.status(405).json({
        success: false,
        message: 'Método no permitido',
      });
    }

    // Extraer userID y memoryTitle del cuerpo de la solicitud
    const { userID, memoryTitle } = req.body;
    console.log('Solicitud recibida:', { userID, memoryTitle });

    if (!userID || !memoryTitle) {
      console.log('Faltan parámetros:', { userID, memoryTitle });
      return res.status(400).json({
        success: false,
        message: 'Los parámetros userID y memoryTitle son requeridos',
      });
    }

    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');
    console.log('Conectado a la base de datos: goodMemories, colección: MemoriesCollection');

    // Buscar el documento por _id
    const doc = await collection.findOne({ _id: userID });
    console.log('Documento encontrado:', doc ? 'Sí' : 'No');
    if (!doc) {
      console.log('No se encontró documento para _id:', userID);
      return res.status(404).json({
        success: false,
        message: 'No se encontraron recuerdos en la base de datos',
      });
    }

    // Loguear todas las claves del documento para inspección
    console.log('Claves del documento:', Object.keys(doc));

    // Verificar si la memoria existe
    const memoryData = doc[memoryTitle];
    console.log('Memoria encontrada:', memoryData ? 'Sí' : 'No');
    if (!memoryData) {
      console.log('Memoria no encontrada para memoryTitle:', memoryTitle);
      return res.status(404).json({
        success: false,
        message: 'Recuerdo no encontrado',
      });
    }

    // Extraer el email del propietario desde userInformation
    const ownerEmail = doc.userInformation?.email || 'unknown';
    console.log('Email del propietario:', ownerEmail);

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      memory: memoryData,
      ownerEmail: ownerEmail,
      memoryTitle: memoryTitle,
      userID: userID,
    });

  } catch (error) {
    console.error('Error en postMemoryReferenceUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
}











/*import clientPromise from '../connectToDatabase';

export default async function handler(req, res) {
  console.log('ni llega');
  
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
    const doc = await collection.findOne({ _id: userID });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron recuerdos en la base de datos"
      });
    }


    console.log('doc.....................');
    console.log(doc);
    

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
}*/