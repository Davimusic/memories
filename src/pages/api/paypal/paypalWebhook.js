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
  console.log('Evento recibido de PayPal:', JSON.stringify(event, null, 2)); // Mejor logging

  try {
    const subscriptionId = event.resource?.id;
    // IMPORTANTE: Usa custom_id que enviaste al crear la suscripción (no viene en el webhook)
    const userId = event.resource?.custom_id || 'unknown'; 
    const eventType = event.event_type;

    switch (eventType) {
      // --- Eventos de suscripción ---
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        console.log(`[Suscripción ACTIVADA] ID: ${subscriptionId}, Usuario: ${userId}, nombre: ${event.resource.shipping_address.name.full_name}`);
        await updateDatabase(subscriptionId, userId, 'ACTIVE');
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        console.log(`[Suscripción CANCELADA] ID: ${subscriptionId}, Usuario: ${userId}`);
        await updateDatabase(subscriptionId, userId, 'CANCELLED');
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        console.log(`[Suscripción EXPIRADA] ID: ${subscriptionId}, Usuario: ${userId}`);
        await updateDatabase(subscriptionId, userId, 'EXPIRED');
        break;

      // --- Eventos de pagos recurrentes ---
      case 'PAYMENT.SALE.COMPLETED':
        console.log(`[PAGO RECURRENTE EXITOSO] ID: ${subscriptionId}, Usuario: ${userId}`);
        await recordPayment(subscriptionId, userId, event.resource.amount, 'COMPLETED');
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        console.log(`[PAGO RECURRENTE FALLIDO] ID: ${subscriptionId}, Usuario: ${userId}`);
        await recordPayment(subscriptionId, userId, event.resource.amount, 'FAILED');
        break;

      // --- Eventos opcionales para debugging ---
      case 'BILLING.SUBSCRIPTION.CREATED':
        console.log(`[Suscripción CREADA] ID: ${subscriptionId}`);
        // No actualizamos DB aún (esperamos ACTIVATED)
        break;

      default:
        console.warn(`[EVENTO NO MANEJADO] Tipo: ${eventType}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error crítico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Función para actualizar estado de suscripción
async function updateDatabase(subscriptionId, userId, status) {
  console.log(`Actualizando suscripción: ${subscriptionId} -> ${status}`);
  // Ejemplo con Prisma:
  // await prisma.subscription.update({
  //   where: { paypalSubscriptionId: subscriptionId },
  //   data: { status: status, userId: userId },
  // });
}

// Función para registrar pagos (completados/fallidos)
async function recordPayment(subscriptionId, userId, amount, status) {
  console.log(`Registrando pago: ${subscriptionId} - ${amount} -> ${status}`);
  // Ejemplo:
  // await prisma.payment.create({
  //   data: {
  //     subscriptionId: subscriptionId,
  //     userId: userId,
  //     amount: amount,
  //     status: status,
  //     date: new Date()
  //   }
  // });
}