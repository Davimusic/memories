// se usa
import clientPromise from './connectToDatabase';
import admin from 'firebase-admin';
import generateUserId from '@/functions/memories/generateUserId';

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
  console.log('token..................' + token);
  
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

  // 4. Validate authType
  if (!['login', 'signIn', 'userEmailValidationOnly'].includes(authType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid authType. Must be "login", "signIn", or "userEmailValidationOnly"',
    });
  }

  // 5. Skip DB operations for email validation only
  if (authType === 'userEmailValidationOnly') {
    console.log('Email validation only - skipping DB operations');
    return res.status(200).json({
      success: true,
      message: 'User email and token validated successfully',
      user: { id: generateUserId(email), email },
    });
  }

  const now = new Date();
  const userId = generateUserId(email); // Generate ID based on email only

  try {
    // 6. Connect to the database
    const client = await clientPromise;
    const db = client.db('goodMemories');
    const collection = db.collection('MemoriesCollection');

    // 7. Find the user document using generated userId as _id
    const userDoc = await collection.findOne({ _id: userId });

    let userData = {};
    let action = '';

    if (userDoc) {
      // Update existing user
      userData = {
        ...userDoc.userInformation,
        email: email,
        authType: authType || userDoc.userInformation.authType,
        lastLogin: now.toISOString(),
        firebaseUids: Array.isArray(userDoc.userInformation.firebaseUids)
          ? [...new Set([...userDoc.userInformation.firebaseUids, uid])]
          : [uid], // Add new UID if not already present
      };
      action = 'update';
    } else {
      // Check authType before creating a new user
      if (authType !== 'signIn') {
        console.log(`User with ID ${userId} not found for authType "login"`);
        // Revoke the token to close the session
        try {
          await admin.auth().revokeRefreshTokens(uid);
          console.log(`Token revoked for UID: ${uid}`);
        } catch (revokeError) {
          console.error('Error revoking token:', revokeError);
          // Optionally, you can decide whether to fail the request or continue
        }
        return res.status(400).json({
          success: false,
          message: 'User does not exist and cannot be created with authType "login". Session closed.',
        });
      }
      // Create new user
      userData = {
        email: email,
        authType: authType || null,
        createdAt: now.toISOString(),
        lastLogin: now.toISOString(),
        firebaseUids: [uid], // Initialize with the current UID
        plan: {
          planName: req.body.planName || 'free',
          availableGB: req.body.availableGB || 3,
          paymentType: req.body.paymentType || 'monthly',
          amountPaid: req.body.amountPaid || 0,
        },
      };
      action = 'create';
    }

    // 8. Update or insert user data using generated userId as _id
    const updateResult = await collection.updateOne(
      { _id: userId },
      { 
        $set: { 
          userInformation: userData 
        } 
      },
      { upsert: authType === 'signIn' } // Only upsert for signIn
    );

    if (!updateResult.acknowledged) {
      throw new Error('Database operation failed');
    }

    console.log(
      `User ${action}d with ID: ${userId}`,
      JSON.stringify(userData, null, 2)
    );

    return res.status(action === 'update' ? 200 : 201).json({
      success: true,
      message: `User ${action}d successfully`,
      user: {
        id: userId,
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











