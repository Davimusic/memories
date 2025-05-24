const admin = require('../../../lib/firebaseAdmin');
//const clientPromise = require('./connectToDatabase');
//const crypto = require('crypto');
import clientPromise from './connectToDatabase';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, email, authType } = req.body;
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token || !uid || !email) {
    return res.status(401).json({ error: 'No token, UID, or email provided' });
  }

  try {
    // Verificar el token JWT
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Verificar que el email del token coincide con el enviado
    if (decodedToken.email !== email) {
      return res.status(403).json({ error: 'Email mismatch' });
    }

    // Sanitizar el email para generar la llave principal
    const userKey = email.toLowerCase().replace(/[@.]/g, '_');
    // Generar un id único usando SHA-256 a partir del correo
    const userIdHash = crypto.createHash('sha256').update(email).digest('hex');

    const now = new Date();

    // Conexión a la base de datos
    const client = await clientPromise;
    const db = client.db('goodMemories'); // Asegúrate de que el nombre de la DB sea correcto
    const collection = db.collection('MemoriesCollection'); // Asegúrate de que la colección sea correcta

    // Encontrar el documento global
    const filter = { _id: 'globalMemories' };
    const globalDoc = await collection.findOne(filter);

    let userData = {};
    let action = '';

    // Verificar si el usuario existe
    if (globalDoc && globalDoc[userKey] && globalDoc[userKey].userInformation) {
      // Usuario existente: actualizar lastLogin
      userData = {
        ...globalDoc[userKey].userInformation,
        lastLogin: now.toISOString(),
      };
      action = 'update';
    } else {
      // Usuario nuevo: crear userInformation con datos predeterminados
      userData = {
        id: userIdHash,
        authType: authType || null,
        createdAt: now.toISOString(),
        lastLogin: now.toISOString(),
        plan: {
          planName: 'free', // Valor predeterminado
          availableGB: 3,   // Valor predeterminado
          paymentType: 'monthly', // Valor predeterminado
          amountPaid: 0,    // Valor predeterminado
        },
      };
      action = 'create';
    }

    // Actualizar o insertar el objeto del usuario
    const updateResult = await collection.updateOne(
      filter,
      { $set: { [`${userKey}.userInformation`]: userData } },
      { upsert: true }
    );

    if (!updateResult.acknowledged) {
      throw new Error('Error updating database');
    }

    console.log(
      `Usuario ${action === 'update' ? 'actualizado' : 'creado'} con key ${userKey}:`,
      userData
    );

    // Responder con éxito
    return res.status(action === 'update' ? 200 : 201).json({
      success: true,
      message: action === 'update' ? 'User successfully updated.' : 'User created successfully.',
      myLikes: [], // Mantener compatibilidad con el cliente
    });
  } catch (error) {
    console.error('Error in auth handler:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}














/*const admin = require('../../../lib/firebaseAdmin');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, authType } = req.body;
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token || !uid) {
    return res.status(401).json({ error: 'No token or UID provided' });
  }

  try {
    // Verificar el token JWT
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Asegurarse de que el UID del token coincide con el enviado
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // El correo está disponible en decodedToken.email
    const email = decodedToken.email;

    // Aquí puedes realizar las acciones necesarias con el UID y el authType
    // Por ejemplo, guardar el usuario en la base de datos o realizar otras operaciones
    // Simulando tu lógica existente
    let message = '';
    if (authType === 'signIn') {
      // Lógica para registrar un nuevo usuario
      message = 'User registered successfully';
    } else if (authType === 'login' || authType === 'google') {
      // Lógica para login existente
      message = 'User logged in successfully';
    }

    // Responder con éxito
    return res.status(200).json({
      success: true,
      message,
      myLikes: [], // Ajusta según tu lógica
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ error: 'Invalid token', details: error.message });
  }
}*/