// uploadWorker.js

// Escucha mensajes enviados desde el hilo principal.
self.onmessage = async (event) => {
  // Se reciben los datos necesarios: 
  // files: objeto con arrays (photos, videos, audios)
  // permissionInfo, userID, memoryName, userEmail, etc.
  const { files, permissionInfo, userID, memoryName, userEmail } = event.data;

  // Función auxiliar para sanitizar emails
  const sanitizeEmail = email => email.replace(/\./g, '(dot)');

  // Objeto para almacenar los archivos subidos organizados por tipo.
  let uploadedMedia = { photos: [], videos: [], audios: [] };

  try {
    // 1. Subir archivos a Bunny.net para cada tipo.
    const fileTypes = ['photos', 'videos', 'audios'];
    const uploadPromises = fileTypes.map(async (fileType) => {
      // Si no hay archivos para este tipo, no hacemos nada.
      if (!files[fileType] || files[fileType].length === 0) return;
      
      const formData = new FormData();
      formData.append('fileType', fileType);
      formData.append('userId', sanitizeEmail(userID));
      formData.append('memoryTitle', memoryName);
      // Agregar cada archivo al formData.
      files[fileType].forEach(fileObj => {
        formData.append('file', fileObj.file);
      });

      // Llamar al endpoint que maneja la subida a Bunny.net.
      const response = await fetch('/api/bunny/uploadFilesToBunny', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Error al subir ${fileType}: ${errorResponse.message || response.statusText}`);
      }

      const result = await response.json();
      // Guardar los resultados para este tipo de archivo.
      result.files.forEach(file => {
        uploadedMedia[fileType].push({
          url: file.url,
          file_name: file.fileName,
          storage_path: file.path,
          metadata: {
            uploaded_by: sanitizeEmail(userEmail),
            upload_date: new Date().toISOString()
          }
        });
      });
    });
    await Promise.all(uploadPromises);

    // 2. Construir la estructura para MongoDB.
    const memoryData = {
      [memoryName]: {
        media: uploadedMedia,
        metadata: {
          title: memoryName,
          description: permissionInfo.metadata?.description || "",
          created_by: sanitizeEmail(permissionInfo.ownerEmail),
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          status: "active",
          total_files: {
            photos: uploadedMedia.photos.length,
            videos: uploadedMedia.videos.length,
            audios: uploadedMedia.audios.length
          }
        },
        activity: {
          last_accessed: new Date().toISOString(),
          edits: [{
            user: sanitizeEmail(userEmail),
            timestamp: new Date().toISOString(),
            action: "upload",
            files_added: {
              photos: uploadedMedia.photos.length,
              videos: uploadedMedia.videos.length,
              audios: uploadedMedia.audios.length
            }
          }]
        }
      }
    };

    // 3. Guardar la información en MongoDB a través del endpoint que ya tienes.
    const mongoResponse = await fetch('/api/mongoDb/uploadReferencesFilesToMongoDB', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: sanitizeEmail(userEmail),
        memoryData,
        ownerEmail: sanitizeEmail(permissionInfo.ownerEmail)
      })
    });

    const mongoResult = await mongoResponse.json();
    if (!mongoResponse.ok) {
      throw new Error(mongoResult.message || 'Error al guardar en MongoDB');
    }

    // 4. Notificar al hilo principal que todo se completó con éxito, pasando la data resultante.
    self.postMessage({ status: 'success', uploadedMedia, mongoResult });
  } catch (error) {
    console.error('Error en el Worker:', error);
    // Notificar al hilo principal en caso de error.
    self.postMessage({ status: 'error', error: error.message });
  }
};
