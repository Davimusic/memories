/*import { checkMemoryPermission } from './checkMemoryPermission';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import clientPromise from '../../connectToDatabase';
import generateUserId from '../../../../functions/memories/generateUserId';
import crypto from 'crypto';

const typeTranslations = {
  memories: 'view',
  uploadFiles: 'upload',
  editMemories: 'edit',
  editAccessibility: 'editPermissions',
  editTitleNameUser: 'editTitleNameUser',
  createNewTopicMemory: 'createMemoryTopics',
  dynamicCreator: 'dynamicCreator',
  createDynamicCreator: 'createDynamicCreator',
  dynamicMemory: 'dynamicMemory',
};

const staticRoutes = ['/memories', '/createNewMemory', '/payment', '/payment/payPlan'];

// Function to generate a unique ID for dynamicMemories entries
const generateUniqueId = () => {
  const timestamp = new Date().toISOString();
  return crypto.createHash('sha256').update(timestamp).digest('hex');
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  
  

  try {
    const { path, uid, token, userEmail, mediaItems, groups, audioSelections, sceneDurations } = req.body;

    // Validate required fields for all paths
    if (!path || !uid || !token || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    

    // Split and clean the path
    const pathParts = path.split('/').filter(Boolean);

    // Check if the path is a static route
    if (staticRoutes.includes(path)) {
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

      return res.status(200).json({ accessAllowed: true, message: 'User is authenticated', global: globalDoc });
    }

    

    console.log('..............s...............s');
    
    console.log(pathParts);
    

    const typeKey = pathParts[0];
    const ownerKey = pathParts[1];
    const memoryName = pathParts[2];
    

    // Validate typeKey
    if (!Object.keys(typeTranslations).includes(typeKey)) {
      return res.status(400).json({ error: 'Invalid type in path' });
    }
    const translatedType = typeTranslations[typeKey];

    // Handle dynamicMemory type for saving data
    if (typeKey === 'dynamicMemory') {
      

        console.log('checkMemoryPermission for dynamicMemory');
        console.log(typeKey);
        console.log(ownerKey);
        console.log(memoryName);
        
        
      // Check permissions
      const permissionResult = await checkMemoryPermission({
        ownerKey,
        memoryName,
        type: translatedType,
        uid,
        token,
        userEmail,
      });

      if (!permissionResult.accessAllowed) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Connect to MongoDB
      const client = await clientPromise;
      const db = client.db('goodMemories');
      const collection = db.collection('MemoriesCollection');

      // Generate a unique ID for the dynamic memory entry
      const dynamicMemoryId = generateUniqueId();

      // Prepare the data to save
      const dynamicMemoryData = {
        mediaItems,
        groups,
        audioSelections,
        sceneDurations,
        createdAt: new Date().toISOString(),
      };

      // Initialize dynamicMemories if it doesn't exist
      const memory = await collection.findOne({ _id: ownerKey });
      if (!memory.dynamicMemories) {
        await collection.updateOne(
          { _id: ownerKey },
          { $set: { dynamicMemories: {} } },
          { upsert: true }
        );
      }

      // Update the specific dynamic memory entry
      const updateResult = await collection.updateOne(
        { _id: ownerKey },
        {
          $set: {
            [`dynamicMemories.${dynamicMemoryId}`]: dynamicMemoryData,
            lastUpdated: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ error: 'Memory not found' });
      }

      return res.status(200).json({ accessAllowed: true, message: 'Memory saved successfully', dynamicMemoryId });
    }

    // Handle other dynamic routes
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
    if (error.code === 40) {
      return res.status(500).json({ error: 'Path conflict in dynamicMemories update' });
    }
    res.status(500).json({ error: error.message });
  }
}*/


import { checkMemoryPermission } from './checkMemoryPermission';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import clientPromise from '../../connectToDatabase';
import generateUserId from '../../../../functions/memories/generateUserId';
import crypto from 'crypto';

const typeTranslations = {
  memories: 'view',
  uploadFiles: 'upload',
  editMemories: 'edit',
  editAccessibility: 'editPermissions',
  editTitleNameUser: 'editTitleNameUser',
  createNewTopicMemory: 'createMemoryTopics',
  dynamicCreator: 'dynamicCreator',
  createDynamicCreator: 'createDynamicCreator',
  dynamicMemory: 'dynamicMemory',
};

const staticRoutes = ['/memories', '/createNewMemory', '/payment', '/payment/payPlan'];

// Function to generate a unique ID for dynamicMemories entries
const generateUniqueId = () => {
  const timestamp = new Date().toISOString();
  return crypto.createHash('sha256').update(timestamp).digest('hex');
};

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path, uid, token, userEmail, mediaItems, groups, audioSelections, sceneDurations } = req.body;

    console.log('check from client...............................................');
    console.log(req.body);
    
    

    // Validate required fields for all paths
    if (!path){ // || !uid || !token || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Split and clean the path
    const pathParts = path.split('/').filter(Boolean);

    // Check if the path is a static route
    if (staticRoutes.includes(path)) {
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

      return res.status(200).json({ accessAllowed: true, message: 'User is authenticated', global: globalDoc });
    }

    console.log('..............s...............s');
    console.log(pathParts);

    const typeKey = pathParts[0];
    const ownerKey = pathParts[1];
    const memoryName = pathParts[2];

    // Validate typeKey
    if (!Object.keys(typeTranslations).includes(typeKey)) {
      return res.status(400).json({ error: 'Invalid type in path' });
    }
    const translatedType = typeTranslations[typeKey];

    // Handle dynamicMemory type
    if (typeKey === 'dynamicMemory') {
      // Check permissions
      const permissionResult = await checkMemoryPermission({
        ownerKey,
        memoryName,
        type: translatedType,
        uid,
        token,
        userEmail,
      });

      console.log('permissionResult............c.c.c.c.c.c.c.c.c.c.c.c.c.c.c.c.c.c.c');
      console.log(permissionResult);
      

      if (!permissionResult.accessAllowed) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      
      

      function filterMemoryData(fullData, dynamicMemoryKey) {
        const { topics, dynamicMemories, ...baseData } = fullData; // Excluye 'topics'
        
        return {
          ...baseData,
          dynamicMemories: {
            [dynamicMemoryKey]: dynamicMemories[dynamicMemoryKey]
          }
        };
      }

      const filteredData = filterMemoryData(permissionResult, pathParts[3]);

      console.log('final.........');
      console.log(filteredData);
      return res.status(200).json(filteredData);
    }

    // Handle other dynamic routes
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
    if (error.code === 40) {
      return res.status(500).json({ error: 'Path conflict in dynamicMemories update' });
    }
    res.status(500).json({ error: error.message });
  }
}






























