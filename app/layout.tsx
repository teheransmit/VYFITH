import type {Metadata, Viewport} from 'next';
import FetchInterceptor from '@/components/FetchInterceptor';
import {SpeedInsights} from '@vercel/speed-insights/next';
import './globals.css'; // Global styles

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#047857' },
    { media: '(prefers-color-scheme: dark)', color: '#030712' },
  ],
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
        <SpeedInsights />
      </body>
    </html>
  );
}
