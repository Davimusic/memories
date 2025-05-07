import clientPromise from '../../connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    const { userId, memoryName, currentUser } = req.body;

    if (!userId || !memoryName || !currentUser) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros requeridos faltantes: userId, memoryName, currentUser'
      });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const doc = await db.collection('MemoriesCollection').findOne({ _id: 'globalMemories' });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Documento global no encontrado'
      });
    }

    let foundUserKey = null;
    for (const key in doc) {
      if (key === 'lastUpdated') continue;
      if (doc[key].userInformation?.id === userId) {
        foundUserKey = key;
        break;
      }
    }

    if (!foundUserKey) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userMemories = doc[foundUserKey];
    if (!userMemories[memoryName]) {
      return res.status(404).json({
        success: false,
        message: 'Recuerdo no encontrado'
      });
    }

    const memory = userMemories[memoryName];
    const { metadata, access } = memory;
    const uploadVisibility = access.upload.visibility;
    let uploadPermission = false;
    let permissionMessage = '';

    switch (uploadVisibility) {
      case 'public':
        uploadPermission = true;
        permissionMessage = 'Público: Cualquiera puede subir archivos.';
        break;
      case 'private':
        uploadPermission = currentUser === foundUserKey;
        permissionMessage = uploadPermission 
          ? 'Privado: Eres el propietario.' 
          : 'Privado: No tienes permisos.';
        break;
      case 'invitation':
        const invitedEmails = (access.upload.invitedEmails || []).map(e => e.replace(/[@.]/g, '_'));
        uploadPermission = currentUser === foundUserKey || invitedEmails.includes(currentUser);
        permissionMessage = uploadPermission 
          ? 'Invitación: Tienes permiso.' 
          : 'Invitación: No estás invitado.';
        break;
      default:
        permissionMessage = 'Visibilidad desconocida.';
    }

    return res.status(200).json({
      success: true,
      memoryFound: true,
      metadata,
      access,
      uploadPermission,
      permissionMessage,
      ownerEmail: foundUserKey // Correo transformado del propietario
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno',
      error: error.message
    });
  }
}