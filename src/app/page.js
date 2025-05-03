"use client"; //no sé por qué lo necesita

import RootLayout from "./layout";


// app/page.js
export default function HomePage() {
  return (
    <main style={{backgroundColor: 'green'}}>
      <h1 className="mainFont">fuente principal</h1>
      <p>
        Si ves este estilo peculiar y distorsionado, es la fuente "Nosifer" en acción.
      </p>
    </main>
  );
}


