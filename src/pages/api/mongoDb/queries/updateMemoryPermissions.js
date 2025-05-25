import clientPromise from '../../connectToDatabase';
import { checkMemoryPermission } from './checkMemoryPermission'; 
import { verifyLoginUser } from '../../firebase/verifyLoginUser'; 

export default async function handler(req, res) {
  try {
    // Only allow POST method
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    const {
      userId,
      memoryName,
      currentUser,
      visibility,
      invitedEmails,
      fileUploadVisibility,
      fileUploadInvitedEmails,
      editVisibility,
      editInvitedEmails,
      token,
      uid
    } = req.body;

    // Validate required fields
    if (!userId || !memoryName || !currentUser || !token || !uid) {
      return res.status(400).json({
        success: false,
        message: 'userId, memoryName, currentUser, token, and uid are required'
      });
    }

    // Validate visibility fields
    const validVisibilities = ['public', 'private', 'invitation'];
    if (
      (visibility && !validVisibilities.includes(visibility)) ||
      (fileUploadVisibility && !validVisibilities.includes(fileUploadVisibility)) ||
      (editVisibility && !validVisibilities.includes(editVisibility))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visibility value'
      });
    }

    // Verify user authentication
    const loginResult = await verifyLoginUser({ uid, token });
    if (!loginResult.success) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: ' + loginResult.error
      });
    }

    // Check if the user has permission to edit permissions
    const permissionResult = await checkMemoryPermission({
      userId,
      memoryName,
      type: 'editPermissions',
      uid,
      token,
      userEmail: currentUser // Pass the raw email, as checkMemoryPermission sanitizes it
    });

    if (!permissionResult.accessAllowed) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this memory'
      });
    }

    // Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Check if the global document exists
    const globalDocument = await collection.findOne({ _id: 'globalMemories' });
    if (!globalDocument) {
      return res.status(500).json({
        success: false,
        message: 'Global document not found'
      });
    }

    // Check if the user exists
    const sanitizedCurrentUser = currentUser.replace(/[@.]/g, '_');
    if (!globalDocument[sanitizedCurrentUser]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the memory exists for the user
    if (!globalDocument[sanitizedCurrentUser][memoryName]) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found'
      });
    }

    // Prepare the update object
    const updateFields = {
      [`${sanitizedCurrentUser}.${memoryName}.access.view.visibility`]: visibility || 'private',
      [`${sanitizedCurrentUser}.${memoryName}.access.view.invitedEmails`]: invitedEmails || [],
      [`${sanitizedCurrentUser}.${memoryName}.access.upload.visibility`]: fileUploadVisibility || 'private',
      [`${sanitizedCurrentUser}.${memoryName}.access.upload.invitedEmails`]: fileUploadInvitedEmails || [],
      [`${sanitizedCurrentUser}.${memoryName}.access.edit.visibility`]: editVisibility || 'private',
      [`${sanitizedCurrentUser}.${memoryName}.access.edit.invitedEmails`]: editInvitedEmails || [],
      [`${sanitizedCurrentUser}.${memoryName}.activity.lastUpdated`]: new Date().toISOString()
    };

    // Update the permissions in the database
    const updateResult = await collection.updateOne(
      { _id: 'globalMemories' },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update permissions'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Permissions updated successfully'
    });

  } catch (error) {
    console.error('Error updating permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
















/*import clientPromise from '../../connectToDatabase';

export default async function handler(req, res) {
  try {
    // Only allow POST method
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    const {
      userId,
      memoryName,
      currentUser,
      visibility,
      invitedEmails,
      fileUploadVisibility,
      fileUploadInvitedEmails,
      editVisibility,
      editInvitedEmails
    } = req.body;

    // Validate required fields
    if (!userId || !memoryName || !currentUser) {
      return res.status(400).json({
        success: false,
        message: 'userId, memoryName, and currentUser are required'
      });
    }

    // Validate visibility fields
    const validVisibilities = ['public', 'private', 'restricted'];
    if (
      (visibility && !validVisibilities.includes(visibility)) ||
      (fileUploadVisibility && !validVisibilities.includes(fileUploadVisibility)) ||
      (editVisibility && !validVisibilities.includes(editVisibility))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visibility value'
      });
    }

    // Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Check if the global document exists
    const globalDocument = await collection.findOne({ _id: 'globalMemories' });
    if (!globalDocument) {
      return res.status(500).json({
        success: false,
        message: 'Global document not found'
      });
    }

    // Check if the user exists
    if (!globalDocument[currentUser]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the memory exists for the user
    if (!globalDocument[currentUser][memoryName]) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found'
      });
    }

    // Prepare the update object
    const updateFields = {
      [`${currentUser}.${memoryName}.access.view.visibility`]: visibility || 'private',
      [`${currentUser}.${memoryName}.access.view.invitedEmails`]: invitedEmails || [],
      [`${currentUser}.${memoryName}.access.upload.visibility`]: fileUploadVisibility || 'private',
      [`${currentUser}.${memoryName}.access.upload.invitedEmails`]: fileUploadInvitedEmails || [],
      [`${currentUser}.${memoryName}.access.edit.visibility`]: editVisibility || 'private',
      [`${currentUser}.${memoryName}.access.edit.invitedEmails`]: editInvitedEmails || [],
      [`${currentUser}.${memoryName}.activity.lastUpdated`]: new Date().toISOString()
    };

    // Update the permissions in the database
    const updateResult = await collection.updateOne(
      { _id: 'globalMemories' },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update permissions'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Permissions updated successfully'
    });

  } catch (error) {
    console.error('Error updating permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}*/