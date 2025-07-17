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

  const { userId, uid, token, memoryId, userEmail, uniqueMemoryId, text, parentId, root, fileId } = req.body;

  console.log(req.body);
  

  
  
  

  // 1. Validate required fields
  const validRoots = ['dynamicMemory', 'generalMemory', 'files'];
  if (!userId || !uid || !token || !memoryId || !text || !root || !validRoots.includes(root)) {
    
    return res.status(400).json({
      success: false,
      message: 'User ID, UID, token, memory ID, text, and valid root (dynamicMemory, generalMemory, or files) are required',
    });
  }

  // 2. Validate uniqueMemoryId for dynamicMemory and fileId for files
  if (root === 'dynamicMemory' && !uniqueMemoryId) {
    return res.status(400).json({
      success: false,
      message: 'uniqueMemoryId is required for dynamicMemory comments',
    });
  }
  /*if (root === 'files'){ // && !fileId) {
    console.log('llega.........');
    return res.status(400).json({
      success: false,
      message: 'fileId is required for file-specific comments',
    });
  }*/

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
    const existingUser = await collection.findOne({ _id: userId });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist. Please register first.',
      });
    }

    // 6. Create the comment
    const now = new Date();
    const commentId = createHash('sha256').update(`${userId}-${now.toISOString()}`).digest('hex');
    const commentData = {
      id: commentId,
      text,
      parentId: parentId || null,
      author: userEmail || 'unKnow',
      createdAt: now.toISOString(),
      likes: [],
    };

    // 7. Determine the comment location and update
    let updateResult;
    if (root === 'dynamicMemory') {
      if (!existingUser[memoryKey] || !existingUser[memoryKey].dynamicMemories?.[uniqueMemoryId]) {
        return res.status(404).json({
          success: false,
          message: 'Dynamic memory does not exist.',
        });
      }
      const commentPath = `${memoryKey}.dynamicMemories.${uniqueMemoryId}.comments`;
      // Verify parent comment exists
      const commentsArray = existingUser[memoryKey]?.dynamicMemories?.[uniqueMemoryId]?.comments || [];
      if (parentId && !commentsArray.find((c) => c.id === parentId)) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found.',
        });
      }
      // Initialize comments array if it doesn't exist
      if (!existingUser[memoryKey]?.dynamicMemories?.[uniqueMemoryId]?.comments) {
        await collection.updateOne(
          { _id: userId },
          { $set: { [commentPath]: [] } }
        );
      }
      // Add comment
      updateResult = await collection.updateOne(
        { _id: userId },
        { $push: { [commentPath]: commentData } }
      );
    } else if (root === 'generalMemory') {
      const commentPath = `${memoryKey}.comments`;
      // Verify parent comment exists
      const commentsArray = existingUser[memoryKey]?.comments || [];
      if (parentId && !commentsArray.find((c) => c.id === parentId)) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found.',
        });
      }
      // Initialize comments array if it doesn't exist
      if (!existingUser[memoryKey]?.comments) {
        await collection.updateOne(
          { _id: userId },
          { $set: { [commentPath]: [] } }
        );
      }
      // Add comment
      updateResult = await collection.updateOne(
        { _id: userId },
        { $push: { [commentPath]: commentData } }
      );
    } else if (root === 'files') {
      // Find the file in all topics
      let filePath = null;
      let found = false;
      for (const topicKey of Object.keys(existingUser[memoryKey]?.topics || {})) {
        for (const mediaType of ['photos', 'videos', 'audios', 'texts']) {
          const files = existingUser[memoryKey]?.topics?.[topicKey]?.[mediaType] || [];
          const fileIndex = files.findIndex((file) => file.url === fileId);
          if (fileIndex !== -1) {
            filePath = `${memoryKey}.topics.${topicKey}.${mediaType}.${fileIndex}.metadata.comments`;
            found = true;
            // Verify parent comment exists
            const commentsArray = files[fileIndex]?.metadata?.comments || [];
            if (parentId && !commentsArray.find((c) => c.id === parentId)) {
              return res.status(404).json({
                success: false,
                message: 'Parent comment not found.',
              });
            }
            // Initialize comments array if it doesn't exist
            if (!files[fileIndex]?.metadata?.comments) {
              await collection.updateOne(
                { _id: userId },
                { $set: { [`${memoryKey}.topics.${topicKey}.${mediaType}.${fileIndex}.metadata.comments`]: [] } }
              );
            }
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
      // Add comment to the file's metadata.comments
      updateResult = await collection.updateOne(
        { _id: userId },
        { $push: { [filePath]: commentData } }
      );
    }

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
























