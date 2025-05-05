// app/api/campaigns/route.js

import SibApiV3Sdk from 'sib-api-v3-sdk';

export async function POST(req) {
  try {
    // Extrae los datos del request
    const { name, subject, sender, htmlContent, recipients } = await req.json();

    // Configura el cliente con la API key de Brevo
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    defaultClient.authentications['api-key'].apiKey = process.env.NEXT_PUBLIC_API_BREVO;

    // Instancia la API de campañas y crea el objeto de campaña
    const apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
    const emailCampaign = new SibApiV3Sdk.CreateEmailCampaign();

    // Configura los parámetros de la campaña
    emailCampaign.name = name || "Campaña predeterminada";
    emailCampaign.subject = subject || "Asunto predeterminado";
    emailCampaign.sender =
      sender || {
        name: "Nombre Remitente",
        // Aquí se usa la variable de entorno SMTP como parte del correo de envío.
        // Nota: Es probable que necesites ajustar el valor para obtener un email válido.
        //email: process.env.NEXT_PUBLIC_SMTP_BREVO + "@tudominio.com"
        email: "test@tudominio.com"
      };
    emailCampaign.type = "classic";
    emailCampaign.htmlContent = htmlContent;
    emailCampaign.recipients = recipients; // Ejemplo: { listIds: [2] }
    // Programa el envío para el momento actual (envío inmediato)
    emailCampaign.scheduledAt = new Date().toISOString();

    // Llama a la API para crear la campaña
    const data = await apiInstance.createEmailCampaign(emailCampaign);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error al crear la campaña:", error);
    return new Response(
      JSON.stringify({ error: "Error al crear la campaña", details: error.message }),
      { status: 500 }
    );
  }
}
