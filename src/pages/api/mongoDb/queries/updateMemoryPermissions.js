// se usa
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

    console.log('updateMEmoryPermissions.......check');
    console.log(userId);
    console.log(memoryName);
    console.log(currentUser);
    console.log(token);
    console.log(uid);
    

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
        message: 'Invalid visibility value. Must be one of: public, private, invitation'
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
      ownerKey: userId,
      memoryName,
      type: 'editPermissions',
      uid,
      token,
      userEmail: currentUser
    });

    console.log('permissionResult..................');
    console.log(permissionResult);
    
    

    if (!permissionResult?.accessAllowed) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit permissions for this memory'
      });
    }

    // Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Check if the global document exists
    const globalDocument = await collection.findOne({ _id: userId });
    if (!globalDocument) {
      return res.status(404).json({
        success: false,
        message: 'User document not found'
      });
    }

    // Check if the memory exists (at root level)
    if (!globalDocument[memoryName]) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found in user document'
      });
    }

    // Prepare the update object with correct paths
    const updateFields = {
      [`${memoryName}.access.view.visibility`]: visibility || globalDocument[memoryName]?.access?.view?.visibility || 'private',
      [`${memoryName}.access.view.invitedEmails`]: invitedEmails || globalDocument[memoryName]?.access?.view?.invitedEmails || [],
      [`${memoryName}.access.upload.visibility`]: fileUploadVisibility || globalDocument[memoryName]?.access?.upload?.visibility || 'private',
      [`${memoryName}.access.upload.invitedEmails`]: fileUploadInvitedEmails || globalDocument[memoryName]?.access?.upload?.invitedEmails || [],
      [`${memoryName}.access.edit.visibility`]: editVisibility || globalDocument[memoryName]?.access?.edit?.visibility || 'private',
      [`${memoryName}.access.edit.invitedEmails`]: editInvitedEmails || globalDocument[memoryName]?.access?.edit?.invitedEmails || [],
      [`${memoryName}.metadata.lastUpdated`]: new Date().toISOString()
    };

    // Update the permissions in the database
    const updateResult = await collection.updateOne(
      { _id: userId },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'No changes were made (values may be the same as current)'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Memory permissions updated successfully',
      updatedFields: Object.keys(updateFields)
    });

  } catch (error) {
    console.error('Error in updateMemoryPermissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}





/*import clientPromise from '../../connectToDatabase';
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
      ownerKey: userId,
      memoryName,
      type: 'editPermissions',
      uid,
      token,
      userEmail: currentUser // Pass the raw email, as checkMemoryPermission sanitizes it
    });

    if (!permissionResult.accessAllowed) {
      console.log('!permissionResult.accessAllowed, llega.....................');
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
    const globalDocument = await collection.findOne({ _id: userId });
    if (!globalDocument) {
      return res.status(500).json({
        success: false,
        message: 'Global document not found'
      });
    }

    console.log('globalDocument..............................update memory permissions');
    console.log(globalDocument);
    


    

    // Check if the memory exists for the user
    if (!globalDocument[memoryName]) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found'
      });
    }

    // Prepare the update object
    const updateFields = {
      [`${userId}.${memoryName}.access.view.visibility`]: visibility || 'private',
      [`${userId}.${memoryName}.access.view.invitedEmails`]: invitedEmails || [],
      [`${userId}.${memoryName}.access.upload.visibility`]: fileUploadVisibility || 'private',
      [`${userId}.${memoryName}.access.upload.invitedEmails`]: fileUploadInvitedEmails || [],
      [`${userId}.${memoryName}.access.edit.visibility`]: editVisibility || 'private',
      [`${userId}.${memoryName}.access.edit.invitedEmails`]: editInvitedEmails || [],
      [`${userId}.${memoryName}.activity.lastUpdated`]: new Date().toISOString()
    };

    // Update the permissions in the database
    const updateResult = await collection.updateOne(
      { _id: userId },
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













