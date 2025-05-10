// Este recibe las notificaciones de PayPal, relacionadas con los pagos recurrentes

export const config = {
    api: {
      bodyParser: true, // Se asegura de que el cuerpo se parsea como JSON
    },
  };
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
  
    const event = req.body;
    console.log('Evento recibido de PayPal:', event);
  
    try {
      const subscriptionId = event.resource?.id; // Identificador único de la suscripción
      const userId = event.resource?.subscriber?.payer_id; // Relacionar con el usuario si es necesario
      const eventType = event.event_type;
  
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.CREATED':
          console.log(`Suscripción creada: ${subscriptionId}`);
          await updateDatabase(subscriptionId, userId, 'CREATED');
          break;
  
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          console.log(`Suscripción activada: ${subscriptionId}`);
          await updateDatabase(subscriptionId, userId, 'ACTIVE');
          break;
  
        case 'BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED':
          console.log(`Pago exitoso para suscripción: ${subscriptionId}`);
          await updateDatabase(subscriptionId, userId, 'PAID');
          break;
  
        // ...otros casos similares
  
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
  
  // Función simulada para actualizar la base de datos
  async function updateDatabase(subscriptionId, userId, status) {
    console.log(`Actualizando DB: Suscripción ${subscriptionId}, Usuario ${userId}, Estado ${status}`);
    // Aquí deberías realizar la actualización real de la base de datos.
    // Puede ser una llamada a un ORM, un query directo, etc.
  }
  