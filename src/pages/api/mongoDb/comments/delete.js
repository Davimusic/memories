import clientPromise from '../../connectToDatabase';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import generateUserId from '@/functions/memories/generateUserId';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { userId, uid, token, memoryId, uniqueMemoryId, commentId } = req.body;

  // 1. Validate required fields
  if (!userId || !uid || !token || !memoryId || !uniqueMemoryId || !commentId) {
    return res.status(400).json({
      success: false,
      message: 'User ID, UID, token, memory ID, unique memory ID, and comment ID are required',
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
        message: 'Unauthorized: You can only delete your own comments.',
      });
    }

    // 8. Delete the comment and its descendants
    const descendantIds = await findDescendantIds(
      existingUser[memoryKey].dynamicMemories[uniqueMemoryId].comments,
      commentId
    );
    const idsToDelete = [commentId, ...descendantIds];

    const updateResult = await collection.updateOne(
      { _id: hashID },
      { $pull: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`]: { id: { $in: idsToDelete } } } }
    );

    if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
      throw new Error('Delete comment failed: Comment not found or not updated');
    }

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error in delete comment endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message,
    });
  }
}

// Find all descendant comment IDs
async function findDescendantIds(comments, parentId) {
  const descendants = [];
  const queue = [parentId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = comments.filter((c) => c.parentId === currentId);
    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}