/*import clientPromise from './connectToDatabase';
import admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handleUserAfterAuth(req, res) {
  // 1. Validate HTTP method (POST only)
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { email, authType } = req.body;

  // 2. Validate email presence
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  // 3. Generate a unique ID using SHA-256 from the email
  const userIdHash = crypto.createHash('sha256').update(email).digest('hex');

  const now = new Date();

  try {
    // 4. Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // 5. Check if user document exists
    const userDoc = await collection.findOne({ _id: userIdHash });

    let userData = {};
    let action = '';

    if (userDoc) {
      // Existing user: update lastLogin
      userData = {
        ...userDoc,
        lastLogin: now.toISOString(),
      };
      action = 'update';
    } else {
      // New user: create user data
      userData = {
        _id: userIdHash,
        email: email.toLowerCase(),
        authType: authType || null,
        createdAt: now.toISOString(),
        lastLogin: now.toISOString(),
        plan: {
          planName: req.body.planName || 'free',
          availableGB: req.body.availableGB || 3,
          paymentType: req.body.paymentType || 'monthly',
          amountPaid: req.body.amountPaid || 0,
        },
      };
      action = 'create';
    }

    // 6. Update or insert user document
    const updateResult = await collection.updateOne(
      { _id: userIdHash },
      { $set: userData },
      { upsert: true }
    );

    if (!updateResult.acknowledged) {
      throw new Error('Failed to update database.');
    }

    console.log(
      `User ${action === 'update' ? 'updated' : 'created'} with ID ${userIdHash}:`,
      userData
    );
    return res.status(action === 'update' ? 200 : 201).json({
      success: true,
      message:
        action === 'update'
          ? 'User successfully updated.'
          : 'User created successfully.',
      user: userData,
    });
  } catch (error) {
    console.error('Error handling user authentication:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message,
    });
  }
}*/

























import clientPromise from './connectToDatabase';
import admin from 'firebase-admin';
import crypto from 'crypto';

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handleUserAfterAuth(req, res) {
  // 1. Validar método HTTP (POST únicamente)
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido',
    });
  }

  const { email, authType } = req.body;

  // 2. Validar que se envíe el correo
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'El correo es obligatorio',
    });
  }

  // 3. Sanitizar el email para generar la llave principal.  
  // Ejemplo: "davipianof@gmail.com" → "davipianof_gmail_com"
  const userKey = email.toLowerCase().replace(/[@.]/g, '_');

  // 4. Generar un id único usando SHA‑256 a partir del correo
  const userIdHash = crypto.createHash('sha256').update(email).digest('hex');

  const now = new Date();

  try {
    // 5. Conexión a la DB (usando el cliente conectado)
    const client = await clientPromise;
    const db = client.db('goodMemories'); // Reemplaza por el nombre de tu DB
    const collection = db.collection('MemoriesCollection'); // O la colección que manejes

    // 6. Encontrar el documento global (estructura principal) identificado por _id "globalMemories"
    const filter = { _id: 'globalMemories' };
    const globalDoc = await collection.findOne(filter);

    let userData = {};
    let action = '';

    // 7. Se verifica si ya existe la llave (basada en el email) y además dentro de ella la subllave userInformation
    if (globalDoc && globalDoc[userKey] && globalDoc[userKey].userInformation) {
      // Usuario existente: se actualiza solo la fecha de último logeo
      userData = {
        ...globalDoc[userKey].userInformation,
        lastLogin: now.toISOString(),
      };
      action = 'update';
    } else {
      // Usuario nuevo: se crea la propiedad userInformation con datos básicos y de plan
      // Se asignan valores predeterminados; alternativamente, puedes recibirlos desde req.body
      userData = {
        id: userIdHash,
        authType: authType || null,
        createdAt: now.toISOString(),
        lastLogin: now.toISOString(),
        plan: {
          planName: req.body.planName || "free",
          availableGB: req.body.availableGB || 3,
          paymentType: req.body.paymentType || "monthly",
          amountPaid: req.body.amountPaid || 0,
        },
      };
      action = 'create';
    }

    // 8. Actualizar o insertar el objeto del usuario, anidando la información dentro de "userInformation"
    const updateResult = await collection.updateOne(
      filter,
      { $set: { [`${userKey}.userInformation`]: userData } },
      { upsert: true }
    );

    if (!updateResult.acknowledged) {
      throw new Error('Error al actualizar la base de datos.');
    }

    console.log(
      `Usuario ${action === 'update' ? 'actualizado' : 'creado'} con key ${userKey}:`,
      userData
    );
    return res.status(action === 'update' ? 200 : 201).json({
      success: true,
      message:
        action === 'update'
          ? 'User successfully updated.'
          : 'User created successfully.',
      user: userData,
    });
  } catch (error) {
    console.error('Error al manejar la autenticación del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      details: error.message,
    });
  }
}





































