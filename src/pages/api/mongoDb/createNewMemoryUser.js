import clientPromise from '../connectToDatabase';
import { verifyLoginUser } from '../firebase/verifyLoginUser';
import { sendEmail } from '../brevo/sendEmail';
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
    userId, // This is userEmail from the frontend
    memoryTitle,
    description,
    visibility,
    invitedEmails,
    fileUploadVisibility,
    fileUploadInvitedEmails,
    editVisibility,
    editInvitedEmails,
    createTopicsVisibility,
    createTopicsInvitedEmails,
    uid,
    token,
  } = req.body;

  console.log('Request received for:', {
    userId,
    memoryTitle,
    uid,
    authType: 'createNewMemoryUser',
  });

  // 2. Validate required fields
  if (!userId || !uid || !token || !memoryTitle) {
    return res.status(400).json({
      success: false,
      message: 'Email, user ID, token, and memory title are required',
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

  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 12); // YYYYMMDDHHMM
  const normalizedTitle = memoryTitle.replace(/\s+/g, '_');
  const memoryKey = createHash('sha256')
    .update(`${normalizedTitle}_${timestamp}`)
    .digest('base64')
    .replace(/[^a-zA-Z0-9]/g, ''); // Create a unique, safe key

  try {
    // 4. Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    const hashUserID = generateUserId(userId);
    // 5. Check if user exists
    const existingUser = await collection.findOne({ _id: hashUserID });

    console.log('existingUser');
    console.log(existingUser);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist. Please register first.',
      });
    }

    // 6. Check if memory key already exists in user document
    if (existingUser[memoryKey]) {
      return res.status(409).json({
        success: false,
        message: 'A memory with this title and timestamp already exists',
      });
    }

    // 7. Prepare memory data
    const memoryData = {
      metadata: {
        memoryKey,
        title: memoryTitle,
        description: description || '',
        createdBy: userId,
        createdAt: now.toISOString(),
        lastUpdated: now.toISOString(),
        status: 'active',
      },
      access: {
        view: {
          visibility: visibility || 'private',
          invitedEmails: invitedEmails || [],
        },
        upload: {
          visibility: fileUploadVisibility || 'private',
          invitedEmails: fileUploadInvitedEmails || [],
        },
        edit: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || [],
        },
        editTitleNameUser: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || [],
        },
        createMemoryTopics: {
          visibility: createTopicsVisibility || 'private',
          invitedEmails: createTopicsInvitedEmails || [],
        },
        editMemoryTopics: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || [],
        },
        editPermissions: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || [],
        },
        dynamicCreator: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || [],
        },
        createDynamicCreator: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || [],
        },
        dynamicMemories: {
          visibility: editVisibility || 'private',
          invitedEmails: editInvitedEmails || [],
        }
      },
      topics: {
        general: {
          photos: [],
          videos: [],
          audios: [],
          texts: [],
        },
      },
      activity: {
        lastAccessed: now.toISOString(),
        viewCount: 0,
        edits: [],
      },
      dynamicMemories: {

      }
    };

    // 8. Update user document with new memory data
    const updateResult = await collection.updateOne(
      { _id: hashUserID },
      {
        $set: {
          [memoryKey]: memoryData,
          'userInformation.lastLogin': now.toISOString(),
        },
      }
    );

    if (!updateResult.acknowledged) {
      throw new Error('Memory creation failed');
    }

    // 9. Send invitation emails for new permissions
    const appUrl = process.env.NEXT_PUBLIC_API_URL;

    // Send emails for view permissions
    if (visibility === 'invitation' && invitedEmails?.length > 0) {
      for (const email of invitedEmails) {
        const link = `${appUrl}/memories/${hashUserID}/${memoryKey}`;
        await sendEmail({
          email,
          subject: `Invitation to View Memory: "${memoryTitle}"`,
          message: `You have been invited by ${userId} to view the memory "${memoryTitle}". Access it here: <a href="${link}">${link}</a>`,
        });
      }
    }

    // Send emails for upload permissions
    if (fileUploadVisibility === 'invitation' && fileUploadInvitedEmails?.length > 0) {
      for (const email of fileUploadInvitedEmails) {
        const link = `${appUrl}/uploadFiles/${hashUserID}/${memoryKey}`;
        await sendEmail({
          email,
          subject: `Invitation to Upload to Memory: "${memoryTitle}"`,
          message: `You have been invited by ${userId} to upload files to the memory "${memoryTitle}". Start contributing here: <a href="${link}">${link}</a>`,
        });
      }
    }

    // Send emails for edit permissions
    if (editVisibility === 'invitation' && editInvitedEmails?.length > 0) {
      for (const email of editInvitedEmails) {
        const link = `${appUrl}/editMemories/${hashUserID}/${memoryKey}`;
        await sendEmail({
          email,
          subject: `Invitation to Edit Memory: "${memoryTitle}"`,
          message: `You have been invited by ${userId} to edit the memory "${memoryTitle}". Make changes here: <a href="${link}">${link}</a>`,
        });
      }
    }

    // Send emails for create topics permissions
    if (createTopicsVisibility === 'invitation' && createTopicsInvitedEmails?.length > 0) {
      for (const email of createTopicsInvitedEmails) {
        const link = `${appUrl}/createTopics/${hashUserID}/${memoryKey}`;
        await sendEmail({
          email,
          subject: `Invitation to Create Topics for Memory: "${memoryTitle}"`,
          message: `You have been invited by ${userId} to create topics for the memory "${memoryTitle}". Start creating topics here: <a href="${link}">${link}</a>`,
        });
      }
    }

    console.log(`Memory created with key: ${memoryKey}`, JSON.stringify(memoryData, null, 2));

    // 10. Return success response
    return res.status(201).json({
      success: true,
      message: 'Memory created successfully and invitations sent',
      user: {
        id: hashUserID,
        ...existingUser.userInformation,
        lastLogin: now.toISOString(),
      },
      memory: {
        id: memoryKey,
        ...memoryData.metadata,
        permissions: memoryData.access,
        mediaCount: {
          photos: 0,
          videos: 0,
          audios: 0,
          documents: 0,
        },
      },
    });

  } catch (error) {
    console.error('Error in createNewMemoryUser endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message,
    });
  }
}








