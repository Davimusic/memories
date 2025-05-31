//se usa

import clientPromise from './connectToDatabase';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully for auth');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK for auth:', error);
    throw error;
  }
}

export default async function auth(req, res) {
  // 1. Validate HTTP method (POST only)
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { email, authType, uid } = req.body;
  const token = req.headers.authorization?.split('Bearer ')[1];

  console.log('Auth request received for:', { email, authType, uid });

  // 2. Validate token and user
  try {
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.uid !== uid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token does not match user ID',
      });
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Token verification failed',
      details: error.message,
    });
  }

  // 3. Validate required fields
  if (!email || !uid) {
    return res.status(400).json({
      success: false,
      message: 'Email and user ID are required',
    });
  }

  // 4. Skip DB operations for email validation only
  if (authType === 'userEmailValidationOnly') {
    console.log('Email validation only - skipping DB operations');
    return res.status(200).json({
      success: true,
      message: 'User email and token validated successfully',
      user: { id: uid, email },
    });
  }

  const now = new Date();

  try {
    // 5. Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // 6. Find the user document using UID as _id
    const userDoc = await collection.findOne({ _id: uid });

    let userData = {};
    let action = '';

    // 7. Prepare user data
    if (userDoc) {
      // Update existing user
      userData = {
        ...userDoc.userInformation,
        email: email, // Update email in case it changed
        lastLogin: now.toISOString(),
      };
      action = 'update';
    } else {
      // Create new user
      userData = {
        email: email,
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

    // 8. Update or insert user data using UID as _id
    const updateResult = await collection.updateOne(
      { _id: uid },
      { 
        $set: { 
          userInformation: userData 
        } 
      },
      { upsert: true }
    );

    if (!updateResult.acknowledged) {
      throw new Error('Database operation failed');
    }

    console.log(
      `User ${action}d with ID: ${uid}`,
      JSON.stringify(userData, null, 2)
    );

    return res.status(action === 'update' ? 200 : 201).json({
      success: true,
      message: `User ${action}d successfully`,
      user: {
        id: uid, // Return the Firebase UID as ID
        ...userData
      },
    });

  } catch (error) {
    console.error('Error in auth endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message,
    });
  }
}





























/*import clientPromise from './connectToDatabase';
import admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully para auth');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK para auth:', error);
    throw error;
  }
}

export default async function auth(req, res) {
  // 1. Validate HTTP method (POST only)
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { email, authType, uid } = req.body;
  const token = req.headers.authorization?.split('Bearer ')[1];

  console.log(email);
  console.log(authType);
  console.log(uid);

  // 2. Validate token and user
  try {
    if (token) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      if (decodedToken.uid !== uid) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid token',
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Token verification failed',
    });
  }

  // 3. Validate email
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  // 4. Generate unique ID using SHA-256
  const userIdHash = crypto.createHash('sha256').update(email).digest('hex');

  const now = new Date();

  try {
    // 5. Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // 6. Find the user document
    const filter = { _id: uid };
    const userDoc = await collection.findOne(filter);

    let userData = {};
    let action = '';

    // 7. Check if user exists
    if (userDoc) {
      userData = {
        ...userDoc.userInformation,
        lastLogin: now.toISOString(),
      };
      action = 'update';
    } else {
      userData = {
        id: uid,
        email: email,
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

    // 8. Update or insert user data
    const updateResult = await collection.updateOne(
      filter,
      { $set: { userInformation: userData } },
      { upsert: true }
    );

    if (!updateResult.acknowledged) {
      throw new Error('Failed to update database');
    }

    console.log(
      `User ${action === 'update' ? 'updated' : 'created'} with id ${userIdHash}:`,
      userData
    );
    return res.status(action === 'update' ? 200 : 201).json({
      success: true,
      message: action === 'update' ? 'User successfully updated' : 'User created successfully',
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





























































/*const admin = require('../../../lib/firebaseAdmin');
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
}*/











