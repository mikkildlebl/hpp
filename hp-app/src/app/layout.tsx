import type { Metadata } from 'next';

import { AuthProvider } from '@/lib/auth';
import { ExtraTimeProvider } from '@/lib/extraTime';
import { SessionProvider } from '@/lib/SessionContext';
import { ThemeProvider } from '@/lib/colorMode';

import './globals.css';

const SITE_URL = 'https://hppro.se';
const DESCRIPTION =
  'Öva högskoleprovet med riktiga provfrågor, en i taget, med direkt facit. Simulera provet med tidtagning och följ din HP-poäng över tid.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'HP Pro — Öva högskoleprovet',
    template: '%s | HP Pro',
  },
  description: DESCRIPTION,
  keywords: ['högskoleprovet', 'HP-prov', 'högskoleprov övning', 'provsimulering', 'ORD', 'LÄS', 'XYZ', 'KVA', 'NOG', 'DTK'],
  openGraph: {
    title: 'HP Pro — Öva högskoleprovet',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'HP Pro',
    locale: 'sv_SE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HP Pro — Öva högskoleprovet',
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" className="h-full">
      <body className="flex min-h-full flex-col antialiased">
        <AuthProvider>
          <ThemeProvider>
            <ExtraTimeProvider>
              <SessionProvider>{children}</SessionProvider>
            </ExtraTimeProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
