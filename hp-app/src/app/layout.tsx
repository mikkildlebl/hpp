import type { Metadata } from 'next';

import { SessionProvider } from '@/lib/SessionContext';

import './globals.css';

export const metadata: Metadata = {
  title: 'HP Pro',
  description: 'Öva högskoleprovet, fråga för fråga.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" className="h-full">
      <body className="flex min-h-full flex-col antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
