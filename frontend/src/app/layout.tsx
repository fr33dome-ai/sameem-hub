import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sameem Hub — Saudi Furniture Marketplace OS',
  description: 'Operating system for the Saudi furniture & interior solutions marketplace. v1.7.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
