import clientPromise from '../../connectToDatabase';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import generateUserId from '@/functions/memories/generateUserId';
import { createHash } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { userId, uid, token, memoryId, uniqueMemoryId, parentId, text } = req.body;

  console.log('Received body:', req.body); // Debugging

  // 1. Validate required fields
  if (!userId || !uid || !token || !memoryId || !uniqueMemoryId || !parentId || !text) {
    return res.status(400).json({
      success: false,
      message: 'User ID, UID, token, memory ID, unique memory ID, parent ID, and text are required',
    });
  }

  // 2. Verify token using verifyLoginUser
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

    // 4. Verify if user exists
    const existingUser = await collection.findOne({ _id: hashID });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist. Please register first.',
      });
    }

    // 5. Verify if memory exists
    if (!existingUser[memoryKey] || !existingUser[memoryKey].dynamicMemories?.[uniqueMemoryId]) {
      return res.status(404).json({
        success: false,
        message: 'Memory or dynamic memory does not exist.',
      });
    }

  // 6. Verify if parent comment exists
    const parentComment = findComment(existingUser[memoryKey].dynamicMemories[uniqueMemoryId].comments, parentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found.',
      });
    }

    // 7. Initialize comments structure if it doesn't exist
    if (!existingUser[memoryKey].dynamicMemories[uniqueMemoryId].comments) {
      await collection.updateOne(
        { _id: hashID, [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`]: { $exists: false } },
        { $set: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`]: [] } }
      );
    }

    // 8. Create the reply
    const now = new Date();
    const commentId = createHash('sha256').update(`${userId}-${now.toISOString()}`).digest('hex');
    const replyData = {
      id: commentId,
      text,
      userId: hashID,
      author: userId,
      createdAt: now.toISOString(),
      likes: [],
    };

    // 9. Add the reply to the parent comment's replies array
    const updateResult = await collection.updateOne(
      { _id: hashID, [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments.id`]: parentId },
      { $push: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments.$.replies`]: replyData } }
    );

    if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
      throw new Error('Reply creation failed: Parent comment not found or not updated');
    }

    return res.status(200).json({
      success: true,
      message: 'Reply created successfully',
      comment: replyData,
    });
  } catch (error) {
    console.error('Error in reply endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message,
    });
  }
}

// Helper function to find a comment (including nested replies)
function findComment(comments, commentId) {
  for (const comment of comments) {
    if (comment.id === commentId) return comment;
    if (comment.replies) {
      const found = findComment(comment.replies, commentId);
      if (found) return found;
    }
  }
  return null;
}