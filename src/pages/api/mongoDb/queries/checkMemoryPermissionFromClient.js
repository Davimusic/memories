import { checkMemoryPermission } from './checkMemoryPermission'; 


const typeTranslations = {
  memories: 'view',
  uploadFiles: 'upload',
  editFiles: 'edit',
  editAccessibility: 'editPermissions'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, memoryName, type, uid, token, userEmail } = req.body;

    // Validate required fields
    if (!userId || !memoryName || !type || !uid || !token || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate and translate the type field
    if (!Object.keys(typeTranslations).includes(type)) {
      return res.status(400).json({ error: 'Invalid type value' });
    }
    const translatedType = typeTranslations[type];

    console.log('checkMemoryPermissionFromClient XXXXXXXXXXXXXXXXXXXX');
    console.log('userId:', userId);
    console.log('memoryName:', memoryName);
    console.log('type:', type);
    console.log('translatedType:', translatedType);
    console.log('uid:', uid);
    console.log('token:', token);
    console.log('userEmail:', userEmail);

    // Call checkMemoryPermission with the translated type
    const result = await checkMemoryPermission({ 
      userId, 
      memoryName, 
      type: translatedType, 
      uid, 
      token, 
      userEmail 
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in endpoint:', error);
    res.status(500).json({ error: error.message });
  }
}














/*import { checkMemoryPermission } from './checkMemoryPermission'; // Ajusta la ruta según sea necesario

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, memoryName, type, uid, token, userEmail } = req.body;

    if (!userId || !memoryName || !type || !uid || !token || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('checkMemoryPermissionFromClient XXXXXXXXXXXXXXXXXXXX');
    console.log('userId:', userId);
    console.log('memoryName:', memoryName);
    console.log('type:', type);
    console.log('uid:', uid);
    console.log('token:', token);
    console.log('userEmail:', userEmail);


    // Llamar a checkMemoryPermission, que ahora incluye la verificación de autenticación
    const result = await checkMemoryPermission({ userId, memoryName, type, uid, token, userEmail });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in endpoint:', error);
    res.status(500).json({ error: error.message });
  }
}*/