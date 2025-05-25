import admin from 'firebase-admin';

export const verifyLoginUser = async ({ uid, token }) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.uid === uid) {
      return { success: true, message: 'El usuario está logeado' };
    } else {
      return { success: false, error: 'El UID no coincide con el token' };
    }
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return { success: false, error: 'Token inválido' };
  }
};





























/*/ Importaciones necesarias
const admin = require('firebase-admin'); // Asegúrate de haber inicializado Firebase Admin correctamente

// Handler del endpoint
export default async function handler(req, res) {
  // Verificar que el método sea POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Extraer UID y token del cuerpo de la solicitud
  const { uid, token } = req.body;

  // Validar que se hayan proporcionado UID y token
  if (!uid || !token) {
    return res.status(400).json({ error: 'Se requieren UID y token' });
  }

  try {
    // Verificar el token de ID con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Comparar el UID del token con el UID proporcionado
    if (decodedToken.uid === uid) {
      return res.status(200).json({ success: true, message: 'El usuario está logeado' });
    } else {
      return res.status(403).json({ error: 'El UID no coincide con el token' });
    }
  } catch (error) {
    // Manejar errores de verificación del token
    console.error('Error al verificar el token:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
}*/