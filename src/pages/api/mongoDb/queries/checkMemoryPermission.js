import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import clientPromise from '../../connectToDatabase';
import generateUserId from '@/functions/memories/generateUserId';

export const checkMemoryPermission = async ({ ownerKey, memoryName, type, uid, token, userEmail }) => {
  /*console.log('checkMemoryPermission XXXXXXXXXXXXXXXXXXXX');
  console.log('ownerKey:', ownerKey);
  console.log('memoryName:', memoryName);
  console.log('type:', type);
  console.log('uid:', uid);
  console.log('token:', token);
  console.log('userEmail:', userEmail);*/
  

  let accessInformation = {};

  

  const client = await clientPromise;
  const db = client.db('goodMemories');

  //console.log('llega...falta que busque por su nuevo Id');
  

  // Fetch global document
  const globalDoc = await db.collection('MemoriesCollection').findOne({
    _id: ownerKey,
  });

  if (!globalDoc) throw new Error('Documento global no encontrado');

  console.log('db................................x.x.x.x.');
  console.log('menoryName');
  console.log(memoryName);
  
  
  console.log(globalDoc);
  
  if (!globalDoc[memoryName]) {
    throw new Error(`Memory '${memoryName}' no existe en el usuario ${ownerKey}`);
  }

  // Get access configuration
  const memoryConfig = globalDoc[memoryName];
  console.log('memoryConfig: ');
  console.log(memoryConfig);
  
  
  const accessConfig = memoryConfig.access?.[type];

  console.log('tipo de recuerdo');
  console.log(type);
  
  

  console.log('accessConfig:', accessConfig);


  console.log('topics.......del recuerdo.....');
  console.log(memoryConfig.topics);

  if (accessConfig.visibility === 'public') {
    return {
      status: 200,
      requiredVisibility: accessConfig.visibility,
      accessAllowed: true,
      memoryMetadata: memoryConfig.metadata,
      topics: memoryConfig.topics || {},
      dynamicMemories: memoryConfig.dynamicMemories || {},
    };
  }

  /*if(accessConfig.visibility === 'public'){
    return {
      status: 200,
      requiredVisibility: accessConfig.visibility,
      accessAllowed: true,
      memoryMetadata: memoryConfig.metadata,
      topics: globalDoc.topics
    };
  }*/

  const loginResult = await verifyLoginUser({ uid, token });

  if (!loginResult.success) {
    return {
      status: 401,
      message: 'Authentication is mandatory',
    };
  }



  if (!accessConfig) {
    throw new Error(`Configuración de acceso para ${type} no encontrada`);
  }

  // Validate permissions based on visibility
  let hasPermission = false;
  const sanitizedCurrentUser = generateUserId(userEmail)//userEmail.replace(/[@.]/g, '_');
   
  /*console.log('generateUserId(userEmail....checkMemoryPermissions)');
  console.log(generateUserId(userEmail));
  console.log('ownerKey');
  console.log(ownerKey);*/
  
  
  
  



  switch (accessConfig.visibility) {
    case 'public':
      hasPermission = true;
      break;

    case 'private':
      hasPermission = sanitizedCurrentUser === ownerKey;
      break;

    case 'invitation':
      const sanitizedInvites = accessConfig.invitedEmails || [];
      hasPermission = sanitizedInvites.includes(userEmail) || sanitizedCurrentUser === ownerKey;
      console.log('invitation check:', { userEmail, sanitizedInvites, ownerKey });
      break;

    default:
      throw new Error(`Tipo de visibilidad no soportado: ${accessConfig.visibility}`);
  }

  if (type === 'editPermissions') {
    accessInformation = memoryConfig.access;
  }

  
  
  console.log('checkMemoryPermission correcto');
  
  // Return detailed results
  return {
    type,
    accessAllowed: hasPermission,
    accessInformation,
    requiredVisibility: accessConfig.visibility,
    currentUser: sanitizedCurrentUser,
    memoryMetadata: memoryConfig.metadata,
    topics: memoryConfig.topics || {},
    dynamicMemories: memoryConfig.dynamicMemories || {},
  };
};












