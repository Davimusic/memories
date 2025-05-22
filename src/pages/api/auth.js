const admin = require('../../../lib/firebaseAdmin');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, authType } = req.body;
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token || !uid) {
    return res.status(401).json({ error: 'No token or UID provided' });
  }

  try {
    // Verificar el token JWT
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Asegurarse de que el UID del token coincide con el enviado
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // El correo está disponible en decodedToken.email
    const email = decodedToken.email;

    // Aquí puedes realizar las acciones necesarias con el UID y el authType
    // Por ejemplo, guardar el usuario en la base de datos o realizar otras operaciones
    // Simulando tu lógica existente
    let message = '';
    if (authType === 'signIn') {
      // Lógica para registrar un nuevo usuario
      message = 'User registered successfully';
    } else if (authType === 'login' || authType === 'google') {
      // Lógica para login existente
      message = 'User logged in successfully';
    }

    // Responder con éxito
    return res.status(200).json({
      success: true,
      message,
      myLikes: [], // Ajusta según tu lógica
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ error: 'Invalid token', details: error.message });
  }
}