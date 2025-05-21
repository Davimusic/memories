import clientPromise from '../../connectToDatabase';

export const checkMemoryPermission = async ({ 
  userId, 
  memoryName, 
  currentUser,
  type 
}) => {

    console.log('mire');
    console.log(type);
    
    
  const client = await clientPromise;
  const db = client.db('goodMemories');
  
  // 1. Buscar documento global
  const globalDoc = await db.collection('MemoriesCollection').findOne({ 
    _id: 'globalMemories' 
  });
  
  if (!globalDoc) throw new Error('Documento global no encontrado');

  // 2. Encontrar usuario propietario
  let ownerKey = null;
  for (const [key, value] of Object.entries(globalDoc)) {
    if (key === 'lastUpdated') continue;
    if (value.userInformation?.id === userId) {
      ownerKey = key;
      break;
    }
  }

  if (!ownerKey) throw new Error('Usuario propietario no encontrado');
  
  // 3. Verificar existencia del memory
  const userMemories = globalDoc[ownerKey];
  if (!userMemories[memoryName]) {
    throw new Error(`Memory '${memoryName}' no existe en el usuario ${ownerKey}`);
  }

  // 4. Obtener configuración de acceso específica
  const memoryConfig = userMemories[memoryName];
  const accessConfig = memoryConfig.access?.[type];

  console.log('accessConfig');
  console.log(accessConfig);
  
  
  
  if (!accessConfig) {
    throw new Error(`Configuración de acceso para ${type} no encontrada`);
  }

  // 5. Validar permisos según visibilidad
  let hasPermission = false;
  const sanitizedCurrentUser = currentUser.replace(/[@.]/g, '_');

  switch (accessConfig.visibility) {
    case 'public':
      hasPermission = true;
      break;

    case 'private':
      hasPermission = sanitizedCurrentUser === ownerKey;
      break;

    case 'invitation':
      const sanitizedInvites = (accessConfig.invitedEmails || [])
        .map(email => email.replace(/[@.]/g, '_'));
      
      hasPermission = sanitizedInvites.includes(sanitizedCurrentUser) 
                   || sanitizedCurrentUser === ownerKey;
      break;

    default:
      throw new Error(`Tipo de visibilidad no soportado: ${accessConfig.visibility}`);
  }

  // 6. Retornar resultados detallados
  return {
    type,
    accessAllowed: hasPermission,
    owner: ownerKey,
    requiredVisibility: accessConfig.visibility,
    currentUser: sanitizedCurrentUser,
    invitedEmails: accessConfig.invitedEmails || [],
    memoryMetadata: memoryConfig.metadata
  };
};