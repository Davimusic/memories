"use client";
import Head from 'next/head';
import 'react-toastify/dist/ReactToastify.css';
import MemoryLogo from './memoryLogo';
import '../../estilos/general/createNewMemory.css';
import '../../app/globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ErrorComponent = ({ error }) => {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [showPermanentError, setShowPermanentError] = useState(false);

  console.log('ErrorComponent recibido:', error);
  if (!error) return null;

  const errorMessage = error.message || error.toString();

  useEffect(() => {
    if (retryCount >= 2) {
      setShowPermanentError(true);
      return;
    }

    const timer = setTimeout(() => {
      setRetryCount(prev => prev + 1);
      router.refresh(); // Refresh the current route
    }, 1000);

    return () => clearTimeout(timer);
  }, [retryCount, router]);

  // If we've reached max retries, show permanent error
  if (showPermanentError) {
    return (
      <div 
        className="fullscreen-floating backgroundColor1"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <Head>
          <title>Error | Memory Permissions</title>
          <meta name="description" content={`Error: ${errorMessage}`} />
          <meta name="robots" content="noindex" />
        </Head>
        <div className="loading">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <MemoryLogo />
          </div>
          <p className="color1 title-xl">{errorMessage}</p>
          <p className="color1 title-m" style={{ marginTop: '1rem' }}>
            The operation failed after multiple attempts.
          </p>
        </div>
      </div>
    );
  }

  // Show error with retry countdown
  return (
    <div 
      className="fullscreen-floating backgroundColor1"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}
    >
      <Head>
        <title>Error | Memory Permissions</title>
        <meta name="description" content={`Error: ${errorMessage}`} />
        <meta name="robots" content="noindex" />
      </Head>
      <div className="loading">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <MemoryLogo />
        </div>
        <p className="color1 title-xl">{errorMessage}</p>
        <p className="color1 title-m" style={{ marginTop: '1rem' }}>
          Retrying in {3 - (retryCount * 3)} seconds... (Attempt {retryCount + 1}/2)
        </p>
      </div>
    </div>
  );
};

export default ErrorComponent;































/*"use client";
import Head from 'next/head';
import 'react-toastify/dist/ReactToastify.css';
import MemoryLogo from './memoryLogo';
import '../../estilos/general/createNewMemory.css';
import '../../app/globals.css';

const ErrorComponent = ({ error }) => {
  console.log('ErrorComponent recibido:', error);
  if (!error) return null;

  const errorMessage = error.message || error.toString();

  return (
    <div 
      className="fullscreen-floating backgroundColor1"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}
    >
      <Head>
        <title>Error | Memory Permissions</title>
        <meta name="description" content={`Error: ${errorMessage}`} />
        <meta name="robots" content="noindex" />
      </Head>
      <div className="loading">
        <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
          <MemoryLogo />
        </div>
        <p className="color1 title-xl">{errorMessage}</p>
      </div>
    </div>
  );
};

export default ErrorComponent;*/
