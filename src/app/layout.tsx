import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from '@/contexts/AuthContext';
import ThemeRegistry from '@/lib/ThemeRegistry';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Bello System - Gestão para Salões de Beleza",
  description: "Sistema completo de gestão para salões de beleza, com controle de agendamentos, comandas, caixa e muito mais.",
  keywords: ["salão de beleza", "gestão", "agendamentos", "caixa", "comandas"],
  authors: [{ name: "Diego Duarte" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
