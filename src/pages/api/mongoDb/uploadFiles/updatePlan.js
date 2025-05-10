import clientPromise from '../../connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido',
    });
  }

  const { email, planName, paymentType, amountPaid, availableGB, subscriptionId } = req.body;

  // Validaciones básicas
  if (!email || !planName || !paymentType || !amountPaid || !availableGB || !subscriptionId) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos en la solicitud',
    });
  }

  if (isNaN(amountPaid)) {
    return res.status(400).json({
      success: false,
      message: 'El monto pagado debe ser un número válido',
    });
  }

  // Sanitizar el email
  const userKey = email.toLowerCase().replace(/[@.]/g, '_');

  try {
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // Actualizar solo el plan del usuario
    const updateResult = await collection.updateOne(
      { _id: 'globalMemories' },
      {
        $set: {
          [`${userKey}.userInformation.plan`]: {
            planName,
            paymentType,
            amountPaid: parseFloat(amountPaid),
            availableGB: parseInt(availableGB),
            subscriptionId,
            activationDate: new Date().toISOString(),
            lastDatePayment: new Date().toISOString(),
            statusPlan: 'activated'
          },
          [`${userKey}.userInformation.lastLogin`]: new Date().toISOString()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o ningún cambio realizado'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Plan actualizado exitosamente',
      updatedFields: {
        planName,
        paymentType,
        amountPaid,
        availableGB
      }
    });

  } catch (error) {
    console.error('Error al actualizar el plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}