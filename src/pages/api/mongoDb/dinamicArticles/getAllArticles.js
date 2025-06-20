import clientPromise from '../../connectToDatabase'; // Adjust the path to your MongoDB connection utility

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido. Usa GET.',
      });
    }

    const { slug } = req.query;
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('dynamicArticles');

    if (slug) {
      // Handle single article retrieval
      const article = await collection.findOne({ slug });

      if (!article) {
        return res.status(404).json({
          success: false,
          message: `No se encontró un artículo con el slug '${slug}'.`,
        });
      }

      const formattedArticle = {
        ...article,
        _id: article._id.toString(),
        updatedAt: article.updatedAt.toISOString(),
        createdAt: article.createdAt.toISOString(),
      };

      return res.status(200).json({
        success: true,
        message: 'Artículo obtenido exitosamente',
        data: formattedArticle,
      });
    } else {
      // Handle retrieval of all articles
      const articles = await collection.find({}).toArray();

      const formattedArticles = articles.map((article) => ({
        ...article,
        _id: article._id.toString(),
        updatedAt: article.updatedAt.toISOString(),
        createdAt: article.createdAt.toISOString(),
      }));

      return res.status(200).json({
        success: true,
        message: 'Artículos obtenidos exitosamente',
        data: formattedArticles,
      });
    }
  } catch (error) {
    console.error('Error en el endpoint articles/[slug]:', {
      message: error.message,
      stack: error.stack,
      slug: req.query.slug,
    });

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Contacta con soporte',
    });
  }
}