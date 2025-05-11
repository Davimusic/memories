import clientPromise from '../../connectToDatabase';

// Endpoint para obtener la información del plan del usuario
export default async function handler(req, res) {
  try {
    // Solo se permite el método POST
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    const { email } = req.body;

    // Validar que se haya enviado el campo "email"
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el correo del usuario'
      });
    }

    // Normalizamos el email: quitamos espacios, convertimos a minúsculas
    const normalizedEmail = email.trim().toLowerCase();
    // Convertimos el email a una key que corresponda con la almacenada en la DB (reemplazando @ y .)
    const emailKey = normalizedEmail.replace(/[@.]/g, '_');

    // Conectar a la base de datos y obtener el documento global
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    const globalDocument = await collection.findOne({ _id: "globalMemories" });
    if (!globalDocument) {
      return res.status(500).json({
        success: false,
        message: 'Documento global no encontrado en la base de datos'
      });
    }

    // Revisamos si existe la key correspondiente al email
    const userData = globalDocument[emailKey];
    if (userData) {
      // Buscamos el campo "plan" dentro del objeto del usuario
      const planInfo = userData.userInformation.plan;
      if (planInfo) {
        return res.status(200).json({
          success: true,
          exists: true,
          plan: planInfo,
          message: 'Plan del usuario obtenido exitosamente'
        });
      } else {
        return res.status(200).json({
          success: true,
          exists: true,
          plan: null,
          message: 'El usuario existe, pero no se encontró información del plan'
        });
      }
    } else {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'El usuario no existe'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}
