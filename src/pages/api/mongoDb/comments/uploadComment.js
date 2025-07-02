import clientPromise from '../../connectToDatabase';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import { createHash } from 'crypto';
import generateUserId from '@/functions/memories/generateUserId';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { userId, uid, token, memoryId, uniqueMemoryId, text, parentId } = req.body;

  // 1. Validate required fields
  if (!userId || !uid || !token || !memoryId || !uniqueMemoryId || !text) {
    return res.status(400).json({
      success: false,
      message: 'User ID, UID, token, memory ID, unique memory ID, and text are required',
    });
  }

  // 2. Verify token
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
    // 3. Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    const memoryKey = memoryId;
    const hashID = generateUserId(userId);

    // 4. Verify user exists
    const existingUser = await collection.findOne({ _id: hashID });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist. Please register first.',
      });
    }

    // 5. Verify memory exists
    if (!existingUser[memoryKey] || !existingUser[memoryKey].dynamicMemories?.[uniqueMemoryId]) {
      return res.status(404).json({
        success: false,
        message: 'Memory or dynamic memory does not exist.',
      });
    }

    // 6. Verify parent comment exists (if provided)
    if (parentId) {
      const parentComment = existingUser[memoryKey].dynamicMemories[uniqueMemoryId].comments?.find(
        (c) => c.id === parentId
      );
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found.',
        });
      }
    }

    // 7. Initialize comments array if it doesn't exist
    if (!existingUser[memoryKey].dynamicMemories[uniqueMemoryId].comments) {
      await collection.updateOne(
        { _id: hashID, [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`]: { $exists: false } },
        { $set: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`]: [] } }
      );
    }

    // 8. Create the comment
    const now = new Date();
    const commentId = createHash('sha256').update(`${userId}-${now.toISOString()}`).digest('hex');
    const commentData = {
      id: commentId,
      text,
      parentId: parentId || null,
      author: userId,
      createdAt: now.toISOString(),
      likes: [],
    };

    // 9. Add to comments array
    const updateResult = await collection.updateOne(
      { _id: hashID },
      { $push: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`]: commentData } }
    );

    if (!updateResult.acknowledged) {
      throw new Error('Comment creation failed');
    }

    return res.status(200).json({
      success: true,
      message: 'Comment created successfully',
      comment: commentData,
    });
  } catch (error) {
    console.error('Error in comment endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message,
    });
  }
}