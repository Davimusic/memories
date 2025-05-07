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
      // Usuario nuevo: se crea la propiedad userInformation con los datos básicos
      userData = {
        id: userIdHash,
        authType: authType || null,
        createdAt: now.toISOString(),
        lastLogin: now.toISOString(),
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
          ? 'Usuario actualizado exitosamente.'
          : 'Usuario creado exitosamente.',
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
















/*import { clientPromise } from './connectToDatabase';
import admin from 'firebase-admin';

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  // Cargar credenciales desde variables de entorno
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplazar saltos de línea
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handleUserAfterAuth(req, res) {
  const db = await clientPromise();
  const collection = db.collection('users'); // Colección principal
  const { uid, email, authType } = req.body; // Recibir datos del frontend

  try {
    console.log('Handling user after auth:', uid, email, authType); // Depuración

    // Buscar el documento principal
    const mainDoc = await collection.findOne({});
    if (!mainDoc) {
      console.error('Main document not found in the database.'); // Depuración
      return res.status(404).json({ 
        success: false, 
        message: 'Main document not found in the database.' 
      });
    }

    // Verificar si el usuario ya existe en el objeto "users"
    const userExists = mainDoc.users && mainDoc.users[uid];

    if (userExists) {
      // Si el usuario ya existe, actualizar la fecha de modificación
      const updatedUser = {
        ...mainDoc.users[uid], // Mantener los datos existentes del usuario
        updatedAt: new Date(), // Actualizar la fecha de modificación
      };

      // Actualizar el documento principal para actualizar el usuario en el objeto "users"
      const updateResult = await collection.updateOne(
        { _id: mainDoc._id }, // Filtro para encontrar el documento principal
        { $set: { [`users.${uid}`]: updatedUser } } // Actualizar el usuario en el objeto "users"
      );

      console.log('Update result:', updateResult); // Depuración

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to update the user.');
      }

      console.log('User updated in the database:', updatedUser); // Depuración
      return res.status(200).json({ 
        success: true, 
        message: 'User updated successfully.', 
        user: updatedUser,
        myLikes: updatedUser.myLikes || [], // Retornar el array myLikes
      });
    } else {
      // Si el usuario no existe, crear un nuevo objeto y agregarlo al objeto "users"
      const newUser = {
        uid,
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Actualizar el documento principal para agregar el nuevo usuario al objeto "users"
      const updateResult = await collection.updateOne(
        { _id: mainDoc._id }, // Filtro para encontrar el documento principal
        { $set: { [`users.${uid}`]: newUser } } // Agregar el nuevo usuario al objeto "users"
      );

      console.log('Update result:', updateResult); // Depuración

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to create the user.');
      }

      console.log('New user created in the database:', newUser); // Depuración
      return res.status(201).json({ 
        success: true, 
        message: 'User created successfully.', 
        user: newUser,
        myLikes: newUser.myLikes || [], // Retornar el array myLikes (vacío en este caso)
      });
    }
  } catch (error) {
    console.error('Error handling user after auth:', error); // Depuración
    return res.status(500).json({ 
      success: false, 
      error: 'Error handling user after auth',
      details: error.message // Detalles del error
    });
  }
}*/