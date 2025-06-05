import { checkMemoryPermission } from './checkMemoryPermission';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';

const typeTranslations = {
  memories: 'view',
  uploadFiles: 'upload',
  editFiles: 'edit',
  editAccessibility: 'editPermissions',
};

const staticRoutes = ['/memories', '/createNewMemory']; // Add other static routes as needed

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path, uid, token, userEmail } = req.body;

    // Validate required fields
    if (!path || !uid || !token || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('el path.......................................');
    console.log(path);
    

    // Split and clean the path
    const pathParts = path.split('/').filter(Boolean);
    console.log('pathParts:', pathParts);

    // Check if the path is a static route
    if (staticRoutes.includes(`/${pathParts[0]}`) && pathParts.length === 1) {
      // Static route: only verify login
      const loginResult = await verifyLoginUser({ uid, token });
      if (!loginResult.success) {
        return res.status(401).json({ error: 'Authentication failed: ' + loginResult.error });
      }
      return res.status(200).json({ accessAllowed: true, message: 'User is authenticated' });
    }

    // Dynamic route: extract type, ownerKey, and memoryName
    if (pathParts.length < 3) {
      return res.status(400).json({ error: 'Invalid path format for dynamic route' });
    }

    console.log('miraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    console.log(pathParts);
    

    const typeKey = pathParts[0]; // e.g., 'memories'
    const ownerKey = pathParts[1]; // e.g., 'e55c81892694f42318e9b3b5131051559650dcba7d0fe0651c2aa472ea6a6c0c'
    const memoryName = pathParts[2]; // e.g., 'primer_test_bunny'

    // Validate typeKey
    if (!Object.keys(typeTranslations).includes(typeKey)) {
      return res.status(400).json({ error: 'Invalid type in path' });
    }
    const translatedType = typeTranslations[typeKey];

    console.log('checkMemoryPermissionFromClient XXXXXXXXXXXXXXXXXXXX');
    console.log('ownerKey:', ownerKey);
    console.log('memoryName:', memoryName);
    console.log('typeKey:', typeKey);
    console.log('translatedType:', translatedType);
    console.log('uid:', uid);
    console.log('token:', token);
    console.log('userEmail:', userEmail);

    // Call checkMemoryPermission for dynamic routes
    const result = await checkMemoryPermission({
      ownerKey,
      memoryName,
      type: translatedType,
      uid,
      token,
      userEmail,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in endpoint:', error);
    res.status(500).json({ error: error.message });
  }
}


















/*import { checkMemoryPermission } from './checkMemoryPermission'; 


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
}*/












