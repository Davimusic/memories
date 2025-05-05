// app/api/contacts/route.js

import SibApiV3Sdk from 'sib-api-v3-sdk';

export async function POST(req) {
  try {
    // Extrae los datos del request
    const { email, attributes, listIds } = await req.json();

    // Configura el cliente de Brevo usando la API key de tus variables de entorno
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    defaultClient.authentications['api-key'].apiKey = process.env.NEXT_PUBLIC_API_BREVO;

    // Instancia el API de contactos y crea el objeto de contacto
    const contactsApi = new SibApiV3Sdk.ContactsApi();
    const createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = email;
    createContact.attributes = attributes;
    createContact.listIds = listIds;

    // Llama a la API para crear el contacto
    const data = await contactsApi.createContact(createContact);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error al crear el contacto:", error);
    return new Response(
      JSON.stringify({ error: "Error al crear el contacto", details: error.message }),
      { status: 500 }
    );
  }
}
