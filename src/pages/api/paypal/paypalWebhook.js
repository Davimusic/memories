//este recibe las notificaciones de paypal, los que tiene que ver con los pagos recurrentes



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
          // Registra la suscripción en tu DB y asóciala al usuario
          await updateDatabase(subscriptionId, userId, 'CREATED');
          break;
  
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          console.log(`Suscripción activada: ${subscriptionId}`);
          // Marca la suscripción como activa en la DB
          await updateDatabase(subscriptionId, userId, 'ACTIVE');
          break;
  
        case 'BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED':
          console.log(`Pago exitoso para suscripción: ${subscriptionId}`);
          // Actualiza la fecha de pago y marca la suscripción como al día
          await updateDatabase(subscriptionId, userId, 'PAID');
          break;
  
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
          console.log(`Pago fallido para suscripción: ${subscriptionId}`);
          // Registra el fallo y notifica al usuario
          await updateDatabase(subscriptionId, userId, 'PAYMENT_FAILED');
          break;
  
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          console.log(`Suscripción suspendida: ${subscriptionId}`);
          // Actualiza el estado de la suscripción en la DB
          await updateDatabase(subscriptionId, userId, 'SUSPENDED');
          break;
  
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          console.log(`Suscripción cancelada: ${subscriptionId}`);
          // Elimina o marca la suscripción como inactiva en la DB
          await updateDatabase(subscriptionId, userId, 'CANCELLED');
          break;
  
        case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
          console.log(`Suscripción reactivada: ${subscriptionId}`);
          // Reactiva la suscripción en tu DB
          await updateDatabase(subscriptionId, userId, 'REACTIVATED');
          break;
  
        case 'BILLING.SUBSCRIPTION.EXPIRED':
          console.log(`Suscripción expirada: ${subscriptionId}`);
          // Registra que la suscripción ha llegado a su fin
          await updateDatabase(subscriptionId, userId, 'EXPIRED');
          break;
  
        case 'BILLING.SUBSCRIPTION.UPDATED':
          console.log(`Suscripción actualizada: ${subscriptionId}`);
          // Puede incluir cambios en el plan, pagos, etc.
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
      }
    
      // Recibir la información del webhook o de cualquier otro endpoint
      const payload = req.body;
    
      // Imprime la información en la consola
      console.log("updateDatabase - Información recibida:", payload);
    
      // Retorna la misma información en la respuesta JSON
      return res.status(200).json({
        message: "Información recibida y registrada en consola",
        data: payload,
      });
  }
  