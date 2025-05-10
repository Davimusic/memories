export const config = {
    api: {
      bodyParser: true,
    },
  };
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
  
    const event = req.body;
    console.log('Evento recibido de PayPal:', event);
  
    try {
      const subscriptionId = event.resource?.id;
      // Corregido: PayPal no usa "subscriber.payer_id" en suscripciones, el user ID deberías mapearlo al crear la suscripción
      const userId = event.resource?.custom_id || 'undefined'; // Usa custom_id que deberías enviar al crear la suscripción
      const eventType = event.event_type;
  
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.CREATED':
          console.log(`Suscripción creada: ${subscriptionId}`);
          await updateDatabase(subscriptionId, userId, 'CREATED');
          break;
  
        case 'BILLING.PLAN.ACTIVATED':
          console.log(`Suscripción activada: ${subscriptionId}`);
          await updateDatabase(subscriptionId, userId, 'ACTIVE');
          break;
  
        case 'BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED':
          console.log(`Pago exitoso para suscripción: ${subscriptionId}`);
          await updateDatabase(subscriptionId, userId, 'PAID');
          break;
  
        case 'BILLING.SUBSCRIPTION.UPDATED':
          console.log(`Suscripción actualizada: ${subscriptionId}`);
          await updateDatabase(subscriptionId, userId, 'UPDATED');
          break;
  
        default:
          console.log(`Evento no manejado: ${eventType}`);
      }
  
      res.status(200).json({ message: 'Evento procesado correctamente' });
    } catch (error) {
      console.error('Error al procesar el evento:', error);
      res.status(500).json({ error: 'Error al procesar el evento' });
    }
  }
  
  // Función corregida (sin referencia a 'req')
  async function updateDatabase(subscriptionId, userId, status) {
    console.log(`Actualizando DB: Suscripción ${subscriptionId}, Usuario ${userId}, Estado ${status}`);
    
    // Ejemplo de actualización real con Prisma (ajusta según tu ORM/DB):
    /*
    try {
      await prisma.subscription.update({
        where: { paypalId: subscriptionId },
        data: { status: status },
      });
    } catch (error) {
      console.error('Error actualizando DB:', error);
      throw error; // Propaga el error para manejarlo en el handler
    }
    */
}