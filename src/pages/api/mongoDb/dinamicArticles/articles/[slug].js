// pages/api/articles/[slug].js
import clientPromise from '../../../connectToDatabase'; // Ajusta la ruta según tu estructura

export default async function handler(req, res) {
  try {
    // 1. Validar método HTTP (solo GET)
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido',
      });
    }

    // 2. Extraer el slug de los parámetros de la URL
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un slug',
      });
    }

    // 3. Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('dynamicArticles');

    // 4. Buscar el artículo por slug
    const article = await collection.findOne({ slug });
    if (!article) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un artículo con el slug '${slug}'`,
      });
    }

    // 5. Devolver el artículo
    return res.status(200).json({
      success: true,
      data: {
        _id: article._id.toString(),
        slug: article.slug,
        title: article.title,
        seo: article.seo,
        breadcrumbs: article.breadcrumbs,
        content: article.content,
        updatedAt: article.updatedAt.toISOString(),
        createdAt: article.createdAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error en el endpoint articles/[slug]:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contacta con soporte',
    });
  }
}