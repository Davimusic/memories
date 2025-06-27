import { checkMemoryPermission } from './checkMemoryPermission';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import clientPromise from '../../connectToDatabase';
import generateUserId from '../../../../functions/memories/generateUserId';

const typeTranslations = {
  memories: 'view',
  uploadFiles: 'upload',
  editMemories: 'edit',
  editAccessibility: 'editPermissions',
  editTitleNameUser: 'editTitleNameUser',
  createNewTopicMemory: 'createMemoryTopics',
  dynamicCreator: 'dynamicCreator',
  createDynamicCreator: 'createDynamicCreator',
  dynamicMemory: 'dynamicMemory'
};

const staticRoutes = ['/memories', '/createNewMemory', '/payment', '/payment/payPlan'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path, uid, token, userEmail } = req.body;

    // Validate required fields
    if (!path) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('el path.......................................');
    console.log(path);

    // Split and clean the path
    const pathParts = path.split('/').filter(Boolean);
    console.log('pathParts:', pathParts);
    console.log('pathParts[0]');
    console.log(pathParts[0]);

    // Check if the path is a static route
    if (staticRoutes.includes(path)) {
      console.log('inicio de autenticacion para rutas estaticas...................................');

      // Static route: only verify login
      const loginResult = await verifyLoginUser({ uid, token });
      if (!loginResult.success) {
        return res.status(401).json({ error: 'Authentication failed from static routes: ' + loginResult.error });
      }

      const client = await clientPromise;
      const db = client.db('goodMemories');
      const sanitizedCurrentUser = generateUserId(userEmail);
      const globalDoc = await db.collection('MemoriesCollection').findOne({
        _id: sanitizedCurrentUser,
      });

      console.log(globalDoc);

      return res.status(200).json({ accessAllowed: true, message: 'User is authenticated' });
    }

    console.log('el pasa');

    // Dynamic route: extract type, ownerKey, and memoryName
    if (pathParts.length < 3) {
      return res.status(400).json({ error: 'Invalid path format for dynamic route' });
    }

    console.log('miraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    console.log(pathParts);

    const typeKey = pathParts[0];
    const ownerKey = pathParts[1];
    const memoryName = pathParts[2];

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
    console.log('ahora pasa a checkMemoryPermission..................y.y.y.y.y');
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


































