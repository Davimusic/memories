"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Usa 'next/navigation' en vez de 'next/router'

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/memories");
  }, [router]);

  return (
    <main style={{ backgroundColor: "green" }}>
      <h1 className="mainFont">Fuente Principal</h1>
      <p>Si ves este estilo peculiar y distorsionado, es la fuente "Nosifer" en acción.</p>
    </main>
  );
}

