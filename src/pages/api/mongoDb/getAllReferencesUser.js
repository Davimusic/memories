import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  try {
    // Verificar que el método sea POST.
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false, 
        message: 'Método no permitido' 
      });
    }

    // Extraer userId del body.
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "El parámetro userId es requerido"
      });
    }

    // Función para transformar el userId, de modo que coincida con lo guardado en MongoDB.
    // Por ejemplo, reemplazamos "@" y "." por "_" (esto puede ajustarse a tus necesidades).
    const transformUserId = (userId) => {
      return userId.replace(/[@.]/g, '_');
    };

    const transformedUserId = transformUserId(userId);

    // Conexión a MongoDB.
    const db = await connectToDatabase();
    if (!db) throw new Error("Error de conexión a MongoDB");
    const collection = db.collection('MemoriesCollection');

    // Consultar el documento global que contiene todas las referencias.
    const doc = await collection.findOne({ _id: "globalMemories" });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron recuerdos en la base de datos"
      });
    }

    // Extraer las referencias para el userId transformado.
    const userMemories = doc[transformedUserId];
    if (!userMemories) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron recuerdos para el usuario especificado",
        memories: {}
      });
    }

    // Retornar la información extraída.
    return res.status(200).json({
      success: true,
      memories: userMemories
    });
  } catch (error) {
    console.error("Error en getAllReferencesUser:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}

