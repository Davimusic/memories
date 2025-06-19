import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from './connectToDatabase'; 

// Páginas estáticas del sitio
const fetchStaticPages = () => {
  return [
    { loc: '/', lastModified: new Date().toISOString(), changefreq: 'monthly', priority: 0.7 },
  ];
};

// Consulta a la base de datos para obtener artículos
const fetchArticlesFromDB = async () => {
  try {
    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('dynamicArticles');

    // Obtener todos los artículos, seleccionando solo slug y updatedAt
    const articles = await collection
      .find({})
      .project({ slug: 1, updatedAt: 1, _id: 0 })
      .toArray();

    // Mapear los datos al formato requerido
    return articles.map((article) => ({
      slug: article.slug,
      lastModified: article.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching articles from DB:', {
      message: error.message,
      stack: error.stack,
    });
    return [];
  }
};

// Handler de la API
export default async function handler(req, res) {
  try {
    // Configurar la cabecera para XML
    res.setHeader('Content-Type', 'application/xml');

    // Obtener artículos dinámicos
    const articles = await fetchArticlesFromDB();

    // Obtener páginas estáticas
    const staticPages = fetchStaticPages();

    // Combinar páginas
    const allPages = [
      ...staticPages,
      ...articles.map((article) => ({
        loc: `/articles/${article.slug}`,
        lastModified: article.lastModified,
        changefreq: 'weekly',
        priority: 0.8,
      })),
    ];

    // Generar el sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
    .map(
      (page) => `
    <url>
      <loc>https://goodmemories.com${page.loc}</loc>
      <lastmod>${page.lastModified}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`
    )
    .join('')}
</urlset>`;

    // Enviar respuesta
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).send('Error generating sitemap');
  }
}