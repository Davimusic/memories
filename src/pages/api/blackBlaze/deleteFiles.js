const B2_APP_KEY_ID = process.env.NEXT_PUBLIC_B2_APP_KEY_ID;
const B2_APP_KEY = process.env.NEXT_PUBLIC_B2_APP_KEY;
const B2_BUCKET_ID = process.env.NEXT_PUBLIC_B2_BUCKET_ID;
const B2_BUCKET_NAME = process.env.NEXT_PUBLIC_B2_BUCKET_NAME;

/**
 * Función que solicita autorización a la API de B2.
 */
async function getB2Authorization() {
  const authString = Buffer.from(`${B2_APP_KEY_ID}:${B2_APP_KEY}`).toString("base64");
  const response = await fetch("https://api.backblaze.com/b2api/v2/b2_authorize_account", {
    method: "GET",
    headers: {
      Authorization: `Basic ${authString}`,
    },
  });
  if (!response.ok) {
    throw new Error("B2 authorization error: " + response.statusText);
  }
  return response.json();
}

/**
 * Función para obtener detalles de un archivo a partir de su storage_path.
 * Se utiliza para obtener el fileId necesario para la eliminación.
 */
async function getFileInfo(b2Auth, storagePath) {
  const listResponse = await fetch(`${b2Auth.apiUrl}/b2api/v2/b2_list_file_names`, {
    method: "POST",
    headers: {
      Authorization: b2Auth.authorizationToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bucketId: B2_BUCKET_ID,
      prefix: storagePath,
      maxFileCount: 1,
    }),
  });
  if (!listResponse.ok) {
    throw new Error("Error al listar archivos para obtener info: " + listResponse.statusText);
  }
  const listData = await listResponse.json();
  if (!listData.files || listData.files.length === 0) {
    throw new Error("Archivo no encontrado: " + storagePath);
  }
  return listData.files[0];
}

/**
 * Función que elimina un archivo utilizando la API de B2.
 * Requiere fileName y fileId.
 */
async function deleteFile(b2Auth, fileName, fileId) {
  const response = await fetch(`${b2Auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
    method: "POST",
    headers: {
      Authorization: b2Auth.authorizationToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: fileName,
      fileId: fileId,
    }),
  });
  if (!response.ok) {
    throw new Error("Error al eliminar el archivo " + fileName + ": " + response.statusText);
  }
  return response.json();
}

/**
 * Endpoint para eliminar archivos en BackBlaze.
 * Recibe en el cuerpo de la solicitud un objeto con la siguiente estructura:
 * {
 *   "filesToDelete": {
 *       "photos": [...],
 *       "videos": [...],
 *       "audios": [...]
 *   }
 * }
 */
export default async function handler(req, res) {
  // Solo aceptamos el método POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Extraemos "filesToDelete" del cuerpo de la solicitud
  const { filesToDelete } = req.body;
  if (!filesToDelete) {
    return res.status(400).json({ error: "No se enviaron archivos para eliminar." });
  }

  // Desestructuramos las categorías
  const { photos, videos, audios } = filesToDelete;
  if (
    (!photos || photos.length === 0) &&
    (!videos || videos.length === 0) &&
    (!audios || audios.length === 0)
  ) {
    return res.status(400).json({
      error:
        "Se debe proporcionar al menos una de las categorías con archivos: photos, videos o audios.",
    });
  }

  try {
    // Obtenemos autorización con B2.
    const b2Auth = await getB2Authorization();
    const deletionResults = [];

    // Función auxiliar para procesar la eliminación de archivos en cada categoría.
    async function processFiles(files, category) {
      for (const file of files) {
        try {
          // Se usa "storage_path" para buscar el archivo en B2 y obtener el fileId.
          const storagePath = file.storage_path;
          const fileInfo = await getFileInfo(b2Auth, storagePath);
          await deleteFile(b2Auth, fileInfo.fileName, fileInfo.fileId);
          deletionResults.push({ category, storagePath, status: "deleted" });
        } catch (error) {
          console.error(`Error eliminando archivo en ${category}:`, error);
          deletionResults.push({
            category,
            storagePath: file.storage_path,
            status: "error",
            error: error.message,
          });
        }
      }
    }

    if (photos && Array.isArray(photos) && photos.length > 0) {
      await processFiles(photos, "photos");
    }
    if (videos && Array.isArray(videos) && videos.length > 0) {
      await processFiles(videos, "videos");
    }
    if (audios && Array.isArray(audios) && audios.length > 0) {
      await processFiles(audios, "audios");
    }

    return res.status(200).json({
      success: true,
      results: deletionResults,
    });
  } catch (error) {
    console.error("Error en el endpoint de eliminación:", error);
    return res.status(500).json({
      error: "Error del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
