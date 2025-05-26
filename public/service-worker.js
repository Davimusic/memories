self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(checkPendingUploads());
});

self.addEventListener('message', async (event) => {
  if (event.data.type === 'START_UPLOADS') {
    const { keys } = event.data;
    await processUploads(keys);
  }
});

async function processUploads(keys) {
  console.log('Processing uploads for keys:', keys, 'Total keys:', keys.length);
  const db = await openDB();
  const failedTasks = [];

  const mediaTypeMap = {
    image: 'photos',
    video: 'videos',
    audio: 'audios'
  };

  for (const key of keys) {
    console.log('Processing task for key:', key);
    const task = await getTask(db, key);
    if (!task) {
      console.log('No task found for key:', key);
      continue;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const authResponse = await fetch(
        `/api/bunny/secureUpload?memoryName=${encodeURIComponent(task.memoryName)}&userID=${task.userID}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'file-type': task.file.type
          },
          body: JSON.stringify({
            currentUser: task.currentUser,
            type: task.folderName,
            fileType: task.fileType,
            fileName: task.fileName,
            uid: task.uid,
            token: task.token
          })
        }
      );

      if (!authResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      console.log('Respuesta de Bunny (para subir archivo):', authResponse);

      const { uploadUrl, headers, publicUrl } = await authResponse.json();
      console.log('uploadUrl:', uploadUrl);
      console.log('headers:', headers);
      console.log('publicUrl:', publicUrl);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': task.file.type,
        },
        body: task.file
      });

      if (!uploadResponse.ok) {
        throw new Error(`HTTP error! status: ${uploadResponse.status}`);
      }

      const uploadResultText = await uploadResponse.text();
      console.log('Resultado de la subida:', uploadResultText);
      console.log('Subida exitosa a Bunny usando uploadUrl:', uploadUrl);

      const originalBase = "https://ny.storage.bunnycdn.com/goodmemories";
      const newBase = "https://goodmemoriesapp.b-cdn.net";
      const updatedUrl = uploadUrl.replace(originalBase, newBase);
      console.log('URL transformada para MongoDB:', updatedUrl);

      const memoryUpdate = {
        memoryData: {
          [task.memoryName]: {
            activity: {
              last_accessed: new Date().toISOString(),
              edits: [{
                date: new Date().toISOString(),
                user: task.currentUser,
                changes: `Added ${task.fileType} file: ${task.fileName}`
              }]
            },
            media: {
              [mediaTypeMap[task.fileType]]: [{
                url: updatedUrl,
                metadata: {
                  size: task.file.size,
                  type: task.file.type,
                  upload_date: new Date().toISOString()
                }
              }]
            }
          }
        },
        ownerEmail: task.currentUser,
        uid: task.uid,
        token: task.token
      };

      const mongoResponse = await fetch(`/api/mongoDb/uploadReferencesFilesToMongoDB?memoryName=${encodeURIComponent(task.memoryName)}&userID=${task.userID}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(memoryUpdate)
      });

      if (!mongoResponse.ok) {
        throw new Error('Error updating MongoDB');
      }

      await deleteTask(db, key);
      console.log('Actualización MongoDB exitosa');
    } catch (error) {
      console.error('Error processing task for key:', key, 'Error:', error);
      failedTasks.push({ key, error: error.message });
    }
  }

  if (failedTasks.length > 0) {
    console.log('Failed tasks:', failedTasks);
    self.postMessage({
      type: 'UPLOAD_STATUS',
      failedTasks,
    });
  }

  console.log('Finished processing all keys');
  db.close();
}

