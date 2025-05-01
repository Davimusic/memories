import { IncomingForm } from 'formidable';
import { readFileSync, unlinkSync } from 'fs';
import { createHash } from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Backblaze B2 credentials (use environment variables in production)
const B2_APP_KEY_ID = process.env.NEXT_PUBLIC_B2_APP_KEY_ID;
const B2_APP_KEY = process.env.NEXT_PUBLIC_B2_APP_KEY;
const B2_BUCKET_ID = process.env.NEXT_PUBLIC_B2_BUCKET_ID;
const B2_BUCKET_NAME = process.env.NEXT_PUBLIC_B2_BUCKET_NAME;


// Helper function to get B2 authorization
async function getB2Authorization() {
  const authString = Buffer.from(`${B2_APP_KEY_ID}:${B2_APP_KEY}`).toString('base64');
  const response = await fetch('https://api.backblaze.com/b2api/v2/b2_authorize_account', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authString}`,
    },
  });
  if (!response.ok) {
    throw new Error('B2 authorization error: ' + response.statusText);
  }
  return response.json();
}

// Helper function to get upload URL
async function getB2UploadUrl(apiUrl, authToken) {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucketId: B2_BUCKET_ID }),
  });
  if (!response.ok) {
    throw new Error('Failed to get upload URL: ' + response.statusText);
  }
  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = new IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Extract fields for storage path
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;
    const memoryTitle = Array.isArray(fields.memoryTitle) ? fields.memoryTitle[0] : fields.memoryTitle;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
    const fileType = Array.isArray(fields.fileType) ? fields.fileType[0] : fields.fileType;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Prepare storage path according to your model
    const folderPath = `user_uploads/${userId}/${memoryTitle}/${fileType}`;

    let filesArray = [];
    if (files.file) {
      filesArray = Array.isArray(files.file) ? files.file : [files.file];
    } else {
      return res.status(400).json({ error: 'No files received' });
    }

    // Authorize with B2
    const b2Auth = await getB2Authorization();
    const b2Upload = await getB2UploadUrl(b2Auth.apiUrl, b2Auth.authorizationToken);

    const uploadedFiles = [];

    for (const file of filesArray) {
      const fileBuffer = readFileSync(file.filepath);
      const originalName = file.originalFilename;
      const finalFileName = `${folderPath}/${timestamp}_${originalName}`;

      // Calculate SHA1 hash
      const sha1 = createHash('sha1').update(fileBuffer).digest('hex');

      // Upload with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 300000);

      const uploadResponse = await fetch(b2Upload.uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': b2Upload.authorizationToken,
          'X-Bz-File-Name': encodeURIComponent(finalFileName),
          'Content-Type': file.mimetype || 'application/octet-stream',
          'Content-Length': fileBuffer.length,
          'X-Bz-Content-Sha1': sha1,
        },
        body: fileBuffer,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed for ${originalName}: ${uploadResponse.statusText}`);
      }

      unlinkSync(file.filepath);

      // Construct the response according to your model
      uploadedFiles.push({
        file_name: originalName,
        storage_path: finalFileName,
        metadata: {
          fecha_subida: new Date().toISOString(),
          formato: file.mimetype || 'unknown',
          size: `${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`,
          ...(fileType === 'videos' && { duracion: '00:00:00' }),
          ...(fileType === 'audios' && { bitrate: '1411kbps' })
        }
      });
    }

    // Return the complete structure matching your model
    return res.status(200).json({
      success: true,
      uploadedFiles: uploadedFiles, // Campo directo con los archivos
      fileType: fileType,
      memoryTitle: memoryTitle,
      userId: userId
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}