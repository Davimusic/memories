import { useState } from 'react';

export default function BrevoTester() {
  const [contactResponse, setContactResponse] = useState(null);
  const [campaignResponse, setCampaignResponse] = useState(null);
  const [error, setError] = useState(null);

  // Función para crear un contacto
  const handleCreateContact = async () => {
    setError(null);
    setContactResponse(null);
    try {
      const response = await fetch('/api/brevo/contacts', {  
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: "davipianof@gmail.com",
          attributes: { FIRSTNAME: "Davi" },
          listIds: [2]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al crear el contacto");
      }
      setContactResponse(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Función para crear una campaña
  const handleCreateCampaign = async () => {
    setError(null);
    setCampaignResponse(null);
    try {
      const response = await fetch('/api/brevo/campaigns', {  
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "Campaña de Hola Mundo via API",
          subject: "Hola Mundo - Un saludo personalizado",
          sender: { name: "Nombre Remitente", email: "mi-email@midominio.com" },
          htmlContent: `<html>
                          <body>
                            <h1>Hola Mundo!</h1>
                            <p>Este es un saludo personalizado.</p>
                          </body>
                        </html>`,
          recipients: { listIds: [2] }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al crear la campaña");
      }
      setCampaignResponse(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Prueba de integración con Brevo</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleCreateContact} style={{ marginRight: '10px', padding: '10px 20px' }}>
          Crear Contacto
        </button>
        <button onClick={handleCreateCampaign} style={{ padding: '10px 20px' }}>
          Crear Campaña
        </button>
      </div>
      {error && (
        <div style={{ marginBottom: '20px', color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {contactResponse && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Respuesta al crear el contacto:</h3>
          <pre>{JSON.stringify(contactResponse, null, 2)}</pre>
        </div>
      )}
      {campaignResponse && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Respuesta al crear la campaña:</h3>
          <pre>{JSON.stringify(campaignResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

