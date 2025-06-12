import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Verificar carga de variables
const firebaseConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

// Inicialización condicional
const firebaseAdmin = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Verificar conexión inmediatamente
(async () => {
  try {
    await getAuth(firebaseAdmin).listUsers(1);
    console.log('🔥 Firebase Admin conectado con éxito');
  } catch (error) {
    console.error('❌ Error de conexión Firebase Admin:', error);
  }
})();

export { firebaseAdmin, getAuth };




































/*/ Archivo: lib/firebase-admin.js (o la ruta que estés usando)
import admin from 'firebase-admin';



// Verificar variables de entorno
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  throw new Error(
    'Faltan variables de entorno de Firebase. Verifica tu archivo .env'
  );
}

// Formatear correctamente la clave privada
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

// Inicializar solo si no existe una instancia previa
const initFirebaseAdmin = () => {
  console.log('gdgdgdgdg');
  
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: firebasePrivateKey,
        }),
      });
      console.log('[Firebase Admin] Inicializado correctamente');
    } catch (error) {
      console.error('[Firebase Admin] Error de inicialización:', error);
      throw error;
    }
  }
  return admin;
};

const firebaseAdmin = initFirebaseAdmin();

export default firebaseAdmin;*/





























/*import admin from 'firebase-admin';



if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('Missing Firebase environment variables');
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    throw error;
  }
}

export default admin;*/