async function checkPendingUploads() {
  const db = await openDB();
  const tx = db.transaction('uploadTasks', 'readonly');
  const store = tx.objectStore('uploadTasks');
  const keys = await new Promise((resolve) => {
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
  });
  await tx.done;
  if (keys.length > 0) {
    await processUploads(keys);
  }
  db.close();
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('uploads', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('uploadTasks');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getTask(db, key) {
  return new Promise((resolve) => {
    const tx = db.transaction('uploadTasks', 'readonly');
    const store = tx.objectStore('uploadTasks');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
  });
}

function deleteTask(db, key) {
  return new Promise((resolve) => {
    const tx = db.transaction('uploadTasks', 'readwrite');
    const store = tx.objectStore('uploadTasks');
    const req = store.delete(key);
    req.onsuccess = () => resolve();
  });
}



















/*self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(checkPendingUploads());
});

self.addEventListener('message', async (event) => {
  if (event.data.type === 'START_UPLOADS') {
    const { keys } = event.data;
    await processUploads(keys);
  }
});



async function processUploads(keys) {
  const db = await openDB();

  const mediaTypeMap = {
    image: 'photos',
    video: 'videos',
    audio: 'audios'
  };

  for (const key of keys) {
    const task = await getTask(db, key);
    if (!task) continue;

    try {
      // 1. Obtener URL de subida y headers
      const authResponse = await fetch(
        `/api/bunny/secureUpload?memoryName=${encodeURIComponent(task.memoryName)}&userID=${task.userID}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentUser: task.currentUser,
            type: task.folderName,
            fileType: task.fileType,
            fileName: task.fileName,
            uid: task.uid,
            token: task.token
          })
        }
      );

      if (!authResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      console.log('Respuesta de Bunny (para subir archivo):', authResponse);

      // Se espera que la respuesta incluya uploadUrl, headers y publicUrl, aunque solo se usará uploadUrl
      const { uploadUrl, headers, publicUrl } = await authResponse.json();
      console.log('uploadUrl:', uploadUrl);
      console.log('headers:', headers);
      console.log('publicUrl:', publicUrl);

      // 2. Subir archivo a Bunny.net
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          ...headers, // Cabeceras necesarias que envía Bunny
          'Content-Type': task.file.type,
        },
        body: task.file
      });

      if (!uploadResponse.ok) {
        throw new Error(`HTTP error! status: ${uploadResponse.status}`);
      }

      const uploadResultText = await uploadResponse.text();
      console.log('Resultado de la subida:', uploadResultText);
      console.log('Subida exitosa a Bunny usando uploadUrl:', uploadUrl);

      // 3. Transformar uploadUrl para obtener la URL final almacenada en MongoDB:
      // Definimos la URL original y la base a reemplazar:
      const originalBase = "https://ny.storage.bunnycdn.com/goodmemories";
      // Obtenemos la nueva URL base desde la variable de entorno
      const newBase = "https://goodmemoriesapp.b-cdn.net"
      // Reemplazamos la parte base y generamos la URL actualizada:
      const updatedUrl = uploadUrl.replace(originalBase, newBase);
      console.log('URL transformada para MongoDB:', updatedUrl);

      // 4. Actualizar MongoDB con la URL transformada
      const memoryUpdate = {
        memoryData: {
          [task.memoryName]: {
            activity: {
              last_accessed: new Date().toISOString(),
              edits: [{
                date: new Date().toISOString(),
                user: task.currentUser,
                changes: `Added ${task.fileType} file: ${task.fileName}`
              }]
            },
            media: {
              [mediaTypeMap[task.fileType]]: [{
                url: updatedUrl, // Se usa la URL transformada como link final
                metadata: {
                  size: task.file.size,
                  type: task.file.type,
                  upload_date: new Date().toISOString()
                }
              }]
            }
          }
        },
        ownerEmail: task.currentUser,
        uid: task.uid,
        token: task.token
      };

      const mongoResponse = await fetch(`/api/mongoDb/uploadReferencesFilesToMongoDB?memoryName=${encodeURIComponent(task.memoryName)}&userID=${task.userID}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(memoryUpdate)
      });

      if (!mongoResponse.ok) {
        throw new Error('Error updating MongoDB');
      }

      await deleteTask(db, key);
      console.log('Actualización MongoDB exitosa');
    } catch (error) {
      console.error('Error en el proceso:', error);
      // Agrega lógica de reintento si es necesario
    }
  }
  
  db.close();
}

async function checkPendingUploads() {
  const db = await openDB();
  const tx = db.transaction('uploadTasks', 'readonly');
  const store = tx.objectStore('uploadTasks');
  const keys = await new Promise((resolve) => {
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
  });
  await tx.done;
  if (keys.length > 0) {
    await processUploads(keys);
  }
  db.close();
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('uploads', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('uploadTasks');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getTask(db, key) {
  return new Promise((resolve) => {
    const tx = db.transaction('uploadTasks', 'readonly');
    const store = tx.objectStore('uploadTasks');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
  });
}

function deleteTask(db, key) {
  return new Promise((resolve) => {
    const tx = db.transaction('uploadTasks', 'readwrite');
    const store = tx.objectStore('uploadTasks');
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    tx.oncomplete = () => db.close();
  });
}*/