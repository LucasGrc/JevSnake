import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jev Snake | TypeSafe System One Autonomous Agent",
  description:
    "Snake autónomo impulsado por el modelo System One 'Jev' de TypeSafe con red de seguridad algorítmica y análisis de probabilidades en tiempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
