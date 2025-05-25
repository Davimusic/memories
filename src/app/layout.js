'use client';

import React from 'react';
import Head from 'next/head';
import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <Head>
        {/* Preconexión para optimizar la carga de fuentes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        {/* Integración de la fuente "Montserrat" */}
        <link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet" />
        <title>Mi Aplicación con Fuente Global</title>
      </Head>
      <body>
        <main>
          {children}
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}




