"use client";
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

export default ErrorComponent;
