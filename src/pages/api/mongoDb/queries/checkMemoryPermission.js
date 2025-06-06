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

  // Verify user authentication
  const loginResult = await verifyLoginUser({ uid, token });
  if (!loginResult.success) {
    throw new Error('Authentication failed: ' + loginResult.error);
  }

  const client = await clientPromise;
  const db = client.db('goodMemories');

  //console.log('llega...falta que busque por su nuevo Id');
  

  // Fetch global document
  const globalDoc = await db.collection('MemoriesCollection').findOne({
    _id: ownerKey,
  });

  if (!globalDoc) throw new Error('Documento global no encontrado');

  //console.log('db....................');
  //console.log(globalDoc);
  
  

  /*/ Verify owner exists
  if (!globalDoc[ownerKey]) {
    throw new Error(`Usuario propietario '${ownerKey}' no encontrado`);
  }*/

  // Verify memory exists
  //const userMemories = globalDoc[ownerKey];
  if (!globalDoc[memoryName]) {
    throw new Error(`Memory '${memoryName}' no existe en el usuario ${ownerKey}`);
  }

  // Get access configuration
  const memoryConfig = globalDoc[memoryName];
  const accessConfig = memoryConfig.access?.[type];

  console.log('accessConfig:', accessConfig);

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
      const sanitizedInvites = (accessConfig.invitedEmails || []).map(email =>
        email.replace(/[@.]/g, '_')
      );
      hasPermission = sanitizedInvites.includes(sanitizedCurrentUser) || sanitizedCurrentUser === ownerKey;
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
  };
};












