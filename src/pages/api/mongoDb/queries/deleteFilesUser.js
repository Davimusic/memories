import clientPromise from '../../connectToDatabase';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido'
      });
    }

    const { userId, memoryName, filesToDelete } = req.body;
    if (!userId || !memoryName || !filesToDelete) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros userId, memoryName y filesToDelete son requeridos'
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
        message: "No se encontró el documento global en la base de datos"
      });
    }

    // Iterar sobre las claves (emails saneados) para identificar al usuario por su userId
    let userEmailKey = null;
    let userMemories = null;
    for (const [emailKey, userData] of Object.entries(doc)) {
      if (emailKey !== '_id' && emailKey !== 'lastUpdated' && userData.userInformation) {
        if (userData.userInformation.id === userId) {
          userEmailKey = emailKey;
          userMemories = userData;
          break;
        }
      }
    }

    if (!userEmailKey) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el usuario con el ID especificado"
      });
    }

    // Verificar que exista el recuerdo indicado
    const memoryData = userMemories[memoryName];
    if (!memoryData) {
      return res.status(404).json({
        success: false,
        message: "Recuerdo no encontrado"
      });
    }

    // Se asume que la estructura del recuerdo tiene una propiedad "media"
    let media = memoryData.media;
    if (!media) {
      return res.status(400).json({
        success: false,
        message: "El recuerdo no contiene información de media"
      });
    }

    // Procesar cada categoría y filtrar los archivos a eliminar.
    const categories = ['photos', 'videos', 'audios'];
    // Este objeto contendrá los campos y nuevos valores para actualizar en el documento.
    const updateFields = {};

    categories.forEach((cat) => {
      if (filesToDelete[cat] && Array.isArray(filesToDelete[cat]) && filesToDelete[cat].length > 0) {
        // Obtener la lista de file_name que se quieren eliminar
        const filesNamesToDelete = filesToDelete[cat].map(file => file.file_name);
        // Se toma el arreglo actual o un arreglo vacío si no existe
        const currentFiles = Array.isArray(media[cat]) ? media[cat] : [];
        const filteredFiles = currentFiles.filter(file => !filesNamesToDelete.includes(file.file_name));
        // Se construye el path dinámico para actualizar ese campo anidado en la DB
        // Ej: "davipianof_gmail_com.mirarback.media.photos"
        const fieldPath = `${userEmailKey}.${memoryName}.media.${cat}`;
        updateFields[fieldPath] = filteredFiles;
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron archivos válidos para eliminar en ninguna categoría."
      });
    }

    // Actualización del documento usando $set para las propiedades modificadas
    await collection.updateOne(
      { _id: "globalMemories" },
      { $set: updateFields }
    );

    return res.status(200).json({
      success: true,
      message: "Archivos eliminados correctamente.",
      updatedFields: updateFields
    });
  } catch (error) {
    console.error("Error en deleteFilesUser:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
}
