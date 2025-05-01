// pages/api/listMemories.js

// Nota: En producción utiliza variables de entorno para estas credenciales.
const B2_APP_KEY_ID = process.env.NEXT_PUBLIC_B2_APP_KEY_ID;
const B2_APP_KEY = process.env.NEXT_PUBLIC_B2_APP_KEY;
const B2_BUCKET_ID = process.env.NEXT_PUBLIC_B2_BUCKET_ID;
const B2_BUCKET_NAME = process.env.NEXT_PUBLIC_B2_BUCKET_NAME;

/**
 * Función que solicita autorización a la API de B2.
 */
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

/**
 * Función que obtiene la URL dinámica de descarga para un archivo privado.
 */
async function getDownloadUrl(fileName, b2Auth) {
  const downloadAuthResponse = await fetch(`${b2Auth.apiUrl}/b2api/v2/b2_get_download_authorization`, {
    method: 'POST',
    headers: {
      'Authorization': b2Auth.authorizationToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketId: B2_BUCKET_ID,
      fileNamePrefix: fileName,
      validDurationInSeconds: 3600, // URL válida por 1 hora
    }),
  });
  if (!downloadAuthResponse.ok) {
    throw new Error('Error al obtener la autorización de descarga: ' + downloadAuthResponse.statusText);
  }
  const downloadData = await downloadAuthResponse.json();
  return `${b2Auth.downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURIComponent(fileName)}?Authorization=${downloadData.authorizationToken}`;
}

/**
 * Endpoint para listar archivos agrupados por el nombre del recuerdo.
 * Se espera que la estructura interna de los archivos sea:
 * user_uploads/<correo_transformado>/<nombreRecuerdo>/<tipoArchivo>/<timestamp>_<nombreOriginal>
 *
 * Si se envía el query parameter "memoryTitle", se listarán únicamente los archivos 
 * correspondientes al recuerdo indicado.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { correo, memoryTitle } = req.query;
  if (!correo) {
    return res
      .status(400)
      .json({ error: 'El parámetro "correo" es requerido.' });
  }

  try {
    // Transformamos el correo para que coincida con la ruta en Backblaze.
    const emailFolder = correo.replace(/[@.]/g, '_');
    // Si se especifica un memoryTitle, definimos el prefijo hasta ese subdirectorio.
    const prefix = memoryTitle
      ? `user_uploads/${emailFolder}/${memoryTitle}/`
      : `user_uploads/${emailFolder}/`;

    // Obtenemos autorización con B2.
    const b2Auth = await getB2Authorization();

    // Listamos archivos usando b2_list_file_names.
    const listResponse = await fetch(`${b2Auth.apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: {
        'Authorization': b2Auth.authorizationToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucketId: B2_BUCKET_ID,
        prefix: prefix,
        maxFileCount: 1000,
      }),
    });
    if (!listResponse.ok) {
      throw new Error(`Error al listar archivos: ${listResponse.statusText}`);
    }
    const listData = await listResponse.json();

    // Si se filtró por memoryTitle, procesamos directamente los archivos de ese recuerdo.
    if (memoryTitle) {
      const grouped = { fotos: [], videos: [], audios: [] };
      listData.files.forEach((file) => {
        // Se espera la estructura: user_uploads/<correo>/<memoryTitle>/<tipoArchivo>/...
        const parts = file.fileName.split("/");
        if (parts.length < 4) return;
        let fileType = parts[3];
        if (fileType !== "audios" && fileType !== "videos") {
          fileType = "fotos";
        }
        grouped[fileType].push({
          fileName: file.fileName,
          fileId: file.fileId,
          size: file.contentLength,
        });
      });

      // Generar la URL dinámica para cada archivo.
      for (const category in grouped) {
        grouped[category] = await Promise.all(
          grouped[category].map(async (file) => {
            try {
              const url = await getDownloadUrl(file.fileName, b2Auth);
              return { ...file, url };
            } catch (error) {
              console.error("Error generando URL para", file.fileName, error);
              return { ...file, url: null };
            }
          })
        );
      }
      return res.status(200).json({
        success: true,
        memories: { [memoryTitle]: grouped },
      });
    } else {
      // De lo contrario, agrupamos por cada recuerdo
      const grouped = {};
      listData.files.forEach((file) => {
        // Se espera la estructura: user_uploads/<correo>/<memoryTitle>/<tipoArchivo>/...
        const parts = file.fileName.split("/");
        if (parts.length < 4) return;
        const memoryFromFile = parts[2];
        let fileType = parts[3];
        if (fileType !== "audios" && fileType !== "videos") {
          fileType = "fotos";
        }
        if (!grouped[memoryFromFile]) {
          grouped[memoryFromFile] = { fotos: [], videos: [], audios: [] };
        }
        grouped[memoryFromFile][fileType].push({
          fileName: file.fileName,
          fileId: file.fileId,
          size: file.contentLength,
        });
      });

      // Generar URLs dinámicas para cada archivo en cada recuerdo.
      for (const mem in grouped) {
        for (const category in grouped[mem]) {
          grouped[mem][category] = await Promise.all(
            grouped[mem][category].map(async (file) => {
              try {
                const url = await getDownloadUrl(file.fileName, b2Auth);
                return { ...file, url };
              } catch (error) {
                console.error("Error generando URL para", file.fileName, error);
                return { ...file, url: null };
              }
            })
          );
        }
      }

      // Transformamos el objeto agrupado en un arreglo.
      const memoriesArr = Object.keys(grouped).map((memoryKey) => ({
        [memoryKey]: grouped[memoryKey],
      }));

      return res.status(200).json({
        success: true,
        memories: memoriesArr,
      });
    }
  } catch (error) {
    console.error("Error listando archivos:", error);
    return res.status(500).json({
      error: "Server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
