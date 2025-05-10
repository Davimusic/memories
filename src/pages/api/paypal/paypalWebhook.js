import clientPromise from '../connectToDatabase'

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
        console.log(`[Suscripción ACTIVADA] ID: ${subscriptionId}, Usuario: ${userId}`);
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
        await recordPayment(subscriptionId, event.resource.amount, 'COMPLETED');
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        console.log(`[PAGO RECURRENTE FALLIDO] ID: ${subscriptionId}, Usuario: ${userId}`);
        await recordPayment(subscriptionId, event.resource.amount, 'FAILED');
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
  //console.log(`Actualizando suscripción: ${subscriptionId} -> ${status}`);
  // Ejemplo con Prisma:
  // await prisma.subscription.update({
  //   where: { paypalSubscriptionId: subscriptionId },
  //   data: { status: status, userId: userId },
  // });
}

// Función para registrar pagos (completados/fallidos)
async function recordPayment(subscriptionId, amount, status) {
  console.log(`Registrando pago: ${subscriptionId} - ${amount} -> ${status}`);
  
  if (status === 'COMPLETED') {
    try {
      const client = await clientPromise;
      const db = client.db('goodMemories');
      const collection = db.collection('MemoriesCollection');

      // Primero buscamos el usuario que tiene esta subscriptionId
      const userDoc = await collection.findOne({
        "_id": "globalMemories",
        [`${/.*/}.userInformation.plan.subscriptionId`]: subscriptionId
      });

      if (!userDoc) {
        console.error('No se encontró usuario con subscriptionId:', subscriptionId);
        return;
      }

      // Encontramos el userKey (email sanitizado) que contiene esta subscriptionId
      let userKey = null;
      for (const [key, value] of Object.entries(userDoc)) {
        if (key !== '_id' && key !== 'lastUpdated' && 
            value?.userInformation?.plan?.subscriptionId === subscriptionId) {
          userKey = key;
          break;
        }
      }

      if (!userKey) {
        console.error('No se encontró userKey para subscriptionId:', subscriptionId);
        return;
      }

      // Actualizamos lastDatePayment y statusPlan
      const updateResult = await collection.updateOne(
        { 
          "_id": "globalMemories",
          [`${userKey}.userInformation.plan.subscriptionId`]: subscriptionId
        },
        {
          $set: {
            [`${userKey}.userInformation.plan.lastDatePayment`]: new Date().toISOString(),
            [`${userKey}.userInformation.plan.statusPlan`]: 'activated'
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        console.error('No se pudo actualizar el usuario con subscriptionId:', subscriptionId);
      } else {
        console.log('Pago registrado exitosamente para:', userKey);
      }

    } catch (error) {
      console.error('Error al registrar pago:', error);
      throw error;
    }
  }
}