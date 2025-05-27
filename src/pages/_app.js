import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { ToastContainer } from 'react-toastify';
import Head from 'next/head';
import 'react-toastify/dist/ReactToastify.css';

// Initialize Firebase client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        console.log('AuthContext UID:', firebaseUser.uid, 'Email:', firebaseUser.email);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth context
export const useAuth = () => useContext(AuthContext);

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="apple-touch-icon" href="/photosLoging/f1.webp" />
      </Head>
      <PayPalScriptProvider
        options={{
          'client-id': 'AbyHsDXyJLxKBgCHv9BAeVbt-JLALZCJ4q_Z1m-dKA58ime8dXCgHL0ycehEvOH1ceJvjCzUOmzUAADN',
          components: 'buttons',
          intent: 'subscription',
          vault: true,
          currency: 'USD',
        }}
      >
        <Component {...pageProps} />
        <ToastContainer />
      </PayPalScriptProvider>
    </AuthProvider>
  );
}











/*import { PayPalScriptProvider } from "@paypal/react-paypal-js";
//import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    //<SessionProvider session={session}>
      <PayPalScriptProvider 
        options={{ 
          "client-id": "AbyHsDXyJLxKBgCHv9BAeVbt-JLALZCJ4q_Z1m-dKA58ime8dXCgHL0ycehEvOH1ceJvjCzUOmzUAADN",
          components: "buttons",
          intent: "subscription",
          vault: true,
          currency: "USD"
        }}
      >
        <Component {...pageProps} />
      </PayPalScriptProvider>
    //</SessionProvider>
  );
}*/







/*import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return<Component/>
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}*/
