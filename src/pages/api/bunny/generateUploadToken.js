import { checkMemoryPermission } from '../mongoDb/queries/checkMemoryPermission';

export default async function handler(req, res) {
  // Configurar headers para respuesta JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      });
    }

    const { userId, memoryTitle, currentUser, path } = req.body;

    if (!userId || !memoryTitle || !currentUser || !path) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        code: 'MISSING_PARAMETERS'
      });
    }

    // Verificar permisos
    const { uploadAllowed } = await checkMemoryPermission({
      userId,
      memoryName: memoryTitle,
      currentUser
    });

    if (!uploadAllowed) {
      return res.status(403).json({ 
        error: 'Upload not permitted',
        code: 'UPLOAD_NOT_PERMITTED'
      });
    }

    // Generar token (ejemplo simulado - reemplaza con tu lógica real)
    const tokenData = {
      token: 'temp_token_12345',
      endpoint: `https://storage.bunnycdn.com/goodmemories/${path}/`,
      expires: Date.now() + 600000
    };

    return res.status(200).json(tokenData);

  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}