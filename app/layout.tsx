import type {Metadata, Viewport} from 'next';
import FetchInterceptor from '@/components/FetchInterceptor';
import './globals.css'; // Global styles

export const viewport: Viewport = {
  themeColor: '#064e3b',
};

export const metadata: Metadata = {
  title: 'VYFITH • Centro de Mando Personal | Santiago Smit Teherán Mogollón',
  description: 'Plataforma integral de salud biométrica HL7 FHIR, entrenamientos Hevy, agenda UPB Montería y finanzas personales.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VYFITH',
  },
  openGraph: {
    title: 'VYFITH • Centro de Mando Personal | Santiago Smit Teherán Mogollón',
    description: 'Plataforma integral de salud biométrica HL7 FHIR, entrenamientos Hevy, agenda UPB Montería y finanzas personales.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VYFITH • Centro de Mando Personal | Santiago Smit Teherán Mogollón',
    description: 'Plataforma integral de salud biométrica HL7 FHIR, entrenamientos Hevy, agenda UPB Montería y finanzas personales.',
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
