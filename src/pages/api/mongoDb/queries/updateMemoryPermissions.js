// se usa
import clientPromise from '../../connectToDatabase';
import { checkMemoryPermission } from './checkMemoryPermission';
import { verifyLoginUser } from '../../firebase/verifyLoginUser';
import { sendEmail } from '../../brevo/sendEmail';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
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
      uid,
    } = req.body;

    if (!userId || !memoryName || !currentUser || !token || !uid) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const validVisibilities = ['public', 'private', 'invitation'];
    if (
      (visibility && !validVisibilities.includes(visibility)) ||
      (fileUploadVisibility && !validVisibilities.includes(fileUploadVisibility)) ||
      (editVisibility && !validVisibilities.includes(editVisibility))
    ) {
      return res.status(400).json({ success: false, message: 'Invalid visibility value' });
    }

    const loginResult = await verifyLoginUser({ uid, token });
    if (!loginResult.success) {
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }

    const permissionResult = await checkMemoryPermission({
      ownerKey: userId,
      memoryName,
      type: 'editPermissions',
      uid,
      token,
      userEmail: currentUser,
    });

    if (!permissionResult?.accessAllowed) {
      return res.status(403).json({ success: false, message: 'No permission to edit' });
    }

    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    const globalDocument = await collection.findOne({ _id: userId });
    if (!globalDocument) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!globalDocument[memoryName]) {
      return res.status(404).json({ success: false, message: 'Memory not found' });
    }

    const existingViewEmails = globalDocument[memoryName]?.access?.view?.invitedEmails || [];
    const existingUploadEmails = globalDocument[memoryName]?.access?.upload?.invitedEmails || [];
    const existingEditEmails = globalDocument[memoryName]?.access?.edit?.invitedEmails || [];

    const newViewEmails = invitedEmails ? invitedEmails.filter((email) => !existingViewEmails.includes(email)) : [];
    const newUploadEmails = fileUploadInvitedEmails ? fileUploadInvitedEmails.filter((email) => !existingUploadEmails.includes(email)) : [];
    const newEditEmails = editInvitedEmails ? editInvitedEmails.filter((email) => !existingEditEmails.includes(email)) : [];

    // Get the memory title from the metadata
    const memoryTitle = globalDocument[memoryName]?.metadata?.title || memoryName; // Fallback to memoryName if title is not found

    const updateFields = {
      [`${memoryName}.access.view.visibility`]: visibility || globalDocument[memoryName]?.access?.view?.visibility || 'private',
      [`${memoryName}.access.view.invitedEmails`]: invitedEmails || globalDocument[memoryName]?.access?.view?.invitedEmails || [],
      [`${memoryName}.access.upload.visibility`]: fileUploadVisibility || globalDocument[memoryName]?.access?.upload?.visibility || 'private',
      [`${memoryName}.access.upload.invitedEmails`]: fileUploadInvitedEmails || globalDocument[memoryName]?.access?.upload?.invitedEmails || [],
      [`${memoryName}.access.edit.visibility`]: editVisibility || globalDocument[memoryName]?.access?.edit?.visibility || 'private',
      [`${memoryName}.access.edit.invitedEmails`]: editInvitedEmails || globalDocument[memoryName]?.access?.edit?.invitedEmails || [],
      [`${memoryName}.metadata.lastUpdated`]: new Date().toISOString(),
    };

    const updateResult = await collection.updateOne({ _id: userId }, { $set: updateFields });

    const appUrl = process.env.NEXT_PUBLIC_API_URL;

    // Send emails for new view permissions
    for (const email of newViewEmails) {
      const link = `${appUrl}/memories/${userId}/${memoryName}`;
      await sendEmail({
        email,
        subject: `Invitation to View Memory: "${memoryTitle}"`,
        message: `You have been invited by ${currentUser} to view the memory "${memoryTitle}". Access it here: <a href="${link}">${link}</a>`,
      });
    }

    // Send emails for new upload permissions
    for (const email of newUploadEmails) {
      const link = `${appUrl}/uploadFiles/${userId}/${memoryName}`;
      await sendEmail({
        email,
        subject: `Invitation to Upload to Memory: "${memoryTitle}"`,
        message: `You have been invited by ${currentUser} to upload files to the memory "${memoryTitle}". Start contributing here: <a href="${link}">${link}</a>`,
      });
    }

    // Send emails for new edit permissions
    for (const email of newEditEmails) {
      const link = `${appUrl}/editMemories/${userId}/${memoryName}`;
      await sendEmail({
        email,
        subject: `Invitation to Edit Memory: "${memoryTitle}"`,
        message: `You have been invited by ${currentUser} to edit the memory "${memoryTitle}". Make changes here: <a href="${link}">${link}</a>`,
      });
    }

    return res.status(200).json({
      success: true,
      message: updateResult.modifiedCount === 0 ? 'No changes made' : 'Permissions updated and emails sent',
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
}*/





