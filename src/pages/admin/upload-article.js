// pages/admin/upload-article.js... se usa
import { useState } from 'react';
import Head from 'next/head';

export default function UploadArticle() {
  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    // Validar que el input no esté vacío
    if (!jsonInput.trim()) {
      setMessage('Por favor, ingresa un objeto JSON válido.');
      setIsLoading(false);
      return;
    }

    // Validar que el input sea un JSON válido
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonInput);
    } catch (error) {
      setMessage('Error: El JSON no es válido. Revisa la sintaxis.');
      setIsLoading(false);
      return;
    }

    // Validar campos requeridos
    if (!parsedJson.slug || !parsedJson.title || !parsedJson.seo || !parsedJson.content || !parsedJson.updatedAt) {
      setMessage('Error: El JSON debe incluir los campos "slug", "title", "seo", "content" y "updatedAt".');
      setIsLoading(false);
      return;
    }

    // Enviar al endpoint
    try {
      const response = await fetch('/api/mongoDb/dinamicArticles/upload-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleJson: jsonInput }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Éxito: ${data.message}`);
        setJsonInput(''); // Limpiar el formulario
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage('Error: No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Head>
        <title>Subir Artículo | GoodMemories</title>
      </Head>
      <h1>Subir Artículo</h1>
      <p>Pega el objeto JSON del artículo en el área de texto y haz clic en "Subir".</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{
  "slug": "memory-formation",
  "title": "Cómo se crean los recuerdos según la ciencia",
  "seo": {
    "description": "Explora cómo se forman los recuerdos...",
    "keywords": "memoria, recuerdos, neurociencia",
    "tags": "memoria, ciencia, neurociencia"
  },
  "breadcrumbs": [
    { "label": "Home", "path": "/" },
    { "label": "Artículos", "path": "/articles" },
    { "label": "Cómo se crean los recuerdos", "path": "/articles/memory-formation" }
  ],
  "content": [...],
  "updatedAt": "2025-06-18T12:00:00Z"
}'
          rows={20}
          cols={80}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />
        <br />
        <button type="submit" disabled={isLoading} style={{ marginTop: '10px', padding: '10px 20px' }}>
          {isLoading ? 'Subiendo...' : 'Subir Artículo'}
        </button>
      </form>
      {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}