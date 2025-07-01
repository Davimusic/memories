import clientPromise from '../../connectToDatabase';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import { createHash } from 'crypto';
import generateUserId from '@/functions/memories/generateUserId';

export default async function handler(req, res) {
  const { userId, uid, token, memoryId, uniqueMemoryId } = req.body || req.query;

  console.log(userId);
  console.log(uid);
  console.log(token);
  console.log(memoryId);
  console.log(uniqueMemoryId);
  

  const memoryKey = memoryId; // Alias for consistency with provided code


  console.log('llega algo');
  


  // 1. Validate HTTP method
  const allowedMethods = ['POST', 'GET', 'PUT', 'DELETE'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  console.log(req.method);
  
  

  // 2. Validate required fields for all methods
  /*if (!userId || !uid || !token || !memoryKey || !uniqueMemoryId) {
    
    return res.status(400).json({
      success: false,
      message: 'Email, user ID, token, memory ID, and unique memory ID are required',
    });
  }*/

  
  

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
    if (!existingUser[memoryKey] || !existingUser[memoryKey].dynamicMemories?.[uniqueMemoryId]) {
      return res.status(404).json({
        success: false,
        message: 'Memory or dynamic memory does not exist.',
      });
    }

    // 7. Initialize comments structure if it doesn't exist
    if (!existingUser[memoryKey].dynamicMemories[uniqueMemoryId].comments) {
      await collection.updateOne(
        { _id: hashUserID, [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`]: { $exists: false } },
        { $set: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`]: [] } }
      );
    }


    console.log('aun');

    // Handle different HTTP methods
    switch (req.method) {
      case 'POST': {
        // Create a new comment or reply
        const { text, parentId } = req.body;
        if (!text) {
          return res.status(400).json({
            success: false,
            message: 'Comment text is required',
          });
        }

        const now = new Date();
        const commentId = createHash('sha256').update(`${userId}-${now.toISOString()}`).digest('hex');
        const commentData = {
          id: commentId,
          text,
          userId: hashUserID,
          author: userId, // Could be modified to use a username
          createdAt: now.toISOString(),
          likes: [],
          replies: parentId ? undefined : [],
        };

        const updatePath = parentId
          ? `${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments.$[comment].replies`
          : `${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`;

        const updateQuery = parentId
          ? {
              $push: { [updatePath]: commentData },
              arrayFilters: [{ 'comment.id': parentId }],
            }
          : { $push: { [updatePath]: commentData } };

        const updateResult = await collection.updateOne(
          { _id: hashUserID },
          updateQuery
        );

        if (!updateResult.acknowledged) {
          throw new Error('Comment creation failed');
        }

        return res.status(200).json({
          success: true,
          message: 'Comment created successfully',
          comment: commentData,
        });
      }

      case 'GET': {
        // Retrieve all comments for the memory
        const updatedUser = await collection.findOne({ _id: hashUserID });
        const comments = updatedUser[memoryKey].dynamicMemories[uniqueMemoryId].comments || [];

        return res.status(200).json({
          success: true,
          message: 'Comments retrieved successfully',
          comments,
        });
      }

      case 'PUT': {
        // Edit a comment or like a comment
        const { commentId, text, action } = req.body;
        if (!commentId) {
          return res.status(400).json({
            success: false,
            message: 'Comment ID is required',
          });
        }

        if (action === 'like') {
          const updateResult = await collection.updateOne(
            { _id: hashUserID, [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments.id`]: commentId },
            { $addToSet: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments.$.likes`]: hashUserID } }
          );

          if (!updateResult.acknowledged) {
            throw new Error('Like action failed');
          }

          const updatedUser = await collection.findOne({ _id: hashUserID });
          const comment = findComment(updatedUser[memoryKey].dynamicMemories[uniqueMemoryId].comments, commentId);

          return res.status(200).json({
            success: true,
            message: 'Comment liked successfully',
            likes: comment.likes,
          });
        }

        if (!text) {
          return res.status(400).json({
            success: false,
            message: 'Comment text is required for editing',
          });
        }

        // Check if user owns the comment
        const updatedUser = await collection.findOne({ _id: hashUserID });
        const comment = findComment(updatedUser[memoryKey].dynamicMemories[uniqueMemoryId].comments, commentId);
        if (!comment || comment.userId !== hashUserID) {
          return res.status(403).json({
            success: false,
            message: 'Unauthorized: You can only edit your own comments',
          });
        }

        const updateResult = await collection.updateOne(
          { _id: hashUserID, [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments.id`]: commentId },
          { $set: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments.$.text`]: text } }
        );

        if (!updateResult.acknowledged) {
          throw new Error('Comment update failed');
        }

        return res.status(200).json({
          success: true,
          message: 'Comment updated successfully',
          comment: { ...comment, text },
        });
      }

      case 'DELETE': {
        // Delete a comment
        const { commentId } = req.query;
        if (!commentId) {
          return res.status(400).json({
            success: false,
            message: 'Comment ID is required',
          });
        }

        // Check if user owns the comment
        const updatedUser = await collection.findOne({ _id: hashUserID });
        const comment = findComment(updatedUser[memoryKey].dynamicMemories[uniqueMemoryId].comments, commentId);
        if (!comment || comment.userId !== hashUserID) {
          return res.status(403).json({
            success: false,
            message: 'Unauthorized: You can only delete your own comments',
          });
        }

        const updateResult = await collection.updateOne(
          { _id: hashUserID },
          { $pull: { [`${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`]: { id: commentId } } }
        );

        if (!updateResult.acknowledged) {
          throw new Error('Comment deletion failed');
        }

        return res.status(200).json({
          success: true,
          message: 'Comment deleted successfully',
        });
      }
    }
  } catch (error) {
    console.error('Error in comments endpoint:', error);
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