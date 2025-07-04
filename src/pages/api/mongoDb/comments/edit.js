import clientPromise from '../../connectToDatabase';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import generateUserId from '@/functions/memories/generateUserId';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { userId, uid, token, memoryId, uniqueMemoryId, commentId, text, root, fileId } = req.body;

  // 1. Validate required fields
  const validRoots = ['dynamicMemory', 'generalMemory', 'files'];
  if (!userId || !uid || !token || !memoryId || !commentId || !text || !root || !validRoots.includes(root)) {
    return res.status(400).json({
      success: false,
      message: 'User ID, UID, token, memory ID, comment ID, text, and valid root (dynamicMemory, generalMemory, or files) are required',
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

  // 3. Verify token
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

    // 5. Verify user exists
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

    // 7. Find the comment
    const comment = findComment(commentsArray, commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    // 8. Verify user is the author
    if (comment.author !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own comments.',
      });
    }

    // 9. Update the comment
    const updateResult = await collection.updateOne(
      { _id: hashID, [`${commentPath}.id`]: commentId },
      { $set: { [`${commentPath}.$.text`]: text } }
    );

    if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
      throw new Error('Edit comment failed: Comment not found or not updated');
    }

    // 10. Fetch updated comment
    const finalUser = await collection.findOne({ _id: hashID });
    let updatedComment;
    if (root === 'dynamicMemory') {
      updatedComment = finalUser[memoryKey].dynamicMemories[uniqueMemoryId].comments.find(
        (c) => c.id === commentId
      );
    } else if (root === 'generalMemory') {
      updatedComment = finalUser[memoryKey].comments.find((c) => c.id === commentId);
    } else if (root === 'files') {
      let found = false;
      for (const topicKey of Object.keys(finalUser[memoryKey]?.topics || {})) {
        for (const mediaType of ['photos', 'videos', 'audios', 'texts']) {
          const files = finalUser[memoryKey]?.topics?.[topicKey]?.[mediaType] || [];
          const fileIndex = files.findIndex((file) => file.url === fileId);
          if (fileIndex !== -1) {
            updatedComment = files[fileIndex]?.metadata?.comments.find((c) => c.id === commentId);
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (!updatedComment) {
      throw new Error('Failed to retrieve updated comment');
    }

    return res.status(200).json({
      success: true,
      message: 'Comment edited successfully',
      comment: {
        id: updatedComment.id,
        text: updatedComment.text,
        parentId: updatedComment.parentId,
        author: updatedComment.author,
        createdAt: updatedComment.createdAt,
        likes: updatedComment.likes,
      },
    });
  } catch (error) {
    console.error('Error in edit comment endpoint:', error);
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

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { userId, uid, token, memoryId, uniqueMemoryId, commentId, text } = req.body;

  // 1. Validate required fields
  if (!userId || !uid || !token || !memoryId || !uniqueMemoryId || !commentId || !text) {
    return res.status(400).json({
      success: false,
      message: 'User ID, UID, token, memory ID, unique memory ID, comment ID, and text are required',
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

    // 6. Find the comment
    const comment = existingUser[memoryKey].dynamicMemories[uniqueMemoryId].comments?.find(
      (c) => c.id === commentId
    );
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    // 7. Verify user is the author
    if (comment.author !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own comments.',
      });
    }

    // 8. Update the comment
    const updateResult = await collection.updateOne(
      { _id: hashID, [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments.id`]: commentId },
      { $set: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments.$.text`]: text } }
    );

    if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
      throw new Error('Edit comment failed: Comment not found or not updated');
    }

    // 9. Fetch updated comment
    const finalUser = await collection.findOne({ _id: hashID });
    const updatedComment = finalUser[memoryKey].dynamicMemories[uniqueMemoryId].comments.find(
      (c) => c.id === commentId
    );

    if (!updatedComment) {
      throw new Error('Failed to retrieve updated comment');
    }

    return res.status(200).json({
      success: true,
      message: 'Comment edited successfully',
      comment: {
        id: updatedComment.id,
        text: updatedComment.text,
        parentId: updatedComment.parentId,
        author: updatedComment.author,
        createdAt: updatedComment.createdAt,
        likes: updatedComment.likes,
      },
    });
  } catch (error) {
    console.error('Error in edit comment endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message,
    });
  }
}*/