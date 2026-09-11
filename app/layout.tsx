import type {Metadata} from 'next';
import FetchInterceptor from '@/components/FetchInterceptor';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'MegaProyecto | Unified Health & Life Data',
  description: 'Aplicación híbrida para sincronizar datos de salud, entrenamientos, agenda y finanzas.',
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
