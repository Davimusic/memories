// pages/api/upload-article.js
import clientPromise from '../../connectToDatabase'; // Ajusta la ruta según tu configuración
import { ObjectId } from 'mongodb';

// pages/api/upload-article.

export default async function handler(req, res) {
  try {
    // 1. Validar método HTTP (solo POST)
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido',
      });
    }

    // 2. Extraer el JSON string del cuerpo de la solicitud
    const { articleJson } = req.body;
    if (!articleJson || typeof articleJson !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un objeto JSON válido como string',
      });
    }

    // 3. Parsear el JSON string
    let articleData;
    try {
      articleData = JSON.parse(articleJson);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'El JSON proporcionado no es válido',
      });
    }

    // 4. Validar campos requeridos
    const requiredFields = ['slug', 'title', 'seo', 'content', 'updatedAt'];
    const missingFields = requiredFields.filter((field) => !articleData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan los siguientes campos: ${missingFields.join(', ')}`,
      });
    }

    // 5. Validar formato de updatedAt
    if (!isValidDate(articleData.updatedAt)) {
      return res.status(400).json({
        success: false,
        message: 'El campo updatedAt debe ser una fecha válida (e.g., 2025-06-18T12:00:00Z)',
      });
    }

    // 6. Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('dynamicArticles');

    // 7. Validar unicidad del slug
    const existingArticle = await collection.findOne({ slug: articleData.slug });
    if (existingArticle) {
      return res.status(409).json({
        success: false,
        message: `El slug '${articleData.slug}' ya existe en la base de datos`,
      });
    }

    // 8. Preparar el documento para insertar
    const now = new Date();
    const document = {
      slug: articleData.slug,
      title: articleData.title,
      seo: articleData.seo,
      breadcrumbs: articleData.breadcrumbs || [],
      content: articleData.content,
      updatedAt: new Date(articleData.updatedAt), // Convertir a objeto Date
      createdAt: now,
    };

    // 9. Insertar el documento
    const result = await collection.insertOne(document);

    // 10. Verificar resultado
    if (!result.acknowledged) {
      return res.status(500).json({
        success: false,
        message: 'No se pudo insertar el documento en la base de datos',
      });
    }

    console.log(`Artículo insertado con slug: ${articleData.slug}`, JSON.stringify(document, null, 2));

    // 11. Devolver respuesta de éxito
    return res.status(201).json({
      success: true,
      message: 'Artículo insertado correctamente',
      articleId: result.insertedId,
    });

  } catch (error) {
    console.error('Error en el endpoint upload-article:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contacta con soporte',
    });
  }
}

// Función auxiliar para validar fechas
function isValidDate(dateString) {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  } catch {
    return false;
  }
}