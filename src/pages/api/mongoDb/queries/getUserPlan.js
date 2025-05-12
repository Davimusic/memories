import clientPromise from '../../connectToDatabase';

// Endpoint para obtener solo la información del plan del usuario
export default async function handler(req, res) {
  // Solo se permite el método POST.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validamos que se haya enviado el correo.
  if (!email) {
    return res.status(400).json({ error: 'Se requiere el correo del usuario' });
  }

  // Normalizamos el email y lo convertimos a una key válida para la DB.
  const normalizedEmail = email.trim().toLowerCase();
  const emailKey = normalizedEmail.replace(/[@.]/g, '_');

  try {
    // Conectamos a la base de datos y accedemos a la colección correspondiente.
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Obtenemos el documento global.
    const globalDocument = await collection.findOne({ _id: "globalMemories" });
    if (!globalDocument) {
      return res.status(500).json({ error: 'Documento global no encontrado en la base de datos' });
    }

    // Revisamos si existe la key correspondiente al email
    const userData = globalDocument[emailKey];

    // Si se encuentra el usuario y existe la información del plan,
    // retornamos solo el plan. En caso contrario, retornamos null.
    if (userData && userData.userInformation && userData.userInformation.plan) {
      return res.status(200).json({ plan: userData.userInformation.plan });
    } else {
      return res.status(200).json({ plan: null });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
}
