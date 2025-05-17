// lib/checkMemoryPermission.js
import clientPromise from '../../connectToDatabase';

export const checkMemoryPermission = async ({ userId, memoryName, currentUser }) => {
  const client = await clientPromise;
  const db = client.db('goodMemories');
  const doc = await db.collection('MemoriesCollection').findOne({ _id: 'globalMemories' });

  if (!doc) throw new Error('Documento global no encontrado');
  
  let foundUserKey = null;
  for (const key in doc) {
    if (key === 'lastUpdated') continue;
    if (doc[key].userInformation?.id === userId) {
      foundUserKey = key;
      break;
    }
  }

  if (!foundUserKey) throw new Error('Usuario no encontrado');
  if (!doc[foundUserKey][memoryName]) throw new Error('Recuerdo no encontrado');

  const memory = doc[foundUserKey][memoryName];
  const { access } = memory;
  
  // Lógica de permisos mejorada
  let uploadAllowed = false;
  switch (access.upload.visibility) {
    case 'public':
      uploadAllowed = true;
      break;
    case 'private':
      uploadAllowed = currentUser === foundUserKey;
      break;
    case 'invitation':
      const invitedEmails = (access.upload.invitedEmails || []).map(e => e.replace(/[@.]/g, '_'));
      uploadAllowed = invitedEmails.includes(currentUser) || currentUser === foundUserKey;
      break;
    default:
      uploadAllowed = false;
  }

  return {
    uploadAllowed,
    ownerEmail: foundUserKey,
    metadata: memory.metadata
  };
};