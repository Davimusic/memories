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

  const { userId, uid, token, memoryId, uniqueMemoryId, parentId, text, root, fileId } = req.body;

  console.log('Received body:', req.body); // Debugging

  // 1. Validate required fields
  const validRoots = ['dynamicMemory', 'generalMemory', 'files'];
  if (!userId || !uid || !token || !memoryId || !parentId || !text || !root || !validRoots.includes(root)) {
    return res.status(400).json({
      success: false,
      message: 'User ID, UID, token, memory ID, parent ID, text, and valid root (dynamicMemory, generalMemory, or files) are required',
    });
  }

  // 2. Validate uniqueMemoryId for dynamicMemory and fileId for files
  if (root === 'dynamicMemory' && !uniqueMemoryId) {
    return res.status(400).json({
      success: false,
      message: 'uniqueMemoryId is required for dynamicMemory comments',
    });
  }
  if (root === 'files' && !fileId) {
    return res.status(400).json({
      success: false,
      message: 'fileId is required for file-specific comments',
    });
  }

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

    const memoryKey = memoryId;
    const hashID = generateUserId(userId);

    // 5. Verify if user exists
    const existingUser = await collection.findOne({ _id: hashID });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist. Please register first.',
      });
    }

    // 6. Determine the comment location and verify it exists
    let commentPath;
    let commentsArray;
    if (root === 'dynamicMemory') {
      if (!existingUser[memoryKey] || !existingUser[memoryKey].dynamicMemories?.[uniqueMemoryId]) {
        return res.status(404).json({
          success: false,
          message: 'Dynamic memory does not exist.',
        });
      }
      commentPath = `${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`;
      commentsArray = existingUser[memoryKey]?.dynamicMemories?.[uniqueMemoryId]?.comments || [];
    } else if (root === 'generalMemory') {
      if (!existingUser[memoryKey]) {
        return res.status(404).json({
          success: false,
          message: 'General memory does not exist.',
        });
      }
      commentPath = `${memoryKey}.comments`;
      commentsArray = existingUser[memoryKey].comments || [];
    } else if (root === 'files') {
      // Find the file in all topics
      let found = false;
      for (const topicKey of Object.keys(existingUser[memoryKey]?.topics || {})) {
        for (const mediaType of ['photos', 'videos', 'audios', 'texts']) {
          const files = existingUser[memoryKey]?.topics?.[topicKey]?.[mediaType] || [];
          const fileIndex = files.findIndex((file) => file.url === fileId);
          if (fileIndex !== -1) {
            commentPath = `${memoryKey}.topics.${topicKey}.${mediaType}.${fileIndex}.metadata.comments`;
            commentsArray = files[fileIndex]?.metadata?.comments || [];
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        return res.status(404).json({
          success: false,
          message: 'File not found.',
        });
      }
    }

    // 7. Verify if parent comment exists
    const parentComment = findComment(commentsArray, parentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found.',
      });
    }

    // 8. Initialize comments structure if it doesn't exist
    if (!commentsArray) {
      await collection.updateOne(
        { _id: hashID },
        { $set: { [commentPath]: [] } }
      );
      commentsArray = [];
    }

    // 9. Create the reply
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

    // 10. Add the reply to the parent comment's replies array
    const updateResult = await collection.updateOne(
      { _id: hashID, [`${commentPath}.id`]: parentId },
      { $push: { [`${commentPath}.$.replies`]: replyData } }
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

































/*import clientPromise from '../../connectToDatabase';
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
}*/