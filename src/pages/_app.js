'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { ToastContainer } from 'react-toastify';
import Head from 'next/head';
import InternetStatus from '@/components/complex/internetStatus';
import { useRouter } from 'next/router';
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

export const useAuth = () => useContext(AuthContext);

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'G-2G9WD5EEKK', {
          page_path: url,
        });
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <AuthProvider>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="apple-touch-icon" href="/logo.png" />

        {/* Google Analytics Script */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2G9WD5EEKK" />
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2G9WD5EEKK');
          `
        }} />
      </Head>

      <InternetStatus/>
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



































/*'use client';


import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { ToastContainer } from 'react-toastify';
import Head from 'next/head';
import InternetStatus from '@/components/complex/internetStatus';
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
        <link rel="apple-touch-icon" href="/logo.png" />
      </Head>
      <InternetStatus/>
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
}*/









