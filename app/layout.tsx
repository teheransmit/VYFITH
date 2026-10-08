import type {Metadata, Viewport} from 'next';
import FetchInterceptor from '@/components/FetchInterceptor';
import './globals.css'; // Global styles

export const viewport: Viewport = {
  themeColor: '#064e3b',
};

export const metadata: Metadata = {
  title: 'MegaProyecto | Unified Health & Life Data',
  description: 'Aplicación híbrida para sincronizar datos de salud, entrenamientos, agenda y finanzas.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VYFITH',
  },
  openGraph: {
    title: 'MegaProyecto | Unified Health & Life Data',
    description: 'Aplicación híbrida para sincronizar datos de salud, entrenamientos, agenda y finanzas.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MegaProyecto | Unified Health & Life Data',
    description: 'Aplicación híbrida para sincronizar datos de salud, entrenamientos, agenda y finanzas.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning />
      <body suppressHydrationWarning>
        <FetchInterceptor />
        {children}
      </body>
    </html>
  );
}
