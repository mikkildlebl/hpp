import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Logga in',
  description: 'Logga in på HP Pro för att spara dina provresultat och din progress mellan sessioner.',
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
