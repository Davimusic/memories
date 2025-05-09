// Archivo: /pages/api/confirm-subscription.js

import { Buffer } from "buffer";

export default async function handler(req, res) {
  // Solo se permiten solicitudes POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  // Extraer valores desde el body
  const { subscriptionId, totalToPay, billingCycle } = req.body;

  // Validar que se hayan enviado todos los parámetros requeridos
  if (!subscriptionId || !totalToPay || !billingCycle) {
    return res.status(400).json({
      error:
        "Faltan parámetros. Se requieren subscriptionId, totalToPay y billingCycle."
    });
  }

  try {
    // Obtener las credenciales desde las variables de entorno
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    const secret = process.env.NEXT_PUBLIC_SECRET_KEY_1;
    if (!clientId || !secret) {
      throw new Error("Credenciales de PayPal no configuradas correctamente");
    }

    // Obtener token de acceso desde PayPal Sandbox
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const tokenResponse = await fetch(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`
        },
        body: "grant_type=client_credentials"
      }
    );
    if (!tokenResponse.ok) {
      throw new Error("Error al obtener el token de acceso de PayPal");
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Consultar los detalles de la suscripción usando el subscriptionId
    const subscriptionResponse = await fetch(
      `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    if (!subscriptionResponse.ok) {
      throw new Error("Error al obtener los detalles de la suscripción");
    }
    const subscriptionData = await subscriptionResponse.json();

    // Validar que la suscripción esté activa
    if (subscriptionData.status !== "ACTIVE") {
      return res.status(400).json({
        error: "La suscripción no está activa",
        details: subscriptionData
      });
    }

    /*  
      Aquí puedes incorporar lógica adicional para:
      
      - Validar que el monto pactado en la suscripción coincida con `totalToPay`.  
        Nota: Dependiendo de la respuesta de PayPal, en algunos casos el detalle del monto no viene explícito
        si aún no se ha procesado un pago, por lo que esta validación podría requerir lógica adicional o funcionar 
        como un registro interno.
      
      - Confirmar que la modalidad (ciclo de facturación) recibida (billingCycle) corresponda con lo que se ha configurado en el plan.
        Por ejemplo, si `billingCycle` es `"monthly"`, podrías comparar si el `plan_id` o algún otro campo indica un ciclo mensual.
      
      Como este endpoint se usará para actualizar el registro del usuario, el siguiente paso es grabar la información
      en tu base de datos o sistema de gestión.
      
      Ejemplo pseudo-código:
      // await actualizarSuscripcionUsuario(userId, {
      //    subscriptionId,
      //    totalToPay,
      //    billingCycle,
      //    subscriptionData
      // });
    */

    // Responder con éxito y enviando los datos de la suscripción junto al monto y ciclo recibido
    return res.status(200).json({
      message:
        "Suscripción confirmada exitosamente con pagos recurrentes dinámicos.",
      subscription: subscriptionData,
      totalToPay,
      billingCycle
    });
  } catch (error) {
    console.error("Error en confirm-subscription:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error.message
    });
  }
}
