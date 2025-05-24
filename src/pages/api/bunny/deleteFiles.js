import { checkMemoryPermission } from '../mongoDb/queries/checkMemoryPermission';
import path from 'path';




export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const FOLDER_ACTIONS = {
  editMemories: 'edit',
};

const VALID_FILE_TYPES = ['audio', 'image', 'video'];

const ALLOWED_EXTENSIONS = {
  audio: ['mp3'],
  image: ['jpg', 'jpeg', 'png', 'gif'],
  video: ['mp4'],
};

export default async function handler(req, res) {
  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Log request for debugging
    console.log('Delete files request received:', {
      query: req.query,
      body: req.body,
    });

    const { userId, memoryName, filesToDelete, userEmail } = req.body;

    // Validate parameters
    const missingParams = [];
    if (!userId) missingParams.push('userId');
    if (!memoryName) missingParams.push('memoryName');
    if (!filesToDelete || !Array.isArray(filesToDelete)) missingParams.push('filesToDelete');

    if (missingParams.length > 0) {
      throw new Error(`Missing parameters: ${missingParams.join(', ')}`);
    }

    // Sanitize userId
    const sanitizedUser = userEmail.replace(/[@.]/g, '_');

    console.log(userId);
    console.log(memoryName);
    console.log(sanitizedUser);
    console.log(FOLDER_ACTIONS.editMemories);
    

    // Check permissions
    const permission = await checkMemoryPermission({
      userId,
      memoryName,
      currentUser: sanitizedUser,
      type: FOLDER_ACTIONS.editMemories,
    });

    console.log('Permission check result:', permission);

    if (!permission.accessAllowed) {
      throw new Error('Access denied for editing memories');
    }

    // Validate environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_BUNNY_REGION',
      'NEXT_PUBLIC_BUNNY_STORAGE_ZONE',
      'NEXT_PUBLIC_BUNNY_ACCESS_KEY',
    ];

    const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }

    // Initialize Bunny.net API client
    const bunnyApiUrl = `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${
      process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE
    }`;
    const headers = {
      AccessKey: process.env.NEXT_PUBLIC_BUNNY_ACCESS_KEY,
      'Content-Type': 'application/octet-stream',
    };

    // Process file deletions
    const deletionResults = await Promise.all(
      filesToDelete.map(async (file) => {
        try {
          // Validate file type
          if (!VALID_FILE_TYPES.includes(file.type)) {
            return {
              file: file.url,
              success: false,
              error: `Invalid file type: ${file.type}`,
            };
          }

          // Sanitize file name
          const safeFileName = path.basename(file.file_name).replace(/[^a-zA-Z0-9._-]/g, '_');
          if (!safeFileName) {
            return {
              file: file.url,
              success: false,
              error: 'Invalid file name',
            };
          }

          // Validate file extension
          const ext = path.extname(safeFileName).toLowerCase().replace('.', '');
          if (!ALLOWED_EXTENSIONS[file.type].includes(ext)) {
            return {
              file: file.url,
              success: false,
              error: `Invalid file extension for type ${file.type}: ${ext}`,
            };
          }

          // Construct file path
          const filePath = file.url.replace(
            `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${
              process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE
            }/`,
            ''
          );

          // Send DELETE request to Bunny.net
          const response = await fetch(`${bunnyApiUrl}/${filePath}`, {
            method: 'DELETE',
            headers,
          });

          if (response.ok) {
            return {
              file: file.url,
              success: true,
            };
          } else {
            const errorData = await response.json().catch(() => ({
              error: 'Unknown error from Bunny.net API',
            }));
            return {
              file: file.url,
              success: false,
              error: errorData.error || `Failed to delete file (status ${response.status})`,
            };
          }
        } catch (error) {
          console.error(`Error deleting file ${file.url}:`, error);
          return {
            file: file.url,
            success: false,
            error: error.message,
          };
        }
      })
    );

    // Check if all deletions were successful
    const failedDeletions = deletionResults.filter((result) => !result.success);
    if (failedDeletions.length > 0) {
      return res.status(500).json({
        success: false,
        error: 'Some files could not be deleted',
        details: failedDeletions,
      });
    }

    // Respond with success
    res.status(200).json({
      success: true,
      message: 'All files deleted successfully',
      deletedFiles: deletionResults.map((result) => result.file),
    });
  } catch (error) {
    console.error('Critical error in deleteFiles:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });
  }
}