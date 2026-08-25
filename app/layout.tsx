import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";

export const metadata: Metadata = {
  title: "FHW · Cada Taza Cuenta",
  description: "Dashboard ejecutivo para avanzar el uso de vajilla reutilizable en bebidas servidas dentro de tienda.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/assets/logo-cada-taza-cuenta.png",
    shortcut: "/assets/logo-cada-taza-cuenta.png",
    apple: "/assets/logo-cada-taza-cuenta.png",
  },
  openGraph: {
    title: "FHW · Cada Taza Cuenta",
    description: "Más experiencias. Menos desechables.",
    images: ["/assets/fondo-dashboard-fhw.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className="antialiased">{children}</body>
    </html>
  );
}
