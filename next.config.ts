import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações do Turbopack (atualizado para Next.js 15)
  turbopack: {
    // Configurações do Turbopack para dev
  },
  
  // Compressão para produção
  compress: true,
  
  // Configuração de output para deploy (removido - deprecated)
  // output: 'standalone',
  
  // Configuração de imagens
  images: {
    domains: ['cdn.supabase.co'], // Para imagens do Supabase
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers de segurança
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
  
  // swcMinify é padrão no Next.js 15 (removido)
  // swcMinify: true,
  
  // Configuração de redirects
  redirects: async () => [
    {
      source: '/',
      destination: '/dashboard',
      permanent: false,
    },
  ],
};

export default nextConfig;
