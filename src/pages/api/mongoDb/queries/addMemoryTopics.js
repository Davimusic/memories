// se usa
import clientPromise from '../../connectToDatabase';
import { checkMemoryPermission } from './checkMemoryPermission';

export default async function handler(req, res) {
  try {
    // 1. Validate HTTP method (POST only)
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
      });
    }

    const { userId, memoryTitle, userEmail, newTopics, uid, token } = req.body;

    console.log('Request received for:', { userId, memoryTitle, userEmail, newTopics, uid, token });

    // 2. Validate required fields
    if (!Object.keys(newTopics).length) {
      return res.status(400).json({
        success: false,
        message: 'At least one new topic must be provided',
      });
    }

    // 3. Check permissions
    const permission = await checkMemoryPermission({
      ownerKey: userId,
      memoryName: memoryTitle,
      userEmail,
      type: 'createMemoryTopics',
      uid,
      token,
    });

    if (!permission.accessAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for creating topics',
        details: permission.error || 'Permission check failed',
      });
    }

    // 4. Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // 5. Validate user existence
    const userDoc = await collection.findOne({ _id: userId });
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} does not exist in the database`,
      });
    }

    // 6. Validate memory existence
    if (!userDoc[memoryTitle]) {
      return res.status(404).json({
        success: false,
        message: `Memory '${memoryTitle}' does not exist for user ${userId}`,
      });
    }

    // 7. Validate new topics (check for duplicates)
    const existingTopics = userDoc[memoryTitle].topics
      ? Object.keys(userDoc[memoryTitle].topics).map(t => t.toLowerCase())
      : [];
    const newTopicNames = Object.keys(newTopics);
    const duplicateTopics = newTopicNames.filter(name => existingTopics.includes(name.toLowerCase()));

    if (duplicateTopics.length > 0) {
      return res.status(409).json({
        success: false,
        message: `The following topics already exist: ${duplicateTopics.join(', ')}`,
      });
    }

    // 8. Prepare update operation
    const now = new Date();
    const updateData = {};
    newTopicNames.forEach(topicName => {
      updateData[`${memoryTitle}.topics.${topicName}`] = newTopics[topicName];
    });
    updateData[`${memoryTitle}.activity.lastAccessed`] = now.toISOString();
    updateData[`${memoryTitle}.activity.edits`] = [
      ...(userDoc[memoryTitle].activity?.edits || []),
      {
        user: userId,
        action: 'added_topics',
        topics: newTopicNames,
        timestamp: now.toISOString(),
      },
    ];

    // 9. Execute update
    const result = await collection.updateOne(
      { _id: userId },
      { $set: updateData }
    );

    // 10. Verify result
    if (!result.acknowledged || result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'No changes were made to the database',
      });
    }

    console.log(`Topics added to memory with key: ${memoryTitle}`, JSON.stringify(newTopics, null, 2));

    // 11. Return success response
    return res.status(201).json({
      success: true,
      message: 'Topics added successfully',
      addedTopics: newTopicNames,
      details: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    });

  } catch (error) {
    console.error('Error in addMemoryTopics endpoint:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contact support',
    });
  }
}
