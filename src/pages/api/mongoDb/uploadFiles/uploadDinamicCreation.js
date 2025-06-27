import clientPromise from '../../connectToDatabase';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import { createHash } from 'crypto';
import generateUserId from '@/functions/memories/generateUserId';




export default async function handler(req, res) {
  // 1. Validate HTTP method (POST only)
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const {
    userId, // Email from the frontend
    uid,
    token,
    memoryTitle,
    mediaItems,
    groups,
    audioSelections,
    sceneDurations,
    memoryMetadata,
  } = req.body;

  console.log('Request received for:', {
    userId,
    memoryTitle,
    memoryKey: memoryMetadata?.memoryKey,
    uid,
    authType: 'saveMemory',
  });

  // 2. Validate required fields
  if (!userId || !uid || !token || !memoryTitle || !memoryMetadata?.memoryKey) {
    return res.status(400).json({
      success: false,
      message: 'Email, user ID, token, memory title, and memory key are required',
    });
  }

  const memoryKey = memoryMetadata.memoryKey; // Use provided memoryKey

  // 3. Verify token using verifyLoginUser
  try {
    const loginResult = await verifyLoginUser({ uid, token });
    if (!loginResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: ' + loginResult.error,
      });
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Token verification failed',
      details: error.message,
    });
  }

  try {
    // 4. Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    const hashUserID = generateUserId(userId);

    // 5. Check if user exists
    const existingUser = await collection.findOne({ _id: hashUserID });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist. Please register first.',
      });
    }

    // 6. Check if memory exists
    if (!existingUser[memoryKey]) {
      return res.status(404).json({
        success: false,
        message: 'Memory does not exist.',
      });
    }

    // 7. Prepare update data
    const now = new Date();
    const updateData = {
      [`${memoryKey}.dynamicMemories.${memoryKey}`]: {
        mediaItems: mediaItems || [],
        groups: groups || [],
        audioSelections: audioSelections || [],
        sceneDurations: sceneDurations || [],
      },
      [`${memoryKey}.metadata.lastUpdated`]: now.toISOString(),
      'userInformation.lastLogin': now.toISOString(),
    };

    // 8. Initialize dynamicMemories if it doesn't exist
    if (!existingUser[memoryKey].dynamicMemories) {
      updateData[`${memoryKey}.dynamicMemories`] = {};
    }

    // 9. Update the memory document
    const updateResult = await collection.updateOne(
      { _id: hashUserID },
      {
        $set: updateData,
      }
    );

    if (!updateResult.acknowledged) {
      throw new Error('Memory update failed');
    }

    console.log(`Memory updated with key: ${memoryKey}`, JSON.stringify(updateData, null, 2));

    // 10. Fetch the updated memory for response
    const updatedUser = await collection.findOne({ _id: hashUserID });
    const updatedMemory = updatedUser[memoryKey];

    // 11. Return success response
    return res.status(200).json({
      success: true,
      message: 'Memory updated successfully',
      memoryId: memoryKey,
      user: {
        id: hashUserID,
        ...updatedUser.userInformation,
        lastLogin: now.toISOString(),
      },
      memory: {
        id: memoryKey,
        ...updatedMemory.metadata,
        dynamicMemories: updatedMemory.dynamicMemories?.[memoryKey] || {},
      },
    });

  } catch (error) {
    console.error('Error in saveMemory endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message,
    });
  }
}